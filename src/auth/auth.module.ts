import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '@/user/entities/user.entity';
import { jwtConfig } from '@/config/jwt.config';

/**
 * 인증 모듈
 * 로그인, 토큰 관리, 인증 관련 기능을 제공
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET') || jwtConfig.secret;
        if (!secret) {
          throw new Error('JWT_SECRET이 설정되지 않았습니다. 환경변수를 확인해주세요.');
        }
        return {
          secret,
          signOptions: jwtConfig.signOptions,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
