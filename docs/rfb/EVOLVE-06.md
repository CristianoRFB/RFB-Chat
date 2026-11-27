# EVOLVE 06 — Total QA (26/11/2026, BRT)

## Evidence and scope
Candidate `3142ef40c4fa9e4409d90e8d7bc538a204653f00`; GitHub PR #1 draft, tested merge ref `08e85ca3cc92505c071c71ad1598151910ad0ed4` (main unchanged). Canonical method main `5f73ee2b48507234431706e4c6313773bae72a5a`. Baseline a8c3d67 passed all 4 pipelines (45915593833, 45915593836, 45915593811, 45915593860). S033 adds actual isolated SDK load, adversarial concurrency, both-theme contrast/reflow and admin captures. No app behavior changed: no executed scenario failed. No fabricated fixes. Review from one agent, not independent audit.

| Pipeline | Evidence | Result |
|---|---|---|
| General regression | [45930727446](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45930727446) | PASS: npm ci, typecheck, build, 13 unit, 31 Rules, 15 E2E; 1 benchmark intentionally skipped here, executed separately |
| Total QA | [45930727651](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45930727651) | PASS: load/security, accessibility/visual, audit |
| Visual | [45930727489](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45930727489) | PASS |
| Infrastructure | [45930727501](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45930727501) | PASS: public guard, isolated synthetic backup/restore |
| Paired performance | [45930727464](https://github.com/CristianoRFB/RFB-Chat/actions/runs/45930727464) | PASS |

## Load and concurrency
| Metric | 2 clients/1 DM | 8 clients/4 DMs |
|---|---:|---:|
| Authenticated messages delivered | 20/20 | 80/80 |
| Duplicates in stored documents | 0 | 0 |
| Errors on positive path | 0 | 0 |
| Duration, ms (includes verification) | 699 | 1247 |
| Observed messages/s | 28.6 | 64.14 |
| P50 ms | 56.62 | 81.72 |
| P95 ms | 75.83 | 141.67 |
| Maximum ms | 86.39 | 234.98 |

Ten synthetic Auth accounts in two phases; 5 simultaneous canonical DM creation races with exactly one create each; each peer got every unique expected document; authoritative reads checked total and unique document IDs. Five negative cases: outsider DM read/list, forged sender, 2001 characters, whitespace. Two competing report batches: exactly one accepted, one permission-denied. SDK send start → peer nonpending server snapshot, nearest-rank quantiles. No production requests, no capacity claim; duration includes server reads. Script only loopback/demo project, bounded 100 messages; no stress/saturation/long-duration test. Raw measurements [EVOLVE-06.json](benchmarks/EVOLVE-06.json), artifact 15168128143.

Paired browser replay: before [129,121,130,147,124] ms (median 129); after [130,146,163,196,181] ms (median 163); 9→2 closed logical listeners, 9→9 opened, 9→2 reclosed; 627846→222892 JS bytes (guard build), gzip 191411→69524. Five samples each; repeated direction of latency increase, not proof of causal regression or production SLO. SDK load not directly comparable to browser delivery timing. Larger randomized A/B and profiling pending.

## Security, accessibility and visual review
- Runtime npm audit: 0 vulnerabilities reported. Full lockfile: 14 moderate, 0 high/critical; high gate passes. npm proposes breaking firebase-tools downgrade 13.11.2; no forced fix, #6 open. Not OWASP certification.
- 8 foreground/background CSS token pairs × 7 viewport widths × 2 themes = 112 checks, all ≥4.5:1; minimum light 5.38:1, dark 5.17:1. 14 viewport/theme horizontal overflow checks; admin mobile 390 separate. Keyboard focus/search/filter Enter; labels, admin control actions and theme persistence tested. Scope does not establish WCAG full compliance, zoom 200%, screen reader, touch target exception review or physical devices.
- Baseline artifact 15162630698 (6 screenshots) downloaded and inspected; candidate artifact 15168522517 (8 screenshots) downloaded and inspected (login, light/dark desktop chat, list/chat mobile, tablet, desktop/mobile admin). No new visual blocking defect observed in those states. Desktop admin is constrained to scrollable 330px sidebar; actions below fold but E2E completes them. Design limitation, not confirmed functional failure. Groups/channels dedicated screenshots, complete VSC across all states, real device/AT review pending. No new screenshots committed as binaries: synthetic IDs visible; artifact links/hashes recorded separately; previous verified gallery retained.
- Method triple verification on same candidate: functional PASS (load/positive E2E), adversarial PASS (negative Rules + race + audit), regression PASS (all pipelines). External independent security/privacy audit NOT_RUN. No source patch without observed defect; no retries or weakened assertions.

## Release boundaries
#3 real FCM; #4 scalable media/physical retention/external WebRTC; #5 antiabuse/LGPD/governance and quota monitoring; #6 moderate dev dependencies remain open. No real Firebase, Cloudflare, billing, merge, deployment or customer data. Additional recurring cost R$0. Total QA laboratory PASS, full release gates OPEN. G5 partially accepted; G6 production BLOCKED pending explicit authorization and remaining evidence. No global completion percentage invented. Next: targeted remaining QA and authorize staging only if prerequisites met.

References: https://firebase.google.com/docs/rules/unit-tests ; https://www.w3.org/TR/WCAG22/ ; https://playwright.dev/docs/accessibility-testing .
