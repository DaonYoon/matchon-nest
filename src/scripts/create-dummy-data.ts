import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';
import { createDatabaseConfig } from '../config/database.config';
import { ConfigService } from '@nestjs/config';
import { Player } from '../player/entities/player.entity';
import { Group } from '../group/entities/group.entity';
import { Competition } from '../competition/entities/competition.entity';

/**
 * 더미 데이터 생성 스크립트
 * competition_idx = 2인 대회에 대해 그룹 8개, 각 그룹에 선수 16명씩 생성
 */
async function createDummyData() {
  // 환경 변수 로드
  dotenv.config({ path: '.env.local' });

  const configService = new ConfigService();
  const dbConfig = createDatabaseConfig(configService);
  const dataSource = new DataSource(dbConfig as any);

  try {
    await dataSource.initialize();
    console.log('데이터베이스 연결 성공');

    const competitionRepository = dataSource.getRepository(Competition);
    const groupRepository = dataSource.getRepository(Group);
    const playerRepository = dataSource.getRepository(Player);

    // 대회 확인
    const competition = await competitionRepository.findOne({
      where: { idx: 2 },
    });

    if (!competition) {
      console.error('대회 idx 2를 찾을 수 없습니다.');
      process.exit(1);
    }

    // 그룹명 목록
    const groupNames = [
      '남자 어덜트 블루',
      '남자 어덜트 퍼플',
      '남자 어덜트 브라운',
      '여자 어덜트 블루',
      '여자 어덜트 화이트',
      '소년부 화이트',
      '소년부 블루',
      '주니어 퍼플',
    ];

    // 팀명 목록
    const teamNames = [
      '서울 유도클럽',
      '부산 체육관',
      '대전 주짓수 아카데미',
      '인천 그레이시',
      '수원 BJJ',
      '광주 마샬아츠',
      '대구 레슬링',
      '울산 프로젝션',
    ];

    // 이름 목록 (랜덤 생성용)
    const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    const lastNames = ['철수', '영희', '민수', '지영', '준호', '수진', '동준', '미영', '성호', '은지', '현우', '예진', '승호', '민지', '지훈', '서연'];

    // 그룹 및 선수 생성
    for (let groupIndex = 0; groupIndex < groupNames.length; groupIndex++) {
      const groupName = groupNames[groupIndex];
      
      // 그룹 생성
      const group = groupRepository.create({
        name: groupName,
        competition_idx: 3,
        mat_idx: null,
      });

      const savedGroup = await groupRepository.save(group);
      console.log(`그룹 생성: ${groupName} (idx: ${savedGroup.idx})`);

      // 각 그룹에 선수 16명 생성
      for (let playerIndex = 0; playerIndex < 16; playerIndex++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName}${lastName}`;
        const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
        const phone = `010-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`;
        const isPaid = Math.random() > 0.3; // 70% 확률로 입금 완료
        const isWeighInPassed = Math.random() > 0.2; // 80% 확률로 계체 통과

        const player = playerRepository.create({
          name,
          team_name: teamName,
          competition_idx: 3,
          group_idx: savedGroup.idx,
          phone,
          is_paid: isPaid,
          is_weigh_in_passed: isWeighInPassed,
        });

        await playerRepository.save(player);
      }

      console.log(`  선수 16명 생성 완료 (그룹: ${groupName})`);
    }

    console.log('더미 데이터 생성 완료!');
  } catch (error) {
    console.error('더미 데이터 생성 실패:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

createDummyData();

