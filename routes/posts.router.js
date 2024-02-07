import express from 'express';
import { prisma } from '../model/index.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
router.post('/posts', async (req, res) => {
  const { title, category, content } = req.body;
  const { id } = req.user;
  const post = await prisma.posts.create({
    data: {
      user_Id: +id,
      title,
      category,
      content,
    },
  });
  return res.status(201).json({ message: '게시글이 작성되었습니다.' });
});
export default router;
