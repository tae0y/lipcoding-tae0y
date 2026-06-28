# Competition Submission: Unpushed Commit Hash Marked Invalid (2026-06-20)

Recording how submitting a commit hash that existed **only locally (not yet pushed to the
public remote)** caused it to be rejected as invalid by the verification system, wasting a
precious submission attempt.

## Symptom

- The commit hash the AI provided was correct (matched local `git rev-parse HEAD`).
- Submitting that hash was rejected by the scoring/verification system as **invalid (commit does not exist)**.

## Cause

- The commit was **present locally but had not yet been pushed to the public remote (GitHub)**.
- The scoring system looks up the hash in the public remote repository — a commit that exists
  only locally appears as "non-existent" and is rejected as invalid.
- The AI reported the hash honestly based on local state; the gap between local and remote
  was the person's check to make, not the AI's.

## Fix / What to Do Next Time

Pre-submission checklist (must follow in order):

1. `git push` (or `git push origin <branch>`) — push to remote first.
2. Confirm push succeeded: check `git status` shows `Your branch is up to date with 'origin/...'`.
3. **Verify the hash actually exists on the remote**:
   - `git ls-remote origin | grep <hash>`, or
   - `git branch -r --contains <hash>` returns a result.
   - When possible, verify directly on GitHub: `https://github.com/<owner>/<repo>/commit/<hash>` opens with 200.
4. Only then enter the hash in the submission form.

## Notes

- "The hash is correct" ≠ "it's on the remote." Submission verification is **based on the public remote**.
- A hash the AI provides is the local HEAD — always **personally verify push status and remote
  existence** before submitting.
- In a timed competition, a single mistake like this directly means lost opportunity. Make push→verify
  a muscle memory habit before submission.
