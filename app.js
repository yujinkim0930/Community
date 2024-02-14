import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import ProfileRouter from './routes/profile.router.js';
import PostsRouter from './routes/posts.router.js';
import CommentsRouter from './routes/comments.router.js';
import s3Router from './routes/s3.router.js';
import { S3Client } from '@aws-sdk/client-s3';
import aws from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3018;

// /** AWS S3 */
// const s3 = new S3Client({
//   credentials: {
//     accessKeyId: process.env.S3_ACCESS_KEY_ID,
//     secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
//   },
//   region: 'ap-northeast-2',
// });

// const upload = multer({
//   storage: multerS3({
//     s3,
//     bucket: 'boogiebogie', // 생성한 버킷명
//     key(req, file, cb) {
//       cb(null, `original/${Date.now()}_${file.originalname}`);
//     },
//   }),
//   limits: { fileSize: 5 * 1024 * 1024 },
// });

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api', [UsersRouter, ProfileRouter, PostsRouter, CommentsRouter]);
app.use('/picture', s3Router);
//참고: https://blog.pumpkin-raccoon.com/116

app.get('/', (req, res) => {
  return res.json({ message: '안녕하세요.😄' });
});

// /**AWS S3 */
// app.post('/upload', upload.single('img'), (req, res) => {
//   console.log('파일 업로드 완료'); // 02/10 AWS S3 original 폴더에 업로드는 되는데,
//   console.log(req.file); // undefined
//   console.log('파일경로: ', req.file.location); // typeError
//   res.send(req.file.location);
// });


app.listen(PORT, () => {
  console.log(PORT, 'http://localhost:3018 포트로 서버가 열렸어요!');
});
