# 한국어 음성 받아쓰기(STT) 트러블슈팅 (2026-06-20)

GitHub Copilot 음성 입력의 한국어 인식이 잘 안 되는 문제를 해결하고, 시스템 전역
받아쓰기를 VoiceInk(로컬 Whisper)로 일원화한 과정을 기록한다.

관련 문서: [voice-chat 초기 설정 경험](2026-06-20-voice-chat-setup.md)

## 증상

- Copilot 음성 입력으로 한국어를 말하면 엉뚱하게 받아써짐.
- 예: "컴퓨터" → "커뮤니티".
- 특정 단어는 모델을 바꿔도 계속 못 알아듣는다. 대표적으로 **"커밋(commit)"** 은
  거의 매번 "컴퓨터", "커뮤니티" 등으로 잘못 받아써졌다. 영어 기술 용어의
  한국어 발음은 STT가 약한 구간이니, 받아쓰기 후 이런 단어는 직접 확인·수정할 것.

## 원인

- VS Code 음성 입력은 `ms-vscode.vscode-speech` 확장이 담당하며 **로컬 모델**을 쓴다.
- 한국어 언어팩(`ms-vscode.vscode-speech-language-pack-ko-kr`)은 이미 설치돼 있었으나,
  `accessibility.voice.speechLanguage` 설정이 없어 **기본값 `en-US`(영어 모델)** 로
  한국어를 인식하고 있었다.

## 해결 1 — VS Code 내장 음성 입력 한국어화

사용자 `settings.json`에 언어 지정 추가:

```jsonc
"accessibility.voice.speechLanguage": "ko-KR"
```

- `Developer: Reload Window` 후 적용.
- 전부 로컬 처리(네트워크 사용 안 함).
- Copilot Chat의 마이크 아이콘으로 바로 한국어 받아쓰기 가능.

### 참고: TIL 번들 whisper-cli는 불완전했음

- `~/20_DocHub/TIL/.claude/claudeclaw/whisper/bin/whisper-cli`는 의존 dylib
  (`libwhisper.1.dylib`, `libggml.0.dylib` 등)이 누락돼 실행 불가였고, 모델도
  `ggml-base.en.bin`(영어 전용)이라 한국어가 안 됐다.
- 해결책으로 Homebrew 설치가 더 깔끔: `brew install whisper-cpp` (dylib 완비).
- 멀티링구얼 모델 필요: `ggml-small.bin` 이상(영어 전용 `.en` 모델로는 한국어 불가).

## 해결 2 — 시스템 전역 받아쓰기를 VoiceInk로 교체

Copilot 밖(브라우저·메모·터미널 등)에서도 한국어 받아쓰기가 필요해
오픈소스 로컬 Whisper 앱 **VoiceInk**를 도입했다.

### 핵심 사실

- VS Code 채팅 음성 버튼의 STT provider를 외부 Whisper로 바꾸는 **공개 API는 없다.**
  → 에디터 안은 `vscode-speech`(ko-KR), 에디터 밖은 VoiceInk로 분리.
- macOS 기본 받아쓰기 **엔진 자체를 교체하는 것도 불가**(시스템 API).
  → 기본 받아쓰기를 끄고 VoiceInk 단축키로 대체하면 사실상 동일한 효과.

### 설치 및 설정

```bash
brew install --cask voiceink                       # 오픈소스, 완전 로컬
```

- 모델: **large-v3-turbo** (한국어 정확도 최상). VoiceInk는 whisper.cpp `ggml`
  모델을 쓰므로, huggingface에서 받아 모델 폴더에 직접 배치:

```bash
D="$HOME/Library/Application Support/com.prakashjoshipax.VoiceInk/WhisperModels"
curl -L -o "$D/ggml-large-v3-turbo.bin" \
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
```

- 수동 배치한 모델은 **앱 재시작 후** 사이드바 `AI Models`에서 선택 가능.

### 애플 기본 받아쓰기 끄기(충돌 제거, 가역적)

```bash
defaults write com.apple.assistant.support "Dictation Enabled" -bool false
defaults write com.apple.HIToolbox AppleDictationAutoEnable -int 0
```

- 로그아웃/재시작 후 완전 반영.
- 되돌리기: 위 값을 `true`/`1`로 다시 쓰거나 시스템 설정 → 키보드 → 받아쓰기에서 켜기.

## 최종 구성

| 항목 | 설정 |
| --- | --- |
| 에디터 안(Copilot Chat) | `accessibility.voice.speechLanguage: ko-KR`, 마이크 아이콘 |
| 에디터 밖(전역) | VoiceInk, 단축키 **오른쪽 ⌘(Right Command)** |
| 모델 | large-v3-turbo (로컬, whisper.cpp) |
| 애플 기본 받아쓰기 | Off |

## 교훈

- 한국어 STT 정확도는 **앱이 아니라 Whisper 모델 크기**가 좌우한다
  (`base`/`small`은 부정확, `large-v3`/`large-v3-turbo` 권장).
- "음성 인식이 안 된다"의 첫 점검은 **언어 설정**이다. 모델 교체 전에
  `speechLanguage`부터 확인할 것.
- 모든 처리는 로컬에서 가능 — API 키·네트워크·비용 없이 동작한다.
