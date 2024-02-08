import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middlewares/auth.Middleware.js';


const router = express.Router();

/*프로필 조회 API */
router.get('/user', authMiddleware, async(req,res,next)=>{
try{
    const user = res.locals.users;
    console.log(user);
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
})

export default router;