import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 사용자 등록 요청 DTO
 */
export class CreateUserDto {
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;

  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  name: string;

  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @IsNotEmpty({ message: '소속은 필수입니다.' })
  @IsString({ message: '소속은 문자열이어야 합니다.' })
  affiliation: string;

  @IsOptional()
  @IsString({ message: '휴대폰 번호는 문자열이어야 합니다.' })
  phone?: string;
}
