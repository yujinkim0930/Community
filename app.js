import express from 'express';
import UsersRouter from './routes/users.router.js';
import PostsRouter from './routes/posts.router.js';

const app = express();
const PORT = 3018;

app.use([UsersRouter, [PostsRouter]]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
