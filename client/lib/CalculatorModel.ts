/**
 * Calculator Model (MVP Pattern)
 * Handles all calculation logic and state management
 * No UI concerns - purely business logic
 */

export interface CalculatorState {
  display: string;
  expression: string;
  preview: string;
  lastOperator: string | null;
  waitingForOperand: boolean;
  previousValue: number | null;
}

export class CalculatorModel {
  private state: CalculatorState;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): CalculatorState {
    return {
      display: "0",
      expression: "",
      preview: "",
      lastOperator: null,
      waitingForOperand: false,
      previousValue: null,
    };
  }

  /**
   * Get current state
   */
  getState(): CalculatorState {
    return { ...this.state };
  }

  /**
   * Clear all state - returns to initial state
   */
  clear(): CalculatorState {
    this.state = this.getInitialState();
    return this.state;
  }

  /**
   * Calculate result from expression
   * Returns empty string if expression is invalid
   */
  calculateResult(expr: string): string {
    try {
      // Replace display operators with JS operators
      let sanitized = expr
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/−/g, "-");

      // Remove trailing operator
      sanitized = sanitized.replace(/[+\-*/]$/, "");

      if (!sanitized) return "";

      // Safe evaluation using Function
      const result = new Function(`return ${sanitized}`)();

      if (typeof result === "number" && isFinite(result)) {
        // Format the result
        if (Number.isInteger(result)) {
          return result.toString();
        }
        return parseFloat(result.toFixed(8)).toString();
      }
      return "";
    } catch {
      return "";
    }
  }

  /**
   * Update live preview based on current expression
   */
  updatePreview(): void {
    if (this.state.expression) {
      this.state.preview = this.calculateResult(this.state.expression);
    } else {
      this.state.preview = "";
    }
  }

  /**
   * Handle number input
   * Updates display and expression
   */
  inputNumber(num: string): void {
    if (this.state.waitingForOperand) {
      this.state.display = num;
      this.state.expression += num;
      this.state.waitingForOperand = false;
    } else {
      const newDisplay = this.state.display === "0" ? num : this.state.display + num;
      this.state.display = newDisplay;
      if (this.state.expression === "" || this.state.expression === "0") {
        this.state.expression = num;
      } else {
        this.state.expression += num;
      }
    }
    this.updatePreview();
  }

  /**
   * Handle operator input (+, -, ×, ÷)
   * Manages operator replacement if user presses operator twice
   */
  inputOperator(op: string): void {
    const opSymbol =
      op === "*" ? "×" : op === "/" ? "÷" : op === "-" ? "−" : op;

    if (this.state.waitingForOperand && this.state.lastOperator) {
      // Replace the last operator
      this.state.expression = this.state.expression.slice(0, -1) + opSymbol;
      this.state.lastOperator = op;
      this.updatePreview();
      return;
    }

    this.state.expression =
      (this.state.expression || this.state.display) + opSymbol;
    this.state.lastOperator = op;
    this.state.waitingForOperand = true;
    this.state.previousValue = parseFloat(this.state.display);
    this.updatePreview();
  }

  /**
   * Handle equals button - finalizes calculation
   * Returns only the result, expression is cleared
   */
  finalize(): void {
    const result = this.calculateResult(this.state.expression || this.state.display);
    if (result) {
      this.state.display = result;
      this.state.expression = "";
      this.state.preview = "";
      this.state.lastOperator = null;
      this.state.waitingForOperand = false;
      this.state.previousValue = null;
    }
  }

  /**
   * Handle decimal point input
   */
  inputDecimal(): void {
    if (this.state.waitingForOperand) {
      this.state.display = "0.";
      this.state.expression += "0.";
      this.state.waitingForOperand = false;
    } else if (!this.state.display.includes(".")) {
      this.state.display += ".";
      this.state.expression =
        (this.state.expression || "0") + ".";
    }
    this.updatePreview();
  }

  /**
   * Handle plus/minus toggle
   */
  togglePlusMinus(): void {
    if (this.state.display !== "0") {
      const newDisplay = this.state.display.startsWith("-")
        ? this.state.display.slice(1)
        : "-" + this.state.display;
      this.state.display = newDisplay;

      // Update expression
      if (this.state.expression) {
        const match = this.state.expression.match(/-?(\d+\.?\d*)$/);
        if (match) {
          const num = match[0];
          const newNum = num.startsWith("-") ? num.slice(1) : "-" + num;
          this.state.expression =
            this.state.expression.slice(0, -num.length) + newNum;
        }
      } else {
        this.state.expression = newDisplay;
      }
    }
    this.updatePreview();
  }

  /**
   * Handle percentage calculation
   */
  inputPercent(): void {
    const current = parseFloat(this.state.display);
    const result = current / 100;
    const resultStr = result.toString();
    this.state.display = resultStr;

    if (this.state.expression) {
      // Replace the last number in expression with percentage
      const match = this.state.expression.match(/(\d+\.?\d*)$/);
      if (match) {
        this.state.expression =
          this.state.expression.slice(0, -match[0].length) + resultStr;
      }
    } else {
      this.state.expression = resultStr;
    }
    this.updatePreview();
  }

  /**
   * Get the current input for verification (e.g., PIN check)
   * This is the expression being typed or the final result
   */
  getCurrentInput(): string {
    return this.state.expression || this.state.display;
  }

  /**
   * Format display for large numbers
   */
  formatDisplay(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    if (Math.abs(num) >= 1e9) {
      return num.toExponential(4);
    }

    if (value.length > 12) {
      return parseFloat(num.toPrecision(10)).toString();
    }

    return value;
  }
}
