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
  @IsArray({ message: '체급 목록은 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '체급 목록은 최소 1개 이상이어야 합니다.' })
  @IsString({ each: true, message: '체급은 문자열이어야 합니다.' })
  weight_classes?: string[];

  @IsOptional()
  mat_idx?: number | null;

  @ApiPropertyOptional({ description: '경기 시간 (분 단위)', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: '경기 시간은 숫자여야 합니다.' })
  match_time?: number;
}

