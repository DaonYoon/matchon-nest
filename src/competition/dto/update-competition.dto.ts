import { IsOptional, IsString, IsEnum, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CompetitionStatus } from '../entities/competition.entity';

/**
 * 대회 수정 DTO
 */
export class UpdateCompetitionDto {
  @ApiPropertyOptional({ description: '대회명', example: '2024 전국 유도 선수권대회' })
  @IsOptional()
  @IsString({ message: '대회명은 문자열이어야 합니다.' })
  name?: string;

  @ApiPropertyOptional({ description: '대회 설명', example: '2024년 전국 유도 선수권대회입니다.\n수많은 유도인의 참여를 기다립니다.' })
  @IsOptional()
  @IsString({ message: '대회 설명은 문자열이어야 합니다.' })
  description?: string;

  @ApiPropertyOptional({ description: '지역', example: '서울' })
  @IsOptional()
  @IsString({ message: '지역은 문자열이어야 합니다.' })
  region?: string;

  @ApiPropertyOptional({ description: '대회 타입', example: 'championship' })
  @IsOptional()
  @IsString({ message: '대회 타입은 문자열이어야 합니다.' })
  type?: string;

  @ApiPropertyOptional({ description: '대회 시작일 (YYYY-MM-DD)', example: '2024-06-01' })
  @IsOptional()
  @IsString({ message: '대회 시작일은 문자열이어야 합니다.' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: '올바른 날짜 형식이 아닙니다. YYYY-MM-DD 형식으로 입력해주세요.' })
  start_date?: string;

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

  @ApiPropertyOptional({ description: '대회 상태', enum: CompetitionStatus, example: CompetitionStatus.CLOSED })
  @IsOptional()
  @IsEnum(CompetitionStatus, { message: '올바른 대회 상태가 아닙니다.' })
  status?: CompetitionStatus;

  @ApiPropertyOptional({ description: '썸네일 이미지 URL', example: 'https://matchons3.s3.ap-northeast-2.amazonaws.com/contest_thumbnail/1/abc123.jpg' })
  @IsOptional()
  @IsString({ message: '썸네일은 문자열이어야 합니다.' })
  thumbnail?: string;

  @ApiPropertyOptional({ description: '참가자 명단 표시 여부', example: true })
  @IsOptional()
  is_show_player?: boolean;
}

