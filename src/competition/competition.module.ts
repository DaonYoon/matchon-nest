import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Competition } from './entities/competition.entity';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { User } from '@/user/entities/user.entity';
import { Group } from '@/group/entities/group.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { Player } from '@/player/entities/player.entity';
import { Match } from '@/match/entities/match.entity';
import { S3Service } from '@/common/services/s3.service';
import { AuthModule } from '@/auth/auth.module';

/**
 * 대회 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Competition, User, Group, Mat, Player, Match]),
    AuthModule, // JwtService와 JwtAuthGuard를 사용하기 위해 import
  ],
  controllers: [CompetitionController],
  providers: [CompetitionService, S3Service],
  exports: [CompetitionService],
})
export class CompetitionModule {}

