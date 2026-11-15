#!/usr/bin/env node
/**
 * agent:preflight — Zero-egress cold-start readiness & governance dashboard for AI agents.
 *
 * Designed so any agent entering `TAHIRSIDDIKI98/fp-A-betterversion` can verify
 * sandbox readiness, shallow-clone git objects, dual-governance state (`STATE.json`
 * + `DEC-105`), ratchet baselines, and Notion Second Brain v4.1 pointers in <1s
 * with zero network calls (`AGENTS.md` §2 Rule 9).
 *
 * Flags:
 *   --json       Emit machine-readable JSON
 *   --advisory   Exit 0 even when local setup prerequisites (`node_modules` / shallow commit) are missing
 *   --root=PATH  Override repository root (used by unit tests)
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const advisory = args.includes('--advisory');
const rootArg = args.find((a) => a.startsWith('--root='));
const ROOT = rootArg ? rootArg.slice('--root='.length) : process.cwd();

const EVIDENCE_COMMIT = 'c9b84116ad408b2d574e952cd953c67b92edcbab';

function safeJson(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) return null;
  try {
    return JSON.parse(readFileSync(full, 'utf8'));
  } catch {
    return null;
  }
}

function safeGit(gitArgs) {
  try {
    return execFileSync('git', gitArgs, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function hasGitCommit(sha) {
  try {
    execFileSync('git', ['cat-file', '-e', `${sha}^{commit}`], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function parseLiveDocsCsv(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) {
    return { total: 0, pending: 0, partial: 0, reviewed: 0, gradeC: 0 };
  }
  const lines = readFileSync(full, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length <= 1) {
    return { total: 0, pending: 0, partial: 0, reviewed: 0, gradeC: 0 };
  }
  let pending = 0;
  let partial = 0;
  let reviewed = 0;
  let gradeC = 0;
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.includes(',PENDING,')) pending++;
    if (row.includes(',PARTIAL,')) partial++;
    if (row.includes(',REVIEWED,')) reviewed++;
    if (/,C,/.test(row)) gradeC++;
  }
  return {
    total: lines.length - 1,
    pending,
    partial,
    reviewed,
    gradeC,
  };
}

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
const rootNodeModules =
  existsSync(join(ROOT, 'node_modules', 'vitest', 'vitest.mjs')) &&
  existsSync(join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc'));
const serverNodeModules = existsSync(join(ROOT, 'server', 'node_modules'));
const isGitRepo = safeGit(['rev-parse', '--is-inside-work-tree']) === 'true';
const branch = isGitRepo ? safeGit(['rev-parse', '--abbrev-ref', 'HEAD']) : null;
const headSha = isGitRepo ? safeGit(['rev-parse', 'HEAD']) : null;
const shallowEvidenceCommitPresent = isGitRepo ? hasGitCommit(EVIDENCE_COMMIT) : false;

const stateJson = safeJson('docs/_agent/STATE.json');
const csvStats = parseLiveDocsCsv('docs/_agent/LIVE_DOCS_REVIEW.csv');
const typeSafetyBaseline = safeJson('scripts/type-safety-baseline.json');
const moneyAstBaseline = safeJson('scripts/money-ast-baseline.json');
const moneyAdoptionBaseline = safeJson('scripts/money-adoption-baseline.json');
const completionRegister = safeJson('docs/plan/completion-register.json');

const registerRows = completionRegister?.rows ?? completionRegister?.items;
let registerCounts = null;
if (Array.isArray(registerRows)) {
  registerCounts = { SUPPORTED: 0, EXPERIMENTAL: 0, RETIRED: 0, NOT_BUILT: 0, total: 0 };
  for (const item of registerRows) {
    registerCounts.total++;
    if (item.status && item.status in registerCounts) {
      registerCounts[item.status]++;
    }
  }
}

const blockers = [];
const warnings = [];

if (!rootNodeModules) {
  blockers.push(
    'Root node_modules missing -> run: npm ci --ignore-scripts'
  );
}
if (existsSync(join(ROOT, 'server', 'package.json')) && !serverNodeModules) {
  warnings.push(
    'server/node_modules missing -> if touching server/, run: cd server && npm ci --ignore-scripts && cd ..'
  );
}
if (isGitRepo && !shallowEvidenceCommitPresent) {
  blockers.push(
    `Shallow clone missing historical evidence commit ${EVIDENCE_COMMIT.slice(0, 7)} (breaks npm run docs:verify) -> run: git fetch origin ${EVIDENCE_COMMIT}`
  );
}
if (nodeMajor !== 22) {
  warnings.push(
    `Node ${process.version} detected (CI & sharded Vitest baseline target Node 22 LTS; see Q8 in docs/agent/07_WORKFLOW_AND_DOD.md)`
  );
}

const report = {
  nodeVersion: process.version,
  git: {
    isGitRepo,
    branch,
    headSha,
  },
  environment: {
    rootNodeModules,
    serverNodeModules,
    shallowEvidenceCommitPresent,
    requiredEvidenceCommit: EVIDENCE_COMMIT,
  },
  governance: {
    currentStage: stateJson?.current_stage ?? 1,
    docsGatePassed: Boolean(stateJson?.docs_gate_passed),
    humanApprovedForCoding: Boolean(stateJson?.human_approved_for_coding),
    liveDocsTotal: csvStats.total,
    pendingDocsCount: csvStats.pending,
    partialDocsCount: csvStats.partial,
    reviewedDocsCount: csvStats.reviewed,
    gradeCContradictions: csvStats.gradeC,
    dualGovernanceRule:
      'STATE.json locks unprompted src/ edits until Stage 1-5 exit; DEC-105 ("GO") or explicit owner prompt authorizes scoped work packages with failing-first tests.',
  },
  baselines: {
    typeSafetyTotalEscapes:
      typeSafetyBaseline?.totalTypeEscapes ?? typeSafetyBaseline?.total ?? null,
    moneyAstUnsafeSites: moneyAstBaseline?.totalFindings ?? 0,
    moneyAdoptionMinPct: moneyAdoptionBaseline?.minAdoptionPercent ?? null,
    completionRegister: registerCounts,
  },
  notionSecondBrain: {
    version: 'v4.1',
    rootHubPageId: '4111d643-919f-818b-8be7-d25501022e42',
    commandCenterPageId: '4191d643-919f-81da-ad36-f8f7028f0fe2',
    liveContextPackId: '4191d643-919f-81ef-abf0-e77b1bd3be16',
    projectPageId: '4191d643-919f-817f-a7cb-df4953f68f11',
    repoGatesDatabaseId: '4191d643-919f-81fc-a631-f8ecc8149727',
    dataSources: {
      repoGatesAndHandoffs: '4191d643-919f-810a-867d-000b6a622c05',
      packs: 'cb91e277-ebc5-416d-866b-65c7368900ab',
      claims: '045f4a33-d8d9-4767-8011-36af0996a8a1',
      index: 'ac3cd1da-0ea1-4a21-aa50-3bda709674a4',
      knowledgeBase: '694b8708-2b00-4f09-be3b-698fdd581ea6',
      sources: 'b601dbcf-7ba8-4deb-a613-4b3b9473994c',
      tasks: '90f58d31-8174-44c0-9933-e19533c7fac5',
      decisions: '3a8df14d-188c-4504-8934-9def137dbf45',
      playbook: '15d76113-b47e-49c3-b80d-ebd637ec9308',
      aiSessions: '17afd987-b2ca-42f7-9392-a772b4786efa',
      watchers: 'a3e2df6d-8e32-4167-b9ec-1a3b8ae6a627',
      goldenQuestions: 'e656ba29-e14b-4df9-83f6-da0310aae0c9',
      evalRuns: 'ba71747a-24fc-489a-b166-a34df9d1cebe',
    },
    apiRule:
      'Always pass page_size <= 10 and narrow filter_properties on Notion query_database/search to prevent middle-omission JSON truncation.',
  },
  blockers,
  warnings,
  ready: blockers.length === 0,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log('================================================================');
  console.log(' FinPlan Pro — Next-Agent Cold-Start Preflight (zero-egress)');
  console.log('================================================================');
  console.log(`  Node runtime          : ${report.nodeVersion}`);
  console.log(
    `  Git branch @ HEAD     : ${branch ?? 'n/a'} @ ${headSha ? headSha.slice(0, 12) : 'n/a'}`
  );
  console.log(`  Root node_modules     : ${rootNodeModules ? 'READY' : 'MISSING'}`);
  console.log(`  Server node_modules   : ${serverNodeModules ? 'READY' : 'NOT INSTALLED'}`);
  console.log(
    `  Evidence SHA c9b8411  : ${shallowEvidenceCommitPresent ? 'PRESENT' : 'MISSING (shallow clone)'}`
  );
  console.log('');
  console.log('  Governance & Stage-1 Ledger:');
    console.log(
      `    ${report.governance.currentStage} | docs_gate_passed=${report.governance.docsGatePassed} | human_approved_for_coding=${report.governance.humanApprovedForCoding}`
    );
  console.log(
    `    LIVE_DOCS_REVIEW.csv: ${csvStats.total} rows (${csvStats.pending} PENDING, ${csvStats.partial} PARTIAL, ${csvStats.reviewed} REVIEWED, ${csvStats.gradeC} grade-C)`
  );
  if (registerCounts) {
    console.log(
      `    Completion register : ${registerCounts.total} rows (${registerCounts.SUPPORTED} SUPPORTED, ${registerCounts.EXPERIMENTAL} EXPERIMENTAL, ${registerCounts.RETIRED} RETIRED, ${registerCounts.NOT_BUILT} NOT_BUILT)`
    );
  }
  console.log('');
  console.log('  Notion Second Brain v4.1 (LifeOS) Cold-Start Pointers:');
  console.log(`    Live Context Pack   : ${report.notionSecondBrain.liveContextPackId}`);
  console.log(`    Command Center      : ${report.notionSecondBrain.commandCenterPageId}`);
  console.log(
    `    Repo Gates & Handoffs: ${report.notionSecondBrain.dataSources.repoGatesAndHandoffs}`
  );
  console.log('    Canonical Repo Guide: docs/agent/NEXT_AGENT_COLD_START.md');

  if (warnings.length > 0) {
    console.log('\n  Warnings:');
    for (const w of warnings) console.log(`    ! ${w}`);
  }

  if (blockers.length > 0) {
    console.error('\n  Cold-Start Blockers:');
    for (const b of blockers) console.error(`    ✗ ${b}`);
  } else {
    console.log('\n  ✓ Preflight READY — run `npm run docs:verify && npm run type-safety:ratchet && npm run license:check`.');
  }
}

if (blockers.length > 0 && !advisory) {
  process.exit(1);
}
process.exit(0);
