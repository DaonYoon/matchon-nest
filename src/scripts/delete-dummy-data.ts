import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { createDatabaseConfig } from '../config/database.config';
import { ConfigService } from '@nestjs/config';
import { Player } from '../player/entities/player.entity';
import { Group } from '../group/entities/group.entity';
import { Match } from '../match/entities/match.entity';
import * as readline from 'readline';

/**
 * 더미 데이터 삭제 스크립트
 * competition_idx = 3인 대회의 모든 경기, 선수, 그룹 삭제
 */
async function deleteDummyData() {
  // 환경 변수 로드
  dotenv.config({ path: '.env.local' });

  const configService = new ConfigService();
  const dbConfig = createDatabaseConfig(configService);
  const dataSource = new DataSource(dbConfig as any);

  try {
    await dataSource.initialize();
    console.log('데이터베이스 연결 성공');

    // 확인 메시지
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('대회 idx 3의 모든 경기, 선수, 그룹을 삭제하시겠습니까? (yes/no): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('삭제가 취소되었습니다.');
      process.exit(0);
    }

    const matchRepository = dataSource.getRepository(Match);
    const playerRepository = dataSource.getRepository(Player);
    const groupRepository = dataSource.getRepository(Group);

    // competition_idx = 2인 그룹들 조회
    const groups = await groupRepository.find({
      where: { competition_idx: 3 },
      select: ['idx'],
    });

    const groupIndices = groups.map((g) => g.idx);

    if (groupIndices.length > 0) {
      // 관련 경기 삭제
      const matchCount = await matchRepository.count({
        where: { group_idx: groupIndices[0] }, // 첫 번째 그룹만 확인 (실제로는 모든 그룹)
      });

      // 모든 그룹의 경기 삭제
      for (const groupIdx of groupIndices) {
        await matchRepository.delete({ group_idx: groupIdx });
      }

      console.log(`경기 삭제 완료 (그룹 수: ${groupIndices.length})`);
    }

    // competition_idx = 2인 선수 삭제
    const playerCount = await playerRepository.count({
      where: { competition_idx: 3 },
    });

    await playerRepository.delete({
      competition_idx: 2,
    });

    console.log(`선수 삭제 완료 (${playerCount}명)`);

    // competition_idx = 2인 그룹 삭제
    const groupCount = groups.length;
    await groupRepository.delete({
      competition_idx: 3,
    });

    console.log(`그룹 삭제 완료 (${groupCount}개)`);
    console.log('더미 데이터 삭제 완료!');
  } catch (error) {
    console.error('더미 데이터 삭제 실패:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

deleteDummyData();

