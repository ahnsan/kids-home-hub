# PWA Onboarding Best Practices for Kids Home Hub

**Version:** 1.0
**Last Updated:** November 23, 2025
**Target Application:** Kids Home Hub - Family/Household Management PWA

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [UI/UX Best Practices](#1-uiux-best-practices)
3. [Mobile-First Design](#2-mobile-first-design)
4. [PWA-Specific Considerations](#3-pwa-specific-considerations)
5. [Household Setup Patterns](#4-household-setup-patterns)
6. [Chore Management Onboarding](#5-chore-management-onboarding)
7. [Implementation Recommendations](#6-implementation-recommendations)
8. [Success Metrics & Testing](#7-success-metrics--testing)

---

## Executive Summary

### Core Principles for Kids Home Hub Onboarding

1. **Time to First Value:** 30-60-90 framework
   - 30 seconds: Complete one meaningful action
   - 60 seconds: Experience core value (aha moment)
   - 90 seconds: Feel confident they can succeed

2. **Minimum Viable Onboarding (MVO):** Focus on getting users to activation quickly
   - Eliminate unnecessary steps
   - Guide users to their "AHA!" moment with minimal friction
   - Enable immediate usefulness

3. **Current Implementation Status:**
   - ✅ Progress indicator (step dots)
   - ✅ Welcome screen with value proposition
   - ✅ LocalStorage-based state persistence
   - ✅ 4-step onboarding flow
   - 🔄 Needs: Skip/Later functionality, celebration states, gesture support, enhanced forms

---

## 1. UI/UX Best Practices

### 1.1 Progressive Disclosure Patterns

**Definition:** Gradually expose users to information over multiple screens to prevent overwhelm.

#### Implementation Strategy

```typescript
// Recommended step structure for Kids Home Hub
Step 1: Welcome & Value Proposition (current implementation)
Step 2: Add Children (1-2 children minimum, show 6 max capacity)
Step 3: Quick Chore Setup (3-5 template chores, full customization later)
Step 4: Success & Celebration (show what's possible next)
```

#### Best Practices

1. **Show Less, Provide More**
   - Display essential information upfront
   - Hide advanced features behind "..." or "Advanced" options
   - Reveal complexity gradually as users demonstrate competency

2. **Favor Multiple Screens Over Single Page**
   - Reduces cognitive load
   - Each screen should have one clear purpose
   - Current 4-step flow is optimal (don't exceed 5 steps)

3. **Contextual Help**
   - Show help content alongside each step
   - Minimize working memory requirements
   - Use tooltips for secondary features

#### Example Pattern

```jsx
// Progressive disclosure for child profile creation
// Step 1: Basic info only
<ChildForm>
  <Input name="name" required />
  <EmojiPicker required />
  <Button>Add Child</Button>
  <TextButton onClick={() => setShowAdvanced(true)}>
    Advanced options
  </TextButton>
</ChildForm>

// Step 2: Advanced (if user clicks)
{showAdvanced && (
  <AdvancedOptions>
    <Input name="age" type="number" />
    <Input name="allowanceRate" type="number" />
    <ColorPicker />
  </AdvancedOptions>
)}
```

### 1.2 Step Indicators and Progress Tracking

**Current Implementation:** Dot-based progress indicator (`ProgressIndicator.tsx`)

#### Enhancement Recommendations

1. **Add Progress Percentage**
   ```jsx
   <div class="text-center mb-2">
     <span class="text-sm text-gray-600">
       Step {currentStep} of {totalSteps} · {progress}% complete
     </span>
   </div>
   ```

2. **Make Dots Interactive (Optional)**
   - Allow clicking on completed steps to navigate back
   - Disable future steps until prerequisites met
   ```jsx
   <button
     onClick={() => canNavigateToStep(step) && goToStep(step)}
     disabled={!canNavigateToStep(step)}
     class={clsx(
       'h-2 rounded-full transition-all',
       step < currentStep && 'cursor-pointer hover:scale-110'
     )}
   />
   ```

3. **Step Labels for Context**
   ```jsx
   const stepLabels = {
     1: 'Welcome',
     2: 'Add Family',
     3: 'Setup Chores',
     4: 'Complete'
   };

   <p class="text-xs text-gray-500 mt-2">
     {stepLabels[currentStep]}
   </p>
   ```

4. **Checklist Pattern** (Alternative/Supplementary)
   - Great for showing what's required
   - Shows progress visually
   - Can be collapsed after completion

   ```jsx
   <OnboardingChecklist>
     <ChecklistItem completed={tempChildren.length > 0}>
       ✓ Add at least one child
     </ChecklistItem>
     <ChecklistItem completed={choresConfigured}>
       Choose chores (optional)
     </ChecklistItem>
   </OnboardingChecklist>
   ```

### 1.3 Skip/Later Functionality

**Critical Missing Feature** - Users must have exit control

#### Design Patterns

1. **Skip Individual Steps** (Recommended)
   ```jsx
   <Button
     variant="ghost"
     onClick={() => skipStep()}
     class="text-gray-500"
   >
     Skip for now
   </Button>
   ```

2. **Exit Anywhere** (Essential)
   ```jsx
   // Add to onboarding layout header
   <button
     onClick={handleExitOnboarding}
     class="absolute top-4 right-4 text-gray-400"
     aria-label="Exit onboarding"
   >
     <XIcon />
   </button>
   ```

3. **Save Draft Pattern**
   - Already implemented via `TEMP_STATE_KEY` in localStorage
   - Enhance with explicit messaging:
   ```jsx
   const handleExit = () => {
     saveTempState({...currentState});
     showToast("Progress saved! You can continue anytime.");
     completeOnboarding(); // Mark as complete but show reminder
   };
   ```

4. **Return Entry Points**
   ```jsx
   // On subsequent app launches
   if (onboardingComplete.value && !allDataComplete) {
     showOptionalBanner({
       message: "Finish setting up your family",
       action: () => resumeOnboarding()
     });
   }
   ```

#### Best Practices

- **Always provide skip option** except for critical steps
- **Explain next steps** when user skips
- **Indicate pickup later** with clear messaging
- **Show progress** so users know how much remains
- **Enable resume** from exact point they left

### 1.4 Welcome Screen Design

**Current Implementation:** `/src/components/features/onboarding/WelcomeScreen.tsx`

#### Enhancement Recommendations

1. **Follow the 3-Second Rule**
   - Current welcome screen is content-rich (good for first launch)
   - Consider animation timing: fade-in should be < 500ms
   - Don't block interaction with long animations

2. **Value Proposition First**
   ✅ Current implementation is excellent:
   - Clear headline: "Welcome to Kids Home Hub!"
   - Benefit-focused description
   - 3 key features with icons
   - Estimated time: "Takes less than 2 minutes"

3. **Gradual Engagement**
   - ✅ "Get Started" button (not forcing signup immediately)
   - Consider adding: "See how it works" demo video link
   - Alternative entry: "Browse templates" before committing

4. **Branding Consistency**
   - ✅ App icon/logo present
   - Consider: subtle animation on icon (pulse, scale, or rotation)
   ```jsx
   <div class="w-24 h-24 ... animate-pulse-slow">
     {/* icon */}
   </div>
   ```

5. **Avoid Common Mistakes**
   - ✅ No lengthy text blocks
   - ✅ Visual hierarchy clear
   - ✅ CTA button prominent
   - ⚠️ Add: "Already have data? Skip setup"

### 1.5 Form Design for Collecting User Data

#### Mobile-Optimized Form Patterns

**Child Profile Creation Form** (Step 2)

```jsx
<form onSubmit={handleAddChild}>
  {/* Name Input - Most important field first */}
  <div class="mb-4">
    <label
      for="childName"
      class="block text-sm font-medium text-gray-700 mb-1"
    >
      Child's Name
    </label>
    <input
      id="childName"
      type="text"
      inputMode="text"
      autoCapitalize="words"
      autoComplete="given-name"
      placeholder="Enter name"
      class="w-full px-4 py-3 text-base rounded-lg border"
      maxLength={30}
      required
    />
    {/* Character count */}
    <p class="text-xs text-gray-500 mt-1">
      {nameLength}/30 characters
    </p>
  </div>

  {/* Emoji/Avatar Selection - Visual, fun, quick */}
  <div class="mb-6">
    <label class="block text-sm font-medium text-gray-700 mb-2">
      Choose an Avatar
    </label>
    <EmojiGrid
      selected={selectedEmoji}
      onChange={setSelectedEmoji}
    />
  </div>

  {/* Submit Button - Touch-friendly */}
  <Button
    type="submit"
    variant="primary"
    size="lg"
    disabled={!canSubmit}
    class="w-full min-h-[48px]"
  >
    Add {childName || 'Child'}
  </Button>
</form>
```

#### Form Design Principles

1. **Minimize Keyboard Usage**
   - Use pickers: emoji picker, color picker, date picker
   - Use toggles, checkboxes, radio buttons
   - Save text input for names only

2. **Auto-completion & Validation**
   ```jsx
   // Real-time validation feedback
   <Input
     value={name}
     onChange={validateName}
     error={nameError}
     success={nameValid}
     pattern="[A-Za-z ]+"
   />
   ```

3. **Clear Field Focus States**
   ```css
   input:focus {
     outline: 2px solid theme('colors.primary.500');
     outline-offset: 2px;
     border-color: theme('colors.primary.500');
   }
   ```

4. **Appropriate Input Types**
   ```jsx
   // Text input
   <input type="text" inputMode="text" autoComplete="name" />

   // Number input (age, allowance)
   <input type="number" inputMode="numeric" pattern="[0-9]*" />

   // Email input (if collecting parent email)
   <input type="email" inputMode="email" autoComplete="email" />
   ```

5. **Field Sizing**
   - Label: 12-14px (text-sm)
   - Input text: 16px minimum (prevents iOS zoom)
   - Input height: 48px minimum (touch target)
   - Spacing between fields: 16px minimum

### 1.6 Success States and Completion Feedback

**Critical Missing Feature** - No celebration on completion

#### Celebration Patterns

1. **Completion Screen Design**

```jsx
// New file: /src/components/features/onboarding/CompletionScreen.tsx
export const CompletionScreen = ({ children, onFinish }) => {
  return (
    <div class="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      {/* Celebration Animation */}
      <div class="mb-6 relative">
        <Confetti />
        <div class="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-scale-in">
          <svg class="w-12 h-12 text-white" /* checkmark icon */ />
        </div>
      </div>

      {/* Success Message */}
      <h1 class="text-3xl font-bold text-gray-900 mb-3">
        You're All Set! 🎉
      </h1>

      <p class="text-lg text-gray-600 mb-8 max-w-md">
        {children.length} {children.length === 1 ? 'child' : 'children'} added.
        Start assigning chores and tracking progress!
      </p>

      {/* What's Next Preview */}
      <div class="space-y-3 mb-10 w-full max-w-sm">
        <NextStepCard
          icon={<ChoresIcon />}
          title="Assign Chores"
          description="Create tasks and assign to family members"
        />
        <NextStepCard
          icon={<BankIcon />}
          title="Setup Allowances"
          description="Track savings and teach money skills"
        />
        <NextStepCard
          icon={<PointsIcon />}
          title="Award Points"
          description="Reward completion and good behavior"
        />
      </div>

      {/* Primary CTA */}
      <Button
        variant="primary"
        size="lg"
        onClick={onFinish}
        class="w-full max-w-sm mb-4"
      >
        Start Using Kids Home Hub
      </Button>

      {/* Secondary Action */}
      <TextButton onClick={handleCustomizeMore}>
        Customize more settings
      </TextButton>
    </div>
  );
};
```

2. **Micro-interactions for Step Completion**

```jsx
// When child is added successfully
const handleChildAdded = (child) => {
  addTempChild(child.name, child.emoji);

  // Haptic feedback (if supported)
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }

  // Visual feedback
  showToast({
    icon: '✓',
    message: `${child.name} added!`,
    variant: 'success',
    duration: 2000
  });

  // Subtle animation on child card
  animateNewItem(`child-${child.id}`);
};
```

3. **Progress Milestones**

```jsx
// Celebrate when reaching certain milestones
useEffect(() => {
  if (tempChildren.length === 1) {
    // First child added
    celebrateMilestone("First family member added! 🎉");
  }
  if (tempChildren.length === 3) {
    // Multiple children
    celebrateMilestone("Family's growing! 👨‍👩‍👧‍👦");
  }
}, [tempChildren.length]);
```

4. **Three Types of Success States**

**Confirmation States** - "Did I enter correct info?"
```jsx
<Input
  value={childName}
  onBlur={validateName}
  icon={nameValid ? <CheckIcon class="text-green-500" /> : null}
/>
```

**Context States** - "Where am I in the process?"
```jsx
<ProgressIndicator currentStep={2} totalSteps={4} />
<p class="text-sm text-gray-600">2 of 4 children added</p>
```

**Encouragement States** - "I accomplished something meaningful!"
```jsx
// After completing chore setup
<SuccessBanner>
  <StarIcon /> Great choice! These chores will help build responsibility.
</SuccessBanner>
```

---

## 2. Mobile-First Design

### 2.1 Touch-Friendly Interactions

#### Touch Target Sizing

**Minimum Requirements:**
- Touch targets: 48×48 DP (approximately 9mm physical size)
- Apple's recommendation: 44×44 pixels
- Spacing between targets: 8px minimum

**Implementation:**

```jsx
// Button component should enforce minimums
export const Button = ({ children, size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'px-3 py-2 min-h-[40px]',      // Compact, but still touch-friendly
    md: 'px-4 py-2.5 min-h-[44px]',    // Standard
    lg: 'px-6 py-3 min-h-[48px]',      // Primary actions
    xl: 'px-8 py-4 min-h-[56px]'       // Hero CTAs
  };

  return (
    <button
      class={clsx('rounded-lg font-medium', sizeClasses[size])}
      {...props}
    >
      {children}
    </button>
  );
};
```

#### Spacing & Layout

```css
/* Onboarding-specific spacing */
.onboarding-container {
  padding: 1rem;          /* 16px minimum edge padding */
  gap: 1rem;              /* 16px between sections */
}

.form-field-group {
  margin-bottom: 1.5rem;  /* 24px between form fields */
}

.button-group {
  gap: 0.75rem;           /* 12px between buttons */
}

/* Safe area handling for iOS notch/island */
.onboarding-screen {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}
```

#### Hover States → Active States

```css
/* Desktop hover states become active states on mobile */
.interactive-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

/* Don't use hover on touch devices */
@media (hover: hover) {
  .interactive-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }
}

/* Use active state for touch feedback */
.interactive-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### 2.2 Swipe Gestures vs Button Navigation

#### When to Use Each

| Pattern | Use Case | Example in Kids Home Hub |
|---------|----------|--------------------------|
| **Buttons** | Primary actions, critical steps | "Add Child", "Complete Setup" |
| **Swipe** | Navigation between screens, dismissing cards | Moving between onboarding steps |
| **Both** | Provide flexibility | Swipe OR button to advance |

#### Implementation Strategy

**Hybrid Approach (Recommended):**

```jsx
import { useSwipe } from '../hooks/useSwipe';

export const OnboardingContainer = () => {
  const { handleTouchStart, handleTouchEnd } = useSwipe({
    onSwipeLeft: canProceed.value ? nextStep : null,
    onSwipeRight: currentStep.value > 1 ? previousStep : null,
    threshold: 50  // 50px minimum swipe distance
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      class="onboarding-screen"
    >
      {/* Step content */}

      {/* Always provide button alternatives */}
      <div class="flex gap-3 mt-8">
        {currentStep > 1 && (
          <Button variant="secondary" onClick={previousStep}>
            Back
          </Button>
        )}
        <Button
          variant="primary"
          onClick={nextStep}
          disabled={!canProceed.value}
          class="flex-1"
        >
          {currentStep === 4 ? 'Finish' : 'Continue'}
        </Button>
      </div>

      {/* Swipe hint (show once) */}
      {!hasSeenSwipeHint && (
        <div class="text-center text-sm text-gray-500 mt-4 animate-fade-in">
          <SwipeIcon /> Swipe to navigate
        </div>
      )}
    </div>
  );
};
```

**Swipe Hook Implementation:**

```typescript
// /src/hooks/useSwipe.ts
import { useState } from 'preact/hooks';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50
}: SwipeConfig) => {
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);

    const distance = touchStart - e.changedTouches[0].clientX;

    if (Math.abs(distance) < threshold) return;

    if (distance > threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    if (distance < -threshold && onSwipeRight) {
      onSwipeRight();
    }
  };

  return { handleTouchStart, handleTouchEnd };
};
```

#### Best Practices for Gestures

1. **Always Provide Visual Alternatives**
   - Gestures are hidden by default
   - Not all users will discover them
   - Accessibility requirement

2. **Provide Onboarding for Gestures**
   ```jsx
   // Show on first onboarding only
   <GestureHint visible={showHint}>
     <AnimatedHand /> Swipe left to continue
   </GestureHint>
   ```

3. **Keep Gestures Simple**
   - Kids Home Hub: Only left/right swipe for navigation
   - Avoid: pinch, rotate, multi-finger gestures in onboarding
   - Complex gestures require too much explanation

4. **Provide Haptic Feedback**
   ```javascript
   const triggerHaptic = (type = 'light') => {
     if (navigator.vibrate) {
       const patterns = {
         light: 10,
         medium: 20,
         heavy: 50
       };
       navigator.vibrate(patterns[type]);
     }
   };
   ```

### 2.3 Optimal Form Field Sizing

#### Input Field Specifications

```css
/* Mobile-optimized form fields */
.form-input {
  /* Prevent iOS zoom on focus (16px minimum) */
  font-size: 16px;

  /* Touch-friendly height */
  min-height: 48px;

  /* Comfortable padding */
  padding: 12px 16px;

  /* Clear borders for tap targeting */
  border: 2px solid theme('colors.gray.300');
  border-radius: 8px;

  /* Full width on mobile */
  width: 100%;
}

/* Label sizing */
.form-label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
}

/* Helper text */
.form-helper {
  font-size: 12px;
  margin-top: 4px;
  color: theme('colors.gray.600');
}

/* Error text */
.form-error {
  font-size: 12px;
  margin-top: 4px;
  color: theme('colors.red.600');
}
```

#### Responsive Field Layout

```jsx
// Child profile form - mobile-first
<div class="grid grid-cols-1 gap-4">
  {/* Full width on mobile */}
  <FormField label="Name" required>
    <Input
      type="text"
      placeholder="Child's name"
      class="w-full"
    />
  </FormField>

  {/* Grid on larger screens */}
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <FormField label="Age">
      <Input type="number" placeholder="8" />
    </FormField>
    <FormField label="Allowance">
      <Input type="number" placeholder="5.00" />
    </FormField>
  </div>
</div>
```

### 2.4 Keyboard Handling on Mobile

#### Input Mode Optimization

```jsx
// Text input (shows full keyboard)
<input type="text" inputMode="text" />

// Numeric input (shows number pad)
<input
  type="number"
  inputMode="numeric"
  pattern="[0-9]*"  // iOS optimization
/>

// Decimal input (shows number pad with decimal)
<input
  type="number"
  inputMode="decimal"
  step="0.01"
/>

// Email input (shows keyboard with @ and .)
<input
  type="email"
  inputMode="email"
  autoComplete="email"
/>

// URL input (shows keyboard with .com, etc.)
<input
  type="url"
  inputMode="url"
/>
```

#### Auto-complete Attributes

```jsx
// Child name
<input
  type="text"
  autoComplete="given-name"
  autoCapitalize="words"
/>

// Age
<input
  type="number"
  autoComplete="bday-year"
  inputMode="numeric"
/>

// Parent information
<input type="email" autoComplete="email" />
<input type="tel" autoComplete="tel" />
```

#### Keyboard Navigation Support

```jsx
// Enable next/previous on mobile keyboards
<form onSubmit={handleSubmit}>
  <input
    id="field1"
    onKeyDown={(e) => {
      if (e.key === 'Enter') {
        document.getElementById('field2')?.focus();
      }
    }}
  />
  <input id="field2" />
  <button type="submit">Submit</button>
</form>
```

#### Keyboard Visibility Handling

```typescript
// Scroll to input when keyboard opens
const handleFocus = (e: FocusEvent) => {
  // Delay to allow keyboard animation
  setTimeout(() => {
    e.target.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }, 300);
};

// Apply to inputs
<input onFocus={handleFocus} />
```

#### Close Keyboard Handling

```jsx
// Allow users to dismiss keyboard
<div
  class="keyboard-backdrop"
  onClick={() => document.activeElement?.blur()}
/>

// Or use a "Done" button
<Button onClick={() => document.activeElement?.blur()}>
  Done
</Button>
```

---

## 3. PWA-Specific Considerations

### 3.1 Install Prompts Timing

**Critical Finding:** Don't show install prompt immediately on first visit.

#### Optimal Timing Strategies

**Strategy 1: After Value Demonstration**
```typescript
// Show install prompt after onboarding completion
export const completeOnboarding = () => {
  localStorage.setItem(STORAGE_KEY, 'true');
  onboardingComplete.value = true;
  clearTempState();

  // Show install prompt if available
  setTimeout(() => {
    showInstallPrompt('You're all set! Install for quick access.');
  }, 2000); // 2s delay for celebration
};
```

**Strategy 2: After User Engagement**
```typescript
// Track user engagement
const engagementEvents = signal(0);

// Trigger on meaningful actions
const trackEngagement = (action: string) => {
  engagementEvents.value++;

  // Criteria: 30 seconds + 3 meaningful actions
  if (engagementEvents.value >= 3 && !installPromptShown.value) {
    showInstallPrompt();
  }
};

// Examples of meaningful actions:
// - Added a child
// - Created a chore
// - Completed a task
// - Awarded points
```

**Strategy 3: Context-Aware Prompts**
```typescript
const installPromptContexts = {
  afterChildrenAdded: {
    message: "Add Kids Home Hub to your home screen for quick access!",
    icon: "🏠"
  },
  afterFirstChoreComplete: {
    message: "Install the app to get notifications when chores are done!",
    icon: "🔔"
  },
  afterThreeDays: {
    message: "You're using Kids Home Hub regularly! Install for faster access.",
    icon: "⚡"
  }
};
```

#### Install Prompt UI Design

```jsx
// Custom install prompt (better than browser default)
export const InstallPrompt = ({ onInstall, onDismiss }) => {
  return (
    <div class="fixed bottom-0 inset-x-0 p-4 pb-safe z-50">
      <Card class="flex items-center gap-4 shadow-lg">
        <div class="flex-shrink-0">
          <img
            src="/icons/icon-72x72.png"
            alt="Kids Home Hub"
            class="w-12 h-12 rounded-lg"
          />
        </div>

        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900">
            Install Kids Home Hub
          </p>
          <p class="text-sm text-gray-600">
            Quick access from your home screen
          </p>
        </div>

        <div class="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
          >
            Later
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onInstall}
          >
            Install
          </Button>
        </div>
      </Card>
    </div>
  );
};
```

#### Platform-Specific Install Instructions

```jsx
// Show platform-specific instructions
export const InstallInstructions = ({ platform }) => {
  const instructions = {
    ios: {
      title: "Install on iPhone/iPad",
      steps: [
        "Tap the Share button in Safari",
        "Scroll down and tap 'Add to Home Screen'",
        "Tap 'Add' in the top right"
      ],
      icon: <ShareIcon />
    },
    android: {
      title: "Install on Android",
      steps: [
        "Tap the menu (three dots)",
        "Tap 'Install app' or 'Add to Home Screen'",
        "Follow the prompts"
      ],
      icon: <AddBoxIcon />
    }
  };

  return (
    <Modal>
      <h3>{instructions[platform].title}</h3>
      <ol>
        {instructions[platform].steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>
    </Modal>
  );
};
```

#### beforeinstallprompt Event Handling

```typescript
// /src/utils/installPrompt.ts
import { signal } from '@preact/signals';

export const installPromptEvent = signal<any>(null);
export const isInstalled = signal(false);

// Capture the event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPromptEvent.value = e;
});

// Detect if already installed
window.addEventListener('appinstalled', () => {
  isInstalled.value = true;
  installPromptEvent.value = null;
});

// Check if launched as PWA
export const isPWA = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;

// Trigger install prompt
export const triggerInstall = async () => {
  if (!installPromptEvent.value) return false;

  installPromptEvent.value.prompt();
  const { outcome } = await installPromptEvent.value.userChoice;

  if (outcome === 'accepted') {
    isInstalled.value = true;
  }

  installPromptEvent.value = null;
  return outcome === 'accepted';
};
```

### 3.2 Offline-First Onboarding

**Key Principle:** Onboarding must work without internet connection.

#### Implementation Strategy

1. **All Assets Pre-cached**
```typescript
// vite.config.ts - Ensure onboarding assets are cached
export default defineConfig({
  plugins: [
    VitePWA({
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,woff2}'
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\..*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ]
});
```

2. **Offline-First Data Flow**
```typescript
// Onboarding data saved locally first, synced later
export const addChildOfflineFirst = async (child: ChildProfile) => {
  // 1. Save to IndexedDB immediately (works offline)
  await db.children.add({
    ...child,
    syncStatus: 'pending',
    createdAt: Date.now()
  });

  // 2. Update UI immediately
  childrenStore.add(child);

  // 3. Sync to server when online (background)
  if (navigator.onLine) {
    syncToServer(child).catch(err => {
      console.warn('Sync failed, will retry later:', err);
    });
  }

  return child;
};
```

3. **Offline Indicator During Onboarding**
```jsx
export const OnboardingLayout = ({ children }) => {
  const isOffline = !navigator.onLine;

  return (
    <div class="min-h-screen bg-gray-50">
      {isOffline && (
        <Banner variant="info" class="sticky top-0 z-50">
          <WifiOffIcon /> You're offline. Changes will sync when connected.
        </Banner>
      )}

      {children}
    </div>
  );
};
```

4. **Introduce Offline Features Early**
```jsx
// In welcome screen or step 4 completion
<FeatureHighlight icon={<CloudOffIcon />}>
  <h4>Works Offline</h4>
  <p>
    Track chores, award points, and manage allowances even without internet.
    Everything syncs automatically when you're back online.
  </p>
</FeatureHighlight>
```

### 3.3 LocalStorage vs IndexedDB for Onboarding State

**Current Implementation:** LocalStorage (simple key-value)

#### When to Use Each

| Storage | Use Case | Kids Home Hub Usage |
|---------|----------|---------------------|
| **LocalStorage** | Simple flags, preferences, small JSON | ✅ Onboarding completion status, current step |
| **IndexedDB** | Structured data, large datasets, queries | ✅ Children profiles, chores, transactions |

#### Migration Strategy

**Keep Current LocalStorage for:**
- `onboarding_complete` flag
- `onboarding_temp_state` (temporary step data)
- App preferences

**Use IndexedDB for:**
- Children profiles (already in `/src/db/schema.ts`)
- Chores data
- Transaction history

#### Enhanced Persistence with Storage API

```typescript
// Request persistent storage for critical data
export const requestPersistentStorage = async () => {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();

    if (isPersisted) {
      console.log('✅ Storage will not be cleared automatically');
    } else {
      console.warn('⚠️ Storage may be cleared under pressure');
    }

    return isPersisted;
  }
  return false;
};

// Call after onboarding completion
export const completeOnboarding = async () => {
  // ... existing code ...

  // Request persistent storage for user data
  await requestPersistentStorage();
};
```

#### Fallback Strategy

```typescript
// Handle storage failures gracefully
const safeStorageWrite = (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded');
      // Fallback: store in memory only
      memoryStorage.set(key, value);
      showStorageWarning();
    }
    return false;
  }
};
```

### 3.4 Home Screen Add Instructions

**Platform-Specific Guidance**

```jsx
import { useState, useEffect } from 'preact/hooks';

export const HomeScreenInstructions = () => {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) {
      setPlatform('ios');
    } else if (/Android/.test(ua)) {
      setPlatform('android');
    }
  }, []);

  const instructions = {
    ios: {
      title: "Add to iPhone Home Screen",
      steps: [
        {
          icon: <SafariIcon />,
          text: "Open in Safari browser (required for iOS)"
        },
        {
          icon: <ShareIcon />,
          text: "Tap the Share button (bottom center)",
          image: "/assets/ios-share.png"
        },
        {
          icon: <PlusSquareIcon />,
          text: "Scroll and tap 'Add to Home Screen'",
          image: "/assets/ios-add.png"
        },
        {
          icon: <CheckIcon />,
          text: "Tap 'Add' in the top right corner"
        }
      ]
    },
    android: {
      title: "Add to Android Home Screen",
      steps: [
        {
          icon: <ChromeIcon />,
          text: "Open in Chrome browser (recommended)"
        },
        {
          icon: <MenuIcon />,
          text: "Tap the menu (⋮ three dots)",
          image: "/assets/android-menu.png"
        },
        {
          icon: <InstallIcon />,
          text: "Tap 'Install app' or 'Add to Home Screen'"
        },
        {
          icon: <CheckIcon />,
          text: "Confirm by tapping 'Install'"
        }
      ]
    },
    desktop: {
      title: "Install on Desktop",
      steps: [
        {
          icon: <InstallDesktopIcon />,
          text: "Look for the install icon in your browser's address bar"
        },
        {
          icon: <CheckIcon />,
          text: "Click 'Install' to add to your applications"
        }
      ]
    }
  };

  return (
    <div class="max-w-md mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">
        {instructions[platform].title}
      </h2>

      <ol class="space-y-6">
        {instructions[platform].steps.map((step, index) => (
          <li key={index} class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
              {index + 1}
            </div>
            <div class="flex-1">
              <p class="text-gray-900">{step.text}</p>
              {step.image && (
                <img
                  src={step.image}
                  alt={step.text}
                  class="mt-2 rounded-lg border border-gray-200"
                />
              )}
            </div>
          </li>
        ))}
      </ol>

      <div class="mt-8 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-900">
          <strong>Tip:</strong> Once installed, Kids Home Hub will work offline and
          load instantly from your home screen!
        </p>
      </div>
    </div>
  );
};
```

#### Integration Points

```jsx
// Show after onboarding completion (optional)
export const CompletionScreen = ({ onFinish }) => {
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const isPWA = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div>
      {/* ... completion content ... */}

      {!isPWA && (
        <Card class="mt-6">
          <h3>Want quick access?</h3>
          <p>Add Kids Home Hub to your home screen!</p>
          <Button onClick={() => setShowInstallHelp(true)}>
            Show me how
          </Button>
        </Card>
      )}

      <Modal open={showInstallHelp}>
        <HomeScreenInstructions />
      </Modal>
    </div>
  );
};
```

---

## 4. Household Setup Patterns

### 4.1 Multi-User/Multi-Child Configuration

**Current Implementation:** Temporary children array during onboarding

#### Best Practices

**1. Minimum Viable Setup**
```typescript
// Require at least 1 child, support up to 6
const MIN_CHILDREN = 1;
const MAX_CHILDREN = 6;

