import { Controller, Get, Post, Patch, Delete, Body, Param, Res, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { PlayerService } from './player.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 선수 컨트롤러
 * 선수 관련 API 엔드포인트 제공
 */
@ApiTags('Players')
@Controller('players')
export class PlayerController {
  constructor(private readonly playerService: PlayerService) {}

  /**
   * 선수 신청
   * 인증 없이 누구나 접근 가능 (공개 신청)
   */
  @Post()
  @ApiOperation({ summary: '선수 신청', description: '대회에 선수로 신청합니다. 인증 없이 누구나 신청 가능합니다.' })
  @ApiResponse({ 
    status: 201, 
    description: '선수가 성공적으로 신청됨',
    schema: {
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '선수가 성공적으로 신청되었습니다.' },
        data: {
          type: 'object',
          properties: {
            player: {
              type: 'object',
              properties: {
                idx: { type: 'number', example: 1 },
                name: { type: 'string', example: '홍길동' },
                team_name: { type: 'string', example: '서울 유도클럽' },
                competition_idx: { type: 'number', example: 1 },
                group_idx: { type: 'number', example: 1 },
                weight: { type: 'string', example: '-70' },
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
    status: 400, 
    description: '잘못된 요청 데이터 또는 중복 지원',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '같은 대회의 같은 그룹의 같은 체급에는 중복 지원이 불가능합니다.' }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '대회 또는 그룹 정보를 찾을 수 없음',
    schema: {
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '대회 정보를 찾을 수 없습니다.' }
      }
    }
  })
  // @UseGuards(JwtAuthGuard) - 공개 신청이므로 인증 불필요
  async create(@Body() createDto: CreatePlayerDto, @Res() res: Response): Promise<void> {
    try {
      const player = await this.playerService.create(createDto);
      sendSuccess(res, '선수가 성공적으로 신청되었습니다.', { player }, HttpStatus.CREATED);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 신청 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 전체 선수 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '전체 선수 목록 조회', description: '신청된 모든 선수 목록을 조회합니다.' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: '페이지 오프셋 (기본값: 0)', example: 0 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 개수 (기본값: 20)', example: 20 })
  @ApiResponse({ status: 200, description: '선수 목록 조회 성공' })
  async findAll(
    @Res() res: Response,
    @Query('offset') offset?: string,
    @Query('limit') limit?: string
  ): Promise<void> {
    try {
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const players = await this.playerService.findAll(offsetNum, limitNum);
      sendSuccess(res, '선수 목록을 조회했습니다.', { players });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 대회별 선수 목록 조회
   */
  @Get('competition/:competitionIdx')
  @ApiOperation({ summary: '대회별 선수 목록 조회', description: '특정 대회에 신청된 선수 목록을 조회합니다.' })
  @ApiParam({ name: 'competitionIdx', description: '대회 idx', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: '선수 목록 조회 성공' })
  async findByCompetition(@Param('competitionIdx', ParseIntPipe) competitionIdx: number, @Res() res: Response): Promise<void> {
    try {
      const players = await this.playerService.findByCompetition(competitionIdx);
      sendSuccess(res, '선수 목록을 조회했습니다.', { players });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 그룹별 선수 목록 조회
   */
  @Get('group/:groupIdx')
  async findByGroup(@Param('groupIdx', ParseIntPipe) groupIdx: number, @Res() res: Response): Promise<void> {
    try {
      const players = await this.playerService.findByGroup(groupIdx);
      sendSuccess(res, '선수 목록을 조회했습니다.', { players });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 목록 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 선수명으로 모든 지원 내역 조회 (다중 지원 확인용)
   */
  @Get('name/:playerName')
  async findByPlayerName(@Param('playerName') playerName: string, @Res() res: Response): Promise<void> {
    try {
      const players = await this.playerService.findByPlayerName(playerName);
      sendSuccess(res, '선수 지원 내역을 조회했습니다.', { players });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 지원 내역 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 특정 선수 조회
   */
  @Get(':idx')
  @ApiOperation({ summary: '선수 상세 조회', description: '특정 선수의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'idx', description: '선수 idx', type: Number, example: 1 })
  @ApiResponse({ status: 200, description: '선수 정보 조회 성공' })
  @ApiResponse({ status: 404, description: '선수를 찾을 수 없음' })
  async findOne(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const player = await this.playerService.findOne(idx);
      sendSuccess(res, '선수 정보를 조회했습니다.', { player });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 정보 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 선수 정보 수정
   */
  @Patch(':idx')
  async update(
    @Param('idx', ParseIntPipe) idx: number,
    @Body() updateDto: UpdatePlayerDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const player = await this.playerService.update(idx, updateDto);
      sendSuccess(res, '선수 정보가 수정되었습니다.', { player });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 정보 수정 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 선수 삭제
   */
  @Delete(':idx')
  async remove(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      await this.playerService.remove(idx);
      sendSuccess(res, '선수가 삭제되었습니다.');
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '선수 삭제 중 오류가 발생했습니다.', status);
    }
  }
}

