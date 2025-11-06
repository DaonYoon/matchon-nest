# 대진표 생성 API 가이드

## 요청 형식

현재 요청 형식은 **올바릅니다**. 다음과 같이 요청하면 됩니다:

```javascript
POST /api/matches/bracket
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN

{
  "group_idx": 6,
  "players": [
    { "player_idx": 8, "seed": 1 },
    { "player_idx": 9, "seed": 2 },
    { "player_idx": 10, "seed": 3 },
    { "player_idx": 11, "seed": 4 },
    { "player_idx": 12, "seed": 5 },
    { "player_idx": 13, "seed": 6 },
    { "player_idx": 14, "seed": 7 },
    { "player_idx": 15, "seed": 8 }
  ]
}
```

## 필수 요구사항

### 1. 선수는 해당 그룹에 속해야 함
- `player_idx`에 해당하는 선수가 존재해야 합니다
- 선수는 `group_idx`에 해당하는 그룹에 속해야 합니다
- 다른 그룹에 속한 선수는 사용할 수 없습니다

### 2. 시드 번호는 1부터 시작
- 시드 번호는 1부터 시작해야 합니다
- 시드 번호는 중복될 수 없습니다
- 시드 번호는 선수 수 이하여야 합니다 (8명이면 최대 시드 8)

### 3. 최소 2명의 선수 필요
- 최소 2명의 선수가 필요합니다
- 2의 거듭제곱이 아니어도 됩니다 (예: 8명, 16명, 32명 등)

### 4. 기존 대진표가 없어야 함
- 해당 그룹에 이미 대진표가 생성되어 있으면 에러가 발생합니다
- 기존 대진표를 삭제한 후 다시 생성해야 합니다

## 에러 메시지 종류

### 1. 그룹이 존재하지 않음
```json
{
  "success": false,
  "message": "그룹 정보를 찾을 수 없습니다.",
  "status": 404
}
```

### 2. 이미 대진표가 생성됨
```json
{
  "success": false,
  "message": "이미 대진표가 생성되어 있습니다. 기존 대진표를 삭제한 후 다시 생성해주세요.",
  "status": 400
}
```

### 3. 선수가 존재하지 않거나 그룹에 속하지 않음
```json
{
  "success": false,
  "message": "존재하지 않거나 해당 그룹에 속하지 않는 선수 idx가 포함되어 있습니다: 8, 9",
  "status": 400
}
```

### 4. 중복된 시드 번호
```json
{
  "success": false,
  "message": "중복된 시드 번호가 있습니다: 1, 2",
  "status": 400
}
```

### 5. 시드 배정 실패
```json
{
  "success": false,
  "message": "시드 3의 선수 배정에 실패했습니다. 계산된 경기 인덱스가 범위를 벗어났습니다.",
  "status": 400
}
```

## 프론트엔드 구현 예시

### React 예시

```jsx
import { useState } from 'react';

function CreateBracket({ groupIdx, players }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateBracket = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:4003/api/matches/bracket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          group_idx: groupIdx,
          players: players.map((player, index) => ({
            player_idx: player.idx,
            seed: index + 1 // 1부터 시작하는 시드 번호
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '대진표 생성에 실패했습니다.');
      }

      console.log('대진표 생성 성공:', data);
      // 성공 처리
    } catch (err) {
      console.error('대진표 생성 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCreateBracket} disabled={loading}>
        {loading ? '대진표 생성 중...' : '대진표 생성'}
      </button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}
```

### JavaScript 예시

```javascript
async function createBracket(groupIdx, players) {
  try {
    const response = await fetch('http://localhost:4003/api/matches/bracket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        group_idx: groupIdx,
        players: players.map((player, index) => ({
          player_idx: player.idx,
          seed: index + 1 // 1부터 시작하는 시드 번호
        }))
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '대진표 생성에 실패했습니다.');
    }

    console.log('대진표 생성 성공:', data);
    return data.data;
  } catch (error) {
    console.error('대진표 생성 실패:', error);
    throw error;
  }
}

// 사용 예시
const groupIdx = 6;
const players = [
  { idx: 8 },
  { idx: 9 },
  { idx: 10 },
  { idx: 11 },
  { idx: 12 },
  { idx: 13 },
  { idx: 14 },
  { idx: 15 }
];

createBracket(groupIdx, players)
  .then(matches => {
    console.log('생성된 경기:', matches);
  })
  .catch(error => {
    console.error('에러:', error.message);
  });
```

## 문제 해결

### 1. 선수가 그룹에 속하지 않는 경우
선수를 먼저 해당 그룹에 추가해야 합니다:
```javascript
// 선수를 그룹에 추가
POST /api/players
{
  "group_idx": 6,
  "name": "선수 이름",
  "team_name": "팀 이름",
  ...
}
```

### 2. 기존 대진표가 있는 경우
기존 대진표를 삭제해야 합니다:
```javascript
// 그룹의 모든 경기 조회
GET /api/matches/group/:competitionIdx/:groupIdx

// 각 경기 삭제
DELETE /api/matches/:matchIdx
```

### 3. 시드 번호 확인
시드 번호가 1부터 시작하고, 중복되지 않았는지 확인하세요:
```javascript
// 올바른 예시
players: [
  { player_idx: 8, seed: 1 },
  { player_idx: 9, seed: 2 },
  ...
]

// 잘못된 예시 (시드 0부터 시작)
players: [
  { player_idx: 8, seed: 0 },
  ...
]

// 잘못된 예시 (시드 중복)
players: [
  { player_idx: 8, seed: 1 },
  { player_idx: 9, seed: 1 },
  ...
]
```

## 성공 응답 예시

```json
{
  "success": true,
  "message": "대진표가 생성되었습니다.",
  "data": [
    {
      "idx": 1,
      "group_idx": 6,
      "round": 4,
      "match_number": 1,
      "player1_idx": 8,
      "player2_idx": 15,
      "status": "PENDING",
      "order": 1,
      ...
    },
    ...
  ]
}
```

## 디버깅 팁

1. **서버 로그 확인**: 서버 콘솔에서 에러 로그를 확인하세요. 예상치 못한 에러는 상세한 메시지와 함께 로그에 기록됩니다.

2. **에러 응답 확인**: 응답의 `message` 필드에 구체적인 에러 원인이 표시됩니다.

3. **선수 확인**: 선수들이 실제로 존재하고 해당 그룹에 속하는지 확인하세요:
   ```javascript
   GET /api/players/competition/:competitionIdx?group_idx=6
   ```

4. **그룹 확인**: 그룹이 존재하는지 확인하세요:
   ```javascript
   GET /api/groups/:groupIdx
   ```

