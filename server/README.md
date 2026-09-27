# 업무 API 기반

현재는 **백엔드 기반 구성 단계**입니다. NestJS 서버는 `GET /api/health`만 제공합니다. 로그인, 업무 API, 영구 저장은 아직 연결하지 않았습니다. 프론트의 시연 역할 선택은 실제 인증이 아닙니다.

## 구성

- NestJS 12.1.0, TypeScript 5.9.3.
- Prisma 7.10.0 + PostgreSQL 드라이버. 사전 공개 Prisma 8 대신 7의 안정 버전을 고정했습니다.
- `prisma/schema.prisma`: OWNER/STAFF 계정, 해시된 세션 토큰, 휴가 신청과 결정 이력 모델.
- `src/database/prisma.service.ts`: 명시적인 DATABASE_URL이 필요한 연결 서비스. 현재 공개 상태 확인 모듈에 등록하지 않았습니다.
- `../shared/`: 승인된 휴가 일수 계산과 두 역할 권한 규칙. 권한 함수는 검증된 서버 세션의 사용자만 받아야 합니다.

Prisma 모델 검증/클라이언트 생성은 DB 접속 검증과 다릅니다. 아직 실제 PostgreSQL에 마이그레이션하거나 업무 데이터를 저장하지 않았습니다.

## 로컬 개발 명령

Node.js 22.12+ 또는 24 LTS를 사용합니다. 저장소 루트에서:

```sh
npm ci
npm run typecheck
npm run db:validate
npm run build:api
npm run test:api
npm run start:api
```

기본 바인딩은 `127.0.0.1:3001`입니다. 운영 공개 배포용 설정이 아닙니다. `server/.env.example`는 설정 예시이며 실제 비밀번호를 포함하지 않습니다.

## 다음 구현 단위

1. 개발용 PostgreSQL 연결과 초기 마이그레이션. 날짜 순서·양수 일수 및 반차 일수 제약 포함.
2. 비밀번호 해시·서버 세션 로그인, Secure/HttpOnly 쿠키, CSRF 방어, 로그인 속도 제한, 비활성 계정 차단.
3. 모든 업무 API에 기본 인증 적용. 경영·휴가 결정은 OWNER 전용. 본인 신청과 공용 달력의 응답 필드를 분리.
4. 휴가 상태 변경과 결정 이력을 하나의 트랜잭션에서 저장. 버전 검증으로 동시 승인·취소 충돌 방지.
5. 프론트 API 연결. 접속 실패를 가상 저장 성공으로 대체하지 않음.
6. 직원 입고·확보 API와 재고 트랜잭션 개발.

휴가의 주말·공휴일 포함과 반차 0.5일은 확정 기준입니다. 잔여 연차 부여/차감 정책은 별도 확정 전까지 도입하지 않습니다.

## 공식 참고

- [NestJS 시작하기](https://docs.nestjs.com/first-steps)
- [Prisma 7 + NestJS](https://www.prisma.io/docs/guides/v7/frameworks/nestjs)

이 서버는 GitHub Pages 배포 대상이 아닙니다. 기존 Sites `worker/index.js`도 업무 API 서버로 대체하지 않습니다.
