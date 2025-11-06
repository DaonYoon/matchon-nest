import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

/**
 * 애플리케이션 부트스트랩
 * Nest.js 애플리케이션을 시작하고 전역 설정을 적용
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ConfigService를 통해 환경 변수 접근
  const configService = app.get(ConfigService);

  // 전역 유효성 검사 파이프 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있으면 에러
      transform: true, // 자동 타입 변환
      transformOptions: {
        enableImplicitConversion: true, // 암시적 타입 변환 활성화
      },
    }),
  );

  // 환경 체크 (개발/프로덕션)
  const isDevelopment = configService.get('NODE_ENV', 'development') !== 'production';
  
  // API 기본 경로 설정
  // 개발 환경: /api prefix 사용
  // 프로덕션 환경: prefix 없음 (nginx에서 처리)
  if (isDevelopment) {
    app.setGlobalPrefix('api');
  }
  
  // CORS 설정
  // 개발 모드: localhost만 허용
  // 프로덕션: https://match-on.kr에서의 요청만 허용
  const allowedOrigins = isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']
    : ['https://match-on.kr', 'https://www.match-on.kr'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // 개발 모드에서는 origin이 없어도 허용 (같은 도메인 요청)
      if (isDevelopment && !origin) {
        return callback(null, true);
      }
      
      // 허용된 origin인지 확인
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS 정책에 의해 차단되었습니다.'));
      }
    },
    credentials: true, // 쿠키 전송 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Swagger 설정 (서버 시작 전에 설정)
  const config = new DocumentBuilder()
    .setTitle('대회 대진 관리 API')
    .setDescription('대회 등록, 매트 관리, 그룹 구성, 선수 신청을 위한 RESTful API 문서')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT 토큰을 입력하세요. Auth에서 로그인하여 토큰을 받으세요.',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Users', '사용자 관리')
    .addTag('Auth', '인증 관리')
    .addTag('Competitions', '대회 관리')
    .addTag('Mats', '매트 관리')
    .addTag('Groups', '그룹 관리')
    .addTag('Players', '선수 관리')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // 새로고침 후에도 인증 유지
    },
  });

  // 포트 설정 (.env.local에서 읽어옴)
  const port = configService.get('PORT', 4003);
  
  // 개발 모드에서는 모든 네트워크 인터페이스에 바인딩
  if (isDevelopment) {
    await app.listen(port, '0.0.0.0');
  } else {
    await app.listen(port);
  }

  console.log(`🚀 애플리케이션이 포트 ${port}에서 실행 중입니다.`);
  if (isDevelopment) {
    console.log(`📝 API 문서: http://localhost:${port}/api-docs`);
    console.log(`📝 네트워크 접속 가능: http://0.0.0.0:${port}`);
  } else {
    console.log(`📝 API 문서: http://localhost:${port}/api-docs`);
  }
}

bootstrap();
