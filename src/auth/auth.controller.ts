import { Controller, Post, Body, Res, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService, LoginDto } from './auth.service';
import { JoinDto } from './dto/join.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 인증 컨트롤러
 * 회원가입, 로그인, 토큰 갱신, 로그아웃 처리
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 회원가입
   * @param joinDto 회원가입 정보
   * @param res HTTP 응답 객체
   */
  @Post('join')
  async join(@Body() joinDto: JoinDto, @Res() res: Response): Promise<void> {
    try {
      const user = await this.authService.join(joinDto);
      sendSuccess(res, '회원가입이 완료되었습니다.', { user }, HttpStatus.CREATED);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '회원가입 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 사용자 로그인
   * @param loginDto 로그인 정보
   * @param res HTTP 응답 객체
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<void> {
    try {
      const { user, tokens } = await this.authService.login(loginDto);

      // 쿠키에 토큰 설정
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1시간 (밀리초)
        path: '/',
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
        path: '/',
      });

      // 응답 데이터 (비밀번호 제외)
      const { password, ...userWithoutPassword } = user;
      sendSuccess(res, '로그인에 성공했습니다.', { user: userWithoutPassword });
    } catch (error) {
      const status = error.status || HttpStatus.UNAUTHORIZED;
      sendError(res, error.message || '로그인에 실패했습니다.', status);
    }
  }

  /**
   * 토큰 갱신
   * @param req HTTP 요청 객체
   * @param res HTTP 응답 객체
   */
  @Post('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;

      if (!refreshToken) {
        sendError(res, '리프레시 토큰이 없습니다.', HttpStatus.UNAUTHORIZED);
        return;
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      // 새로운 토큰을 쿠키에 설정
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000, // 1시간
        path: '/',
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
        path: '/',
      });

      sendSuccess(res, '토큰이 갱신되었습니다.');
    } catch (error) {
      const status = error.status || HttpStatus.UNAUTHORIZED;
      sendError(res, error.message || '토큰 갱신에 실패했습니다.', status);
    }
  }

  /**
   * 로그아웃
   * @param res HTTP 응답 객체
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Res() res: Response): Promise<void> {
    try {
      // 쿠키 삭제
      res.clearCookie('access_token', { path: '/' });
      res.clearCookie('refresh_token', { path: '/' });

      sendSuccess(res, '로그아웃되었습니다.');
    } catch (error) {
      sendError(res, '로그아웃 처리 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 현재 사용자 정보 조회
   * @param req HTTP 요청 객체
   * @param res HTTP 응답 객체
   */
  @Post('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const user = (req as any).user;
      sendSuccess(res, '사용자 정보를 조회했습니다.', { user });
    } catch (error) {
      const status = error.status || HttpStatus.UNAUTHORIZED;
      sendError(res, error.message || '사용자 정보 조회에 실패했습니다.', status);
    }
  }
}
