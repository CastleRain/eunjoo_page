# 실개발 기술 구성안

2026-09-27 업데이트. 사용자가 요청한 고객관리 + 한의원 운영 ERP + 직원 휴가 승인 서비스 기준.

최신 확정 기준은 [업무 결정 기록](docs/implementation-decisions.md), 현재 구현 범위는 [백엔드 구성](server/README.md)을 함께 참고합니다.

## 권장 조합

| 영역 | 선택 | 이유 |
|---|---|---|
| 프런트엔드 | React + TypeScript + Vite | 내부 업무 앱에 적합하고 React UI·표·달력 생태계를 활용하기 좋음. 검색 노출이 목적이 아니므로 SSR 서버를 별도로 두지 않음 |
| 공용 UI | Ant Design 6 + ConfigProvider | Button, Input, Select, DatePicker, Calendar, Table, Form, Drawer, Modal, Tag, Alert, Segmented, Switch를 일관된 토큰으로 관리 |
| 화면 경로 | React Router | 업무 메뉴·상세 경로, 뒤로 가기, 화면 접근 제한 |
| API 상태 | TanStack Query | 데이터 조회, 변경 후 재조회, 로딩·실패·재시도 상태 |
| 날짜 | Day.js | 한국어 날짜 선택 및 날짜 처리. 휴가 일수는 시작/종료일을 포함한 달력 날짜로 계산하며 주말·공휴일 포함, 반차 0.5일 |
| 서버 | NestJS + TypeScript | 인증·권한, 업무별 모듈, 입력 검증, 테스트와 API 문서화 |
| DB | PostgreSQL | 재고·승인·결제 기록 같은 관계형 데이터와 트랜잭션 |
| DB 접근 | Prisma | 모델·마이그레이션·타입 기반 데이터 접근. 원자적 업무 변경은 DB 트랜잭션 안에서 처리 |
| 백그라운드 작업 | 필요 시 BullMQ + Redis | 예약 알림·카카오톡 작업이 실제 연결되는 단계에서 도입. 시안 단계에서는 불필요 |

현재 단일 앱에는 **React/Vite + Ant Design 6.6.5 + Day.js + Noto Sans KR + Lucide + Motion**이 적용되어 있다. 진입점·테마·색상·공통 규칙은 TypeScript로 점진 전환했다. NestJS 상태 확인 서버와 Prisma PostgreSQL 모델/연결 서비스의 기반을 추가했으나, 로그인·업무 API·DB 저장은 아직 연결하지 않았다. React Router와 TanStack Query는 후속 선택안이다.

## UI를 쓰는 방식

공용 컴포넌트는 `src/ui.jsx`, 테마는 `src/Theme.tsx`에서 관리한다. 화면마다 버튼·모달·입력창을 새로 만들지 않고 라이브러리 위에 업무용 래퍼를 얇게 둔다. 전체 배치와 업무 행은 커스텀 레이아웃을 사용한다.

- Button: 기본·주요·텍스트 동작, 아이콘, 비활성 상태.
- Input/TextArea/Select/DatePicker: 공용 Field에서 한국어 라벨과 기존 업무 상태를 연결.
- Table: 업무 목록의 헤더·행·스크롤을 관리.
- Calendar: 탕전·직원 휴가 월간 달력의 기본 구조.
- Drawer/Modal: 목록 위치를 유지하며 상세 조회·입력.
- Segmented/Tag/Alert/Switch/Checkbox/Radio: 상태·필터·안내·설정·문진.
- 실개발에서는 Ant Design Form의 검증·제출 흐름으로 통일하고 API 실패 상태를 연결한다.

색상은 흰색 #FFFFFF, 바탕 #FCFBFA, 옅은 갈색 #F4EEE9, 포인트 #887260. 최초 16px 컴팩트, 18/20/22px 선택. 라이브러리 토큰과 화면 밀도도 함께 바뀐다.

## 원장 경영 권한

원장 이름: **한승재**. 실제 권한은 OWNER/STAFF 두 종류다. 직원도 약재 등록·입고·확보를 처리한다. 이름 비교로 권한을 판단하지 않고, 서버의 계정 ID와 OWNER 역할로 판단한다.

1. 직원에게 경영·급여 메뉴를 표시하지 않는다.
2. 통합 검색 결과에서 경영 메뉴·민감한 경영 데이터를 제외한다.
3. 프런트 라우트에서 직원의 직접 접근을 제한한다.
4. **NestJS 인증 Guard + 역할 Guard**를 모든 경영·급여 API에 적용한다.
5. 목록뿐 아니라 상세·통계·검색·다운로드·내보내기 요청에도 같은 권한을 적용한다.
6. 직원 로그인 응답이나 공통 대시보드 API에 원장 전용 수치를 포함하지 않는다.
7. 직원 ID, 역할, 휴가 신청자·승인자 ID는 신뢰할 수 있는 서버 로그인 정보에서 가져온다. 클라이언트가 보내는 역할은 신뢰하지 않는다.

