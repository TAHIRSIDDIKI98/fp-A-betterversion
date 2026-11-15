/**
 * Regression guard for `scripts/type-safety-ratchet.mjs` (`npm run type-safety:ratchet`).
 *
 * Ensures that dynamic vendor loaders (`jspdf`, `exceljs`) and export services
 * never reintroduce `as any` casts above `scripts/type-safety-baseline.json` (48,
 * with `asAny: 0`), preventing silent CI drift when `type-safety:ratchet` is run
 * standalone or in pre-push / CI gates.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const ROOT = process.cwd();
const RATCHET_SCRIPT = join(ROOT, 'scripts', 'type-safety-ratchet.mjs');

describe('type-safety:ratchet — live repository gate', () => {
  it('exits 0 with zero `as any` escapes across financial modules', () => {
    const out = execFileSync('node', [RATCHET_SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    expect(out).toMatch(/'as any'\s+0/);
    expect(out).toContain('✓ Ratchet holds');
  });
});
