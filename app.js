import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import ProfileRouter from './routes/profile.router.js';
import PostsRouter from './routes/posts.router.js';

// import authMiddleware from './middlewares/auth.middleware.js';
dotenv.config();

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api', [UsersRouter, ProfileRouter, PostsRouter]);

app.get('/', (req, res) => {
  return res.json({ message: '안녕하세요.😄' });
});

app.listen(PORT, () => {
  console.log(PORT, 'http://localhost:3018 포트로 서버가 열렸어요!');
});
