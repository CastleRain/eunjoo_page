# eunjoo_page · 온담 업무실

한의원 CRM·내부 ERP 검토용 인터랙티브 시안입니다. 기존 v2를 저장소 루트의 단일 앱으로 정리했습니다. 이후 버전은 폴더 복제 대신 Git 커밋과 브랜치로 관리합니다.

- 공개 페이지: https://castlerain.github.io/eunjoo_page/
- 소스 저장소: https://github.com/CastleRain/eunjoo_page
- 직원·휴가: https://castlerain.github.io/eunjoo_page/#leave

## 현재 구현

React 19 + Vite + Ant Design 6 + Day.js를 사용합니다. Noto Sans KR Variable, Lucide 아이콘, Motion을 포함합니다. 공용 UI는 `src/ui.jsx`, 테마는 `src/Theme.jsx`, 공통 색상은 `src/design-config.js`에서 관리합니다. 확정된 A 레이아웃에 흰색·연한 갈색을 적용했습니다.

현재는 가상 데이터로 동작하는 프론트엔드 시안입니다. 실제 로그인, 서버 권한, DB, 결제, 메시지 발송은 구현하지 않았습니다. 업무 데이터는 새로고침 시 초기화되고 화면 설정만 브라우저에 저장됩니다.

## 구조

```text
src/                  화면, 공용 UI, 테마, 시연 데이터
public/               배포할 정적 자료
.github/workflows/    main 푸시 시 GitHub Pages 자동 배포
tests/                휴가 일수 및 정적 배포 테스트
scripts/, worker/     기존 Sites 호환 패키징 (업무 API 서버 아님)
```

기존 폴더·압축파일은 로컬 `.local-backup/original-layout-2026-09-27.tar.gz`에 보관합니다. 백업, node_modules, 빌드 결과, 환경변수 파일은 Git에 올리지 않습니다. 이 백업은 새로 clone한 저장소에는 포함되지 않습니다.

## 개발 및 검증

Node.js 22 이상을 사용합니다.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
npm run build
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

현재 UI를 유지하며 TypeScript와 API 데이터 계층을 단계적으로 도입하고, 별도 NestJS 서버 + PostgreSQL + Prisma를 연결하는 구성이 기존 설계안입니다. GitHub Pages에는 정적 프론트엔드만 배포하며, 업무 API와 DB는 별도 서버에서 운영해야 합니다. 먼저 로그인·서버 권한·휴가 신청/승인 흐름을 연결하는 순서를 제안합니다. 이번 배포에는 백엔드를 추가하지 않았습니다.

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
