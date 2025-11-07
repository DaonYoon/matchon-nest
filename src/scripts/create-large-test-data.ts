import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { createDatabaseConfig } from '../config/database.config';
import { ConfigService } from '@nestjs/config';
import { Player } from '../player/entities/player.entity';
import { Group } from '../group/entities/group.entity';
import { Mat } from '../mat/entities/mat.entity';
import { Competition } from '../competition/entities/competition.entity';
import { MatStatus } from '../mat/entities/mat.entity';

/**
 * 대규모 테스트 데이터 생성 스크립트
 * competition_idx = 2인 대회에 대해:
 * - 매트 6개 (A, B, C, D, E, F)
 * - 각 벨트별 그룹 6개씩 (화이트, 블루, 퍼플, 브라운)
 * - 각 그룹마다 선수 20명씩
 */
async function createLargeTestData() {
  // 환경 변수 로드
  dotenv.config({ path: '.env.local' });

  const configService = new ConfigService();
  const dbConfig = createDatabaseConfig(configService);
  const dataSource = new DataSource(dbConfig as any);

  try {
    await dataSource.initialize();
    console.log('✅ 데이터베이스 연결 성공');

    const TEST_COMPETITION_NUMBER = +process.env.TEST_COMPETITION_NUMBER

    const competitionRepository = dataSource.getRepository(Competition);
    const matRepository = dataSource.getRepository(Mat);
    const groupRepository = dataSource.getRepository(Group);
    const playerRepository = dataSource.getRepository(Player);

    // 대회 확인
    const competition = await competitionRepository.findOne({
      where: { idx: TEST_COMPETITION_NUMBER },
    });

    if (!competition) {
      console.error('❌ 대회 idx pro를 찾을 수 없습니다.');
      process.exit(1);
    }

    console.log(`✅ 대회 확인: ${competition.name} (idx: ${competition.idx})`);

    // 매트 생성 (A, B, C, D, E, F)
    const matNames = ['A', 'B', 'C', 'D', 'E', 'F'];
    const mats: Mat[] = [];

    console.log('\n📦 매트 생성 중...');
    for (const matName of matNames) {
      const mat = matRepository.create({
        name: matName,
        desc: `매트 ${matName}`,
        status: MatStatus.ACTIVE,
        competition_idx: TEST_COMPETITION_NUMBER,
      });
      const savedMat = await matRepository.save(mat);
      mats.push(savedMat);
      console.log(`  ✅ 매트 생성: ${matName} (idx: ${savedMat.idx})`);
    }

    // 그룹 정의
    const groupDefinitions = [
      // 남자 어덜트 화이트: -56부터 6단위씩 증가, 6개 그룹
      {
        gender: '남자',
        age: '어덜트',
        belt: '화이트',
        startWeight: -56,
        increment: 6,
        count: 6,
      },
      // 여자 어덜트 화이트: -56부터 5단위씩 증가, 6개 그룹
      {
        gender: '여자',
        age: '어덜트',
        belt: '화이트',
        startWeight: -56,
        increment: 5,
        count: 6,
      },
      // 남자 어덜트 블루: -56부터 6단위씩 증가, 6개 그룹
      {
        gender: '남자',
        age: '어덜트',
        belt: '블루',
        startWeight: -56,
        increment: 6,
        count: 6,
      },
      // 여자 어덜트 블루: -56부터 5단위씩 증가, 6개 그룹
      {
        gender: '여자',
        age: '어덜트',
        belt: '블루',
        startWeight: -56,
        increment: 5,
        count: 6,
      },
      // 남자 어덜트 퍼플: -56부터 6단위씩 증가, 6개 그룹
      {
        gender: '남자',
        age: '어덜트',
        belt: '퍼플',
        startWeight: -56,
        increment: 6,
        count: 6,
      },
      // 여자 어덜트 퍼플: -56부터 5단위씩 증가, 6개 그룹
      {
        gender: '여자',
        age: '어덜트',
        belt: '퍼플',
        startWeight: -56,
        increment: 5,
        count: 6,
      },
      // 남자 어덜트 브라운: -56부터 6단위씩 증가, 6개 그룹
      {
        gender: '남자',
        age: '어덜트',
        belt: '브라운',
        startWeight: -56,
        increment: 6,
        count: 6,
      },
      // 여자 어덜트 브라운: -56부터 5단위씩 증가, 6개 그룹
      {
        gender: '여자',
        age: '어덜트',
        belt: '브라운',
        startWeight: -56,
        increment: 5,
        count: 6,
      },
    ];

    // 팀명 목록 (랜덤 생성용)
    const teamNames = [
      '서울 유도클럽',
      '부산 체육관',
      '대전 주짓수 아카데미',
      '인천 그레이시',
      '수원 BJJ',
      '광주 마샬아츠',
      '대구 레슬링',
      '울산 프로젝션',
      '경기 주짓수',
      '강원 유도',
      '전주 체육관',
      '제주 마샬아츠',
      '창원 BJJ',
      '천안 그레이시',
      '포항 유도클럽',
      '청주 체육관',
    ];

    // 이름 목록 (랜덤 생성용)
    const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
    const lastNames = [
      '철수', '영희', '민수', '지영', '준호', '수진', '동준', '미영', '성호', '은지',
      '현우', '예진', '승호', '민지', '지훈', '서연', '준영', '혜진', '상우', '지은',
      '민준', '서윤', '도윤', '예준', '시우', '하준', '주원', '지호', '준서', '건우',
      '현준', '우진', '선우', '연우', '정우', '승우', '지우', '민재', '윤서', '하은',
    ];

    let totalGroups = 0;
    let totalPlayers = 0;

    console.log('\n📋 그룹 및 선수 생성 중...');
    
    // 각 그룹 정의에 대해 그룹 생성
    for (const groupDef of groupDefinitions) {
      for (let i = 0; i < groupDef.count; i++) {
        const weight = groupDef.startWeight + (groupDef.increment * i);
        const weightStr = weight < 0 ? `${weight}` : `+${weight}`;
        const groupName = `${groupDef.gender} ${groupDef.age} ${groupDef.belt} ${weightStr}kg`;
        
        // 경기 시간 랜덤 (4분 또는 6분)
        const matchTime = Math.random() > 0.5 ? 4 : 6;
        
        // 매트 랜덤 배정 (순환)
        const matIndex = totalGroups % mats.length;
        const assignedMat = mats[matIndex];

        // 그룹 생성
        const group = groupRepository.create({
          name: groupName,
          competition_idx: TEST_COMPETITION_NUMBER,
          mat_idx: assignedMat.idx,
          match_time: matchTime,
        });

        const savedGroup = await groupRepository.save(group);
        totalGroups++;
        console.log(`  ✅ 그룹 생성: ${groupName} (idx: ${savedGroup.idx}, 매트: ${assignedMat.name}, 시간: ${matchTime}분)`);

        // 각 그룹에 선수 20명 생성
        const players: Player[] = [];
        for (let playerIndex = 0; playerIndex < 20; playerIndex++) {
          const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
          const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
          const name = `${firstName}${lastName}`;
          const teamName = teamNames[Math.floor(Math.random() * teamNames.length)];
          const phone = `010-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
          const isPaid = Math.random() > 0.2; // 80% 확률로 입금 완료
          const isWeighInPassed = Math.random() > 0.3; // 70% 확률로 계체 통과

          const player = playerRepository.create({
            name,
            team_name: teamName,
            competition_idx: TEST_COMPETITION_NUMBER,
            group_idx: savedGroup.idx,
            phone,
            is_paid: isPaid,
            is_weigh_in_passed: isWeighInPassed,
          });

          players.push(player);
        }

        // 배치로 선수 저장 (성능 향상)
        await playerRepository.save(players);
        totalPlayers += players.length;
        console.log(`    ✅ 선수 20명 생성 완료 (그룹: ${groupName})`);
      }
    }

    console.log('\n📊 생성 완료 요약:');
    console.log(`  - 매트: ${mats.length}개`);
    console.log(`  - 그룹: ${totalGroups}개`);
    console.log(`  - 선수: ${totalPlayers}명`);
    console.log('\n✅ 대규모 테스트 데이터 생성 완료!');
  } catch (error) {
    console.error('❌ 대규모 테스트 데이터 생성 실패:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

createLargeTestData();

