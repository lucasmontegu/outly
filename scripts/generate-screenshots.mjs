import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, '../apps/native/assets/screenshots');

// iPhone 6.7" dimensions for App Store
const WIDTH = 1290;
const HEIGHT = 2796;

// Colors
const COLORS = {
  background: '#F8FAFC',
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  text: '#111827',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  lightBg: '#F3F4F6',
};

// Screenshot configurations
const screenshots = [
  {
    filename: 'screenshot-1-risk-score.png',
    headline: 'Know Before You Go',
    subheadline: 'Real-time risk scores for smarter departures',
    content: 'risk-dashboard',
  },
  {
    filename: 'screenshot-2-map.png',
    headline: 'Community Intelligence',
    subheadline: 'See what\'s happening around you',
    content: 'map-view',
  },
  {
    filename: 'screenshot-3-smart-departure.png',
    headline: 'AI-Powered Timing',
    subheadline: 'Leave at the perfect moment',
    content: 'smart-departure',
  },
  {
    filename: 'screenshot-4-gamification.png',
    headline: 'Earn & Level Up',
    subheadline: 'Get rewarded for helping your community',
    content: 'gamification',
  },
];

function createRiskDashboardSVG() {
  return `
    <svg width="1000" height="1600" xmlns="http://www.w3.org/2000/svg">
      <!-- Phone Screen Background -->
      <rect width="1000" height="1600" fill="${COLORS.white}"/>

      <!-- Status Bar Area -->
      <rect width="1000" height="44" fill="${COLORS.white}"/>
      <text x="60" y="30" font-family="SF Pro Display, -apple-system, sans-serif" font-size="17" font-weight="600" fill="${COLORS.text}">9:41</text>

      <!-- Header -->
      <g transform="translate(40, 80)">
        <text font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${COLORS.textMuted}" letter-spacing="0.5">CURRENT LOCATION</text>
        <text y="32" font-family="SF Pro Display, -apple-system, sans-serif" font-size="26" font-weight="700" fill="${COLORS.text}">San Francisco, CA</text>
      </g>

      <!-- Risk Circle -->
      <g transform="translate(500, 380)">
        <!-- Background circle -->
        <circle cx="0" cy="0" r="150" fill="none" stroke="#E5E7EB" stroke-width="20"/>
        <!-- Progress circle (low risk - green) -->
        <circle cx="0" cy="0" r="150" fill="none" stroke="${COLORS.success}" stroke-width="20"
                stroke-dasharray="565" stroke-dashoffset="170" stroke-linecap="round"
                transform="rotate(-90)"/>
        <!-- Score text -->
        <text x="0" y="20" font-family="SF Pro Display, -apple-system, sans-serif" font-size="80" font-weight="700" fill="${COLORS.text}" text-anchor="middle">28</text>
      </g>

      <!-- Risk Badge -->
      <g transform="translate(500, 580)">
        <rect x="-70" y="-18" width="140" height="36" rx="18" fill="#D1FAE5"/>
        <circle cx="-45" cy="0" r="6" fill="${COLORS.success}"/>
        <text x="10" y="6" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" font-weight="700" fill="${COLORS.success}" text-anchor="middle">LOW RISK</text>
      </g>

      <!-- Description -->
      <text x="500" y="660" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" fill="${COLORS.textMuted}" text-anchor="middle">Perfect conditions for your commute.</text>
      <text x="500" y="690" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" fill="${COLORS.textMuted}" text-anchor="middle">Clear skies and light traffic ahead.</text>

      <!-- Weather Card -->
      <g transform="translate(40, 760)">
        <rect width="440" height="160" rx="20" fill="${COLORS.lightBg}"/>
        <circle cx="50" cy="50" r="30" fill="#DBEAFE"/>
        <text x="50" y="58" font-family="SF Pro Display, -apple-system, sans-serif" font-size="28" text-anchor="middle">☀️</text>
        <text x="40" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${COLORS.textMuted}" letter-spacing="0.5">WEATHER</text>
        <text x="40" y="130" font-family="SF Pro Display, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${COLORS.text}">Clear</text>
        <text x="40" y="155" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="#9CA3AF">No rain expected</text>
      </g>

      <!-- Traffic Card -->
      <g transform="translate(520, 760)">
        <rect width="440" height="160" rx="20" fill="${COLORS.lightBg}"/>
        <circle cx="50" cy="50" r="30" fill="#D1FAE5"/>
        <text x="50" y="58" font-family="SF Pro Display, -apple-system, sans-serif" font-size="28" text-anchor="middle">🚗</text>
        <text x="40" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" font-weight="600" fill="${COLORS.textMuted}" letter-spacing="0.5">TRAFFIC</text>
        <text x="40" y="130" font-family="SF Pro Display, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${COLORS.text}">Flowing</text>
        <text x="40" y="155" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="#9CA3AF">No delays expected</text>
      </g>

      <!-- Nearby Signals Section -->
      <g transform="translate(40, 980)">
        <text font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${COLORS.text}">Nearby Signals</text>
        <text x="830" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">View Map</text>
      </g>

      <!-- Signal Card 1 -->
      <g transform="translate(40, 1040)">
        <rect width="920" height="80" rx="14" fill="${COLORS.white}" stroke="#E5E7EB" stroke-width="1"/>
        <rect width="4" height="50" rx="2" y="15" fill="${COLORS.warning}"/>
        <circle cx="50" cy="40" r="24" fill="#FEF3C7"/>
        <text x="50" y="48" font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" text-anchor="middle">⚠️</text>
        <text x="90" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="17" font-weight="600" fill="${COLORS.text}">Construction Zone</text>
        <text x="850" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="#9CA3AF">12m ago</text>
      </g>

      <!-- Signal Card 2 -->
      <g transform="translate(40, 1140)">
        <rect width="920" height="80" rx="14" fill="${COLORS.white}" stroke="#E5E7EB" stroke-width="1"/>
        <rect width="4" height="50" rx="2" y="15" fill="${COLORS.primary}"/>
        <circle cx="50" cy="40" r="24" fill="#DBEAFE"/>
        <text x="50" y="48" font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" text-anchor="middle">🌧️</text>
        <text x="90" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="17" font-weight="600" fill="${COLORS.text}">Light Rain Reported</text>
        <text x="850" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="#9CA3AF">25m ago</text>
      </g>
    </svg>
  `;
}

