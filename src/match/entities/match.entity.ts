import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { Group } from '@/group/entities/group.entity';
import { Player } from '@/player/entities/player.entity';

/**
 * 경기 상태 열거형
 */
export enum MatchStatus {
  PENDING = 'PENDING', // 대기중
  IN_PROGRESS = 'IN_PROGRESS', // 진행중
  COMPLETED = 'COMPLETED', // 완료
  BYE = 'BYE', // 부전승
  ACTIVE = 'ACTIVE', // 활성
  PAUSE = 'PAUSE', // 일시정지
  END = 'END', // 종료
}

/**
 * 경기 정보를 저장하는 엔티티
 * group_idx: 소속 그룹 idx
 * round: 라운드 번호 (1=결승, 2=준결승, 4=4강, 8=8강, 16=16강, 32=32강, 64=64강)
 * match_number: 해당 라운드 내 경기 번호 (1부터 시작)
 * player1_idx: 선수1 idx
 * player2_idx: 선수2 idx (nullable, 부전승 가능)
 * winner_idx: 승자 idx (nullable, 경기 완료 전까지 null)
 * status: 경기 상태
 * next_match_idx: 다음 경기로 연결되는 match idx (nullable, 결승전은 null)
 * score_player1: 선수1 점수 (nullable, 경기 완료 후 기록)
 * score_player2: 선수2 점수 (nullable, 경기 완료 후 기록)
 * order: 경기 순서 (매트별 순서, 예선전은 match_number와 동일, 준결승/결승은 뒷번호)
 */
@Entity('matches')
@Index('idx_match_group', ['group_idx'])
@Index('idx_match_round', ['group_idx', 'round'])
@Index('idx_match_player1', ['player1_idx'])
@Index('idx_match_player2', ['player2_idx'])
@Index('idx_match_winner', ['winner_idx'])
@Index('idx_match_next', ['next_match_idx'])
export class Match extends BaseEntity {
  @Column({
    type: 'int',
    nullable: false,
    comment: '소속 그룹 idx'
  })
  @IsNotEmpty({ message: '소속 그룹은 필수입니다.' })
  @IsNumber({}, { message: '소속 그룹은 숫자여야 합니다.' })
  group_idx: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '라운드 번호 (1=결승, 2=준결승, 4=4강, 8=8강, 16=16강, 32=32강, 64=64강)'
  })
  @IsNotEmpty({ message: '라운드는 필수입니다.' })
  @IsNumber({}, { message: '라운드는 숫자여야 합니다.' })
  round: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '해당 라운드 내 경기 번호 (1부터 시작)'
  })
  @IsNotEmpty({ message: '경기 번호는 필수입니다.' })
  @IsNumber({}, { message: '경기 번호는 숫자여야 합니다.' })
  match_number: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수1 idx (nullable, 부전승 가능)'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수1 idx는 숫자여야 합니다.' })
  player1_idx: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수2 idx (nullable, 부전승 가능)'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수2 idx는 숫자여야 합니다.' })
  player2_idx: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '승자 idx (nullable, 경기 완료 전까지 null)'
  })
  @IsOptional()
  @IsNumber({}, { message: '승자 idx는 숫자여야 합니다.' })
  winner_idx: number | null;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    nullable: false,
    default: MatchStatus.PENDING,
    comment: '경기 상태'
  })
  @IsNotEmpty({ message: '경기 상태는 필수입니다.' })
  @IsEnum(MatchStatus, { message: '올바른 경기 상태가 아닙니다.' })
  status: MatchStatus;

  @Column({
    type: 'int',
    nullable: true,
    comment: '다음 경기로 연결되는 match idx (nullable, 결승전은 null)'
  })
  @IsOptional()
  @IsNumber({}, { message: '다음 경기 idx는 숫자여야 합니다.' })
  next_match_idx: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'player1의 소스 경기 idx (승자가 확정되기 전까지 표시용)'
  })
  @IsOptional()
  @IsNumber({}, { message: 'player1 소스 경기 idx는 숫자여야 합니다.' })
  player1_source_match_idx: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'player2의 소스 경기 idx (승자가 확정되기 전까지 표시용)'
  })
  @IsOptional()
  @IsNumber({}, { message: 'player2 소스 경기 idx는 숫자여야 합니다.' })
  player2_source_match_idx: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수1 점수 (nullable, 경기 완료 후 기록)'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수1 점수는 숫자여야 합니다.' })
  score_player1: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수2 점수 (nullable, 경기 완료 후 기록)'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수2 점수는 숫자여야 합니다.' })
  score_player2: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '경기 순서 (매트별 순서, 예선전은 match_number와 동일, 준결승/결승은 뒷번호)'
  })
  @IsOptional()
  @IsNumber({}, { message: '경기 순서는 숫자여야 합니다.' })
  order: number | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '경기 결과 (텍스트, 최대 50자)'
  })
  @IsOptional()
  result: string | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수1 어드밴티지'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수1 어드밴티지는 숫자여야 합니다.' })
  advantage_player1: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수2 어드밴티지'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수2 어드밴티지는 숫자여야 합니다.' })
  advantage_player2: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수1 패널티'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수1 패널티는 숫자여야 합니다.' })
  penalty_player1: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '선수2 패널티'
  })
  @IsOptional()
  @IsNumber({}, { message: '선수2 패널티는 숫자여야 합니다.' })
  penalty_player2: number | null;

  @Column({
    type: 'int',
    nullable: true,
    comment: '경기 시간 (초 단위)'
  })
  @IsOptional()
  @IsNumber({}, { message: '경기 시간은 숫자여야 합니다.' })
  time: number | null;

  // 관계 설정
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_idx', referencedColumnName: 'idx' })
  group: Group;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'player1_idx', referencedColumnName: 'idx' })
  player1: Player | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'player2_idx', referencedColumnName: 'idx' })
  player2: Player | null;

  @ManyToOne(() => Player, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'winner_idx', referencedColumnName: 'idx' })
  winner: Player | null;

  @ManyToOne(() => Match, (match) => match.previousMatches, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'next_match_idx', referencedColumnName: 'idx' })
  nextMatch: Match | null;

  @OneToMany(() => Match, (match) => match.nextMatch)
  previousMatches: Match[];
}

