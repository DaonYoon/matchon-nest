FROM node:18

WORKDIR /app

# 의존성 먼저 설치
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps


# 전체 소스 복사 (src 포함!)
COPY . .

# 이제 빌드 가능
RUN npm run build

EXPOSE 4003

# 환경 변수 설정 (기본값)
ENV NODE_ENV=production
ENV PORT=4003

CMD ["npm", "run", "start:prod"]