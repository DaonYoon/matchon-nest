import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './entities/player.entity';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { Group } from '@/group/entities/group.entity';
import { Competition } from '@/competition/entities/competition.entity';

/**
 * 선수 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Player, Group, Competition])],
  controllers: [PlayerController],
  providers: [PlayerService],
  exports: [PlayerService],
})
export class PlayerModule {}