function createMapViewSVG() {
  return `
    <svg width="1000" height="1600" xmlns="http://www.w3.org/2000/svg">
      <!-- Map Background (simplified) -->
      <rect width="1000" height="1600" fill="#E8F4E8"/>

      <!-- Map "roads" -->
      <line x1="0" y1="400" x2="1000" y2="400" stroke="#FFFFFF" stroke-width="30"/>
      <line x1="0" y1="700" x2="1000" y2="700" stroke="#FFFFFF" stroke-width="40"/>
      <line x1="300" y1="0" x2="300" y2="1600" stroke="#FFFFFF" stroke-width="25"/>
      <line x1="700" y1="0" x2="700" y2="1600" stroke="#FFFFFF" stroke-width="35"/>
      <line x1="500" y1="200" x2="500" y2="1200" stroke="#FFFFFF" stroke-width="20"/>

      <!-- Search Bar -->
      <g transform="translate(30, 80)">
        <rect width="940" height="56" rx="14" fill="${COLORS.white}" filter="url(#shadow)"/>
        <text x="60" y="36" font-family="SF Pro Display, -apple-system, sans-serif" font-size="17" fill="#9CA3AF">🔍  Search location...</text>
      </g>

      <!-- Event Markers -->
      <!-- Marker 1 - Red (High severity) -->
      <g transform="translate(350, 500)">
        <circle cx="0" cy="0" r="100" fill="#EF444420"/>
        <circle cx="0" cy="0" r="35" fill="${COLORS.white}" stroke="${COLORS.danger}" stroke-width="4"/>
        <text x="0" y="8" font-family="SF Pro Display, -apple-system, sans-serif" font-size="24" text-anchor="middle">⚡</text>
      </g>

      <!-- Marker 2 - Yellow (Medium severity) -->
      <g transform="translate(650, 350)">
        <circle cx="0" cy="0" r="70" fill="#F59E0B20"/>
        <circle cx="0" cy="0" r="30" fill="${COLORS.white}" stroke="${COLORS.warning}" stroke-width="4"/>
        <text x="0" y="8" font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" text-anchor="middle">🚧</text>
      </g>

      <!-- Marker 3 - Blue (Low severity) -->
      <g transform="translate(500, 800)">
        <circle cx="0" cy="0" r="60" fill="#3B82F620"/>
        <circle cx="0" cy="0" r="28" fill="${COLORS.white}" stroke="${COLORS.primary}" stroke-width="4"/>
        <text x="0" y="7" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" text-anchor="middle">🌧️</text>
      </g>

      <!-- User Location -->
      <g transform="translate(500, 600)">
        <circle cx="0" cy="0" r="20" fill="${COLORS.primary}" stroke="${COLORS.white}" stroke-width="4"/>
        <circle cx="0" cy="0" r="8" fill="${COLORS.white}"/>
      </g>

      <!-- Events Badge -->
      <g transform="translate(30, 180)">
        <rect width="180" height="44" rx="22" fill="${COLORS.white}"/>
        <text x="90" y="29" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#374151" text-anchor="middle">3 signals nearby</text>
      </g>

      <!-- Event Detail Card -->
      <g transform="translate(30, 1200)">
        <rect width="940" height="280" rx="24" fill="${COLORS.white}"/>

        <!-- Event Header -->
        <circle cx="60" cy="60" r="30" fill="#FEE2E2"/>
        <text x="60" y="68" font-family="SF Pro Display, -apple-system, sans-serif" font-size="24" text-anchor="middle">⚡</text>

        <text x="110" y="50" font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${COLORS.text}">Power Outage</text>
        <text x="110" y="75" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="${COLORS.textMuted}">Reported 8m ago</text>

        <!-- Confidence Badge -->
        <rect x="750" y="35" width="160" height="50" rx="10" fill="#D1FAE5"/>
        <text x="830" y="55" font-family="SF Pro Display, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#059669" text-anchor="middle">High Confidence</text>
        <text x="830" y="75" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#059669" text-anchor="middle">87%</text>

        <!-- Voting Section -->
        <text x="40" y="140" font-family="SF Pro Display, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#9CA3AF" letter-spacing="0.5">IS THIS STILL HAPPENING?</text>

        <!-- Vote Buttons -->
        <rect x="40" y="160" width="280" height="55" rx="12" fill="#D1FAE5"/>
        <text x="180" y="195" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#059669" text-anchor="middle">✓ Yes</text>

        <rect x="340" y="160" width="280" height="55" rx="12" fill="${COLORS.lightBg}"/>
        <text x="480" y="195" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${COLORS.textMuted}" text-anchor="middle">Cleared</text>

        <rect x="640" y="160" width="280" height="55" rx="12" fill="#FEE2E2"/>
        <text x="780" y="195" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#DC2626" text-anchor="middle">✗ Not Here</text>
      </g>

      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="8" flood-opacity="0.1"/>
        </filter>
      </defs>
    </svg>
  `;
}

