# Next-Agent Cold-Start, CI Triage & Second Brain (LifeOS v4.1) Runbook

> **Audience:** Any AI coding or auditing agent starting a session on
> `TAHIRSIDDIKI98/fp-A-betterversion`. Read `AGENTS.md` first; this runbook
> compresses the environment traps, dual-governance rules, open branch/CI context,
> and Notion Second Brain (`LifeOS` v4.1) pointers so you reach productive,
> evidence-backed work in under 60 seconds.

Last verified: **2026-11-15** (`DEC-106`, branched from `main` `a9a3c9fc98a649ebcab9ae94589658445bebf394`).

---

## 1. 60-Second Cold-Start Bootstrap

Run this exact sequence before reading code or running gates:

```bash
# 1. Zero-egress readiness, shallow-clone & governance check (<1s)
npm run agent:preflight

# 2. If root or server node_modules are missing:
npm ci --ignore-scripts
cd server && npm ci --ignore-scripts && cd ..

# 3. If running in a shallow clone (--depth=1) where c9b84116ad40 is missing:
git fetch origin c9b84116ad408b2d574e952cd953c67b92edcbab

# 4. Fast baseline verification (~2.5 min total)
npm run tsc && npm run lint && npm run docs:verify && npm run docs:links && npm run type-safety:ratchet && npm run license:check
```

### Mandatory Sandbox & Runtime Traps

1. **Plain browsers intentionally render `UnsupportedRuntimeScreen`.** The client
   checks `window.__TAURI_INTERNALS__` (`src/utils/tauriRuntime.ts`). Do **not**
   report a blank/unsupported browser preview as a regression; Playwright shims
   Tauri for web-tier smoke tests (`DEC-101`, `DEC-102`, `DEC-103`).
2. **Never run bare `npx tsc` without `node_modules`.** Without local packages,
   `npx tsc` downloads an unrelated npm package named `tsc`. Always use
   `npm run tsc`.
3. **Never modify `.github/workflows/**` directly.** GitHub App pushes that touch
   workflow YAML are rejected (`workflows` permission). Deliver CI changes as
   unified diffs in `ci-patches/` and list them in `ci-patches/README.md`.
4. **Never switch, rename, or create git branches** in Arena sessions. Commit and
   push only to the active session branch.
5. **Re-measure before quoting numbers.** `README.md`,
   `docs/CAPABILITY_TRUTH_MATRIX.md`, `docs/product/ROUTE_MAP.md`,
   `docs/plan/COMPLETION_REGISTER.md`, and `docs/agent/skills/README.md` are
   governed by scripts (`npm run docs:verify`, `npm run skills:verify`).

---

## 2. Dual-Governance Posture (`STATE.json` vs `DEC-105` / `DEC-106`)

Two live governance artefacts coexist in the repository:

1. **Forensic Docs-First Gate (`docs/_agent/STATE.json` + `docs/_agent/MISSION_CONTRACT.md`):**
   - `current_stage`: `STAGE_1_FORENSIC_AUDIT`, `docs_gate_passed: false`,
     `human_approved_for_coding: false`.
   - `docs/_agent/LIVE_DOCS_REVIEW.csv` tracks per-file review status across all
     live docs (`PARTIAL` / `PENDING` / `HISTORICAL-NOTE`, plus `C`-grade
     contradictions).
   - **Rule:** Do **not** flip `docs_gate_passed: true` until Stage 1–5 exit
     criteria are genuinely met, and do **not** start unprompted broad feature
     coding when running a docs-audit pass.
2. **Owner-Authorized Scoped Execution (`DEC-105` & `DEC-106` in `docs/discovery/decision-log.md`):**
   - `DEC-105` (2026-11-10): Owner approved (`"GO"`) executing the phased master
     plan in dependency order (`docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`),
     starting with Phase 1 import-path convergence (`Q7` in
     `docs/agent/WORKING_AGREEMENT.md`).
   - `DEC-106` (2026-11-15): Owner explicitly authorized standalone gate
     remediation (`type-safety:ratchet` 54→48, `license:check` 40→0),
     `npm run agent:preflight`, `ci-patches/0010-fix-docs-depth-shard-thresholds-and-ratchets.patch`,
     and upgrading/syncing the Notion Second Brain (`LifeOS` v4.1).
   - **Rule:** Every code/script change must ship with a failing-first test
     (`AGENTS.md` §2 Rule 2), preserve all ratchets without markers/stubs
     (`AGENTS.md` §2 Rules 10, 13, 14), and update any affected baseline/doc
     truth check in the same commit.

---

## 3. Live Gate, CI & Open-Branch Triage Map

### Standalone Local Gates (Fixed in `DEC-106`)

