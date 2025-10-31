import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Group } from '@/group/entities/group.entity';

/**
 * 선수 정보를 저장하는 엔티티
 * name: 선수 실명
 * team_name: 소속팀
 * group_idx: 지원한 그룹 idx
 * weight: 선택한 체급
 * 
 * 중복 지원 제한: 같은 그룹의 같은 체급은 지원 불가
 * 다른 그룹의 다른 체급은 지원 가능
 */
@Entity('players')
@Index('idx_player_competition_group', ['competition_idx', 'group_idx'])
export class Player extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '선수 실명'
  })
  @IsNotEmpty({ message: '선수 이름은 필수입니다.' })
  @IsString({ message: '선수 이름은 문자열이어야 합니다.' })
  name: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: '소속팀'
  })
  @IsOptional()
  @IsString({ message: '소속팀은 문자열이어야 합니다.' })
  team_name: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: '소속 대회 idx'
  })
  @IsNotEmpty({ message: '소속 대회는 필수입니다.' })
  competition_idx: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: '지원한 그룹 idx'
  })
  @IsNotEmpty({ message: '지원 그룹은 필수입니다.' })
  group_idx: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '전화번호'
  })
  @IsOptional()
  @IsString({ message: '전화번호는 문자열이어야 합니다.' })
  phone: string | null;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '입금 여부'
  })
  is_paid: boolean;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    comment: '계체 통과 여부'
  })
  is_weigh_in_passed: boolean;

  // 관계 설정
  @ManyToOne(() => Group, (group) => group.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_idx', referencedColumnName: 'idx' })
  group: Group;
}


