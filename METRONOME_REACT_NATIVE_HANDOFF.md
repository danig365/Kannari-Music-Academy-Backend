# One-Shot React Native Metronome Prompt

Copy the prompt below and give it directly to your AI coding tool. It is written so the AI can generate the React Native metronome in one pass.

## Single prompt to send

```text
Build a React Native mobile version of the standalone Metronome feature from my existing React web app.

Important constraints:
- This is only for the standalone metronome feature.
- Do not include Rhythm Rush or any other game logic.
- There is no backend for this feature. It is fully local frontend behavior.
- Match the behavior of the web metronome as closely as possible.
- Produce complete React Native code, not pseudocode.
- Use functional components and hooks.
- Assume a modern React Native app structure.
- If audio generation is awkward in pure React Native, use click sample playback with one normal click and one accented click.

Source of truth from the existing project:
- Web metronome logic: /var/www/html/frontend/src/Components/User/Metronome.jsx
- Web metronome styling reference: /var/www/html/frontend/src/Components/User/Metronome.css

Behavior that must be preserved:
- Adjustable BPM with default BPM of 100
- BPM range from 30 to 300
- Nudge buttons for -5, -1, +1, +5 BPM
- Time signatures: 2/4, 3/4, 4/4, 6/8
- Accented first beat of each bar
- Immediate first click when Start is pressed
- While playing, changing BPM or time signature should restart timing cleanly
- Active beat indicator should highlight the current beat
- Tempo name mapping from BPM using this exact logic:
	- <= 40: Grave
	- <= 55: Largo
	- <= 65: Adagio
	- <= 76: Andante
	- <= 108: Moderato
	- <= 120: Allegretto
	- <= 156: Allegro
	- <= 176: Vivace
	- <= 200: Presto
	- > 200: Prestissimo

UI expectations:
- Build a clean mobile-first metronome screen
- Show the title "Metronome"
- Show beat dots for the selected time signature
- Show BPM prominently in the center
- Show the tempo label below BPM
- Include a slider for BPM from 30 to 300
- Include time-signature buttons
- Include one Start/Stop button
- Include a short practice tips section at the bottom
- Keep the visual feel polished and modern, but prioritize behavior over styling fidelity

Technical expectations:
- Implement start, stop, cleanup on unmount, and restart-on-setting-change behavior
- Prevent multiple overlapping timers/audio loops
- Keep state simple and reliable
- If using an audio library, mention which one you chose and why
- If using audio samples, structure the code so accented and normal clicks are easy to swap

Output requirements:
- Return the complete React Native component code
- Return any helper hook or utility code if needed
- Return any styles needed for the component
- Return a short note on any package dependency required for audio playback
- Return brief integration instructions showing where to place the component in a React Native app

Preferred output format:
1. File: MetronomeScreen.jsx or MetronomeScreen.tsx
2. File: metronome audio helper if needed
3. File: styles if separated, otherwise inline StyleSheet is fine
4. Very short integration notes

Use the web source files as behavior reference, but do not reproduce web-only code like window.AudioContext, browser-specific APIs, or CSS.
```

## Minimal command to pair with it

If your AI tool accepts a single natural-language command, use this:

```text
Create the React Native standalone metronome screen using the prompt below exactly.
```

Then paste the full prompt from the section above.

## Reference notes

- Web logic reference: [frontend/src/Components/User/Metronome.jsx](/var/www/html/frontend/src/Components/User/Metronome.jsx)
- Web styling reference: [frontend/src/Components/User/Metronome.css](/var/www/html/frontend/src/Components/User/Metronome.css)
- Games hub entry: [frontend/src/Components/User/StudentGamesHub.jsx#L212](/var/www/html/frontend/src/Components/User/StudentGamesHub.jsx#L212)
- Student route: [frontend/src/Components/Main.jsx#L199](/var/www/html/frontend/src/Components/Main.jsx#L199)
