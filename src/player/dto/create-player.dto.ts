import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 선수 생성 DTO
 */
export class CreatePlayerDto {
  @ApiProperty({ description: '선수 실명', example: '홍길동' })
  @IsNotEmpty({ message: '선수 이름은 필수입니다.' })
  @IsString({ message: '선수 이름은 문자열이어야 합니다.' })
  name: string;

  @ApiPropertyOptional({ description: '소속팀', example: '서울 유도클럽' })
  @IsOptional()
  @IsString({ message: '소속팀은 문자열이어야 합니다.' })
  team_name?: string;

  @ApiProperty({ description: '소속 대회 idx', example: 1 })
  @IsNotEmpty({ message: '소속 대회 idx는 필수입니다.' })
  competition_idx: number;

  @ApiProperty({ description: '지원 그룹 idx', example: 1 })
  @IsNotEmpty({ message: '지원 그룹 idx는 필수입니다.' })
  group_idx: number;

  @ApiPropertyOptional({ description: '전화번호', example: '010-1234-5678' })
  @IsOptional()
  @IsString({ message: '전화번호는 문자열이어야 합니다.' })
  phone?: string;

  @ApiPropertyOptional({ description: '입금 여부', example: false, default: false })
  @IsOptional()
  is_paid?: boolean;

  @ApiPropertyOptional({ description: '계체 통과 여부', example: false, default: false })
  @IsOptional()
  is_weigh_in_passed?: boolean;
}

