# 대진표 생성 가이드

## 개요

대진표 생성 시 예선전 경기만 선수를 배정하고, 상위 경기(4강, 결승 등)는 승자가 확정되기 전까지 "N번 경기 승자 vs M번 경기 승자" 형태로 표시됩니다.

## 대진표 생성 구조

### 8강 토너먼트 예시

1. **예선전 4개 경기** (선수 배정됨)
   - 경기 1: 선수 A vs 선수 B
   - 경기 2: 선수 C vs 선수 D
   - 경기 3: 선수 E vs 선수 F
   - 경기 4: 선수 G vs 선수 H

2. **4강전 2개 경기** (소스 경기 정보로 표시)
   - 경기 5: `1번 경기 승자` vs `2번 경기 승자`
   - 경기 6: `3번 경기 승자` vs `4번 경기 승자`

3. **결승전 1개 경기** (소스 경기 정보로 표시)
   - 경기 7: `5번 경기 승자` vs `6번 경기 승자`

### 데이터 구조

경기 데이터에는 다음 필드가 포함됩니다:

```typescript
{
  idx: number;                    // 경기 idx
  round: number;                  // 라운드 (4=4강, 2=준결승, 1=결승)
  match_number: number;           // 라운드 내 경기 번호
  player1_idx: number | null;     // 선수1 idx (예선전에만 설정)
  player2_idx: number | null;    // 선수2 idx (예선전에만 설정)
  player1_source_match_idx: number | null;  // player1의 소스 경기 idx
  player2_source_match_idx: number | null; // player2의 소스 경기 idx
  player1: {
    idx?: number;
    name?: string;
    team_name?: string;
    // 또는
    source_match_idx?: number;
    display_name?: string;  // "N번 경기 승자"
  } | null;
  player2: {
    // 동일한 구조
  } | null;
}
```

## API 사용법

### 대진표 생성

**엔드포인트**: `POST /api/matches/bracket`

**요청 예시**:

```javascript
const response = await fetch('http://localhost:4003/api/matches/bracket', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    group_idx: 1,
    players: [
      { player_idx: 1, seed: 1 },
      { player_idx: 2, seed: 2 },
      { player_idx: 3, seed: 3 },
      { player_idx: 4, seed: 4 },
      { player_idx: 5, seed: 5 },
      { player_idx: 6, seed: 6 },
      { player_idx: 7, seed: 7 },
      { player_idx: 8, seed: 8 },
    ]
  })
});

const data = await response.json();
```

### 대진표 조회

**엔드포인트**: `GET /api/matches/group/:competitionIdx/:groupIdx`

**응답 예시**:

```json
{
  "success": true,
  "message": "대진표를 조회했습니다.",
  "data": [
    {
      "idx": 1,
      "round": 4,
      "match_number": 1,
      "player1_idx": 1,
      "player2_idx": 2,
      "player1_source_match_idx": null,
      "player2_source_match_idx": null,
      "player1": {
        "idx": 1,
        "name": "선수 A",
        "team_name": "팀 A"
      },
      "player2": {
        "idx": 2,
        "name": "선수 B",
        "team_name": "팀 B"
      },
      "status": "PENDING"
    },
    {
      "idx": 5,
      "round": 2,
      "match_number": 1,
      "player1_idx": null,
      "player2_idx": null,
      "player1_source_match_idx": 1,
      "player2_source_match_idx": 2,
      "player1": {
        "source_match_idx": 1,
        "display_name": "1번 경기 승자"
      },
      "player2": {
        "source_match_idx": 2,
        "display_name": "2번 경기 승자"
      },
      "status": "PENDING"
    }
  ]
}
```

## 프론트엔드 구현 예시

### React 예시

```jsx
import { useEffect, useState } from 'react';

function BracketDisplay({ competitionIdx, groupIdx }) {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    fetchBracket();
  }, [competitionIdx, groupIdx]);

  const fetchBracket = async () => {
    try {
      const response = await fetch(
        `http://localhost:4003/api/matches/group/${competitionIdx}/${groupIdx}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      setMatches(data.data);
    } catch (error) {
      console.error('대진표 조회 실패:', error);
    }
  };

  const getPlayerDisplay = (player) => {
    if (!player) return '대기중';
    
    // 승자가 확정된 경우
    if (player.idx && player.name) {
      return `${player.name} (${player.team_name})`;
    }
    
    // 소스 경기 정보로 표시
    if (player.source_match_idx && player.display_name) {
      return player.display_name;
    }
    
    return '대기중';
  };

  return (
    <div className="bracket">
      {matches.map(match => (
        <div key={match.idx} className="match-item">
          <div className="match-info">
            <span>라운드: {match.round}강</span>
            <span>경기 번호: {match.match_number}</span>
          </div>
          <div className="players">
            <div className="player">
              {getPlayerDisplay(match.player1)}
            </div>
            <div className="vs">VS</div>
            <div className="player">
              {getPlayerDisplay(match.player2)}
            </div>
          </div>
          <div className="status">
            상태: {match.status}
          </div>
        </div>
      ))}
    </div>
  );
}

