# Nest.js 백엔드 시스템

MySQL과 TypeORM을 사용한 Nest.js 백엔드 시스템입니다.

## 주요 기능

- **사용자 관리**: 사용자 등록, 조회, 수정, 삭제
- **JWT 인증**: Access Token (1시간), Refresh Token (7일)
- **쿠키 기반 토큰 관리**: HttpOnly 쿠키로 보안 강화
- **데이터베이스**: MySQL + TypeORM
- **유효성 검사**: class-validator를 통한 입력 데이터 검증

## 프로젝트 구조

```
src/
├── auth/                 # 인증 관련 모듈
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── user/                 # 사용자 관련 모듈
│   ├── entities/
│   │   └── user.entity.ts
│   ├── dto/
│   │   └── create-user.dto.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   └── user.module.ts
├── common/               # 공통 모듈
│   ├── entities/
│   │   └── base.entity.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── decorators/
├── config/               # 설정 파일
│   ├── database.config.ts
│   └── jwt.config.ts
├── app.module.ts         # 메인 모듈
└── main.ts              # 애플리케이션 진입점
```

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_password
DB_DATABASE=myplace_db

# JWT 설정
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# 애플리케이션 설정
PORT=4002
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. 데이터베이스 설정
MySQL 데이터베이스를 생성하고 연결 정보를 `.env` 파일에 설정하세요.

### 4. 애플리케이션 실행
```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run build
npm run start:prod
```

## API 엔드포인트

모든 API는 `/api` 기본 경로를 사용합니다.

### 인증 관련
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃
- `POST /api/auth/me` - 현재 사용자 정보 조회

### 사용자 관련
- `POST /api/users` - 사용자 등록
- `GET /api/users` - 모든 사용자 조회 (인증 필요)
- `GET /api/users/:idx` - 특정 사용자 조회 (인증 필요)
- `PUT /api/users/:idx` - 사용자 정보 수정 (인증 필요)
- `DELETE /api/users/:idx` - 사용자 삭제 (인증 필요)

## 데이터베이스 스키마

### users 테이블
- `idx`: 고유번호 (Primary Key, Auto Increment)
- `email`: 이메일 (선택사항, Unique)
- `name`: 사용자 이름 (필수)
- `password`: 비밀번호 (필수, 해시화)
- `affiliation`: 소속 (필수)
- `phone`: 휴대폰 번호 (선택사항)
- `created_at`: 생성일시
- `updated_at`: 수정일시

## 보안 기능

- **비밀번호 해시화**: bcryptjs를 사용한 안전한 비밀번호 저장
- **JWT 토큰**: Access Token과 Refresh Token 분리
- **HttpOnly 쿠키**: XSS 공격 방지
- **CORS 설정**: 프론트엔드 도메인 제한
- **입력 검증**: class-validator를 통한 데이터 검증

## 개발 가이드

### 새로운 엔티티 추가
1. `src/common/entities/base.entity.ts`를 상속받아 엔티티 생성
2. `src/config/database.config.ts`에 엔티티 추가
3. 필요한 경우 서비스와 컨트롤러 생성

### 새로운 API 추가
1. DTO 클래스 생성 (입력 검증용)
2. 서비스에 비즈니스 로직 구현
3. 컨트롤러에 API 엔드포인트 추가
4. 필요시 인증 가드 적용

## 라이선스

ISC
