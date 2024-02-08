import express, { json } from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
// 게시글 작성
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
// 게시글 조회
router.get('/posts', async (req, res) => {
  const posts = await prisma.posts.findMany({
    select: {
      id: true,
      user: {
        select: {
          userInfos: {
            select: {
              nickname: true,
            },
          },
        },
      },
      title: true,
      content: true,
      category: true,
      likes: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  // map으로 새로운 배열 생성
  const formattedPosts = posts.map((post) => ({
    id: post.id,
    nickname: post.user.userInfos.nickname,
    title: post.title,
    content: post.content,
    category: post.category,
    likes: post.likes,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }));
  return res.status(200).json({ data: formattedPosts });
});
// 게시글 상세 조회
router.get('/posts/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  console.log('🚀 ~ router.get ~ req.params:', req.params);
});
// 게시글 카테고리 별 조회
export default router;
