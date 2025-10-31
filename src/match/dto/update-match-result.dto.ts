import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 경기 결과 입력 DTO
 */
export class UpdateMatchResultDto {
  @ApiProperty({ description: '승자 idx', example: 1 })
  @IsNotEmpty({ message: '승자 idx는 필수입니다.' })
  @IsNumber({}, { message: '승자 idx는 숫자여야 합니다.' })
  winner_idx: number;

  @ApiPropertyOptional({ description: '선수1 점수', example: 10 })
  @IsOptional()
  @IsNumber({}, { message: '선수1 점수는 숫자여야 합니다.' })
  score_player1?: number;

  @ApiPropertyOptional({ description: '선수2 점수', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: '선수2 점수는 숫자여야 합니다.' })
  score_player2?: number;
}

