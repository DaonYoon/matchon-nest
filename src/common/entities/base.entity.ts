import { PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 모든 데이터베이스 테이블의 기본 속성을 정의하는 추상 클래스
 * idx: 고유번호 (오토인크리먼트)
 * created_at: 생성일시
 * updated_at: 수정일시
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  idx: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    comment: '생성일시'
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    comment: '수정일시'
  })
  updated_at: Date;
}
