# XOXO.array

<p align="center">
  <strong>Browser tic-tac-toe with array-backed state, undo, and a minimax opponent.</strong><br>
  Vanilla HTML, CSS, and JavaScript. No build step.
</p>

<p align="center">
  <a href="https://case-study-1-dsa-g3.vercel.app/">Live Demo</a>
  &nbsp;&middot;&nbsp;
  <a href="https://cikeyz.github.io/xoxo-array/">GitHub Pages</a>
  &nbsp;&middot;&nbsp;
  <a href="#quick-start">Quick Start</a>
  &nbsp;&middot;&nbsp;
  <a href="#project-structure">Structure</a>
  &nbsp;&middot;&nbsp;
  <a href="#license">License</a>
</p>

<p align="center">
  <img alt="HTML5" src="https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white">
  <img alt="CSS3" src="https://img.shields.io/badge/CSS3-1572B6?logo=css&logoColor=white">
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=111111">
  <img alt="License MIT" src="https://img.shields.io/badge/License-MIT-22c55e?logo=open-source-initiative&logoColor=white">
</p>

## Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Other experiments](#other-experiments)
- [License](#license)
- [Course Note](#course-note)

## Overview

XOXO.array is a polished tic-tac-toe client that keeps the board, move history,
and win checks in plain JavaScript arrays. Play local two-player or against a
minimax AI, track scores and move timing, and switch themes without leaving the page.

## Features

| Feature | Description |
|---------|-------------|
| Array board | 9-cell board with move history for undo |
| Modes | Local two-player or single-player vs minimax AI |
| Scoreboard | Running X/O scores, move count, and session timer |
| Themes | Multiple visual themes from the side panel |
| Controls | New game, undo last move, reset stats |

## Quick Start

```bash
git clone https://github.com/cikeyz/xoxo-array.git
cd xoxo-array
python -m http.server 8000
```

Open http://127.0.0.1:8000/

## Project Structure

```text
xoxo-array/
├── index.html
├── game.js
├── styles.css
├── LICENSE
├── README.md
└── .gitignore
```

## Other experiments

| Branch | Notes |
|--------|-------|
| `experiment/super-tictactoe` | Post-course Super TICTACTOE playground. Not the submitted case study; do not merge into `main`. |

## License

MIT. See [LICENSE](LICENSE).

## Course Note

Built for CMPE 201 (Data Structures and Algorithms), Polytechnic University of
the Philippines, under Engr. Julius S. Cansino. Final project case study.
Published here as a standalone project.
