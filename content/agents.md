## Agents

LIGO agents will run through the same harness as HEP-Ex-Bench.

- **Coding tools:**
  - Claude Code, Codex and opencode each have a run script, and each runs with the operator's own login;
  - the run record also recognizes Vibe.
- **Models:** the model and its reasoning effort are set for each session.
- **Prompts:** the LIGO prompts are not written yet.
- **The session:**
  - It runs in a sandbox (bubblewrap) with its own empty home folder and caches, and with the evaluator's files hidden.
  - It has a time budget, 2 hours by default in the harness, and is stopped when the budget runs out.
  - An interrupted session can resume with the time it has left.
- **The frozen search** runs in a sandbox with the network blocked and the sealed answer key not mounted.

### What is recorded for each session

| Field | Content |
|---|---|
| Harness, model, effort | As requested for the session. |
| Prompt, bundle, suite | The prompt given, the participant bundle, and the sealed suite the search is evaluated on. |
| Budget | The session's whole time budget, in seconds. |
| Segments | For each stretch of work: start and end times, its budget, and its exit code (124 means stopped at the budget). |
| Harness version | The version of the coding tool. |
| As run | What the coding tool itself reports ran: the model, its version and the session id. |
| Refusal | Why a session was refused before it started, for example a login that would expire before the budget ends. |

- Wall time is the sum of the segments' durations, with gaps between them not counted.
- Tokens and cost are not recorded.
