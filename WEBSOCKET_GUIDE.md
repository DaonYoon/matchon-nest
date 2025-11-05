# WebSocket 실시간 경기 정보 서버 가이드

## 개요

이 시스템은 대회 경기 정보를 실시간으로 전송하는 WebSocket 서버를 제공합니다. 관리자가 경기 정보를 수정하면 즉시 모든 구독자에게 업데이트가 전송됩니다.

## 접근 방법

### WebSocket 연결

**엔드포인트**: `ws://localhost:4002/matches` (또는 서버 주소에 맞게 변경)

**Namespace**: `/matches`

### 연결 예시 (JavaScript)

```javascript
import { io } from 'socket.io-client';

// WebSocket 서버에 연결
const socket = io('http://localhost:4002/matches', {
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// 연결 성공
socket.on('connect', () => {
  console.log('WebSocket 연결 성공:', socket.id);
});

// 연결 오류
socket.on('connect_error', (error) => {
  console.error('연결 오류:', error);
});

// 연결 해제
socket.on('disconnect', (reason) => {
  console.log('연결 해제:', reason);
});
```

## 이벤트

### 1. 경기 정보 구독 (subscribe)

대회 ID와 매트 ID를 전송하여 해당 매트의 경기 정보를 구독합니다.

**클라이언트 → 서버**

```javascript
socket.emit('subscribe', {
  competitionIdx: 1,  // 대회 ID
  matIdx: 1          // 매트 ID
});
```

**서버 → 클라이언트**

연결 후 즉시 초기 경기 정보를 받습니다:

```javascript
socket.on('matches', (data) => {
  console.log('경기 정보:', data);
  /*
  {
    competitionIdx: 1,
    matIdx: 1,
    matches: [
      {
        idx: 1,
        created_at: "2024-01-01T00:00:00.000Z",
        updated_at: "2024-01-01T00:00:00.000Z",
        group_idx: 1,
        round: 8,
        match_number: 1,
        player1_idx: 1,
        player2_idx: 2,
        winner_idx: null,
        status: "PENDING",
        next_match_idx: 10,
        score_player1: null,
        score_player2: null,
        order: 1,
        result: null,
        advantage_player1: null,
        advantage_player2: null,
        penalty_player1: null,
        penalty_player2: null,
        player1: {
          idx: 1,
          name: "홍길동",
          team_name: "팀A",
          phone: "010-1234-5678",
          is_paid: true,
          is_weigh_in_passed: true
        },
        player2: {
          idx: 2,
          name: "김철수",
          team_name: "팀B",
          phone: "010-9876-5432",
          is_paid: true,
          is_weigh_in_passed: true
        },
        winner: null,
        group: {
          idx: 1,
          name: "그룹1",
          competition_idx: 1,
          mat_idx: 1
        }
      },
      // ... 더 많은 경기 정보
    ]
  }
  */
});
```

### 2. 경기 정보 업데이트 수신

관리자가 경기 정보를 수정하면 자동으로 업데이트된 정보를 받습니다:

