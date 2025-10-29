import { Controller, Get, Post, Patch, Delete, Body, Param, Res, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { MatService } from './mat.service';
import { CreateMatDto } from './dto/create-mat.dto';
import { UpdateMatDto } from './dto/update-mat.dto';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 매트 컨트롤러
 * 매트 관련 API 엔드포인트 제공
 */
@ApiTags('Mats')
@Controller('mats')
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
  async findAll(@Res() res: Response): Promise<void> {
    try {
      const mats = await this.matService.findAll();
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
   * 특정 매트 조회
   */
  @Get(':idx')
  async findOne(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const mat = await this.matService.findOne(idx);
      sendSuccess(res, '매트 정보를 조회했습니다.', { mat });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '매트 정보 조회 중 오류가 발생했습니다.', status);
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

