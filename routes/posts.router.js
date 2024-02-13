import express from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';

const router = express.Router();
/**게시글 작성* */
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
/**게시글 조회* */
router.get('/posts', async (req, res) => {
  try {
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
        likeCount: true,
        createdAt: true,
      },
    });
    // map으로 새로운 배열 생성
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      nickname: post.user.userInfos.nickname,
      content: post.content,
      category: post.category,
      likeCount: post.likeCount,
      createdAt: post.createdAt,
    }));
    return res.status(200).json({ data: formattedPosts });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**게시글 상세 조회* */
router.get('/post/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!id)
      return res
        .status(200)
        .json({ seccess: false, message: '게시글이 존재하지 않습니다.' });
    const post = await prisma.posts.findFirst({
      where: { id: +id },
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
        likeCount: true,
        createdAt: true,
      },
    });
    // map으로 새로운 배열 생성
    const formattedPost = {
      id: post.id,
      title: post.title,
      nickname: post.user.userInfos.nickname,
      content: post.content,
      category: post.category,
      likeCount: post.likeCount,
      createdAt: post.createdAt,
      // updatedAt: post.updatedAt,
    };

    return res.status(200).json({ data: formattedPost });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**게시글 카테고리별 조회* */
// 카테고리 접근 필요. 카테고리별 조회는 쿼리스트링.
router.get('/posts/category', async (req, res) => {
  try {
    // 카테고리 가져오기.
    const category = req.query.category;
    // 일치하지 않는 카테고리 유효성 검사
    if (!['INFO', 'CLUB', 'LOST'].includes(category)) {
      return res
        .status(400)
        .json({ success: false, message: '올바르지 않는 카테고리 입니다.' });
    }
    const posts = await prisma.posts.findMany({
      where: { category: category },
    });

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**게시글 좋아요* */
// 게시글엔 두 당 1번만 좋아요 가능
router.post('/posts/:id/likes', authMiddleware, async (req, res) => {
  try {
    const post_Id = req.params.id;
    const user_Id = res.locals.user.id;
    const existingLike = await prisma.likes.findFirst({
      where: {
        user_Id: +user_Id,
        post_Id: +post_Id,
      },
    });

    // 'post_Id'가 'Likes' 테이블에 없는 경우에만 새로운 좋아요를 생성
    if (!existingLike) {
      await prisma.likes.create({
        data: {
          user_Id: +user_Id,
          post_Id: +post_Id,
        },
      });
    } else {
      return res.status(400).json({ message: '이미 좋아요를 눌렀습니다.' });
    }

    return res.status(200).json({ message: '좋아요!' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
// const updatePosts = await prisma.posts.update({
//   where: { id: +id },
//   data: {
//     likeCount: {
//       increment: 1,
//     },
//   },
// });
export default router;
