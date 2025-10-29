import { IsOptional, IsString, IsEnum } from 'class-validator';
import { MatStatus } from '../entities/mat.entity';

/**
 * 매트 수정 DTO
 */
export class UpdateMatDto {
  @IsOptional()
  @IsString({ message: '매트명은 문자열이어야 합니다.' })
  name?: string;

  @IsOptional()
  @IsString({ message: '매트 설명은 문자열이어야 합니다.' })
  desc?: string;

  @IsOptional()
  @IsEnum(MatStatus, { message: '올바른 매트 상태가 아닙니다.' })
  status?: MatStatus;
}

