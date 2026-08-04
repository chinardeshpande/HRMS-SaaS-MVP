#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PUBLIC_DIR="${WEB_DIR}/public"
VIDEO_DIR="${PUBLIC_DIR}/videos"

synthesize_voice() {
  local narration="$1"
  local output_file="$2"
  local voice_name="en-IN-Chirp3-HD-Aoede"
  local work_dir
  local access_token
  local concat_file
  local paragraph
  local index=0

  work_dir="$(mktemp -d)"
  concat_file="${work_dir}/segments.txt"
  access_token="$(gcloud auth print-access-token)"
  ffmpeg -y -f lavfi -i anullsrc=r=24000:cl=mono -t 0.9 -c:a pcm_s16le "${work_dir}/pause.wav" >/dev/null 2>&1

  while IFS= read -r paragraph; do
    [[ -z "${paragraph}" ]] && continue
    local response_file="${work_dir}/response-${index}.json"
    local segment_file="${work_dir}/segment-${index}.wav"
    local payload
    payload="$(jq -n --arg text "${paragraph}" --arg voice "${voice_name}" '{input:{text:$text},voice:{languageCode:"en-IN",name:$voice},audioConfig:{audioEncoding:"LINEAR16"}}')"
    curl -sS \
      -H "Authorization: Bearer ${access_token}" \
      -H "x-goog-user-project: aurahrms-staging" \
      -H 'Content-Type: application/json' \
      -d "${payload}" \
      https://texttospeech.googleapis.com/v1/text:synthesize > "${response_file}"
    jq -e '.audioContent' "${response_file}" >/dev/null
    jq -r '.audioContent' "${response_file}" | base64 --decode > "${segment_file}"
    printf "file '%s'\nfile '%s'\n" "${segment_file}" "${work_dir}/pause.wav" >> "${concat_file}"
    index=$((index + 1))
  done < "${narration}"

  ffmpeg -y -f concat -safe 0 -i "${concat_file}" -c:a pcm_s16le "${output_file}" >/dev/null 2>&1
  mv "${work_dir}" "/private/tmp/aurahr-voice-segments-$(basename "${output_file}" .wav)"
}

build_film() {
  local slug="$1"
  shift
  local narration="${VIDEO_DIR}/${slug}.txt"
  local voice_file="${VIDEO_DIR}/${slug}.wav"
  local output_file="${VIDEO_DIR}/${slug}.mp4"
  local images=("$@")
  local input_args=()
  local filters=""
  local index

  synthesize_voice "${narration}" "${voice_file}"
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
  mv "${voice_file}" "/private/tmp/${slug}-voice-master.wav"
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