function createSmartDepartureSVG() {
  return `
    <svg width="1000" height="1600" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1600" fill="${COLORS.white}"/>

      <!-- Header -->
      <g transform="translate(0, 60)">
        <text x="500" y="30" font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${COLORS.text}" text-anchor="middle">Smart Departure</text>
        <text x="500" y="55" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" font-weight="500" fill="#9CA3AF" letter-spacing="0.5" text-anchor="middle">TO DOWNTOWN OFFICE</text>
      </g>

      <!-- Best Window Card -->
      <g transform="translate(40, 140)">
        <rect width="920" height="340" rx="24" fill="${COLORS.white}" stroke="#E5E7EB" stroke-width="1"/>

        <!-- Best Window Badge -->
        <rect x="30" y="30" width="140" height="36" rx="10" fill="#D1FAE5"/>
        <text x="100" y="54" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" font-weight="700" fill="#059669" text-anchor="middle">✨ BEST WINDOW</text>

        <!-- Duration -->
        <text x="780" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" fill="#9CA3AF">Estimated Duration</text>
        <text x="780" y="75" font-family="SF Pro Display, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${COLORS.text}">32 min</text>

        <!-- Big Time -->
        <text x="40" y="200" font-family="SF Pro Display, -apple-system, sans-serif" font-size="100" font-weight="700" fill="${COLORS.text}">08:15</text>
        <text x="40" y="240" font-family="SF Pro Display, -apple-system, sans-serif" font-size="28" font-weight="500" fill="#9CA3AF">AM</text>

        <!-- Savings Text -->
        <text x="40" y="300" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" fill="${COLORS.textMuted}">Leaving at 08:15 AM saves you approx. <tspan font-weight="700" fill="${COLORS.text}">14 minutes</tspan></text>
        <text x="40" y="325" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" fill="${COLORS.textMuted}">and avoids the approaching storm front.</text>
      </g>

      <!-- Forecast Section -->
      <g transform="translate(40, 520)">
        <text font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#9CA3AF" letter-spacing="0.5">NEXT 6 HOURS FORECAST</text>
      </g>

      <!-- Timeline Item 1 - High Risk (Current) -->
      <g transform="translate(40, 580)">
        <circle cx="20" cy="60" r="10" fill="${COLORS.danger}"/>
        <line x1="20" y1="75" x2="20" y2="180" stroke="#E5E7EB" stroke-width="3"/>

        <g transform="translate(60, 0)">
          <rect width="860" height="150" rx="18" fill="${COLORS.lightBg}"/>
          <text x="30" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#9CA3AF">Now (7:45 AM)</text>
          <rect x="680" y="25" width="140" height="32" rx="8" fill="#FEE2E2"/>
          <text x="750" y="47" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${COLORS.danger}" text-anchor="middle">High Risk (78)</text>
          <text x="30" y="90" font-family="SF Pro Display, -apple-system, sans-serif" font-size="15" fill="#9CA3AF">☁️ Storming</text>
          <text x="200" y="90" font-family="SF Pro Display, -apple-system, sans-serif" font-size="15" fill="#9CA3AF">🚗 Congested</text>
        </g>
      </g>

      <!-- Timeline Item 2 - Low Risk (Recommended) -->
      <g transform="translate(40, 780)">
        <circle cx="20" cy="60" r="14" fill="${COLORS.success}"/>
        <line x1="20" y1="80" x2="20" y2="230" stroke="#E5E7EB" stroke-width="3"/>

        <g transform="translate(60, 0)">
          <rect width="860" height="200" rx="18" fill="#F0FDF4" stroke="${COLORS.success}" stroke-width="3"/>
          <text x="30" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" font-weight="700" fill="${COLORS.text}">08:15 AM</text>
          <rect x="660" y="25" width="160" height="32" rx="8" fill="#D1FAE5"/>
          <text x="740" y="47" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${COLORS.success}" text-anchor="middle">Lowest Risk (12)</text>
          <text x="30" y="90" font-family="SF Pro Display, -apple-system, sans-serif" font-size="15" fill="${COLORS.textMuted}">☀️ Clearing Up</text>
          <text x="200" y="90" font-family="SF Pro Display, -apple-system, sans-serif" font-size="15" fill="${COLORS.success}">✓ Traffic Flowing</text>

          <!-- Insight Box -->
          <rect x="30" y="115" width="800" height="60" rx="12" fill="#FEF9C3"/>
          <text x="60" y="150" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="#92400E">✨ Traffic clears up after the school run and the storm cell passes East.</text>
        </g>
      </g>

      <!-- Timeline Item 3 - Medium Risk -->
      <g transform="translate(40, 1030)">
        <circle cx="20" cy="60" r="10" fill="${COLORS.warning}"/>

        <g transform="translate(60, 0)">
          <rect width="860" height="140" rx="18" fill="${COLORS.lightBg}"/>
          <text x="30" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" font-weight="700" fill="${COLORS.text}">09:00 AM</text>
          <rect x="680" y="25" width="140" height="32" rx="8" fill="#FEF3C7"/>
          <text x="750" y="47" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" font-weight="600" fill="${COLORS.warning}" text-anchor="middle">Med Risk (45)</text>
          <text x="30" y="90" font-family="SF Pro Display, -apple-system, sans-serif" font-size="15" fill="${COLORS.textMuted}">☁️ Overcast</text>
          <text x="200" y="90" font-family="SF Pro Display, -apple-system, sans-serif" font-size="15" fill="${COLORS.warning}">⚠️ Road Work Starts</text>
        </g>
      </g>

      <!-- Bottom CTA -->
      <g transform="translate(40, 1430)">
        <rect width="920" height="70" rx="16" fill="${COLORS.text}"/>
        <text x="460" y="45" font-family="SF Pro Display, -apple-system, sans-serif" font-size="18" font-weight="600" fill="${COLORS.white}" text-anchor="middle">🔔 Set Alert for 08:15 AM</text>
      </g>
    </svg>
  `;
}

