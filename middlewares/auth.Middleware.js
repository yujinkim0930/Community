import jwt from 'jsonwebtoken';
import prisma from '../models/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**임시 사용자 인증 미들웨어 'authorization' */
export default async function (req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      throw new Error("인증 정보가 올바르지 않습니다.");
    }

    const [tokenType, tokenValue] = authorization.split(" ");
    if (tokenType !== "Bearer") {
      throw new Error("인증 정보가 올바르지 않습니다.");
    }
    if (!tokenValue) {
      throw new Error("인증 정보가 올바르지 않습니다.");
    }
    
    const token = jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET_KEY);
    if (!token.id) {
      throw new Error("인증 정보가 올바르지 않습니다.");
    }

    const user = await prisma.users.findFirst({
      where: {
        id: +token.id,
      },
    });
    if (!user) {
      throw new Error("인증 정보가 올바르지 않습니다.");
    }

    res.locals.user = user;

    next();
  } catch (error) {

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '토큰이 만료되었습니다.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: '토큰이 조작되었습니다.' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
}