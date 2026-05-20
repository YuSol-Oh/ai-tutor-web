---
name: worksheet-generator
description: 토픽과 유저 프로필을 받아 개념+문제+힌트+해설로 구성된 학습지를 생성하는 워크플로우.
---

## 학습지 생성 워크플로우

### Step 1 - 토픽 분석
- 토픽 제목, 설명, 유저 수준, 학습 스타일 파악

### Step 2 - 개념 파트 작성
- 핵심 개념 3~5줄로 압축
- 실생활/업무 연결 예시 1개

### Step 3 - 문제 설계 (1~3개)
- beginner: 객관식 위주
- intermediate: 객관식 + 단답형 혼합
- advanced: 단답형 + 서술형 위주
- 각 문제마다 힌트 3개 준비 (점점 구체적으로)
- 정답 해설 준비

### Step 4 - 실습 과제 (includeHandsOn이 true일 때)
- 직접 해볼 수 있는 간단한 과제
- 예상 결과물 설명

### Step 5 - JSON 저장
- 경로: src/data/worksheets/{userId}-{date}.json