시안은 1–3의 화면 동작을 확인할 수 있다. 데이터가 모두 가상이며 실제 보안 경계는 아니다. 서버 권한과 실제 계정은 아직 구현되지 않았다.

## 모듈과 데이터

- 계정/권한: User, Role, Staff, Session, AuditLog.
- 환자/CRM: Patient, Visit, Appointment, QuestionnaireSession, QuestionnaireAnswer, CallTask, CallResult.
- 조제/재고: Herb, Product, StockLot, StockMovement, Prescription, PrescriptionItem, MaterialReservation, DispensingCompletion, DecoctionSchedule.
- 판매/전달: Order, PaymentRecord, DeliveryRecord. 실제 결제 실행과 기록은 구분.
- 인사/휴가: LeaveRequest, LeaveDecision, LeavePolicy, WorkSchedule, LeaveBalanceAdjustment.
- 경영: RevenueRecord, Expense, RecurringExpense, StaffCompensationRecord. 원장 전용 응답 분리.
- 외부 연락: MessageRule, MessageJob, ProviderAttempt, Consent, OutboxEvent.

한의원 규모의 단일 서버를 업무 모듈로 나누는 구성을 먼저 사용한다. 처음부터 마이크로서비스로 분리하지 않는다.

## 핵심 서버 처리

### 휴가

`승인 대기 → 승인 완료 / 반려 / 신청 철회`

`승인 완료 → 취소 요청 → 취소 완료 / 승인 유지`

- 직원은 본인 신청만 조회·수정·철회한다. 원장은 승인 대상과 이력을 조회한다.
- 승인 시 현재 상태와 버전을 확인하고 승인자·시각·의견을 같은 트랜잭션에 기록한다.
- 직원 달력은 승인된 신청에서 조회한다. 신청과 별도의 달력 항목을 중복 생성하지 않는다.
- 취소 요청 중에는 승인된 휴가를 유지한다. 취소 승인 뒤 달력에서 제외한다.
- 공용 달력 DTO에서 사유·개인 메모를 제거한다.
- 신청 일수는 시작/종료일을 포함해 자동 계산하고 반차는 0.5일로 고정한다. 주말·공휴일도 포함한다. 사용자가 현재 계산을 실제 업무 기준으로 유지하도록 확정했다.
- 연차 부여·잔여량·급여 정산 정책은 별도 확정 전까지 추가하지 않는다.

### 조제와 재고

- 완료 시 최신 재고와 예약 확보량을 검증하고 모든 약재의 차감을 하나의 트랜잭션에 기록한다.
- 완료 요청 ID의 유일성을 보장해 연속 클릭·재시도로 이중 차감되지 않도록 한다.
- g 단위는 DB Decimal 등 정확한 수치 형식으로 보관한다.
- 취소만으로 재고를 자동 복구하지 않고 반납·폐기·정정을 별도 이력으로 기록한다.

### 알림과 외부 발송

- 업무 변경과 알림 작업 생성은 Outbox 패턴으로 연결한다.
- 실제 발송 직전에 예약·재방문·복약 중단·최근 연락·동의를 재검증한다.
- 결과가 불확실하면 재발송하기 전에 발송사 결과를 조회한다.

## 개발 순서

1. 디자인·업무 규칙 확정, 공용 UI 및 TypeScript 타입 정리.
2. 계정·원장/직원 권한·PostgreSQL·감사 이력.
3. 휴가 신청/승인/달력 + 환자 기본 기록.
4. 재고·조제·부분 전달·탕전 일정.
5. 문진·해피콜·파일 가져오기.
6. 원장 경영과 외부 연동·예약 알림.
7. 여러 기기 동시 사용·권한·중복 처리·백업 검증 후 운영 배포.

PWA는 운영 웹앱이 안정화된 뒤 홈 화면 설치 중심으로 추가한다. 재고 차감과 휴가 승인 같은 변경을 임의로 오프라인 처리하지 않는다.

## 공식 자료

- [Ant Design 시작하기](https://ant.design/docs/react/getting-started/)
- [Ant Design 테마](https://ant.design/docs/react/customize-theme/)
- [NestJS 권한](https://docs.nestjs.com/security/authorization)
- [Prisma + NestJS](https://docs.prisma.io/docs/guides/frameworks/nestjs)
- [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
