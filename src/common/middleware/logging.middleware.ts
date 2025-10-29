import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * 개발 모드용 요청 로깅 미들웨어
 * API URL, 메서드, Body 정보를 콘솔에 출력
 */
@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 개발 모드에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      const startTime = Date.now();
      const timestamp = new Date().toISOString();
      const method = req.method;
      const url = req.originalUrl || req.url;
      
      // 요청 시작 로그
      console.log(`\n🚀 [${timestamp}] ${method} ${url}`);
      
      // Body가 있는 경우 로그 출력
      if (req.body && Object.keys(req.body).length > 0) {
        console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
      }
      
      // Query 파라미터가 있는 경우 로그 출력
      if (req.query && Object.keys(req.query).length > 0) {
        console.log('🔍 Query Params:', JSON.stringify(req.query, null, 2));
      }
      
      // 응답 완료 시 로그 출력
      const originalSend = res.send;
      res.send = function (body) {
        const responseTime = Date.now() - startTime;
        console.log(`✅ [${timestamp}] ${method} ${url} - ${res.statusCode} (${responseTime}ms)`);
        
        // 응답 Body가 있는 경우 로그 출력 (에러 응답 제외)
        if (body && res.statusCode < 400) {
          try {
            const parsedBody = JSON.parse(body);
            if (parsedBody && Object.keys(parsedBody).length > 0) {
              console.log('📤 Response Body:', JSON.stringify(parsedBody, null, 2));
            }
          } catch (error) {
            // JSON 파싱 실패 시 원본 출력
            console.log('📤 Response Body:', body);
          }
        }
        
        console.log('─'.repeat(80));
        return originalSend.call(this, body);
      };
    }
    
    next();
  }
}
