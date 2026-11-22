import 'dotenv/config';
import {Agent, run, tool} from "@openai/agents";
import {z} from 'zod'
import fs from 'node:fs/promises'
import { RECOMMENDED_PROMPT_PREFIX } from '@openai/agents-core/extensions';

// Refund Agent
const processRefund = tool({
    name: 'process_refund', description: 'Records a customer refund request locally', parameters: z.object({
        customerId: z.string().describe('id of the customer'), reason: z.string().describe('reason for refund')
    }),

    execute: async function ({customerId, reason}) {
        await fs.appendFile('./handoff_agent_refunds.txt', `Refund for customer with Id ${customerId} for ${reason}\n`)
        return {refundRequestRecorded: true}
    }
})
const refundAgent = new Agent({
    name: 'Refund Agent',
    handoffDescription: 'Handles explicit refund requests, including requests that cite slow inference or mention a plan.',
    instructions: 'Record customer refund requests with process_refund. When it succeeds, confirm that the request was recorded locally. Do not promise an eligibility review, payment, or follow-up.',
    tools: [processRefund]
})


// Sales agent
const fetchAvailablePlans = tool({
    name: 'fetch_available_plan',
    description: 'Fetches inference plan',
    parameters: z.object({}),
    execute: async function () {
        return [{tier: 'silver', price_usd: 80}, {tier: 'gold', price_usd: 100}, {tier: 'platinum', price_usd: 150}]
    }
})
const salesAgent = new Agent({
    name: 'Sales agent',
    handoffDescription: 'Handles plan questions, onboarding, and performance complaints when the customer has not asked for a refund.',
    instructions: 'You are an expert sales agent for an AI Inference company. Talk to the user/enterprise and help them with their experience ,get feedback or help them onboard',
    tools: [fetchAvailablePlans, refundAgent.asTool({
        toolName: 'refund_Expert',
        toolDescription: 'Handles refund queries'
    })]
})


// Reception Agent

const receptionAgent = new Agent({
    name: 'Reception Agent',
    instructions: `${RECOMMENDED_PROMPT_PREFIX} Choose one handoff. Send explicit refund requests directly to the Refund Agent, even when the customer also mentions a plan or a performance complaint. Send plan questions, onboarding requests, and performance complaints without a refund request to the Sales agent. Ask a clarifying question if the requested action is unclear.`,
    modelSettings: {parallelToolCalls: false},
    handoffs: [salesAgent, refundAgent]
})


// let query = 'What plan is best for me ?'
let query = 'I’m Gold-tier customer 11. Inference is too slow, and I’d like a refund'
const res = await run(receptionAgent, query)
console.log(res.finalOutput);
console.log("==========");
console.log(res.history);
