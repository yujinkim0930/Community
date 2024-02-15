import imageUploader from '../middlewares/s3.Middleware.js';
import express from 'express';

const router = express.Router();

router.post('/image', imageUploader.single('image'), (req, res) => {
  console.log('사진이 업로드되었습니다.');
  res.send('사진이 업로드되었습니다.');
});

export default router;
