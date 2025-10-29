import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 회원가입 요청 DTO
 */
export class JoinDto {
  @ApiPropertyOptional({ description: '이메일', example: 'testdev@test.com' })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @ApiProperty({ description: '사용자 이름', example: 'testdev' })
  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  name: string;

  @ApiProperty({ description: '비밀번호 (최소 6자)', example: 'q1w2e3r4' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @ApiProperty({ description: '소속', example: '테스트팀' })
  @IsNotEmpty({ message: '소속은 필수입니다.' })
  @IsString({ message: '소속은 문자열이어야 합니다.' })
  affiliation: string;

  @ApiPropertyOptional({ description: '휴대폰 번호', example: '010-1234-5678' })
  @IsOptional()
  @IsString({ message: '휴대폰 번호는 문자열이어야 합니다.' })
  phone?: string;
}
