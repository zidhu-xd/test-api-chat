# Calculator Display Design Guide

## Visual Hierarchy

The calculator display follows a strict three-level hierarchy to show calculation state clearly:

### Display Area Layout

```
┌─────────────────────────┐
│  Top (Expression)       │  ← Shows what user is typing
│  50 × 2                 │
│                         │
│  Middle (Live Preview)  │  ← Shows calculation result
│  = 100                  │
│                         │
│  Bottom (Result)        │  ← Shows current value
│  2                      │
└─────────────────────────┘
```

## Layer Details

### 1. Top Layer - Expression (20px, Secondary Color)
**Purpose**: Show the full mathematical expression being constructed

**Behavior:**
- Displays the complete expression as user types
- Shows operators: + − × ÷
- Clears when "=" is pressed
- Right-aligned for readability

**Examples:**
- After typing "50": shows "50"
- After typing "50×": shows "50×"
- After typing "50×2": shows "50×2"
- After pressing "=": shows "" (empty)

**Font**: 20px, Secondary Gray, Weight 600

### 2. Middle Layer - Live Preview (24px, Secondary Color)
**Purpose**: Show calculated result before confirmation

**Behavior:**
- Only appears when user has typed a complete partial expression
- Prefixed with "=" symbol
- Updates in real-time as user types
- Disappears when expression is invalid or empty

**Examples:**
- Expression "50": no preview (just a number)
- Expression "50×": no preview (trailing operator)
- Expression "50×2": shows "= 100"
- Expression "50×2+": no preview (trailing operator)
- Expression "50×2+3": shows "= 103"

**Font**: 24px, Secondary Gray, Weight 600, Prefix "="

### 3. Bottom Layer - Result (56px, Primary White)
**Purpose**: Show the value the user can interact with

**Behavior:**
- Shows current display value (what was last entered)
- After "=" press: shows the finalized result
- Large size makes it the focal point
- Auto-scales for very large numbers

**Examples:**
- Typing "50": displays "50"
- Typing "50×": displays "50" (kept from previous)
- Typing "50×2": displays "2" (most recent number)
- After "50×2=": displays "100" (finalized result)

**Font**: 56px, Primary White, Weight 700

## State Transitions

### Scenario 1: Simple Addition (2 + 3)

| Step | Expression | Preview | Display | Action |
|------|-----------|---------|---------|--------|
| Start | - | - | 0 | -
| Press 2 | 2 | - | 2 | Number input |
| Press + | 2+ | - | 2 | Operator input |
| Press 3 | 2+3 | = 5 | 3 | Number input (live preview appears) |
| Press = | - | - | 5 | Finalize (expression clears) |

### Scenario 2: Complex Expression (50 × 2 + 3)

| Step | Expression | Preview | Display | Action |
|------|-----------|---------|---------|--------|
| Type 50 | 50 | - | 50 | - |
| Press × | 50× | - | 50 | Waiting for next number |
| Type 2 | 50×2 | = 100 | 2 | Live preview shows partial result |
| Press + | 50×2+ | - | 100 | Move to next operation |
| Type 3 | 50×2+3 | = 103 | 3 | Live preview shows final result |
| Press = | - | - | 103 | Complete calculation |

### Scenario 3: PIN Entry (1234)

| Step | Expression | Preview | Display | Action |
|------|-----------|---------|---------|--------|
| Type 1 | 1 | - | 1 | Normal number |
| Type 2 | 12 | - | 2 | - |
| Type 3 | 123 | - | 3 | - |
| Type 4 | 1234 | - | 4 | 4-digit PIN complete |
| Press = | - | - | - | PIN validated, navigates to Chat |

**Note:** Preview doesn't show for PIN because:
- 1234 is not a valid mathematical expression
- calculateResult("1234") returns empty string
- Only valid expressions show preview

## Edge Cases

### Decimal Numbers
- Expression: "3.14"
- Preview: - (single number, no calculation)
- Display: "3.14"

