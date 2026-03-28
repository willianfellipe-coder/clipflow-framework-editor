#!/usr/bin/env python3
"""
ClipFlow WhisperX Transcription Sidecar

Usage:
    python transcribe.py <audio_path> <output_path> [--model large-v3] [--language auto]

Outputs JSON with word-level timestamps and optional speaker diarization.
"""

import sys
import os
import json
import argparse
import time

def transcribe(audio_path: str, output_path: str, model_name: str = "large-v3", language: str = None):
    import torch
    import whisperx

    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"

    # Use MPS on Apple Silicon if available
    if device == "cpu" and torch.backends.mps.is_available():
        device = "cpu"  # WhisperX doesn't fully support MPS yet, but detects it
        compute_type = "int8"

    print(f"Using device: {device}, compute_type: {compute_type}", file=sys.stderr, flush=True)

    # 1. Load model + transcribe
    print("Loading WhisperX model...", file=sys.stderr, flush=True)
    model = whisperx.load_model(model_name, device, compute_type=compute_type)

    print("Loading audio...", file=sys.stderr, flush=True)
    audio = whisperx.load_audio(audio_path)

    print("Transcribing... 20%", file=sys.stderr, flush=True)
    result = model.transcribe(audio, batch_size=16, language=language)
    detected_language = result.get("language", language or "en")
    print(f"Detected language: {detected_language} 50%", file=sys.stderr, flush=True)

    # 2. Forced alignment for word-level timestamps
    print("Aligning words... 60%", file=sys.stderr, flush=True)
    try:
        model_a, metadata = whisperx.load_align_model(
            language_code=detected_language,
            device=device
        )
        result = whisperx.align(
            result["segments"],
            model_a, metadata, audio, device,
            return_char_alignments=False
        )
        print("Word alignment complete 80%", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"Word alignment failed (continuing without): {e}", file=sys.stderr, flush=True)

    # 3. Speaker diarization (optional, requires HuggingFace token)
    hf_token = os.environ.get("HF_TOKEN")
    if hf_token:
        print("Running speaker diarization... 85%", file=sys.stderr, flush=True)
        try:
            diarize_model = whisperx.DiarizationPipeline(
                use_auth_token=hf_token,
                device=device
            )
            diarize_segments = diarize_model(audio)
            result = whisperx.assign_word_speakers(diarize_segments, result)
            print("Speaker diarization complete 95%", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"Diarization skipped: {e}", file=sys.stderr, flush=True)
    else:
        print("Skipping diarization (no HF_TOKEN) 90%", file=sys.stderr, flush=True)

    # 4. Build structured output
    segments = []
    for seg in result.get("segments", []):
        segments.append({
            "text": seg.get("text", "").strip(),
            "start": round(seg.get("start", 0), 3),
            "end": round(seg.get("end", 0), 3),
            "speaker": seg.get("speaker"),
        })

    word_timestamps = []
    for seg in result.get("segments", []):
        for word in seg.get("words", []):
            if "start" in word and "end" in word:
                word_timestamps.append({
                    "word": word["word"].strip(),
                    "start": round(word["start"], 3),
                    "end": round(word["end"], 3),
                    "confidence": round(word.get("score", 0), 3),
                    "speaker": word.get("speaker"),
                })

    output = {
        "language": detected_language,
        "segments": segments,
        "word_timestamps": word_timestamps,
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Transcription complete! 100%", file=sys.stderr, flush=True)
    print(f"Segments: {len(segments)}, Words: {len(word_timestamps)}", file=sys.stderr, flush=True)

    return output


def main():
    parser = argparse.ArgumentParser(description="ClipFlow WhisperX Transcription")
    parser.add_argument("audio_path", help="Path to audio file (WAV recommended)")
    parser.add_argument("output_path", help="Path for output JSON file")
    parser.add_argument("--model", default="large-v3", help="WhisperX model name")
    parser.add_argument("--language", default=None, help="Language code (auto-detect if not set)")

    args = parser.parse_args()

    if not os.path.exists(args.audio_path):
        print(f"Error: Audio file not found: {args.audio_path}", file=sys.stderr)
        sys.exit(1)

    start_time = time.time()
    transcribe(args.audio_path, args.output_path, args.model, args.language)
    elapsed = time.time() - start_time
    print(f"Total time: {elapsed:.1f}s", file=sys.stderr, flush=True)


if __name__ == "__main__":
    main()
