import redis from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = redis.createClient({
  password: '7EVS6M5sR0jPlL4TNEevsznmbdBuqSec',
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

redisClient.on('connect', () => console.log('Connected to Redis!'));
redisClient.on('error', (err) => console.log('Redis Client Error', err));
export default redisClient;
