# SQLite DB 파일이 컨테이너 이미지에 섞여 들어간 문제 (2026-06-20)

로컬에서 쓰던 SQLite DB 파일(`backend/data/app.db`)이 컨테이너 이미지 빌드에 그대로
포함되던 문제를 기록한다.

## 증상

- `Dockerfile`의 `COPY backend/ ./` 단계가 `backend/` 전체를 복사하면서,
  로컬에서 생성된 런타임 DB 파일 `backend/data/app.db`(약 28KB)까지 이미지에 섞여
  들어갔다.
- 이 파일은 `.gitignore`(`backend/.gitignore`의 `data/`)로 git에는 안 올라갔지만,
  **Docker 빌드 컨텍스트는 git 추적 여부와 무관**하게 디스크의 파일을 그대로 복사한다.

## 원인

- 빌드 컨텍스트가 리포 루트(`.`)인데 루트에 `.dockerignore`가 없었다.
- 그래서 `az acr build`/`docker build`가 작업 디렉터리의 모든 파일(로컬 DB, `.venv`,
  `node_modules`, `.env` 등)을 컨텍스트로 올렸다.

## 해결

- 리포 루트에 `.dockerignore`를 추가해 DB·런타임 데이터·비밀·캐시를 제외했다.
  - `backend/data/`, `data/`, `**/*.db`, `**/*.sqlite*`, `**/*.db-wal/-shm/-journal`
  - 추가로 `.venv`, `node_modules`, `dist`, `.env*`, `.git`, `docs`, `infra` 등도 제외.
- DB는 앱 기동 시 자동 생성되므로 이미지에 넣을 필요가 없다.
  - FastAPI `lifespan` → `db.init_db()` 호출(`backend/app/main.py`).
  - `_connect()`가 `Path(DB_PATH).parent.mkdir(...)`로 폴더를 만들고
    `sqlite3.connect()`가 빈 파일을 생성(`backend/app/db.py`).

## 메모

- `.gitignore`로 막았다고 컨테이너에도 안 들어가는 게 **아니다**. Docker는 별도로
  `.dockerignore`가 필요하다. (git 무시 ≠ 빌드 컨텍스트 무시)
- 컨테이너 파일시스템은 휘발성이라 DB는 매 재시작/재배포 시 초기화된다. 데이터를
  유지하려면 `/app/data`에 영속 볼륨(예: Container Apps의 Azure Files)을 마운트해야 한다.
- 빈 이미지로 가는 게 오히려 안전: 로컬 DB가 섞여 들어가면 시연 시 의도치 않은 옛
  데이터가 노출되거나, 빌드 캐시·이미지 크기가 불필요하게 커진다.
