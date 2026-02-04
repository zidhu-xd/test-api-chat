# Hidden Calculator Chat - Design Guidelines

## Brand Identity

**Purpose**: A stealth communication app disguised as a standard calculator, enabling private paired conversations with maximum security and deniability.

**Aesthetic Direction**: Dual personality - deceptively normal calculator frontend with a sleek, WhatsApp-inspired chat backend. The calculator must be INDISTINGUISHABLE from a real Android calculator. The hidden chat should feel premium, modern, and secure.

**Memorable Element**: The seamless transition from mundane calculator to secure chat when unlocked - users will remember the "nothing to see here" perfection of the disguise.

## Navigation Architecture

**Root Navigation**: Stack-only (no tabs, no drawer - stealth first)

**Screen Hierarchy**:
1. Calculator (default/always visible on launch)
2. Pairing Flow (shown once on first unlock)
   - Generate or Enter Code
   - Code Display (if generating)
   - Code Entry (if entering)
3. Hidden Chat (accessible after pairing, locks immediately on exit)

## Screen-by-Screen Specifications

### Calculator Screen
- **Purpose**: Fully functional calculator + disguised app launcher
- **Layout**:
  - No header (calculator occupies full screen)
  - Display area: top 35% showing live preview and result
  - Button grid: bottom 65% with 4 columns × 5 rows
  - Top inset: insets.top + Spacing.md
  - Bottom inset: insets.bottom + Spacing.md
- **Components**:
  - Live preview text (small, gray, top-aligned in display)
  - Result text (large, bold, bottom-aligned in display)
  - Number buttons (0-9)
  - Operator buttons (+, −, ×, ÷)
  - Special buttons (C, =, %, .)
- **Visual Specifications**:
  - Display: light gray background (#F5F5F5)
  - Number buttons: white with subtle shadow
  - Operator buttons: orange accent (#FF9500)
  - Equals button: visually identical to operators
  - Button press: subtle scale animation (0.95)
  - Must match Android calculator aesthetic EXACTLY

### Pairing Flow Screens
- **Purpose**: One-time setup to link two devices
- **Layout**:
  - Transparent header with back button (left) and close button (right)
  - Scrollable content area with centered card
  - Top inset: headerHeight + Spacing.xl
  - Bottom inset: insets.bottom + Spacing.xl
- **Generate or Enter Screen**:
  - Two large buttons: "Generate Pairing Code" and "Enter Pairing Code"
  - Subtitle explaining pairing (small, muted text)
- **Code Display Screen** (if generating):
  - Large 4-digit code (display only, 48pt, monospace)
  - Expiry timer (7:00 counting down, red when <2 min)
  - "Waiting for partner..." status text
- **Code Entry Screen** (if entering):
  - 4-digit PIN input (numeric keyboard)
  - Submit button below input
  - Error message area for invalid/expired codes
- **Visual Specifications**:
  - Cards: white surface with rounded corners (12pt radius)
  - Buttons: full-width, rounded (8pt radius), primary color fill
  - Code text: monospace font, letter-spacing: 8pt

### Hidden Chat Screen
- **Purpose**: Secure paired conversation
- **Layout**:
  - Custom header: transparent background
    - Left: back/lock button (exits to calculator immediately)
    - Right: three-dot menu (Clear Chat option)
  - Messages list (inverted scroll, new messages at bottom)
  - Fixed input bar at bottom with send button
  - Top inset: headerHeight + Spacing.md
  - Bottom inset: insets.bottom + Spacing.md (no tab bar)
- **Components**:
  - Message bubbles (sender: brown #8B5A3C, receiver: dark gray #3A3A3A)
  - Typing indicator (three animated dots in receiver bubble)
  - Read receipts (gray tick: sent, double blue tick: read)
  - Input field with rounded background
  - Send button (paper plane icon, disabled when empty)
- **Visual Specifications**:
  - Background: subtle gradient (light gray to white)
  - Bubbles: rounded (18pt radius), max-width 75%, padding 12pt
  - Text: white on colored bubbles, 16pt
  - Typing dots: 6pt circles, stagger animation (0.3s delay)
  - Ticks: 12pt, positioned bottom-right of sender bubble
  - Input bar: white background, shadow, 50pt height
  - Animations: smooth iOS-style (spring physics, 60fps)
  - Screenshot protection: ENABLED
  - Notification behavior: NO content preview

## Color Palette

**Calculator Mode**:
- Display Background: #F5F5F5
- Button Background: #FFFFFF
- Operator Accent: #FF9500
- Text Primary: #000000
- Text Secondary: #8E8E93

**Chat Mode**:
- Primary (Sender Bubble): #8B5A3C (warm brown)
- Secondary (Receiver Bubble): #3A3A3A (dark gray)
- Background Gradient: #F0F0F0 → #FFFFFF
- Surface (Input Bar): #FFFFFF
- Text on Bubbles: #FFFFFF
- Text Secondary: #8E8E93
- Read Receipt Blue: #0084FF
- Error Red: #FF3B30

## Typography

**System Fonts** (for stealth - no custom fonts that draw attention):
- Calculator Display: SF Pro Display (iOS) / Roboto (Android), Bold, 48pt result
- Calculator Preview: System, Regular, 20pt
- Chat Messages: System, Regular, 16pt
- Pairing Code: System Monospace, Bold, 48pt
- Input Text: System, Regular, 16pt

## Visual Design

- **Icons**: Use Material Icons for calculator buttons, Feather icons for chat UI
- **Shadows**: Calculator buttons have subtle elevation (2dp), input bar has soft shadow (shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.08, shadowRadius: 4)
- **Animations**: 
  - Button press: scale to 0.95, 100ms
  - Message send: slide-in from right, 200ms ease-out
  - Typing indicator: stagger pulse, continuous loop
  - Lock transition: instant (no animation - stealth priority)

## Assets to Generate

1. **icon.png** - Standard calculator icon (MUST look like Android Calculator app), used for: device home screen
2. **splash-icon.png** - Calculator icon on white, used for: app launch screen
3. **empty-chat.png** - Subtle lock/shield illustration (muted colors), used for: chat screen when no messages exist
4. **pairing-illustration.png** - Two phones with link icon, used for: pairing flow introduction

**Asset Style**: Minimal, flat design. Calculator icon must be generic/realistic. Chat assets should feel secure but not alarming (subtle, professional).