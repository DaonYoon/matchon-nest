import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Competition, CompetitionStatus } from './entities/competition.entity';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { User } from '@/user/entities/user.entity';
import { Group } from '@/group/entities/group.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { Player } from '@/player/entities/player.entity';
import { Match } from '@/match/entities/match.entity';
import { S3Service } from '@/common/services/s3.service';

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
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Mat)
    private matRepository: Repository<Mat>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private s3Service: S3Service,
  ) {}

  /**
   * 대회 생성
   */
  async create(createDto: CreateCompetitionDto, thumbnailFile?: Express.Multer.File): Promise<Competition> {
    try {
      // 주최자 존재 확인
      const master = await this.userRepository.findOne({
        where: { idx: createDto.master_idx },
      });

      if (!master) {
        throw new NotFoundException('주최자 정보를 찾을 수 없습니다.');
      }

      let thumbnailUrl: string | null = createDto.thumbnail || null;

      // 썸네일 파일이 있으면 S3에 업로드
      if (thumbnailFile) {
        const folderPath = `contest_thumbnail/${createDto.master_idx}`;
        thumbnailUrl = await this.s3Service.uploadFile(thumbnailFile, folderPath);
      }

      const competition = this.competitionRepository.create({
        ...createDto,
        thumbnail: thumbnailUrl,
        status: createDto.status || CompetitionStatus.REGISTRATION,
        is_show_player: createDto.is_show_player !== undefined ? createDto.is_show_player : true,
      });

      const savedCompetition = await this.competitionRepository.save(competition) as unknown as Competition;

      // 저장 후 대회 idx를 얻었으므로 썸네일 경로 업데이트
      if (thumbnailFile && savedCompetition.idx) {
        const folderPath = `contest_thumbnail/${savedCompetition.idx}`;
        thumbnailUrl = await this.s3Service.uploadFile(thumbnailFile, folderPath);
        savedCompetition.thumbnail = thumbnailUrl;
        return await this.competitionRepository.save(savedCompetition);
      }

      return savedCompetition;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 생성에 실패했습니다.');
    }
  }

  /**
   * 전체 대회 목록 조회 (토큰 기반 필터링)
   * @param userId 현재 로그인한 사용자 ID
   * @param offset 페이지 오프셋 (기본값: 0)
   * @param limit 페이지당 개수 (기본값: 20)
   */
  async findAll(userId: number, offset: number = 0, limit: number = 20): Promise<Competition[]> {
    try {
      return await this.competitionRepository.find({
        where: { master_idx: userId },
        order: { created_at: 'DESC' },
        skip: offset,
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('대회 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 특정 대회 조회 (토큰 기반 권한 확인)
   */
  async findOne(idx: number, userId: number): Promise<Competition> {
    try {
      const competition = await this.competitionRepository.findOne({
        where: { idx, master_idx: userId },
      });

      if (!competition) {
        throw new NotFoundException('대회 정보를 찾을 수 없거나 권한이 없습니다.');
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
   * 특정 대회 조회 (공개 - 그룹 정보 포함)
   */
  async findOneByPublic(idx: number): Promise<Competition> {
    try {
      const competition = await this.competitionRepository.findOne({
        where: { idx },
        relations: ['groups'],
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
   * 주최자별 대회 목록 조회 (토큰 기반 권한 확인)
   */
  async findByMaster(masterIdx: number, userId: number): Promise<Competition[]> {
    try {
      // 자신의 대회만 조회 가능
      if (masterIdx !== userId) {
        throw new NotFoundException('권한이 없습니다.');
      }

      return await this.competitionRepository.find({
        where: { master_idx: masterIdx },
        order: { created_at: 'DESC' },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 대회 수정 (토큰 기반 권한 확인)
   */
  async update(idx: number, updateDto: UpdateCompetitionDto, userId: number, thumbnailFile?: Express.Multer.File): Promise<Competition> {
    try {
      const competition = await this.findOne(idx, userId);

      let thumbnailUrl = updateDto.thumbnail || competition.thumbnail;

      // 썸네일 파일이 있으면 S3에 업로드
      if (thumbnailFile) {
        const folderPath = `contest_thumbnail/${idx}`;
        thumbnailUrl = await this.s3Service.uploadFile(thumbnailFile, folderPath);
      }

      // 수정할 데이터 병합
      Object.assign(competition, {
        ...updateDto,
        thumbnail: thumbnailUrl,
      });

      return await this.competitionRepository.save(competition);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 수정에 실패했습니다.');
    }
  }

  /**
   * 대회 삭제 (토큰 기반 권한 확인 및 연관 데이터 삭제)
   */
  async remove(idx: number, userId: number): Promise<void> {
    try {
      const competition = await this.findOne(idx, userId);

      // 관련 그룹들 조회
      const groups = await this.groupRepository.find({
        where: { competition_idx: idx },
        select: ['idx'],
      });

      const groupIndices = groups.map((g) => g.idx);

      if (groupIndices.length > 0) {
        // 관련 경기 삭제
        await this.matchRepository.delete({
          group_idx: In(groupIndices),
        });

        // 관련 선수 삭제
        await this.playerRepository.delete({
          competition_idx: idx,
        });

        // 관련 그룹 삭제
        await this.groupRepository.delete({
          competition_idx: idx,
        });
      }

      // 관련 매트 삭제
      await this.matRepository.delete({
        competition_idx: idx,
      });

      // 대회 삭제
      await this.competitionRepository.remove(competition);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('대회 삭제에 실패했습니다.');
    }
  }

  /**
   * 대회별 매트 목록 조회 (매트 정보와 각 매트의 경기 개수)
   */
  async findMatsWithMatchCount(competitionIdx: number, userId: number): Promise<any[]> {
    try {
      // 대회 확인
      const competition = await this.competitionRepository.findOne({
        where: { idx: competitionIdx, master_idx: userId },
      });

      if (!competition) {
        throw new NotFoundException('대회 정보를 찾을 수 없거나 권한이 없습니다.');
      }

      // 대회의 모든 매트 조회
      const mats = await this.matRepository.find({
        where: { competition_idx: competitionIdx },
        order: { created_at: 'ASC' },
      });

      // 각 매트에 배정된 그룹 조회 후 경기 개수 계산
      const matsWithMatchCount = await Promise.all(
        mats.map(async (mat) => {
          // 해당 매트에 배정된 그룹들 조회
          const groups = await this.groupRepository.find({
            where: { mat_idx: mat.idx },
            select: ['idx'],
          });

          const groupIndices = groups.map((g) => g.idx);

          // 해당 그룹들의 경기 개수 조회
          let matchCount = 0;
          if (groupIndices.length > 0) {
            matchCount = await this.matchRepository.count({
              where: { group_idx: In(groupIndices) },
            });
          }

          return {
            idx: mat.idx,
            created_at: mat.created_at,
            updated_at: mat.updated_at,
            name: mat.name,
            competition_idx: mat.competition_idx,
            match_count: matchCount,
          };
        })
      );

      return matsWithMatchCount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('매트 목록 조회에 실패했습니다.');
    }
  }
}

