# 경기 종료 및 승자 자동 배정 가이드

## 개요

경기가 종료되면 승자가 자동으로 다음 상위 경기에 배정됩니다. 예를 들어 8강 경기가 끝나면 승자가 자동으로 4강전에 배정됩니다.

## 동작 방식

### 토너먼트 구조

토너먼트는 단일 제거(Single Elimination) 방식으로 구성됩니다:

- **8강 경기**: 예선전 4개 경기 → 4강전 2개 경기 → 결승전 1개 경기
- **16강 경기**: 예선전 8개 경기 → 8강전 4개 경기 → 4강전 2개 경기 → 결승전 1개 경기
- **32강 경기**: 예선전 16개 경기 → 16강전 8개 경기 → 8강전 4개 경기 → 4강전 2개 경기 → 결승전 1개 경기

### 승자 배정 규칙

각 경기가 끝나면 승자가 다음 경기로 자동 배정됩니다:

1. **예선 경기 1, 2** → 4강 경기 1의 `player1`, `player2`
2. **예선 경기 3, 4** → 4강 경기 2의 `player1`, `player2`
3. **예선 경기 5, 6** → 4강 경기 3의 `player1`, `player2`
4. **예선 경기 7, 8** → 4강 경기 4의 `player1`, `player2`

**공식**:
- 다음 라운드의 경기 번호 = `Math.ceil(현재 경기 번호 / 2)`
- 다음 라운드에서 `player1`인지 `player2`인지 = `(현재 경기 번호 % 2 === 1) ? player1 : player2`

예시:
- 예선 경기 1 (match_number=1) → 4강 경기 1의 `player1` (홀수이므로 player1)
- 예선 경기 2 (match_number=2) → 4강 경기 1의 `player2` (짝수이므로 player2)
- 예선 경기 3 (match_number=3) → 4강 경기 2의 `player1` (홀수이므로 player1)
- 예선 경기 4 (match_number=4) → 4강 경기 2의 `player2` (짝수이므로 player2)

## API 사용법

### 경기 종료 및 승자 배정

경기 상태를 `END`로 변경하고 승자 아이디를 전달하면 자동으로 다음 경기에 배정됩니다.

**엔드포인트**: `PATCH /api/matches/:matchIdx`

**요청 예시**:

```javascript
// 경기 종료 및 승자 배정
const response = await fetch(`http://localhost:4003/api/matches/${matchIdx}`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    status: 'END',           // 경기 상태를 END로 변경
    winner_idx: 5,           // 승자 아이디
    score_player1: 10,       // 선택: 선수1 점수
    score_player2: 5,        // 선택: 선수2 점수
    result: '판정승',        // 선택: 경기 결과
    advantage_player1: 2,   // 선택: 선수1 어드밴티지
    advantage_player2: 1,   // 선택: 선수2 어드밴티지
    penalty_player1: 0,     // 선택: 선수1 패널티
    penalty_player2: 1,     // 선택: 선수2 패널티
  })
});

const data = await response.json();
```

**응답 예시**:

```json
{
  "success": true,
  "message": "경기 정보가 수정되었습니다.",
  "data": {
    "idx": 1,
    "status": "END",
    "winner_idx": 5,
    "player1_idx": 3,
    "player2_idx": 5,
    "next_match_idx": 10,
    "score_player1": 10,
    "score_player2": 5,
    ...
  }
}
```

### 경기 결과 업데이트 (기존 방식)

기존의 `PATCH /api/matches/:matchIdx/result` 엔드포인트도 사용할 수 있습니다. 이 엔드포인트는 자동으로 다음 경기로 승자를 배정합니다.

**엔드포인트**: `PATCH /api/matches/:matchIdx/result`

**요청 예시**:

```javascript
const response = await fetch(`http://localhost:4003/api/matches/${matchIdx}/result`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    winner_idx: 5,
    score_player1: 10,
    score_player2: 5,
  })
});
```

## 프론트엔드 구현 예시

### React 예시

```jsx
import { useState } from 'react';

function MatchEndButton({ match, onMatchEnd }) {
  const [loading, setLoading] = useState(false);

  const handleEndMatch = async (winnerIdx) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4003/api/matches/${match.idx}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'END',
          winner_idx: winnerIdx,
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('경기 종료 및 승자 배정 완료:', data);
        onMatchEnd(data.data);
      } else {
        const error = await response.json();
        console.error('경기 종료 실패:', error);
      }
    } catch (error) {
      console.error('경기 종료 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="match-end-buttons">
      <button
        onClick={() => handleEndMatch(match.player1_idx)}
        disabled={loading || match.status === 'END'}
      >
        {match.player1?.name} 승리
      </button>
      <button
        onClick={() => handleEndMatch(match.player2_idx)}
        disabled={loading || match.status === 'END'}
      >
        {match.player2?.name} 승리
      </button>
    </div>
  );
}

export default MatchEndButton;
```

### JavaScript 예시

```javascript
class MatchManager {
  constructor(apiBaseUrl, token) {
    this.apiBaseUrl = apiBaseUrl;
    this.token = token;
  }

