# Kids Home Hub - Onboarding System

## Overview

A complete, mobile-first onboarding flow for the Kids Home Hub PWA. The system guides new users through setting up their account with a delightful, user-friendly experience.

## Features

### 4-Step Onboarding Flow

1. **Welcome Screen** - Introduction to the app with key features
2. **Children Setup** - Add 1-6 children with names and emoji avatars
3. **Chores Configuration** - Choose default chores, customize, or skip
4. **Complete Screen** - Success celebration with setup summary

### Technical Implementation

- **Preact Signals** for reactive state management
- **localStorage** for persistence (onboarding completion + temp state)
- **Mobile-first responsive design** with Tailwind CSS
- **Smooth transitions** between steps
- **Accessible forms** with proper labels and ARIA attributes
- **Touch-friendly UI** with large buttons and clear interactions

## Files Created

### Store
- `/src/stores/onboardingStore.ts` - Complete state management with signals

### Components
- `/src/components/features/onboarding/OnboardingFlow.tsx` - Main container
- `/src/components/features/onboarding/WelcomeScreen.tsx` - Step 1
- `/src/components/features/onboarding/ChildrenSetupScreen.tsx` - Step 2
- `/src/components/features/onboarding/ChoresSetupScreen.tsx` - Step 3
- `/src/components/features/onboarding/CompleteScreen.tsx` - Step 4
- `/src/components/features/onboarding/ProgressIndicator.tsx` - Progress dots
- `/src/components/features/onboarding/index.ts` - Barrel export

### Updated Files
- `/src/app.tsx` - Added onboarding flow integration
- `/src/stores/index.ts` - Exported onboarding store
- `/src/stores/childrenStore.ts` - Added child management functions + localStorage persistence
- `/src/components/common/Avatar.tsx` - Added emoji avatar support

## How It Works

### First Launch
1. User opens the app for the first time
2. Onboarding status checked from localStorage (`onboarding_complete`)
3. If not complete, `OnboardingFlow` component is shown full-screen
4. User progresses through 4 steps
5. On completion, children are created and app redirects to main view

### Returning Users
- Onboarding is skipped automatically
- App loads directly to the main interface
- All data (children, chores) is persisted

### Progress Tracking
- Current step is saved to localStorage
- If user refreshes during onboarding, they resume where they left off
- Temporary children data is preserved until completion

## API Reference

### Onboarding Store

```typescript
import {
  // Signals
  onboardingComplete,
  currentStep,
  tempChildren,
  choresConfigured,
  isOnboardingActive,
  canProceed,

  // Actions
  nextStep,
  previousStep,
  goToStep,
  addTempChild,
  removeTempChild,
  updateTempChild,
  setChoresConfigured,
  completeOnboarding,
  resetOnboarding,
  initializeOnboardingStore
} from './stores/onboardingStore';
```

### Children Store (Enhanced)

```typescript
import {
  // Existing
  children,
  selectedChildId,
  currentChild,
  selectChild,
  updateChildData,

  // New Functions
  addChild,        // Add a single child
  removeChild,     // Remove a child
  setChildren,     // Replace all children (used in onboarding)

  initializeChildStore
} from './stores/childrenStore';
```

## Testing the Onboarding

### Test First Launch

1. Open browser DevTools
2. Go to Application > Storage > Local Storage
3. Delete the `onboarding_complete` key
4. Delete the `children` key (to reset children)
5. Refresh the page
6. Onboarding should appear

### Quick Reset Function

Add this to your browser console:

```javascript
// Reset onboarding for testing
localStorage.removeItem('onboarding_complete');
localStorage.removeItem('onboarding_temp_state');
localStorage.removeItem('children');
location.reload();
```

### Test Cases

#### ✅ Happy Path
1. Complete welcome screen
2. Add 2-3 children with different emojis
3. Choose "Use Defaults" for chores
4. Complete onboarding
5. Verify children appear in child selector
6. Verify default chores are loaded

#### ✅ Edit Children
1. Start onboarding
2. Add a child
3. Click edit button
4. Change name and emoji
5. Save changes
6. Verify updates appear

#### ✅ Remove Children
1. Add multiple children
2. Remove one
3. Verify it's removed from the list
4. Ensure at least 1 child remains

