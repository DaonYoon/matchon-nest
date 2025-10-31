import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Competition } from '@/competition/entities/competition.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { Player } from '@/player/entities/player.entity';
import { Match } from '@/match/entities/match.entity';

/**
 * 그룹 정보를 저장하는 엔티티
 * name: 그룹명 (예: "남자 어덜트", "여자 흰띠 초등부")
 * weight_classes: 체급 목록 (JSON 배열, 예: ["-70", "-76", "무제한"])
 * competition_idx: 소속 대회 idx
 * mat_idx: 배정된 매트 idx (nullable, 나중에 배정 가능)
 */
@Entity('groups')
@Index('idx_group_competition', ['competition_idx'])
@Index('idx_group_mat', ['mat_idx'])
@Index('idx_group_competition_mat', ['competition_idx', 'mat_idx'])
export class Group extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: '그룹명'
  })
  @IsNotEmpty({ message: '그룹명은 필수입니다.' })
  @IsString({ message: '그룹명은 문자열이어야 합니다.' })
  name: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '소속 대회 idx'
  })
  @IsNotEmpty({ message: '소속 대회는 필수입니다.' })
  competition_idx: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: '배정된 매트 idx (나중에 배정 가능)'
  })
  @IsOptional()
  mat_idx: number | null;

  // 관계 설정
  @ManyToOne(() => Competition, (competition) => competition.groups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competition_idx', referencedColumnName: 'idx' })
  competition: Competition;

  @ManyToOne(() => Mat, (mat) => mat.groups, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'mat_idx', referencedColumnName: 'idx' })
  mat: Mat | null;

  @OneToMany(() => Player, (player) => player.group)
  players: Player[];

  @OneToMany(() => Match, (match) => match.group)
  matches: Match[];
}

