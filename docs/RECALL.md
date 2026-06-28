# RECALL — Competition Retrospective

## Code Without Barrier — How Far the Barrier Has Fallen

The competition theme was "Code Without Barrier." And to demonstrate just how far that barrier has fallen, participants were required to code **without a keyboard** entirely. No typing, no mouse, no trackpad. Only the first hour before start and the last 30 minutes were designated "keyboard time." Everything else was done through voice chat with GitHub Copilot.

A line from the opening keynote by MS Solutions Engineer Heejin Lee stayed with me throughout the competition:

> **"Voice coding prohibits typing — it does not prohibit engineering."**

Tools have become dramatically easier to use, but designing the constraints, verification steps, and feedback loops that produce good software only becomes more important. Working through half a day of focused coding without a keyboard and without human intervention actually made it clearer where human intervention is necessary.

## Tteoolim — An Inbox to Catch a Flood of Ideas

I built an app called "Tteoolim" (lit. "to recall / to surface"). It was a mobile version of something I had been running locally with a local agent and Telegram.

The explosion of information and output from AI assistants has not changed the limit on what the human brain can process at once.

Tteoolim bridges that gap. When an idea surfaces, you drop it into the app. The AI judges whether it can be started right now; information-lacking items are sent to a backlog. On a day when you have enough slack, it surfaces a pre-researched context and proposed next action for one item. The concept: never lose a surfacing idea, but stay focused on what matters now.

| Layer | Technology | Notes |
| --- | --- | --- |
| **Frontend** | React 19 + Vite 6 + Tailwind 4 (TS) | |
| **Backend** | FastAPI + Pydantic 2 + SSE | Pydantic for output schema definition. |
| **AI** | Copilot SDK + openai (Azure) | Azure AI Foundry model serving, connected via BaseURL. |
| **Data** | SQLite + Azure Files volume | Volume mount for persistence across restarts. |
| **Deploy** | Azure Container Apps | AI recommended App Service; switched to Container Apps after repeated failures. |

* Good choices
  * **Defining the spec first with openapi.json and validating with Spectral CLI:** Frontend and backend were implemented independently against that spec. With the interface fixed, parallel work fit together without conflict.
  * **Testing with Playwright and Chrome DevTools:** Maintained reliable verification even in the voice-coding environment.

* Regretted choices
  * **Not preparing an Azure deployment skeleton in advance:** Setting up `Container Apps + ACR + Azure Files volume` from scratch during the competition cost a lot of time. Having a working deployment skeleton prepared ahead of time was the right move.
  * **Skipping intermediate checks in AI auto mode:** Handing off long tasks and only reviewing the result meant a direction check midway could have caught scope problems earlier.

https://github.com/tae0y/lipcoding-tae0y
https://github.com/lipcoding-kr/lipcoding-competition-2026
https://lipcoding.kr/

## The Remarkable Progress of GitHub Copilot and the Copilot SDK

What surprised me first was how much Copilot itself had changed. It was quite different from when I used chatmode and prompts. The sub-agent orchestration was powerful, and you can view multiple chat sessions side by side in VS Code. Skills, hooks, instructions, and prompts — familiar features felt newly relevant.

The advantage of the Copilot SDK is that you can bring these features directly into your own app. I wired it into Tteoolim's auto pre-research feature: session + tool calls + SSE streaming in one flow. In the actual implementation, the model calls two tools in order: `web_search` to gather material, then `collect_materials` to store the result.

Looking back at the code after the competition, I felt a gap between what I thought I had built and what was actually there. I thought I had used "agent orchestration properly" — but not really. The actual structure was closer to calling two tools sequentially in a single session. The tools were not performing external searches but receiving and writing model output, and the research and suggestion tasks were single calls with tool wrappers, without a verification loop.

The original intent was different: use Copilot's sub-agent orchestration for a real multi-turn loop where a web search agent actually queries external sources and passes results to the next turn. But without sufficiently detailed requirements, the implementation collapsed to the simplest possible form. The SDK supporting agentic features and whether I actually used them to that depth are completely different questions.

## Speech-to-Text: "Commit" Becomes "Computer"

The first barrier in voice coding was Korean speech recognition.

GitHub Copilot provides voice chat — installing the Korean language pack and adding `"accessibility.voice.speechLanguage": "ko-KR"` to `settings.json` enables it. However, the recognition accuracy was not good enough for live vibe-coding, so I looked for an alternative.

I found this problem during pre-competition setup. Instead of a paid option, I installed the free **VoiceInk** and downloaded the `large-v3-turbo` model. The app shortcut setup was done after keyboard time had ended, so I asked Copilot to replace macOS system dictation with VoiceInk.

Programming terminology was still a challenge. "Commit" would be transcribed as "computer" or "community" — English technical terms pronounced in Korean are a weak point for STT. So I added a voice-input section to `AGENTS.md`: proceed by inferring context even with transcription errors, handle reversible steps without confirmation, and only stop for genuinely destructive or ambiguous decisions. When the AI knows input is coming through voice, it interprets mis-transcribed words appropriately.

```markdown
## Voice-dictated instructions

My instructions reach you through a microphone (speech-to-text), so the transcript may contain
errors, missing words, or odd phrasing.

- Infer my intent from context and proceed — don't stall on small transcription glitches.
- Don't ask for confirmation on routine, reversible steps; just do them.
- Only stop to confirm when something is genuinely necessary and ambiguous — e.g. a destructive
  or hard-to-reverse action, or a decision that materially shapes the app.
- If a specific word or term is unclear or seems mis-transcribed, ask what I meant rather than guessing.
```

