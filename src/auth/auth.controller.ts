import { Controller, Post, Get, Body, Res, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JoinDto } from './dto/join.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 인증 컨트롤러
 * 회원가입, 로그인, 토큰 갱신, 로그아웃 처리
 */
@ApiTags('Auth')
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
  @ApiOperation({ summary: '로그인', description: '이메일과 비밀번호로 로그인하여 JWT 토큰을 받습니다.' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: '로그인 성공 (쿠키에 토큰 저장)' })
  @ApiResponse({ status: 401, description: '로그인 실패 (잘못된 이메일 또는 비밀번호)' })
  async login(@Body() loginDto: LoginDto, @Res() res: Response): Promise<void> {
    try {
      const { user, tokens } = await this.authService.login(loginDto);

      // 쿠키에 토큰 설정 (withCredentials 지원을 위해 sameSite 조정)
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, // 1시간 (밀리초)
        path: '/',
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
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

      // 새로운 토큰을 쿠키에 설정 (withCredentials 지원을 위해 sameSite 조정)
      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('access_token', tokens.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 60 * 60 * 1000, // 1시간
        path: '/',
      });

      res.cookie('refresh_token', tokens.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
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
   * 쿠키의 access_token과 refresh_token을 삭제하고 응답 반환
   * 인증 가드 없이 동작하여 토큰이 만료되었거나 유효하지 않아도 쿠키 삭제 가능
   * @param res HTTP 응답 객체
   */
  @Post('logout')
  @ApiOperation({ summary: '로그아웃', description: '쿠키에 저장된 access_token과 refresh_token을 삭제합니다.' })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@Res() res: Response): Promise<void> {
    try {
      // 쿠키 삭제 (설정된 옵션과 동일하게 설정해야 완전히 삭제됨)
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions: {
        httpOnly: boolean;
        secure: boolean;
        sameSite: 'strict' | 'lax' | 'none';
        path: string;
      } = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        path: '/',
      };
      
      // 쿠키 내의 토큰 삭제
      res.clearCookie('access_token', cookieOptions);
      res.clearCookie('refresh_token', cookieOptions);

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
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '현재 사용자 정보 조회', description: 'JWT 토큰을 기반으로 현재 로그인한 사용자의 정보를 조회합니다.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '사용자 정보 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없음' })
  async getCurrentUser(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tokenPayload = (req as any).user;
      const userId = tokenPayload.sub;

      // DB에서 최신 사용자 정보 조회
      const user = await this.authService.getCurrentUser(userId);
      sendSuccess(res, '사용자 정보를 조회했습니다.', { user });
    } catch (error) {
      const status = error.status || HttpStatus.UNAUTHORIZED;
      sendError(res, error.message || '사용자 정보 조회에 실패했습니다.', status);
    }
  }
}
