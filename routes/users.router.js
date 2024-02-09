import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.Middleware.js';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/** /sign-up 회원가입 API */

router.post('/sign-up', async (req, res, next) => {
  const {
    email,
    password,
    pwConfirm,
    region,
    nickname,
    introduction,
    profileImage,
  } = req.body;

  // 이메일, 비밀번호, 비밀번호 확인은 필수 값
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: '이메일은 필수값입니다.' });
  }
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: '비밀번호는 필수값입니다.' });
  }
  if (!pwConfirm) {
    return res
      .status(400)
      .json({ success: false, message: '비밀번호 확인은 필수값입니다.' });
  }

  // 이메일 유저 검증
  const emailUser = await prisma.users.findFirst({
    where: {
      email,
    },
  });
  if (emailUser) {
    return res
      .status(400)
      .json({ success: false, message: '이미 가입된 이메일입니다.' });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: '비밀번호는 6자리 이상이어야 합니다.' });
  }
  if (password !== pwConfirm) {
    return res.status(400).json({
      success: false,
      message: "'비밀번호'와 '비밀번호 확인'이 일치하지 않습니다.",
    });
  }

  // 암호화
  const hashedPassword = await bcrypt.hash(password, 10);

  // 회원정보 저장
  const user = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  const userInfo = await prisma.userInfos.create({
    data: {
      user_Id: user.id,
      region,
      nickname,
      introduction,
      profileImage,
    },
  });

  return res
    .status(201)
    .json({ message: '회원가입이 완료되었습니다.😄', userInfo }); // test용
});

/** /login 로그인 API */
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: '이메일은 필수값입니다.' });
  }
  if (!password) {
    return res
      .status(400)
      .json({ success: false, message: '비밀번호는 필수값입니다.' });
  }
  // 가입 정보 조회
  const user = await prisma.users.findFirst({
    where: {
      email,
    },
  });
  // 로그인 인증
  if (!user) {
    return res.status(400).json({
      success: false,
      message: '존재하지 않는 이메일입니다. 회원가입을 해주세요.',
    });
  }
  if (!(await bcrypt.compare(password, user.password))) {
    return res
      .status(400)
      .json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
  }

  //JWT 발급
  // 이미 등록된 refreshToken이 있는지 확인
  let refreshToken;
  let exRefreshToken = await prisma.refreshTokens.findFirst({
    where: { user_Id: user.id },
  });

  if (exRefreshToken) {
    // 이미 있는 경우, 해당 refreshToken을 업데이트
    refreshToken = exRefreshToken.token;
  } else {
    // 없는 경우, 새로운 refreshToken 생성
    refreshToken = jwt.sign(
      { user_Id: user.id },
      process.env.JWT_REFRESH_SECRET_KEY,
      { expiresIn: '1h' }
    );

    // 데이터베이스에 저장
    await prisma.refreshTokens.create({
      data: { token: refreshToken, user_Id: user.id },
    });
  }
  // accessToken 생성
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_ACCESS_SECRET_KEY,
    {
      expiresIn: '3m', // test용
    }
  );

  res.cookie('accessToken', accessToken);
  res.cookie('refreshToken', refreshToken);

  return res.status(201).json({
    message: '로그인에 성공하였습니다.😄',
    accessToken,
    refreshToken,
  });
});

/** 로그아웃 API */

router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '로그아웃에 필요한 토큰이 없습니다.',
      });
    }
    // 데이터베이스 refreshToken 삭제
    await prisma.refreshTokens.deleteMany({
      where: {
        token: refreshToken,
      },
    });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json({ success: true, message: '로그아웃 성공' });
  } catch (error) {
    console.log('로그아웃 에러:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
