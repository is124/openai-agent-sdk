import 'dotenv/config';
import {Agent, run, tool} from "@openai/agents";
import {z} from 'zod'
import fs from 'node:fs/promises'


// Refund Agent
const processRefund = tool({
    name: 'process_refund', description: 'Records a customer refund request locally', parameters: z.object({
        customerId: z.string().describe('id of the customer'), reason: z.string().describe('reason for refund')
    }),

    execute: async function ({customerId, reason}) {
        await fs.appendFile('./refunds.txt', `Refund for customer with Id ${customerId} for ${reason}\n`)
        return {refundRequestRecorded: true}
    }
})
const refundAgent = new Agent({
    name: 'Refund Agent', instructions: 'Record customer refund requests with process_refund. When it succeeds, tell the sales agent that the request was recorded and that payment processing is still pending.', tools: [processRefund]
})



// Sales Agent
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
    instructions: 'You are an expert sales agent for an AI Inference company. Talk to the user/enterprise and help them with their experience ,get feedback or help them onboard',
    tools: [fetchAvailablePlans, refundAgent.asTool({
        toolName: 'refund_Expert',
        toolDescription: 'Handles refund queries'
    })]
})

async function runAgent(query = '') {
    const result = await run(salesAgent, query);
    console.log(result.finalOutput)
}


// runAgent("Hey There !")
// runAgent("Hey There !, I want to know available plans good for me");
runAgent("Please help me with the refund for the Silver tier, my customer Id is 11, since I'm not using the product that much")