#### ✅ Skip Chores
1. Complete children setup
2. Choose "Skip for Now" on chores step
3. Complete onboarding
4. Verify only default chores exist

#### ✅ Customize Chores
1. Complete children setup
2. Choose "Customize Now"
3. Add/edit chores in modal
4. Close modal
5. Complete onboarding

#### ✅ Validation
1. Try to continue from children setup without adding any children
2. Button should be disabled
3. Add a child
4. Button should become enabled

#### ✅ Progress Persistence
1. Start onboarding
2. Add children
3. Refresh page
4. Should resume at children setup with data intact

#### ✅ Back Navigation
1. Navigate to step 2 or 3
2. Click "Back" button
3. Verify you return to previous step
4. Data should be preserved

## Customization

### Change Default Chores

Edit `/src/stores/customChoresStore.ts`:

```typescript
const DEFAULT_CHORES: CustomChore[] = [
  { id: 'custom_1', label: 'Your chore', points: 10, isDefault: true, ... },
  // Add more...
];
```

### Change Emoji Options

Edit `/src/components/features/onboarding/ChildrenSetupScreen.tsx`:

```typescript
const EMOJI_OPTIONS = ['😊', '😎', '🤓', /* add more */];
```

### Change Maximum Children

Edit `/src/components/features/onboarding/ChildrenSetupScreen.tsx`:

```typescript
if (children.length >= 10) { // Change from 6 to 10
  alert('Maximum 10 children allowed');
  return;
}
```

And update the store validation in `/src/stores/onboardingStore.ts`.

### Styling

All components use Tailwind CSS classes. Key colors:
- Primary: `primary-*` (blue)
- Success: `success-*` (green)
- Error: `error-*` (red)
- Surface: `surface-*` (gray backgrounds)

## Design Decisions

### Why localStorage?
- Fast, synchronous access
- No server dependency for onboarding
- Works offline
- Simple persistence model

### Why Emoji Avatars?
- No image upload complexity
- Instant visual distinction
- Fun and kid-friendly
- Lightweight (no image hosting)
- Extensible (can add image URLs later)

### Why 4 Steps?
- Minimal friction
- Only essential setup
- < 2 minutes to complete
- Can skip optional steps

### Why Full-Screen Overlay?
- Focused experience
- No navigation confusion
- Clear progress indication
- Mobile-optimized

## Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on all interactive elements
- ✅ Proper heading hierarchy
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ High contrast text
- ✅ Large touch targets (min 44px)

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Safari (latest)
- ✅ Firefox (latest)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## Known Limitations

1. **Child IDs**: Generated from names (e.g., "John Doe" → "john_doe")
   - Duplicate names will cause issues
   - Consider adding UUID generation if needed

2. **Avatar Emoji**: Detection is simple (length <= 4)
   - May not work for all emoji sequences
   - Can be improved with better emoji detection

3. **No Image Upload**: Only emoji avatars supported
   - Could add image picker in future
   - Would need storage solution

4. **No Edit After Onboarding**: Children setup is one-time
   - Could add settings page to edit children
   - Would need UI for managing children list

## Future Enhancements

- [ ] Allow editing children after onboarding (settings page)
- [ ] Add image upload for avatars
- [ ] Add parent profile setup
- [ ] Add PIN/password setup for parent controls
- [ ] Add household name
- [ ] Add reward preferences
- [ ] Skip onboarding option (demo mode)
- [ ] Onboarding analytics
- [ ] A/B test different flows

## Troubleshooting

### Onboarding doesn't appear
- Check localStorage for `onboarding_complete` key
- Verify store initialization in main.tsx
- Check browser console for errors

### Children don't persist
- Verify localStorage is working
- Check `children` key in localStorage
- Ensure saveChildren() is called

### Progress doesn't save
- Check `onboarding_temp_state` in localStorage
- Verify saveTempState() is called
- Clear localStorage and retry

### Emojis don't render
- Update Avatar component emoji detection
- Verify emoji is in src prop
- Check browser emoji support

## Support

For issues or questions, check:
1. Browser console for errors
2. localStorage for data state
3. Network tab for any API calls
4. This guide for solutions

---

**Built with ❤️ for Kids Home Hub PWA**
