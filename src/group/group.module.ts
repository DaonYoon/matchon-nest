import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { Competition } from '@/competition/entities/competition.entity';
import { Mat } from '@/mat/entities/mat.entity';

/**
 * 그룹 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Group, Competition, Mat])],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}

