import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';


const router = express.Router();

/*프로필 조회 API */
router.get('/user', authMiddleware, async(req,res,next)=>{
try{
    const user_Id = res.locals.user;

    const profile = await prisma.userInfos.findFirst({
        where: {id: +user_Id},
        select:{
            profileImage: true,
            nickname: true,
            introduction: true,
            createdAt: true
        }
    })
}catch(err){
    next(err);
}
})

export default router;