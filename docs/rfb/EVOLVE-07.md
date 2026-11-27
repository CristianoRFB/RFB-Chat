# EVOLVE 07 — preparation only (27/11/2026 UTC)
Baseline `119f2df4d9c730d208a5a66c32d66872918c2840`: all five pipelines PASS, including 45931059985 (general), 45931059983 (total QA), 45931059980 (performance), 45931060072 (visual), 45931059934 (infra). No new source regression observed. Draft PR #1, main untouched.
Latest paired 5 samples: before [148,159,152,205,171] median 159; after [164,133,166,164,184] median 164. Old timing includes Playwright auto-waits and sender input cleared check; not a direct network latency measure. SDK repeat 100/100 delivered, no stored duplicates, P95 79.64/171.65 ms (2/8 clients).
S034 hypothesis: order, actionability and assertion polling confound small samples; preserve app code; balanced ABBA blocks, 25 samples/block + 3 warmups excluded, DOM arrival measured by MutationObserver and native click event; same runner, fresh local emulators and no external endpoints. Measure old driver duration too; no arbitrary latency SLO. Sustained workload 8 clients × 60 messages at 1s between consecutive sends; compare error/persistence and observed percentiles. Results pending CI.
No publish, merge, billing, real Firebase initialization, worker creation, real customer data or secrets authorized.

## S036 — canonical DM integrity
Static review found the client sorts the two UIDs but the Rules only rejected equal IDs. Hypothesis: reversed pair permits duplicate conversation. Candidate enforces lexicographic ascending order on new DM creation; no existing reads/writes deleted or migrated. Standalone emulator replay tests baseline allowing reversed pair, candidate denying it, both canonical create and member read, outsider denial and legacy member read. Evidence pending runner. Default Firebase UIDs are used in current lab; custom UID delimiter/ordering contract requires separate review if introduced. Source: https://firebase.google.com/docs/reference/rules/rules.String.html .

## Verified results
S034 `67df48c2`: all five workflows PASS (45932655688/45932655691/45932655681/45932655760/45932655779). S035 `4368f712`: all six workflows PASS (45932789870/45932789956/45932789844/45932790090/45932789882/45932790030). Two ABBA benchmark runs, 50 measurements per variant per run, three warmups excluded per block. Nearest rank percentiles:

| Run | DOM P50 before/after | DOM P95 before/after | driver P50 before/after | driver P95 before/after |
|---|---|---|---|---|
| 45932655779 | 94 / 108 | 145 / 143 | 218 / 283 | 340 / 345 |
| 45932789882 | 102 / 107 | 145 / 141 | 238 / 242 | 328 / 329 |

All ms. Browser clock origins on same runner, DOM mutation not painted frame, no production RTT. Driver includes actionability, assertion polling and sender input reset. Median DOM difference +14 and +5 ms; tails slightly lower; 9→2 logical listeners closed preserved. Keep optimization; no claim of causal improvement or SLO. Repeat on real staging before launch. 200 total measured browser observations across the two runs.

Sustained run 45932655760: 480/480 messages, 8 clients, 60711 ms, 7.91 msg/s, P50 19.82 ms, P95 34.85 ms, max 93.54 ms, no missing or duplicate stored documents. Burst 80/80, P50 67.49 P95 127.72 max 146.03 ms. Five negative cases and report race pass in each run. This closes the bounded one-minute local workload only; no capacity/production claim.

S035 release safety tests: PASS step in 45932789870 (8 Node tests, including repository manifest blocked). Read-only structural check, not deployment or authorization. Dependency probe 45932790030: compatible npm audit fix --package-lock-only --ignore-scripts left 14 moderate, 0 high/critical, exit 1 before/after; no compatible improvement in this attempt, no lockfile adopted, #6 stays open. Runtime audit previous gate remains PASS.

S036 `44aea22c6ed07d6a6fd0781da10804ee72c17173`: baseline/candidate canonical DM replay step PASS (45932967467, job 140289583352); test asserts reversed create allowed on old Rules, denied on candidate, canonical create and member read pass, outsider denied, old reversed doc remains readable. 32 Rules suite step PASS, typecheck/unit/build/release gate PASS. General E2E status completed/success. Candidate complete workflows 5/6; do not inherit earlier PASS if pending. No migration or deletion. #5 partial hardening only.

Cloudflare read-only inventory: one authorized account, 77 Workers returned, no name matching RFB Chat. No resource changed. Firebase real project and plan unknown. Production guard remains unchanged. R$0 recurring additional contracted, CI resource use is not production capacity. Issues #3–#6 remain open; no approval for staging, merge or deploy. Full WCAG assistive technology, independent security/LGPD, real push/media, physical retention/backup and quota enforcement remain outstanding. Group-specific screenshot coverage and broader device tests pending. No deployment or release tag. [Runbook](PRODUCTION-RUNBOOK.md), [manifest](RELEASE-MANIFEST.json), [raw](benchmarks/EVOLVE-07.json).
