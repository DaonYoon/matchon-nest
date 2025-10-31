import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mat } from './entities/mat.entity';
import { MatController } from './mat.controller';
import { MatService } from './mat.service';
import { Competition } from '@/competition/entities/competition.entity';
import { Group } from '@/group/entities/group.entity';
import { Match } from '@/match/entities/match.entity';
import { AuthModule } from '@/auth/auth.module';

/**
 * 매트 모듈
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Mat, Competition, Group, Match]),
    AuthModule,
  ],
  controllers: [MatController],
  providers: [MatService],
  exports: [MatService],
})
export class MatModule {}

