@echo off
echo Nest.js 백엔드 시스템 시작 중...
echo.

REM 환경 변수 파일 확인
if not exist .env (
    echo .env 파일이 없습니다. env.example을 복사하여 .env 파일을 생성하세요.
    copy env.example .env
    echo .env 파일이 생성되었습니다. 데이터베이스 설정을 확인하세요.
    pause
    exit /b 1
)

REM 개발 모드로 실행
echo 개발 모드로 애플리케이션을 시작합니다...
echo API 서버: http://localhost:4002/api
npm run start:dev

pause