```javascript
socket.on('matches', (data) => {
  // data.matches 배열은 해당 매트의 모든 경기 리스트입니다
  // 경기 정보가 수정되면 전체 경기 리스트가 최신 상태로 업데이트되어 전송됩니다
  console.log('경기 정보 업데이트:', data);
  console.log(`매트 ${data.matIdx}의 전체 경기 개수:`, data.matches.length);
  
  // 모든 경기 리스트를 순회하며 처리
  data.matches.forEach(match => {
    console.log(`경기 ${match.idx}: ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
    console.log(`상태: ${match.status}, 순서: ${match.order}`);
  });
});
```

**중요**: `data.matches`는 배열이며, 해당 매트에 속한 **모든 경기**의 정보를 포함합니다. 한 경기가 아니라 전체 경기 리스트입니다.

### 3. 구독 해제 (unsubscribe)

경기 정보 구독을 해제합니다:

```javascript
socket.emit('unsubscribe');
```

### 4. 에러 처리

```javascript
socket.on('error', (error) => {
  console.error('오류:', error.message);
});
```

## 실시간 업데이트 트리거

다음 REST API 엔드포인트를 호출하면 자동으로 WebSocket으로 업데이트가 전송됩니다:

1. **PATCH /api/matches/:matchIdx** - 경기 정보 수정
2. **PATCH /api/matches/:matchIdx/result** - 경기 결과 입력
3. **PATCH /api/matches/:matchIdx/order** - 경기 순서 수정
4. **PATCH /api/matches/:matchIdx/score** - 경기 점수 수정

예시:

```javascript
// REST API로 경기 점수 수정
fetch('http://localhost:4002/api/matches/1/score', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    score_player1: 10,
    score_player2: 5,
    advantage_player1: 2,
    advantage_player2: 1
  })
})
.then(response => response.json())
.then(data => {
  console.log('경기 점수 수정 완료:', data);
  // WebSocket으로 자동 업데이트 전송됨
});
```

## 경기 상태 (MatchStatus)

경기 상태는 다음 중 하나입니다:

- `PENDING` - 대기중
- `IN_PROGRESS` - 진행중
- `COMPLETED` - 완료
- `BYE` - 부전승
- `ACTIVE` - 활성
- `PAUSE` - 일시정지
- `END` - 종료

## 경기 정보 필드 설명

| 필드 | 타입 | 설명 |
|------|------|------|
| idx | number | 경기 고유 ID |
| group_idx | number | 소속 그룹 ID |
| round | number | 라운드 번호 (1=결승, 2=준결승, 4=4강, ...) |
| match_number | number | 해당 라운드 내 경기 번호 |
| player1_idx | number \| null | 선수1 ID |
| player2_idx | number \| null | 선수2 ID |
| winner_idx | number \| null | 승자 ID |
| status | MatchStatus | 경기 상태 |
| next_match_idx | number \| null | 다음 경기 ID |
| score_player1 | number \| null | 선수1 점수 |
| score_player2 | number \| null | 선수2 점수 |
| order | number \| null | 경기 순서 (매트별 순서) |
| result | string \| null | 경기 결과 (텍스트, 최대 50자) |
| advantage_player1 | number \| null | 선수1 어드밴티지 |
| advantage_player2 | number \| null | 선수2 어드밴티지 |
| penalty_player1 | number \| null | 선수1 패널티 |
| penalty_player2 | number \| null | 선수2 패널티 |
| player1 | object \| null | 선수1 상세 정보 |
| player2 | object \| null | 선수2 상세 정보 |
| winner | object \| null | 승자 상세 정보 |
| group | object \| null | 그룹 정보 |

## 전체 예시 코드

```javascript
import { io } from 'socket.io-client';

