/**
 * Tests for `scripts/agent-preflight.mjs` (`npm run agent:preflight`).
 *
 * Verifies cold-start diagnostics for incoming AI agents:
 * - Zero network egress (pure local fs + git checks)
 * - JSON and human-readable output modes
 * - Fails closed (exit 1) when required local prerequisites (`node_modules`) are absent
 * - Passes (exit 0) when `--advisory` is passed even on an unbootstrapped directory
 */
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = process.cwd();
const SCRIPT = join(ROOT, 'scripts', 'agent-preflight.mjs');

let tmpDir: string | null = null;

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

describe('agent:preflight — cold-start readiness diagnostics', () => {
  it('emits structured JSON readiness report on the live repository', () => {
    const raw = execFileSync('node', [SCRIPT, '--json', '--advisory'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const report = JSON.parse(raw) as {
      nodeVersion: string;
      environment: {
        rootNodeModules: boolean;
        shallowEvidenceCommitPresent: boolean;
      };
      governance: {
        currentStage: number | string;
        docsGatePassed: boolean;
        pendingDocsCount: number;
      };
      notionSecondBrain: {
        rootHubPageId: string;
        liveContextPackId: string;
      };
    };

    expect(report.nodeVersion).toMatch(/^v\d+\./);
    expect(report.environment.rootNodeModules).toBe(true);
    expect(String(report.governance.currentStage).length).toBeGreaterThan(0);
    expect(typeof report.governance.docsGatePassed).toBe('boolean');
    expect(report.notionSecondBrain.rootHubPageId).toBe('4111d643-919f-818b-8be7-d25501022e42');
    expect(report.notionSecondBrain.liveContextPackId).toBe('4191d643-919f-81ef-abf0-e77b1bd3be16');
  });

  it('exits 1 with actionable bootstrap commands when root node_modules is missing, and 0 with --advisory', () => {
    tmpDir = mkdtempSync(join(tmpdir(), 'agent-preflight-'));
    mkdirSync(join(tmpDir, 'docs', '_agent'), { recursive: true });
    writeFileSync(
      join(tmpDir, 'docs', '_agent', 'STATE.json'),
      JSON.stringify({
        current_stage: 1,
        docs_gate_passed: false,
        human_approved_for_coding: false,
      }),
      'utf8'
    );

    let failedStatus = 0;
    let failedStderr = '';
    try {
      execFileSync('node', [SCRIPT, `--root=${tmpDir}`], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: 'pipe',
      });
    } catch (e) {
      const err = e as { status?: number; stderr?: string; stdout?: string };
      failedStatus = err.status ?? -1;
      failedStderr = `${err.stdout ?? ''}\n${err.stderr ?? ''}`;
    }

    expect(failedStatus).toBe(1);
    expect(failedStderr).toContain('npm ci --ignore-scripts');

    const advisoryOut = execFileSync('node', [SCRIPT, `--root=${tmpDir}`, '--advisory'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    expect(advisoryOut).toContain('FinPlan Pro — Next-Agent Cold-Start Preflight');
  });
});
