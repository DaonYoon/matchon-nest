import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 경기 점수 수정 DTO
 * 점수, 어드밴티지, 패널티만 업데이트합니다.
 */
export class UpdateMatchScoreDto {
  @ApiPropertyOptional({ description: '선수1 점수', example: 10 })
  @IsOptional()
  @IsNumber({}, { message: '선수1 점수는 숫자여야 합니다.' })
  score_player1?: number;

  @ApiPropertyOptional({ description: '선수2 점수', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: '선수2 점수는 숫자여야 합니다.' })
  score_player2?: number;

  @ApiPropertyOptional({ description: '선수1 어드밴티지', example: 2 })
  @IsOptional()
  @IsNumber({}, { message: '선수1 어드밴티지는 숫자여야 합니다.' })
  advantage_player1?: number;

  @ApiPropertyOptional({ description: '선수2 어드밴티지', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: '선수2 어드밴티지는 숫자여야 합니다.' })
  advantage_player2?: number;

  @ApiPropertyOptional({ description: '선수1 패널티', example: 0 })
  @IsOptional()
  @IsNumber({}, { message: '선수1 패널티는 숫자여야 합니다.' })
  penalty_player1?: number;

  @ApiPropertyOptional({ description: '선수2 패널티', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: '선수2 패널티는 숫자여야 합니다.' })
  penalty_player2?: number;
}

