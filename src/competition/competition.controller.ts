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
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from "@nestjs/swagger";
import { Response, Request } from "express";
import { CompetitionService } from "./competition.service";
import {
  CreateCompetitionDto,
  CreateCompetitionMultipartDto,
} from "./dto/create-competition.dto";
import { UpdateCompetitionDto } from "./dto/update-competition.dto";
import { CheckCodeDto } from "./dto/check-code.dto";
import { sendSuccess, sendError } from "@/common/utils/response.util";
import {
  SuccessResponseDto,
  ErrorResponseDto,
} from "@/common/dto/common-response.dto";
import { Competition } from "./entities/competition.entity";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { MultipartCoercionPipe } from "@/pipes/multipart-coerction.pipe";

/**
 * 대회 컨트롤러
 * 대회 관련 API 엔드포인트 제공
 */
@ApiTags("Competitions")
@Controller("competitions")
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  /**
   * 대회 생성
   */

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(FileInterceptor("thumbnail"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "대회 생성",
    description: "새로운 대회를 등록합니다. 주최자 정보는 필수입니다.",
  })
  @ApiBody({ type: CreateCompetitionMultipartDto })
  @ApiResponse({ status: 201, description: "대회가 성공적으로 생성됨" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 401, description: "인증 실패" })
  async create(
    @Req() req: Request,
    @Body(new MultipartCoercionPipe()) body: CreateCompetitionDto,
    @UploadedFile()
    thumbnail: Express.Multer.File | undefined,
    @Res() res: Response
  ): Promise<void> {
    try {
     
      // 토큰에서 주최자 ID 강제 지정
      const tokenPayload = (req as any).user;
      body.master_idx = tokenPayload?.sub;

      const competition = await this.competitionService.create(body, thumbnail);

      sendSuccess(
        res,
        "대회가 성공적으로 생성되었습니다.",
        { competition },
        HttpStatus.CREATED
      );
    } catch (error: any) {
      console.log(error)
      sendError(
        res,
        error?.message || "대회 생성 중 오류가 발생했습니다.",
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 전체 대회 목록 조회 (공개)
   */
  @Get()
  @ApiOperation({
    summary: "대회 목록 조회",
    description: "전체 대회 목록을 공개적으로 조회합니다.",
  })
  @ApiQuery({
    name: "offset",
    required: false,
    type: Number,
    description: "페이지 오프셋 (기본값: 0)",
    example: 0,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "페이지당 개수 (기본값: 20)",
    example: 20,
  })
  @ApiResponse({ status: 200, description: "대회 목록 조회 성공" })
  async findAll(
    @Res() res: Response,
    @Query("offset") offset?: string,
    @Query("limit") limit?: string
  ): Promise<void> {
    try {
      // 쿼리 파라미터 파싱 (NaN 체크 포함)
      const offsetNum =
        offset && !isNaN(parseInt(offset, 10)) ? parseInt(offset, 10) : 0;
      const limitNum =
        limit && !isNaN(parseInt(limit, 10)) ? parseInt(limit, 10) : 20;

      // limit 최대값 제한 (보안)
      const finalLimit = limitNum > 100 ? 100 : limitNum;
      const finalOffset = offsetNum < 0 ? 0 : offsetNum;

      const competitions = await this.competitionService.findAllPublic(
        finalOffset,
        finalLimit
      );
      sendSuccess(res, "대회 목록을 조회했습니다.", competitions);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대회 목록 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 주최자별 대회 목록 조회 (현재 로그인한 사용자의 대회 목록)
   */
  @Get("master")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "내 대회 목록 조회",
    description:
      "JWT 토큰에서 사용자 정보를 추출하여 현재 로그인한 사용자의 대회 목록을 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "대회 목록 조회 성공" })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findByMaster(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      // JWT 토큰에서 사용자 정보 추출
      const tokenPayload = (req as any).user;
      const masterIdx = tokenPayload.sub;
      const userId = tokenPayload.sub;

      const competitions = await this.competitionService.findByMaster(
        masterIdx,
        userId
      );
      sendSuccess(res, "대회 목록을 조회했습니다.", { competitions });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대회 목록 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 비밀키 확인
   */
  @Post("check-code/:competitionIdx")
  @ApiOperation({
    summary: "비밀키 확인",
    description:
      "입력한 코드가 대회의 비밀키와 일치하는지 확인합니다. 일치하면 대회 주최자 토큰을 발급합니다.",
  })
  @ApiParam({
    name: "competitionIdx",
    description: "대회 idx",
    type: Number,
    example: 1,
  })
  @ApiBody({ type: CheckCodeDto })
  @ApiResponse({
    status: 200,
    description: "비밀키 확인 성공 (쿠키에 토큰 저장)",
  })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async checkCode(
    @Param("competitionIdx", ParseIntPipe) competitionIdx: number,
    @Body() checkCodeDto: CheckCodeDto,
    @Res() res: Response
  ): Promise<void> {
    try {
      const result = await this.competitionService.checkSecretKey(
        competitionIdx,
        checkCodeDto.code
      );

      if (!result.isValid) {
        sendSuccess(res, "비밀키 확인이 완료되었습니다.", { isValid: false });
        return;
      }

      // 비밀키 확인 성공 시 토큰을 쿠키에 설정 (로그인과 동일)
      const isProduction = process.env.NODE_ENV === "production";
      if (result.tokens) {
        res.cookie("access_token", result.tokens.accessToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 60 * 60 * 1000, // 1시간 (밀리초)
          path: "/",
        });

        res.cookie("refresh_token", result.tokens.refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? "none" : "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (밀리초)
          path: "/",
        });
      }

      // 응답 데이터 (비밀번호 제외)
      sendSuccess(res, "비밀키 확인에 성공했습니다.", {
        isValid: true,
        user: result.user,
      });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "비밀키 확인 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 특정 대회 조회 (공개 - 그룹, 매트, 선수 제외)
   */
  @Get(":idx/public")
  @ApiOperation({
    summary: "대회 공개 조회",
    description:
      "특정 대회의 상세 정보를 공개적으로 조회합니다. 그룹, 매트, 선수 정보는 제외됩니다.",
  })
  @ApiParam({ name: "idx", description: "대회 idx", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "대회 정보 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async findOnePublic(
    @Param("idx", ParseIntPipe) idx: number,
    @Res() res: Response
  ): Promise<void> {
    try {
      const competition = await this.competitionService.findOnePublic(idx);
      sendSuccess(res, "대회 정보를 조회했습니다.", competition);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대회 정보 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 특정 대회 조회 (토큰 기반)
   */
  @Get(":idx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "대회 상세 조회",
    description: "특정 대회의 상세 정보를 조회합니다.",
  })
  @ApiParam({ name: "idx", description: "대회 idx", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "대회 정보 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findOne(
    @Param("idx", ParseIntPipe) idx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const tokenPayload = (req as any).user;
      const userId = tokenPayload.sub;
      const competition = await this.competitionService.findOne(idx, userId);
      sendSuccess(res, "대회 정보를 조회했습니다.", { competition });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대회 정보 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 특정 대회 조회 (공개 - 그룹 정보 포함)
   */
  @Get("public/:idx")
  @ApiOperation({
    summary: "대회 공개 조회",
    description: "특정 대회의 상세 정보와 그룹 정보를 공개적으로 조회합니다.",
  })
  @ApiParam({ name: "idx", description: "대회 idx", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "대회 정보 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  async findOneByPublic(
    @Param("idx", ParseIntPipe) idx: number,
    @Res() res: Response
  ): Promise<void> {
    try {
      const competition = await this.competitionService.findOneByPublic(idx);
      sendSuccess(res, "대회 정보를 조회했습니다.", { competition });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대회 정보 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 대회별 매트 목록 조회 (매트 정보와 경기 개수)
   */
  @Get(":competitionIdx/mats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiParam({
    name: "competitionIdx",
    description: "대회 idx",
    type: Number,
    example: 1,
  })
  @ApiOperation({
    summary: "대회별 매트 목록 조회",
    description:
      "대회의 매트 목록과 각 매트에서 이루어지는 경기 개수를 조회합니다.",
  })
  @ApiResponse({ status: 200, description: "매트 목록 조회 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async findMatsWithMatchCount(
    @Param("competitionIdx", ParseIntPipe) competitionIdx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const tokenPayload = (req as any).user;
      const userId = tokenPayload.sub;

      const mats = await this.competitionService.findMatsWithMatchCount(
        competitionIdx,
        userId
      );
      sendSuccess(res, "매트 목록을 조회했습니다.", mats);
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "매트 목록 조회 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 대회 수정
   */
  @Patch(":idx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @UseInterceptors(FileInterceptor("thumbnail"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "대회 수정",
    description: "대회 정보를 수정합니다.",
  })
  @ApiParam({ name: "idx", description: "대회 idx", type: Number, example: 1 })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "2024 전국 유도 선수권대회" },
        description: {
          type: "string",
          example: "2024년 전국 유도 선수권대회입니다.",
        },
        region: { type: "string", example: "서울" },
        type: { type: "string", example: "championship" },
        start_date: { type: "string", example: "2024-06-01" },
        request_start_date: { type: "string", example: "2024-05-01" },
        request_end_date: { type: "string", example: "2024-05-31" },
        status: { type: "string", example: "registration" },
        thumbnail: { type: "string", format: "binary" },
        is_show_player: { type: "boolean", example: true },
      },
    },
  })
  @ApiResponse({ status: 200, description: "대회 수정 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async update(
    @Param("idx", ParseIntPipe) idx: number,
    @Req() req: Request,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      })
    )
    thumbnail?: Express.Multer.File,
    @Res() res?: Response
  ): Promise<void> {
    try {
      // form-data에서 데이터 파싱
      const body = req.body;
      const cleanedData: any = {};

      // 문자열 필드 정리 (빈 문자열을 undefined로)
      for (const key in body) {
        if (body[key] === "") {
          cleanedData[key] = undefined;
        } else if (key === "is_show_player") {
          cleanedData[key] = body[key] === "true" || body[key] === true;
        } else {
          cleanedData[key] = body[key];
        }
      }

      // description 필드 처리 (desc로 올 수도 있음)
      if (cleanedData.desc && !cleanedData.description) {
        cleanedData.description = cleanedData.desc;
        delete cleanedData.desc;
      }

      const updateDto = plainToInstance(UpdateCompetitionDto, cleanedData);
      const errors = await validate(updateDto);

      if (errors.length > 0) {
        const errorMessages = errors
          .map((e) => Object.values(e.constraints || {}))
          .flat();
        sendError(res!, errorMessages.join(", "), HttpStatus.BAD_REQUEST);
        return;
      }

      const tokenPayload = (req as any).user;
      const userId = tokenPayload.sub;

      const competition = await this.competitionService.update(
        idx,
        updateDto,
        userId,
        thumbnail
      );
      sendSuccess(res!, "대회 정보가 수정되었습니다.", { competition });
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res!,
        error.message || "대회 정보 수정 중 오류가 발생했습니다.",
        status
      );
    }
  }

  /**
   * 대회 삭제
   */
  @Delete(":idx")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "대회 삭제",
    description:
      "대회를 삭제합니다. 관련된 매트, 그룹, 선수도 함께 삭제됩니다.",
  })
  @ApiParam({ name: "idx", description: "대회 idx", type: Number, example: 1 })
  @ApiResponse({ status: 200, description: "대회 삭제 성공" })
  @ApiResponse({ status: 404, type: ErrorResponseDto })
  @ApiResponse({ status: 401, type: ErrorResponseDto })
  async remove(
    @Param("idx", ParseIntPipe) idx: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    try {
      const tokenPayload = (req as any).user;
      const userId = tokenPayload.sub;
      await this.competitionService.remove(idx, userId);
      sendSuccess(res, "대회가 삭제되었습니다.");
    } catch (error: any) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(
        res,
        error.message || "대회 삭제 중 오류가 발생했습니다.",
        status
      );
    }
  }
}
