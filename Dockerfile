# Node.js 20 LTS를 기본 이미지로 사용
FROM node:20-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# 프로덕션 이미지
FROM node:20-alpine AS production

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --omit=dev && npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 포트 노출
EXPOSE 4003

# 환경 변수 설정 (기본값)
ENV NODE_ENV=production
ENV PORT=4003
d
# 애플리케이션 실행
CMD ["node", "dist/main.js"]

