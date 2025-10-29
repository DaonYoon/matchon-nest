import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { jwtConfig, refreshTokenConfig } from "@/config/jwt.config";

/**
 * JWT 인증 가드
 * 쿠키에서 access_token을 추출하여 사용자 인증 처리
 * access_token이 만료되면 refresh_token으로 자동 갱신
 * refresh_token도 만료되면 쿠키 삭제
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 인증 처리
   * @param context 실행 컨텍스트
   * @returns 인증 성공 여부
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const accessToken = this.extractTokenFromCookies(request, "access_token");
    const refreshToken = this.extractTokenFromCookies(request, "refresh_token");

    // access_token이 없으면 refresh_token으로 갱신 시도
    if (!accessToken) {
      return await this.handleTokenRefresh(request, response, refreshToken);
    }

    try {
      // JWT secret 설정 확인
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || jwtConfig.secret;
      if (!jwtSecret) {
        throw new InternalServerErrorException("JWT 시크릿이 설정되지 않았습니다.");
      }

      // access_token 검증
      const payload = await this.jwtService.verifyAsync(accessToken, {
        secret: jwtSecret,
      });

      // 토큰 타입 확인
      if (payload.type !== "access") {
        this.clearTokens(response);
        throw new UnauthorizedException("유효하지 않은 토큰입니다.");
      }

      // 요청 객체에 사용자 정보 추가
      (request as any).user = payload;
      return true;
    } catch (error) {
      // 이미 UnauthorizedException 또는 InternalServerErrorException인 경우 그대로 던짐
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }

      // JWT secret 관련 에러는 500으로 처리
      if (
        error.message &&
        (error.message.includes("secretOrPrivateKey must have a value") ||
         error.message.includes("secret") && error.message.includes("undefined"))
      ) {
        throw new InternalServerErrorException("JWT 설정 오류가 발생했습니다.");
      }
      
      // access_token이 만료되었으면 refresh_token으로 갱신 시도 (401)
      if (error.name === "TokenExpiredError") {
        return await this.handleTokenRefresh(request, response, refreshToken);
      }

      // 토큰이 유효하지 않은 경우 (400)
      this.clearTokens(response);
      throw new BadRequestException("유효하지 않은 토큰입니다.");
    }
  }

  /**
   * 토큰 갱신 처리
   * @param request HTTP 요청 객체
   * @param response HTTP 응답 객체
   * @param refreshToken 리프레시 토큰
   * @returns 인증 성공 여부
   */
  private async handleTokenRefresh(
    request: Request,
    response: Response,
    refreshToken: string | null
  ): Promise<boolean> {
    if (!refreshToken) {
      // 쿠키 삭제 후 예외 발생
      this.clearTokens(response);
      throw new UnauthorizedException("인증 토큰이 없습니다.");
    }

    try {
      // JWT secret 설정 확인
      const jwtSecret = this.configService.get<string>('JWT_SECRET') || jwtConfig.secret;
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || refreshTokenConfig.secret;
      
      if (!jwtSecret || !refreshSecret) {
        throw new InternalServerErrorException("JWT 시크릿이 설정되지 않았습니다.");
      }

      // refresh_token 검증
      const refreshPayload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshSecret,
      });

      if (refreshPayload.type !== "refresh") {
        this.clearTokens(response);
        throw new UnauthorizedException("유효하지 않은 리프레시 토큰입니다.");
      }

      // 새로운 토큰 생성
      const newAccessToken = this.jwtService.sign(
        {
          sub: refreshPayload.sub,
          email: refreshPayload.email,
          name: refreshPayload.name,
          type: "access",
        },
        {
          ...jwtConfig.signOptions,
          secret: jwtSecret,
        }
      );

      const newRefreshToken = this.jwtService.sign(
        {
          sub: refreshPayload.sub,
          email: refreshPayload.email,
          name: refreshPayload.name,
          type: "refresh",
        },
        {
          secret: refreshSecret,
          expiresIn: refreshTokenConfig.expiresIn,
        }
      );

      // 새로운 토큰을 쿠키에 설정
      this.setTokens(response, newAccessToken, newRefreshToken);

      // 요청 객체에 사용자 정보 추가
      (request as any).user = {
        sub: refreshPayload.sub,
        email: refreshPayload.email,
        name: refreshPayload.name,
        type: "access",
      };

      return true;
    } catch (error) {
      // refresh_token이 만료되었거나 유효하지 않으면 쿠키 삭제
      this.clearTokens(response);
      
      // 이미 UnauthorizedException 또는 InternalServerErrorException인 경우 그대로 던짐
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }

      // JWT secret 관련 에러는 500으로 처리
      if (
        error.message &&
        (error.message.includes("secretOrPrivateKey must have a value") ||
         error.message.includes("secret") && error.message.includes("undefined"))
      ) {
        throw new InternalServerErrorException("JWT 설정 오류가 발생했습니다.");
      }
      
      // refresh_token이 만료된 경우 (401)
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("인증이 만료되었습니다. 다시 로그인해주세요.");
      }
      
      // 다른 에러인 경우 400 예외 발생
      throw new BadRequestException("유효하지 않은 토큰입니다.");
    }
  }

  /**
   * 쿠키에서 토큰 추출
   * @param request HTTP 요청 객체
   * @param tokenName 토큰 이름
   * @returns 추출된 토큰 또는 null
   */
  private extractTokenFromCookies(
    request: Request,
    tokenName: string
  ): string | null {
    return request.cookies?.[tokenName] || null;
  }

  /**
   * 새로운 토큰을 쿠키에 설정
   * @param response HTTP 응답 객체
   * @param accessToken 새로운 액세스 토큰
   * @param refreshToken 새로운 리프레시 토큰
   */
  private setTokens(
    response: Response,
    accessToken: string,
    refreshToken: string
  ): void {
    // withCredentials 지원을 위해 sameSite 조정
    const isProduction = process.env.NODE_ENV === "production";
    response.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000, // 1시간
      path: "/",
    });

    response.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
      path: "/",
    });
  }

  /**
   * 토큰 쿠키 삭제
   * @param response HTTP 응답 객체
   */
  private clearTokens(response: Response): void {
    // 쿠키 삭제 옵션 설정 (설정된 옵션과 동일하게 설정해야 완전히 삭제됨)
    const isProduction = process.env.NODE_ENV === "production";
    const cookieOptions: {
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'strict' | 'lax' | 'none';
      path: string;
    } = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    };
    
    response.clearCookie("access_token", cookieOptions);
    response.clearCookie("refresh_token", cookieOptions);
  }
}