export default BracketDisplay;
```

### JavaScript 예시

```javascript
class BracketDisplay {
  constructor(competitionIdx, groupIdx, apiBaseUrl, token) {
    this.competitionIdx = competitionIdx;
    this.groupIdx = groupIdx;
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  async fetchBracket() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/matches/group/${this.competitionIdx}/${this.groupIdx}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        }
      );
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('대진표 조회 실패:', error);
      throw error;
    }
  }

  getPlayerDisplay(player) {
    if (!player) return '대기중';
    
    // 승자가 확정된 경우
    if (player.idx && player.name) {
      return `${player.name} (${player.team_name || ''})`;
    }
    
    // 소스 경기 정보로 표시
    if (player.source_match_idx && player.display_name) {
      return player.display_name;
    }
    
    return '대기중';
  }

  render(matches) {
    const container = document.getElementById('bracket-container');
    if (!container) return;

    container.innerHTML = matches.map(match => `
      <div class="match-item">
        <div class="match-info">
          <span>라운드: ${match.round}강</span>
          <span>경기 번호: ${match.match_number}</span>
        </div>
        <div class="players">
          <div class="player">${this.getPlayerDisplay(match.player1)}</div>
          <div class="vs">VS</div>
          <div class="player">${this.getPlayerDisplay(match.player2)}</div>
        </div>
        <div class="status">상태: ${match.status}</div>
      </div>
    `).join('');
  }

  async display() {
    try {
      const matches = await this.fetchBracket();
      this.render(matches);
    } catch (error) {
      console.error('대진표 표시 실패:', error);
    }
  }
}

// 사용 예시
const bracketDisplay = new BracketDisplay(
  1,  // competitionIdx
  1,  // groupIdx
  'http://localhost:4003/api',
  'YOUR_TOKEN'
);

bracketDisplay.display();
```

## 경기 진행 순서

### 그룹별 경기 진행

한 매트에 여러 그룹이 있는 경우:

1. **그룹 A 예선전 4개 경기** 모두 진행
2. **그룹 B 예선전 4개 경기** 모두 진행
3. **그룹 C 예선전 4개 경기** 모두 진행
4. **그룹 A 4강전 2개 경기** 진행
5. **그룹 B 4강전 2개 경기** 진행
6. **그룹 C 4강전 2개 경기** 진행
7. **그룹 A 결승전 1개 경기** 진행
8. **그룹 B 결승전 1개 경기** 진행
9. **그룹 C 결승전 1개 경기** 진행

### 경기 순서 (order 필드)

- **예선전**: `order` = `match_number` (1, 2, 3, 4)
- **4강전**: `order` = 예선전 이후 번호 (5, 6)
- **결승전**: `order` = 4강전 이후 번호 (7)

이렇게 하면 예선전을 모두 치른 후 상위 경기를 진행할 수 있습니다.

## 승자 배정 시 동작

경기가 종료되면 (`status: 'END'`, `winner_idx` 설정) 승자가 자동으로 다음 경기에 배정됩니다:

1. 다음 경기의 `player1_idx` 또는 `player2_idx`에 승자 배정
2. `player1_source_match_idx` 또는 `player2_source_match_idx` 제거 (null로 설정)
3. 다음 경기의 `player1` 또는 `player2`에 실제 선수 정보 표시

자세한 내용은 `MATCH_ADVANCEMENT_GUIDE.md`를 참고하세요.

## 주의사항

1. **소스 경기 정보**: 상위 경기는 대진표 생성 시 `player1_source_match_idx`와 `player2_source_match_idx`가 설정됩니다.
2. **승자 배정**: 경기 종료 시 승자가 자동으로 다음 경기에 배정되면 소스 경기 정보가 제거됩니다.
3. **표시 우선순위**: 
   - `player1_idx` 또는 `player2_idx`가 있으면 실제 선수 정보 표시
   - 없고 `player1_source_match_idx` 또는 `player2_source_match_idx`가 있으면 소스 경기 정보 표시
   - 둘 다 없으면 "대기중" 표시
4. **경기 순서**: `order` 필드를 기준으로 경기를 정렬하여 표시하면 예선전 → 4강전 → 결승전 순서로 표시됩니다.

## 관련 API

- `POST /api/matches/bracket` - 대진표 생성
- `GET /api/matches/group/:competitionIdx/:groupIdx` - 대진표 조회
- `PATCH /api/matches/:matchIdx` - 경기 정보 수정 (경기 종료 및 승자 배정)
- `GET /api/matches/:competitionIdx/:matIdx` - 매트별 경기 목록 조회 (order 낮은 순)

