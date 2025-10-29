import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mat, MatStatus } from './entities/mat.entity';
import { CreateMatDto } from './dto/create-mat.dto';
import { UpdateMatDto } from './dto/update-mat.dto';
import { Competition } from '@/competition/entities/competition.entity';

/**
 * 매트 관련 비즈니스 로직 서비스
 */
@Injectable()
export class MatService {
  constructor(
    @InjectRepository(Mat)
    private matRepository: Repository<Mat>,
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
  ) {}

  /**
   * 매트 생성
   */
  async create(createDto: CreateMatDto): Promise<Mat> {
    try {
      // 대회 존재 확인
      const competition = await this.competitionRepository.findOne({
        where: { idx: createDto.competition_idx },
      });

      if (!competition) {
        throw new NotFoundException('대회 정보를 찾을 수 없습니다.');
      }

      const mat = this.matRepository.create({
        ...createDto,
        status: createDto.status || MatStatus.ACTIVE,
      });

      return await this.matRepository.save(mat);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('매트 생성에 실패했습니다.');
    }
  }

  /**
   * 전체 매트 목록 조회
   * @param offset 페이지 오프셋 (기본값: 0)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  async findAll(offset: number = 0, limit: number = 20): Promise<Mat[]> {
    try {
      return await this.matRepository.find({
        relations: ['competition'],
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('매트 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 대회별 매트 목록 조회
   */
  async findByCompetition(competitionIdx: number): Promise<Mat[]> {
    try {
      return await this.matRepository.find({
        where: { competition_idx: competitionIdx },
        relations: ['competition', 'groups'],
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('매트 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 매트 조회
   */
  async findOne(idx: number): Promise<Mat> {
    try {
      const mat = await this.matRepository.findOne({
        where: { idx },
        relations: ['competition', 'groups'],
      });

      if (!mat) {
        throw new NotFoundException('매트 정보를 찾을 수 없습니다.');
      }

      return mat;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('매트 조회에 실패했습니다.');
    }
  }

  /**
   * 매트 수정
   */
  async update(idx: number, updateDto: UpdateMatDto): Promise<Mat> {
    try {
      const mat = await this.findOne(idx);

      // 수정할 데이터 병합
      Object.assign(mat, updateDto);

      return await this.matRepository.save(mat);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('매트 수정에 실패했습니다.');
    }
  }

  /**
   * 매트 삭제
   */
  async remove(idx: number): Promise<void> {
    try {
      const mat = await this.findOne(idx);
      await this.matRepository.remove(mat);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('매트 삭제에 실패했습니다.');
    }
  }
}

