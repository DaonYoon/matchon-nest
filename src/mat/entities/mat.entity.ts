import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Competition } from '@/competition/entities/competition.entity';
import { Group } from '@/group/entities/group.entity';

/**
 * 매트 상태 열거형
 */
export enum MatStatus {
  ACTIVE = 'active', // 활성
  INACTIVE = 'inactive', // 비활성
}

/**
 * 매트 정보를 저장하는 엔티티
 * name: 매트명
 * desc: 매트 설명
 * status: 매트 상태
 * competition_idx: 소속 대회 idx
 */
@Entity('mats')
@Index('idx_mat_competition', ['competition_idx'])
@Index('idx_mat_status', ['status'])
export class Mat extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '매트명'
  })
  @IsNotEmpty({ message: '매트명은 필수입니다.' })
  @IsString({ message: '매트명은 문자열이어야 합니다.' })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '매트 설명'
  })
  @IsOptional()
  @IsString({ message: '매트 설명은 문자열이어야 합니다.' })
  desc: string;

  @Column({
    type: 'enum',
    enum: MatStatus,
    nullable: false,
    default: MatStatus.ACTIVE,
    comment: '매트 상태'
  })
  @IsNotEmpty({ message: '매트 상태는 필수입니다.' })
  @IsEnum(MatStatus, { message: '올바른 매트 상태가 아닙니다.' })
  status: MatStatus;

  @Column({
    type: 'int',
    nullable: false,
    comment: '소속 대회 idx'
  })
  @IsNotEmpty({ message: '소속 대회는 필수입니다.' })
  competition_idx: number;

  // 관계 설정
  @ManyToOne(() => Competition, (competition) => competition.mats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'competition_idx', referencedColumnName: 'idx' })
  competition: Competition;

  @OneToMany(() => Group, (group) => group.mat)
  groups: Group[];
}

