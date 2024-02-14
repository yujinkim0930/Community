import express from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';
import { Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import { unlinkSync } from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const fileName = `${path.basename(
      file.originalname,
      ext
    )}_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

var upload = multer({ storage: storage });

/**게시글 작성* */

router.post(
  '/posts',
  authMiddleware,
  upload.single('imageURL'),
  async (req, res) => {
    try {
      const { title, category, content } = req.body;
      const user = res.locals.user;
      const imageURL = `/uploads/${req.file.filename}`;
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
          imageURL,
        },
      });
      console.log('file', req.file);
      console.log('body', req.body);
      return res.status(201).json({ message: '게시글이 작성되었습니다.' });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
);

/**게시글 조회* */
// 포스트 아이디의 갯수 카운팅.
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
        imageURL: true,
        category: true,
        createdAt: true,
      },
    });
    // 포스트 아이디 기준으로 좋아요 수 세기.
    let like;
    for (const post of posts) {
      like = await prisma.likes.count({
        where: {
          post_Id: post.id,
        },
      });
    }
    // map으로 새로운 배열 생성
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      nickname: post.user.userInfos.nickname,
      content: post.content,
      imageURL: post.imageURL,
      category: post.category,
      createdAt: post.createdAt,
      like: like,
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
        imageURL: true,
        category: true,
        createdAt: true,
      },
    });

    if (!post) {
      return res
        .status(400)
        .json({ success: false, message: '게시글이 존재하지 않습니다.' });
    }
    const like = await prisma.likes.count({
      where: { id: +id },
    });

    const comments = await prisma.comments.findMany({
      where: { post_Id: +id },
      select: {
        nickname: true,
        content: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 3,
    });

    // map으로 새로운 배열 생성
    const formattedPost = {
      id: post.id,
      title: post.title,
      nickname: post.user.userInfos.nickname,
      content: post.content,
      imageURL: post.imageURL,
      category: post.category,
      createdAt: post.createdAt,
      like: like,
      // updatedAt: post.updatedAt,
    };

    return res.status(200).json({ formattedPost, comments });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**게시글 카테고리별 조회* */
// 카테고리 접근 필요. 카테고리별 조회는 쿼리스트링.
router.get('/posts', async (req, res) => {
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
      include: {
        likes: true,
      },
    });

    // 좋아요 수 체크 후 삭제
    for (const post of posts) {
      post.like = post.likes.length;
      delete post.likes;
    }

    return res.status(200).json({ posts });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**게시글 좋아요* */
// 게시글엔 두 당 1번만 좋아요 가능
router.post('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post_Id = req.params.id;
    const user_Id = res.locals.user.id;
    const existingLike = await prisma.likes.findFirst({
      where: {
        user_Id: +user_Id,
        post_Id: +post_Id,
      },
    });
    const post = await prisma.posts.findUnique({
      where: {
        id: +post_Id,
      },
    });

    if (!post) {
      return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
    }
    // 'existingLike'가 없는 경우에만 새로운 좋아요를 생성
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

    // 'post_Id'가 없는 경우 에러 응답
    if (!post_Id) {
      return res.status(400).json({ message: '존재하지 않는 게시글입니다.' });
    }

    return res.status(200).json({ message: '좋아요!' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**게시글 좋아요 취소 * */
router.delete('/posts/:id/like', authMiddleware, async (req, res) => {
  try {
    const post_Id = req.params.id;
    const user_Id = res.locals.user.id;
    const existingLike = await prisma.likes.findFirst({
      where: { user_Id: +user_Id, post_Id: +post_Id },
    });

    // 'post_Id'가 'Likes' 테이블에 있는 경우에만 좋아요 취소
    if (existingLike) {
      const id = existingLike.id;
      await prisma.likes.delete({
        where: { id: +id },
      });
      return res.status(200).json({ message: '좋아요가 취소되었습니다.' });
    } else {
      return res.status(400).json({ message: '좋아요를 누르지 않았습니다.' });
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
/**좋아요 top 10* */
// 좋아요 테이블의 post_Id 접근. 카운팅
router.get('/posts/likes/top10', async (req, res) => {
  try {
    const topLikedPosts = await prisma.posts.findMany({
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
        imageURL: true,
        category: true,
        createdAt: true,
        likes: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    const formattedTopLikedPosts = topLikedPosts.map((post) => ({
      id: post.id,
      title: post.title,
      nickname: post.user.userInfos.nickname,
      content: post.content,
      imageURL: post.imageURL,
      category: post.category,
      createdAt: post.createdAt,
      likeCount: post.likes.length, // 좋아요 수를 배열 길이로 가져옴
    }));

    return res.status(200).json({ data: formattedTopLikedPosts });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});
// 게시글 수정 API
router.patch(
  '/posts/:postId',
  authMiddleware,
  upload.single('imageURL'),
  async (req, res) => {
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
        return res.status(401).json({
          success: false,
          message: '게시글을 수정할 권한이 없습니다.',
        });
      }
      const updateData = req.body;
      if (req.file) {
        const imageURL = `/uploads/${req.file.filename}`;
        unlinkSync(`./${post.imageURL}`);
        await prisma.$transaction(
          async (tx) => {
            await tx.posts.update({
              data: {
                ...updateData,
                imageURL,
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
      }

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
  }
);

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
