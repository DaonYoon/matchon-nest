import { IsNotEmpty, IsString, IsEnum, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompetitionStatus } from '../entities/competition.entity';

/**
 * 대회 생성 DTO
 */
export class CreateCompetitionDto {
  @ApiProperty({ description: '대회명', example: '2024 전국 유도 선수권대회' })
  @IsNotEmpty({ message: '대회명은 필수입니다.' })
  @IsString({ message: '대회명은 문자열이어야 합니다.' })
  name: string;

  @ApiPropertyOptional({ description: '대회 설명', example: '2024년 전국 유도 선수권대회입니다.\n수많은 유도인의 참여를 기다립니다.' })
  @IsOptional()
  @IsString({ message: '대회 설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiProperty({ description: '지역', example: '서울' })
  @IsNotEmpty({ message: '지역은 필수입니다.' })
  @IsString({ message: '지역은 문자열이어야 합니다.' })
  region: string;

  @ApiProperty({ description: '대회 타입', example: 'championship' })
  @IsNotEmpty({ message: '대회 타입은 필수입니다.' })
  @IsString({ message: '대회 타입은 문자열이어야 합니다.' })
  type: string;

  @ApiProperty({ description: '주최자 유저 idx', example: 1 })
  @IsNotEmpty({ message: '주최자 idx는 필수입니다.' })
  master_idx: number;

  @ApiProperty({ description: '대회 시작일 (YYYY-MM-DD)', example: '2024-06-01' })
  @IsNotEmpty({ message: '대회 시작일은 필수입니다.' })
  @IsString({ message: '대회 시작일은 문자열이어야 합니다.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '올바른 날짜 형식이 아닙니다. YYYY-MM-DD 형식으로 입력해주세요.' })
  start_date: string;

  @ApiPropertyOptional({ description: '접수 시작일 (YYYY-MM-DD)', example: '2024-05-01' })
  @IsOptional()
  @IsString({ message: '접수 시작일은 문자열이어야 합니다.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '올바른 날짜 형식이 아닙니다. YYYY-MM-DD 형식으로 입력해주세요.' })
  request_start_date?: string;

  @ApiPropertyOptional({ description: '접수 마감일 (YYYY-MM-DD)', example: '2024-05-31' })
  @IsOptional()
  @IsString({ message: '접수 마감일은 문자열이어야 합니다.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '올바른 날짜 형식이 아닙니다. YYYY-MM-DD 형식으로 입력해주세요.' })
  request_end_date?: string;

  @ApiPropertyOptional({ description: '대회 상태', enum: CompetitionStatus, example: CompetitionStatus.REGISTRATION, default: CompetitionStatus.REGISTRATION })
  @IsOptional()
  @IsEnum(CompetitionStatus, { message: '올바른 대회 상태가 아닙니다.' })
  status?: CompetitionStatus;
}

