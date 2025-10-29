import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competition, CompetitionStatus } from './entities/competition.entity';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { User } from '@/user/entities/user.entity';

/**
 * 대회 관련 비즈니스 로직 서비스
 */
@Injectable()
export class CompetitionService {
  constructor(
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 대회 생성
   */
  async create(createDto: CreateCompetitionDto): Promise<Competition> {
    try {
      // 주최자 존재 확인
      const master = await this.userRepository.findOne({
        where: { idx: createDto.master_idx },
      });

      if (!master) {
        throw new NotFoundException('주최자 정보를 찾을 수 없습니다.');
      }

      const competition = this.competitionRepository.create({
        ...createDto,
        status: createDto.status || CompetitionStatus.REGISTRATION,
      });

      return await this.competitionRepository.save(competition);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 생성에 실패했습니다.');
    }
  }

  /**
   * 전체 대회 목록 조회
   * @param offset 페이지 오프셋 (기본값: 0)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  async findAll(offset: number = 0, limit: number = 20): Promise<Competition[]> {
    try {
      return await this.competitionRepository.find({
        relations: ['master'],
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('대회 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 대회 조회
   */
  async findOne(idx: number): Promise<Competition> {
    try {
      const competition = await this.competitionRepository.findOne({
        where: { idx },
        relations: ['master', 'mats', 'groups'],
      });

      if (!competition) {
        throw new NotFoundException('대회 정보를 찾을 수 없습니다.');
      }

      return competition;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 조회에 실패했습니다.');
    }
  }

  /**
   * 주최자별 대회 목록 조회
   */
  async findByMaster(masterIdx: number): Promise<Competition[]> {
    try {
      return await this.competitionRepository.find({
        where: { master_idx: masterIdx },
        relations: ['master'],
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      throw new BadRequestException('대회 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 대회 수정
   */
  async update(idx: number, updateDto: UpdateCompetitionDto): Promise<Competition> {
    try {
      const competition = await this.findOne(idx);

      // 수정할 데이터 병합
      Object.assign(competition, updateDto);

      return await this.competitionRepository.save(competition);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 수정에 실패했습니다.');
    }
  }

  /**
   * 대회 삭제
   */
  async remove(idx: number): Promise<void> {
    try {
      const competition = await this.findOne(idx);
      await this.competitionRepository.remove(competition);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 삭제에 실패했습니다.');
    }
  }
}

