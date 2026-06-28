# Korean Speech-to-Text (STT) Troubleshooting (2026-06-20)

Recording the process of fixing poor Korean recognition in GitHub Copilot voice input
and unifying system-wide dictation to VoiceInk (local Whisper).

Related: [voice-chat setup experience](2026-06-20-voice-chat-setup.md)

## Symptom

- Korean speech via Copilot voice input was transcribed incorrectly.
- Example: "computer" → transcribed as "community."
- Certain words were consistently mis-recognized regardless of model. Most notably, **"commit"**
  was almost always transcribed as "computer," "community," etc. English technical terms
  pronounced with Korean phonetics are a STT weak spot — verify and correct such words after transcription.

## Cause

- VS Code voice input is handled by the `ms-vscode.vscode-speech` extension, which uses a **local model**.
- The Korean language pack (`ms-vscode.vscode-speech-language-pack-ko-kr`) was already installed, but
  `accessibility.voice.speechLanguage` was not set — so the **default `en-US` (English model)** was
  being used to recognize Korean.

## Fix 1 — Enable Korean in VS Code Built-in Voice Input

Add language specification to user `settings.json`:

```jsonc
"accessibility.voice.speechLanguage": "ko-KR"
```

- Apply with `Developer: Reload Window`.
- All processing is local (no network).
- Korean dictation works immediately via the microphone icon in Copilot Chat.

### Note: Bundled whisper-cli in TIL was incomplete

- `~/20_DocHub/TIL/.claude/claudeclaw/whisper/bin/whisper-cli` was not runnable due to missing
  dependency dylibs (`libwhisper.1.dylib`, `libggml.0.dylib`, etc.), and the model was
  `ggml-base.en.bin` (English-only) so Korean was not possible.
- A cleaner solution is to install via Homebrew: `brew install whisper-cpp` (all dylibs included).
- A multilingual model is required: `ggml-small.bin` or larger (`.en` English-only models cannot handle Korean).

## Fix 2 — Replace System-Wide Dictation with VoiceInk

Korean dictation was also needed outside VS Code (browser, notes, terminal, etc.),
so the open-source local Whisper app **VoiceInk** was adopted.

### Key Facts

- There is **no public API to replace the STT provider** for the VS Code chat voice button with an external Whisper.
  → Inside the editor: `vscode-speech` (ko-KR); outside: VoiceInk.
- **Replacing macOS built-in dictation's engine is not possible** (system API).
  → Disable built-in dictation and replace with a VoiceInk shortcut for effectively the same result.

### Installation and Configuration

```bash
brew install --cask voiceink                       # open-source, fully local
```

- Model: **large-v3-turbo** (best Korean accuracy). VoiceInk uses whisper.cpp `ggml` models,
  so download and place directly in the model folder from Hugging Face:

```bash
D="$HOME/Library/Application Support/com.prakashjoshipax.VoiceInk/WhisperModels"
curl -L -o "$D/ggml-large-v3-turbo.bin" \
  "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin"
```

- Manually placed models are selectable from `AI Models` in the sidebar **after restarting the app**.

### Disable Apple Dictation (remove conflict, reversible)

```bash
defaults write com.apple.assistant.support "Dictation Enabled" -bool false
defaults write com.apple.HIToolbox AppleDictationAutoEnable -int 0
```

- Takes full effect after logout/restart.
- Revert: write `true`/`1` back, or enable via System Settings → Keyboard → Dictation.

## Final Configuration

| Item | Setting |
| --- | --- |
| Inside editor (Copilot Chat) | `accessibility.voice.speechLanguage: ko-KR`, microphone icon |
| Outside editor (system-wide) | VoiceInk, shortcut **Right ⌘ (Right Command)** |
| Model | large-v3-turbo (local, whisper.cpp) |
| Apple built-in dictation | Off |

## Lessons

- Korean STT accuracy is determined by **Whisper model size**, not the app.
  (`base`/`small` are inaccurate; `large-v3`/`large-v3-turbo` recommended).
- When "speech recognition doesn't work," check **language settings first** before swapping models.
  Verify `speechLanguage` before anything else.
- All processing is possible locally — no API key, network, or cost required.
