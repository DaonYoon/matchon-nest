import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@/user/entities/user.entity';
import { Competition } from '@/competition/entities/competition.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { Group } from '@/group/entities/group.entity';
import { Player } from '@/player/entities/player.entity';
import { Match } from '@/match/entities/match.entity';

/**
 * TypeORM 데이터베이스 설정
 * MySQL 데이터베이스 연결 설정
 */
export const createDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 3306),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_DATABASE', 'myplace_db'),
  entities: [User, Competition, Mat, Group, Player, Match],
  // DB 모델 자동 동기화 설정
  // 환경 변수 DB_SYNC가 있으면 그 값을 사용하고, 없으면 모든 환경에서 true (자동 업데이트)
  synchronize: configService.get('DB_SYNC') === 'false' || configService.get('DB_SYNC') === false ? false : true,
  // 마이그레이션 자동 실행 비활성화 (synchronize와 함께 사용)
  migrationsRun: false,
  // 엔티티 자동 로드 비활성화 (명시적으로 entities 배열에 등록)
  autoLoadEntities: false,
  logging: false, // DB 쿼리 로그 비활성화
  timezone: '+09:00',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4_general_ci',
  },
});
