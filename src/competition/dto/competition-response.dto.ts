import { ApiProperty } from '@nestjs/swagger';
import { SuccessResponseDto } from '@/common/dto/common-response.dto';

/**
 * 대회 응답 DTO
 */
export class CompetitionResponseDto extends SuccessResponseDto {
  @ApiProperty({
    description: '대회 정보',
    example: {
      idx: 1,
      name: '2024 전국 유도 선수권대회',
      description: '2024년 전국 유도 선수권대회입니다.',
      thumbnail: 's3://matchons3/contest_thumbnail/1/abc123-image.jpg',
      region: '서울',
      type: 'championship',
      master_idx: 1,
      start_date: '2024-06-01',
      request_start_date: '2024-05-01',
      request_end_date: '2024-05-31',
      status: 'registration',
      is_show_player: true,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z',
    },
  })
  data: {
    idx: number;
    name: string;
    description?: string;
    thumbnail?: string;
    region: string;
    type: string;
    master_idx: number;
    start_date: string;
    request_start_date?: string;
    request_end_date?: string;
    status: string;
    is_show_player: boolean;
    created_at: Date;
    updated_at: Date;
  };
}

/**
 * 대회 목록 응답 DTO
 */
export class CompetitionListResponseDto extends SuccessResponseDto {
  @ApiProperty({
    description: '대회 목록',
    type: 'array',
    example: [
      {
        idx: 1,
        name: '2024 전국 유도 선수권대회',
        description: '대회 설명...',
        region: '서울',
        type: 'championship',
        status: 'registration',
        start_date: '2024-06-01',
        request_start_date: '2024-05-01',
        request_end_date: '2024-05-31',
        is_show_player: true,
        created_at: '2024-01-01T00:00:00.000Z',
      },
    ],
  })
  data: Array<{
    idx: number;
    name: string;
    description?: string;
    region: string;
    type: string;
    status: string;
    start_date: string;
    request_start_date?: string;
    request_end_date?: string;
    is_show_player: boolean;
    created_at: Date;
  }>;
}

