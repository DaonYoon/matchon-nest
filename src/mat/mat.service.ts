import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Mat, MatStatus } from './entities/mat.entity';
import { CreateMatDto } from './dto/create-mat.dto';
import { UpdateMatDto } from './dto/update-mat.dto';
import { Competition } from '@/competition/entities/competition.entity';
import { Group } from '@/group/entities/group.entity';
import { Match } from '@/match/entities/match.entity';

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
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
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
   * 특정 매트 조회 (그룹 정보 포함)
   */
  async findOne(idx: number): Promise<any> {
    try {
      const mat = await this.matRepository.findOne({
        where: { idx },
        relations: ['competition', 'groups'],
      });

      if (!mat) {
        throw new NotFoundException('매트 정보를 찾을 수 없습니다.');
      }

      // 그룹 정보만 기본 정보로 매핑
      return {
        idx: mat.idx,
        created_at: mat.created_at,
        updated_at: mat.updated_at,
        name: mat.name,
        competition_idx: mat.competition_idx,
        groups: mat.groups ? mat.groups.map((group) => ({
          idx: group.idx,
          created_at: group.created_at,
          updated_at: group.updated_at,
          name: group.name,
          competition_idx: group.competition_idx,
          mat_idx: group.mat_idx,
        })) : [],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('매트 조회에 실패했습니다.');
    }
  }

  /**
   * 매트의 모든 경기 리스트 조회
   */
  async findMatchesByMat(matIdx: number): Promise<any[]> {
    try {
      // 매트 확인
      const mat = await this.matRepository.findOne({
        where: { idx: matIdx },
      });

      if (!mat) {
        throw new NotFoundException('매트 정보를 찾을 수 없습니다.');
      }

      // 해당 매트에 배정된 그룹들 조회
      const groups = await this.groupRepository.find({
        where: { mat_idx: matIdx },
        select: ['idx'],
      });

      const groupIndices = groups.map((g) => g.idx);

      if (groupIndices.length === 0) {
        return [];
      }

      // 해당 그룹들의 모든 경기 조회
      const matches = await this.matchRepository.find({
        where: { group_idx: In(groupIndices) },
        relations: ['player1', 'player2', 'winner'],
        order: { round: 'DESC', match_number: 'ASC' },
      });

      // 선수 정보를 포함한 경기 데이터 반환
      return matches.map((match) => ({
        idx: match.idx,
        created_at: match.created_at,
        updated_at: match.updated_at,
        group_idx: match.group_idx,
        round: match.round,
        match_number: match.match_number,
        player1_idx: match.player1_idx,
        player2_idx: match.player2_idx,
        winner_idx: match.winner_idx,
        status: match.status,
        next_match_idx: match.next_match_idx,
        score_player1: match.score_player1,
        score_player2: match.score_player2,
        order: match.order,
        // 선수 정보 포함
        player1: match.player1 ? {
          idx: match.player1.idx,
          name: match.player1.name,
          team_name: match.player1.team_name,
          phone: match.player1.phone,
          is_paid: match.player1.is_paid,
          is_weigh_in_passed: match.player1.is_weigh_in_passed,
        } : null,
        player2: match.player2 ? {
          idx: match.player2.idx,
          name: match.player2.name,
          team_name: match.player2.team_name,
          phone: match.player2.phone,
          is_paid: match.player2.is_paid,
          is_weigh_in_passed: match.player2.is_weigh_in_passed,
        } : null,
        winner: match.winner ? {
          idx: match.winner.idx,
          name: match.winner.name,
          team_name: match.winner.team_name,
          phone: match.winner.phone,
        } : null,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('경기 목록 조회에 실패했습니다.');
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

