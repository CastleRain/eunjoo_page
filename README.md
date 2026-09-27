# eunjoo_page · 온담 업무실

한의원 CRM·내부 ERP 검토용 인터랙티브 시안입니다. 기존 v2를 저장소 루트의 단일 앱으로 정리했습니다. 이후 버전은 폴더 복제 대신 Git 커밋과 브랜치로 관리합니다.

- 공개 페이지: https://castlerain.github.io/eunjoo_page/
- 소스 저장소: https://github.com/CastleRain/eunjoo_page
- 직원·휴가: https://castlerain.github.io/eunjoo_page/#leave

## 현재 구현

React 19 + Vite + Ant Design 6 + Day.js를 사용합니다. Noto Sans KR Variable, Lucide 아이콘, Motion을 포함합니다. 공용 UI는 `src/ui.jsx`, 테마는 `src/Theme.tsx`, 공통 색상은 `src/design-config.ts`에서 관리합니다. 확정된 A 레이아웃에 흰색·연한 갈색을 적용했습니다.

기본 화면은 가상 데이터 시안입니다. `?mode=live`에는 Supabase 직원 로그인과 DB에 저장되는 휴가 신청·승인·공유 달력을 구현했습니다. 실제 계정을 등록한 뒤 통합 검증 및 배포를 진행합니다. 다른 CRM 기능·재고·결제·메시지 발송은 아직 DB에 연결하지 않았습니다. 시안 데이터는 새로고침 시 초기화됩니다.

개발 브랜치에서 TypeScript를 점진 도입했습니다. 진입점·테마·색상·공통 업무 규칙을 전환했으며 대부분의 업무 화면은 아직 JSX입니다. `server/`에 NestJS 상태 확인 서버와 Prisma 계정·휴가 모델을 구성했습니다. 상태 확인 응답은 서버 프로세스의 기동 여부만 나타내며 DB나 실제 업무 기능의 준비 완료를 뜻하지 않습니다.

## 구조

```text
src/                  화면, 공용 UI, 테마, 시연 데이터
shared/               프론트·서버 공용 TypeScript 업무 규칙
server/               NestJS 기반, Prisma 모델 (업무 API/DB 연결 전)
public/               배포할 정적 자료
.github/workflows/    main 푸시 시 GitHub Pages 자동 배포
tests/                휴가 일수 및 정적 배포 테스트
scripts/, worker/     기존 Sites 호환 패키징 (업무 API 서버 아님)
```

기존 폴더·압축파일은 로컬 `.local-backup/original-layout-2026-09-27.tar.gz`에 보관합니다. 백업, node_modules, 빌드 결과, 환경변수 파일은 Git에 올리지 않습니다. 이 백업은 새로 clone한 저장소에는 포함되지 않습니다.

## 개발 및 검증

Node.js 22.12 이상 또는 24 LTS를 사용합니다.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
npm run build
npm run typecheck
npm test
```

GitHub Pages와 같은 경로로 빌드 결과를 확인하려면:

```sh
DEPLOY_BASE_PATH=/eunjoo_page/ npm run build
npm run preview -- --host 127.0.0.1 --port 4173
```

미리보기 주소: http://127.0.0.1:4173/eunjoo_page/

## 배포

`main`에 푸시하면 GitHub Actions가 의존성 설치 → 빌드 → 테스트 → `dist/client` 배포를 수행합니다. 저장소 Settings → Pages의 Source는 GitHub Actions입니다. 해시 기반 화면 경로를 유지하여 하위 화면 새로고침도 지원합니다.

[Vite 공식 GitHub Pages 가이드](https://vite.dev/guide/static-deploy.html#github-pages)에 따라 배포 시 base 경로를 `/eunjoo_page/`로 지정합니다.

## 실서비스 전환

공동 테스트는 GitHub Pages + Supabase Auth/PostgreSQL 조합을 사용합니다. NestJS·Prisma 기반은 향후 별도 서버 업무용으로 보존하며 현재 휴가 기능에서 사용하지 않습니다. 연결 설정, 계정 등록, 권한 모델과 검증 범위는 [Supabase 설정 안내](docs/supabase-setup.md)를 확인하세요.

- [확정된 업무 기준](docs/implementation-decisions.md)
- [백엔드 기반 구성과 구현 범위](server/README.md)

- [실개발 구성안](architecture.md)
- [상세 구성·범위](design-notes.md)
- [발표 대본](demo-guide.md)
- [기존 디자인 검수](design-qa.md)

## 자동 시연

상단 **자동 시연 → 전체 시연 → 선택한 순서 자동 시작**. 입력과 화면 전환이 자동 진행됩니다. 아래의 일시정지·계속 재생·다음 버튼으로 설명 시간을 조절하고, **종료·원래대로**로 시연 전 데이터와 화면 설정을 복원합니다. 휴가 등 개별 업무만 재생할 수도 있습니다. 전체 기본 재생은 약 11–14분입니다.

## 추천 체험 순서

1. 상단 **글자·화면**에서 16px 컴팩트 및 18/20/22px 비교.
2. **초안 이어쓰기**에서 약재와 재고 비교.
3. **직원·휴가 → 직원 신청 체험**에서 휴가 신청.
4. 왼쪽 아래 **시연 역할 → 원장**으로 전환.
5. **승인 대기함 → 신청 상세 → 휴가 승인**.
6. **직원 달력**에서 승인된 휴가 확인.
7. **문진관리 → 환자 화면 체험**에서 제출하고 원장 요약 확인.

데이터는 모두 예시이며 새로고침하면 초기화됩니다. 실제 개인정보를 입력하지 마세요. 화면 설정만 기기에 저장됩니다. 로컬 주소는 이 컴퓨터에서 확인하는 주소이며 팀용 온라인 주소가 아닙니다.
