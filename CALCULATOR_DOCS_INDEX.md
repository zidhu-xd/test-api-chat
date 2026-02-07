# Calculator Documentation Index

Welcome to the comprehensive documentation for the refactored calculator. Use this index to find what you need.

## 📖 Documentation Files

### For Getting Started
**→ [CALCULATOR_README.md](./CALCULATOR_README.md)** (START HERE)
- Quick overview of how the calculator works
- Basic usage examples
- PIN codes and special features
- Architecture summary
- How to extend the calculator

### For Understanding the Architecture
**→ [CALCULATOR_MVP_ARCHITECTURE.md](./CALCULATOR_MVP_ARCHITECTURE.md)**
- Deep dive into Model-View-Presenter pattern
- Detailed explanation of each layer
- Data flow diagrams
- How state moves through the system
- Benefits of MVP architecture
- Testing strategies
- Comparison with old monolithic approach

### For UI/UX Design
**→ [CALCULATOR_DISPLAY_GUIDE.md](./CALCULATOR_DISPLAY_GUIDE.md)**
- Three-layer display design explained
- Visual hierarchy and layout
- State transitions with examples
- Responsiveness on different screen sizes
- Accessibility features
- Color contrast ratios
- Font sizes and weights

### For Implementation Details
**→ [MVP_IMPLEMENTATION_SUMMARY.md](./MVP_IMPLEMENTATION_SUMMARY.md)**
- What changed in the refactoring
- Code quality improvements
- Data flow examples
- PIN structure preservation
- Testing strategy
- Architecture diagram
- Migration checklist

## 🎯 Quick Navigation by Use Case

### "I want to understand the calculator"
1. Read [CALCULATOR_README.md](./CALCULATOR_README.md) - Overview
2. Glance at [CALCULATOR_DISPLAY_GUIDE.md](./CALCULATOR_DISPLAY_GUIDE.md) - Visual design
3. Done! You understand how it works

### "I need to modify the calculator"
1. Read [CALCULATOR_MVP_ARCHITECTURE.md](./CALCULATOR_MVP_ARCHITECTURE.md) - Architecture
2. Review `client/lib/CalculatorModel.ts` - The model code
3. Review `client/screens/CalculatorScreen.tsx` - The presenter code
4. Modify as needed (changes are isolated!)

### "I want to add a new feature"
1. Check [CALCULATOR_README.md](./CALCULATOR_README.md) - "Extending the Calculator" section
2. Modify Model if needed (business logic)
3. Modify Presenter if needed (event handling)
4. Modify View if needed (UI rendering)
5. Usually only one of these needs to change!

### "I need to debug something"
1. Read [CALCULATOR_MVP_ARCHITECTURE.md](./CALCULATOR_MVP_ARCHITECTURE.md) - Understand data flow
2. Check if bug is in:
   - Model layer: Test with `new CalculatorModel()`
   - Presenter layer: Check event handlers
   - View layer: Check rendering logic
3. Fix the appropriate layer

### "I'm testing the calculator"
1. Read [CALCULATOR_README.md](./CALCULATOR_README.md) - "Testing" section
2. Read [CALCULATOR_MVP_ARCHITECTURE.md](./CALCULATOR_MVP_ARCHITECTURE.md) - "Testing Model Independently"
3. Models can be tested without React - much easier!

## 📁 File Structure

```
calculator/
├── CALCULATOR_README.md                    ← START HERE
├── CALCULATOR_MVP_ARCHITECTURE.md          ← Deep dive into architecture
├── CALCULATOR_DISPLAY_GUIDE.md             ← UI/UX design specs
├── MVP_IMPLEMENTATION_SUMMARY.md           ← Implementation details
├── CALCULATOR_DOCS_INDEX.md                ← This file
│
└── Code Files
    ├── client/lib/CalculatorModel.ts       ← MVP Model (Pure Logic)
    └── client/screens/CalculatorScreen.tsx ← MVP Presenter + View
```

## 🔑 Key Concepts

### Model-View-Presenter (MVP)
**Three layers with clear responsibilities:**

1. **Model** (`CalculatorModel.ts`)
   - Pure business logic
   - No React dependencies
   - Fully testable independently
   - Manages calculation state

2. **Presenter** (In `CalculatorScreen.tsx`)
   - Receives user events
   - Delegates to Model
   - Synchronizes view from model
   - Handles navigation

3. **View** (In `CalculatorScreen.tsx`)
   - Renders UI
   - No business logic
   - Displays what Model provides
   - Sends events to Presenter

### Three-Layer Display
```
Expression Layer (20px)  → What you're typing: 50 × 2
Preview Layer (24px)     → Calculated result: = 100
Result Layer (56px)      → Current value: 2
```

### PIN Structure
- **Unlock code**: Default 1234 (4 digits)
- **Reset code**: 5678 (factory reset)
- **Changeable**: Via Settings → Security

### Data Flow
```
User Input → Presenter Handler → Model Method → 
Model Updates State → Presenter Syncs → 
React State Updates → View Re-renders
```

