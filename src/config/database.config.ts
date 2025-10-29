import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '@/user/entities/user.entity';
import { Competition } from '@/competition/entities/competition.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { Group } from '@/group/entities/group.entity';
import { Player } from '@/player/entities/player.entity';

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
  entities: [User, Competition, Mat, Group, Player],
  synchronize: configService.get('NODE_ENV') !== 'production',
  logging: false, // DB 쿼리 로그 비활성화
  timezone: '+09:00',
  charset: 'utf8mb4',
  extra: {
    charset: 'utf8mb4_general_ci',
  },
});
