# Shift Tracker

A system tray app for tracking shift hours. Log your clock-in time and see exactly when you can leave, accounting for your lunch break and a configurable paid-hours goal.

## Setup

```bash
npm install
npm start
```

The app icon appears in your system tray. Click it to toggle the popup. Click anywhere outside to dismiss.

## Features

**Clock events**
- Stamp your morning clock-in with "Now" or type a time manually
- Start and end a lunch break with a single button (lunch time is excluded from paid hours)
- Edit lunch start/end times directly via inline time inputs

**Live session**
- Running clock showing total paid time accumulated
- Progress bar toward your paid-hours goal with percentage
- Status indicator: "Clocked in" or "On lunch break"

**Clock-out calculator**
- Displays the time you need to leave to hit your goal
- Updates in real time as you add or edit times
- Shows a warning badge if no lunch has been entered
- Tray icon tooltip updates to show your target clock-out time

**Goal setting**
- Configurable paid-hours target (default 8h, supports 0.5h increments)

**Shift metrics**
- Morning block duration
- Lunch break duration
- Afternoon time still needed
- Total paid time so far

**Reset and undo**
- "Reset day" clears all entries
- An "Undo" button appears for 8 seconds after a reset

**Window behavior**
- Pin button keeps the window visible when you click away
- Auto-hides on blur when unpinned
- Launches hidden to tray on login
- Single instance: clicking the tray on a second launch focuses the existing window

**Input validation**
- Warns if lunch start is before clock-in or lunch end is before lunch start

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Alt+1 | Stamp morning clock-in |
| Alt+L | Toggle lunch start / end |

## Build a distributable

```bash
npm run build
```

Output goes to `dist/`:

- **Windows** `.exe` installer (NSIS)
- **macOS** `.dmg`
- **Linux** `.AppImage`

## Custom icons

**Tray icon:** Replace `assets/trayIcon.png` (16x16 or 32x32, transparent background). On macOS use a black/white PNG so it adapts to light/dark menu bars.

**App icon:** Replace `assets/icon.ico` with a multi-size `.ico` (16, 32, 48, 256px). Delete `dist/` and rebuild.

> Icon changes on existing shortcuts require reinstalling or manually updating via Properties > Change Icon.

## Project structure

```
shift-tracker-app/
├── main.js             Electron main process (tray, window, IPC)
├── preload.js          Context bridge (renderer <-> main)
├── package.json
├── assets/
│   ├── trayIcon.png
│   └── icon.ico
└── src/
    ├── time-tracker.html
    ├── time-tracker.css
    └── time-tracker.js
```
