# Onboarding Quick Start Guide

## 🚀 Getting Started

### View the Onboarding Flow

The onboarding will appear automatically on first launch. To test it:

```bash
# Start the dev server
npm run dev

# Open browser console and run:
localStorage.removeItem('onboarding_complete');
localStorage.removeItem('children');
location.reload();
```

---

## 🔄 Quick Reset Commands

### Full Reset (Browser Console)
```javascript
localStorage.removeItem('onboarding_complete');
localStorage.removeItem('onboarding_temp_state');
localStorage.removeItem('children');
location.reload();
```

### Reset Just Onboarding
```javascript
localStorage.removeItem('onboarding_complete');
location.reload();
```

### View Current State
```javascript
console.log({
  complete: localStorage.getItem('onboarding_complete'),
  children: JSON.parse(localStorage.getItem('children') || '[]'),
  tempState: JSON.parse(localStorage.getItem('onboarding_temp_state') || '{}')
});
```

---

## 📝 Test Checklist

### ✅ Basic Flow
- [ ] Welcome screen appears on first launch
- [ ] Progress indicator shows (dots)
- [ ] Can navigate through all 4 steps
- [ ] Can complete onboarding
- [ ] Children are created
- [ ] Returns to main app
- [ ] Onboarding doesn't show again

### ✅ Children Setup
- [ ] Can add a child
- [ ] Can add up to 6 children
- [ ] Cannot add more than 6 children
- [ ] Can edit a child's name
- [ ] Can edit a child's emoji
- [ ] Can remove a child
- [ ] Cannot proceed without at least 1 child
- [ ] All 16 emojis selectable
- [ ] Name validation (max 20 chars)

### ✅ Chores Setup
- [ ] Can see default chores preview
- [ ] "Use Defaults" creates default chores
- [ ] "Customize Now" opens chore modal
- [ ] "Skip for Now" skips chore setup
- [ ] Can edit chores in modal
- [ ] Can add custom chores
- [ ] All options proceed to completion

### ✅ Navigation
- [ ] Back button works (Steps 2-4)
- [ ] No back button on Step 1
- [ ] Progress saves on refresh
- [ ] Data persists on refresh
- [ ] Can complete from any chores option

### ✅ Complete Screen
- [ ] Shows success animation
- [ ] Shows correct child count
- [ ] Shows chores status
- [ ] "Get Started" enters app
- [ ] Children appear in child selector
- [ ] Selected child is first child

---

## 🎨 UI Test Cases

### Mobile (375px width)
- [ ] All text readable
- [ ] Buttons large enough (44px+)
- [ ] No horizontal scroll
- [ ] Emoji picker wraps nicely
- [ ] Forms fit on screen

### Tablet (768px width)
- [ ] Layout adjusts properly
- [ ] Cards have good spacing
- [ ] Content centered
- [ ] Max-width constraints work

### Desktop (1024px+)
- [ ] Content stays centered
- [ ] Max-width applied
- [ ] Not too wide
- [ ] Comfortable reading

### Accessibility
- [ ] Can tab through all elements
- [ ] Focus indicators visible
- [ ] Screen reader announces steps
- [ ] Labels are descriptive
- [ ] Buttons have aria-labels

---

## 🐛 Common Issues & Fixes

### Onboarding Shows Every Time
```javascript
// Check completion flag
console.log(localStorage.getItem('onboarding_complete'));
// Should be "true" after completion
```

### Children Don't Appear
```javascript
// Check children data
console.log(JSON.parse(localStorage.getItem('children') || '[]'));
// Should have array of children objects
```

### Progress Lost on Refresh
```javascript
// Check temp state
console.log(JSON.parse(localStorage.getItem('onboarding_temp_state') || '{}'));
// Should have currentStep and tempChildren
```

### TypeScript Errors
```bash
# Run type check
npm run type-check

# Should show 0 errors
```

### Build Errors
```bash
# Build the app
npm run build

# Should complete successfully
```

---

## 📱 Testing on Mobile

### iOS Safari
1. Open Safari DevTools (Mac + iPhone)
2. Connect device via USB
3. Enable Web Inspector on iPhone
4. Inspect from Mac Safari > Develop menu
5. Run reset commands in console

### Android Chrome
1. Enable USB debugging on Android
2. Connect via USB
3. Open chrome://inspect in Chrome
4. Find your device
5. Inspect and run reset commands

### Responsive Mode (Desktop)
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select device preset (iPhone, Pixel, etc.)
4. Test onboarding flow

---

## 🎯 User Journey Test

### Scenario 1: New Parent
1. Reset localStorage
2. Refresh page
3. See welcome screen
4. Add 2 children: "Emma" 🌟, "Noah" ⚽
5. Choose "Use Defaults"
6. Complete onboarding
7. Verify Emma and Noah in child selector
8. Verify 5 default chores exist
9. Switch between children
10. All data persists

### Scenario 2: Skip Chores
1. Reset localStorage
2. Go through onboarding
3. Add 1 child
4. Choose "Skip for Now"
5. Complete onboarding
6. Verify child created
7. Verify default chores still loaded

### Scenario 3: Customize Chores
1. Reset localStorage
2. Go through onboarding
3. Add children
4. Choose "Customize Now"
5. Add custom chore "Walk dog" (5 pts)
6. Close modal
7. Complete onboarding
8. Verify custom chore exists

### Scenario 4: Edit During Setup
1. Start onboarding
2. Add child "Test" 😊
3. Click edit
4. Change to "Alice" 🦄
5. Save
6. Verify change appears
7. Complete onboarding
8. Verify final name is "Alice"

---

## 💡 Quick Tips

### Development
- Use React DevTools to inspect signals
- Check localStorage in Application tab
- Use Network tab to verify no API calls (all local)
- Mobile viewport testing essential

### Testing
- Test on real devices when possible
- Test with different localStorage states
- Test interrupting flow (refresh mid-step)
- Test validation (try to proceed without data)

### Debugging
- Check console for errors
- Verify localStorage keys exist
- Check signal values in DevTools
- Trace function calls with console.log

---

## 📊 Success Criteria

**Onboarding is successful when:**

✅ User completes all 4 steps
✅ At least 1 child is created
✅ Children data persists to localStorage
✅ Onboarding doesn't show again
✅ User can use the app normally
✅ All data is accessible in main app

**Edge cases handled:**

✅ Refresh during onboarding
✅ Back navigation
✅ Skip optional steps
✅ Edit data during setup
✅ Remove children
✅ Maximum children limit
✅ Input validation

---

## 🚀 Next Steps

After testing onboarding:

1. **Test Main App Integration**
   - Verify children appear everywhere
   - Test child switching
   - Test adding transactions
   - Test chore assignment

2. **Test Data Persistence**
   - Close tab and reopen
   - Refresh page multiple times
   - Clear cache (keep localStorage)
   - Verify data intact

3. **Performance Testing**
   - Check bundle size
   - Test on slow 3G
   - Verify smooth animations
   - Check memory usage

4. **Accessibility Audit**
   - Run Lighthouse
   - Test with screen reader
   - Keyboard-only navigation
   - Check color contrast

---

## 📞 Support

**Files to reference:**
- `ONBOARDING_GUIDE.md` - Comprehensive documentation
- `ONBOARDING_SUMMARY.md` - Implementation details
- `src/stores/onboardingStore.ts` - State management
- `src/components/features/onboarding/` - All components

**Quick links:**
- [Preact Signals Docs](https://preactjs.com/guide/v10/signals/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

**Happy Testing! 🎉**
