import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 경기 순서 수정 DTO
 */
export class UpdateMatchOrderDto {
  @ApiProperty({ description: '매트 idx', example: 5 })
  @IsNotEmpty({ message: '매트 idx는 필수입니다.' })
  @IsNumber({}, { message: '매트 idx는 숫자여야 합니다.' })
  mat_idx: number;

  @ApiPropertyOptional({ description: '경기 idx (URL 파라미터와 중복되지만 요청 바디에 포함될 수 있음)', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: '경기 idx는 숫자여야 합니다.' })
  match_idx?: number;

  @ApiPropertyOptional({ description: '경기 순서', example: 2 })
  @IsOptional()
  @IsNumber({}, { message: '경기 순서는 숫자여야 합니다.' })
  order?: number;
}

