import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { MatStatus } from '../entities/mat.entity';

/**
 * 매트 생성 DTO
 */
export class CreateMatDto {
  @IsNotEmpty({ message: '매트명은 필수입니다.' })
  @IsString({ message: '매트명은 문자열이어야 합니다.' })
  name: string;

  @IsOptional()
  @IsString({ message: '매트 설명은 문자열이어야 합니다.' })
  desc?: string;

  @IsOptional()
  @IsEnum(MatStatus, { message: '올바른 매트 상태가 아닙니다.' })
  status?: MatStatus;

  @IsNotEmpty({ message: '소속 대회 idx는 필수입니다.' })
  competition_idx: number;
}