export const canProceed = computed(() => {
  switch (currentStep.value) {
    case 2: // Children setup
      return tempChildren.value.length >= MIN_CHILDREN;
    // ...
  }
});
```

**2. Progressive Addition Pattern**

```jsx
// Allow adding children one at a time with immediate feedback
export const ChildrenSetupStep = () => {
  const [addingNew, setAddingNew] = useState(false);

  return (
    <div class="space-y-6">
      <h2>Add Your Family</h2>
      <p class="text-gray-600">
        Add children who will use Kids Home Hub
        ({tempChildren.value.length}/{MAX_CHILDREN})
      </p>

      {/* Added children list */}
      <div class="space-y-3">
        {tempChildren.value.map(child => (
          <ChildCard
            key={child.id}
            child={child}
            onEdit={() => editChild(child.id)}
            onRemove={() => removeTempChild(child.id)}
          />
        ))}
      </div>

      {/* Add button */}
      {tempChildren.value.length < MAX_CHILDREN && (
        <Button
          variant="secondary"
          onClick={() => setAddingNew(true)}
          class="w-full"
        >
          <PlusIcon /> Add Another Child
        </Button>
      )}

      {/* Quick add form */}
      {addingNew && (
        <QuickAddForm
          onAdd={(child) => {
            addTempChild(child.name, child.emoji);
            setAddingNew(false);
          }}
          onCancel={() => setAddingNew(false)}
        />
      )}

      {/* Navigation */}
      <div class="flex gap-3">
        <Button variant="ghost" onClick={previousStep}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={nextStep}
          disabled={!canProceed.value}
          class="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
```

**3. Family Presets (Optional Enhancement)**

```jsx
// Offer quick setup templates
const familyPresets = {
  single: {
    label: "1 child",
    icon: "👤",
    children: 1
  },
  two: {
    label: "2 children",
    icon: "👥",
    children: 2
  },
  three: {
    label: "3+ children",
    icon: "👨‍👩‍👧‍👦",
    children: 3
  },
  custom: {
    label: "Custom setup",
    icon: "✏️",
    children: 0
  }
};

// Quick selection screen
<div class="grid grid-cols-2 gap-4">
  {Object.entries(familyPresets).map(([key, preset]) => (
    <button
      key={key}
      onClick={() => setupWithPreset(preset)}
      class="p-6 border-2 rounded-xl hover:border-primary-500"
    >
      <div class="text-4xl mb-2">{preset.icon}</div>
      <p class="font-medium">{preset.label}</p>
    </button>
  ))}
</div>
```

### 4.2 Profile Creation Flows

**Optimized Child Profile Form**

```jsx
export const ChildProfileForm = ({ onSubmit, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [emoji, setEmoji] = useState(initialData?.emoji || '👧');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Optional advanced fields
  const [age, setAge] = useState(initialData?.age || '');
  const [allowance, setAllowance] = useState(initialData?.allowance || '');

  const canSubmit = name.trim().length >= 2;

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSubmit({ name, emoji, age, allowance });
    }}>
      {/* Essential Fields */}
      <div class="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" class="form-label">
            Child's Name <span class="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onInput={(e) => setName(e.currentTarget.value)}
            placeholder="Enter name"
            class="form-input"
            maxLength={30}
            autoFocus
            required
          />
          <p class="form-helper">
            {name.length}/30 characters
          </p>
        </div>

        {/* Emoji Avatar */}
        <div>
          <label class="form-label">
            Choose Avatar <span class="text-red-500">*</span>
          </label>
          <EmojiPicker
            selected={emoji}
            onChange={setEmoji}
            categories={['people', 'animals']}
          />
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          class="text-sm text-primary-600 hover:text-primary-700"
        >
          {showAdvanced ? '− Hide' : '+ Show'} advanced options
        </button>

        {/* Advanced Fields */}
        {showAdvanced && (
          <div class="pl-4 border-l-2 border-gray-200 space-y-4">
            <div>
              <label htmlFor="age" class="form-label">Age (optional)</label>
              <input
                id="age"
                type="number"
                inputMode="numeric"
                value={age}
                onInput={(e) => setAge(e.currentTarget.value)}
                placeholder="8"
                class="form-input"
                min="1"
                max="18"
              />
            </div>

            <div>
              <label htmlFor="allowance" class="form-label">
                Weekly Allowance (optional)
              </label>
              <div class="relative">
                <span class="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  id="allowance"
                  type="number"
                  inputMode="decimal"
                  value={allowance}
                  onInput={(e) => setAllowance(e.currentTarget.value)}
                  placeholder="5.00"
                  class="form-input pl-8"
                  step="0.50"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div class="flex gap-3 mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={!canSubmit}
          class="flex-1"
        >
          {initialData ? 'Update' : 'Add'} Child
        </Button>
      </div>
    </form>
  );
};
```

### 4.3 Avatar Selection/Upload

**Emoji-First Approach (Recommended for Kids Home Hub)**

```jsx
export const EmojiPicker = ({ selected, onChange, categories = ['all'] }) => {
  const emojiSets = {
    people: ['👶', '👧', '🧒', '👦', '👨', '👩', '🧑', '👴', '👵'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨'],
    nature: ['🌸', '🌻', '🌺', '🌹', '🌷', '⭐', '✨', '💫', '🌙'],
    sports: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏓', '🏸', '🥊'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑']
  };

  const allEmojis = categories.includes('all')
    ? Object.values(emojiSets).flat()
    : categories.flatMap(cat => emojiSets[cat]);

  return (
    <div class="space-y-4">
      {/* Selected Preview */}
      <div class="flex items-center gap-4">
        <div class="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-5xl">
          {selected}
        </div>
        <div>
          <p class="text-sm text-gray-600">Selected avatar</p>
          <p class="text-xs text-gray-500">Tap an emoji to change</p>
        </div>
      </div>

      {/* Emoji Grid */}
      <div class="grid grid-cols-6 sm:grid-cols-8 gap-2">
        {allEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            class={clsx(
              'w-12 h-12 rounded-lg text-2xl flex items-center justify-center transition-all',
              'hover:scale-110 active:scale-95',
              selected === emoji
                ? 'bg-primary-100 ring-2 ring-primary-500'
                : 'bg-gray-100 hover:bg-gray-200'
            )}
            aria-label={`Select ${emoji} emoji`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Category Tabs (if multiple categories) */}
      {categories.length > 1 && (
        <div class="flex gap-2 overflow-x-auto">
          {Object.keys(emojiSets).map(category => (
            <button
              key={category}
              type="button"
              class="px-3 py-1 rounded-full text-sm bg-gray-100"
            >
              {category}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Optional: Photo Upload (Future Enhancement)**

```jsx
export const AvatarUpload = ({ currentAvatar, onUpload, type = 'emoji' }) => {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image must be under 2MB');
      return;
    }

    setUploading(true);

    try {
      // Resize and compress
      const resized = await resizeImage(file, 200, 200);

      // Convert to base64 for offline storage
      const base64 = await fileToBase64(resized);

      onUpload(base64);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div class="space-y-4">
      {/* Current Avatar */}
      <div class="flex justify-center">
        {type === 'emoji' ? (
          <div class="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-6xl">
            {currentAvatar}
          </div>
        ) : (
          <img
            src={currentAvatar}
            alt="Avatar"
            class="w-24 h-24 rounded-full object-cover"
          />
        )}
      </div>

      {/* Upload Button */}
      <label class="block">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          class="hidden"
        />
        <Button
          as="span"
          variant="secondary"
          disabled={uploading}
          class="w-full cursor-pointer"
        >
          {uploading ? (
            <>
              <Spinner /> Uploading...
            </>
          ) : (
            <>
              <UploadIcon /> Upload Photo
            </>
          )}
        </Button>
      </label>

      <p class="text-xs text-gray-500 text-center">
        Or continue with emoji avatar
      </p>
    </div>
  );
};
```

### 4.4 Customization Options

**Balance: Quick Start vs Full Customization**

#### Strategy: Defaults First, Customize Later

```jsx
// Onboarding: Minimal required info
const onboardingFields = {
  required: ['name', 'emoji'],
  optional: []
};

// Post-onboarding: Full customization available
const profileFields = {
  basic: ['name', 'emoji', 'age'],
  rewards: ['allowance', 'pointsGoal', 'rewardPreferences'],
  schedule: ['chores', 'routines', 'bedtime'],
  advanced: ['notifications', 'restrictions', 'permissions']
};
```

#### Implementation

```jsx
// Onboarding: Quick add with defaults
export const QuickAddChild = ({ onAdd }) => {
  return (
    <form onSubmit={handleQuickAdd}>
      <Input name="name" required />
      <EmojiPicker required />
      <Button type="submit">Add Child</Button>
      <p class="text-xs text-gray-500">
        You can customize more settings later
      </p>
    </form>
  );
};

// Settings: Full customization
export const ChildProfileSettings = ({ childId }) => {
  return (
    <div class="space-y-6">
      <Section title="Basic Info">
        <Input name="name" />
        <Input name="age" />
        <EmojiPicker />
      </Section>

      <Section title="Rewards">
        <Input name="allowance" type="number" />
        <Input name="pointsGoal" type="number" />
        <RewardsList />
      </Section>

      <Section title="Schedule">
        <ChoreAssignments />
        <RoutineBuilder />
      </Section>

      {/* ... more sections ... */}
    </div>
  );
};
```

#### Customization Discovery

```jsx
// Hint about additional customization after onboarding
<CompletionScreen>
  {/* ... success content ... */}

  <Card class="mt-6">
    <h3>💡 Did you know?</h3>
    <p>You can customize:</p>
    <ul class="text-sm space-y-1">
      <li>✓ Chore schedules and difficulty</li>
      <li>✓ Allowance amounts and frequency</li>
      <li>✓ Point rewards and goals</li>
      <li>✓ Notification preferences</li>
    </ul>
    <Button variant="ghost" size="sm" onClick={goToSettings}>
      Customize now
    </Button>
  </Card>
</CompletionScreen>
```

---

## 5. Chore Management Onboarding

### 5.1 Template vs Customization Balance

**Philosophy:** Start with templates, customize later

#### Template-First Approach

```typescript
// Default chore templates categorized by child age/household
export const choreTemplates = {
  young: {
    label: "Ages 4-7",
    icon: "🧒",
    chores: [
      { name: "Make bed", points: 5, difficulty: "easy" },
      { name: "Put toys away", points: 5, difficulty: "easy" },
      { name: "Feed pet", points: 10, difficulty: "medium" },
      { name: "Set table", points: 10, difficulty: "medium" }
    ]
  },
  middle: {
    label: "Ages 8-12",
    icon: "👦",
    chores: [
      { name: "Make bed", points: 5, difficulty: "easy" },
      { name: "Clean room", points: 15, difficulty: "medium" },
      { name: "Do dishes", points: 15, difficulty: "medium" },
      { name: "Take out trash", points: 10, difficulty: "medium" },
      { name: "Help with laundry", points: 20, difficulty: "hard" }
    ]
  },
  teen: {
    label: "Ages 13+",
    icon: "👨",
    chores: [
      { name: "Clean room", points: 10, difficulty: "medium" },
      { name: "Do dishes", points: 15, difficulty: "medium" },
      { name: "Cook meal", points: 25, difficulty: "hard" },
      { name: "Mow lawn", points: 30, difficulty: "hard" },
      { name: "Grocery shopping", points: 20, difficulty: "medium" }
    ]
  },
  household: {
    label: "All Ages",
    icon: "🏠",
    chores: [
      { name: "Make bed", points: 5, difficulty: "easy" },
      { name: "Tidy room", points: 10, difficulty: "easy" },
      { name: "Clear dishes", points: 10, difficulty: "easy" },
      { name: "Take out trash", points: 10, difficulty: "medium" },
      { name: "Vacuum", points: 15, difficulty: "medium" },
      { name: "Do laundry", points: 20, difficulty: "hard" }
    ]
  }
};
```

#### Onboarding Step 3: Chore Setup

```jsx
export const ChoreSetupStep = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customizing, setCustomizing] = useState(false);

  return (
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-bold mb-2">Setup Chores</h2>
        <p class="text-gray-600">
          Choose a starting template, or skip to customize later
        </p>
      </div>

      {!customizing ? (
        <>
          {/* Template Selection */}
          <div class="grid grid-cols-2 gap-4">
            {Object.entries(choreTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setSelectedTemplate(key)}
                class={clsx(
                  'p-4 border-2 rounded-xl text-left transition-all',
                  selectedTemplate === key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div class="text-3xl mb-2">{template.icon}</div>
                <p class="font-semibold text-sm">{template.label}</p>
                <p class="text-xs text-gray-600 mt-1">
                  {template.chores.length} chores
                </p>
              </button>
            ))}
          </div>

          {/* Preview selected template */}
          {selectedTemplate && (
            <Card class="bg-gray-50">
              <h3 class="font-semibold mb-3">Preview:</h3>
              <ul class="space-y-2">
                {choreTemplates[selectedTemplate].chores.map((chore, i) => (
                  <li key={i} class="flex items-center justify-between text-sm">
                    <span>{chore.name}</span>
                    <span class="text-primary-600 font-medium">
                      {chore.points} pts
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Actions */}
          <div class="space-y-3">
            <Button
              variant="primary"
              onClick={() => {
                if (selectedTemplate) {
                  applyTemplate(selectedTemplate);
                  setChoresConfigured(true);
                }
              }}
              disabled={!selectedTemplate}
              class="w-full"
            >
              Use This Template
            </Button>

            <Button
              variant="secondary"
              onClick={() => setCustomizing(true)}
              class="w-full"
            >
              Create Custom Chores
            </Button>

            <Button
              variant="ghost"
              onClick={nextStep}
              class="w-full"
            >
              Skip for Now
            </Button>
          </div>
        </>
      ) : (
        /* Custom chore creation */
        <CustomChoreBuilder
          onSave={(chores) => {
            saveCustomChores(chores);
            setChoresConfigured(true);
            nextStep();
          }}
          onCancel={() => setCustomizing(false)}
        />
      )}
    </div>
  );
};
```

### 5.2 Category Selection Patterns

**Visual Category Grid**

```jsx
export const ChoreCategoryPicker = ({ onSelect, multiSelect = false }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const categories = [
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', color: 'blue' },
    { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: 'orange' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿', color: 'cyan' },
    { id: 'living', name: 'Living Room', icon: '🛋️', color: 'green' },
    { id: 'outdoor', name: 'Outdoor', icon: '🌳', color: 'emerald' },
    { id: 'pets', name: 'Pets', icon: '🐕', color: 'amber' },
    { id: 'laundry', name: 'Laundry', icon: '👕', color: 'purple' },
    { id: 'other', name: 'Other', icon: '✨', color: 'gray' }
  ];

  const toggleCategory = (id: string) => {
    if (multiSelect) {
      setSelected(prev =>
        prev.includes(id)
          ? prev.filter(x => x !== id)
          : [...prev, id]
      );
    } else {
      setSelected([id]);
      onSelect(id);
    }
  };

  return (
    <div>
      <h3 class="font-semibold mb-4">Select Categories</h3>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => toggleCategory(category.id)}
            class={clsx(
              'p-4 rounded-xl border-2 transition-all',
              'flex flex-col items-center gap-2',
              selected.includes(category.id)
                ? `border-${category.color}-500 bg-${category.color}-50`
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <span class="text-3xl">{category.icon}</span>
            <span class="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {multiSelect && selected.length > 0 && (
        <Button
          variant="primary"
          onClick={() => onSelect(selected)}
          class="w-full mt-4"
        >
          Continue with {selected.length} {selected.length === 1 ? 'category' : 'categories'}
        </Button>
      )}
    </div>
  );
};
```

### 5.3 Quick Start vs Customization

**Three-Tier Approach:**

1. **Express Setup** (30 seconds)
   - Select age group template
   - Auto-apply default chores
   - Assign to all children equally

2. **Guided Setup** (2 minutes)
   - Select categories
   - Choose from curated chore list
   - Assign to specific children
   - Adjust points/difficulty

3. **Custom Setup** (5+ minutes)
   - Create custom chores
   - Set schedules and recurrence
   - Configure rewards
   - Advanced options

**Implementation:**

```jsx
export const ChoreOnboardingFlow = () => {
  const [setupMode, setSetupMode] = useState<'express' | 'guided' | 'custom' | null>(null);

  // Setup mode selection
  if (!setupMode) {
    return (
      <div class="space-y-4">
        <h2>How would you like to setup chores?</h2>

        <SetupOption
          icon="⚡"
          title="Express Setup"
          description="Quick start with age-appropriate chores"
          time="30 seconds"
          recommended
          onClick={() => setSetupMode('express')}
        />

        <SetupOption
          icon="🎯"
          title="Guided Setup"
          description="Choose categories and customize"
          time="2 minutes"
          onClick={() => setSetupMode('guided')}
        />

        <SetupOption
          icon="✏️"
          title="Custom Setup"
          description="Create your own chores from scratch"
          time="5+ minutes"
          onClick={() => setSetupMode('custom')}
        />

        <Button variant="ghost" onClick={skipChores}>
          Skip, I'll do this later
        </Button>
      </div>
    );
  }

  // Render selected flow
  switch (setupMode) {
    case 'express':
      return <ExpressChoreSetup />;
    case 'guided':
      return <GuidedChoreSetup />;
    case 'custom':
      return <CustomChoreSetup />;
  }
};

// Express setup component
const ExpressChoreSetup = () => {
  const [ageGroup, setAgeGroup] = useState<string | null>(null);

  return (
    <div class="space-y-6">
      <div>
        <h2>Choose Age Group</h2>
        <p class="text-sm text-gray-600">
          We'll suggest age-appropriate chores
        </p>
      </div>

      <div class="space-y-3">
        {Object.entries(choreTemplates).map(([key, template]) => (
          <button
            key={key}
            onClick={() => setAgeGroup(key)}
            class={clsx(
              'w-full p-4 rounded-xl border-2 text-left flex items-center gap-4',
              ageGroup === key
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200'
            )}
          >
            <span class="text-4xl">{template.icon}</span>
            <div class="flex-1">
              <p class="font-semibold">{template.label}</p>
              <p class="text-sm text-gray-600">
                {template.chores.length} pre-selected chores
              </p>
            </div>
            {ageGroup === key && <CheckIcon class="text-primary-500" />}
          </button>
        ))}
      </div>

      <Button
        variant="primary"
        onClick={() => applyExpressSetup(ageGroup)}
        disabled={!ageGroup}
        class="w-full"
      >
        Apply & Continue
      </Button>
    </div>
  );
};
```

---

## 6. Implementation Recommendations

### 6.1 Immediate Wins (Quick Implementations)

**Priority 1: Skip/Exit Functionality**

```typescript
// Add to onboardingStore.ts
export const skipOnboarding = () => {
  saveTempState({
    currentStep: currentStep.value,
    tempChildren: tempChildren.value,
    choresConfigured: choresConfigured.value,
    skipped: true
  });

  completeOnboarding();

  // Show helpful message
  showToast({
    message: "You can finish setup anytime in Settings",
    duration: 4000
  });
};
```

**Priority 2: Completion Celebration**

```jsx
// Create CompletionScreen.tsx
export const CompletionScreen = ({ children, onFinish }) => {
  useEffect(() => {
    // Trigger celebration animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
  }, []);

  return (
    <div class="text-center animate-fade-in">
      <div class="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-scale-in">
        <svg class="w-12 h-12 text-white" /* checkmark */ />
      </div>

      <h1 class="text-3xl font-bold mb-3">
        You're All Set! 🎉
      </h1>

      <p class="text-lg text-gray-600 mb-8">
        {children.length} {children.length === 1 ? 'child' : 'children'} ready to go!
      </p>

      {/* Next steps preview */}
      <div class="space-y-3 mb-8">
        <NextStepCard icon="📋" title="Assign chores" />
        <NextStepCard icon="💰" title="Track allowances" />
        <NextStepCard icon="⭐" title="Award points" />
      </div>

      <Button variant="primary" size="lg" onClick={onFinish}>
        Start Using Kids Home Hub
      </Button>
    </div>
  );
};
```

**Priority 3: Progress Percentage**

```jsx
// Enhance ProgressIndicator.tsx
export const ProgressIndicator = ({ currentStep, totalSteps }) => {
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm text-gray-600">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{progress}% complete</span>
      </div>

      <div class="flex gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            class={clsx(
              'h-2 rounded-full transition-all duration-300',
              step === currentStep ? 'w-8 bg-primary-500' : 'w-2 bg-gray-300',
              step < currentStep && 'bg-primary-300'
            )}
          />
        ))}
      </div>
    </div>
  );
};
```

### 6.2 Medium-Term Enhancements

**Swipe Navigation**

```typescript
// Implement useSwipe hook (already provided in 2.2)
// Add to OnboardingContainer component
```

**Chore Templates**

```typescript
// Create choreTemplates.ts
export const choreTemplates = {
  // ... (already defined in 5.1)
};

// Add ChoreSetupStep component (already provided in 5.1)
```

**Install Prompt**

```typescript
// Implement install prompt handling (already provided in 3.1)
// Add InstallPrompt component
// Trigger after onboarding completion
```

### 6.3 Long-Term Improvements

**Analytics & Optimization**

```typescript
// Track onboarding metrics
interface OnboardingMetrics {
  startTime: number;
  completionTime?: number;
  stepsCompleted: number;
  stepsSkipped: string[];
  childrenAdded: number;
  choresConfigured: boolean;
  completionRate: number;
  dropoffPoint?: OnboardingStep;
}

export const trackOnboardingMetrics = () => {
  const metrics: OnboardingMetrics = {
    startTime: Date.now(),
    stepsCompleted: 0,
    stepsSkipped: [],
    childrenAdded: tempChildren.value.length,
    choresConfigured: choresConfigured.value,
    completionRate: 0
  };

  // Save to analytics
  analytics.track('onboarding_completed', metrics);
};
```

**A/B Testing**

```typescript
// Test different onboarding variants
const onboardingVariants = {
  A: {
    steps: 4,
    showTemplates: true,
    allowSkip: true
  },
  B: {
    steps: 3,
    showTemplates: false,
    allowSkip: false
  }
};

export const getOnboardingVariant = () => {
  // Assign user to variant
  const userId = getCurrentUserId();
  return assignVariant(userId, onboardingVariants);
};
```

**Personalization**

```typescript
// Personalize based on household data
export const personalizeOnboarding = (data: {
  childrenCount: number;
  childrenAges: number[];
  previousExperience: boolean;
}) => {
  if (data.previousExperience) {
    // Skip welcome, show quick import
    return 'express';
  }

  if (data.childrenCount > 3) {
    // Suggest bulk import
    return 'bulk';
  }

  return 'standard';
};
```

### 6.4 File Structure

```
src/
├── components/
│   ├── features/
│   │   ├── onboarding/
│   │   │   ├── OnboardingContainer.tsx
│   │   │   ├── WelcomeScreen.tsx ✅
│   │   │   ├── ProgressIndicator.tsx ✅
│   │   │   ├── ChildrenSetupStep.tsx
│   │   │   ├── ChoreSetupStep.tsx
│   │   │   ├── CompletionScreen.tsx
│   │   │   ├── ChildProfileForm.tsx
│   │   │   ├── EmojiPicker.tsx
│   │   │   ├── ChoreTemplates.tsx
│   │   │   └── InstallPrompt.tsx
│   ├── common/
│   │   ├── Button.tsx ✅
│   │   ├── Card.tsx ✅
│   │   ├── Modal.tsx ✅
│   │   └── Toast.tsx
├── stores/
│   ├── onboardingStore.ts ✅
│   └── installPromptStore.ts
├── hooks/
│   ├── useSwipe.ts
│   └── useOnboarding.ts
├── utils/
│   ├── installPrompt.ts
│   ├── choreTemplates.ts
│   ├── confetti.ts
│   └── analytics.ts
└── constants/
    └── onboardingConfig.ts
```

---

## 7. Success Metrics & Testing

### 7.1 Key Performance Indicators

**Onboarding Funnel Metrics:**

```typescript
interface OnboardingKPIs {
  // Completion metrics
  completionRate: number;        // % who complete all steps
  timeToComplete: number;        // Average time in seconds
  timeToFirstValue: number;      // Time to add first child

  // Drop-off metrics
  dropOffByStep: {
    step1: number;  // % who leave at welcome
    step2: number;  // % who leave at children setup
    step3: number;  // % who leave at chores
    step4: number;  // % who leave at completion
  };

  // Engagement metrics
  childrenAdded: number;         // Average children per household
  choresConfigured: number;      // % who setup chores
  skippedSteps: string[];        // Which steps are skipped most

  // Quality metrics
  profileCompleteness: number;   // % of profile fields filled
  returnToOnboarding: number;    // % who resume later
  installRate: number;           // % who install PWA
}

// Target KPIs for Kids Home Hub
const targetKPIs: OnboardingKPIs = {
  completionRate: 0.75,          // 75% completion
  timeToComplete: 120,           // 2 minutes
  timeToFirstValue: 60,          // 1 minute
  dropOffByStep: {
    step1: 0.10,  // 10% welcome screen
    step2: 0.10,  // 10% children setup
    step3: 0.03,  // 3% chores (optional)
    step4: 0.02   // 2% completion
  },
  childrenAdded: 2,              // 2 children average
  choresConfigured: 0.60,        // 60% configure chores
  skippedSteps: [],
  profileCompleteness: 0.80,     // 80% profile data
  returnToOnboarding: 0.15,      // 15% resume later
  installRate: 0.40              // 40% install PWA
};
```

### 7.2 Testing Checklist

**Functional Testing:**

- [ ] Welcome screen displays correctly
- [ ] Can add minimum 1 child
- [ ] Can add maximum 6 children
- [ ] Emoji picker works on all devices
- [ ] Form validation works correctly
- [ ] Can skip optional steps
- [ ] Can navigate back to previous steps
- [ ] Progress indicator updates correctly
- [ ] Completion screen shows celebration
- [ ] Data persists in localStorage
- [ ] Can exit and resume onboarding
- [ ] Install prompt shows at correct time

**Mobile-Specific Testing:**

- [ ] Touch targets are 44x44px minimum
- [ ] Swipe gestures work (if implemented)
- [ ] Keyboard appears with correct input mode
- [ ] Keyboard doesn't obscure input fields
- [ ] Forms work on iOS Safari
- [ ] Forms work on Chrome Android
- [ ] Safe areas respected (iOS notch)
- [ ] Landscape orientation works
- [ ] Works on small screens (320px width)

**Offline Testing:**

- [ ] Onboarding works completely offline
- [ ] Data saves to IndexedDB offline
- [ ] Offline indicator shows when disconnected
- [ ] Data syncs when connection restored
- [ ] No error messages for offline operations

**PWA-Specific Testing:**

- [ ] Works when installed as PWA
- [ ] Splash screen shows on launch
- [ ] Manifest.json configured correctly
- [ ] Icons display correctly (all sizes)
- [ ] Service worker caches all assets
- [ ] beforeinstallprompt event captured

**Accessibility Testing:**

- [ ] Keyboard navigation works
- [ ] Screen reader announces steps
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Text can be resized to 200%
- [ ] Works with reduced motion preference

**Performance Testing:**

- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts during load
- [ ] Animations run at 60fps
- [ ] Bundle size < 100KB (onboarding only)

### 7.3 User Testing Script

**Test Scenario:** First-time user onboarding

**Tasks:**
1. Launch the app and proceed through welcome screen
2. Add 2 children with names and avatars
3. Select a chore template or skip
4. Complete onboarding
5. (Optional) Try exiting and resuming

**Questions:**
1. How long did it take? (Goal: < 2 minutes)
2. Was anything confusing?
3. Did you feel stuck at any point?
4. Was there too much or too little information?
5. Would you install this as an app?

**Success Criteria:**
- 80%+ complete onboarding without help
- 70%+ complete within 2 minutes
- 80%+ understand what the app does after welcome
- 90%+ can add a child successfully
- 60%+ configure at least one chore
- 70%+ express willingness to install

---

## Appendix A: Quick Reference

### Component Checklist

```typescript
// Onboarding components needed
const components = {
  existing: [
    'WelcomeScreen',
    'ProgressIndicator',
    'Button',
    'Card',
    'Modal'
  ],
  needed: [
    'OnboardingContainer',
    'ChildrenSetupStep',
    'ChildProfileForm',
    'EmojiPicker',
    'ChoreSetupStep',
    'ChoreTemplates',
    'CompletionScreen',
    'InstallPrompt',
    'Toast/Notification'
  ]
};
```

### Store Actions

```typescript
// onboardingStore.ts actions
export {
  // Navigation
  nextStep,
  previousStep,
  goToStep,
  skipOnboarding,

  // Children management
  addTempChild,
  removeTempChild,
  updateTempChild,

  // Chores
  setChoresConfigured,

  // Completion
  completeOnboarding,
  resetOnboarding
};
```

### Best Practices Summary

**DO:**
- ✅ Keep onboarding under 2 minutes
- ✅ Show progress clearly
- ✅ Allow skipping optional steps
- ✅ Save progress automatically
- ✅ Celebrate completion
- ✅ Work offline completely
- ✅ Use touch-friendly controls (48px minimum)
- ✅ Show value proposition upfront
- ✅ Provide templates for quick start
- ✅ Enable customization later

**DON'T:**
- ❌ Force signup before showing value
- ❌ Make all steps required
- ❌ Use complex gestures without alternatives
- ❌ Block with long animations
- ❌ Show install prompt immediately
- ❌ Require internet connection
- ❌ Use small touch targets (< 44px)
- ❌ Overwhelm with options upfront
- ❌ Skip celebration/success states
- ❌ Prevent exiting onboarding

---

## Appendix B: Resources

### Design Tools
- **Figma Community:** Search "mobile onboarding" for templates
- **Mobbin:** Mobile app design patterns library
- **Dribbble:** Onboarding UI inspiration

### Libraries & Dependencies
```json
{
  "confetti": "canvas-confetti",
  "gestures": "hammer.js or custom hook",
  "animations": "CSS animations (built-in)",
  "storage": "dexie (already installed)",
  "analytics": "plausible or custom"
}
```

### Testing Tools
- **Lighthouse:** PWA audit
- **Chrome DevTools:** Network throttling, device emulation
- **BrowserStack:** Cross-device testing
- **Playwright:** Already installed for E2E testing

### Further Reading
- [PWA Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Best_practices)
- [Mobile Onboarding - Nielsen Norman Group](https://www.nngroup.com/articles/mobile-onboarding/)
- [Progressive Disclosure - Interaction Design Foundation](https://www.interaction-design.org/literature/topics/progressive-disclosure)

---

**End of Document**

*This document is a living guide and should be updated as new patterns emerge and user feedback is collected.*
