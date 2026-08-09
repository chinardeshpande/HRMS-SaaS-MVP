#!/usr/bin/env bash
set -euo pipefail

EVIDENCE_DIR="${1:?usage: compose-role-evidence-video.sh EVIDENCE_DIR}"
RAW_DIR="${EVIDENCE_DIR}/raw-video"
WORK_DIR="$(mktemp -d)"
FINAL_VIDEO="${EVIDENCE_DIR}/aurahrms-role-acceptance-walkthrough.mp4"
NARRATION="${WORK_DIR}/narration.txt"
VOICE="${WORK_DIR}/narration.aiff"
CONCAT="${WORK_DIR}/videos.txt"
COMBINED="${WORK_DIR}/combined.mp4"

cat >"${NARRATION}" <<'EOF'
Welcome to the Aura H R role acceptance walkthrough.

We begin with the system administrator. The login reaches the owner implementation console, then opens the employee register, settings, and reports.

Next is the H R administrator. This role reaches organisation-wide employee operations, onboarding, attendance, and leave management.

The people manager sees a team work queue, team employees, team leave, and performance. Direct links to settings and reports are refused.

The employee sees a focused self-service workspace: personal attendance, leave, H R documents, and H R Connect. Employee-register and administrator settings are refused.

Finally, a separate synthetic tenant opens its own employee register. ACV synthetic employees are absent, proving the tenant boundary in the visible interface.

Every frame in this walkthrough comes from an asserted local test using synthetic data. The accompanying report contains the API checks, screenshots, and reproducible commands.
EOF

for video in system-admin hr-admin manager employee orbit-admin; do
  input="${RAW_DIR}/${video}.webm"
  output="${WORK_DIR}/${video}.mp4"
  [[ -f "${input}" ]] || { echo "Missing ${input}" >&2; exit 1; }
  ffmpeg -y -i "${input}" -vf "scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:#eef1ff" -an -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p "${output}" >/dev/null 2>&1
  printf "file '%s'\n" "${output}" >>"${CONCAT}"
done

say -v Samantha -r 148 -f "${NARRATION}" -o "${VOICE}"
ffmpeg -y -f concat -safe 0 -i "${CONCAT}" -c copy "${COMBINED}" >/dev/null 2>&1

VIDEO_DURATION="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${COMBINED}")"
AUDIO_DURATION="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${VOICE}")"
PACE_FACTOR="$(awk -v audio="${AUDIO_DURATION}" -v video="${VIDEO_DURATION}" 'BEGIN { printf "%.6f", (audio + 1.0) / video }')"

ffmpeg -y -i "${COMBINED}" -i "${VOICE}" \
  -filter_complex "[0:v]setpts=${PACE_FACTOR}*PTS[v];[1:a]volume=1.08,apad=pad_dur=2[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset medium -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 160k -movflags +faststart -shortest "${FINAL_VIDEO}" >/dev/null 2>&1

echo "${FINAL_VIDEO}"
