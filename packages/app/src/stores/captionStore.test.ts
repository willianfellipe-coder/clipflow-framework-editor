/**
 * Unit tests: GAP-011 captionStore undo/redo
 *
 * Tests the history stack behavior: push, undo to previous states,
 * redo after undo, and correct canUndo/canRedo flags.
 *
 * We import the store and manipulate it directly — no React rendering needed
 * since the store is pure Zustand logic.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useCaptionStore } from '../stores/captionStore';
import type { WordTimestamp } from '@clip/shared';

// ── Helpers ────────────────────────────────────────────────────────────────
const word = (text: string, start = 0, end = 1): WordTimestamp => ({
  word: text, start, end, confidence: 1,
});

function resetStore(initial: WordTimestamp[] = []) {
  useCaptionStore.getState().setWords(initial);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('captionStore — undo/redo (GAP-011)', () => {
  beforeEach(() => {
    resetStore([word('hello', 0, 0.5), word('world', 0.6, 1.2)]);
  });

  it('starts with canUndo = false and canRedo = false', () => {
    const { canUndo, canRedo } = useCaptionStore.getState();
    expect(canUndo).toBe(false);
    expect(canRedo).toBe(false);
  });

  it('enables canUndo after updateWord', () => {
    useCaptionStore.getState().updateWord(0, 'hi');
    expect(useCaptionStore.getState().canUndo).toBe(true);
  });

  it('undo restores previous word', () => {
    useCaptionStore.getState().updateWord(0, 'changed');
    useCaptionStore.getState().undo();
    expect(useCaptionStore.getState().words[0].word).toBe('hello');
  });

  it('redo re-applies the change after undo', () => {
    useCaptionStore.getState().updateWord(0, 'changed');
    useCaptionStore.getState().undo();
    useCaptionStore.getState().redo();
    expect(useCaptionStore.getState().words[0].word).toBe('changed');
  });

  it('canRedo becomes true after undo', () => {
    useCaptionStore.getState().updateWord(0, 'x');
    useCaptionStore.getState().undo();
    expect(useCaptionStore.getState().canRedo).toBe(true);
  });

  it('canRedo becomes false after new edit', () => {
    useCaptionStore.getState().updateWord(0, 'x');
    useCaptionStore.getState().undo();
    useCaptionStore.getState().updateWord(1, 'new');
    expect(useCaptionStore.getState().canRedo).toBe(false);
  });

  it('undo does nothing at history start', () => {
    const before = useCaptionStore.getState().words[0].word;
    useCaptionStore.getState().undo();
    expect(useCaptionStore.getState().words[0].word).toBe(before);
  });

  it('redo does nothing when no future states', () => {
    useCaptionStore.getState().updateWord(0, 'x');
    // No undo, so redo-ing should be a no-op
    const after = useCaptionStore.getState().words[0].word;
    useCaptionStore.getState().redo();
    expect(useCaptionStore.getState().words[0].word).toBe(after);
  });

  it('updateWordTiming also pushes to history', () => {
    useCaptionStore.getState().updateWordTiming(0, 1, 2);
    useCaptionStore.getState().undo();
    expect(useCaptionStore.getState().words[0].start).toBe(0);
    expect(useCaptionStore.getState().words[0].end).toBe(0.5);
  });

  it('multiple undos walk back the full history', () => {
    useCaptionStore.getState().updateWord(0, 'a');
    useCaptionStore.getState().updateWord(0, 'b');
    useCaptionStore.getState().updateWord(0, 'c');
    useCaptionStore.getState().undo(); // back to 'b'
    useCaptionStore.getState().undo(); // back to 'a'
    useCaptionStore.getState().undo(); // back to 'hello'
    expect(useCaptionStore.getState().words[0].word).toBe('hello');
  });

  it('setWords resets history so canUndo is false', () => {
    useCaptionStore.getState().updateWord(0, 'x');
    resetStore([word('fresh', 0, 1)]);
    expect(useCaptionStore.getState().canUndo).toBe(false);
    expect(useCaptionStore.getState().canRedo).toBe(false);
  });
});