Something unusual also happened in the competition venue. The Microsoft Gwanghwamun building network may have been routing through a Japanese VPN, because Copilot responses came out as a mix of Japanese, English, and Korean. I initially suspected a model issue, but the network routing was the cause.

## "Just Handle Everything" Doesn't Work

A number from the keynote stuck with me. Even at 99% accuracy per step, 50 steps yields only a 50% result. Because the space AI can travel is so wide, you need deterministic pass criteria (specifications) first to guide it in the right direction.

This played out directly in practice. Work could only proceed when clear specs — PRD, user stories, openapi.json, test case scenarios — were sitting in front. Without specs, handing over a "just do it well" prompt produces plausible but inconsistent results every time. The winning teams shared the same pattern: make the judging criteria a golden rule, embed it in prompts, run a local Judge agent per criterion to evaluate before submission. Fix the pass criteria outside the code first.

I learned this lesson in reverse under time pressure. Giving the scoring feedback and saying "do what's possible in the remaining 17 minutes" — the AI couldn't pick the lowest-cost, highest-visibility item (a prompt-injection guard, a few lines) first. It focused on the "core PRD flow," a heavier task. I should have been explicit: "sort by (cost in minutes) × impact and do only the top-N." Vague delegation leaves the AI unable to determine the right priority order.

## AI Can Only Take You Where You've Already Been

AI brings us back to places we have already reached. The flip side: paths we have never walked are significantly slower even with AI.

This repeated at multiple levels throughout the competition.

Preparation came first. Before the competition I defined openapi.json, validated the spec with Spectral CLI, then implemented frontend and backend in parallel against that spec, each with independent tests then integration tests. I wrote detailed requirements in the PRD phase, set up MCP servers (MS Learn, Context7, Tavily) beforehand, cloned the awesome-github-copilot repo and extracted skill files for frontend/backend/cloud deployment, ran pre-research per tech stack and built context documents. I even prepared a shell script that checked the current time and had Copilot guide time allocation planning during competition hours. With all this preparation in place, a single voice command pointed things in the right direction quickly.

Deployment was the same. AI recommended App Service, but after repeated failures I returned to the Container Apps I had originally planned. When remote builds were slow, I switched to local build then ACR push. FastAPI serving the built SPA from the same origin eliminated CORS; SQLite mounted on Azure Files for persistence. These decisions were not AI suggestions — they were choices I already knew. To use AI well, you need to have walked that path before, or have the tools set up in advance.

## Security Was an Afterthought

AI did really well on everything else, but at the end, the scoring agent flagged a lot on security. Responsible AI, Security & Trust was the only criterion to score 3 out of 7.

The critique was sharp. The publicly deployed app had no auth/authorization separation — anyone could call the idea read/delete APIs. Key Vault and managed identity were absent. Even prompt injection defense was implicit rather than explicit, relying on tool schema. And destructive operations like deletion had no confirmation step.

What hurt more was the priority failure. Prompt injection defense was a low-cost, high-visibility task — a guard sentence or two in the system prompt plus input delimiters, minutes of work. I even had related material prepared. But when rushing to fix things after feedback, I missed the easy win. I told AI "do what's possible," and again it grabbed the heaviest-looking task rather than the most efficient few lines.

Thinking about it, security is not something AI handles automatically. Features have a clear signal — "it works" — so AI implements them well. Security, if not explicitly required, passes through empty. Auth, key management, delete confirmation — these need to be on a conscious checklist.

## The Easier Implementation Gets, the Heavier Planning Becomes

One final reflection on product thinking. I spent 50% of the equivalent of a month's GitHub Copilot MAX subscription credit in this one day. With all that AI resource, I produced a working app — but if someone asked "what's the ROI of this app, what's the lock-in factor," I had no answer.

The judging feedback pointed to the same thing: the product flow is persuasive, but without quantitative evidence — saved time, reduced steps, error prevention rate — the productivity impact is not sufficiently proven. The weekly recommendation was also a manual endpoint and simple priority rather than a real scheduler or embedding ranking.

More fundamentally, the original intent quietly shrank during implementation without me noticing. Tteoolim's starting point was "provide options, not decisions, to preserve human capability." But what ended up built narrowed to "accept or reject an AI suggestion." The value of presenting options contracted into an accept/reject button — and I didn't notice while building it. Where the same bias showed up in "priority," here it showed up in "product ambition." If people don't hold the criteria clearly, AI always fills the delegation gap with the simplest possible interpretation.

Building (implementation) has genuinely become easy. Even with only voice chat, a working app comes out. That is precisely why the sharpness of "what, and why" — the planning question — becomes the differentiator. "The most important thing humans do is problem definition — prioritization, risk judgment, final accountability." The more implementation becomes a click, the more it all comes down to how you define the problem.

## Closing

Taking my hands off the keyboard and handing everything to AI made it clearer, not murkier, where human involvement is necessary. I prepared ideas into requirements upfront, had tools ready, prepared specs, and tried to build "deterministic pass criteria" — but when transitioning from ideas to requirements, and from requirements to specs, there was so much I missed. And the domain of "security" I never even thought about in the first place.

I have heard a lot of retrospectives saying the AI era is about 1→10, not 0→1, and I felt the same. AI does better than me at things I have already experienced. AI's pace of development is breathtaking, but what a junior developer needs to do seems unchanged. Keep broadening perspective and building experience steadily.
