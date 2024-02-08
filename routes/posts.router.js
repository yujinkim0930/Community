import express from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
router.post('/posts', authMiddleware, async (req, res) => {
  const { title, category, content } = req.body;
  const user = res.locals.user;
  const post = await prisma.posts.create({
    data: {
      user_Id: user.id,
      title,
      category,
      content,
    },
  });
  return res.status(201).json({ message: '게시글이 작성되었습니다.' });
});
export default router;
