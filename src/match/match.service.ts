import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Match, MatchStatus } from "./entities/match.entity";
import { CreateMatchBracketDto } from "./dto/create-match-bracket.dto";
import { UpdateMatchResultDto } from "./dto/update-match-result.dto";
import { UpdateMatchOrderDto } from "./dto/update-match-order.dto";
import { UpdateMatchScoreDto } from "./dto/update-match-score.dto";
import { UpdateMatchDto } from "./dto/update-match.dto";
import { Group } from "@/group/entities/group.entity";
import { Player } from "@/player/entities/player.entity";
import { Mat } from "@/mat/entities/mat.entity";

/**
 * 경기 관련 비즈니스 로직 서비스
 */
@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(Player)
    private playerRepository: Repository<Player>,
    @InjectRepository(Mat)
    private matRepository: Repository<Mat>
  ) {}

  /**
   * 대진표 생성
   * 프론트에서 선수 목록과 시드 정보를 받아서 토너먼트 대진표를 생성
   * 예선전은 order를 match_number와 동일하게 설정
   * 준결승/결승은 order를 예선전 이후 번호로 설정
   */
  async createBracket(createDto: CreateMatchBracketDto): Promise<Match[]> {
    try {
      // 그룹 존재 확인
      const group = await this.groupRepository.findOne({
        where: { idx: createDto.group_idx },
      });

      if (!group) {
        throw new NotFoundException("그룹 정보를 찾을 수 없습니다.");
      }

      // 기존 대진표가 있는지 확인
      const existingMatches = await this.matchRepository.find({
        where: { group_idx: createDto.group_idx },
      });

      if (existingMatches.length > 0) {
        throw new BadRequestException(
          "이미 대진표가 생성되어 있습니다. 기존 대진표를 삭제한 후 다시 생성해주세요."
        );
      }

      // 선수 수 확인
      const playerCount = createDto.players.length;
      if (playerCount < 2) {
        throw new BadRequestException("최소 2명의 선수가 필요합니다.");
      }

      // 시드 정렬 (1번 시드가 가장 위)
      const sortedPlayers = [...createDto.players].sort(
        (a, b) => a.seed - b.seed
      );

      // 토너먼트 라운드 계산
      const totalRounds = Math.ceil(Math.log2(playerCount));
      const bracketSize = Math.pow(2, totalRounds);

      // 모든 경기 생성
      const matches: Match[] = [];
      const matchMap = new Map<string, Match>(); // round-match_number로 경기 찾기

      // 각 라운드별로 경기 생성
      let currentOrder = 1; // 순서 카운터

      for (let round = totalRounds; round >= 1; round--) {
        const matchesInRound = Math.pow(2, round - 1);

        for (
          let matchNumber = 1;
          matchNumber <= matchesInRound;
          matchNumber++
        ) {
          const match = this.matchRepository.create({
            group_idx: createDto.group_idx,
            round: matchesInRound,
            match_number: matchNumber,
            player1_idx: null,
            player2_idx: null,
            winner_idx: null,
            status: MatchStatus.PENDING,
            next_match_idx: null,
            score_player1: null,
            score_player2: null,
            order: null,
          });

          // 예선전 (첫 라운드)은 order를 match_number와 동일하게 설정
          if (round === totalRounds) {
            match.order = matchNumber;
          } else {
            // 준결승/결승은 뒷번호로 설정
            match.order = bracketSize + currentOrder;
            currentOrder++;
          }

          matches.push(match);
          matchMap.set(`${round}-${matchNumber}`, match);
        }
      }

      // 첫 라운드에 선수 배정
      const firstRoundMatches = matches.filter(
        (m) => m.round === Math.pow(2, totalRounds - 1)
      );
      const firstRoundCount = firstRoundMatches.length;

      // 시드에 따라 선수 배정
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        const seed = player.seed;

        // 토너먼트 트리 구조에 따라 배정
        let matchIndex: number;
        if (firstRoundCount === 1) {
          matchIndex = 0;
        } else {
          // 시드 배치 알고리즘: 1번 시드는 첫 경기, 2번 시드는 마지막 경기, 3번 시드는 2번 시드 반대편 등
          if (seed === 1) {
            matchIndex = 0;
          } else if (seed === 2) {
            matchIndex = firstRoundCount - 1;
          } else {
            // 3번 이후 시드는 토너먼트 구조에 맞게 배정
            matchIndex = this.calculateMatchPosition(seed, firstRoundCount);
          }
        }

        const match = firstRoundMatches[matchIndex];
        if (!match.player1_idx) {
          match.player1_idx = player.player_idx;
        } else if (!match.player2_idx) {
          match.player2_idx = player.player_idx;
        } else {
          // 이미 두 선수가 배정된 경우 부전승 처리
          throw new BadRequestException(
            `시드 ${seed}의 선수 배정에 실패했습니다.`
          );
        }
      }

      // 상위 경기에 소스 경기 정보 설정 (승자가 확정되기 전까지 표시용)
      // 예선전 경기들이 저장된 후 idx를 알 수 있으므로, 저장 후 업데이트

      // 모든 경기 저장
      const savedMatches = await this.matchRepository.save(matches);

      // 다음 경기 연결 및 소스 경기 정보 업데이트
      for (let round = totalRounds; round > 1; round--) {
        const currentRoundMatches = Math.pow(2, round - 1);
        const nextRoundMatches = Math.pow(2, round - 2);

        // 현재 라운드와 다음 라운드 경기 분리
        const currentMatches = savedMatches.filter(
          (m) => m.round === Math.pow(2, round - 1)
        );
        const nextMatches = savedMatches.filter(
          (m) => m.round === Math.pow(2, round - 2)
        );

        // 다음 라운드 경기별로 소스 경기 정보 설정
        for (
          let matchNumber = 1;
          matchNumber <= nextRoundMatches;
          matchNumber++
        ) {
          // 다음 경기
          const nextMatch = nextMatches[matchNumber - 1];
          
          if (!nextMatch) continue;

          // 현재 라운드에서 이 다음 경기로 진출할 두 경기 찾기
          // 경기 번호 1, 2 → 다음 경기 1
          // 경기 번호 3, 4 → 다음 경기 2
          // 경기 번호 5, 6 → 다음 경기 3
          // 공식: (matchNumber - 1) * 2 + 1, (matchNumber - 1) * 2 + 2
          const sourceMatch1Index = (matchNumber - 1) * 2;
          const sourceMatch2Index = (matchNumber - 1) * 2 + 1;

          const sourceMatch1 = currentMatches[sourceMatch1Index];
          const sourceMatch2 = currentMatches[sourceMatch2Index];

          if (sourceMatch1 && sourceMatch2) {
            // 다음 경기에 소스 경기 정보 설정
            nextMatch.player1_source_match_idx = sourceMatch1.idx;
            nextMatch.player2_source_match_idx = sourceMatch2.idx;
            
            // 다음 경기 연결 설정
            sourceMatch1.next_match_idx = nextMatch.idx;
            sourceMatch2.next_match_idx = nextMatch.idx;

            await this.matchRepository.save([nextMatch, sourceMatch1, sourceMatch2]);
          }
        }
      }

      return savedMatches;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException("대진표 생성에 실패했습니다.");
    }
  }

  /**
   * 시드 위치 계산
   */
  private calculateMatchPosition(seed: number, totalMatches: number): number {
    // 단순한 토너먼트 시드 배치 알고리즘
    if (seed <= 2) {
      return seed === 1 ? 0 : totalMatches - 1;
    }

    // 3번 이후 시드는 대칭적으로 배치
    const positions = [0, totalMatches - 1];
    let currentPos = 1;
    let increment = totalMatches / 2;

    while (currentPos < seed && positions.length < totalMatches) {
      const newPos = Math.floor(increment / 2);
      positions.push(newPos);
      positions.push(totalMatches - 1 - newPos);
      increment = increment / 2;
      currentPos++;
    }

    return positions[seed - 1] || seed - 1;
  }

  /**
   * 대회별 매트별 경기 목록 조회 (order 낮은 순)
   * @param competitionIdx 대회 idx
   * @param matIdx 매트 idx
   * @returns 경기 목록 (선수 정보 포함)
   */
  async findByCompetitionAndMat(
    competitionIdx: number,
    matIdx: number
  ): Promise<any[]> {
    try {
      // 대회 확인
      const competition = await this.groupRepository
        .createQueryBuilder("group")
        .where("group.competition_idx = :competitionIdx", { competitionIdx })
        .getOne();

      if (!competition) {
        throw new NotFoundException("대회 정보를 찾을 수 없습니다.");
      }

      // 매트 확인
      const mat = await this.matRepository.findOne({
        where: { idx: matIdx, competition_idx: competitionIdx },
      });

      if (!mat) {
        throw new NotFoundException(
          "매트 정보를 찾을 수 없거나 해당 대회에 속하지 않습니다."
        );
      }

      // 해당 대회와 매트에 속하는 그룹들의 idx 조회
      const groups = await this.groupRepository.find({
        where: { competition_idx: competitionIdx, mat_idx: matIdx },
        select: ["idx"],
      });

      const groupIndices = groups.map((g) => g.idx);

      if (groupIndices.length === 0) {
        return [];
      }

      // 해당 그룹들의 경기 조회 (order 낮은 순)
      const matches = await this.matchRepository.find({
        where: { group_idx: In(groupIndices) },
        relations: ["player1", "player2", "winner", "group"],
        order: { order: "ASC" },
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
        result: match.result,
        advantage_player1: match.advantage_player1,
        advantage_player2: match.advantage_player2,
        penalty_player1: match.penalty_player1,
        penalty_player2: match.penalty_player2,
        // 선수 정보 포함
        player1: match.player1
          ? {
              idx: match.player1.idx,
              name: match.player1.name,
              team_name: match.player1.team_name,
              phone: match.player1.phone,
              is_paid: match.player1.is_paid,
              is_weigh_in_passed: match.player1.is_weigh_in_passed,
            }
          : null,
        player2: match.player2
          ? {
              idx: match.player2.idx,
              name: match.player2.name,
              team_name: match.player2.team_name,
              phone: match.player2.phone,
              is_paid: match.player2.is_paid,
              is_weigh_in_passed: match.player2.is_weigh_in_passed,
            }
          : null,
        winner: match.winner
          ? {
              idx: match.winner.idx,
              name: match.winner.name,
              team_name: match.winner.team_name,
              phone: match.winner.phone,
            }
          : null,
        // 그룹 정보 포함
        group: match.group
          ? {
              idx: match.group.idx,
              name: match.group.name,
              competition_idx: match.group.competition_idx,
              mat_idx: match.group.mat_idx,
              match_time: match.group.match_time, // 경기 시간 (분 단위)
            }
          : null,
      }));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("경기 목록 조회에 실패했습니다.");
    }
  }

  /**
   * 그룹의 대진표 조회 (선수 정보 포함)
   */
  async findBracketByGroup(
    competitonIdx: number,
    groupIdx: number
  ): Promise<any[]> {
    try {
      // 그룹 존재 확인
      const group = await this.groupRepository.findOne({
        where: { idx: groupIdx, competition_idx: competitonIdx },
      });

      if (!group) {
        throw new NotFoundException("그룹 정보를 찾을 수 없습니다.");
      }

      // 해당 그룹의 모든 경기 조회
      const matches = await this.matchRepository.find({
        where: { group_idx: groupIdx },
        relations: ["player1", "player2", "winner"],
        order: { round: "DESC", match_number: "ASC" },
      });

      // 선수 정보를 포함한 경기 데이터 반환
      return matches.map((match) => {
        const matchData: any = {
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
          result: match.result,
          advantage_player1: match.advantage_player1,
          advantage_player2: match.advantage_player2,
          penalty_player1: match.penalty_player1,
          penalty_player2: match.penalty_player2,
          player1_source_match_idx: match.player1_source_match_idx,
          player2_source_match_idx: match.player2_source_match_idx,
          // 그룹 정보 (경기 시간 포함)
          group: {
            idx: group.idx,
            name: group.name,
            competition_idx: group.competition_idx,
            mat_idx: group.mat_idx,
            match_time: group.match_time, // 경기 시간 (분 단위)
          },
        };

        // 선수 정보 포함 (승자가 확정되지 않은 경우 소스 경기 정보 표시)
        if (match.player1_idx) {
          matchData.player1 = match.player1
            ? {
                idx: match.player1.idx,
                name: match.player1.name,
                team_name: match.player1.team_name,
                phone: match.player1.phone,
                is_paid: match.player1.is_paid,
                is_weigh_in_passed: match.player1.is_weigh_in_passed,
              }
            : null;
        } else if (match.player1_source_match_idx) {
          // 소스 경기 정보로 표시
          const sourceMatch = matches.find(m => m.idx === match.player1_source_match_idx);
          matchData.player1 = {
            source_match_idx: match.player1_source_match_idx,
            display_name: sourceMatch ? `${sourceMatch.match_number}번 경기 승자` : `${match.player1_source_match_idx}번 경기 승자`,
          };
        } else {
          matchData.player1 = null;
        }

        if (match.player2_idx) {
          matchData.player2 = match.player2
            ? {
                idx: match.player2.idx,
                name: match.player2.name,
                team_name: match.player2.team_name,
                phone: match.player2.phone,
                is_paid: match.player2.is_paid,
                is_weigh_in_passed: match.player2.is_weigh_in_passed,
              }
            : null;
        } else if (match.player2_source_match_idx) {
          // 소스 경기 정보로 표시
          const sourceMatch = matches.find(m => m.idx === match.player2_source_match_idx);
          matchData.player2 = {
            source_match_idx: match.player2_source_match_idx,
            display_name: sourceMatch ? `${sourceMatch.match_number}번 경기 승자` : `${match.player2_source_match_idx}번 경기 승자`,
          };
        } else {
          matchData.player2 = null;
        }

        matchData.winner = match.winner
          ? {
              idx: match.winner.idx,
              name: match.winner.name,
              team_name: match.winner.team_name,
              phone: match.winner.phone,
            }
          : null;

        return matchData;
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("대진표 조회에 실패했습니다.");
    }
  }

  /**
   * 특정 경기 조회
   */
  async findOne(matchIdx: number): Promise<any> {
    try {
      // 경기 조회 (관계 정보 포함)
      const match = await this.matchRepository.findOne({
        where: { idx: matchIdx },
        relations: ["player1", "player2", "winner", "group", "nextMatch"],
      });

      if (!match) {
        throw new NotFoundException("경기 정보를 찾을 수 없습니다.");
      }

      // 선수 정보를 포함한 경기 데이터 반환
      return {
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
        result: match.result,
        advantage_player1: match.advantage_player1,
        advantage_player2: match.advantage_player2,
        penalty_player1: match.penalty_player1,
        penalty_player2: match.penalty_player2,
        player1: match.player1
          ? {
              idx: match.player1.idx,
              name: match.player1.name,
              team_name: match.player1.team_name,
              phone: match.player1.phone,
            }
          : null,
        player2: match.player2
          ? {
              idx: match.player2.idx,
              name: match.player2.name,
              team_name: match.player2.team_name,
              phone: match.player2.phone,
            }
          : null,
        winner: match.winner
          ? {
              idx: match.winner.idx,
              name: match.winner.name,
              team_name: match.winner.team_name,
              phone: match.winner.phone,
            }
          : null,
        group: match.group
          ? {
              idx: match.group.idx,
              name: match.group.name,
              competition_idx: match.group.competition_idx,
              mat_idx: match.group.mat_idx,
              match_time: match.group.match_time, // 경기 시간 (분 단위)
            }
          : null,
        nextMatch: match.nextMatch
          ? {
              idx: match.nextMatch.idx,
              round: match.nextMatch.round,
              match_number: match.nextMatch.match_number,
            }
          : null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("경기 조회에 실패했습니다.");
    }
  }

  /**
   * 경기 결과 입력 및 승자 다음 경기로 진출 처리
   */
  async updateMatchResult(
    matchIdx: number,
    updateDto: UpdateMatchResultDto,
    gateway?: any
  ): Promise<Match> {
    try {
      // 경기 존재 확인 (관계 정보 포함)
      const match = await this.matchRepository.findOne({
        where: { idx: matchIdx },
        relations: ["player1", "player2", "nextMatch", "group"],
      });

      if (!match) {
        throw new NotFoundException("경기 정보를 찾을 수 없습니다.");
      }

      // 승자가 경기에 참가한 선수 중 한 명인지 확인
      if (
        updateDto.winner_idx !== match.player1_idx &&
        updateDto.winner_idx !== match.player2_idx
      ) {
        throw new BadRequestException("승자는 경기에 참가한 선수여야 합니다.");
      }

      // 경기 결과 업데이트
      match.winner_idx = updateDto.winner_idx;
      match.status = MatchStatus.COMPLETED;
      if (updateDto.score_player1 !== undefined) {
        match.score_player1 = updateDto.score_player1;
      }
      if (updateDto.score_player2 !== undefined) {
        match.score_player2 = updateDto.score_player2;
      }

      const savedMatch = await this.matchRepository.save(match);

      // 다음 경기로 승자 진출 처리
      await this.advanceWinnerToNextMatch(matchIdx, updateDto.winner_idx);

      // WebSocket으로 실시간 업데이트 전송
      if (gateway && match.group) {
        await gateway.broadcastMatchUpdate(matchIdx);
      }

      return savedMatch;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException("경기 결과 입력에 실패했습니다.");
    }
  }

  /**
   * 경기 순서 수정
   */
  async updateOrder(
    matchIdx: number,
    updateDto: UpdateMatchOrderDto,
    gateway?: any
  ): Promise<Match> {
    try {
      // 경기 존재 확인 (관계 정보 포함)
      const match = await this.matchRepository.findOne({
        where: { idx: matchIdx },
        relations: ['group'],
      });

      if (!match) {
        throw new NotFoundException("경기 정보를 찾을 수 없습니다.");
      }

      // 순서 업데이트
      if (updateDto.order !== undefined) {
        match.order = updateDto.order;
      }

      const savedMatch = await this.matchRepository.save(match);

      // WebSocket으로 실시간 업데이트 전송
      if (gateway && match.group) {
        await gateway.broadcastMatchUpdate(matchIdx);
      }

      return savedMatch;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("경기 순서 수정에 실패했습니다.");
    }
  }

  /**
   * 경기 점수 수정 (점수, 어드밴티지, 패널티만)
   */
  async updateScore(
    matchIdx: number,
    updateDto: UpdateMatchScoreDto,
    gateway?: any
  ): Promise<Match> {
    try {
      // 경기 존재 확인 (관계 정보 포함)
      const match = await this.matchRepository.findOne({
        where: { idx: matchIdx },
        relations: ['group'],
      });

      if (!match) {
        throw new NotFoundException("경기 정보를 찾을 수 없습니다.");
      }

      // 점수 업데이트 (전달된 필드만 업데이트)
      if (updateDto.score_player1 !== undefined) {
        match.score_player1 = updateDto.score_player1;
      }
      if (updateDto.score_player2 !== undefined) {
        match.score_player2 = updateDto.score_player2;
      }
      if (updateDto.advantage_player1 !== undefined) {
        match.advantage_player1 = updateDto.advantage_player1;
      }
      if (updateDto.advantage_player2 !== undefined) {
        match.advantage_player2 = updateDto.advantage_player2;
      }
      if (updateDto.penalty_player1 !== undefined) {
        match.penalty_player1 = updateDto.penalty_player1;
      }
      if (updateDto.penalty_player2 !== undefined) {
        match.penalty_player2 = updateDto.penalty_player2;
      }

      const savedMatch = await this.matchRepository.save(match);

      // WebSocket으로 실시간 업데이트 전송
      if (gateway && match.group) {
        await gateway.broadcastMatchUpdate(matchIdx);
      }

      return savedMatch;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("경기 점수 수정에 실패했습니다.");
    }
  }

  /**
   * 경기 정보 수정 (모든 필드)
   */
  async update(matchIdx: number, updateDto: UpdateMatchDto, gateway?: any): Promise<Match> {
    try {
      // 경기 존재 확인 (관계 정보 포함)
      const match = await this.matchRepository.findOne({
        where: { idx: matchIdx },
        relations: ['group', 'nextMatch'],
      });

      if (!match) {
        throw new NotFoundException("경기 정보를 찾을 수 없습니다.");
      }

      // 승자 유효성 검사 (승자가 설정되는 경우)
      if (updateDto.winner_idx !== undefined) {
        if (
          updateDto.winner_idx !== match.player1_idx &&
          updateDto.winner_idx !== match.player2_idx
        ) {
          throw new BadRequestException("승자는 경기에 참가한 선수여야 합니다.");
        }
      }

      // 전달된 필드만 업데이트
      if (updateDto.player1_idx !== undefined) {
        match.player1_idx = updateDto.player1_idx;
      }
      if (updateDto.player2_idx !== undefined) {
        match.player2_idx = updateDto.player2_idx;
      }
      if (updateDto.winner_idx !== undefined) {
        match.winner_idx = updateDto.winner_idx;
      }
      if (updateDto.status !== undefined) {
        match.status = updateDto.status;
      }
      if (updateDto.next_match_idx !== undefined) {
        match.next_match_idx = updateDto.next_match_idx;
      }
      if (updateDto.score_player1 !== undefined) {
        match.score_player1 = updateDto.score_player1;
      }
      if (updateDto.score_player2 !== undefined) {
        match.score_player2 = updateDto.score_player2;
      }
      if (updateDto.order !== undefined) {
        match.order = updateDto.order;
      }
      if (updateDto.result !== undefined) {
        match.result = updateDto.result;
      }
      if (updateDto.advantage_player1 !== undefined) {
        match.advantage_player1 = updateDto.advantage_player1;
      }
      if (updateDto.advantage_player2 !== undefined) {
        match.advantage_player2 = updateDto.advantage_player2;
      }
      if (updateDto.penalty_player1 !== undefined) {
        match.penalty_player1 = updateDto.penalty_player1;
      }
      if (updateDto.penalty_player2 !== undefined) {
        match.penalty_player2 = updateDto.penalty_player2;
      }

      const savedMatch = await this.matchRepository.save(match);

      // 경기 상태가 END이고 승자가 설정되면 다음 경기로 승자 배정
      const isEndingMatch = updateDto.status === MatchStatus.END || 
                           (updateDto.status === undefined && savedMatch.status === MatchStatus.END);
      const hasWinner = updateDto.winner_idx !== undefined || savedMatch.winner_idx !== null;

      if (isEndingMatch && hasWinner) {
        const winnerIdx = updateDto.winner_idx !== undefined ? updateDto.winner_idx : savedMatch.winner_idx;
        if (winnerIdx) {
          await this.advanceWinnerToNextMatch(matchIdx, winnerIdx);
          
          // 다음 경기도 WebSocket으로 업데이트 전송
          if (gateway && savedMatch.next_match_idx) {
            await gateway.broadcastMatchUpdate(savedMatch.next_match_idx);
          }
        }
      }

      // WebSocket으로 실시간 업데이트 전송
      if (gateway && match.group) {
        await gateway.broadcastMatchUpdate(matchIdx);
      }

      return savedMatch;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("경기 정보 수정에 실패했습니다.");
    }
  }

  /**
   * 다음 경기로 승자 배정
   * @param matchIdx 현재 경기 idx
   * @param winnerIdx 승자 idx
   */
  private async advanceWinnerToNextMatch(
    matchIdx: number,
    winnerIdx: number
  ): Promise<void> {
    try {
      // 현재 경기 조회 (관계 정보 포함)
      const currentMatch = await this.matchRepository.findOne({
        where: { idx: matchIdx },
        relations: ['nextMatch'],
      });

      if (!currentMatch || !currentMatch.next_match_idx) {
        // 다음 경기가 없으면 종료 (결승전 등)
        return;
      }

      // 다음 경기 조회
      const nextMatch = await this.matchRepository.findOne({
        where: { idx: currentMatch.next_match_idx },
      });

      if (!nextMatch) {
        return;
      }

      // 다음 경기의 player1 또는 player2에 승자 배정
      // 규칙: 현재 경기 번호가 홀수면 player1, 짝수면 player2
      // 예: 예선 경기 1,2 → 4강 경기 1의 player1, player2
      //     예선 경기 3,4 → 4강 경기 2의 player1, player2
      const isPlayer1Position = currentMatch.match_number % 2 === 1;

      if (isPlayer1Position) {
        // player1 위치에 배정
        nextMatch.player1_idx = winnerIdx;
        // 소스 경기 정보 제거 (승자가 확정되었으므로)
        nextMatch.player1_source_match_idx = null;
      } else {
        // player2 위치에 배정
        nextMatch.player2_idx = winnerIdx;
        // 소스 경기 정보 제거 (승자가 확정되었으므로)
        nextMatch.player2_source_match_idx = null;
      }

      // 다음 경기 상태를 PENDING으로 설정 (아직 시작 전)
      if (nextMatch.status === MatchStatus.PENDING || nextMatch.status === null) {
        nextMatch.status = MatchStatus.PENDING;
      }

      await this.matchRepository.save(nextMatch);

      // WebSocket으로 다음 경기도 업데이트 전송 (있으면)
      // 이 부분은 match.service에서 직접 gateway를 호출할 수 없으므로
      // controller에서 처리하도록 합니다.
    } catch (error) {
      // 에러가 발생해도 현재 경기 업데이트는 성공했으므로 로그만 남기고 계속 진행
      console.error(`다음 경기로 승자 배정 중 오류: ${error.message}`, error);
    }
  }

  /**
   * 경기 삭제
   */
  async remove(matchIdx: number): Promise<void> {
    try {
      const match = await this.matchRepository.findOne({
        where: { idx: matchIdx },
      });

      if (!match) {
        throw new NotFoundException("경기 정보를 찾을 수 없습니다.");
      }

      await this.matchRepository.remove(match);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException("경기 삭제에 실패했습니다.");
    }
  }
}
