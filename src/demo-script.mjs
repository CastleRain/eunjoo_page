const step = (title, narration, expected, run) => ({title, narration, expected, run});
export const demoChapters = [
  {id:'overview', title:'01 · 오늘 할 일과 읽기 편한 화면', route:'today', steps:[
    step('하루 업무를 한눈에', '오늘 처리할 조제·연락·문진과 예약을 한 화면에서 확인합니다.', '조제 3건 · 연락 3명 · 문진 2건', async h=>h.focus('.stats')),
    step('업무별로 좁혀 보기', '조제·재고 필터를 누르면 관련 업무만 남습니다.', '입고·제품 전달·사용기한 업무 3개', async h=>{await h.tab('조제·재고');}),
    step('글자 크기 확대', '40·50대 직원도 편하게 읽도록 글자와 조작 영역을 함께 키웁니다.', '20px 적용과 미리보기', async h=>{await h.open('display');await h.button('크게20px');}),
    step('화면 설정 적용', '기본 크기로 되돌립니다. 이 설정은 기기에 저장됩니다.', '18px 복귀', async h=>{await h.button('기본18px');await h.button('이 크기로 보기');await h.tab('전체');}),
    step('통합 검색', '처방 번호만 입력해도 환자와 연결된 처방을 바로 찾습니다.', '처방 #1043 검색 결과', async h=>{await h.open('search');await h.field('환자 이름, 처방 번호, 메뉴명','1043',true);}),
    step('초안 이어쓰기', '검색 결과에서 작성 중인 처방을 열어 이어서 작업합니다.', '인삼 100g · 감초 20g 초안', async h=>{await h.button('처방 #1043 · 정○○작성 중');}),
    step('아침 브리핑', '예약 환자의 문진과 준비사항을 정리해 봅니다. 인쇄 버튼은 수동으로 사용할 수 있습니다.', '예약 3명의 준비 메모 · 자동 시연은 인쇄창을 열지 않음', async h=>{await h.close();await h.button('예약 전체 보기');})
  ]},
  {id:'prescriptions', title:'02 · 재료 부족부터 조제 완료까지', route:'prescriptions', steps:[
    step('재료 부족 처방 열기', '김○○님의 처방에 필요한 약재와 미리 확보한 양을 확인합니다.', '인삼 100g 확보 · 황기 80g 필요', async h=>h.row('#1042','열기')),
    step('부족한 상태에서 완료 시도', '일부 약재가 부족하면 전체 조제를 완료하지 않습니다.', '황기 부족 경고 · 재고 변화 없음', async h=>{await h.button('조제 완료');await h.expect(a=>a.herbs[0].qty===600&&a.herbs[1].qty===0,'부족 처방의 재고가 유지되어야 합니다.');}),
    step('포장 단위로 입고 입력', '250g 포장 두 개를 입력하면 입고량 500g으로 환산합니다.', '2 × 250g = 500g', async h=>{await h.close();await h.go('stock');await h.button('입고 등록');await h.field('포장 수','2');await h.field('포장당 중량 (g)','250',true);}),
    step('입고 반영', '입고를 저장하면 사용 가능한 황기 재고가 늘어납니다.', '황기 장부 재고 500g', async h=>{await h.button('입고 반영');await h.expect(a=>a.herbs[1].qty===500,'황기 500g 입고 확인');}),
    step('조제 완료', '재료가 모두 준비된 처방을 완료하면 이번 사용량만 차감합니다.', '인삼 500g · 확보 0g / 황기 420g', async h=>{await h.go('prescriptions');await h.row('#1042','열기');await h.button('조제 완료');await h.expect(a=>a.rx.find(x=>x.id===1042).state==='조제 완료'&&a.herbs[1].qty===420,'처방 완료와 황기 차감 확인');}),
    step('완료 처방 확인', '완료된 처방에는 완료 버튼이 다시 나타나지 않아 추가 차감을 막습니다.', '완료 안내 · 추가 차감 없음', async h=>h.row('#1042','열기')),
    step('저장 처방으로 새 초안', '새 처방에서 자주 쓰는 약재 구성을 불러옵니다.', '저장 처방 A · 인삼과 감초', async h=>{await h.close();await h.button('새 처방 작성');await h.tab('저장 처방');await h.button('저장 처방 A인삼 · 감초');await h.field('감초 사용량 (g)','25');}),
    step('초안 저장과 상태 필터', '완료 전에는 초안으로 저장하고 작성 중인 처방만 모아볼 수 있습니다.', '새 초안 #1045 · 재고는 추가 차감되지 않음', async h=>{await h.button('초안 저장');await h.tab('작성 중');})
  ]},
  {id:'stock', title:'03 · 약재 등록·재고·부분 전달', route:'stock', steps:[
    step('새 약재 등록', '입고 등록 옆의 새 약재 등록에서 약재명과 공급처를 입력합니다. 품목 코드는 자동 생성됩니다.', '백출 · 온담 약업 · H005 · 기준 단위 g', async h=>{await h.button('새 약재 등록');await h.field('약재명','백출',true);await h.field('공급처 (선택)','온담 약업',true);}),
    step('등록 후 바로 입고', '약재 등록은 품목을 만드는 단계입니다. 등록 직후에는 재고가 0g이며 입고에서 실제 수량을 입력합니다.', '백출 등록 · 300g 포장 2개 = 600g', async h=>{await h.button('등록하고 입고');await h.expect(a=>a.herbs.some(x=>x.name==='백출'&&x.qty===0),'새 약재의 초기 재고 확인');await h.field('포장 수','2');await h.field('포장당 중량 (g)','300',true);}),
    step('새 약재 재고 반영', '입고 반영 후 새 약재가 재고 목록과 처방의 약재 찾기에 함께 나타납니다.', '백출 H005 · 장부 600g · 사용 가능 600g', async h=>{await h.button('입고 반영');await h.expect(a=>a.herbs.some(x=>x.name==='백출'&&x.qty===600),'백출 입고 확인');await h.field('품목명 또는 코드 검색','백출',true);}),
    step('보유량과 확보량 구분', '인삼 장부 600g 중 다른 처방에 확보한 100g을 제외하면 500g을 사용할 수 있습니다.', '장부 / 확보 / 사용 가능 열', async h=>{await h.field('품목명 또는 코드 검색','');await h.row('인삼','상세');}),
    step('사용기한 관리', '입고 묶음에서 약재별 남은 양과 사용기한을 확인합니다.', '감초의 사용기한 임박 표시', async h=>{await h.close();await h.tab('입고 묶음');}),
    step('판매와 전달 분리', '제품 3개를 결제해도 아직 전달하지 않은 수량은 따로 남습니다.', '3개 주문 · 1개 전달 · 2개 미전달', async h=>{await h.tab('완제품·전달');await h.button('전달 기록');}),
    step('한 개만 먼저 전달', '이번에 실제로 전달한 수량만 입력합니다.', '2/3개 전달 · 1개 미전달 · 실물 9개', async h=>{await h.field('이번 전달 수량','1');await h.button('전달 기록 완료');await h.expect(a=>a.delivered===2,'부분 전달 2개 확인');}),
    step('남은 제품 전달 완료', '남은 한 개를 전달하면 주문의 전달 상태가 완결됩니다.', '3/3개 전달 · 남은 전달 0개 · 실물 8개', async h=>{await h.button('전달 기록');await h.button('전달 기록 완료');await h.button('전달 기록');}),
    step('구매 요청 확인', '부족한 약재를 어떤 처방에 필요한지 연결해 확인합니다.', '황기 500g 구매 요청 · 처방 #1042', async h=>{await h.close();await h.tab('구매 요청');})
  ]},
  {id:'calendar', title:'04 · 탕전 일정과 처방 연결', route:'calendar', steps:[
    step('월간 일정', '탕전 예정일과 재료 대기 상태를 날짜별로 확인합니다.', '9월 달력의 환자별 일정', async h=>h.focus('.clinic-calendar')),
    step('주간 보기', '이번 주 작업을 목록으로 정리해 봅니다.', '9월 20–26일의 일정', async h=>h.tab('주')),
    step('일간 보기', '오늘 해야 할 탕전만 집중해서 봅니다.', '9월 25일 일정', async h=>h.tab('일')),
    step('일정 추가 입력', '처방을 연결하고 날짜와 선택 시간을 입력합니다.', '정○○ · 9월 28일 14:30', async h=>{await h.button('일정 추가');await h.field('탕전 날짜','2026-09-28');await h.field('시간 (선택)','14:30');}),
    step('달력에 반영', '일정 추가 후 월간 달력에서 새 일정을 확인합니다.', '9월 28일 정○○ 일정', async h=>{await h.button('일정 추가');await h.tab('월');await h.expect(a=>a.events.some(x=>x.day==='2026-09-28'&&x.time==='14:30'),'추가 일정 확인');}),
    step('기존 일정 날짜 변경', '상세 창에서 날짜를 바꾸되 연결된 처방은 유지합니다.', '김○○ 일정 9월 25일 → 28일', async h=>{await h.open('event',{id:1});await h.field('탕전 예정일','2026-09-28');await h.button('날짜 변경 반영');}),
    step('연결 처방 확인', '달력에서 처방과 부족한 약재까지 바로 확인할 수 있습니다.', '처방 #1042 상세', async h=>{await h.open('event',{id:1});await h.button('연결 처방 보기');})
  ]},
  {id:'patients', title:'05 · 고객 등록과 통합 기록', route:'patients', steps:[
    step('신규 고객 등록 입력', '실제 개인정보 대신 홍○○이라는 시연 환자를 입력합니다.', '환자 이름과 선택 외부 차트 ID', async h=>{await h.button('환자 등록');await h.field('시연용 환자 이름','홍○○',true);}),
    step('등록 후 검색', '새로 등록한 고객을 이름으로 검색합니다.', '홍○○ · 신규 등록', async h=>{await h.button('시연 환자 등록');await h.field('이름 또는 번호로 검색','홍',true);}),
    step('오늘 예약 필터', '진료 준비가 필요한 오늘 예약 환자만 봅니다.', '김·이·박 3명', async h=>{await h.field('이름 또는 번호로 검색','');await h.tab('오늘 예약');}),
    step('복약 시작일 구분', '처방 완료일과 실제 복용을 시작한 날은 따로 관리합니다.', '이○○ 복약 시작일 9월 26일', async h=>{await h.row('P0102','기록 보기');await h.field('실제 복약 시작일','2026-09-26');await h.button('시작일 반영');}),
    step('방문과 예약 이력', '실제 방문과 예약, 제품 구매를 구분해 방문 횟수를 왜곡하지 않습니다.', '제품 구매는 방문 횟수에 미포함', async h=>h.tab('방문·예약')),
    step('처방과 제품 구매', '같은 고객의 처방과 미전달 제품을 함께 확인합니다.', '처방 #1041 · 제품 2개 미전달', async h=>h.tab('처방·구매')),
    step('문진과 연락', '고객의 문진과 최근 연락 기록을 한 자리에서 확인합니다.', '완료된 문진 없음 · 최근 연락 기록', async h=>h.tab('문진·연락'))
  ]},
  {id:'calls', title:'06 · 해피콜과 재연락 관리', route:'calls', steps:[
    step('대상 선정 기준', '왜 연락 대상인지 확인하고 예약·연락 제외 조건을 검토합니다.', '이미 예약·재방문·최근 연락·연락 제외 조건', async h=>h.button('대상 조건')),
    step('통화 결과 입력', '윤○○에게 직접 통화했다고 가정하고 예약 완료와 메모를 남깁니다.', '예약 완료 · 9월 28일 내원 안내', async h=>{await h.button('조건 검토 완료');await h.row('윤○○','연락 기록');await h.field('통화 결과','예약 완료');await h.field('연락 메모','시연 통화: 9월 28일 내원 예약 안내 완료.',true);}),
    step('처리 목록 갱신', '예약이 완료된 고객은 연락 대기에서 빠집니다.', '처리할 연락 3명 → 2명', async h=>{await h.button('연락 결과 저장');await h.expect(a=>a.calls.find(x=>x.id==='P0106').state==='예약 완료','통화 기록 확인');}),
    step('부재와 재연락 날짜', '전화를 받지 않으면 다시 연락할 날짜를 남깁니다.', '장○○ · 부재 · 9월 28일 재연락', async h=>{await h.row('장○○','연락 기록');await h.field('통화 결과','부재');await h.field('다시 연락할 날짜','2026-09-28');await h.field('연락 메모','시연 통화: 부재로 다음 근무일에 재연락.',true);await h.button('연락 결과 저장');}),
    step('전체 처리 이력', '완료 결과와 아직 처리해야 할 연락을 함께 확인합니다.', '윤○○ 예약 완료 / 장○○ 부재', async h=>h.tab('전체 이력')),
    step('제외 대상 확인', '연락하면 안 되거나 이미 예약된 고객을 별도로 확인합니다.', '윤○○ 예약 완료가 제외 목록에 추가', async h=>h.tab('제외 대상'))
  ]},
  {id:'forms', title:'07 · 환자 문진부터 원장 검토까지', route:'forms', steps:[
    step('문진 양식', '필수 문항과 선택 문항을 구분한 기본 문진 양식입니다.', '불편감·수면·식사 필수 / 약·전달사항 선택', async h=>{await h.tab('문진 양식');await h.button('초진 기본 문진주요 불편감 · 수면 · 식사 · 복용 약 · 주관식사용 중');}),
    step('환자 전용 화면 시작', '직원이 문진을 시작하면 환자는 직원 메뉴가 없는 화면을 사용합니다.', '3단계 문진의 첫 화면', async h=>{await h.close();await h.button('새 문진 시작');await h.button('환자 화면 열기');}),
    step('필수 입력 안내', '필수 답변을 비우면 다음 단계로 넘어가지 않습니다.', '필수 항목 답변 안내', async h=>h.button('다음')),
    step('불편감 예시 입력', '시연용 불편감을 자동 입력합니다.', '최근 잠들기 어렵고 아침에 피곤합니다.', async h=>{await h.field('가장 불편한 점 (필수)','최근 잠들기 어렵고 아침에 피곤합니다.',true);await h.button('다음');}),
    step('생활 문항 선택', '큰 선택 영역으로 수면과 식사 상태를 답합니다.', '잠들기 어려워요 / 보통이에요', async h=>{await h.answer('잠들기 어려워요');await h.answer('보통이에요');await h.button('다음');}),
    step('선택 항목은 비워서 제출', '선택 항목에 답하지 않아도 제출할 수 있습니다.', '작성 완료 화면', async h=>h.button('작성 완료')),
    step('원장용 요약 확인', '환자 응답과 선택 항목의 미응답을 구분합니다.', '시연 환자의 답변 · 전달사항 미응답', async h=>{await h.button('직원 화면으로 돌아가기 · 시연');await h.row('시연 환자','요약 보기');}),
    step('검토 완료 기록', '원장이 확인하면 검토 완료 상태로 바뀝니다.', '시연 환자 검토 완료', async h=>{await h.button('검토 확인');await h.expect(a=>a.reviewed.includes('시연 환자'),'문진 검토 완료 확인');})
  ]},
  {id:'messages', title:'08 · 안내 규칙과 발송 전 확인', route:'messages', steps:[
    step('안내 규칙 켜기', '예약 전날 안내 규칙을 켜 봅니다. 외부 서비스가 연결되지 않아 실제 발송되지 않습니다.', '시연 규칙 켜짐 · 외부 연결 대기', async h=>h.switch('예약 전날 안내 시연 규칙')),
    step('문구 미리보기', '문구를 바꾸면 고객에게 보일 내용을 바로 확인할 수 있습니다.', '모의 메시지 내용 갱신', async h=>{await h.button('내용 보기',0);await h.field('안내 문구 편집','내일 예약이 있습니다. 일정 변경이 필요하시면 한의원으로 연락해 주세요.',true);}),
    step('모의 발송 이력', '성공·실패·결과 불확실을 구분해서 봅니다.', '세 가지 모의 결과', async h=>{await h.button('문구 검토 완료');await h.tab('발송 이력');}),
    step('불확실한 결과 처리', '결과가 불확실하면 바로 재발송하지 않고 연결 상태부터 확인합니다.', '결과 확인 필요 · 미연결 안내', async h=>{await h.row('정○○','상세');await h.button('연결 상태 확인');}),
    step('재구매 후보 검토', '구매 이력과 동의를 확인한 뒤 문구를 검토합니다.', '오○○ · 구매 후 31일 · 동의 확인', async h=>{await h.close();await h.tab('재구매 후보');await h.button('문구 검토');})
  ]},
  {id:'leave', title:'09 · 휴가 신청·승인·취소', route:'leave', steps:[
    step('직원 화면과 기존 신청', '직원 A로 바꾸어 본인의 신청만 관리합니다.', '직원 메뉴에서 원장 경영 숨김', async h=>{await h.role('데스크');await h.tab('내 신청 내역');await h.leaveRow('직원 A');}),
    step('승인 전 신청 철회', '아직 승인되지 않은 신청은 직원이 철회할 수 있습니다.', '기존 9월 29일 신청 철회', async h=>{await h.button('신청 철회');}),
    step('날짜로 신청 일수 자동 계산', '시작일 9월 28일, 종료일 9월 30일을 선택합니다. 직접 일수를 입력하지 않습니다.', '신청 일수 자동 3일 · 시안은 주말·공휴일 포함', async h=>{await h.button('휴가 신청');await h.field('시작일','2026-09-28');await h.field('종료일','2026-09-30');await h.inputIs('신청 일수','3');}),
    step('반차 자동 계산', '오전 반차로 바꾸면 종료일은 시작일과 같아지고 일수는 0.5일입니다.', '종료일 고정 · 0.5일', async h=>{await h.field('휴가 종류','오전 반차');await h.inputIs('신청 일수','0.5');}),
    step('연차 신청 입력', '다시 3일 연차로 바꾸고 사유와 인계사항을 입력합니다.', '9월 28–30일 · 3일 · 인계 메모', async h=>{await h.field('휴가 종류','연차');await h.field('종료일','2026-09-30');await h.field('사유 (선택 · 원장과 본인만 확인)','시연용 개인 일정',true);await h.field('업무 인계사항 (선택)','예약 확인과 오전 접수 업무를 직원 C에게 인계합니다.',true);}),
    step('승인 전에는 달력 미표시', '신청 후 승인 대기 상태가 되고 공유 달력에는 아직 나타나지 않습니다.', '내 신청 승인 대기 · 달력에는 직원 B만 표시', async h=>{await h.button('휴가 신청하기');await h.tab('직원 달력');await h.expect(a=>a.leaves.some(x=>x.employee==='직원 A'&&x.state==='승인 대기'&&x.days===3),'3일 신청 확인');}),
    step('원장 승인 대기함', '한승재 원장이 신청과 인계사항, 같은 기간 다른 직원의 휴가를 확인합니다.', '직원 B의 9월 30일 휴가 중복 기간 안내', async h=>{await h.role('원장');await h.tab('승인 대기함');await h.leaveRow('직원 A');}),
    step('승인 후 달력 반영', '원장이 승인하면 직원 달력에 자동 표시됩니다.', '9월 28·29·30일 직원 A 연차', async h=>{await h.button('휴가 승인');await h.tab('직원 달력');await h.expect(a=>a.leaves.some(x=>x.employee==='직원 A'&&x.state==='승인 완료'&&x.days===3),'휴가 승인 확인');}),
    step('반려와 사유', '다른 신청을 반려할 때는 직원이 확인할 사유를 남깁니다.', '직원 C 신청 반려 · 검토 의견 기록', async h=>{await h.tab('승인 대기함');await h.leaveRow('직원 C');await h.button('반려');await h.field('반려 사유','시연 예시: 해당 날짜 근무 인원이 부족해 일정 조정을 부탁드립니다.',true);await h.button('반려 확정');}),
    step('다른 직원의 사유 보호', '직원 A가 직원 B의 일정을 열어도 개인 사유와 인계 내용은 보이지 않습니다.', '이름·기간·휴가 종류·일수만 공유', async h=>{await h.role('데스크');await h.calendarEvent('직원 B');}),
    step('승인된 휴가 취소 요청', '이미 승인된 휴가는 바로 없애지 않고 원장에게 취소 요청을 보냅니다.', '직원 A 취소 요청', async h=>{await h.close();await h.tab('내 신청 내역');await h.leaveRow('직원 A');await h.button('승인된 휴가 취소 요청');await h.tab('직원 달력');}),
    step('취소 승인 후 달력에서 제거', '취소 검토 중에는 달력에 남습니다. 원장이 취소를 승인하면 사라집니다.', '직원 A 취소 완료 · 직원 B 일정 유지', async h=>{await h.role('원장');await h.tab('승인 대기함');await h.leaveRow('직원 A');await h.button('취소 승인');await h.tab('직원 달력');await h.expect(a=>a.leaves.some(x=>x.employee==='직원 A'&&x.state==='취소 완료'),'휴가 취소 확인');})
  ]},
  {id:'business', title:'10 · 원장 경영과 직원 접근 제한', route:'business', steps:[
    step('원장 전용 경영 요약', '한승재 원장은 기록된 매출·비용·예상 차액을 확인합니다.', '매출 2,800만원 · 비용 1,850만원 · 차액 950만원', async h=>h.focus('.finance-metrics')),
    step('비용 입력', '소모품 구입 비용 50,000원을 기록합니다.', '소모품 구매 · 운영비 · 50,000원', async h=>{await h.button('비용 기록');await h.field('비용 항목','소모품 구매',true);await h.field('금액 (원)','50000',true);}),
    step('합계와 기록 갱신', '저장한 비용이 합계와 목록에 반영됩니다.', '비용 1,855만원 · 차액 945만원', async h=>{await h.button('비용 기록 저장');await h.tab('매출·비용');await h.expect(a=>a.costs.reduce((n,x)=>n+x.amount,0)===18550000,'비용 합계 확인');}),
    step('반복 비용과 중복 확인', '임대료 같은 반복 비용의 기록 여부를 확인합니다. 이체를 실행하지 않습니다.', '9월 임대료 기록 완료', async h=>h.tab('반복 비용')),
    step('직원 근무·급여 기록', '민감한 급여 기록은 원장 화면에서만 확인합니다.', '직원별 기록과 상세', async h=>{await h.tab('직원관리');await h.row('직원 A','기록 보기');}),
    step('직원 직접 접근 차단', '직원 역할로 바꾸면 현재 경영 주소에서도 전용 안내만 표시됩니다.', '경영 수치 미노출 · 원장 전용 화면', async h=>{await h.close();await h.role('데스크');await h.expect(a=>a.role==='데스크','직원 역할 확인');}),
    step('직원 검색에서도 제외', '직원 검색에는 원장 경영 메뉴가 나타나지 않습니다. 운영 서비스에서는 서버 권한도 검증해야 합니다.', '원장 경영 검색 결과 0개', async h=>{await h.open('search');await h.field('환자 이름, 처방 번호, 메뉴명','원장 경영',true);})
  ]},
  {id:'settings', title:'11 · 설정·파일 검토·연동 범위', route:'settings', steps:[
    step('업무 기준 설정', '예약 전 준비 알림 기준을 조정하는 화면입니다. 실제 알림 서비스는 아직 연결 전입니다.', '예약 15분 전으로 시연 설정', async h=>{await h.field('예약 몇 분 전','15');await h.button('설정 반영');}),
    step('역할별 권한표', '원장·데스크·조제 담당의 업무와 경영 접근 범위를 구분합니다.', '직원 경영·급여 제한', async h=>h.tab('역할·권한')),
    step('파일 가져오기 검토', '샘플 파일을 불러와 열 연결과 오류·중복을 먼저 확인합니다.', '중복 2건 · 오류 1건 · 추가 가능한 행 없음', async h=>{await h.tab('파일 가져오기');await h.button('예약 샘플 불러오기');}),
    step('기존 기록 유지', '오류가 있는 파일을 무조건 추가하지 않고 검토를 종료합니다.', '기존 데이터 유지', async h=>h.button('검토 마치기')),
    step('외부 연결 상태', '전자차트·카카오톡·예약 알림은 실제 개발에서 연결할 항목입니다.', '3개 서비스 연결 대기', async h=>h.tab('외부 연결')),
    step('변경 이력과 백업', '누가 무엇을 처리했는지 기록하는 방향과 백업 정책을 확인합니다.', '현재는 가상 이력·백업 정책 예시', async h=>{await h.tab('변경 이력');await h.button('백업 정책 보기');}),
    step('시연 마무리', '고객관리·조제·재고·휴가·경영을 하나의 웹앱에서 연결하는 구성입니다. 종료하면 시연 전 업무 데이터로 돌아갑니다.', '전체 흐름 설명 완료', async h=>{await h.close();await h.go('today');})
  ]}
];
