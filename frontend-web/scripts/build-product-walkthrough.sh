#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PUBLIC_DIR="${WEB_DIR}/public"
VIDEO_DIR="${PUBLIC_DIR}/videos"

build_film() {
  local slug="$1"
  shift
  local narration="${VIDEO_DIR}/${slug}.txt"
  local voice_file="${VIDEO_DIR}/${slug}.aiff"
  local output_file="${VIDEO_DIR}/${slug}.mp4"
  local images=("$@")
  local input_args=()
  local filters=""
  local index

  say -v Tara -r 145 -f "${narration}" -o "${voice_file}"
  for index in "${!images[@]}"; do
    input_args+=( -loop 1 -t 8 -i "${PUBLIC_DIR}/${images[$index]}" )
    filters+="[${index}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00045,1.04)':d=200:s=1280x720:fps=25,format=yuv420p[v${index}];"
  done

  local current="v0"
  for ((index=1; index<${#images[@]}; index++)); do
    local next="x${index}"
    local offset=$((index * 7))
    filters+="[${current}][v${index}]xfade=transition=fade:duration=1:offset=${offset}[${next}];"
    current="${next}"
  done
  filters+="[${current}]format=yuv420p[video]"

  ffmpeg -y "${input_args[@]}" -i "${voice_file}" \
    -filter_complex "${filters}" -map "[video]" -map "${#images[@]}:a" \
    -c:v libx264 -preset medium -crf 22 -profile:v high -level 4.0 \
    -c:a aac -b:a 144k -ar 48000 -movflags +faststart -shortest "${output_file}"
  rm -f "${voice_file}"
}

mkdir -p "${VIDEO_DIR}"

build_film "aurahr-overview" \
  "brand/aura/aura-social-card.png" \
  "images/Product-Screenshots/latest/dashboard.png" \
  "images/Product-Screenshots/latest/employee-register.png" \
  "images/Product-Screenshots/latest/onboarding.png" \
  "images/Product-Screenshots/latest/attendance.png" \
  "images/Product-Screenshots/latest/document-library.png" \
  "images/Product-Screenshots/latest/manu-assistant.png" \
  "images/Product-Screenshots/latest/analytics.png"

build_film "aurahr-new-joiner-journey" \
  "brand/aura/aura-social-card.png" \
  "images/Product-Screenshots/latest/onboarding.png" \
  "images/Product-Screenshots/latest/document-library.png" \
  "images/Product-Screenshots/latest/probation.png" \
  "images/Product-Screenshots/latest/employee-register.png" \
  "images/Product-Screenshots/latest/hr-connect.png"

build_film "aurahr-manager-journey" \
  "brand/aura/aura-social-card.png" \
  "images/Product-Screenshots/latest/dashboard.png" \
  "images/Product-Screenshots/latest/attendance.png" \
  "images/Product-Screenshots/latest/leave.png" \
  "images/Product-Screenshots/latest/performance.png" \
  "images/Product-Screenshots/latest/hr-connect.png" \
  "images/Product-Screenshots/latest/analytics.png"

build_film "aurahr-manu-journey" \
  "brand/aura/aura-social-card.png" \
  "images/Product-Screenshots/latest/manu-assistant.png" \
  "images/Product-Screenshots/latest/dashboard.png" \
  "images/Product-Screenshots/latest/document-library.png" \
  "images/Product-Screenshots/latest/analytics.png" \
  "images/Product-Screenshots/latest/hr-connect.png"
