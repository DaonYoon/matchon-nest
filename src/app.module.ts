import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { createDatabaseConfig } from '@/config/database.config';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/user.module';
import { LoggingMiddleware } from '@/common/middleware/logging.middleware';

/**
 * 메인 애플리케이션 모듈
 * 모든 모듈을 통합하고 전역 설정을 관리
 */
@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      ignoreEnvFile: false,
    }),
    
    // 데이터베이스 연결
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => createDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    
    // 기능 모듈들
    AuthModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  /**
   * 미들웨어 설정
   * 쿠키 파서와 로깅 미들웨어 추가
   */
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieParser())
      .forRoutes('*');
      
    // 개발 모드에서만 로깅 미들웨어 적용
    if (process.env.NODE_ENV === 'development') {
      consumer
        .apply(LoggingMiddleware)
        .forRoutes('*');
    }
  }
}
