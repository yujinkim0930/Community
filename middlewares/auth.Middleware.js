import jwt from 'jsonwebtoken';
import prisma from '../models/index.js';

/**임시 사용자 인증 미들웨어 'authorization' */
export default async function (req, res, next) {
  try {
    //헤더에서 accessToken 가져오기
    const authorization = req.headers.authorization;
    if (!authorization) {
      throw new Error(
        'authorization 인증 정보가 올바르지 않습니다. 다시 로그인 해주세요!'
      );
    }
    // accessToken 의 인증방식이 올바른가
    // Bearer (JWT)
    const [tokenType, tokenValue] = authorization.split(' ');

    if (tokenType !== 'Bearer') {
      throw new Error(
        'Bearer 인증 정보가 올바르지 않습니다. 다시 로그인 해주세요!'
      );
    }

    if (!tokenValue) {
      throw new Error(
        'seccret key 인증 정보가 올바르지 않습니다. 다시 로그인 해주세요!'
      );
    }

    // 12h 의 유효기간이 남아있는가?
    const token = jwt.verify(tokenValue, process.env.JWT_ACCESS_SECRET_KEY);

    // accessToken 안에 id 데이터가 잘 들어있는가?
    if (!token.id) {
      throw new Error(
        'id 인증 정보가 올바르지 않습니다. 다시 로그인 해주세요!'
      );
    }
    const user = await prisma.users.findFirst({
      where: {
        id: +token.id,
      },
    });

    if (!user) {
      throw new Error(
        'user 인증 정보가 올바르지 않습니다. 다시 로그인 해주세요!'
      );
    }

    // user 정보 담기
    res.locals.user = user;
    console.log(res.locals.user);

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
