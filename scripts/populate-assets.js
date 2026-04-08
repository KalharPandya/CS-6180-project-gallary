'use strict';
/**
 * populate-assets.js
 * ------------------
 * Copies each team's real poster PDF and video from student-posters/ into the
 * corresponding teams/team-NN/assets/ gallery folder, then patches project.json
 * so convert-posters.py will pick up the PDF for PNG conversion.
 *
 * Usage:
 *   node scripts/populate-assets.js --snapshot   # capture current sizes → asset-snapshot.json
 *   node scripts/populate-assets.js              # pre-flight → copy → post-copy validation
 *   node scripts/populate-assets.js --check      # validate destinations only (no writes)
 */

const fs   = require('fs');
const path = require('path');

// ── Constants ────────────────────────────────────────────────────────────────

const PLACEHOLDER_PDF_SIZE = 274164;
const PLACEHOLDER_MP4_SIZE = 2167273;

const STUDENT_POSTERS_ROOT = path.join(__dirname, '..', 'student-posters');
const TEAMS_ROOT           = path.join(__dirname, '..', 'teams');
const SNAPSHOT_PATH        = path.join(__dirname, 'asset-snapshot.json');

// ── Asset map ────────────────────────────────────────────────────────────────
// All paths are relative to STUDENT_POSTERS_ROOT.

