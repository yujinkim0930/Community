import express, { json } from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router();

// 게시글 작성 API
router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { title, category, content } = req.body;
    const user = res.locals.user;
    if (!title)
      return res
        .status(400)
        .json({ success: false, message: '게시글 제목은 필수 값입니다.' });
    if (!category)
      return res
        .status(400)
        .json({ success: false, message: '카테고리는 필수 값입니다.' });
    if (!content)
      return res
        .status(400)
        .json({ success: false, message: '게시글 내용은 필수값입니다.' });
    if (!['INFO', 'CLUB', 'LOST'].includes(category))
      return res
        .status(400)
        .json({ success: false, message: '카테고리가 올바르지 않습니다.' });
    await prisma.posts.create({
      data: {
        user_Id: user.id,
        title,
        category,
        content,
      },
    });
    return res.status(201).json({ message: '게시글이 작성되었습니다.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// 게시글 수정 API
router.patch('/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await prisma.posts.findUnique({
      where: { id: +postId },
    });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: '존재하지 않는 게시글입니다.' });
    }
    const user = res.locals.user;
    if (post.user_Id !== user.id) {
      return res
        .status(401)
        .json({ success: false, message: '게시글을 수정할 권한이 없습니다.' });
    }
    const updateData = req.body;
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: '수정할 내용을 입력해주세요.' });
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
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

// 게시글 삭제 API
router.delete('/posts/:postId', authMiddleware, async (req, res) => {
  try {
    const user = res.locals.user;
    const postId = req.params.postId;
    const post = await prisma.posts.findUnique({
      where: { id: +postId },
    });
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: '존재하지 않는 게시글입니다.' });
    }
    if (post.user_Id !== user.id) {
      return res
        .status(401)
        .json({ success: false, message: '게시글을 수정할 권한이 없습니다.' });
    }
    await prisma.posts.delete({ where: { id: +postId } });

    return res
      .status(200)
      .json({ message: '게시글이 성공적으로 삭제되었습니다.' });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});
export default router;
