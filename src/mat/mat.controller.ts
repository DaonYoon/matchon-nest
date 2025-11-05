import { Controller, Get, Post, Patch, Delete, Body, Param, Res, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { MatService } from './mat.service';
import { CreateMatDto } from './dto/create-mat.dto';
import { UpdateMatDto } from './dto/update-mat.dto';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 매트 컨트롤러
 * 매트 관련 API 엔드포인트 제공
 */
@ApiTags('Mat')
@Controller('mat')
export class MatController {
  constructor(private readonly matService: MatService) {}

  /**
   * 매트 생성
   */
  @Post()
  async create(@Body() createDto: CreateMatDto, @Res() res: Response): Promise<void> {
    try {
      const mat = await this.matService.create(createDto);
      sendSuccess(res, '매트가 성공적으로 생성되었습니다.', { mat }, HttpStatus.CREATED);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 생성 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 전체 매트 목록 조회
   */
  @Get()
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '페이지 오프셋 (기본값: 0)', example: 0 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 개수 (기본값: 20)', example: 20 })
  async findAll(
    @Res() res: Response,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<void> {
    try {
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const mats = await this.matService.findAll(offsetNum, limitNum);
      sendSuccess(res, '매트 목록을 조회했습니다.', { mats });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 대회별 매트 목록 조회
   */
  @Get('competition/:competitionIdx')
  async findByCompetition(@Param('competitionIdx', ParseIntPipe) competitionIdx: number, @Res() res: Response): Promise<void> {
    try {
      const mats = await this.matService.findByCompetition(competitionIdx);
      sendSuccess(res, '매트 목록을 조회했습니다.', { mats });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 특정 매트 조회 (그룹 정보 포함)
   */
  @Get(':idx')
  async findOne(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const mat = await this.matService.findOne(idx);
      sendSuccess(res, '매트 정보를 조회했습니다.', mat);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 정보 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 매트의 모든 경기 리스트 조회
   */
  @Get(':idx/matches')
  @ApiOperation({
    summary: '매트 경기 목록 조회',
    description: '특정 매트에 배정된 모든 그룹의 경기 목록을 조회합니다.',
  })
  @ApiParam({ name: 'idx', description: '매트 idx', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: '경기 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '매트를 찾을 수 없음' })
  async findMatchesByMat(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const matches = await this.matService.findMatchesByMat(idx);
      sendSuccess(res, '경기 목록을 조회했습니다.', matches);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '경기 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 매트 수정
   */
  @Patch(':idx')
  async update(
    @Param('idx', ParseIntPipe) idx: number,
    @Body() updateDto: UpdateMatDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const mat = await this.matService.update(idx, updateDto);
      sendSuccess(res, '매트 정보가 수정되었습니다.', { mat });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 정보 수정 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 매트 삭제
   */
  @Delete(':idx')
  async remove(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      await this.matService.remove(idx);
      sendSuccess(res, '매트가 삭제되었습니다.');
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 삭제 중 오류가 발생했습니다.', status);
    }
  }
}

