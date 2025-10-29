import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 로그인 요청 DTO
 */
export class LoginDto {
  @ApiProperty({ description: '사용자 이름', example: 'testdev' })
  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  name: string;

  @ApiProperty({ description: '비밀번호', example: 'q1w2e3r4' })
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  password: string;
}

