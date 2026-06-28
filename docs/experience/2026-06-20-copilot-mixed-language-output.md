# GitHub Copilot Output Mixed Japanese and English (2026-06-20)

GitHub Copilot responses came out as **a mix of Japanese and English** instead of Korean.
This note records the cause.

## Symptom

- Copilot responses returned Japanese and English mixed in, even when prompted in Korean.

## Cause

- The MS (GitHub Copilot backend) network was routing through a **Japanese VPN**.
  - The exit IP resolved to Japan, which skewed the response language toward Japanese,
    producing a Japanese/English mix.

## Note

- When output language looks wrong, do not immediately assume a model issue —
  check the **network routing path** first. VPN/proxy exit node location can affect
  the language model's locale behavior.
