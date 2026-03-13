# Sniff QA Manager

사내 QA를 Gherkin 문법으로 관리하기 위한 내부용 웹 도구입니다.

현재 버전은 `Next.js Route Handlers + 서버 파일 저장소(JSON)` 구조를 사용합니다.
브라우저 `localStorage`만 쓰던 데모 구조에서, LAN 내 공용 데이터 저장 구조로 전환되었습니다.

## 핵심 기능

- `.feature` 파일 붙여넣기 자동 파싱
- `.feature` 파일 업로드/드래그 앤 드롭 파싱
- Gherkin 텍스트 직접 붙여넣기 파싱
- 시나리오/테스터 상태 및 메모 관리
- 검색/필터
- 서버 저장소 영속화 (`data/feature-files.json`)

## 로컬/사내 LAN 실행

```bash
pnpm install
pnpm dev
```

`dev` 스크립트는 `0.0.0.0:3000`으로 실행되므로 같은 Wi-Fi/LAN 사용자는 아래 주소로 접근할 수 있습니다.

- 서버 PC: `http://localhost:3000`
- 같은 네트워크 PC: `http://<서버PC_사설IP>:3000`

예: `http://192.168.0.24:3000`

## 데이터 저장 경로

- 기본 경로: `data/feature-files.json`
- 커스텀 경로: 환경변수 `SNIFF_DATA_FILE` 사용

예:

```bash
SNIFF_DATA_FILE=/Users/yourname/sniff-data/qa-files.json pnpm dev
```

## API 구조

- `GET /api/feature-files`: 전체 Feature 파일 조회
- `DELETE /api/feature-files`: 전체 삭제
- `PUT /api/feature-files/[fileId]`: 파일 단위 upsert
- `DELETE /api/feature-files/[fileId]`: 파일 단위 삭제
- `GET /api/feature-files/events`: SSE 기반 실시간 변경 이벤트 스트림

클라이언트는 변경사항을 로컬 UI에 즉시 반영하고, 파일 단위로 debounce 동기화합니다.
또한 SSE 스트림을 구독해 LAN 내 다른 사용자의 변경사항을 실시간 반영합니다.

## 사용 방법

1. `.feature` 파일을 복사한 뒤 화면에서 `Cmd+V`.
2. 또는 파일을 드래그 앤 드롭/선택 업로드.
3. 생성된 QA 리스트에서 시나리오 상태와 진행자별 메모를 기록.

## 주의 사항

- 브라우저 보안 정책상 "파일 경로 문자열"만 붙여넣으면 파일 내용을 읽을 수 없습니다.
- 이 경우 파일 자체를 붙여넣거나 업로드를 사용해야 합니다.
- 외부 인터넷 공개가 아닌 사내망 전용 사용을 권장합니다.
