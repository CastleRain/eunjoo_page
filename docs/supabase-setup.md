# Supabase 공동 테스트

## 구현 범위

`?mode=live`에서 Supabase Auth 이메일/비밀번호 로그인과 실제 저장되는 직원·휴가 화면을 제공합니다. 기존 기본 주소 및 `?mode=demo#today`는 가상 데이터 시안이며 자동 시연도 이쪽에서만 동작합니다. 다른 CRM·재고 메뉴의 DB 연결은 아직 없습니다. `server/`의 NestJS/Prisma는 향후 용도로 남겨두었으며 Supabase 기능에서 사용하지 않습니다.

프로젝트: `ondam-workspace` (`jjxgyuhwlflhnhxragsn`, Seoul). 2026-09-27 SQL Editor로 `supabase/migrations/202609270001_leave.sql`을 적용했습니다. 원격의 3개 업무 테이블에 RLS가 켜졌으며 `authenticated`의 직접 SELECT 권한은 없는 것을 확인했습니다. 실제 앱 계정 생성 및 두 계정의 브라우저 통합 검증/공개 배포는 별도 완료 확인이 필요합니다.

## 연결 및 배포

- `.env.example`을 기준으로 로컬 `.env.local`에 URL과 **Publishable key**만 설정합니다. secret/service_role 키는 사용하지 않습니다.
- 이 저장소의 GitHub Repository Variables는 등록 완료했습니다. 다른 환경에서는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 설정합니다. 두 값은 브라우저에 공개되는 설정입니다.
- Pages 빌드에 이 변수를 주입합니다. 로그인 주소는 `https://castlerain.github.io/eunjoo_page/?mode=live`입니다. 이 URL은 해당 브랜치를 main에 배포한 뒤 사용합니다.
- 기존 DB에는 초기 migration을 재실행하지 않습니다. 후속 변경은 새 migration 파일로 관리합니다.
- Docker가 실행 중인 환경에서 `npm run test:supabase`는 외부 포트를 열지 않는 임시 PostgreSQL 17 컨테이너를 생성하고 테스트 후 삭제합니다. `bootstrap.sql`은 로컬의 Auth 모형 전용이며 실제 Supabase에 적용하지 않습니다.

## 첫 계정 등록

1. Supabase Authentication → Users → Add user → Create new user에서 사용자가 이메일과 비밀번호를 직접 입력합니다. 테스트용으로 이메일 확인을 자동 처리하는 옵션을 선택할 수 있습니다. 이메일 초대 발송은 별도 사용자 요청 없이 하지 않습니다.
2. 생성한 사용자의 UID를 확인합니다. Supabase 대시보드 로그인과 업무실 로그인은 서로 다른 계정입니다.
3. SQL Editor에서 아래 SQL의 UID·이름·역할을 실제 승인된 값으로 바꾸어 한 번 실행합니다. 원장은 `한승재`, `OWNER`; 직원은 본인 이름, `STAFF`입니다. UUID를 임의 생성하거나 가입 메타데이터로 OWNER를 부여하지 않습니다.

```sql
insert into ondam.profiles (id, display_name, role)
values ('AUTH_USERS에서_복사한_UUID'::uuid, '한승재', 'OWNER');
```

4. 사용자 본인이 웹 로그인 화면에 비밀번호를 입력하여 로그인합니다. Auth 사용자만 만들고 profile을 등록하지 않으면 업무 데이터에 접근할 수 없습니다.
5. 직원 계정도 생성하고 `STAFF` profile을 등록합니다. 두 브라우저/세션에서 신청 → 대표 승인 → 직원 새로고침 → 달력 반영을 확인합니다. 같은 브라우저의 일반 탭끼리는 로그인 상태가 공유됩니다. 역할별 테스트는 각각 로그아웃/로그인하거나 별도 프로필/브라우저를 이용합니다.

## 권한과 데이터 처리

- `ondam` 스키마는 Data API에 노출하지 않으며 직접 테이블 접근을 허용하지 않습니다. RLS는 기본 거부입니다.
- 공개 스키마의 RPC 3개만 authenticated 실행 권한을 갖습니다. SECURITY DEFINER는 빈 search_path 및 완전한 스키마 이름을 사용합니다. 각 호출은 `auth.uid()`와 서버의 활성 profile을 확인합니다.
- 직원은 본인 신청·사유·인계·처리 이력만 볼 수 있습니다. 대표는 모든 신청을 확인하고 승인/반려합니다.
- 직원 달력 응답은 승인 및 취소 승인 대기 일정의 이름·기간·종류만 포함합니다. 사유/인계/처리 이력은 포함하지 않습니다.
- 일수는 DB에서 시작·종료일 포함으로 계산합니다. 주말/공휴일을 포함하며 반차는 같은 날 0.5일입니다. 동일 직원의 겹치는 활성 휴가는 거부합니다. 오전/오후 반차를 별개로 겹쳐 신청하는 기능은 현재 제공하지 않습니다.
- 신청은 신청자 행 잠금, 승인은 신청 행 잠금과 version 비교를 사용합니다. 재전송 키는 중복 저장을 방지합니다. 이력과 상태 변경은 하나의 트랜잭션입니다.
- 비활성화는 `ondam.profiles.active=false`로 처리합니다. 다음 RPC부터 차단됩니다. 프론트는 20초 및 창 포커스 시 갱신하며, 오류 시 기존 업무 데이터를 화면에서 제거합니다.
- 신청 목록은 최근 200건입니다. 달력 조회는 날짜 범위 기준으로 별도로 조회합니다. 장기 실사용 전 검색/페이지네이션과 전체 대기 건수 조회를 확장해야 합니다.

## 검증 현황

- TypeScript, 기존 테스트 10개, 프로덕션 빌드 통과.
- PostgreSQL 실행 테스트: 비로그인/비활성/미등록 계정 차단, 직원의 직접 테이블 접근 및 자기 권한 변경 차단, 타인 신청 조회·수정 차단, 대표 전용 승인, 일수/반차, 중복 요청, 겹침, 오래된 승인 요청, 취소/반려/달력 및 개인정보 제외 검증.
- 실제 Auth 로그인/공유 세션 테스트는 사용자 생성 후 진행합니다. 로컬 SQL 검증은 Supabase Auth 서버 전체의 통합 테스트를 대체하지 않습니다.
