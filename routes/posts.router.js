import express from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// 게시글 작성 API
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

// 게시글 수정 API
router.patch('/posts/:postId', authMiddleware, async (req, res) => {
  const user = res.locals.user;
  const postId = req.params.postId;
  const updateData = req.body;
  const post = await prisma.posts.findFirst({
    where: { id: +postId },
  });
  if (!post) {
    return res.status(404).json({ message: '존재하지 않는 게시글입니다.' });
  }
  await prisma.$transaction(
    async (tx) => {
      await tx.posts.update({
        data: {
          ...updateData,
        },
        where: { id: +postId },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    }
  );
  return res
    .status(201)
    .json({ message: '게시글이 성공적으로 수정되었습니다.' });
});
export default router;
