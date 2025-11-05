import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 비밀키 확인 DTO
 */
export class CheckCodeDto {
  @ApiProperty({ description: '비밀키 코드', example: '123456' })
  @IsNotEmpty({ message: '코드는 필수입니다.' })
  @IsString({ message: '코드는 문자열이어야 합니다.' })
  code: string;
}

