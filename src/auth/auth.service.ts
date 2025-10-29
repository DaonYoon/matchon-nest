import { Injectable, UnauthorizedException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '@/user/entities/user.entity';
import { jwtConfig, refreshTokenConfig } from '@/config/jwt.config';
import { JoinDto } from './dto/join.dto';
import { LoginDto } from './dto/login.dto';

/**
 * 토큰 페이로드 인터페이스
 */
export interface TokenPayload {
  sub: number; // 사용자 idx
  email: string;
  name: string;
  type: 'access' | 'refresh';
}

/**
 * 인증 서비스
 * 로그인, 비밀번호 검증, 토큰 생성 및 검증 담당
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 회원가입 처리
   * @param joinDto 회원가입 정보
   * @returns 생성된 사용자 정보 (비밀번호 제외)
   */
  async join(joinDto: JoinDto): Promise<Omit<User, 'password'>> {
    const { email, password, ...userData } = joinDto;

    // 이메일 중복 확인 (이메일이 제공된 경우)
    if (email) {
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    try {
      // 비밀번호 해시화
      const hashedPassword = await this.hashPassword(password);

      // 사용자 생성
      const user = this.userRepository.create({
        ...userData,
        email,
        password: hashedPassword,
      });

      const savedUser = await this.userRepository.save(user);

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;
    } catch (error) {
      throw new ConflictException('회원가입 중 오류가 발생했습니다.');
    }
  }

  /**
   * 사용자 로그인 처리
   * @param loginDto 로그인 정보 (이메일, 비밀번호)
   * @returns 사용자 정보와 토큰 정보
   */
  async login(loginDto: LoginDto): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const { email, password } = loginDto;

    // 이메일로 사용자 찾기
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await this.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 토큰 생성
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  /**
   * 비밀번호 검증
   * @param plainPassword 평문 비밀번호
   * @param hashedPassword 해시된 비밀번호
   * @returns 비밀번호 일치 여부
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new BadRequestException('비밀번호 검증 중 오류가 발생했습니다.');
    }
  }

  /**
   * 비밀번호 해시화
   * @param password 평문 비밀번호
   * @returns 해시된 비밀번호
   */
  async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      throw new BadRequestException('비밀번호 해시화 중 오류가 발생했습니다.');
    }
  }

  /**
   * Access Token과 Refresh Token 생성
   * @param user 사용자 정보
   * @returns 토큰 객체
   */
  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    // JWT secret 확인
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || jwtConfig.secret;
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || refreshTokenConfig.secret;

    if (!jwtSecret) {
      throw new InternalServerErrorException('JWT_SECRET이 설정되지 않았습니다.');
    }

    if (!refreshSecret) {
      throw new InternalServerErrorException('JWT_REFRESH_SECRET이 설정되지 않았습니다.');
    }

    const accessPayload: TokenPayload = {
      sub: user.idx,
      email: user.email,
      name: user.name,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      sub: user.idx,
      email: user.email,
      name: user.name,
      type: 'refresh',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      ...jwtConfig.signOptions,
      secret: jwtSecret,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshTokenConfig.expiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Refresh Token으로 새로운 Access Token 생성
   * @param refreshToken 리프레시 토큰
   * @returns 새로운 토큰 정보
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Refresh Token secret 확인
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || refreshTokenConfig.secret;
      
      if (!refreshSecret) {
        throw new InternalServerErrorException('JWT_REFRESH_SECRET이 설정되지 않았습니다.');
      }

      // Refresh Token 검증
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      }) as TokenPayload;

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      // 사용자 정보 조회
      const user = await this.userRepository.findOne({
        where: { idx: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
      }

      // 새로운 토큰 생성
      return await this.generateTokens(user);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new UnauthorizedException('토큰 갱신에 실패했습니다.');
    }
  }

  /**
   * 토큰에서 사용자 정보 추출
   * @param token JWT 토큰
   * @returns 토큰 페이로드
   */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtService.verify(token) as TokenPayload;
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }

  /**
   * 현재 사용자 정보 조회
   * @param userId 사용자 고유번호
   * @returns 사용자 정보 (비밀번호 제외)
   */
  async getCurrentUser(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { idx: userId },
    });

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    // 비밀번호 제외하고 반환
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
