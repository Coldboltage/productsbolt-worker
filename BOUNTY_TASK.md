# Bounty Fix

**Reward:** $109.99
**Issue:** https://github.com/Coldboltage/productsbolt-worker/issues/20
**Repo:** https://github.com/Coldboltage/productsbolt-worker

---

## Issue

[CB-015] Stored outbound price disagrees with the shop's own live price

# CB-015 - Stored outbound price disagrees with the shop's own live price

| | |
|---|---|
| **Repo** | `Coldboltage/productsbolt-worker` |
| **Defect ID** | CB-015 - register `/root/.hermes/cardsbolt/backlog.md` |
| **Severity** | S2 |
| **Scope** | prod (cardsbolt.com) |
| **Seen** | 2 audit runs - first 19 Nov 26 - last 20 Nov 26 |
| **Register status** | confirmed |
| **Labels** | `s2` `scope/prod` `area/data` `source/site-audit` |
| **Evidence** | `/root/.hermes/cardsbolt/runs/2026-11-20/outbound.json`, `runs/2026-11-20.json` (per-run raw output) |

## What is wrong

The price Cardsbolt stores for an outbound offer does not match the price the shop is publishing.

20 Nov: 47 listings were fetched from the shops' own product pages; 36 returned a usable price and 21
were comparable in the same currency. **8 of those 20 (one sample excluded as an invalid URL)
disagreed with the stored value:**

| shop | product | stored | live | delta |
|---|---|---|---|---|
| Gathering Games | teenage-mutant-ninja-turtles-collector-booster-box | £339.99 | £299.99 | −40.00 |
| Double Sleeved | chaos-rising-booster-box | £169.95 | £189.95 | +20.00 |
| Axion Now | aetherdrift-play-booster-box | £89.95 | £99.95 | +10.00 |
| Collector Store | aetherdrift-play-booster-box | $109.99 | $119.99 | +10.00 |
| Collector Store | bloomburrow-play-booster-box | $199.99 | $209.99 | +10.00 |
| Dice and Dumplings | marvel-super-heroes-collector-booster-box | £369.95 | £379.95 | +10.00 |
| Dice and Dumplings | avatar-the-last-airbender-play-booster-box | £132.95 | £140.00 | +7.05 |
| Eterna Cards | marvel-super-heroes-play-booster-box | £129.95 | £129.99 | +0.04 |

Six of the eight are the shop's live price *higher* than the stored one, five of those by exactly
£10/$10 — worth checking whether a systematic re-crawl lag or a fee explains the cluster before
treating each as independent. Double Sleeved chaos-rising (`£169.95` stored vs `£189.95` live, stated
in three places on the shop page) is an exact repeat of the 19 Nov sighting.

The live figures come from the shop's own `og:price:amount` plus JSON-LD `priceCurrency`; the stored
figures come from the Cardsbolt product page's `__NEXT_DATA__` at
`props.pageProps.products.webPages[].price`. Cardsbolt's own FAQ states prices are "checked
periodically throughout the day" and "refresh automatically".

## Where

File not identified. The audit is read-only and cannot see the source tree, so the file must be
located before the fix starts. The stored value is the listing row served by the API; the value
originates in the price/stock ingestion pipeline.

Owning repo: `Coldboltage/productsbolt-worker`.

## Evidence

Read-only daily site audit, reproduced over 2 run(s) between 19 Nov 26 and 20 Nov 26.

- Run record: `/root/.hermes/cardsbolt/runs/2026-11-20.json` (`derived.price_drift`).
- Raw shop fetches and extracted fields: `/root/.hermes/cardsbolt/runs/2026-11-20/outbound.json`.
- Saved shop HTML for the hand-verified cases: `runs/2026-11-20/ds_chaos.html`, `runs/2026-11-20/gg.html`.

## Acceptance criterion

For a repeat run of the audit, the number of same-currency comparable listings whose stored price
differs from the shop's live `og:price:amount` by more than 0.02 must be 0. Today it is 8 of 20, and
countable from `runs/<date>.json` → `derived.price_drift`.

## Notes

- The audit proves the symptom, not the cause. `__NEXT_DATA__` carries no timestamp field, so
  *when* the stored value was captured cannot be read from the payload.
- No number in this issue is estimated. If it is not in the run output, it is not here.


---

## Process

### 1. Orient yourself first
Before touching any code:
- Read the README and any relevant docs
- Run: find . -type f | grep -v node_modules | grep -v .git | grep -v dist | head -60
- Grep for the key terms from the issue title to find the relevant files
- Read the files around the bug — understand what's currently happening

### 2. Find and read the tests
- Look for test files near the relevant code (*.test.ts, *.spec.js, __tests__, etc.)
- Read them — they tell you what behavior is expected
- Understand what a passing fix looks like before writing a line

### 3. Implement the fix
- Make the MINIMAL change that fixes the issue — nothing more
- Do not refactor, rename, reorganize, or clean up unrelated code
- Do not add dependencies unless the issue explicitly requires it
- Do not modify config files (package.json, tsconfig.json, etc.) unless that IS the fix
- One logical change, one commit

### 4. Verify
- Run the test suite: check package.json scripts for "test", "lint", "typecheck"
  Common commands: npm test, yarn test, pnpm test, pytest, go test ./..., cargo test
- If TypeScript is present: npx tsc --noEmit
- Fix any test failures your change caused — if a test was wrong before, update it

### 5. Commit and document
- git add -A
- git commit -m "fix: [CB-015] Stored outbound price disagrees with the shop's own live price"
- Write AGENT_SUMMARY.md with:
  - Root cause: what was wrong and why
  - Fix: what you changed and the reasoning
  - Verification: how to confirm it works
  - Concerns: anything a reviewer should know

---

## Stop conditions

If ANY of these are true, write "UNCERTAIN: [reason]" at the top of AGENT_SUMMARY.md, make NO code changes, and stop:
- The fix requires changing more than ~5 files
- You cannot determine what the correct behavior should be
- The issue requires a database migration, API key, or external service
- You find 3+ open PRs already attempting this fix (high competition)
- The repo is not in a language/framework you can reason about confidently

A clean UNCERTAIN is better than a bad PR.
