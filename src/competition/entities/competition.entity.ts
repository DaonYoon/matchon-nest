import { Entity, Column, Index, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { User } from '@/user/entities/user.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { Group } from '@/group/entities/group.entity';

/**
 * 대회 상태 열거형
 */
export enum CompetitionStatus {
  REGISTRATION = 'registration', // 접수중
  CLOSED = 'closed', // 모집마감
  IN_PROGRESS = 'in_progress', // 진행중
  COMPLETED = 'completed', // 종료
}

/**
 * 대회 정보를 저장하는 엔티티
 * name: 대회명
 * region: 지역
 * type: 대회 타입
 * master_idx: 주최자 (유저 idx)
 * start_date: 대회 시작일
 * status: 대회 상태
 */
@Entity('competitions')
@Index('idx_competition_master', ['master_idx'])
@Index('idx_competition_status', ['status'])
@Index('idx_competition_start_date', ['start_date'])
export class Competition extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: '대회명'
  })
  @IsNotEmpty({ message: '대회명은 필수입니다.' })
  @IsString({ message: '대회명은 문자열이어야 합니다.' })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '대회 설명 (장문 가능)'
  })
  @IsOptional()
  @IsString({ message: '대회 설명은 문자열이어야 합니다.' })
  description: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '지역'
  })
  @IsNotEmpty({ message: '지역은 필수입니다.' })
  @IsString({ message: '지역은 문자열이어야 합니다.' })
  region: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '대회장 주소'
  })
  @IsOptional()
  @IsString({ message: '대회장 주소는 문자열이어야 합니다.' })
  address: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '대회 타입'
  })
  @IsNotEmpty({ message: '대회 타입은 필수입니다.' })
  @IsString({ message: '대회 타입은 문자열이어야 합니다.' })
  type: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '주최자 유저 idx'
  })
  @IsNotEmpty({ message: '주최자는 필수입니다.' })
  master_idx: number;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: '대회 시작일 (YYYY-MM-DD)'
  })
  @IsNotEmpty({ message: '대회 시작일은 필수입니다.' })
  @IsString({ message: '대회 시작일은 문자열이어야 합니다.' })
  start_date: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '접수 시작일 (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsString({ message: '접수 시작일은 문자열이어야 합니다.' })
  request_start_date: string | null;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '접수 마감일 (YYYY-MM-DD)'
  })
  @IsOptional()
  @IsString({ message: '접수 마감일은 문자열이어야 합니다.' })
  request_end_date: string | null;

  @Column({
    type: 'enum',
    enum: CompetitionStatus,
    nullable: false,
    default: CompetitionStatus.REGISTRATION,
    comment: '대회 상태'
  })
  @IsNotEmpty({ message: '대회 상태는 필수입니다.' })
  @IsEnum(CompetitionStatus, { message: '올바른 대회 상태가 아닙니다.' })
  status: CompetitionStatus;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '썸네일 이미지 URL'
  })
  @IsOptional()
  @IsString({ message: '썸네일은 문자열이어야 합니다.' })
  thumbnail: string | null;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '참가자 명단 표시 여부'
  })
  is_show_player: boolean;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '대진표 표시 여부'
  })
  @IsOptional()
  is_show_bracket: boolean;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
    comment: '대회 비밀키 (6자리 숫자)'
  })
  @IsOptional()
  @IsString({ message: '비밀키는 문자열이어야 합니다.' })
  secret_key: string | null;

  // 관계 설정
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'master_idx', referencedColumnName: 'idx' })
  master: User;

  @OneToMany(() => Mat, (mat) => mat.competition)
  mats: Mat[];

  @OneToMany(() => Group, (group) => group.competition)
  groups: Group[];
}

