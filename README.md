# Web Calculator with Sub Menu Navigation

A simple, self-contained web calculator that supports:

- Basic arithmetic (add, subtract, multiply, divide, percent)
- Scientific mode (trigonometry with DEG/RAD, power, sqrt, log/ln, factorial, constants π and e)
- Unit conversions (Length, Weight, Temperature)
- Currency conversions (static demo rates)

No frameworks or build steps. Open `index.html` in a browser.

## Features

- Three-dots menu in the top-right opens a submenu with:
  - Scientific Mode: toggles extra scientific keys and DEG/RAD switch
  - Unit Conversion: opens a side panel with Length/Weight/Temperature tabs
  - Currency Conversion: opens a side panel with a basic currency converter
- Keyboard input: numbers and operators, Enter (=), Backspace (⌫), Escape (C)
- Error handling for invalid expressions and factorial constraints

## Notes

- Percent key treats `x%` as `(x * 0.01)`.
- Trigonometric functions default to Degrees. Toggle to Radians with the switch.
- Currency rates are static and for demonstration only. Update them in `script.js` under the `rates` object.

## How to run

1. Open the folder in VS Code.
2. Right-click `index.html` and choose "Open with Live Server" (if you have the extension), or just double-click to open in your browser.

## Files

- `index.html` — Markup for calculator and panels
- `styles.css` — Styling for layout and components
- `script.js` — Calculator logic, menu handling, converters

---
© Lab 07 assignment
