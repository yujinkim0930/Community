import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import ProfileRouter from './routes/profile.router.js';
import PostsRouter from './routes/posts.router.js';
import CommentsRouter from './routes/comments.router.js';
import s3Router from './routes/s3.router.js';

dotenv.config();

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api', [UsersRouter, s3Router, ProfileRouter, PostsRouter, CommentsRouter]);
//참고: https://blog.pumpkin-raccoon.com/116

app.get('/', (req, res) => {
  return res.json({ message: '안녕하세요.😄' });
});

app.listen(PORT, () => {
  console.log(PORT, 'http://localhost:3018 포트로 서버가 열렸어요!');
});
