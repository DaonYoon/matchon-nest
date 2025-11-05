import { IsOptional, IsNumber, IsEnum, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '../entities/match.entity';

/**
 * 경기 정보 수정 DTO
 * 전달된 필드만 업데이트됩니다.
 */
export class UpdateMatchDto {
  @ApiPropertyOptional({ description: '선수1 idx', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: '선수1 idx는 숫자여야 합니다.' })
  player1_idx?: number;

  @ApiPropertyOptional({ description: '선수2 idx', example: 2 })
  @IsOptional()
  @IsNumber({}, { message: '선수2 idx는 숫자여야 합니다.' })
  player2_idx?: number;

  @ApiPropertyOptional({ description: '승자 idx', example: 1 })
  @IsOptional()
  @IsNumber({}, { message: '승자 idx는 숫자여야 합니다.' })
  winner_idx?: number;

  @ApiPropertyOptional({ description: '경기 상태', enum: MatchStatus, example: MatchStatus.IN_PROGRESS })
  @IsOptional()
  @IsEnum(MatchStatus, { message: '올바른 경기 상태가 아닙니다.' })
  status?: MatchStatus;

  @ApiPropertyOptional({ description: '다음 경기 idx', example: 10 })
  @IsOptional()
  @IsNumber({}, { message: '다음 경기 idx는 숫자여야 합니다.' })
  next_match_idx?: number;

  @ApiPropertyOptional({ description: '선수1 점수', example: 10 })
  @IsOptional()
  @IsNumber({}, { message: '선수1 점수는 숫자여야 합니다.' })
  score_player1?: number;

  @ApiPropertyOptional({ description: '선수2 점수', example: 5 })
  @IsOptional()
  @IsNumber({}, { message: '선수2 점수는 숫자여야 합니다.' })
  score_player2?: number;

  @ApiPropertyOptional({ description: '경기 순서', example: 2 })
  @IsOptional()
  @IsNumber({}, { message: '경기 순서는 숫자여야 합니다.' })
  order?: number;

  @ApiPropertyOptional({ description: '경기 결과 (텍스트, 최대 50자)', example: '판정승' })
  @IsOptional()
  @IsString({ message: '경기 결과는 문자열이어야 합니다.' })
  @MaxLength(50, { message: '경기 결과는 최대 50자까지 입력 가능합니다.' })
  result?: string;

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

