import nodemailer from 'nodemailer';

const welcome = async (req, res, next) => {
  const { email, nickname } = req.body;
  try {
    // 이메일 템플릿 정의
    const template = `
        <html>
          <head>
          <title>🎉 환영합니다! 🎉</title>
          <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f9f9f9;
          }
          
          .container {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          
          .header {
            background-color: #007bff;
            color: #fff;
            padding: 20px;
            text-align: center;
            border-top-left-radius: 10px;
            border-top-right-radius: 10px;
          }
          
          .content {
            padding: 20px;
            text-align: center;
          }
          
          .button {
            display: inline-block;
            background-color: #007bff;
            color: #fff;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            transition: background-color 0.3s ease;
          }
          .button:hover {
            background-color: #0056b3;
          }
          
          .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            border-bottom-left-radius: 10px;
            border-bottom-right-radius: 10px;
          }
          
          .emoji {
            font-size: 40px;
            vertical-align: middle;
          }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1><span class="emoji">🎉</span> 환영합니다! <span class="emoji">🎉</span></h1>
            </div>
            <div class="content">
              <p><strong>${nickname}</strong>님, 환영합니다! 우리 동네의 멤버가 되신 것을 축하드려요!</p>
              <p>우리의 지역 커뮤니티 서비스를 이용해보세요. 당신을 기다리고 있어요!</p>

              <h2>주요 컨텐츠 및 기능:</h2>
              <ul>
                <li>따끈한 동네 소식 알림 받기</li>
                <li>구석탱이들만 아는 우리 동네 핫플레이스!</li>
                <li>물품 판매 및 거래</li>
                <li>안전한 결제 시스템</li>
                <li>커뮤니티 활동 및 이벤트 참여</li>
              </ul>
              <p>더 많은 정보를 원하시면 구석탱이 웹사이트를 방문해주세요.</p>

              <a href="http://localhost:3018/login" class="button">지금 시작하기</a>
            </div>
            <div class="footer">
              <p>도움이 필요하시면 언제든지 문의해주세요. 즐거운 시간 되세요!🥕</p>
            </div>
          </div>
        </body>
        </html>
      `;

    let transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GOOGLE_MAIL,
        pass: process.env.GOOGLE_PASSWORD,
      },
    });

    let message = {
      from: process.env.GOOGLE_MAIL,
      to: `${nickname} <${email}>`,
      subject: `🎉 Welcome! 환영합니다!`,
      html: template,
    };

    transporter.sendMail(message, (err) => {
      if (err) next(err);
      else res.status(200).json({ isMailSucssessed: true });
    });
    next();
  } catch (err) {
    next(err);
  }
};

export default welcome;