function createGamificationSVG() {
  return `
    <svg width="1000" height="1600" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1600" fill="${COLORS.white}"/>

      <!-- Header -->
      <g transform="translate(0, 60)">
        <text x="500" y="30" font-family="SF Pro Display, -apple-system, sans-serif" font-size="22" font-weight="700" fill="${COLORS.text}" text-anchor="middle">My Impact</text>
      </g>

      <!-- Level Card -->
      <g transform="translate(40, 120)">
        <rect width="920" height="200" rx="24" fill="linear-gradient(135deg, #3B82F6, #8B5CF6)"/>
        <rect width="920" height="200" rx="24" fill="${COLORS.primary}"/>

        <!-- Level Badge -->
        <circle cx="100" cy="100" r="55" fill="${COLORS.white}" fill-opacity="0.2"/>
        <text x="100" y="115" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" font-weight="700" fill="${COLORS.white}" text-anchor="middle">7</text>

        <text x="180" y="75" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" font-weight="600" fill="${COLORS.white}" fill-opacity="0.8">LEVEL</text>
        <text x="180" y="110" font-family="SF Pro Display, -apple-system, sans-serif" font-size="28" font-weight="700" fill="${COLORS.white}">Community Guardian</text>

        <!-- Progress Bar -->
        <rect x="180" y="130" width="700" height="12" rx="6" fill="${COLORS.white}" fill-opacity="0.2"/>
        <rect x="180" y="130" width="490" height="12" rx="6" fill="${COLORS.white}"/>
        <text x="180" y="165" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="${COLORS.white}" fill-opacity="0.8">2,450 / 3,500 XP to Level 8</text>
      </g>

      <!-- Stats Row -->
      <g transform="translate(40, 360)">
        <!-- Reports Stat -->
        <g>
          <rect width="285" height="130" rx="18" fill="${COLORS.lightBg}"/>
          <text x="142" y="50" font-family="SF Pro Display, -apple-system, sans-serif" font-size="36" font-weight="700" fill="${COLORS.text}" text-anchor="middle">47</text>
          <text x="142" y="80" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="${COLORS.textMuted}" text-anchor="middle">Reports Made</text>
          <text x="142" y="110" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" fill="${COLORS.success}" text-anchor="middle">↑ 12 this week</text>
        </g>

        <!-- Confirmations Stat -->
        <g transform="translate(315, 0)">
          <rect width="285" height="130" rx="18" fill="${COLORS.lightBg}"/>
          <text x="142" y="50" font-family="SF Pro Display, -apple-system, sans-serif" font-size="36" font-weight="700" fill="${COLORS.text}" text-anchor="middle">156</text>
          <text x="142" y="80" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="${COLORS.textMuted}" text-anchor="middle">Confirmations</text>
          <text x="142" y="110" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" fill="${COLORS.success}" text-anchor="middle">92% accuracy</text>
        </g>

        <!-- Trust Score Stat -->
        <g transform="translate(630, 0)">
          <rect width="285" height="130" rx="18" fill="${COLORS.lightBg}"/>
          <text x="142" y="50" font-family="SF Pro Display, -apple-system, sans-serif" font-size="36" font-weight="700" fill="${COLORS.success}" text-anchor="middle">94</text>
          <text x="142" y="80" font-family="SF Pro Display, -apple-system, sans-serif" font-size="14" fill="${COLORS.textMuted}" text-anchor="middle">Trust Score</text>
          <text x="142" y="110" font-family="SF Pro Display, -apple-system, sans-serif" font-size="13" fill="${COLORS.success}" text-anchor="middle">Excellent</text>
        </g>
      </g>

      <!-- Badges Section -->
      <g transform="translate(40, 530)">
        <text font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${COLORS.text}">Earned Badges</text>
        <text x="810" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${COLORS.primary}">View All</text>
      </g>

      <!-- Badge Cards -->
      <g transform="translate(40, 590)">
        <!-- Badge 1 -->
        <g>
          <rect width="295" height="160" rx="18" fill="${COLORS.lightBg}"/>
          <text x="147" y="60" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" text-anchor="middle">🏆</text>
          <text x="147" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${COLORS.text}" text-anchor="middle">Early Bird</text>
          <text x="147" y="125" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">50 morning reports</text>
        </g>

        <!-- Badge 2 -->
        <g transform="translate(315, 0)">
          <rect width="295" height="160" rx="18" fill="${COLORS.lightBg}"/>
          <text x="147" y="60" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" text-anchor="middle">⚡</text>
          <text x="147" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${COLORS.text}" text-anchor="middle">Quick Reporter</text>
          <text x="147" y="125" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">First to report 10x</text>
        </g>

        <!-- Badge 3 -->
        <g transform="translate(630, 0)">
          <rect width="295" height="160" rx="18" fill="${COLORS.lightBg}"/>
          <text x="147" y="60" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" text-anchor="middle">🎯</text>
          <text x="147" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${COLORS.text}" text-anchor="middle">Accuracy Pro</text>
          <text x="147" y="125" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">95%+ accuracy</text>
        </g>
      </g>

      <!-- More Badges Row -->
      <g transform="translate(40, 780)">
        <!-- Badge 4 -->
        <g>
          <rect width="295" height="160" rx="18" fill="${COLORS.lightBg}"/>
          <text x="147" y="60" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" text-anchor="middle">🌟</text>
          <text x="147" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${COLORS.text}" text-anchor="middle">Weather Watcher</text>
          <text x="147" y="125" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">100 weather reports</text>
        </g>

        <!-- Badge 5 -->
        <g transform="translate(315, 0)">
          <rect width="295" height="160" rx="18" fill="${COLORS.lightBg}"/>
          <text x="147" y="60" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" text-anchor="middle">🚀</text>
          <text x="147" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${COLORS.text}" text-anchor="middle">7-Day Streak</text>
          <text x="147" y="125" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Active 7 days straight</text>
        </g>

        <!-- Badge 6 (Locked) -->
        <g transform="translate(630, 0)">
          <rect width="295" height="160" rx="18" fill="${COLORS.lightBg}" fill-opacity="0.5"/>
          <text x="147" y="60" font-family="SF Pro Display, -apple-system, sans-serif" font-size="50" text-anchor="middle" opacity="0.3">🔒</text>
          <text x="147" y="100" font-family="SF Pro Display, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#9CA3AF" text-anchor="middle">Traffic Master</text>
          <text x="147" y="125" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="#9CA3AF" text-anchor="middle">200 traffic reports</text>
        </g>
      </g>

      <!-- Weekly Activity -->
      <g transform="translate(40, 990)">
        <text font-family="SF Pro Display, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${COLORS.text}">This Week's Activity</text>
      </g>

      <g transform="translate(40, 1050)">
        <rect width="920" height="140" rx="18" fill="${COLORS.lightBg}"/>

        <!-- Activity Bars -->
        <g transform="translate(60, 30)">
          <rect x="0" y="60" width="80" height="40" rx="6" fill="#D1FAE5"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Mon</text>
        </g>
        <g transform="translate(180, 30)">
          <rect x="0" y="30" width="80" height="70" rx="6" fill="#D1FAE5"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Tue</text>
        </g>
        <g transform="translate(300, 30)">
          <rect x="0" y="50" width="80" height="50" rx="6" fill="#D1FAE5"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Wed</text>
        </g>
        <g transform="translate(420, 30)">
          <rect x="0" y="20" width="80" height="80" rx="6" fill="${COLORS.success}"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Thu</text>
        </g>
        <g transform="translate(540, 30)">
          <rect x="0" y="40" width="80" height="60" rx="6" fill="#D1FAE5"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Fri</text>
        </g>
        <g transform="translate(660, 30)">
          <rect x="0" y="70" width="80" height="30" rx="6" fill="#E5E7EB"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Sat</text>
        </g>
        <g transform="translate(780, 30)">
          <rect x="0" y="80" width="80" height="20" rx="6" fill="#E5E7EB"/>
          <text x="40" y="120" font-family="SF Pro Display, -apple-system, sans-serif" font-size="12" fill="${COLORS.textMuted}" text-anchor="middle">Sun</text>
        </g>
      </g>
    </svg>
  `;
}

