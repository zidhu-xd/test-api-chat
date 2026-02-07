# Calculator MVP Architecture

## Overview

The calculator has been refactored following the **Model-View-Presenter (MVP)** pattern to achieve strict separation of concerns. This ensures maintainability, testability, and clear logic flow.

## Architecture Layers

### 1. Model Layer (`CalculatorModel.ts`)
**Responsibility:** Pure business logic and calculation state

The `CalculatorModel` class encapsulates:
- **State Management**: Stores expression, display, preview, operators, and flags
- **Calculation Logic**: Evaluates mathematical expressions safely
- **Input Processing**: Handles number, operator, decimal, and function inputs
- **Result Finalization**: Completes calculations when user presses "="

**Key Methods:**
- `inputNumber(num)` - Adds a digit to the expression
- `inputOperator(op)` - Adds an operator (+, -, ×, ÷)
- `inputDecimal()` - Adds a decimal point
- `inputPercent()` - Calculates percentage
- `togglePlusMinus()` - Toggles sign
- `finalize()` - Completes calculation and clears expression
- `calculateResult(expr)` - Evaluates expression string
- `updatePreview()` - Updates live preview
- `getCurrentInput()` - Returns current expression for validation (PIN checking)

**State Structure:**
```typescript
interface CalculatorState {
  display: string;          // Current display value
  expression: string;       // Full expression being typed
  preview: string;          // Live preview result
  lastOperator: string | null;
  waitingForOperand: boolean;
  previousValue: number | null;
}
```

### 2. Presenter Layer (`CalculatorScreen.tsx`)
**Responsibility:** Event handling and view synchronization

The `CalculatorScreen` acts as presenter that:
- Receives user input events from View components
- Delegates to Model for calculations
- Synchronizes view state from model state
- Handles PIN/unlock code validation
- Manages navigation logic

**Key Methods:**
- `syncViewFromModel()` - Updates all view state from model
- `handleNumber()` - Receives digit input
- `handleOperator()` - Receives operator input
- `handleEquals()` - Special: checks PIN codes, then finalizes
- `handleClear()` - Resets calculator
- Other handlers delegate to model

### 3. View Layer (`CalculatorScreen.tsx`)
**Responsibility:** UI rendering only

The View:
- Displays expression, preview, and result
- Renders buttons with proper styling
- Has NO business logic
- Is purely reactive to state changes

## Data Flow

### Normal Calculation (e.g., 50 × 2)

```
User Input (View)
    ↓
Presenter (Handler)
    ↓
Model (Process)
    ↓
Model (Return State)
    ↓
Presenter (Sync)
    ↓
View (Render)
```

**Step-by-step:**
1. User taps "5" → `handleNumber("5")`
2. Presenter calls `model.inputNumber("5")`
3. Model updates: `{ display: "5", expression: "5", preview: "" }`
4. Presenter calls `syncViewFromModel()`
5. View displays: `expression: "5"`, `result: "5"`, `preview: ""`

1. User taps "×" → `handleOperator("*")`
2. Model updates: `{ display: "5", expression: "5×", preview: "" }`
3. View displays: `expression: "5×"`, `result: "5"`, `preview: ""`

1. User taps "2" → `handleNumber("2")`
2. Model updates: `{ display: "2", expression: "5×2", preview: "10" }`
3. View displays: `expression: "5×2"`, `result: "2"`, `preview: "= 10"`

1. User taps "=" → `handleEquals()`
2. Presenter validates PIN codes (not matched)
3. Calls `model.finalize()`
4. Model updates: `{ display: "10", expression: "", preview: "" }`
5. View displays: `expression: ""`, `result: "10"`, `preview: ""`

## PIN Structure (Preserved)

The 4-digit PIN unlock functionality is **preserved** and integrated:

1. User enters 4 digits (e.g., "1234")
2. When user presses "=":
   - Presenter gets `currentInput = model.getCurrentInput()` (the "1234" being typed)
   - Checks against `unlockCode` from storage
   - If match: navigates to Chat or Pairing
   - If no match: proceeds with normal calculation

**Key Security Points:**
- PIN checking happens BEFORE calculation finalization
- Expression is not cleared if PIN matches (navigation interrupts)
- Factory reset code (5678) has special handling

## Live Preview Logic

The calculator shows live preview updates while typing:

1. `expression: "50×2"` → Model calculates → `preview: "100"`
2. `expression: "50×"` → Model calculates → `preview: ""` (invalid, trailing operator)
3. `expression: "50"` → No preview until operator entered

This is handled by `updatePreview()` which is called after every input.

## Calculation Safety

The `calculateResult()` method:
- Uses `Function` constructor for safe evaluation (not `eval`)
- Replaces display operators: × → *, ÷ /, − → -
- Removes trailing operators before evaluation
- Catches errors silently
- Returns formatted results or empty string on failure

## Testing Model Independently

Since Model has no React dependencies, it can be tested directly:

```typescript
const model = new CalculatorModel();

// Test basic calculation
model.inputNumber("5");
model.inputOperator("+");
model.inputNumber("3");
model.finalize();
expect(model.getState().display).toBe("8");

// Test preview
model.inputNumber("5");
model.inputOperator("×");
model.inputNumber("2");
expect(model.getState().preview).toBe("10");

// Test PIN checking
const input = model.getCurrentInput(); // Before finalize
expect(input).toBe("1234"); // PIN code
```

## Benefits of MVP Pattern

| Aspect | Benefit |
|--------|---------|
| **Separation of Concerns** | Model, Presenter, View are independently testable |
| **Maintainability** | Business logic isolated from UI |
| **Reusability** | Model can be used in other contexts (CLI, tests) |
| **Debugging** | Easy to trace where bugs occur |
| **Testing** | Can unit test Model without React setup |
| **Refactoring** | Safe to change UI without affecting logic |

## File Structure

```
client/
├── lib/
│   └── CalculatorModel.ts (MVP Model - Pure Logic)
└── screens/
    └── CalculatorScreen.tsx (MVP Presenter + View)
```

## State Immutability

While the Model internally mutates its state object for performance, the Presenter always works with snapshots via `getState()`, ensuring React's unidirectional data flow is maintained.

## Future Enhancements

1. **Undo/Redo**: Store state history in Presenter
2. **History Panel**: Extract and display past calculations
3. **Calculator History API**: Connect to server for calculation analytics
4. **Custom Operators**: Add new functions without touching View layer
5. **Voice Input**: Add voice commands → Presenter → Model (no View changes)

## Migration from Old Code

The refactoring maintains 100% functional compatibility:
- 4-digit PIN unlock still works
- 5-digit reset code still works
- All calculations work identically
- All UI styling preserved
- No breaking changes

## Summary

This MVP architecture creates a clean boundary between:
- **Model**: "What to calculate?"
- **Presenter**: "How to handle user input?"
- **View**: "What to display?"

This separation makes the calculator a solid foundation for extending with features like cloud sync, advanced functions, or alternative interfaces.
