import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middlewares/auth.Middleware.js';


const router = express.Router();

/* 프로필 조회 API */
router.get('/user', authMiddleware, async (req, res, next) => {
    try {
        const user = res.locals.user;
        const profile = await prisma.userInfos.findFirst({
            where: { user_Id: +user.id },
            select: {
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

        return res.status(200).json({ profile });
    } catch (err) {
        next(err);
    }
});

/* 프로필 수정 API */
router.patch('/profile/:user_Id', authMiddleware, async (req, res, next) => {
    const { profileImage, nickname, introduction } = req.body;
    const user = res.locals.user;
    const user_Id = req.params.user_Id;

    const userProfile = await prisma.userInfos.findFirst({
        where: { user_Id: +user.id }
    });

    // 프리즈마로 유저의 정보를 찾지 못했을 때
    if (!userProfile) return res.status(404).json({ success: false, message: '프로필 조회에 실패하였습니다.' });

    // 타인의 아이디를 입력했을 때
    if (userProfile.user_Id !== +user_Id) {
        return res.status(400).json({ success: false, message: '본인의 프로필을 수정해야합니다.' })
    }

    // 수정할 내용을 작성하지 않았을 때
    if (!req.body) return res.status(400).json({ success: false, message: '수정할 내용이 작성되지 않았습니다.' });

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
router.patch('/changePW/:user_Id', authMiddleware, async (req, res, next) => {
    try {
        const user = res.locals.user;
        const { password, changePW, changePWConfirm } = req.body;
        const user_Id = req.params.user_Id;

        // 프리즈마로 유저 조회
        const checkUser = await prisma.users.findFirst({
            where: { id: +user.id }
        });
        if (!checkUser) return res.status(404).json({ success: false, message: '유저 조회에 실패하였습니다.' });

        if (checkUser.id !== +user_Id) {
            return res.status(400).json({ success: false, message: '타인의 비밀번호를 수정할 수 없습니다.' })
        }

        // 입력한 비밀번호와 db 내의 비밀번호가 다를 시
        if (!(await bcrypt.compare(password, checkUser.password))) {
            return res
                .status(400)
                .json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        // 변경할 비밀번호 글자 수 확인
        if (changePW.length < 6) {
            return res.status(400).json({ success: false, message: '변경할 비밀번호의 길이는 6자 이상이어야합니다.' });
        }

        // 변경할 비밀번호와 변경 비밀번호 확인이 다를 때
        if (changePW !== changePWConfirm) {
            return res.status(400).json({ success: false, message: '변경할 비밀번호와 비밀번호 확인이 다릅니다.' });
        }

        // 변경할 비밀번호와 확인을 작성하지 않았을 때
        if (!changePW) return res.status(400).json({ success: false, message: '변경할 비밀번호가 작성되지 않았습니다.' });
        if (!changePWConfirm) return res.status(400).json({ success: false, message: '변경할 비밀번호 확인이 작성되지 않았습니다.' });

        // 비밀번호 암호화
        const hashedPassword = await bcrypt.hash(changePW, 10);

        const [changedPW] = await prisma.$transaction(async (tx) => {
            const changedPW = await tx.users.update({
                data: {
                    password: hashedPassword
                },
                where: {
                    id: +user.id
                }
            });
            return [changedPW];
        }, {
            isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        })

        return res.status(200).json({ message: '비밀번호 수정이 성공적으로 완료되었습니다.' });
    } catch (err) {
        next(err);
    }
});

export default router;