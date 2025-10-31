import { Controller, Get, Post, Patch, Delete, Body, Param, Res, HttpStatus, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { MatchService } from './match.service';
import { CreateMatchBracketDto } from './dto/create-match-bracket.dto';
import { UpdateMatchResultDto } from './dto/update-match-result.dto';
import { UpdateMatchOrderDto } from './dto/update-match-order.dto';
import { sendSuccess, sendError } from '@/common/utils/response.util';
import { ErrorResponseDto } from '@/common/dto/common-response.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

/**
 * 경기 컨트롤러
 * 토너먼트 대진표 관련 API 엔드포인트 제공
 */
@ApiTags('Matches')
@Controller('matches')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  /**
   * 대진표 생성
   */
  @Post('bracket')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '대진표 생성',
    description: '그룹의 선수들을 바탕으로 토너먼트 대진표를 생성합니다.',
  })
  @ApiBody({ type: CreateMatchBracketDto })
  @ApiResponse({ status: 201, description: '대진표 생성 성공' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async createBracket(
    @Body() createDto: CreateMatchBracketDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const matches = await this.matchService.createBracket(createDto);
      sendSuccess(res, '대진표가 생성되었습니다.', { data: matches }, HttpStatus.CREATED);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || '대진표 생성 중 오류가 발생했습니다.',
        status
      );
    }
  }

  /**
   * 그룹의 대진표 조회
   */
  @Get('group/:groupIdx')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'groupIdx', description: '그룹 idx', type: Number, example: 1 })
  @ApiOperation({
    summary: '그룹 대진표 조회',
    description: '특정 그룹의 토너먼트 대진표를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '대진표 조회 성공' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findBracketByGroup(
    @Param('groupIdx', ParseIntPipe) groupIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const matches = await this.matchService.findBracketByGroup(groupIdx);
      sendSuccess(res, '대진표를 조회했습니다.', { data: matches });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || '대진표 조회 중 오류가 발생했습니다.',
        status
      );
    }
  }

  /**
   * 경기 결과 입력
   */
  @Patch(':matchIdx/result')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'matchIdx', description: '경기 idx', type: Number, example: 1 })
  @ApiOperation({
    summary: '경기 결과 입력',
    description: '경기의 승자와 점수를 입력하고 다음 경기로 승자를 진출시킵니다.',
  })
  @ApiBody({ type: UpdateMatchResultDto })
  @ApiResponse({ status: 200, description: '경기 결과 입력 성공' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async updateMatchResult(
    @Param('matchIdx', ParseIntPipe) matchIdx: number,
    @Body() updateDto: UpdateMatchResultDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.updateMatchResult(matchIdx, updateDto);
      sendSuccess(res, '경기 결과가 입력되었습니다.', { data: match });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || '경기 결과 입력 중 오류가 발생했습니다.',
        status
      );
    }
  }

  /**
   * 경기 순서 수정
   */
  @Patch(':matchIdx/order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'matchIdx', description: '경기 idx', type: Number, example: 2 })
  @ApiOperation({
    summary: '경기 순서 수정',
    description: '경기의 순서를 수정합니다.',
  })
  @ApiBody({ type: UpdateMatchOrderDto })
  @ApiResponse({ status: 200, description: '경기 순서 수정 성공' })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async updateOrder(
    @Param('matchIdx', ParseIntPipe) matchIdx: number,
    @Body() updateDto: UpdateMatchOrderDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.updateOrder(matchIdx, updateDto);
      sendSuccess(res, '경기 순서가 수정되었습니다.', { data: match });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || '경기 순서 수정 중 오류가 발생했습니다.',
        status
      );
    }
  }

  /**
   * 경기 삭제
   */
  @Delete(':matchIdx')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiParam({ name: 'matchIdx', description: '경기 idx', type: Number, example: 1 })
  @ApiOperation({
    summary: '경기 삭제',
    description: '특정 경기를 삭제합니다.',
  })
  @ApiResponse({ status: 200, description: '경기 삭제 성공' })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async remove(
    @Param('matchIdx', ParseIntPipe) matchIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      await this.matchService.remove(matchIdx);
      sendSuccess(res, '경기가 삭제되었습니다.');
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || '경기 삭제 중 오류가 발생했습니다.',
        status
      );
    }
  }
}

