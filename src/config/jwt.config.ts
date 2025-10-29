import { JwtModuleOptions } from '@nestjs/jwt';

/**
 * JWT 토큰 설정
 * access_token: 1시간 유효
 * refresh_token: 7일 유효
 */
export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET,
  signOptions: {
    expiresIn: '1h', // access_token 1시간 유효
  },
};

/**
 * Refresh Token 설정
 * 7일 유효기간
 */
export const refreshTokenConfig = {
  secret: process.env.JWT_REFRESH_SECRET,
  expiresIn: '7d', // refresh_token 7일 유효
};