const ASSET_MAP = [
  { team:'team-01', pdf:'submissions/team1_328568_40932836_GenAI_Poster (1).pdf',                                    video:'submissions/Team-1-mp4.mp4' },
  { team:'team-02', pdf:'submissions/team2_324371_40929910_M2 Poster.pdf',                                           video:'submissions/team2_324371_40929909_M2 Video.mp4' },
  { team:'team-03', pdf:'submissions/team3_320418_40916724_CS6180_poster_group3.pdf',                                video:'submissions/team3_320418_40916723_CS6180_presentation_group3.mp4' },
  { team:'team-04', pdf:'submissions/team23_251247_40932351_Team23-M2/team4_LATE_324655_40932965_M2 GenAI Project Poster-1.pdf', video:'submissions/team4_LATE_324655_40932964_Gen AI Project M2 Presentation.mp4' },
  { team:'team-05', pdf:'submissions/team5_341145_40895137_M2-Poster-Group 5.pdf',                                   video:'submissions/team5_341145_40895138_M2-Video Presentation-Group 5.mp4' },
  { team:'team-06', pdf:'submissions/team6_220303_40868398_CS6180_M2_Poster.pdf',                                    video:'submissions/team6_220303_40868399_CS6180_M2_Video.mp4' },
  { team:'team-07', pdf:'submissions/team7_320555_40931458_CS6180_GenAI_Poster-1.pdf',                               video:'submissions/team7_320555_40931457_Final_Video-2.mp4' },
  { team:'team-08', pdf:'submissions/team8_341545_40932624_Team8_Poster.pdf',                                        video:'submissions/team8_341545_40932623_Team8_Presentation.mp4' },
  { team:'team-09', pdf:'Team-9/FinAgent - Poster.pdf',                                                              video:'Team-9/FinAgent PPT.mp4' },
  { team:'team-10', pdf:'submissions/team10_403783_40931525_Poster_Team10.pdf',                                      video:'submissions/team10_403783_40931524_Presentation_Team10.mp4' },
  { team:'team-11', pdf:'submissions/team11_280073_40883442_CS 6180 Team 11 Poster Final.pdf',                       video:'submissions/team11_280073_40883443_CS 6180 Poster Presentation.mp4' },
  { team:'team-12', pdf:'submissions/team12_159399_40932068_RAGs to Riches Poster Template 1-1.pptx.pdf',            video:'team12/RAGs_video.mp4' },
  { team:'team-13', pdf:'submissions/team13_374162_40932905_Poster_Group13-1.pdf',                                   video:'team13/Final_Video.mp4' },
  { team:'team-14', pdf:'submissions/team14_300020_40916686_Poster.pdf',                                             video:'submissions/team14_300020_40916687_CS6180_14.mp4' },
  { team:'team-15', pdf:'submissions/team15_265866_40898407_Team15-poster.pdf',                                      video:'submissions/team15_265866_40898406_Team15-presentation.mp4' },
  { team:'team-16', pdf:'team-16/GUARD_RAG_Poster-3.pdf',                                                            video:'team-16/Call with Gen ai project-20260406_190633-Meeting Recording.mp4' },
  { team:'team-17', pdf:'submissions/team17_190418_40888964_Team 17 poster.pdf',                                     video:'submissions/team17_190418_40889007_Team 17 Video.mp4' },
  { team:'team-18', pdf:'submissions/team18_370945_40931321_CS6180 Team 18 Final Poster Final.pdf',                  video:'submissions/team18_370945_40931320_InShot_20260406_182308315.mp4' },
  { team:'team-19', pdf:'submissions/team19_328581_40919870_CS6180-Group19-poster.pdf',                              video:'submissions/team19_328581_40919877_CS6180-Group19-progress-pre.mp4' },
  { team:'team-20', pdf:'submissions/team20_380256_40932473_GenAI_Poster.pdf',                                       video:'submissions/team20_380256_40932471_Progress Presentation.mp4' },
  { team:'team-21', pdf:'submissions/team21_271953_40932873_Team21_Poster.pdf',                                      video:'submissions/team21_271953_40932872_Team21_ProgressPresentation.mp4' },
  { team:'team-22', pdf:'submissions/team22_370422_40930784_CS6180-M2-Poster.pdf',                                   video:'submissions/team22_370422_40930782_CS6180-M2-Video.mp4' },
  { team:'team-23', pdf:'submissions/Team23-M2/team23-m2-poster.pdf',                                                video:'submissions/Team23-M2/team23-m2-video.mp4' },
  { team:'team-24', pdf:'submissions/team24_224125_40919581_Team24_Poster.pdf',                                      video:'submissions/team24_224125_40919582_Team24_VideoPresentation.mp4' },
  { team:'team-25', pdf:'submissions/team25_LATE_353328_40933048_M2-Poster-Group25.pptx (1).pdf',                    video:'submissions/team25_LATE_353328_40933160_group25--.mp4' },
  { team:'team-26', pdf:'submissions/team26_276205_40923329_Poster - Team26.pdf',                                    video:'submissions/team26_276205_40923346_M2-Video-Presentation-Team26.mp4' },
  { team:'team-27', pdf:'submissions/team-27-pdf-poster.pdf',                                                        video:'submissions/team27_295787_40920639_M2 Report Slides - Team 27v2.mp4' },
  { team:'team-28', pdf:'submissions/team28_317473_40930637_Group_28_Poster.pdf',                                    video:'submissions/team28_317473_40930641_Group_28_Video_Presentation.mp4' },
  { team:'team-29', pdf:'submissions/team29_LATE_169598_40933898_Final Project Presentation-1.pdf',                  video:'team-29/video.mp4' },
  { team:'team-30', pdf:'submissions/team30_377830_40932710_CS6180 Team 30 Poster-1.pdf',                            video:'submissions/team30_377830_40932709_CS6180 Team 30 Presentation-1.mp4' },
  // NOTE: team-31 video filename has a deliberate double-space between "PaperPilot" and "A"
  { team:'team-31', pdf:'submissions/team31_377659_40930758_Team 31 Paper Pilot.pdf',                                video:'submissions/team31_377659_40930760_Team 31 PaperPilot  A Multi Agent Research Assistant.mp4' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtBytes(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' MB';
  return Math.round(n / 1024) + ' KB';
}

function fileSize(p) {
  try { return fs.statSync(p).size; } catch { return null; }
}

function isPlaceholder(filePath) {
  const size = fileSize(filePath);
  if (size == null) return false;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') return size === PLACEHOLDER_PDF_SIZE;
  if (ext === '.mp4') return size === PLACEHOLDER_MP4_SIZE;
  return false;
}

function copyAsset(src, dest, label) {
  if (!fs.existsSync(src)) {
    console.error(`  ✗ ERROR  ${label}: source not found\n    src: ${src}`);
    return false;
  }
  if (fs.existsSync(dest) && !isPlaceholder(dest)) {
    const sz = fileSize(dest);
    console.log(`  ↷ SKIP   ${label}: dest already real (${fmtBytes(sz)})`);
    return false;
  }
  fs.copyFileSync(src, dest);
  const srcSz  = fileSize(src);
  const destSz = fileSize(dest);
  console.log(`  ✓ COPY   ${label}: ${fmtBytes(srcSz)} → ${fmtBytes(destSz)}`);
  return true;
}

function patchProjectJson(teamDir, fields) {
  const jsonPath = path.join(teamDir, 'project.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  Object.assign(data, fields);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`  ✎ JSON   project.json patched: ${JSON.stringify(fields)}`);
}

// ── Mode: --snapshot ─────────────────────────────────────────────────────────

function runSnapshot() {
  console.log('📸  Capturing asset size snapshot → scripts/asset-snapshot.json\n');
  const result = { capturedAt: new Date().toISOString(), teams: {} };
  for (const entry of ASSET_MAP) {
    const assetsDir = path.join(TEAMS_ROOT, entry.team, 'assets');
    result.teams[entry.team] = {
      'poster.pdf': fileSize(path.join(assetsDir, 'poster.pdf')),
      'poster.png': fileSize(path.join(assetsDir, 'poster.png')),
      'video.mp4':  fileSize(path.join(assetsDir, 'video.mp4')),
    };
    const t = result.teams[entry.team];
    console.log(`  ${entry.team}  pdf=${fmtBytes(t['poster.pdf'])}  png=${fmtBytes(t['poster.png'])}  mp4=${fmtBytes(t['video.mp4'])}`);
  }
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(result, null, 2) + '\n', 'utf-8');
  console.log(`\nSnapshot written to: ${SNAPSHOT_PATH}`);
}

// ── Mode: --check ─────────────────────────────────────────────────────────────

function runCheck() {
  console.log('🔍  Validating destination assets\n');

  let snapshot = null;
  if (fs.existsSync(SNAPSHOT_PATH)) {
    snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    console.log(`  Using snapshot captured at: ${snapshot.capturedAt}\n`);
  }

  let pass = 0, warn = 0, fail = 0;

  for (const entry of ASSET_MAP) {
    const assetsDir = path.join(TEAMS_ROOT, entry.team, 'assets');
    const pdfPath   = path.join(assetsDir, 'poster.pdf');
    const videoPath = path.join(assetsDir, 'video.mp4');
    const pngPath   = path.join(assetsDir, 'poster.png');

    const pdfSize   = fileSize(pdfPath);
    const videoSize = fileSize(videoPath);
    const pngSize   = fileSize(pngPath);

    const pdfOk    = pdfSize   != null && pdfSize   !== PLACEHOLDER_PDF_SIZE;
    const videoOk  = videoSize != null && videoSize !== PLACEHOLDER_MP4_SIZE;

    // diff vs snapshot
    let diffNote = '';
    if (snapshot && snapshot.teams[entry.team]) {
      const snap = snapshot.teams[entry.team];
      const pdfChanged   = pdfSize   !== snap['poster.pdf'];
      const videoChanged = videoSize !== snap['video.mp4'];
      const pngChanged   = pngSize   !== snap['poster.png'];
      const parts = [];
      if (!pdfChanged)   parts.push('pdf=UNCHANGED');
      if (!videoChanged) parts.push('video=UNCHANGED');
      if (!pngChanged)   parts.push('png=UNCHANGED');
      if (parts.length)  diffNote = `  ⚠ ${parts.join(', ')}`;
    }

    const statusIcon = (pdfOk && videoOk) ? '✓' : '✗';
    if (pdfOk && videoOk && !diffNote) {
      pass++;
    } else if (pdfOk && videoOk && diffNote) {
      warn++;
    } else {
      fail++;
    }

    const pdfStatus   = pdfOk   ? `✓ ${fmtBytes(pdfSize)}`   : `✗ ${pdfSize == null ? 'MISSING' : 'PLACEHOLDER'}`;
    const videoStatus = videoOk ? `✓ ${fmtBytes(videoSize)}`  : `✗ ${videoSize == null ? 'MISSING' : 'PLACEHOLDER'}`;
    const pngStatus   = pngSize != null ? fmtBytes(pngSize)   : 'missing';

    console.log(`  ${statusIcon} ${entry.team}  pdf=${pdfStatus}  video=${videoStatus}  png=${pngStatus}${diffNote}`);
  }

  console.log(`\n${ fail === 0 && warn === 0 ? '✅' : fail > 0 ? '❌' : '⚠️ ' }  ${pass} passed, ${warn} warnings, ${fail} failed  (of ${ASSET_MAP.length} teams)`);
  if (fail > 0) process.exit(1);
}

// ── Mode: copy (default) ──────────────────────────────────────────────────────

function runCopy() {
  // Pre-flight: verify all source files exist
  console.log('🛫  Pre-flight: checking all source files exist…\n');
  let missingCount = 0;
  for (const entry of ASSET_MAP) {
    const srcPdf   = path.join(STUDENT_POSTERS_ROOT, entry.pdf);
    const srcVideo = path.join(STUDENT_POSTERS_ROOT, entry.video);
    const pdfOk    = fs.existsSync(srcPdf);
    const videoOk  = fs.existsSync(srcVideo);
    if (!pdfOk || !videoOk) {
      if (!pdfOk)   console.error(`  ✗ MISSING  ${entry.team} poster: ${entry.pdf}`);
      if (!videoOk) console.error(`  ✗ MISSING  ${entry.team} video:  ${entry.video}`);
      missingCount++;
    } else {
      console.log(`  ✓ ${entry.team}`);
    }
  }

  if (missingCount > 0) {
    console.error(`\n❌  Aborting: ${missingCount} team(s) have missing source files. Fix paths in ASSET_MAP and retry.`);
    process.exit(1);
  }
  console.log('\n✅  All sources found. Starting copy…\n');

  // Copy loop
  let copied = 0, skipped = 0, errors = 0;

  for (const entry of ASSET_MAP) {
    console.log(`[${entry.team}]`);

    const teamDir   = path.join(TEAMS_ROOT, entry.team);
    const assetsDir = path.join(teamDir, 'assets');
    const srcPdf    = path.join(STUDENT_POSTERS_ROOT, entry.pdf);
    const destPdf   = path.join(assetsDir, 'poster.pdf');
    const srcVideo  = path.join(STUDENT_POSTERS_ROOT, entry.video);
    const destVideo = path.join(assetsDir, 'video.mp4');

    const pdfCopied   = copyAsset(srcPdf,   destPdf,   'poster.pdf');
    const videoCopied = copyAsset(srcVideo, destVideo, 'video.mp4');

    if (pdfCopied)   { copied++; } else if (fs.existsSync(destPdf))   { skipped++; } else { errors++; }
    if (videoCopied) { copied++; } else if (fs.existsSync(destVideo)) { skipped++; } else { errors++; }

    // Patch project.json: set poster to .pdf so convert-posters.py picks it up
    const patchFields = {};
    if (pdfCopied) patchFields.poster = 'assets/poster.pdf';
    if (Object.keys(patchFields).length > 0) {
      patchProjectJson(teamDir, patchFields);
    }
  }

  console.log(`\n📦  Copy complete: ${copied} copied, ${skipped} skipped, ${errors} errors\n`);

  if (errors > 0) {
    console.error('❌  Some files had errors. Review output above.');
    process.exit(1);
  }

  // Post-copy validation
  console.log('─'.repeat(60));
  runCheck();
}

// ── Entry point ───────────────────────────────────────────────────────────────

const arg = process.argv[2];
if (arg === '--snapshot') {
  runSnapshot();
} else if (arg === '--check') {
  runCheck();
} else {
  runCopy();
}
