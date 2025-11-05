import { Controller, Get, Post, Patch, Delete, Body, Param, Res, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { GroupService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 그룹 컨트롤러
 * 그룹 관련 API 엔드포인트 제공
 */
@ApiTags('Group')
@Controller('group')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * 그룹 생성
   */
  @Post()
  async create(@Body() createDto: CreateGroupDto, @Res() res: Response): Promise<void> {
    try {
      const group = await this.groupService.create(createDto);
      sendSuccess(res, '그룹이 성공적으로 생성되었습니다.', { group }, HttpStatus.CREATED);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 생성 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 전체 그룹 목록 조회
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
      const groups = await this.groupService.findAll(offsetNum, limitNum);
      sendSuccess(res, '그룹 목록을 조회했습니다.', { groups });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 대회별 그룹 목록 조회
   */
  @Get('competition/:competitionIdx')
  async findByCompetition(@Param('competitionIdx', ParseIntPipe) competitionIdx: number, @Res() res: Response): Promise<void> {
    try {
      const groups = await this.groupService.findByCompetition(competitionIdx);
      sendSuccess(res, '그룹 목록을 조회했습니다.',  groups );
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 매트별 그룹 목록 조회
   */
  @Get('mat/:matIdx')
  async findByMat(@Param('matIdx', ParseIntPipe) matIdx: number, @Res() res: Response): Promise<void> {
    try {
      const groups = await this.groupService.findByMat(matIdx);
      sendSuccess(res, '그룹 목록을 조회했습니다.',  groups );
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 특정 그룹 조회
   */
  @Get(':idx')
  async findOne(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const group = await this.groupService.findOne(idx);
      sendSuccess(res, '그룹 정보를 조회했습니다.',  group );
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 정보 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 그룹 수정
   */
  @Patch(':idx')
  async update(
    @Param('idx', ParseIntPipe) idx: number,
    @Body() updateDto: UpdateGroupDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const group = await this.groupService.update(idx, updateDto);
      sendSuccess(res, '그룹 정보가 수정되었습니다.',  group );
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 정보 수정 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 그룹 삭제
   */
  @Delete(':idx')
  async remove(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      await this.groupService.remove(idx);
      sendSuccess(res, '그룹이 삭제되었습니다.');
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '그룹 삭제 중 오류가 발생했습니다.', status);
    }
  }
}