  /**
   * 경기 종료 및 승자 배정
   * @param {number} matchIdx - 경기 idx
   * @param {number} winnerIdx - 승자 idx
   * @param {object} optionalData - 선택적 데이터 (점수, 결과 등)
   */
  async endMatch(matchIdx, winnerIdx, optionalData = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/matches/${matchIdx}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          status: 'END',
          winner_idx: winnerIdx,
          ...optionalData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '경기 종료에 실패했습니다.');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('경기 종료 중 오류:', error);
      throw error;
    }
  }

  /**
   * 경기 종료 및 다음 경기 확인
   */
  async endMatchAndCheckNext(matchIdx, winnerIdx, optionalData = {}) {
    const updatedMatch = await this.endMatch(matchIdx, winnerIdx, optionalData);
    
    // 다음 경기 정보 확인
    if (updatedMatch.next_match_idx) {
      const nextMatch = await this.getMatch(updatedMatch.next_match_idx);
      console.log('다음 경기 정보:', nextMatch);
      
      // 다음 경기에 승자가 배정되었는지 확인
      if (nextMatch.player1_idx === winnerIdx || nextMatch.player2_idx === winnerIdx) {
        console.log('승자가 다음 경기에 자동 배정되었습니다.');
      }
    }
    
    return updatedMatch;
  }

  /**
   * 경기 정보 조회
   */
  async getMatch(matchIdx) {
    const response = await fetch(`${this.apiBaseUrl}/matches/${matchIdx}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('경기 정보 조회에 실패했습니다.');
    }
    
    const data = await response.json();
    return data.data;
  }
}

// 사용 예시
const matchManager = new MatchManager('http://localhost:4003/api', 'YOUR_TOKEN');

// 경기 종료
matchManager.endMatchAndCheckNext(1, 5, {
  score_player1: 10,
  score_player2: 5,
  result: '판정승'
}).then(match => {
  console.log('경기 종료 완료:', match);
});
```

## WebSocket 실시간 업데이트

경기가 종료되고 승자가 배정되면 WebSocket을 통해 실시간으로 업데이트가 전송됩니다.

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:4003/matches', {
  transports: ['websocket']
});

// 특정 매트 구독
socket.emit('subscribe', {
  competitionIdx: 1,
  matIdx: 1
});

// 경기 업데이트 수신
socket.on('matches', (data) => {
  console.log('경기 업데이트:', data);
  
  data.matches.forEach(match => {
    // 다음 경기에 승자가 배정되었는지 확인
    if (match.status === 'PENDING' && (match.player1_idx || match.player2_idx)) {
      console.log(`경기 ${match.idx}: 다음 경기 준비 완료`);
      console.log(`  - Player1: ${match.player1_idx || '대기중'}`);
      console.log(`  - Player2: ${match.player2_idx || '대기중'}`);
    }
  });
});
```

## 시나리오 예시

### 8강 토너먼트 예시

1. **예선전 4개 경기 생성**
   - 경기 1: 선수 A vs 선수 B
   - 경기 2: 선수 C vs 선수 D
   - 경기 3: 선수 E vs 선수 F
   - 경기 4: 선수 G vs 선수 H

2. **4강전 2개 경기 생성 (비어있음)**
   - 경기 5: player1=null, player2=null
   - 경기 6: player1=null, player2=null

3. **결승전 1개 경기 생성 (비어있음)**
   - 경기 7: player1=null, player2=null

4. **예선전 경기 종료**
   - 경기 1 종료 → 승자 A → 경기 5의 `player1`에 자동 배정
   - 경기 2 종료 → 승자 C → 경기 5의 `player2`에 자동 배정
   - 경기 3 종료 → 승자 E → 경기 6의 `player1`에 자동 배정
   - 경기 4 종료 → 승자 G → 경기 6의 `player2`에 자동 배정

5. **4강전 경기 종료**
   - 경기 5 종료 → 승자 A → 경기 7의 `player1`에 자동 배정
   - 경기 6 종료 → 승자 E → 경기 7의 `player2`에 자동 배정

6. **결승전 경기 종료**
   - 경기 7 종료 → 최종 승자 결정 (다음 경기 없음)

## 주의사항

1. **승자 유효성 검사**: 승자는 반드시 경기에 참가한 선수(`player1_idx` 또는 `player2_idx`)여야 합니다.
2. **다음 경기 존재 확인**: 다음 경기가 없으면 (결승전 등) 승자 배정은 수행되지 않습니다.
3. **자동 상태 변경**: 다음 경기의 상태가 `PENDING`이면 자동으로 `PENDING`으로 설정됩니다.
4. **실시간 업데이트**: 승자 배정 후 WebSocket을 통해 모든 구독자에게 실시간 업데이트가 전송됩니다.
5. **경기 번호 규칙**: 승자 배정은 `match_number`를 기반으로 수행되므로, 대진표 생성 시 올바른 `match_number`가 설정되어 있어야 합니다.

## 에러 처리

### 승자가 경기에 참가하지 않은 경우

```json
{
  "success": false,
  "message": "승자는 경기에 참가한 선수여야 합니다.",
  "status": 400
}
```

### 다음 경기가 없는 경우 (결승전)

경기 종료는 정상적으로 처리되지만, 승자 배정은 수행되지 않습니다. 이는 정상적인 동작입니다.

## 관련 API

- `PATCH /api/matches/:matchIdx` - 경기 정보 수정 (경기 종료 및 승자 배정)
- `PATCH /api/matches/:matchIdx/result` - 경기 결과 업데이트 (자동 승자 배정)
- `GET /api/matches/:matchIdx` - 경기 정보 조회
- `GET /api/matches/:competitionIdx/:groupIdx` - 그룹의 대진표 조회

## 추가 정보

자세한 WebSocket 사용법은 `WEBSOCKET_GUIDE.md`를 참고하세요.

