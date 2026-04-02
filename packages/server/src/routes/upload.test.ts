/**
 * Unit tests: SEC-003 magic bytes validation logic
 *
 * We test the validation function in isolation (no Fastify, no filesystem).
 * The core logic from upload.ts is: read first 12 bytes and check signatures.
 */
import { describe, it, expect } from 'vitest';

// ── Pure function extracted for testability ────────────────────────────────
function isValidVideoMagicBytes(magic: Buffer): boolean {
  const isMP4orMOV = magic[4] === 0x66 && magic[5] === 0x74 && magic[6] === 0x79 && magic[7] === 0x70; // ftyp
  const isWebM     = magic[0] === 0x1a && magic[1] === 0x45 && magic[2] === 0xdf && magic[3] === 0xa3;  // EBML
  const isAVI      = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46;  // RIFF
  return isMP4orMOV || isWebM || isAVI;
}

// ── Test fixtures ──────────────────────────────────────────────────────────
function mp4Magic(): Buffer {
  // Typical mp4 starts with box size + 'ftyp'
  const buf = Buffer.alloc(12, 0);
  buf[4] = 0x66; buf[5] = 0x74; buf[6] = 0x79; buf[7] = 0x70; // 'ftyp'
  return buf;
}

function webmMagic(): Buffer {
  const buf = Buffer.alloc(12, 0);
  buf[0] = 0x1a; buf[1] = 0x45; buf[2] = 0xdf; buf[3] = 0xa3; // EBML
  return buf;
}

function aviMagic(): Buffer {
  const buf = Buffer.alloc(12, 0);
  buf[0] = 0x52; buf[1] = 0x49; buf[2] = 0x46; buf[3] = 0x46; // 'RIFF'
  return buf;
}

function pdfMagic(): Buffer {
  // %PDF - a common non-video format used in attacks
  return Buffer.from([0x25, 0x50, 0x44, 0x46, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function zipMagic(): Buffer {
  return Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0, 0, 0]);
}

function emptyBuffer(): Buffer {
  return Buffer.alloc(12, 0);
}

// ── Tests ──────────────────────────────────────────────────────────────────
describe('isValidVideoMagicBytes', () => {
  it('accepts a valid MP4 file', () => {
    expect(isValidVideoMagicBytes(mp4Magic())).toBe(true);
  });

  it('accepts a valid WebM file', () => {
    expect(isValidVideoMagicBytes(webmMagic())).toBe(true);
  });

  it('accepts a valid AVI file', () => {
    expect(isValidVideoMagicBytes(aviMagic())).toBe(true);
  });

  it('rejects a PDF disguised as a video', () => {
    expect(isValidVideoMagicBytes(pdfMagic())).toBe(false);
  });

  it('rejects a ZIP/JAR file', () => {
    expect(isValidVideoMagicBytes(zipMagic())).toBe(false);
  });

  it('rejects an all-zero buffer (empty file)', () => {
    expect(isValidVideoMagicBytes(emptyBuffer())).toBe(false);
  });
});