function createFullScreenshotSVG(headline, subheadline, contentSVG) {
  return `
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.background}"/>

      <!-- Headline Area -->
      <g transform="translate(0, 100)">
        <text x="${WIDTH/2}" y="0" font-family="SF Pro Display, -apple-system, sans-serif" font-size="72" font-weight="700" fill="${COLORS.text}" text-anchor="middle">${headline}</text>
        <text x="${WIDTH/2}" y="70" font-family="SF Pro Display, -apple-system, sans-serif" font-size="36" font-weight="400" fill="${COLORS.textMuted}" text-anchor="middle">${subheadline}</text>
      </g>

      <!-- Phone Frame -->
      <g transform="translate(145, 320)">
        <!-- Phone outer frame -->
        <rect width="1000" height="2100" rx="60" fill="#1F2937"/>

        <!-- Phone screen -->
        <rect x="20" y="20" width="960" height="2060" rx="45" fill="${COLORS.white}"/>

        <!-- Dynamic Island -->
        <rect x="340" y="35" width="320" height="40" rx="20" fill="#1F2937"/>

        <!-- Content placeholder - scaled down -->
        <g transform="translate(20, 80) scale(0.96)">
          ${contentSVG}
        </g>
      </g>
    </svg>
  `;
}

async function generateScreenshots() {
  console.log('Generating App Store screenshots...\n');

  const contentGenerators = {
    'risk-dashboard': createRiskDashboardSVG,
    'map-view': createMapViewSVG,
    'smart-departure': createSmartDepartureSVG,
    'gamification': createGamificationSVG,
  };

  for (const screenshot of screenshots) {
    const contentSVG = contentGenerators[screenshot.content]();
    const fullSVG = createFullScreenshotSVG(screenshot.headline, screenshot.subheadline, contentSVG);

    const outputPath = path.join(SCREENSHOTS_DIR, screenshot.filename);

    await sharp(Buffer.from(fullSVG))
      .resize(WIDTH, HEIGHT)
      .png()
      .toFile(outputPath);

    console.log(`✓ Generated: ${screenshot.filename}`);
    console.log(`  Headline: "${screenshot.headline}"`);
    console.log(`  Size: ${WIDTH}x${HEIGHT}px\n`);
  }

  console.log(`\nAll screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log('\nThese screenshots are ready for iPhone 6.7" (Pro Max) in App Store Connect.');
}

generateScreenshots().catch(console.error);
