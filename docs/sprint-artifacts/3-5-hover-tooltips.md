# Story 3.5: Hover Tooltips

## Story

As a **user**,
I want **to see quick climate info when hovering over the map**,
So that **I can explore without clicking**.

## Status

- **Epic**: 3 - Climate Information & Profiles
- **Status**: done
- **FRs Covered**: FR10 (partial - quick preview)

## Acceptance Criteria

**Given** the map is displayed with climate layer
**When** I hover over a grid cell
**Then** a tooltip appears near the cursor showing:
- Climate code and name (e.g., "Csb - Mediterranean")
- Coordinates (optional)

**And** the tooltip follows the cursor
**And** the tooltip disappears when I move away
**And** tooltips work on touch devices (long-press)
**And** tooltips don't interfere with click interactions

## Technical Implementation

### Files to Modify/Create

1. **src/ui/tooltip.js** - Already exists, enhance with long-press support
2. **src/map/climate-layer.js** - Already fires hover events, verify behavior
3. **src/style.css** - Tooltip styles already exist, minor enhancements

### Current Implementation Status

The tooltip functionality is already largely implemented in Epic 2:
- `src/ui/tooltip.js` - Creates tooltip, listens for `koppen:feature-hover` and `koppen:feature-leave`
- `src/map/climate-layer.js` - Fires hover events on mouseover/mouseout
- Basic styling exists in `src/style.css`

### Enhancements Needed

```javascript
// src/ui/tooltip.js - Add long-press support for mobile
let longPressTimer = null;

function setupEventListeners() {
  // Existing hover listeners...

  // Add long-press for mobile
  document.addEventListener('touchstart', (e) => {
    if (isMobile) {
      const target = e.target;
      longPressTimer = setTimeout(() => {
        // Trigger tooltip at touch position
        const touch = e.touches[0];
        showAtPosition(touch.clientX, touch.clientY);
      }, 500); // 500ms long press
    }
  });

  document.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
    if (isMobile) hide();
  });

  document.addEventListener('touchmove', () => {
    clearTimeout(longPressTimer);
  });
}

// Ensure tooltip doesn't block clicks
function show(data) {
  // Add pointer-events: none to tooltip
  tooltipElement.style.pointerEvents = 'none';
  // ... rest of show logic
}
```

### Key Behaviors

1. **Desktop**: Show on hover, follow cursor, hide on mouseout
2. **Mobile**: Show on long-press (500ms), hide on touch end
3. **Performance**: Debounce rapid hover events (already implemented)
4. **Non-blocking**: Tooltip has `pointer-events: none` to not interfere with clicks

### Dependencies

- Story 2.2 (Climate Layer Rendering) - completed

## Testing Checklist

- [ ] Tooltip appears on mouse hover over climate cell
- [ ] Tooltip shows climate code (e.g., "Cfa")
- [ ] Tooltip shows climate name (e.g., "Humid Subtropical")
- [ ] Tooltip shows color swatch matching cell
- [ ] Tooltip follows cursor movement
- [ ] Tooltip disappears when cursor leaves cell
- [ ] Tooltip doesn't block map click events
- [ ] Tooltip doesn't appear when clicking (only hover)
- [ ] Debouncing prevents flickering on rapid movement
- [ ] Tooltip disappears on scroll
- [ ] **Mobile**: Long-press (500ms) shows tooltip
- [ ] **Mobile**: Tooltip shows at touch position
- [ ] **Mobile**: Touch end hides tooltip
- [ ] **Mobile**: Touch move cancels long-press
- [ ] Coordinates display correctly (optional feature)
- [ ] Tooltip transitions smoothly (fade in/out)

## Notes

- Most tooltip functionality already exists from Epic 2 implementation
- This story focuses on:
  1. Adding long-press support for mobile devices
  2. Ensuring tooltips don't interfere with click interactions
  3. Polishing the user experience
- The tooltip is intentionally simple (code + name) - full details are in the profile panel (Story 3.1)
- Consider adding an optional setting to show/hide coordinates in tooltip

## Implementation Complete

**Completed: 2025-12-05**

### Changes Made

1. **src/ui/tooltip.js** - Enhanced with long-press support:
   - Added `LONG_PRESS_DURATION = 500` constant
   - Added `longPressTimer` for tracking touch state
   - `setupLongPress()` - Initializes touch detection
   - `setupLongPressOnMap()` - Attaches handlers to map container
   - Touch event handlers:
     - `touchstart` - Starts 500ms timer
     - `touchmove` - Cancels if moved >10px
     - `touchend` - Clears timer, hides after 2s delay
     - `touchcancel` - Cleans up state
   - `showAtPosition(data, x, y)` - Shows tooltip at specific coordinates
   - All touch handlers use `{ passive: true }` for performance
   - Tooltip auto-hides after 2 seconds on mobile
