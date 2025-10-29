import { IsOptional, IsString } from 'class-validator';

/**
 * 선수 수정 DTO
 */
export class UpdatePlayerDto {
  @IsOptional()
  @IsString({ message: '선수 이름은 문자열이어야 합니다.' })
  name?: string;

  @IsOptional()
  @IsString({ message: '소속팀은 문자열이어야 합니다.' })
  team_name?: string;

  @IsOptional()
  competition_idx?: number;

  @IsOptional()
  group_idx?: number;

  @IsOptional()
  @IsString({ message: '체급은 문자열이어야 합니다.' })
  weight?: string;
}

