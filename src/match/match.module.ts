import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from './entities/match.entity';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';
import { MatchGateway } from './match.gateway';
import { Group } from '@/group/entities/group.entity';
import { Player } from '@/player/entities/player.entity';
import { Mat } from '@/mat/entities/mat.entity';
import { AuthModule } from '@/auth/auth.module';

/**
 * 경기 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Match, Group, Player, Mat]),
    AuthModule, // JwtService와 JwtAuthGuard를 사용하기 위해 import
  ],
  controllers: [MatchController],
  providers: [MatchService, MatchGateway],
  exports: [MatchService, MatchGateway],
})
export class MatchModule {}

