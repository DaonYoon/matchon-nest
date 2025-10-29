import { Controller, Get, Post, Patch, Delete, Body, Param, Res, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { CompetitionService } from './competition.service';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { sendSuccess, sendError } from '@/common/utils/response.util';
import { SuccessResponseDto, ErrorResponseDto } from '@/common/dto/common-response.dto';
import { Competition } from './entities/competition.entity';

/**
 * 대회 컨트롤러
 * 대회 관련 API 엔드포인트 제공
 */
@ApiTags('Competitions')
@Controller('competitions')
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  /**
   * 대회 생성
   */
  @Post()
  @ApiOperation({ summary: '대회 생성', description: '새로운 대회를 등록합니다. 주최자 정보는 필수입니다.' })
  @ApiResponse({ 
    status: 201, 
    description: '대회가 성공적으로 생성됨',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '대회가 성공적으로 생성되었습니다.' },
        data: {
          type: 'object',
          properties: {
            competition: {
              type: 'object',
              properties: {
                idx: { type: 'number', example: 1 },
                name: { type: 'string', example: '2024 전국 유도 선수권대회' },
                description: { type: 'string', example: '2024년 전국 유도 선수권대회입니다.\n수많은 유도인의 참여를 기다립니다.' },
                region: { type: 'string', example: '서울' },
                type: { type: 'string', example: 'championship' },
                master_idx: { type: 'number', example: 1 },
                start_date: { type: 'string', example: '2024-06-01' },
                status: { type: 'string', example: 'registration' },
                created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                updated_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 데이터',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '주최자 정보를 찾을 수 없습니다.' }
      }
    }
  })
  async create(@Body() createDto: CreateCompetitionDto, @Res() res: Response): Promise<void> {
    try {
      const competition = await this.competitionService.create(createDto);
      sendSuccess(res, '대회가 성공적으로 생성되었습니다.', { competition }, HttpStatus.CREATED);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '대회 생성 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 전체 대회 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '전체 대회 목록 조회', description: '등록된 모든 대회 목록을 조회합니다.' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '페이지 오프셋 (기본값: 0)', example: 0 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 개수 (기본값: 20)', example: 20 })
  @ApiResponse({ 
    status: 200, 
    description: '대회 목록 조회 성공',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '대회 목록을 조회했습니다.' },
        data: {
          type: 'object',
          properties: {
            competitions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  idx: { type: 'number', example: 1 },
                  name: { type: 'string', example: '2024 전국 유도 선수권대회' },
                  description: { type: 'string', example: '대회 설명...' },
                  region: { type: 'string', example: '서울' },
                  type: { type: 'string', example: 'championship' },
                  status: { type: 'string', example: 'registration' },
                  start_date: { type: 'string', example: '2024-06-01' },
                  created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
                }
              }
            }
          }
        }
      }
    }
  })
  async findAll(
    @Res() res: Response,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<void> {
    try {
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const competitions = await this.competitionService.findAll(offsetNum, limitNum);
      sendSuccess(res, '대회 목록을 조회했습니다.', { competitions });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '대회 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 주최자별 대회 목록 조회
   */
  @Get('master/:masterIdx')
  @ApiOperation({ summary: '주최자별 대회 목록 조회', description: '특정 주최자의 대회 목록을 조회합니다.' })
  @ApiParam({ name: 'masterIdx', description: '주최자 idx', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: '대회 목록 조회 성공' })
  async findByMaster(@Param('masterIdx', ParseIntPipe) masterIdx: number, @Res() res: Response): Promise<void> {
    try {
      const competitions = await this.competitionService.findByMaster(masterIdx);
      sendSuccess(res, '대회 목록을 조회했습니다.', { competitions });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '대회 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 특정 대회 조회
   */
  @Get(':idx')
  @ApiOperation({ summary: '대회 상세 조회', description: '특정 대회의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'idx', description: '대회 idx', type: Number, example: 1 })
  @ApiResponse({ 
    status: 200, 
    description: '대회 정보 조회 성공',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '대회 정보를 조회했습니다.' },
        data: {
          type: 'object',
          properties: {
            competition: {
              type: 'object',
              properties: {
                idx: { type: 'number', example: 1 },
                name: { type: 'string', example: '2024 전국 유도 선수권대회' },
                description: { type: 'string', example: '대회 설명...' },
                region: { type: 'string', example: '서울' },
                type: { type: 'string', example: 'championship' },
                master_idx: { type: 'number', example: 1 },
                start_date: { type: 'string', example: '2024-06-01' },
                status: { type: 'string', example: 'registration' },
                created_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
                updated_at: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '대회를 찾을 수 없음',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '대회 정보를 찾을 수 없습니다.' }
      }
    }
  })
  async findOne(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const competition = await this.competitionService.findOne(idx);
      sendSuccess(res, '대회 정보를 조회했습니다.', { competition });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '대회 정보 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 대회 수정
   */
  @Patch(':idx')
  @ApiOperation({ summary: '대회 수정', description: '대회 정보를 수정합니다.' })
  @ApiParam({ name: 'idx', description: '대회 idx', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: '대회 수정 성공' })
  @ApiResponse({ status: 404, description: '대회를 찾을 수 없음' })
  async update(
    @Param('idx', ParseIntPipe) idx: number,
    @Body() updateDto: UpdateCompetitionDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const competition = await this.competitionService.update(idx, updateDto);
      sendSuccess(res, '대회 정보가 수정되었습니다.', { competition });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '대회 정보 수정 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 대회 삭제
   */
  @Delete(':idx')
  @ApiOperation({ summary: '대회 삭제', description: '대회를 삭제합니다. 관련된 매트, 그룹, 선수도 함께 삭제됩니다.' })
  @ApiParam({ name: 'idx', description: '대회 idx', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: '대회 삭제 성공' })
  @ApiResponse({ status: 404, description: '대회를 찾을 수 없음' })
  async remove(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      await this.competitionService.remove(idx);
      sendSuccess(res, '대회가 삭제되었습니다.');
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '대회 삭제 중 오류가 발생했습니다.', status);
    }
  }
}

