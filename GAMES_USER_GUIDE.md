# 🎮 Sonara Games & Gamification — User Guide

> **Kannari Music Academy LMS** — Interactive music games with coins, badges, leaderboards, and analytics.

---

## Table of Contents

1. [Overview](#overview)
2. [Student: Games Hub](#student-games-hub)
3. [Student: Note Ninja](#note-ninja)
4. [Student: Rhythm Rush](#rhythm-rush)
5. [Student: 5-Second Music Challenge](#5-second-music-challenge)
6. [Student: Leaderboard & Badges](#leaderboard--badges)
7. [Student: Sonara Coins](#sonara-coins)
8. [Teacher: Game Performance Dashboard](#teacher-game-performance-dashboard)
9. [Admin: Games Analytics Dashboard](#admin-games-analytics-dashboard)
10. [Access Tiers & Level Gating](#access-tiers--level-gating)
11. [Technical Notes](#technical-notes)

---

## Overview

The Sonara Games system adds three interactive music games to the LMS. Students earn **Sonara Coins** and **badges** by playing, compete on **weekly leaderboards**, and progress through 10 difficulty levels per game.

Teachers can monitor their students' game performance. Admins can view platform-wide analytics and export data as CSV.

---

## Student: Games Hub

**URL:** `https://kannarimusicacademy.com/student/games`

This is the central hub for all game activity. After logging in as a student, click **"Games"** in the left sidebar (look for the 🎮 icon with your coin count displayed beside it).

### Three Tabs

| Tab | What it shows |
|-----|---------------|
| **Games** | Game cards for all 3 games with your stats (level, accuracy, score, streak), a progress bar, and Play button. Also shows your 5 most recent sessions. |
| **Leaderboard** | Weekly leaderboard for each game. Select a game to see rankings by score. Your row is highlighted. |
| **Badges** | All 3 badges — earned ones glow, locked ones show the criteria needed to unlock them. |

### Coins Display

Your total **Sonara Coins** appear in the header and in the sidebar next to the Games link. This auto-refreshes every 60 seconds.

---

## Note Ninja

**URL:** `https://kannarimusicacademy.com/student/games/note-ninja`

**How to play:**
1. From the Games Hub, click **Play** on the Note Ninja card (or navigate directly).
2. You'll see your current stats and a **level selector** (1–10). Select a level you've unlocked.
3. Click **Start Game**. A 3-2-1 countdown begins.
4. A **music staff** displays a note. Four answer buttons appear below.
5. **Identify the note** before the timer runs out (8 seconds per question at Level 1, decreasing at higher levels).
6. You get immediate visual + audio feedback (green flash for correct, red shake for wrong).
7. After all questions, a **summary screen** shows your score, accuracy, streak, coins earned, and whether you leveled up.

**Scoring:**
- Base points per correct answer depend on the question's `points` value (typically 10).
- **Speed bonus:** Answer faster for up to 50% extra points.
- **Streak multiplier:** Consecutive correct answers earn 2× at 3-streak, 3× at 5-streak, etc.
- **Coins formula:** `floor(score × accuracy × (1 + streak_bonus))` — balanced to reward both accuracy and speed.

**Level progression:** Score 70%+ accuracy in a session to unlock the next level.

---

## Rhythm Rush

**URL:** `https://kannarimusicacademy.com/student/games/rhythm-rush`

**How to play:**
1. Select a level and click **Start Game**.
2. A 3-2-1 countdown leads into a **demo phase** — watch and listen to the rhythm pattern played on a visual timeline with metronome clicks.
3. After the demo, a brief "Get Ready" pause, then the **tapping phase** begins.
4. **Tap the large circle** (or press Space/Enter) in time with the rhythm you just heard.
5. Your taps are compared to the expected timestamps. Feedback shows "Perfect", "Good", or "Try Again" with accuracy details.
6. After all patterns, the summary shows your results.

**Scoring:**
- Each tap is scored based on timing accuracy (millisecond precision).
- Within tolerance = "Perfect" (full points), slightly off = "Good" (partial), outside = miss.
- Tolerance tightens at higher levels (150ms at L1 → stricter at L10).

**Tips:**
- Watch the moving playhead during the demo — it shows exact timing.
- The timeline visualizes note positions (quarter notes, eighth notes, rests).
- Works best with audio on for metronome clicks.

---

## 5-Second Music Challenge

**URL:** `https://kannarimusicacademy.com/student/games/music-challenge`

**How to play:**
1. Select a level and click **Start Game**.
2. A 3-2-1 countdown, then rapid-fire trivia begins.
3. Each question gives you **5 seconds** to answer from 4 choices.
4. Questions span 5 categories: 🎸 Instruments, 🎵 Symbols, 🥁 Rhythm, 📖 Theory, 🎹 Composers.
5. A colored category badge shows at the top of each question.
6. Click an answer or press **1-4** on your keyboard for speed.
7. If time runs out, it counts as wrong and the correct answer is revealed.
8. After all questions, a detailed breakdown shows each question's result, time taken, speed bonus, and category.

**Scoring:**
- **Speed bonus:** Answer within 2 seconds for +5 bonus points.
- **Streak multiplier:** Consecutive correct answers boost points.
- Categories rotate randomly for variety.

---

## Leaderboard & Badges

### Weekly Leaderboard

Found in the **Leaderboard** tab of the Games Hub. Rankings reset each week (Monday–Sunday).

- Select any of the 3 games to see that week's rankings.
- Shows rank, player name, score, attempts, accuracy, and best streak.
- Your row is highlighted with a "YOU" tag.

### Badges

Three badges can be earned:

| Badge | Game | Criteria |
|-------|------|----------|
| 🎵 **Note Master** | Note Ninja | Reach Level 5+ with 80%+ accuracy |
| 🥁 **Rhythm King** | Rhythm Rush | Reach Level 5+ with 80%+ accuracy |
| ⚡ **Theory Champion** | Music Challenge | Reach Level 5+ with 80%+ accuracy |

Badges appear in the **Badges** tab. Earned badges glow; locked badges show what's needed.

---

## Sonara Coins

Coins are the platform's game currency, earned by completing game sessions.

- Visible in the **Games Hub header** and the **sidebar** (💰 next to the Games link).
- Coins are earned at the end of each session based on your performance.
- Formula accounts for score, accuracy, and streak bonuses.
- Your total appears across all games combined.

---

## Teacher: Game Performance Dashboard

**URL:** `https://kannarimusicacademy.com/teacher/games-performance`

**How to access:** Log in as a teacher → Click **"Game Performance"** in the left sidebar.

### Features

| Feature | Description |
|---------|-------------|
| **Summary Cards** | Total students with game data, total attempts, average accuracy across all students |
| **Game Filter** | Dropdown to filter by game type (Note Ninja, Rhythm Rush, Music Challenge, or All) |
| **Student Search** | Search bar to find specific students by name |
| **Sortable Table** | Click any column header to sort (Student, Game, Attempts, Accuracy, Best Score, Streak, Level, Coins). Click again to reverse. |
| **Accuracy Bars** | Color-coded accuracy indicators (green ≥75%, amber ≥50%, red <50%) |
| **CSV Export** | Click the **"Export CSV"** button to download all visible data as a spreadsheet |

### Student Cards View

Below the table, each student has a card showing their per-game breakdown with all stats at a glance.

---

## Admin: Games Analytics Dashboard

**URL:** `https://kannarimusicacademy.com/admin-panel/games-analytics`

**How to access:** Log in as admin → Click **"Games Analytics"** in the left sidebar.

### Features

| Section | What it shows |
|---------|--------------|
| **Platform Totals** | Total players, total sessions, total coins issued across all games |
| **Per-Game Cards** | Each game's player count, sessions (completed vs total), avg score, avg accuracy, coins issued, total play time |
| **Engagement Chart** | Bar chart showing sessions per day over the last 30 days |
| **Badge Distribution** | Shows how many students have earned each badge |
| **Top 20 Students** | Ranked leaderboard with total coins, total score, total attempts — top 3 get gold/silver/bronze medals |
| **CSV Export** | Two export buttons: "Export Game Stats" and "Export Top Students" — downloads CSV files |

---

## Access Tiers & Level Gating

Games respect the student's subscription tier:

| Tier | Accessible Levels |
|------|-------------------|
| **Free** | Levels 1–5 |
| **Basic** | Levels 1–7 |
| **Standard** | Levels 1–9 |
| **Premium** | All 10 levels |

- Levels beyond your tier show a lock icon with "Upgrade" tooltip.
- Levels beyond your highest unlocked show a padlock (need to progress by scoring 70%+ accuracy).
- Game-level access (`min_access_level` on each game) can also restrict which games are available per tier.

Currently all 3 games have `min_access_level = free`, so every student can play.

---

## Technical Notes

### API Endpoints (for developers)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/games/` | GET | List all active games |
| `/api/student/{id}/games/overview/` | GET | Student's full game overview (profiles, badges, recent sessions) |
| `/api/student/{id}/games/sonara-coins/` | GET | Lightweight coins balance check |
| `/api/student/{id}/games/{game_type}/start/` | POST | Start a game session (returns questions) |
| `/api/games/session/{id}/attempt/` | POST | Submit an answer/tap attempt |
| `/api/games/session/{id}/finish/` | POST | End session, calculate coins, check badges/level-up |
| `/api/games/leaderboard/{game_type}/` | GET | Weekly leaderboard for a game |
| `/api/teacher/{id}/games/students-performance/` | GET | Teacher's students game data (supports `?game_type=`, `?search=`, `?sort=`, `?dir=`, `?export=csv`) |
| `/api/admin/games/analytics/` | GET | Platform-wide analytics (supports `?export=game_stats_csv`, `?export=top_students_csv`) |

### Database Models

- `GameDefinition` — 3 games (note_ninja, rhythm_rush, music_challenge)
- `GameQuestion` — 133 seeded questions across 10 levels
- `GameSession` — Per-play session tracking
- `GameAttempt` — Per-question attempt records
- `StudentGameProfile` — Aggregated per-student-per-game stats
- `GameBadge` — 3 badge definitions
- `StudentGameBadge` — Earned badge records
- `WeeklyGameLeaderboard` — Weekly ranking snapshots

### Seeding

Games and questions are seeded via: `POST /api/games/seed-phase1/`  
This is idempotent — safe to call multiple times.

### File Locations

| Component | File |
|-----------|------|
| Games Hub | `frontend/src/Components/User/StudentGamesHub.jsx` |
| Note Ninja | `frontend/src/Components/User/NoteNinjaGame.jsx` |
| Rhythm Rush | `frontend/src/Components/User/RhythmRushGame.jsx` |
| Music Challenge | `frontend/src/Components/User/MusicChallengeGame.jsx` |
| Music Staff (SVG) | `frontend/src/Components/User/MusicStaff.jsx` |
| Rhythm Timeline (SVG) | `frontend/src/Components/User/RhythmTimeline.jsx` |
| Teacher Dashboard | `frontend/src/Components/Teacher/TeacherGamesPerformance.jsx` |
| Admin Dashboard | `frontend/src/Components/Admin/AdminGamesAnalytics.jsx` |
| Game API Service | `frontend/src/services/gameService.js` |
| Backend Views | `backend/main/views.py` (game functions near end of file) |
| Backend Models | `backend/main/models.py` (GameDefinition through WeeklyGameLeaderboard) |
| Backend URLs | `backend/main/urls.py` (Phase 1 Games section) |
