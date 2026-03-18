import React from 'react';

/**
 * SVG Music Staff renderer — renders treble or bass clef with a highlighted note.
 *
 * Props:
 *   clef        — "treble" | "bass"
 *   note        — e.g. "E4", "G4", "B4", "D5", "F5", "G2", "B2", etc.
 *   highlight   — null | "correct" | "incorrect"  (green/red glow on note)
 *   width       — SVG width (default 340)
 *   height      — SVG height (default 180)
 */

// Mapping of note names to Y positions on the staff.
// Staff lines are at y=50,65,80,95,110 (spacing=15).
// Treble clef: bottom line = E4, top line = F5
// Bass clef: bottom line = G2, top line = A3
const TREBLE_NOTE_MAP = {
  C4: 125, D4: 117.5, E4: 110, F4: 102.5, G4: 95,
  A4: 87.5, B4: 80, C5: 72.5, D5: 65, E5: 57.5,
  F5: 50, G5: 42.5, A5: 35,
  // Ledger line notes below
  B3: 132.5, A3: 140,
};

const BASS_NOTE_MAP = {
  E2: 125, F2: 117.5, G2: 110, A2: 102.5, B2: 95,
  C3: 87.5, D3: 80, E3: 72.5, F3: 65, G3: 57.5,
  A3: 50, B3: 42.5, C4: 35,
  // Ledger line notes below
  D2: 132.5, C2: 140,
};

// Determine if a note needs ledger lines
function getLedgerLines(noteY, staffTop, staffBottom, spacing) {
  const lines = [];
  if (noteY >= staffBottom + spacing / 2) {
    // Below the staff
    for (let y = staffBottom + spacing; y <= noteY + spacing / 4; y += spacing) {
      lines.push(y);
    }
  }
  if (noteY <= staffTop - spacing / 2) {
    // Above the staff
    for (let y = staffTop - spacing; y >= noteY - spacing / 4; y -= spacing) {
      lines.push(y);
    }
  }
  return lines;
}

// Treble clef SVG path (simplified)
const TrebleClefPath = ({ x, y }) => (
  <g transform={`translate(${x}, ${y}) scale(0.28)`}>
    <text
      fontSize="150"
      fontFamily="serif"
      fill="#333"
      textAnchor="middle"
      dominantBaseline="central"
    >
      𝄞
    </text>
  </g>
);

// Bass clef SVG path (simplified)
const BassClefPath = ({ x, y }) => (
  <g transform={`translate(${x}, ${y}) scale(0.28)`}>
    <text
      fontSize="150"
      fontFamily="serif"
      fill="#333"
      textAnchor="middle"
      dominantBaseline="central"
    >
      𝄢
    </text>
  </g>
);

const MusicStaff = ({
  clef = 'treble',
  note = 'E4',
  highlight = null,
  width = 340,
  height = 180,
}) => {
  const staffTop = 50;
  const spacing = 15;
  const staffBottom = staffTop + 4 * spacing; // 110
  const staffLeft = 70;
  const staffRight = width - 20;
  const noteX = width / 2 + 20;

  const noteMap = clef === 'bass' ? BASS_NOTE_MAP : TREBLE_NOTE_MAP;
  const noteY = noteMap[note] ?? 80; // default to middle line

  const ledgerLines = getLedgerLines(noteY, staffTop, staffBottom, spacing);

  // Note color based on highlight
  let noteColor = '#222';
  let glowFilter = '';
  if (highlight === 'correct') {
    noteColor = '#22c55e';
    glowFilter = 'url(#glow-correct)';
  } else if (highlight === 'incorrect') {
    noteColor = '#ef4444';
    glowFilter = 'url(#glow-incorrect)';
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* Filters for glow effects */}
      <defs>
        <filter id="glow-correct" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#22c55e" floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-incorrect" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feFlood floodColor="#ef4444" floodOpacity="0.6" />
          <feComposite in2="blur" operator="in" />
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background */}
      <rect width={width} height={height} fill="#fefce8" rx="12" />

      {/* Staff lines */}
      {[0, 1, 2, 3, 4].map(i => (
        <line
          key={i}
          x1={staffLeft}
          y1={staffTop + i * spacing}
          x2={staffRight}
          y2={staffTop + i * spacing}
          stroke="#555"
          strokeWidth="1.2"
        />
      ))}

      {/* Clef symbol */}
      {clef === 'treble' ? (
        <TrebleClefPath x={staffLeft + 18} y={staffTop + 2 * spacing + 2} />
      ) : (
        <BassClefPath x={staffLeft + 18} y={staffTop + 2 * spacing - 4} />
      )}

      {/* Ledger lines */}
      {ledgerLines.map((ly, i) => (
        <line
          key={`ledger-${i}`}
          x1={noteX - 18}
          y1={ly}
          x2={noteX + 18}
          y2={ly}
          stroke="#555"
          strokeWidth="1"
        />
      ))}

      {/* Note head (filled ellipse) */}
      <ellipse
        cx={noteX}
        cy={noteY}
        rx={9}
        ry={6.5}
        fill={noteColor}
        stroke={noteColor}
        strokeWidth="1"
        filter={glowFilter}
        transform={`rotate(-15, ${noteX}, ${noteY})`}
      >
        {highlight && (
          <animate
            attributeName="ry"
            values="6.5;8;6.5"
            dur="0.4s"
            repeatCount="1"
          />
        )}
      </ellipse>

      {/* Note stem */}
      {noteY >= 80 ? (
        // Stem goes up for notes on or below middle line
        <line
          x1={noteX + 8}
          y1={noteY - 2}
          x2={noteX + 8}
          y2={noteY - 35}
          stroke={noteColor}
          strokeWidth="1.5"
        />
      ) : (
        // Stem goes down for notes above middle line
        <line
          x1={noteX - 8}
          y1={noteY + 2}
          x2={noteX - 8}
          y2={noteY + 35}
          stroke={noteColor}
          strokeWidth="1.5"
        />
      )}

      {/* "?" label above/below note when no highlight */}
      {!highlight && (
        <text
          x={noteX}
          y={noteY < 80 ? noteY + 55 : noteY - 45}
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="#f59e0b"
          opacity="0.8"
        >
          ?
        </text>
      )}

      {/* Note label if highlighted (shows the answer) */}
      {highlight && (
        <text
          x={noteX + 25}
          y={noteY + 5}
          fontSize="14"
          fontWeight="bold"
          fill={noteColor}
        >
          {note}
        </text>
      )}
    </svg>
  );
};

export default MusicStaff;
