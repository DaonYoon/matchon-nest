import { Response } from 'express';
import { HttpStatus } from '@nestjs/common';

/**
 * 공통 응답 인터페이스
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * 성공 응답 전송
 * @param res HTTP 응답 객체
 * @param message 성공 메시지
 * @param data 응답 데이터 (선택사항)
 * @param statusCode HTTP 상태 코드 (기본값: 200)
 */
export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode: number = HttpStatus.OK
): void {
  const response: ApiResponse<T> = {
    success: true,
    message,
  };

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
}

/**
 * 에러 응답 전송
 * @param res HTTP 응답 객체
 * @param message 에러 메시지
 * @param statusCode HTTP 상태 코드 (기본값: 400)
 */
export function sendError(
  res: Response,
  message: string,
  statusCode: number = HttpStatus.BAD_REQUEST
): void {
  const response: ApiResponse = {
    success: false,
    message,
  };

  res.status(statusCode).json(response);
}
