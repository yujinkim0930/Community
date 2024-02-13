import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authMiddleware from '../middlewares/auth.Middleware.js';
import redisClient from '../redis/client.js';
import { tokenKey } from '../redis/keys.js';
import welcome from '../middlewares/welcome.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

/** /sign-up 회원가입 API */

router.post('/sign-up', welcome, async (req, res, next) => {
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

  // 닉네임 중복 확인
  const checkNickname = await prisma.userInfos.findFirst({
    where: {
      nickname
    }
  });
  if (checkNickname) {
    return res
      .status(400)
      .json({ success: false, message: '이미 존재하는 닉네임입니다.' });
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
// Redis에 리프레시 토큰 저장
const saveToken = async (userId, refreshToken) => {
  return redisClient.hSet(tokenKey(userId), 'token', refreshToken);
};

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, message: '이메일과 비밀번호는 필수값입니다.' });
  }

  // 가입 정보 조회
  const user = await prisma.users.findFirst({
    where: {
      email,
    },
  });
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

  const accessToken = jwt.sign(
    { id: user.id },
    process.env.JWT_ACCESS_SECRET_KEY,
    {
      expiresIn: '1h', // test용 10초

    }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET_KEY,
    {
      expiresIn: '10h', // test용 1시간
    }

  );
  // Redis에 저장
  await saveToken(user.id, refreshToken);

  // 클라이언트에 액세스 토큰 반환
  res.cookie('accessToken', accessToken);

  return res.status(201).json({
    message: '로그인에 성공하였습니다.😄',
    accessToken,
    refreshToken,
  });
});

/** 로그아웃 API */
router.post('/logout', async (req, res) => {
  try {
    // console.log(res.locals.user);
    // const userId = res.locals.user.id;
    // // Redis에서 리프레시 토큰 삭제
    // redisClient.del(tokenKey(userId), (err, reply) => {
    //   if (err) {
    //     console.error('Redis에서 토큰 삭제 중 에러:', err);
    //     return res.status(500).json({ success: false, message: '서버 오류' });
    //   }
    //   if (reply === 1) {
    //     console.log('Redis에서 토큰 삭제 완료');
    //   } else {
    //     console.log('Redis에서 토큰 찾지 못함');
    //   }
    // });

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({ success: true, message: '로그아웃 성공' });
  } catch (error) {
    condsfsole.log('로그아웃 에러:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
