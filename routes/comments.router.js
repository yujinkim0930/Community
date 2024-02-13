import express from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';

const router = express.Router();

/* 댓글 생성 API*/
router.post('/postcomments/:postId', authMiddleware, async (req, res, next) => {
    try {
        // 댓글을 등록할 게시글 조회
        const post_Id = req.params.postId;
        const post = await prisma.posts.findFirst({
            where: { id: +post_Id }
        });
        if (!post) {
            return res.status(200).json({ seccess: false, message: '게시글이 존재하지 않습니다.' });
        }

        // 댓글 create 후 return 댓글을 성공적으로 생성하였습니다. 메세지
        const content = req.body;
        if(!content){
            return res.status(400).json({ success: false, message: '댓글 내용이 존재하지 않습니다.'});
        }

        
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
})


/* 댓글 조회 API */



/* 댓글 수정 API */



/* 댓글 삭제 API */

export default router;