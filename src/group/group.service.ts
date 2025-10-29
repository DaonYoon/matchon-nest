import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from './entities/group.entity';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Competition } from '@/competition/entities/competition.entity';
import { Mat } from '@/mat/entities/mat.entity';

/**
 * 그룹 관련 비즈니스 로직 서비스
 */
@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
    @InjectRepository(Mat)
    private matRepository: Repository<Mat>,
  ) {}

  /**
   * 그룹 생성
   */
  async create(createDto: CreateGroupDto): Promise<Group> {
    try {
      // 대회 존재 확인
      const competition = await this.competitionRepository.findOne({
        where: { idx: createDto.competition_idx },
      });

      if (!competition) {
        throw new NotFoundException('대회 정보를 찾을 수 없습니다.');
      }

      // 매트 배정이 있는 경우 매트 확인
      if (createDto.mat_idx) {
        const mat = await this.matRepository.findOne({
          where: { idx: createDto.mat_idx },
        });

        if (!mat) {
          throw new NotFoundException('매트 정보를 찾을 수 없습니다.');
        }

        // 매트가 같은 대회에 속하는지 확인
        if (mat.competition_idx !== createDto.competition_idx) {
          throw new BadRequestException('매트가 해당 대회에 속하지 않습니다.');
        }
      }

      const group = this.groupRepository.create({
        ...createDto,
        mat_idx: createDto.mat_idx || null,
      });

      return await this.groupRepository.save(group);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('그룹 생성에 실패했습니다.');
    }
  }

  /**
   * 전체 그룹 목록 조회
   * @param offset 페이지 오프셋 (기본값: 0)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  async findAll(offset: number = 0, limit: number = 20): Promise<Group[]> {
    try {
      return await this.groupRepository.find({
        relations: ['competition', 'mat'],
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('그룹 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 대회별 그룹 목록 조회
   */
  async findByCompetition(competitionIdx: number): Promise<Group[]> {
    try {
      return await this.groupRepository.find({
        where: { competition_idx: competitionIdx },
        relations: ['competition', 'mat', 'players'],
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('그룹 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 매트별 그룹 목록 조회
   */
  async findByMat(matIdx: number): Promise<Group[]> {
    try {
      return await this.groupRepository.find({
        where: { mat_idx: matIdx },
        relations: ['competition', 'mat', 'players'],
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('그룹 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 그룹 조회
   */
  async findOne(idx: number): Promise<Group> {
    try {
      const group = await this.groupRepository.findOne({
        where: { idx },
        relations: ['competition', 'mat', 'players'],
      });

      if (!group) {
        throw new NotFoundException('그룹 정보를 찾을 수 없습니다.');
      }

      return group;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('그룹 조회에 실패했습니다.');
    }
  }

  /**
   * 그룹 수정
   */
  async update(idx: number, updateDto: UpdateGroupDto): Promise<Group> {
    try {
      const group = await this.findOne(idx);

      // 매트 배정 변경이 있는 경우 확인
      if (updateDto.mat_idx !== undefined && updateDto.mat_idx !== null) {
        const mat = await this.matRepository.findOne({
          where: { idx: updateDto.mat_idx },
        });

        if (!mat) {
          throw new NotFoundException('매트 정보를 찾을 수 없습니다.');
        }

        // 매트가 같은 대회에 속하는지 확인
        if (mat.competition_idx !== group.competition_idx) {
          throw new BadRequestException('매트가 해당 대회에 속하지 않습니다.');
        }
      }

      // 수정할 데이터 병합
      Object.assign(group, updateDto);

      return await this.groupRepository.save(group);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('그룹 수정에 실패했습니다.');
    }
  }

  /**
   * 그룹 삭제
   */
  async remove(idx: number): Promise<void> {
    try {
      const group = await this.findOne(idx);
      await this.groupRepository.remove(group);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('그룹 삭제에 실패했습니다.');
    }
  }
}