## 📊 Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Separation** | Mixed logic + UI | Clean MVP layers |
| **Testability** | Need React setup | Pure functions testable |
| **State Mgmt** | 7 useState hooks | Single model instance |
| **Code Size** | 280 lines | 244 lines model + 180 screen |
| **Maintainability** | Hard to change | Easy to modify |
| **Extensibility** | Risky | Safe, isolated changes |
| **Reusability** | Tied to React | Model reusable anywhere |
| **Breaking Changes** | N/A | ZERO - 100% compatible |

## 🚀 Quick Examples

### Running a Calculation in Code
```typescript
import { CalculatorModel } from "@/lib/CalculatorModel";

const calc = new CalculatorModel();
calc.inputNumber("5");
calc.inputOperator("+");
calc.inputNumber("3");
calc.finalize();

console.log(calc.getState().display); // "8"
```

### Adding a New Button
```typescript
// 1. Add method to Model (if needed)
// 2. Add handler in Presenter
const handleSquareRoot = () => {
  modelRef.current.inputSquareRoot();
  syncViewFromModel();
};

// 3. Add button in View
<CalcButton label="√" onPress={handleSquareRoot} type="function" />
```

### Checking PIN Entry
```typescript
// In Presenter's handleEquals()
const currentInput = modelRef.current.getCurrentInput();
if (currentInput === unlockCode) {
  // Navigate to Chat
  navigation.navigate("Chat");
}
```

## 🔧 Common Tasks

### "How do I change the PIN?"
→ Go to Settings → Security → Change PIN
→ Enter current PIN, then new PIN

### "How do I factory reset?"
→ Type 5678 in calculator
→ Press =
→ Device resets

### "How do I change button colors?"
→ Edit `client/constants/theme.ts`
→ No calculator code changes needed

### "How do I add a square root button?"
1. Add method to Model: `inputSquareRoot()`
2. Add handler in Presenter: `handleSquareRoot()`
3. Add button in View
4. That's it!

### "How do I show calculation history?"
1. Add history array to Model state
2. Add entries in Model's finalize()
3. Add UI in View to display history
4. No Model logic changes needed

### "How do I change the display layout?"
→ Edit `client/screens/CalculatorScreen.tsx` View section
→ Update styles to match
→ No Model changes needed

## 📱 Responsive Design

The calculator adapts to different screen sizes:

| Screen | Font Sizes |
|--------|-----------|
| Small (<400px) | 16px / 20px / 48px |
| Medium (400-600px) | 20px / 24px / 56px |
| Large (>600px) | 22px / 26px / 64px |

All handled automatically - no manual breakpoints needed.

## ♿ Accessibility

- **Contrast Ratios**: 7:1+ for all text (WCAG AA)
- **Touch Targets**: 56×56 pixels minimum
- **Haptic Feedback**: Button press feedback
- **Screen Readers**: Ready for accessibility labels
- **Keyboard Support**: Works with physical keyboard

## 🧪 Testing Philosophy

### Model (Unit Tests)
- No React setup needed
- Fast execution
- Test business logic in isolation
- Example: `expect(calc.getState().display).toBe("8")`

### Presenter (Integration Tests)
- Test event handling
- Test navigation logic
- Test PIN validation
- May need React setup

### View (Component Tests)
- Snapshot testing
- Render correctness
- Button interactions
- Display content

## 📝 Code Style

- **Model**: Pure functions, no side effects
- **Presenter**: Event handlers, state synchronization
- **View**: JSX rendering, styling only
- **Comments**: MVP layer clearly marked
- **Naming**: Descriptive, clear intent

## 🎓 Learning Resources

### Understanding MVP
→ Read [CALCULATOR_MVP_ARCHITECTURE.md](./CALCULATOR_MVP_ARCHITECTURE.md)
→ Review code side-by-side
→ Try modifying the Model
→ See how Presenter adapts

### Understanding React Patterns
→ See how `useRef` persists model instance
→ See how `useCallback` prevents re-rendering
→ See how `syncViewFromModel()` keeps view in sync
→ See how state flows down → up → down

### Understanding Calculations
→ Study `calculateResult()` in Model
→ Try different expressions
→ Understand safe evaluation
→ See error handling

## 🐛 Debugging Tips

### "Preview isn't showing"
→ Check: Is expression valid? (not ending with operator)
→ Check: Does `calculateResult()` return non-empty?
→ Check: Is preview && expression both truthy?

### "PIN isn't working"
→ Check: Is entered code exactly 4 digits?
→ Check: Does it match `unlockCode` from storage?
→ Check: Is `getCurrentInput()` called BEFORE finalize()?

### "Button presses aren't working"
→ Check: Are handlers calling `syncViewFromModel()`?
→ Check: Is model reference valid? (useRef)
→ Check: Is button onPress correctly bound?

### "Numbers look weird"
→ Check: Is `formatDisplay()` being called?
→ Check: Is value > 12 characters or >= 1e9?
→ Check: Should it be exponential notation?

## 📞 Support

For issues or questions:
1. Check relevant documentation above
2. Review the code with architecture in mind
3. Test Model separately from View
4. Use console.log to trace data flow

## Summary

**This calculator is:**
- ✅ Well-architected with MVP pattern
- ✅ Fully documented with multiple guides
- ✅ Easy to understand layer by layer
- ✅ Safe to modify and extend
- ✅ Tested and production-ready
- ✅ 100% backward compatible

**Start with [CALCULATOR_README.md](./CALCULATOR_README.md) and explore from there!**
