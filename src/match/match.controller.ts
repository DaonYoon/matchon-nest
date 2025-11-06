import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Res,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { MatchService } from "./match.service";
import { MatchGateway } from "./match.gateway";
import { CreateMatchBracketDto } from "./dto/create-match-bracket.dto";
import { UpdateMatchResultDto } from "./dto/update-match-result.dto";
import { UpdateMatchOrderDto } from "./dto/update-match-order.dto";
import { UpdateMatchScoreDto } from "./dto/update-match-score.dto";
import { UpdateMatchDto } from "./dto/update-match.dto";
import { sendSuccess, sendError } from "@/common/utils/response.util";
import { ErrorResponseDto } from "@/common/dto/common-response.dto";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";

/**
 * 경기 컨트롤러
 * 토너먼트 대진표 관련 API 엔드포인트 제공
 */
@ApiTags("Matches")
@Controller("matches")
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    private readonly matchGateway: MatchGateway
  ) {}

  /**
   * 대진표 생성
   */
  @Post("bracket")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "대진표 생성",
    description: "그룹의 선수들을 바탕으로 토너먼트 대진표를 생성합니다.",
  })
  @ApiBody({ type: CreateMatchBracketDto })
  @ApiResponse({ status: 201, description: "대진표 생성 성공" })
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
      sendSuccess(res, "대진표가 생성되었습니다.", matches, HttpStatus.CREATED);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대진표 생성 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 그룹의 대진표 조회
   */
  @Get("group/:competitonIdx/:groupIdx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "competitonIdx",
    description: "대회 idx",
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: "groupIdx",
    description: "그룹 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "그룹 대진표 조회",
    description: "특정 그룹의 토너먼트 대진표를 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "대진표 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findBracketByGroup(
    @Param("competitonIdx", ParseIntPipe) competitonIdx: number,
    @Param("groupIdx", ParseIntPipe) groupIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const matches = await this.matchService.findBracketByGroup(
        competitonIdx,
        groupIdx
      );
      sendSuccess(res, "대진표를 조회했습니다.", matches);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대진표 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 대회별 매트별 경기 목록 조회 (order 낮은 순)
   */
  @Get(":competitionIdx/:matIdx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "competitionIdx",
    description: "대회 idx",
    type: Number,
    example: 1,
  })
  @ApiParam({
    name: "matIdx",
    description: "매트 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "대회별 매트별 경기 목록 조회",
    description:
      "특정 대회의 특정 매트에 해당하는 경기 목록을 order가 낮은 순으로 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "경기 목록 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findByCompetitionAndMat(
    @Param("competitionIdx", ParseIntPipe) competitionIdx: number,
    @Param("matIdx", ParseIntPipe) matIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const matches = await this.matchService.findByCompetitionAndMat(
        competitionIdx,
        matIdx
      );
      sendSuccess(res, "경기 목록을 조회했습니다.", matches);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 목록 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 특정 경기 조회
   */
  @Get(":matchIdx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "matchIdx",
    description: "경기 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "경기 조회",
    description: "특정 경기의 상세 정보를 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "경기 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findOne(
    @Param("matchIdx", ParseIntPipe) matchIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.findOne(matchIdx);
      sendSuccess(res, "경기를 조회했습니다.", match);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 경기 결과 입력
   */
  @Patch(":matchIdx/result")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "matchIdx",
    description: "경기 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "경기 결과 입력",
    description:
      "경기의 승자와 점수를 입력하고 다음 경기로 승자를 진출시킵니다.",
  })
  @ApiBody({ type: UpdateMatchResultDto })
  @ApiResponse({ status: 200, description: "경기 결과 입력 성공" })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async updateMatchResult(
    @Param("matchIdx", ParseIntPipe) matchIdx: number,
    @Body() updateDto: UpdateMatchResultDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.updateMatchResult(
        matchIdx,
        updateDto,
        this.matchGateway
      );
      sendSuccess(res, "경기 결과가 입력되었습니다.", match);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 결과 입력 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 경기 순서 수정
   */
  @Patch(":matchIdx/order")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "matchIdx",
    description: "경기 idx",
    type: Number,
    example: 2,
  })
  @ApiOperation({
    summary: "경기 순서 수정",
    description: "경기의 순서를 수정합니다.",
  })
  @ApiBody({ type: UpdateMatchOrderDto })
  @ApiResponse({ status: 200, description: "경기 순서 수정 성공" })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async updateOrder(
    @Param("matchIdx", ParseIntPipe) matchIdx: number,
    @Body() updateDto: UpdateMatchOrderDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.updateOrder(
        matchIdx,
        updateDto,
        this.matchGateway
      );
      sendSuccess(res, "경기 순서가 수정되었습니다.", match);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 순서 수정 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 경기 점수 수정
   */
  @Patch(":matchIdx/score")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "matchIdx",
    description: "경기 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "경기 점수 수정",
    description: "경기의 점수, 어드밴티지, 패널티를 수정합니다.",
  })
  @ApiBody({ type: UpdateMatchScoreDto })
  @ApiResponse({ status: 200, description: "경기 점수 수정 성공" })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async updateScore(
    @Param("matchIdx", ParseIntPipe) matchIdx: number,
    @Body() updateDto: UpdateMatchScoreDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.updateScore(
        matchIdx,
        updateDto,
        this.matchGateway
      );
      sendSuccess(res, "경기 점수가 수정되었습니다.", match);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 점수 수정 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 경기 정보 수정
   */
  @Patch(":matchIdx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "matchIdx",
    description: "경기 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "경기 정보 수정",
    description: "경기의 모든 정보를 수정합니다. 전달된 필드만 업데이트됩니다.",
  })
  @ApiBody({ type: UpdateMatchDto })
  @ApiResponse({ status: 200, description: "경기 정보 수정 성공" })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async update(
    @Param("matchIdx", ParseIntPipe) matchIdx: number,
    @Body() updateDto: UpdateMatchDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const match = await this.matchService.update(
        matchIdx,
        updateDto,
        this.matchGateway
      );
      sendSuccess(res, "경기 정보가 수정되었습니다.", match);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 정보 수정 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 경기 삭제
   */
  @Delete(":matchIdx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "matchIdx",
    description: "경기 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "경기 삭제",
    description: "특정 경기를 삭제합니다.",
  })
  @ApiResponse({ status: 200, description: "경기 삭제 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async remove(
    @Param("matchIdx", ParseIntPipe) matchIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      await this.matchService.remove(matchIdx);
      sendSuccess(res, "경기가 삭제되었습니다.");
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "경기 삭제 중 오류가 발생했습니다.",
        status
      );
    }
  }
}
