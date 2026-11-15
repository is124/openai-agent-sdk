import 'dotenv/config';
import {Agent, run, tool} from "@openai/agents";
import {z} from 'zod';
import axios from "axios";

const getWeatherTool = tool({
    name: 'get_weather',
    description: 'Returns the weather information for the given city',
    parameters: z.object({
        city: z.string().trim().min(1),
        state: z.string().trim().min(1),
    }),
    execute: async function({city, state}) {
        const location = `${city}, ${state}`;
        const url = `https://wttr.in/${encodeURIComponent(location)}`;
        const {data} = await axios.get(url, {
            params: {format: 'j1'},
            timeout: 10000,
        });

        if (!data?.current_condition?.length || !data?.weather?.length) {
            throw new Error(`Weather information is unavailable for ${location}.`);
        }

        return JSON.stringify({
            location,
            current: data.current_condition[0],
            today: data.weather[0],
        });
    }
});


const weatherAgent = new Agent({
    name: "Weather Agent",
    instructions: "Use get_weather to get the current weather and today's forecast for the requested city and state. Give a concise weather report with clear temperature units, then end with a witty one-liner. If weather data cannot be retrieved, explain that without inventing a forecast.",
    tools: [getWeatherTool]
});


let city = "San Jose";
let state = "California";

let query = `What is the weather today in ${city}, ${state}?`;

const res = await run(weatherAgent, query);
console.log(res.finalOutput);
