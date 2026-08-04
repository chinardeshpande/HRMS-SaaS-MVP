#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PUBLIC_DIR="${WEB_DIR}/public"
VIDEO_DIR="${PUBLIC_DIR}/videos"
VOICE_FILE="${VIDEO_DIR}/aurahr-product-walkthrough.aiff"
OUTPUT_FILE="${VIDEO_DIR}/aurahr-product-walkthrough.mp4"

mkdir -p "${VIDEO_DIR}"
say -v Tara -r 172 -f "${VIDEO_DIR}/aurahr-product-walkthrough.txt" -o "${VOICE_FILE}"

ffmpeg -y \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/brand/aura/aura-social-card.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/dashboard.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/employee-register.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/onboarding.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/attendance.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/document-library.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/manu-assistant.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/analytics.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/leave.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/performance.png" \
  -loop 1 -t 8 -i "${PUBLIC_DIR}/images/Product-Screenshots/latest/exit-management.png" \
  -i "${VOICE_FILE}" \
  -filter_complex "
    [0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#101b3b,zoompan=z='min(zoom+0.00045,1.04)':d=200:s=1920x1080:fps=25,format=yuv420p[v0];
    [1:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v1];
    [2:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v2];
    [3:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v3];
    [4:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v4];
    [5:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v5];
    [6:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v6];
    [7:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v7];
    [8:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v8];
    [9:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v9];
    [10:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#eef1ff,zoompan=z='min(zoom+0.00035,1.035)':d=200:s=1920x1080:fps=25,format=yuv420p[v10];
    [v0][v1]xfade=transition=fade:duration=1:offset=7[x1];
    [x1][v2]xfade=transition=fade:duration=1:offset=14[x2];
    [x2][v3]xfade=transition=fade:duration=1:offset=21[x3];
    [x3][v4]xfade=transition=fade:duration=1:offset=28[x4];
    [x4][v5]xfade=transition=fade:duration=1:offset=35[x5];
    [x5][v6]xfade=transition=fade:duration=1:offset=42[x6];
    [x6][v7]xfade=transition=fade:duration=1:offset=49[x7];
    [x7][v8]xfade=transition=fade:duration=1:offset=56[x8];
    [x8][v9]xfade=transition=fade:duration=1:offset=63[x9];
    [x9][v10]xfade=transition=fade:duration=1:offset=70,format=yuv420p[video]
  " \
  -map "[video]" -map 11:a \
  -c:v libx264 -preset medium -crf 21 -profile:v high -level 4.1 \
  -c:a aac -b:a 160k -ar 48000 \
  -movflags +faststart -shortest "${OUTPUT_FILE}"

rm -f "${VOICE_FILE}"
echo "Created ${OUTPUT_FILE}"
