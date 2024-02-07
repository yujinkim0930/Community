import express from 'express';
import prisma from '../models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

/** /sign-up 회원가입 API
 * 2/7 by 경복
 * 유효성 검사 및 이메일 유저 검증 로직
 * 비밀번호 bcrypt hash 처리
 * 필수 입력값: 이메일, 비밀번호, 비밀번호 확인
 * 사용자 정보 DB에 저장: user_id, region, nickname, oneLiner, profileImage
 */
router.route('/sign-up').post(async (req, res, next) => {
  const {
    email,
    password,
    pwConfirm,
    region,
    nickname,
    oneLiner,
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
  console.log(user.id);
  const userInfo = await prisma.userInfos.create({
    data: {
      user_Id: user.id,
      region,
      nickname,
      oneLiner,
      profileImage,
    },
  });

  return res
    .status(201)
    .json({ message: '회원가입이 완료되었습니다.😄', userInfo }); // test용
});

/** /login 로그인 API
 * 2/7 by 경복
 * 로그인 인증 bcrypt.compare()
 * accessToken, refreshToken 발급
 * refreshToken DB 저장
 */
router.route('/login').post(async (req, res, next) => {
  const { email, password } = req.body;

  //이메일, 비밀번호 필수값
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
  const accessToken = jwt.sign(
    {
      user_Id: user.user_Id,
    },
    process.env.JWT_ACCESS_SECRET_KEY,
    {
      expiresIn: '10s', // test용 10초
    }
  );
  const refreshToken = jwt.sign(
    {
      user_Id: user.user_Id,
    },
    process.env.JWT_REFRESH_SECRET_KEY,
    {
      expiresIn: '1h', // test용 1시간
    }
  );

  res.cookie('accessToken', accessToken);
  res.cookie('refreshToken', refreshToken);

  console.log(accessToken);
  console.log(refreshToken);

  return res.status(201).json({
    message: '로그인에 성공하였습니다.😄',
    accessToken,
    refreshToken,
  });
});

export default router;