class MatchWebSocketClient {
  constructor(serverUrl = 'http://localhost:4002') {
    this.socket = io(`${serverUrl}/matches`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 연결 성공
    this.socket.on('connect', () => {
      console.log('WebSocket 연결 성공:', this.socket.id);
    });

    // 연결 오류
    this.socket.on('connect_error', (error) => {
      console.error('연결 오류:', error);
    });

    // 연결 해제
    this.socket.on('disconnect', (reason) => {
      console.log('연결 해제:', reason);
    });

    // 경기 정보 수신
    this.socket.on('matches', (data) => {
      console.log('경기 정보:', data);
      this.onMatchesUpdate(data);
    });

    // 에러 수신
    this.socket.on('error', (error) => {
      console.error('오류:', error.message);
      this.onError(error);
    });
  }

  // 경기 정보 구독 (해당 매트의 모든 경기 리스트 구독)
  subscribe(competitionIdx, matIdx) {
    this.socket.emit('subscribe', {
      competitionIdx,
      matIdx,
    });
  }
  
  // 모든 경기 리스트 가져오기
  getMatches() {
    return this.matches || [];
  }
  
  // 경기 개수 가져오기
  getMatchCount() {
    return this.matches?.length || 0;
  }

  // 구독 해제
  unsubscribe() {
    this.socket.emit('unsubscribe');
  }

  // 연결 종료
  disconnect() {
    this.socket.disconnect();
  }

  // 경기 정보 업데이트 콜백 (오버라이드 가능)
  onMatchesUpdate(data) {
    // data.matches는 해당 매트의 모든 경기 리스트 배열
    // 프론트엔드에서 모든 경기 정보를 화면에 업데이트하는 로직
    console.log(`매트 ${data.matIdx}의 경기 개수:`, data.matches.length);
    console.log('전체 경기 리스트:', data.matches);
    
    // 모든 경기를 순서대로 정렬하여 표시
    const sortedMatches = [...data.matches].sort((a, b) => {
      if (a.order === null) return 1;
      if (b.order === null) return -1;
      return a.order - b.order;
    });
    
    // 정렬된 경기 리스트로 UI 업데이트
    this.updateMatchListUI(sortedMatches);
  }
  
  // 경기 리스트 UI 업데이트 (오버라이드 가능)
  updateMatchListUI(matches) {
    // 프론트엔드에서 경기 리스트를 화면에 표시하는 로직
    matches.forEach(match => {
      console.log(`경기 ${match.idx} (순서: ${match.order}): ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
    });
  }

  // 에러 콜백 (오버라이드 가능)
  onError(error) {
    // 에러 처리 로직
    console.error('에러 발생:', error);
  }
}

// 사용 예시
const client = new MatchWebSocketClient();

// 경기 정보 구독
client.subscribe(1, 1); // 대회 ID 1, 매트 ID 1

// 경기 정보 업데이트 처리
client.onMatchesUpdate = (data) => {
  // data.matches 배열을 사용하여 UI 업데이트
  updateMatchList(data.matches);
};

function updateMatchList(matches) {
  // 프론트엔드에서 모든 경기 목록을 화면에 표시하는 로직
  // matches는 해당 매트의 모든 경기 리스트 배열
  
  console.log(`총 ${matches.length}개의 경기`);
  
  // order 순서로 정렬 (낮은 순서부터)
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.order === null) return 1;
    if (b.order === null) return -1;
    return a.order - b.order;
  });
  
  // 모든 경기를 화면에 표시
  sortedMatches.forEach(match => {
    console.log(`[순서 ${match.order}] 경기 ${match.idx}: ${match.player1?.name || 'TBD'} vs ${match.player2?.name || 'TBD'}`);
    console.log(`상태: ${match.status}`);
    if (match.score_player1 !== null) {
      console.log(`점수: ${match.score_player1} - ${match.score_player2}`);
    }
    if (match.advantage_player1 !== null) {
      console.log(`어드밴티지: ${match.advantage_player1} - ${match.advantage_player2}`);
    }
    if (match.penalty_player1 !== null) {
      console.log(`패널티: ${match.penalty_player1} - ${match.penalty_player2}`);
    }
    if (match.winner) {
      console.log(`승자: ${match.winner.name}`);
    }
    console.log('---');
  });
}
```

## React 예시 - 모든 경기 리스트 표시

```jsx
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

function MatMatchList({ competitionIdx, matIdx }) {
  const [matches, setMatches] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // WebSocket 연결
    const newSocket = io('http://localhost:4002/matches', {
      transports: ['websocket'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('WebSocket 연결 성공');
      // 해당 매트의 모든 경기 정보 구독
      newSocket.emit('subscribe', {
        competitionIdx,
        matIdx,
      });
    });

    // 해당 매트의 모든 경기 정보 수신 (배열로 받음)
    newSocket.on('matches', (data) => {
      // data.matches는 해당 매트의 모든 경기 리스트 배열
      console.log(`매트 ${data.matIdx}의 경기 개수:`, data.matches.length);
      setMatches(data.matches); // 모든 경기 리스트 저장
    });

    newSocket.on('error', (error) => {
      console.error('오류:', error.message);
    });

    setSocket(newSocket);

    // 컴포넌트 언마운트 시 연결 해제
    return () => {
      if (newSocket.connected) {
        newSocket.emit('unsubscribe');
      }
      newSocket.disconnect();
    };
  }, [competitionIdx, matIdx]);

  // order 순서로 정렬 (낮은 순서부터)
  const sortedMatches = [...matches].sort((a, b) => {
    if (a.order === null) return 1;
    if (b.order === null) return -1;
    return a.order - b.order;
  });

  return (
    <div>
      <h2>매트 {matIdx} - 모든 경기 목록 (총 {matches.length}경기)</h2>
      
      {/* 경기 리스트 표시 */}
      <div className="match-list">
        {sortedMatches.map(match => (
          <div key={match.idx} className="match-item">
            <div className="match-header">
              <span className="match-order">순서: {match.order || '미정'}</span>
              <span className="match-status">상태: {match.status}</span>
            </div>
            
            <div className="match-players">
              <div className="player">
                <span className="player-name">{match.player1?.name || 'TBD'}</span>
                <span className="player-team">({match.player1?.team_name || ''})</span>
                {match.score_player1 !== null && (
                  <span className="player-score">점수: {match.score_player1}</span>
                )}
                {match.advantage_player1 !== null && (
                  <span className="player-advantage">어드밴티지: {match.advantage_player1}</span>
                )}
                {match.penalty_player1 !== null && (
                  <span className="player-penalty">패널티: {match.penalty_player1}</span>
                )}
              </div>
              
              <div className="vs">VS</div>
              
              <div className="player">
                <span className="player-name">{match.player2?.name || 'TBD'}</span>
                <span className="player-team">({match.player2?.team_name || ''})</span>
                {match.score_player2 !== null && (
                  <span className="player-score">점수: {match.score_player2}</span>
                )}
                {match.advantage_player2 !== null && (
                  <span className="player-advantage">어드밴티지: {match.advantage_player2}</span>
                )}
                {match.penalty_player2 !== null && (
                  <span className="player-penalty">패널티: {match.penalty_player2}</span>
                )}
              </div>
            </div>
            
            {match.winner && (
              <div className="winner">
                승자: {match.winner.name}
              </div>
            )}
            
            {match.result && (
              <div className="result">
                결과: {match.result}
              </div>
            )}
            
            <div className="match-info">
              <span>라운드: {match.round}강</span>
              <span>경기 번호: {match.match_number}</span>
              {match.group && <span>그룹: {match.group.name}</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* 경기가 없을 때 */}
      {matches.length === 0 && (
        <div>해당 매트에 경기가 없습니다.</div>
      )}
    </div>
  );
}

export default MatMatchList;
```

### 사용 예시

```jsx
// App.js
import MatMatchList from './MatMatchList';

function App() {
  return (
    <div>
      {/* 대회 1, 매트 1의 모든 경기 리스트 표시 */}
      <MatMatchList competitionIdx={1} matIdx={1} />
      
      {/* 대회 1, 매트 2의 모든 경기 리스트 표시 */}
      <MatMatchList competitionIdx={1} matIdx={2} />
    </div>
  );
}
```

## 경기 시간 표시 및 경기 종료 처리

경기 정보에는 그룹의 `match_time` (분 단위)이 포함되어 있습니다. 프론트엔드에서 경기 시간을 표시하고 0초가 되면 "경기종료"를 표시하는 방법입니다.

### 경기 시간 정보

경기 데이터의 `group.match_time` 필드에 경기 시간(분 단위)이 포함되어 있습니다:

```javascript
socket.on('matches', (data) => {
  data.matches.forEach(match => {
    const matchTimeMinutes = match.group?.match_time || 4; // 기본값 4분
    console.log(`경기 ${match.idx}의 경기 시간: ${matchTimeMinutes}분`);
  });
});
```

### 프론트엔드 타이머 구현 예시

```jsx
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

function MatchTimer({ match }) {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  // 경기 시간 (분 단위)
  const matchTimeMinutes = match.group?.match_time || 4;
  const totalSeconds = matchTimeMinutes * 60;

  // 경기 시작 (ACTIVE 상태로 변경 시)
  useEffect(() => {
    if (match.status === 'ACTIVE' && !isRunning) {
      setIsRunning(true);
      startTimeRef.current = Date.now();
      setRemainingSeconds(totalSeconds);
      
      // 타이머 시작
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setRemainingSeconds(remaining);
        
        // 시간이 0이 되면 타이머 정지
        if (remaining === 0) {
          setIsRunning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      }, 1000);
    }
    
    // 경기가 일시정지되면
    if (match.status === 'PAUSE' && isRunning) {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    // 경기가 종료되면
    if (match.status === 'END' || match.status === 'COMPLETED') {
      setIsRunning(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setRemainingSeconds(0);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [match.status, matchTimeMinutes, totalSeconds, isRunning]);

  // 시간을 MM:SS 형식으로 변환
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isTimeUp = remainingSeconds === 0 && (match.status === 'ACTIVE' || match.status === 'IN_PROGRESS');

  return (
    <div className="match-timer">
      <div className="timer-display">
        {isTimeUp ? (
          <div className="time-up" style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#ff0000',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            animation: 'blink 1s infinite',
          }}>
            경기종료!
          </div>
        ) : (
          <div className="time-remaining" style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: remainingSeconds <= 10 ? '#ff0000' : remainingSeconds <= 30 ? '#ff8800' : '#000000',
          }}>
            {formatTime(remainingSeconds)}
          </div>
        )}
      </div>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function MatchItem({ match }) {
  return (
    <div className="match-item">
      <div className="match-header">
        <h3>경기 {match.idx}</h3>
        <MatchTimer match={match} />
      </div>
      <div className="match-players">
        {match.player1?.name || 'TBD'} vs {match.player2?.name || 'TBD'}
      </div>
      <div className="match-status">
        상태: {match.status}
      </div>
    </div>
  );
}
```

### JavaScript 타이머 예시

```javascript
class MatchTimer {
  constructor(match, onTimeUp) {
    this.match = match;
    this.onTimeUp = onTimeUp;
    this.remainingSeconds = 0;
    this.intervalId = null;
    this.startTime = null;
    this.matchTimeMinutes = match.group?.match_time || 4;
    this.totalSeconds = this.matchTimeMinutes * 60;
  }

  start() {
    if (this.match.status !== 'ACTIVE' && this.match.status !== 'IN_PROGRESS') {
      return;
    }

    this.startTime = Date.now();
    this.remainingSeconds = this.totalSeconds;

    this.intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.remainingSeconds = Math.max(0, this.totalSeconds - elapsed);

      if (this.remainingSeconds === 0) {
        this.stop();
        if (this.onTimeUp) {
          this.onTimeUp();
        }
      }
    }, 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  pause() {
    this.stop();
  }

  getFormattedTime() {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  isTimeUp() {
    return this.remainingSeconds === 0;
  }
}

// 사용 예시
socket.on('matches', (data) => {
  data.matches.forEach(match => {
    if (match.status === 'ACTIVE' || match.status === 'IN_PROGRESS') {
      const timer = new MatchTimer(match, () => {
        // 시간이 0이 되면 경기종료 표시
        console.log('경기 시간 종료!');
        showTimeUpMessage(match);
      });
      timer.start();

      // 1초마다 시간 업데이트
      setInterval(() => {
        const timeDisplay = document.getElementById(`timer-${match.idx}`);
        if (timeDisplay) {
          if (timer.isTimeUp()) {
            timeDisplay.innerHTML = `
              <span style="
                font-size: 2rem;
                font-weight: bold;
                color: #ff0000;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                animation: blink 1s infinite;
              ">경기종료!</span>
            `;
          } else {
            timeDisplay.textContent = timer.getFormattedTime();
          }
        }
      }, 1000);
    }
  });
});

function showTimeUpMessage(match) {
  // 경기종료 메시지 표시
  const message = document.createElement('div');
  message.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    font-size: 3rem;
    font-weight: bold;
    padding: 2rem 4rem;
    border-radius: 10px;
    z-index: 10000;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    animation: blink 1s infinite;
  `;
  message.textContent = '경기종료!';
  document.body.appendChild(message);

  // 3초 후 제거
  setTimeout(() => {
    message.remove();
  }, 3000);
}
```

### CSS 스타일 예시

```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.time-up {
  font-size: 2rem;
  font-weight: bold;
  color: #ff0000;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  animation: blink 1s infinite;
  background: rgba(255, 0, 0, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 5px;
  border: 2px solid #ff0000;
}

.time-remaining {
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.time-remaining.warning {
  color: #ff8800;
}

.time-remaining.danger {
  color: #ff0000;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

## 주의사항

1. **인증 불필요**: 현재 WebSocket 서버는 인증 없이 접근 가능합니다.
2. **CORS 설정**: 모든 origin에서 접근 가능하도록 설정되어 있습니다.
3. **자동 재연결**: 연결이 끊어지면 자동으로 재연결을 시도합니다.
4. **실시간 업데이트**: 경기 정보가 수정되면 자동으로 모든 구독자에게 업데이트가 전송됩니다.
5. **경기 시간**: 각 경기의 그룹에 설정된 `match_time` (분 단위)을 사용하여 타이머를 구현하세요.

## 서버 설정

서버는 기본적으로 포트 4002에서 실행됩니다. 환경 변수 `PORT`로 변경할 수 있습니다.

WebSocket 서버는 `/matches` namespace에서 실행됩니다.

## 문제 해결

### 연결이 안 될 때

1. 서버가 실행 중인지 확인
2. 포트가 올바른지 확인
3. CORS 설정 확인
4. 네트워크 방화벽 확인

### 업데이트가 안 올 때

1. 구독이 올바르게 되었는지 확인 (`subscribe` 이벤트 전송)
2. 대회 ID와 매트 ID가 올바른지 확인
3. 서버 로그 확인

### 연결이 자주 끊어질 때

1. 네트워크 상태 확인
2. 서버 리소스 확인
3. 재연결 설정 확인

