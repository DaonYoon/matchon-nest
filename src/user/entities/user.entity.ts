import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@/common/entities/base.entity';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * 사용자 정보를 저장하는 엔티티
 * email: 이메일 (선택사항, 유니크)
 * name: 사용자 이름 (필수)
 * password: 비밀번호 (필수, 해시화되어 저장)
 * affiliation: 소속 (필수)
 * phone: 휴대폰 번호 (선택사항)
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '이메일 주소'
  })
  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  @Index('idx_user_email', { unique: true })
  email: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '사용자 이름'
  })
  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  @IsString({ message: '사용자 이름은 문자열이어야 합니다.' })
  name: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: '비밀번호 (해시화)'
  })
  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '소속'
  })
  @IsNotEmpty({ message: '소속은 필수입니다.' })
  @IsString({ message: '소속은 문자열이어야 합니다.' })
  affiliation: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: '휴대폰 번호'
  })
  @IsOptional()
  @IsString({ message: '휴대폰 번호는 문자열이어야 합니다.' })
  phone: string;
}
