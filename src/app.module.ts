import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { createDatabaseConfig } from '@/config/database.config';
import { AuthModule } from '@/auth/auth.module';
import { UserModule } from '@/user/user.module';
import { CompetitionModule } from '@/competition/competition.module';
import { MatModule } from '@/mat/mat.module';
import { GroupModule } from '@/group/group.module';
import { PlayerModule } from '@/player/player.module';
import { MatchModule } from '@/match/match.module';
import { LoggingMiddleware } from '@/common/middleware/logging.middleware';

/**
 * 메인 애플리케이션 모듈
 * 모든 모듈을 통합하고 전역 설정을 관리
 */
@Module({
  imports: [
    // 환경 변수 설정
    // 로컬 개발: env-cmd를 통해 .env.local 파일에서 로드 (ignoreEnvFile: true)
    // 프로덕션: 시스템 환경 변수 사용 (GitHub Actions Secrets 등)
    // 시스템 환경 변수가 .env 파일보다 우선순위가 높음
    ConfigModule.forRoot({
      isGlobal: true,
      // env-cmd를 사용하면 환경 변수를 로드하므로 .env 파일 무시
      // GitHub Actions에서는 시스템 환경 변수로 주입되므로 자동으로 읽힘
      ignoreEnvFile: true,
    }),
    
    // 데이터베이스 연결
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => createDatabaseConfig(configService),
      inject: [ConfigService],
    }),
    
    // 기능 모듈들
    AuthModule,
    UserModule,
    CompetitionModule,
    MatModule,
    GroupModule,
    PlayerModule,
    MatchModule,
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
