import { IsOptional, IsString, IsArray, ArrayNotEmpty, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 그룹 수정 DTO
 */
export class UpdateGroupDto {
  @IsOptional()
  @IsString({ message: '그룹명은 문자열이어야 합니다.' })
  name?: string;


  @IsOptional()
  mat_idx?: number | null;

  @ApiPropertyOptional({ description: '경기 시간 (분 단위)', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: '경기 시간은 숫자여야 합니다.' })
  match_time?: number;
}

