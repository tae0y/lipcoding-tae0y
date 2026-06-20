# ---- build stage: Vite 프론트엔드 ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# 산출물: /app/frontend/dist

# ---- runtime stage: FastAPI ----
FROM python:3.12-slim
WORKDIR /app

# 의존성 먼저 (레이어 캐시 활용)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스
COPY backend/ ./

# 프론트엔드 빌드 결과 → FastAPI StaticFiles 경로
# vite outDir: "../backend/static" 이므로 빌드 결과는 /app/backend/static 에 위치
COPY --from=frontend-build /app/backend/static ./static

EXPOSE 8000
ENV PORT=8000

CMD ["gunicorn", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", \
     "-b", "0.0.0.0:8000", "app.main:app"]