- `npm run type-safety:ratchet` — **GREEN** (`48` escapes vs `48` baseline; `0`
  `as any`, `48` `as unknown as`), guarded by
  `src/__tests__/typeSafetyRatchetScript.test.ts`.
- `npm run license:check` — **GREEN** (`39` installed prod dependencies verified
  via `npm ls --omit=dev --json --long --all`; `1` uninstalled optional peer
  `@huggingface/transformers` skipped safely while failing closed on any
  unlicensed or non-optional `{}`), guarded by
  `src/__tests__/licenseCheckScript.test.ts`.
- All truth & ratchet gates (`docs:verify`, `docs:links`, `skills:verify`,
  `engines:verify`, `money:ast`, `money:adoption`, `determinism:ratchet`,
  `palette:ratchet`, `fabrication:audit`, `placeholder:audit`, `mock-data:audit`,
  `escape:ledger`, `routemap:check`, `repo:hygiene`) — **GREEN**.

### GitHub Actions `ci.yml` Failure Root Causes & Human-Apply Patches

1. **`docs` job shallow checkout (`fetch-depth: 1`):** Missing historical commit
   `c9b84116ad408b2d574e952cd953c67b92edcbab` fails `completion-register.mjs --check`.
   **Fix ready:** `ci-patches/0010-fix-docs-depth-shard-thresholds-and-ratchets.patch`.
2. **`test` matrix per-shard coverage threshold:** Each `1/4` shard executes ~25%
   of tests (~30% coverage) and fails `vitest.config.ts` global 50% thresholds
   before `test-merge` merges all 4 coverage blobs.
   **Fix ready:** `ci-patches/0010-fix-docs-depth-shard-thresholds-and-ratchets.patch`
   (defers threshold enforcement to `test-merge`).
3. **`e2e` job missing timeout & Playwright browser install cost:** Added
   `timeout-minutes: 30` in
   `ci-patches/0010-fix-docs-depth-shard-thresholds-and-ratchets.patch`.
4. **`audit` & `server` prod vulnerability advisories (`npm run audit:prod`):**
   Currently reports high/moderate advisories in root (`zod`,
   `follow-redirects`, transitive packages) and `server/` (`body-parser`, `zod`).
   Requires lockfile upgrade + full regression pass in a dedicated dependency PR.

### Parallel Open PR Awareness

Check `gh pr list --state open` at session start:
- **Draft PR `#96` (`arena/950617a0-fp-a-betterversion`, 2026-11-11):** Contains
  Stage 1 forensic review progress across 54 `docs/` files (`56 → 16 PENDING`)
  and documents four high-value audit contradictions for follow-up:
  - **`AUD-105`:** `scripts/verify-governance-evidence.mjs` still asserts 22 O9
    entity-scope claims in `docs/plan/governance-evidence.json` despite `DEC-103`
    retiring `govern.entity-scope`.
  - **`AUD-106`:** `scripts/escape-ledger.json` carries placeholder commit SHAs
    rather than 40-hex commits.
  - **`AUD-112`:** `docs/architecture/PERSISTENCE_MAP.md` omits raw `localStorage`
    keys `finplan_exception_dispositions` and `finplan:exception-rules`.
  - **`AUD-115`:** `src/components/reports/reportDataBuilder.ts`
    `buildBudgetVsActualRows` sign/disclosure alignment vs `VarianceEngine`.

### Open Owner Decisions (Never Guess — `AGENTS.md` §2 Rule 12)

- **`O1`:** Redacted real D365 F&O / BC exports for gold fixture certification
  (universal template system shipped under `DEC-104`, real vendor sample still
  needed for gold parity).
- **`O5`:** Sector/jurisdiction support tiers (blocks promoting vertical/ESG
  EXPERIMENTAL routes).
- **`O7` / `DEC-005`:** Relational SQLite cutover for high-volume GL tables &
  native Tauri desktop durability benchmark.
- **`Q6`:** Client local RBAC (`302` actions) vs `server/` RBAC (`107` actions)
  authority boundary.
- **`Q7`:** Phase 1 convergence of the 3 import mapping template stores
  (`ImportWizard`, `MigrationEngine`, `universalImportTemplate`).
- **`Q8`:** Vitest shard `7/8` 1,800s timeout investigation under Node 22 sharded
  runs.
- **`R1–R12`:** Detailed product/connector choices listed in
  `docs/discovery/MASTER_PRODUCT_AND_EXECUTION_PLAN.md`.

---

## 4. Notion Second Brain (`LifeOS` v4.1) Connector Reference

When the `notion` connector is enabled, **repository files and script outputs are
always primary truth** (`docs/agent/skills/connector-driven-documentation.md`).
Never cite Notion over git; sync Notion *from* measured repo outputs and stamp
the exact commit SHA and verification command.

### Critical Notion API Rules

