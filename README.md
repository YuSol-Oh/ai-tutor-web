# AI 1:1 과외 에이전트

바쁜 직장인을 위한 AI 기반 1:1 개인 과외 서비스

## 기술 스택
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Anthropic Claude API
- Supabase (DB + Auth) - 예정
- Vercel (배포) - 예정

## 로컬 실행
1. 의존성 설치: npm install
2. 환경변수 설정: .env.local에 ANTHROPIC_API_KEY 입력
3. 개발 서버 실행: npm run dev
4. http://localhost:3000 접속

## 주요 기능
- AI 기반 초기 설문 및 수준 진단
- 맞춤형 커리큘럼 자동 생성
- 커리큘럼 피드백 및 수정
- 오늘의 학습지 (개념 + 문제 + 힌트 + 해설)
- 실습 과제 제공
