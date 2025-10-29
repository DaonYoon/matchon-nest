import { ApiProperty } from '@nestjs/swagger';

/**
 * 성공 응답 DTO
 */
export class SuccessResponseDto<T = any> {
  @ApiProperty({ description: '성공 여부', example: true })
  success: boolean;

  @ApiProperty({ description: '응답 메시지', example: '요청이 성공적으로 처리되었습니다.' })
  message: string;

  @ApiProperty({ description: '응답 데이터', type: Object })
  data?: T;
}

/**
 * 에러 응답 DTO
 */
export class ErrorResponseDto {
  @ApiProperty({ description: '성공 여부', example: false })
  success: boolean;

  @ApiProperty({ description: '에러 메시지', example: '요청 처리 중 오류가 발생했습니다.' })
  message: string;

  @ApiProperty({ description: '에러 코드 (선택사항)', example: 'INTERNAL_ERROR', required: false })
  code?: string;
}

