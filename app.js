import express from 'express';
import UsersRouter from './routes/users.router.js';
import PostsRouter from './routes/posts.router.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = 3018;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [UsersRouter, PostsRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
