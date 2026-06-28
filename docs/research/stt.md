# Voice Input (STT) Options Research

Single-user web app. Potential Korean + English. STT is not a core scoring item.

## Options Comparison

| | (a) Web Speech API | (b) Azure AI Speech (STT) |
|---|---|---|
| Execution | Browser native (`SpeechRecognition`) | Azure cloud (SDK/REST) |
| Korean | Chrome `ko-KR` good (internal Google engine) | Excellent, strong on noise/accent/punctuation |
| EN+KO mixed | One language per session (`lang`) | Language ID/locale, better for mixing |
| Integration difficulty | ~10 JS lines, frontend only | Medium: SDK/REST + token/key handling |
| Cost | Free | Free ~5hr/month, then ~$1/hr (S0) |
| Latency | Low (interim streaming) | Low, but network + auth round-trip |
| Browser | Chrome/Edge/Safari ✅, **Firefox ❌** | All browsers |
| Secret | **None** | Subscription + Speech resource + **key+region** (backend proxy required, must not expose in SPA) |

## Recommended Integration — Web Speech API

Frontend only, no backend/secret:

```js
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
const rec = new Rec();
rec.lang = "ko-KR";          // toggle to "en-US" as needed
rec.interimResults = true;
rec.continuous = false;

rec.onresult = (e) => {
  const text = Array.from(e.results).map(r => r[0].transcript).join("");
  inputBox.value = text;     // inject into existing text input
};
rec.onerror = (e) => console.warn("STT error:", e.error);
micButton.onclick = () => rec.start();
```

If `Rec` is undefined, hide the mic button (Firefox fallback).

## Verdict: Skip by Default

- **Not in scoring.** Core is Copilot SDK depth + Azure model. STT contributes 0 to rubric.
- **Azure Speech is misallocated Azure spend.** Only adds resource+key proxy overhead, unrelated to
  "Azure model usage" score (LLM integration).
- **4 hours + non-core feature = cut.** Mic permissions, browser quirks, and error states just eat time.

**Only if time genuinely remains**: the Web Speech API snippet above (~10 min, frontend only, no secret).
**Never** wire Azure Speech under this time pressure.

Verdict: default = skip. Stretch goal (after end-to-end + SDK/Azure depth secured) = Web Speech API, nothing more.
