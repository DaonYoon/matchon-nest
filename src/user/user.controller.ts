import { Controller, Get, Post, Put, Delete, Body, Param, Res, HttpStatus, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { sendSuccess, sendError } from '@/common/utils/response.util';

/**
 * 사용자 컨트롤러
 * 사용자 관련 API 엔드포인트 제공
 */
@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 새 사용자 등록
   * @param createUserDto 사용자 등록 정보
   * @param res HTTP 응답 객체
   */
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto, @Res() res: Response): Promise<void> {
    try {
      const user = await this.userService.createUser(createUserDto);
      sendSuccess(res, '사용자가 성공적으로 등록되었습니다.', { user }, HttpStatus.CREATED);
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '사용자 등록 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 모든 사용자 조회
   * @param res HTTP 응답 객체
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '전체 사용자 조회', description: '모든 사용자 목록을 조회합니다. 로그인 필수.' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: '사용자 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 토큰이 필요합니다.' })
  async getAllUsers(@Res() res: Response): Promise<void> {
    try {
      const users = await this.userService.findAllUsers();
      sendSuccess(res, '사용자 목록을 조회했습니다.', { users });
    } catch (error) {
      sendError(res, error.message || '사용자 목록 조회 중 오류가 발생했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * 특정 사용자 조회
   * @param idx 사용자 고유번호
   * @param res HTTP 응답 객체
   */
  @Get(':idx')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      const user = await this.userService.findUserById(idx);
      sendSuccess(res, '사용자 정보를 조회했습니다.', { user });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '사용자 정보 조회 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 사용자 정보 수정
   * @param idx 사용자 고유번호
   * @param updateData 수정할 데이터
   * @param res HTTP 응답 객체
   */
  @Put(':idx')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('idx', ParseIntPipe) idx: number,
    @Body() updateData: Partial<CreateUserDto>,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const user = await this.userService.updateUser(idx, updateData);
      sendSuccess(res, '사용자 정보가 수정되었습니다.', { user });
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '사용자 정보 수정 중 오류가 발생했습니다.', status);
    }
  }

  /**
   * 사용자 삭제
   * @param idx 사용자 고유번호
   * @param res HTTP 응답 객체
   */
  @Delete(':idx')
  @UseGuards(JwtAuthGuard)
  async deleteUser(@Param('idx', ParseIntPipe) idx: number, @Res() res: Response): Promise<void> {
    try {
      await this.userService.deleteUser(idx);
      sendSuccess(res, '사용자가 삭제되었습니다.');
    } catch (error) {
      const status = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      sendError(res, error.message || '사용자 삭제 중 오류가 발생했습니다.', status);
    }
  }
}
