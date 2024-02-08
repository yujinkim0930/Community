import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middlewares/auth.Middleware.js';


const router = express.Router();

/* 프로필 조회 API */
router.get('/user', authMiddleware, async(req,res,next)=>{
try{
    const user = res.locals.user;
    const profile = await prisma.userInfos.findFirst({
        where: {user_Id: +user.id},
        select:{
            profileImage: true,
            user: {
                select: {
                    id: true,
                }
            },
            nickname: true,
            introduction: true
        }
    });

    return res.status(200).json({profile});
}catch(err){
    next(err);
}
});

/* 프로필 수정 API */
router.patch('/profile/:user_Id', authMiddleware, async(req,res,next)=>{
    const {profileImage,nickname, introduction} = req.body;
    const user = res.locals.user;
    const user_Id = req.params.user_Id;

    const userProfile = await prisma.userInfos.findFirst({
        where: {user_Id: +user.id}
    });

    if (!userProfile) return res.status(404).json({ success:false, message: '프로필 조회에 실패하였습니다.' });

    if (userProfile.user_Id !== +user_Id) {
        return res.status(400).json({ success:false, message: '본인의 프로필을 수정해야합니다.' })
    }

    if (!req.body) return res.status(400).json({ success:false, message: '수정할 내용이 작성되지 않았습니다.' });

    await prisma.userInfos.update({
        data: {
            profileImage,
            nickname,
            introduction
        },
        where: {
            user_Id: +user.id
        }
    });
    return res.status(200).json({ message: '프로필 수정이 성공적으로 완료되었습니다.' });
});

/* 비밀번호 수정 API */
// router.patch('/changePW/:user_Id', authMiddleware, )

export default router;