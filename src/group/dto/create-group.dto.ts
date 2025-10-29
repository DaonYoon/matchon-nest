import { IsNotEmpty, IsString, IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';

/**
 * 그룹 생성 DTO
 */
export class CreateGroupDto {
  @IsNotEmpty({ message: '그룹명은 필수입니다.' })
  @IsString({ message: '그룹명은 문자열이어야 합니다.' })
  name: string;

  @IsNotEmpty({ message: '체급 목록은 필수입니다.' })
  @IsArray({ message: '체급 목록은 배열이어야 합니다.' })
  @ArrayNotEmpty({ message: '체급 목록은 최소 1개 이상이어야 합니다.' })
  @IsString({ each: true, message: '체급은 문자열이어야 합니다.' })
  weight_classes: string[];

  @IsNotEmpty({ message: '소속 대회 idx는 필수입니다.' })
  competition_idx: number;

  @IsOptional()
  mat_idx?: number | null;
}

