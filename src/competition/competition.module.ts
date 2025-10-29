import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competition } from './entities/competition.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { User } from '@/user/entities/user.entity';

/**
 * 대회 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Competition, User])],
  controllers: [CompetitionController],
  providers: [CompetitionService],
  exports: [CompetitionService],
})
export class CompetitionModule {}

