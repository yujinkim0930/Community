import { createClient } from 'redis';

import dotenv from 'dotenv';
dotenv.config();

const redisClient = redis.createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }

});

client.on('connect', () => console.log('Connected to Redis!'));
client.on('error', (err) => console.log('Redis Client Error', err));
client.connect();

export default client;
