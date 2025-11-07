// create-competition.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from "class-validator";
import { CompetitionStatus } from "../entities/competition.entity";

export class CreateCompetitionDto {
  @ApiProperty({ example: "2025 부산오픈 주짓수 챔피언십" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: "부산 지역 커뮤니티 중심 대회 소개문..." })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: "부산" })
  @IsString()
  region!: string;

  @ApiProperty({ example: "유도, 주짓수" })
  @IsString()
  type!: string;

  @ApiProperty({ example: "대회장 주소소" })
  @IsString()
  address!: string;

  // 토큰에서 덮어씌울 값(요청 바디에 와도 무시)
  @IsOptional() @IsInt() @Min(1) master_idx?: number;

  @ApiProperty({ example: "2025-06-01" })
  @IsDateString()
  start_date!: string; // ISO 날짜 문자열

  @ApiProperty({ example: "2025-05-01" })
  @IsDateString()
  request_start_date!: string;

  @ApiProperty({ example: "2025-05-31" })
  @IsDateString()
  request_end_date!: string;

  // 대회 상태 (기본값: 접수 중)
  @ApiProperty({
    example: CompetitionStatus.REGISTRATION,
    enum: CompetitionStatus,
    default: CompetitionStatus.REGISTRATION,
  })
  @IsOptional()
  @IsEnum(CompetitionStatus)
  status: CompetitionStatus = CompetitionStatus.REGISTRATION;

  // 썸네일 URL (멀티파트 업로드 이후 값이 들어옴)
  @ApiPropertyOptional({
    example: "https://cdn.matchon.io/sample-thumbnail.jpg",
  })
  @IsOptional()
  @IsString()
  thumbnail?: string;

  // 선수 목록 공개 여부 (기본값: false)
  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  is_show_player?: boolean = false;

  // 대진표 공개 여부 (기본값: false)
  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  is_show_bracket?: boolean = false;
}

// multipart 전용 DTO(스웨거 노출용)
export class CreateCompetitionMultipartDto extends CreateCompetitionDto {
  @ApiPropertyOptional({ type: "string", format: "binary" })
  thumbnail?: any; // swagger 표시 목적
}
