import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from './entities/player.entity';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { Group } from '@/group/entities/group.entity';
import { Competition } from '@/competition/entities/competition.entity';

/**
 * 선수 관련 비즈니스 로직 서비스
 */
@Injectable()
export class PlayerService {
  constructor(
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Competition)
    private competitionRepository: Repository<Competition>,
  ) {}

  /**
   * 선수 생성 (중복 지원 체크 포함)
   * 중복 지원 제한: 같은 그룹의 같은 체급은 지원 불가
   */
  async create(createDto: CreatePlayerDto): Promise<Player> {
    try {
      // 대회 존재 확인
      const competition = await this.competitionRepository.findOne({
        where: { idx: createDto.competition_idx },
      });

      if (!competition) {
        throw new NotFoundException('대회 정보를 찾을 수 없습니다.');
      }

      // 그룹 존재 확인
      const group = await this.groupRepository.findOne({
        where: { idx: createDto.group_idx },
      });

      if (!group) {
        throw new NotFoundException('그룹 정보를 찾을 수 없습니다.');
      }

      // 그룹이 해당 대회에 속하는지 확인
      if (group.competition_idx !== createDto.competition_idx) {
        throw new BadRequestException('그룹이 해당 대회에 속하지 않습니다.');
      }

      // 체급이 그룹의 체급 목록에 포함되는지 확인
      if (!group.weight_classes.includes(createDto.weight)) {
        throw new BadRequestException('해당 그룹에 존재하지 않는 체급입니다.');
      }

      // 중복 지원 체크: 같은 이름, 같은 대회, 같은 그룹, 같은 체급이면 중복으로 판단
      // 주의: 다중 지원은 가능하지만 같은 대회의 같은 그룹의 같은 체급은 불가
      const existingPlayer = await this.playerRepository.findOne({
        where: {
          name: createDto.name,
          competition_idx: createDto.competition_idx,
          group_idx: createDto.group_idx,
          weight: createDto.weight,
        },
      });

      if (existingPlayer) {
        throw new BadRequestException('같은 대회의 같은 그룹의 같은 체급에는 중복 지원이 불가능합니다.');
      }

      const player = this.playerRepository.create(createDto);
      return await this.playerRepository.save(player);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('선수 신청에 실패했습니다.');
    }
  }

  /**
   * 전체 선수 목록 조회
   * @param offset 페이지 오프셋 (기본값: 0)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  async findAll(offset: number = 0, limit: number = 20): Promise<Player[]> {
    try {
      return await this.playerRepository.find({
        relations: ['group'],
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('선수 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 대회별 선수 목록 조회
   */
  async findByCompetition(competitionIdx: number): Promise<Player[]> {
    try {
      return await this.playerRepository.find({
        where: { competition_idx: competitionIdx },
        relations: ['group'],
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('선수 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 그룹별 선수 목록 조회
   */
  async findByGroup(groupIdx: number): Promise<Player[]> {
    try {
      return await this.playerRepository.find({
        where: { group_idx: groupIdx },
        relations: ['group'],
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('선수 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 선수의 모든 지원 내역 조회 (다중 지원 확인용)
   */
  async findByPlayerName(playerName: string): Promise<Player[]> {
    try {
      return await this.playerRepository.find({
        where: { name: playerName },
        relations: ['group'],
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      throw new BadRequestException('선수 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 선수 조회
   */
  async findOne(idx: number): Promise<Player> {
    try {
      const player = await this.playerRepository.findOne({
        where: { idx },
        relations: ['group'],
      });

      if (!player) {
        throw new NotFoundException('선수 정보를 찾을 수 없습니다.');
      }

      return player;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('선수 조회에 실패했습니다.');
    }
  }

  /**
   * 선수 수정
   */
  async update(idx: number, updateDto: UpdatePlayerDto): Promise<Player> {
    try {
      const player = await this.findOne(idx);

      // 대회 변경 시 확인
      if (updateDto.competition_idx !== undefined) {
        const competition = await this.competitionRepository.findOne({
          where: { idx: updateDto.competition_idx },
        });

        if (!competition) {
          throw new NotFoundException('대회 정보를 찾을 수 없습니다.');
        }
      }

      // 그룹 변경이 있는 경우 확인
      if (updateDto.group_idx !== undefined) {
        const group = await this.groupRepository.findOne({
          where: { idx: updateDto.group_idx },
        });

        if (!group) {
          throw new NotFoundException('그룹 정보를 찾을 수 없습니다.');
        }

        // 대회가 지정되었는지 확인
        const competitionIdx = updateDto.competition_idx || player.competition_idx;
        
        // 그룹이 해당 대회에 속하는지 확인
        if (group.competition_idx !== competitionIdx) {
          throw new BadRequestException('그룹이 해당 대회에 속하지 않습니다.');
        }

        // 체급 변경이 있는 경우 체급이 그룹의 체급 목록에 포함되는지 확인
        const weightToCheck = updateDto.weight || player.weight;
        if (!group.weight_classes.includes(weightToCheck)) {
          throw new BadRequestException('해당 그룹에 존재하지 않는 체급입니다.');
        }

        // 중복 지원 체크 (같은 이름, 같은 대회, 같은 그룹, 같은 체급)
        const existingPlayer = await this.playerRepository.findOne({
          where: {
            name: updateDto.name || player.name,
            competition_idx: competitionIdx,
            group_idx: updateDto.group_idx,
            weight: weightToCheck,
          },
        });

        if (existingPlayer && existingPlayer.idx !== idx) {
          throw new BadRequestException('같은 대회의 같은 그룹의 같은 체급에는 중복 지원이 불가능합니다.');
        }
      } else if (updateDto.weight !== undefined) {
        // 체급만 변경하는 경우
        const group = await this.groupRepository.findOne({
          where: { idx: player.group_idx },
        });

        if (!group) {
          throw new NotFoundException('그룹 정보를 찾을 수 없습니다.');
        }

        if (!group.weight_classes.includes(updateDto.weight)) {
          throw new BadRequestException('해당 그룹에 존재하지 않는 체급입니다.');
        }

        // 중복 지원 체크
        const existingPlayer = await this.playerRepository.findOne({
          where: {
            name: updateDto.name || player.name,
            competition_idx: updateDto.competition_idx || player.competition_idx,
            group_idx: player.group_idx,
            weight: updateDto.weight,
          },
        });

        if (existingPlayer && existingPlayer.idx !== idx) {
          throw new BadRequestException('같은 대회의 같은 그룹의 같은 체급에는 중복 지원이 불가능합니다.');
        }
      }

      // 수정할 데이터 병합
      Object.assign(player, updateDto);

      return await this.playerRepository.save(player);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('선수 정보 수정에 실패했습니다.');
    }
  }

  /**
   * 선수 삭제
   */
  async remove(idx: number): Promise<void> {
    try {
      const player = await this.findOne(idx);
      await this.playerRepository.remove(player);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('선수 삭제에 실패했습니다.');
    }
  }
}

