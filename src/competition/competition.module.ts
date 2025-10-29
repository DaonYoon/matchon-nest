import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competition } from './entities/competition.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { User } from '@/user/entities/user.entity';
import { AuthModule } from '@/auth/auth.module';

/**
 * 대회 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Competition, User]),
    AuthModule, // JwtService와 JwtAuthGuard를 사용하기 위해 import
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}

