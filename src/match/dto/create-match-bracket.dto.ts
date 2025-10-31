import { IsNotEmpty, IsNumber, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 대진표 생성 시 선수 배치 정보
 */
export class PlayerBracketItem {
  @ApiProperty({ description: '선수 idx', example: 1 })
  @IsNotEmpty({ message: '선수 idx는 필수입니다.' })
  @IsNumber({}, { message: '선수 idx는 숫자여야 합니다.' })
  player_idx: number;

  @ApiProperty({ description: '시드 번호 (1부터 시작)', example: 1 })
  @IsNotEmpty({ message: '시드 번호는 필수입니다.' })
  @IsNumber({}, { message: '시드 번호는 숫자여야 합니다.' })
  seed: number;
}

/**
 * 대진표 생성 요청 DTO
 * 프론트에서 선수 목록과 시드 정보를 받아서 토너먼트 대진표를 생성
 */
export class CreateMatchBracketDto {
  @ApiProperty({ description: '그룹 idx', example: 1 })
  @IsNotEmpty({ message: '그룹 idx는 필수입니다.' })
  @IsNumber({}, { message: '그룹 idx는 숫자여야 합니다.' })
  group_idx: number;

  @ApiProperty({ 
    description: '선수 배치 정보 배열',
    type: [PlayerBracketItem],
    example: [
      { player_idx: 1, seed: 1 },
      { player_idx: 2, seed: 2 },
      { player_idx: 3, seed: 3 },
      { player_idx: 4, seed: 4 },
    ]
  })
  @IsNotEmpty({ message: '선수 배치 정보는 필수입니다.' })
  @IsArray({ message: '선수 배치 정보는 배열이어야 합니다.' })
  @ArrayMinSize(2, { message: '최소 2명의 선수가 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => PlayerBracketItem)
  players: PlayerBracketItem[];
}

