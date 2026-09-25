// Cyberpunk Matrix style artwork matching the user's screenshot
export const SAMPLE_MATRIX_POSTER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#021a0e"/>
      <stop offset="50%" stop-color="#052818"/>
      <stop offset="100%" stop-color="#010e07"/>
    </linearGradient>
    <linearGradient id="neonGreen" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#22c55e"/>
      <stop offset="100%" stop-color="#4ade80"/>
    </linearGradient>
    <radialGradient id="faceLight" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#86efac" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Dark Matrix Background -->
  <rect width="600" height="450" fill="url(#bgGrad)"/>

  <!-- Matrix Digital Rain Columns -->
  <g font-family="monospace" font-size="12" fill="#22c55e" opacity="0.6">
    <text x="30" y="30">0 1 1 0 1 0 0 1</text>
    <text x="30" y="60">1 0 0 1 0 1 1 0</text>
    <text x="30" y="90">0 1 0 1 1 0 0 1</text>
    <text x="30" y="120">1 1 0 0 1 0 1 0</text>
    <text x="30" y="150">0 0 1 1 0 1 0 1</text>
    <text x="30" y="180">1 0 1 0 0 1 1 0</text>

    <text x="80" y="40">M A T R I X</text>
    <text x="80" y="70">R E L O A D</text>
    <text x="80" y="100">0 1 0 1 1 0 1</text>
    <text x="80" y="130">H A C K E R</text>
    <text x="80" y="160">1 1 0 1 0 0 1</text>
    <text x="80" y="190">S W A G 2 0</text>

    <text x="480" y="40">1 0 1 1 0 1 0</text>
    <text x="480" y="70">D E S I 9 9</text>
    <text x="480" y="100">0 1 0 0 1 1 0</text>
    <text x="480" y="130">C O D E R X</text>
    <text x="480" y="160">1 0 1 0 1 0 1</text>
    <text x="480" y="190">0 1 1 0 0 1 0</text>

    <text x="530" y="50">0 1 0 1</text>
    <text x="530" y="80">1 1 0 0</text>
    <text x="530" y="110">G Y N X</text>
    <text x="530" y="140">0 1 1 1</text>
    <text x="530" y="170">1 0 0 1</text>
  </g>

  <!-- Green Neon Ambient Glow -->
  <circle cx="300" cy="220" r="180" fill="url(#faceLight)"/>

  <!-- Character Silhouette & Hoodie -->
  <!-- Hoodie Body -->
  <path d="M160 450 C 180 320, 230 260, 300 260 C 370 260, 420 320, 440 450 Z" fill="#08140e"/>
  <!-- Hoodie outline neon rim -->
  <path d="M165 450 C 185 325, 235 265, 300 265 C 365 265, 415 325, 435 450" stroke="#22c55e" stroke-width="2" fill="none" opacity="0.4"/>

  <!-- Zipper & Drawstrings -->
  <line x1="300" y1="280" x2="300" y2="450" stroke="#4ade80" stroke-width="2.5"/>
  <circle cx="300" cy="290" r="4" fill="#86efac"/>

  <!-- Hood Shape -->
  <path d="M210 240 C 190 120, 240 60, 300 60 C 360 60, 410 120, 390 240 C 370 280, 230 280, 210 240 Z" fill="#051009"/>

  <!-- Face -->
  <path d="M245 160 C 245 230, 300 250, 300 250 C 300 250, 355 230, 355 160 C 355 110, 300 110, 300 110 C 300 110, 245 110, 245 160 Z" fill="#1b3f2b"/>

  <!-- Neck Tattoo / Red Cyber Symbol -->
  <path d="M290 230 L310 230 L305 240 L315 240 L295 252 L300 242 L290 242 Z" fill="#ef4444" opacity="0.85"/>

  <!-- Hair Bangs falling over forehead -->
  <path d="M245 135 C 265 155, 280 140, 295 160 C 310 145, 330 160, 350 135 C 340 120, 260 120, 245 135 Z" fill="#040c07"/>

  <!-- Eyes with intense gaze & green rim light -->
  <ellipse cx="275" cy="168" rx="10" ry="4" fill="#020804"/>
  <ellipse cx="325" cy="168" rx="10" ry="4" fill="#020804"/>
  <circle cx="276" cy="167" r="2.5" fill="#4ade80"/>
  <circle cx="326" cy="167" r="2.5" fill="#4ade80"/>
  <circle cx="277" cy="166" r="0.8" fill="#ffffff"/>
  <circle cx="327" cy="166" r="0.8" fill="#ffffff"/>

  <!-- Nose & Lips -->
  <path d="M298 175 L296 190 L304 190" stroke="#22c55e" stroke-width="1.2" fill="none" opacity="0.6"/>
  <line x1="288" y1="204" x2="312" y2="204" stroke="#14532d" stroke-width="2"/>

  <!-- Ear Piercings / Ring -->
  <circle cx="240" cy="180" r="3" stroke="#86efac" stroke-width="1.5" fill="none"/>

  <!-- Hand holding cigarette with glowing red tip & smoke -->
  <g transform="translate(180, 230)">
    <!-- Hand -->
    <path d="M10 90 C 20 60, 40 50, 50 60 C 55 65, 50 85, 40 100 Z" fill="#1b3f2b"/>
    <!-- Cigarette -->
    <line x1="15" y1="65" x2="55" y2="55" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
    <circle cx="13" cy="65.5" r="2.5" fill="#f97316"/>
    <!-- Smoke rising in wisps -->
    <path d="M10 60 C 5 45, 20 35, 10 20 C 5 10, 15 5, 8 0" stroke="#86efac" stroke-width="1.8" fill="none" opacity="0.4" stroke-dasharray="3,2"/>
  </g>

  <!-- Green Border Glow -->
  <rect x="2" y="2" width="596" height="446" rx="16" fill="none" stroke="#22c55e" stroke-width="2" opacity="0.5"/>
</svg>`;
