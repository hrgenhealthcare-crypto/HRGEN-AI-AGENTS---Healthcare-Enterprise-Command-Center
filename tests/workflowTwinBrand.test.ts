import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, statSync } from 'node:fs';

const source = readFileSync('src/components/WorkflowTwinView.tsx', 'utf8');
const styles = readFileSync('src/components/WorkflowTwinView.css', 'utf8');
const header = readFileSync('src/components/Header.tsx', 'utf8');
const wordmark = readFileSync('src/components/HRGenWordmark.tsx', 'utf8');
const asset = readFileSync('public/brand/hrgen-wordmark-original-crop.webp');

test('original brand asset exists and is a valid WEBP container', () => {
  assert.ok(asset.length > 1000);
  assert.equal(asset.toString('ascii', 0, 4), 'RIFF');
  assert.equal(asset.toString('ascii', 8, 12), 'WEBP');
  assert.ok(statSync('public/brand/hrgen-wordmark-original-crop.webp').size < 25000);
});

test('logo uses original Library-derived file, not an invented text logo', () => {
  assert.match(wordmark, /src="\/brand\/hrgen-wordmark-original-crop.webp"/);
  assert.match(header, /<HRGenWordmark compact/);
  assert.match(source, /<HRGenWordmark compact/);
});

test('mobile screen has independent Build Flow Review tabs', () => {
  assert.match(source, /hwt-mobile-tabs/);
  assert.match(source, /hwt-mobile-pipeline/);
  assert.match(source, /aria-selected/);
  assert.match(styles, /\.hwt-mobile-flow/);
  assert.match(styles, /\.hwt-mobile-build/);
  assert.match(styles, /\.hwt-mobile-review/);
});

test('touch controls have clear focus, selected and press glow', () => {
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /\.hwt-mobile-node\.focused/);
  assert.match(styles, /\.hwt-mobile-tabs button:active/);
  assert.match(styles, /box-shadow:0 0 0 2px #E72D883B/);
});

test('palette is black magenta white, no purple in Workflow Twin', () => {
  assert.match(styles, /--hwt-bg:#080709/);
  assert.match(styles, /--hwt-magenta:#E72D88/);
  assert.match(styles, /--hwt-white:#F8F6F7/);
  assert.doesNotMatch(styles, /purple|#6D4CB4|#8274bd|#a18bdf/i);
  assert.doesNotMatch(source, /Purple|#8274bd|#a18bdf/i);
});

test('animation respects reduced motion and scrolling stays contained', () => {
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(source, /previousOverflow/);
  assert.match(source, /document\.body\.style\.overflow=previousOverflow/);
});

test('prototype has no direct provider or patient-data API calls', () => {
  assert.doesNotMatch(source, /fetch\(|axios\.|\.post\(|\.put\(/);
  assert.match(source, /DRAFT_NOT_DEPLOYED/);
  assert.match(source, /payments:false,messaging:false,deploy:false/);
});
