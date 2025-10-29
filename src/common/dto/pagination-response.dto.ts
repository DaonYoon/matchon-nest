import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 응답 DTO
 */
export class PaginationResponseDto<T> {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '응답 메시지', example: '데이터를 성공적으로 조회했습니다.' })
  message: string;

  @ApiProperty({ description: '데이터 배열', type: Array, isArray: true })
  data: T[];

  @ApiProperty({ description: '전체 개수', example: 100 })
  total?: number;

  @ApiProperty({ description: '현재 페이지', example: 1 })
  page?: number;

  @ApiProperty({ description: '페이지 크기', example: 10 })
  limit?: number;
}

