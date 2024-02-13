import express from 'express';
import prisma from '../models/index.js';
import authMiddleware from '../middlewares/auth.Middleware.js';

const router = express.Router();

/* 댓글 생성 API*/
router.post('/postcomments/:postId', authMiddleware, async (req, res) => {
    try {
        // 댓글을 등록할 게시글 조회
        const user = res.locals.user;
        const post_Id = req.params.postId;
        const post = await prisma.posts.findFirst({
            where: { id: +post_Id }
        });
        if (!post) {
            return res.status(404).json({ seccess: false, message: '게시글이 존재하지 않습니다.' });
        }

        // 댓글 create
        const {content} = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: '댓글 내용이 존재하지 않습니다.' });
        }

        await prisma.comments.create({
            data: {
                user_Id: user.id,
                post_Id: +post_Id,
                content
            }
        })

        return res.status(201).json({ message: '댓글이 작성되었습니다.' });
    } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
    }
})

/* 댓글 조회 API */
router.get('/comments/:postId',async(req,res)=>{
    try{
        const post_Id = req.params.postId;
        const post = await prisma.posts.findFirst({
            where: { id: +post_Id }
        });
        if (!post) {
            return res.status(404).json({ seccess: false, message: '게시글이 존재하지 않습니다.' });
        }

        const comments = await prisma.comments.findMany({
            select:{
                id: true,
            }
        })

    }catch(err){
        return res.status(400).json({ success: false, message: err.message });
    }
})


/* 댓글 수정 API */



/* 댓글 삭제 API */

export default router;