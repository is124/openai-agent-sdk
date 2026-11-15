import 'dotenv/config';
import {Agent, run} from '@openai/agents';

const helloAgent = new Agent({
    name: 'Hello Agent',
    instructions: "You are an agent that always say Hello Tilak !",
    model: 'gpt-5-nano'
})

const res = await run(helloAgent, "Which model are you using version and name ?");
console.log(res.finalOutput);