import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mat } from './entities/mat.entity';
import { MatController } from './mat.controller';
import { MatService } from './mat.service';
import { Competition } from '@/competition/entities/competition.entity';

/**
 * 매트 모듈
 */
@Module({
  imports: [TypeOrmModule.forFeature([Mat, Competition])],
  controllers: [MatController],
  providers: [MatService],
  exports: [MatService],
})
export class MatModule {}