1. **Always pass `page_size: 10` (or smaller) and `filter_properties`** on
   `query_database` and `search`. Larger payloads trigger middle-omission
   truncation and cannot be parsed as JSON.
2. **Always call `get_data_source` before `create_page` or schema-dependent
   `query_database`**, and pass `parent: { type: "data_source_id", data_source_id: "<id>" }`
   (Notion API `2025-09-03` multi-source model).
3. **Protected Vault Invariants:** Never edit `📌 AI Brief`
   (`4111d643-919f-812e-8dc2-fd42b162ffd0`) or `Areas`; never fabricate
   `Journal` mood; never set human-only statuses (`Evergreen` on Knowledge Base,
   `Trusted` on Playbook, `Verdict` on AI Sessions).

### Canonical Notion UUID Directory (`Second Brain — AI-Native` v4.1)

| Surface / Database | Page or Database ID | `data_source_id` (use for queries/creates) | Role for Next Agent |
| --- | --- | --- | --- |
| **Root Hub (`Second Brain — AI-Native`)** | `4111d643-919f-818b-8be7-d25501022e42` | — | Top-level LifeOS / Second Brain v4.1 hub |
| **FinPlan Pro Command Center** | `4191d643-919f-81da-ad36-f8f7028f0fe2` | — | Executive dashboard, bootstrap & scorecard |
| **Live Context Pack (`📦 Packs`)** | `4191d643-919f-81ef-abf0-e77b1bd3be16` | `cb91e277-ebc5-416d-866b-65c7368900ab` | **Read first in Notion:** ~3k-token working context |
| **FinPlan Pro Project (`🎯 Projects`)** | `4191d643-919f-817f-a7cb-df4953f68f11` | `87b36974-1530-456b-a33c-a8bd62dd6ffd` | Filter key (`Project` relation) across v4.1 DBs |
| **`🚦 Repo Gates & Agent Handoffs` (v4.1)** | `4191d643-919f-81fc-a631-f8ecc8149727` | `4191d643-919f-810a-867d-000b6a622c05` | Live gates, CI patches, PR handoffs & blockers |
| **`🧩 Claims`** | `ee8d8876-bd79-4732-b6a0-3c06e3d7b7c4` | `045f4a33-d8d9-4767-8011-36af0996a8a1` | Atomic verified repo facts (`Commit SHA` + `Verify Command`) |
| **`🗂️ Knowledge Base`** | `b0fdf7a3-15c1-4d8d-bb97-e29e20fcf395` | `694b8708-2b00-4f09-be3b-698fdd581ea6` | `KB-1..KB-6` architecture/domain/gate syntheses + trap note |
| **`🗝️ Index`** | `e2fafc4e-e6f2-45ca-8dd3-26ad94a2df0d` | `ac3cd1da-0ea1-4a21-aa50-3bda709674a4` | Term/alias router into `Knowledge Base` |
| **`✅ Tasks`** | `3c6f6022-c893-4b46-aadf-0c1cdab9c463` | `90f58d31-8174-44c0-9933-e19533c7fac5` | Actionable engineering & owner-blocked queue |
| **`🧾 Decisions`** | `a44969b1-5415-4fe3-98c3-bd450ff1712d` | `3a8df14d-188c-4504-8934-9def137dbf45` | Mirrored `DEC-*` records (`DEC ID` + `Project`) |
| **`🌿 Playbook`** | `26704c23-1f44-4339-91d3-6fd7e4a8d77a` | `15d76113-b47e-49c3-b80d-ebd637ec9308` | Reusable agent SOPs (`Draft` until owner marks `Trusted`) |
| **`👁️ Watchers`** | `57ecfe6b-5a32-4409-9f13-8ee35805c6e7` | `a3e2df6d-8e32-4167-b9ec-1a3b8ae6a627` | Drift & staleness monitors (`W1..W12`) |
| **`🎯 Golden Questions`** | `bf871b3e-a750-4a96-bfba-d4d67e8e01d1` | `e656ba29-e14b-4df9-83f6-da0310aae0c9` | Regression QA suite (`Must cite` + `Must not cite`) |
| **`🧪 Eval Runs`** | `8a93a27c-2b0d-4f21-9e45-1d827cb08c6a` | `ba71747a-24fc-489a-b166-a34df9d1cebe` | Dated benchmark scores over `Golden Questions` |
| **`🤖 AI Sessions`** | `a7691e82-410a-4765-8f80-9da1227ddf51` | `17afd987-b2ca-42f7-9392-a772b4786efa` | Append-only episodic session log (`Verdict` owner-only) |
| **`📚 Sources`** | `b7e5955e-cbc7-4514-b853-973cffe90169` | `b601dbcf-7ba8-4deb-a613-4b3b9473994c` | Primary repository & audit snapshot anchors |