### Negative Numbers
- Expression: "-5"
- Preview: - (single number)
- Display: "-5"
- Press ±: Expression becomes "5", Display: "5"

### Very Large Results
- Expression: "999999999999 × 2"
- Preview: "= 2.0e+12" (exponential notation)
- Display: "2e+12" (auto-scaled)

### Percentage
- Expression: "50%"
- Preview: - (single number)
- Display: "0.5"

### Error Prevention
- Cannot type "5 + + 3" (operator replacement instead)
- Cannot have trailing operators in preview (filtered out)
- Cannot divide by zero preview (caught, returns empty)

## Styling Details

### Font Weights in Dark Theme
| Layer | Font Size | Weight | Color |
|-------|-----------|--------|-------|
| Expression | 20px | 600 (Semi-bold) | #9AA0A6 (Secondary) |
| Preview | 24px | 600 (Semi-bold) | #9AA0A6 (Secondary) |
| Result | 56px | 700 (Bold) | #FFFFFF (Primary) |

### Spacing
- Expression to Preview: 4px gap
- Preview to Result: 8px gap
- Result to Buttons: 24px gap

### Alignment
- All three layers: Right-aligned
- Matches standard calculator UI
- Visual weight flows downward to prominent Result

## Responsiveness

### Small Screens (< 400px width)
- Expression: 16px
- Preview: 20px
- Result: 48px (adjustsFontSizeToFit enabled)

### Medium Screens (400-600px)
- Expression: 20px
- Preview: 24px
- Result: 56px

### Large Screens (> 600px)
- Expression: 22px
- Preview: 26px
- Result: 64px

Auto-scaling is handled by React Native's `adjustsFontSizeToFit` and `minimumFontScale` props.

## User Experience

### Feedback Elements
1. **Expression is clear**: User can see exactly what they typed
2. **Live preview is helpful**: Shows answer before pressing "="
3. **Large result is prominent**: Primary interaction target
4. **Operator visual feedback**: Uses accent color (blue) for operators

### Error Handling
1. Invalid expressions show no preview
2. Division by zero shows no preview (caught)
3. Syntax errors show no preview (caught)
4. User sees "0" on first load

## Implementation Notes

The display logic is handled by the **View** component:

```tsx
{/* Expression/Preview */}
<Text style={styles.previewText} numberOfLines={1}>
  {expression || " "}
</Text>

{/* Live Preview Result */}
{preview && expression ? (
  <Text style={styles.livePreviewText} numberOfLines={1}>
    = {preview}
  </Text>
) : null}

{/* Main Result */}
<Text
  style={styles.resultText}
  numberOfLines={1}
  adjustsFontSizeToFit
  minimumFontScale={0.5}
>
  {formatDisplay(display)}
</Text>
```

The logic is handled by the **Model**:
- `expression`: Updated by `inputNumber()`, `inputOperator()`, etc.
- `preview`: Updated by `updatePreview()` after every input
- `display`: Updated after each number/operator, preserved during calculations

The **Presenter** synchronizes everything:
- Presenter calls Model methods
- Presenter calls `syncViewFromModel()`
- View renders the synced state

## Accessibility

### Screen Reader Support
- Expression shown with context: "Expression: 50 times 2"
- Preview labeled: "Preview equals 100"
- Result labeled: "Result: 2"

### Touch Targets
- Buttons are 56×56 pixels minimum
- Sufficient spacing for accurate tapping
- Haptic feedback on button press

### Color Contrast
- Secondary gray (#9AA0A6) on dark background (#0B0D10): 7.2:1 ratio
- Primary white (#FFFFFF) on dark background: 21:1 ratio
- Blue accent (#4F8BFF) for operators: 5.1:1 ratio
- All exceed WCAG AA standards

## Summary

The three-layer display creates a clear, intuitive interface:
1. **Expression layer**: What are you calculating?
2. **Preview layer**: What's the answer?
3. **Result layer**: What can you interact with?

This hierarchy respects the MVP pattern: the View simply displays what the Model provides, with no calculation logic embedded in rendering.
