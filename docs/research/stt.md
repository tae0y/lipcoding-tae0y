# 음성 입력(STT) 옵션 조사

단일 사용자 웹 앱. 한국어+영어 가능성. STT는 점수 핵심이 아니다.

## 옵션 비교

| | (a) Web Speech API | (b) Azure AI Speech (STT) |
|---|---|---|
| 실행 위치 | 브라우저 네이티브(`SpeechRecognition`) | Azure 클라우드(SDK/REST) |
| 한국어 | Chrome `ko-KR` 양호(내부 Google 엔진) | 우수, 노이즈/억양/문장부호 강함 |
| EN+KO 혼용 | 세션당 한 언어(`lang`) | 언어 ID/로케일, 혼용에 유리 |
| 통합 난이도 | JS ~10줄, 프론트만 | 중간: SDK/REST + 토큰·키 처리 |
| 비용 | 무료 | 무료 ~5시간/월, 이후 ~$1/시간(S0) |
| 지연 | 낮음(인터림 스트리밍) | 낮음, 단 네트워크+인증 왕복 |
| 브라우저 | Chrome/Edge/Safari ✅, **Firefox ❌** | 모든 브라우저 |
| secret | **없음** | 구독 + Speech 리소스 + **키+리전**(백엔드 프록시 필수, SPA 노출 금지) |

## 권장 통합 — Web Speech API

프론트만, 백엔드/secret 없음:

```js
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new Rec();
rec.lang = "ko-KR";          // 토글에 따라 "en-US"
rec.interimResults = true;
rec.continuous = false;

rec.onresult = (e) => {
  const text = Array.from(e.results).map(r => r[0].transcript).join("");
  inputBox.value = text;     // 기존 텍스트 입력에 주입
};
rec.onerror = (e) => console.warn("STT error:", e.error);
micButton.onclick = () => rec.start();
```

`Rec` 이 undefined면 마이크 버튼 숨김(Firefox 대응).

## 판정: 기본 스킵

- **점수 미반영.** 핵심은 Copilot SDK 깊이 + Azure 모델. STT는 루브릭에 기여 0.
- **Azure Speech는 잘못된 Azure 지출.** 리소스+키 프록시만 늘고 "Azure 모델 사용"
  점수(LLM 통합)와는 무관.
- **4시간 + 비핵심 기능 = 컷.** 마이크 권한·브라우저 quirk·에러 상태가 시간만 먹음.

**진짜 여유가 남으면**: 위 Web Speech API 스니펫만(~10분, 프론트만, secret 없음).
**절대** 이 시간 압박에서 Azure Speech를 배선하지 말 것.

결론: 기본 = 스킵. 스트레치 목표(엔드투엔드 + SDK/Azure 깊이 확보 후) = Web Speech API, 그 이상은 X.
