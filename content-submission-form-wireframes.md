# Content Submission Form - Wireframes & Visual Specifications
## MLG.clan Xbox 360 Dashboard Style

### Overview
This document provides comprehensive wireframes and specifications for the content submission form (Sub-task 4.1) with retro Xbox 360 dashboard aesthetic, maintaining consistency with the existing MLG.clan voting system components.

---

## 1. WIREFRAME STRUCTURE

### 1.1 Page Layout
```
┌─ HEADER NAV (existing) ─┐
├─ Content Submission     │
│  ┌─────────────────────┐│
│  │   Content Type      ││
│  │   Selector Blade    ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │   File Upload       ││
│  │   Drop Zone         ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │   Metadata Form     ││
│  │   Fields            ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │   Preview Area      ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │   Submit Actions    ││
│  └─────────────────────┘│
└───────────────────────────┘
```

### 1.2 Content Flow
1. **Content Type Selection** → Blade navigation style
2. **File Upload** → Drag-and-drop with Xbox glow effects
3. **Metadata Input** → Tile-based form sections
4. **Preview** → Live content preview
5. **Submission** → Confirmation with Xbox transitions

---

## 2. COMPONENT SPECIFICATIONS

### 2.1 Content Type Selector (Xbox Blade Style)
**Visual Design:**
- Horizontal blade navigation inspired by Xbox 360 dashboard
- Glowing tile selection with green (#10b981) accent
- Smooth transitions between content types

**Structure:**
```html
<div class="content-type-selector">
  <div class="blade-container">
    <div class="blade-item active" data-type="clips">
      <div class="blade-icon">🎮</div>
      <div class="blade-label">Gaming Clips</div>
    </div>
    <div class="blade-item" data-type="screenshots">
      <div class="blade-icon">📸</div>
      <div class="blade-label">Screenshots</div>
    </div>
    <div class="blade-item" data-type="guides">
      <div class="blade-icon">📖</div>
      <div class="blade-label">Strategy Guides</div>
    </div>
    <div class="blade-item" data-type="reviews">
      <div class="blade-icon">⭐</div>
      <div class="blade-label">Game Reviews</div>
    </div>
  </div>
</div>
```

**CSS Specifications:**
- Blade width: 200px each
- Active blade: Scale(1.05), box-shadow with green glow
- Transition: all 0.3s ease-out
- Border-radius: 8px for Xbox aesthetic

### 2.2 File Upload Zone
**Visual Design:**
- Large drop zone with Xbox-style dashed border
- Animated hover states with green glow effect
- File type indicators based on content type selection

**Structure:**
```html
<div class="upload-zone tile">
  <div class="upload-dropzone" id="file-dropzone">
    <div class="upload-icon">📁</div>
    <div class="upload-text">
      <h3>Drop files here or click to browse</h3>
      <p>Supported formats: MP4, MOV, JPG, PNG, GIF</p>
      <p class="file-size-limit">Max size: 100MB</p>
    </div>
    <input type="file" id="file-input" multiple accept="video/*,image/*" hidden>
  </div>
  <div class="upload-progress" id="upload-progress" hidden>
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
    <div class="progress-text">Uploading... 45%</div>
  </div>
</div>
```

### 2.3 Metadata Form Sections
**Tile-based Layout:**
Each form section follows the existing tile pattern with Xbox green accents.

#### 2.3.1 Primary Information Tile
```html
<div class="form-section tile">
  <h3 class="section-title xbox-green">📝 Content Details</h3>
  
  <div class="form-field">
    <label class="field-label">Title *</label>
    <input type="text" class="xbox-input" placeholder="Amazing clutch play..." maxlength="100" required>
    <div class="char-counter">0/100</div>
  </div>
  
  <div class="form-field">
    <label class="field-label">Description</label>
    <textarea class="xbox-textarea" placeholder="Describe your epic moment..." maxlength="500" rows="4"></textarea>
    <div class="char-counter">0/500</div>
  </div>
</div>
```

#### 2.3.2 Game Selection Tile
```html
<div class="form-section tile">
  <h3 class="section-title xbox-green">🎮 Game Information</h3>
  
  <div class="form-field">
    <label class="field-label">Game *</label>
    <div class="game-search-container">
      <input type="text" class="xbox-input" id="game-search" placeholder="Search for a game..." autocomplete="off" required>
      <div class="game-dropdown" id="game-dropdown">
        <!-- Auto-populated game results -->
      </div>
    </div>
  </div>
  
  <div class="form-field">
    <label class="field-label">Platform</label>
    <div class="platform-selector">
      <div class="platform-option" data-platform="xbox">
        <div class="platform-icon">🎮</div>
        <span>Xbox</span>
      </div>
      <div class="platform-option" data-platform="playstation">
        <div class="platform-icon">🎮</div>
        <span>PlayStation</span>
      </div>
      <div class="platform-option" data-platform="pc">
        <div class="platform-icon">💻</div>
        <span>PC</span>
      </div>
      <div class="platform-option" data-platform="mobile">
        <div class="platform-icon">📱</div>
        <span>Mobile</span>
      </div>
    </div>
  </div>
</div>
```

#### 2.3.3 Category & Tags Tile
```html
<div class="form-section tile">
  <h3 class="section-title xbox-green">🏷️ Categories & Tags</h3>
  
  <div class="form-field">
    <label class="field-label">Content Category</label>
    <select class="xbox-select" id="content-category">
      <option value="">Select category...</option>
      <option value="highlights">Highlights</option>
      <option value="gameplay">Full Gameplay</option>
      <option value="tutorials">Tutorials</option>
      <option value="funny">Funny Moments</option>
      <option value="competitive">Competitive</option>
      <option value="speedrun">Speedrun</option>
    </select>
  </div>
  
  <div class="form-field">
    <label class="field-label">Tags</label>
    <div class="tag-input-container">
      <input type="text" class="xbox-input" id="tag-input" placeholder="Add tags (e.g. clutch, headshot)">
      <div class="tag-list" id="selected-tags">
        <!-- Dynamic tags appear here -->
      </div>
    </div>
    <div class="tag-suggestions">
      <span class="suggestion-tag">clutch</span>
      <span class="suggestion-tag">headshot</span>
      <span class="suggestion-tag">epic</span>
      <span class="suggestion-tag">funny</span>
    </div>
  </div>
</div>
```

#### 2.3.4 Privacy & Settings Tile
```html
<div class="form-section tile">
  <h3 class="section-title xbox-green">🔒 Privacy & Settings</h3>
  
  <div class="form-field">
    <label class="field-label">Visibility</label>
    <div class="radio-group">
      <label class="radio-option">
        <input type="radio" name="visibility" value="public" checked>
        <span class="radio-custom"></span>
        <div class="radio-label">
          <strong>Public</strong>
          <small>Everyone can see and vote</small>
        </div>
      </label>
      <label class="radio-option">
        <input type="radio" name="visibility" value="clan-only">
        <span class="radio-custom"></span>
        <div class="radio-label">
          <strong>Clan Only</strong>
          <small>Only clan members can see</small>
        </div>
      </label>
      <label class="radio-option">
        <input type="radio" name="visibility" value="friends">
        <span class="radio-custom"></span>
        <div class="radio-label">
          <strong>Friends</strong>
          <small>Only friends can see</small>
        </div>
      </label>
    </div>
  </div>
  
  <div class="form-field">
    <label class="checkbox-option">
      <input type="checkbox" id="allow-comments">
      <span class="checkbox-custom"></span>
      Allow comments
    </label>
  </div>
  
  <div class="form-field">
    <label class="checkbox-option">
      <input type="checkbox" id="allow-downloads">
      <span class="checkbox-custom"></span>
      Allow downloads
    </label>
  </div>
</div>
```

### 2.4 Preview Area
```html
<div class="preview-section tile">
  <h3 class="section-title xbox-green">👁️ Preview</h3>
  
  <div class="preview-container" id="content-preview">
    <!-- Dynamic preview based on content type -->
    <div class="preview-placeholder">
      <div class="preview-icon">👁️</div>
      <p>Upload content to see preview</p>
    </div>
  </div>
  
  <div class="preview-meta" id="preview-metadata">
    <!-- Shows formatted metadata preview -->
  </div>
</div>
```

### 2.5 Submission Actions
```html
<div class="submission-section">
  <div class="submission-actions">
    <button type="button" class="btn-secondary" onclick="saveDraft()">
      💾 Save Draft
    </button>
    <button type="button" class="btn-secondary" onclick="previewPost()">
      👁️ Preview Post
    </button>
    <button type="submit" class="btn-primary xbox-submit" id="submit-btn">
      🚀 Submit Content
    </button>
  </div>
  
  <div class="submission-info">
    <p class="upload-limits">
      <span id="upload-count">2/3</span> uploads remaining today
    </p>
  </div>
</div>
```

---

## 3. VISUAL SPECIFICATIONS

### 3.1 Color Palette (Xbox 360 Theme)
```css
:root {
  /* Primary Xbox Green */
  --xbox-green: #10b981;
  --xbox-green-dark: #065f46;
  --xbox-green-light: #34d399;
  
  /* Background Gradients */
  --tile-gradient: linear-gradient(135deg, #065f46, #064e3b);
  --hover-gradient: linear-gradient(135deg, #047857, #065f46);
  
  /* Form Elements */
  --input-bg: #374151;
  --input-border: #10b981;
  --input-focus: #34d399;
  
  /* Text Colors */
  --text-primary: #ffffff;
  --text-secondary: #d1d5db;
  --text-muted: #9ca3af;
}
```

### 3.2 Typography Scale
```css
.section-title {
  font-size: 1.25rem; /* 20px */
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--xbox-green);
}

.field-label {
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  display: block;
}

.char-counter {
  font-size: 0.75rem; /* 12px */
  color: var(--text-muted);
  text-align: right;
  margin-top: 0.25rem;
}
```

### 3.3 Spacing System (8px Grid)
```css
.form-section {
  padding: 24px; /* 3 * 8px */
  margin-bottom: 16px; /* 2 * 8px */
}

.form-field {
  margin-bottom: 20px; /* 2.5 * 8px */
}

.blade-item {
  padding: 16px; /* 2 * 8px */
  margin-right: 8px; /* 1 * 8px */
}

.platform-option {
  padding: 12px 16px; /* 1.5 * 8px, 2 * 8px */
  margin-right: 8px; /* 1 * 8px */
}
```

### 3.4 Form Element Styles
```css
.xbox-input,
.xbox-textarea,
.xbox-select {
  width: 100%;
  background: var(--input-bg);
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 12px 16px;
  color: var(--text-primary);
  font-size: 1rem;
  transition: all 0.3s ease;
}

.xbox-input:focus,
.xbox-textarea:focus,
.xbox-select:focus {
  outline: none;
  border-color: var(--input-border);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  transform: translateY(-1px);
}

.xbox-input:invalid {
  border-color: #ef4444;
}

.xbox-input:invalid:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}
```

### 3.5 Button Specifications
```css
.btn-primary {
  background: linear-gradient(45deg, #10b981, #047857);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: none;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.btn-secondary {
  background: var(--input-bg);
  color: var(--text-secondary);
  border: 2px solid #4b5563;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  border-color: var(--xbox-green);
  color: var(--xbox-green);
  transform: translateY(-1px);
}
```

---

## 4. RESPONSIVE DESIGN SPECIFICATIONS

### 4.1 Mobile-First Breakpoints
```css
/* Mobile (Default) */
.content-type-selector .blade-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .content-type-selector .blade-container {
    flex-direction: row;
    justify-content: center;
  }
  
  .form-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .submission-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
  }
  
  .form-sections {
    grid-template-columns: 2fr 1fr;
  }
}
```

### 4.2 Touch-Friendly Specifications
```css
/* Minimum 44px touch targets */
.blade-item,
.platform-option,
.btn-primary,
.btn-secondary {
  min-height: 44px;
  min-width: 44px;
}

/* Larger touch areas for mobile */
@media (max-width: 767px) {
  .xbox-input,
  .xbox-textarea,
  .xbox-select {
    padding: 16px;
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
```

---

## 5. ACCESSIBILITY SPECIFICATIONS

### 5.1 ARIA Labels and Roles
```html
<!-- Content type selector -->
<div class="content-type-selector" role="tablist" aria-label="Content type selection">
  <div class="blade-item active" role="tab" aria-selected="true" aria-controls="clips-form">
    Gaming Clips
  </div>
</div>

<!-- Form sections -->
<div class="form-section tile" role="group" aria-labelledby="content-details-heading">
  <h3 id="content-details-heading" class="section-title">Content Details</h3>
</div>

<!-- File upload -->
<div class="upload-dropzone" 
     role="button" 
     tabindex="0"
     aria-label="Upload file area. Press enter or space to browse files"
     aria-describedby="upload-instructions">
</div>
```

### 5.2 Keyboard Navigation
```css
.blade-item:focus,
.platform-option:focus,
.xbox-input:focus,
.btn-primary:focus {
  outline: 3px solid var(--xbox-green);
  outline-offset: 2px;
}

/* Skip to main content for screen readers */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--xbox-green);
  color: white;
  padding: 8px;
  text-decoration: none;
  transition: top 0.3s;
}

.skip-link:focus {
  top: 6px;
}
```

### 5.3 Color Contrast Requirements
All text elements meet WCAG AA standards:
- Normal text: 4.5:1 contrast ratio
- Large text (18px+): 3:1 contrast ratio
- Interactive elements: Clearly distinguishable states

---

## 6. ANIMATION AND MICRO-INTERACTIONS

### 6.1 Blade Transition Effects
```css
@keyframes bladeGlow {
  0% { box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
  50% { box-shadow: 0 0 20px rgba(16, 185, 129, 0.6); }
  100% { box-shadow: 0 0 0 rgba(16, 185, 129, 0); }
}

.blade-item.active {
  animation: bladeGlow 2s ease-in-out infinite;
}

.blade-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 6.2 Upload Zone Animations
```css
.upload-dropzone.dragover {
  transform: scale(1.02);
  border-color: var(--xbox-green-light);
  background: rgba(16, 185, 129, 0.1);
}

.upload-dropzone.uploading .upload-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 6.3 Form Validation Feedback
```css
.form-field.error .xbox-input {
  animation: shake 0.5s ease-in-out;
  border-color: #ef4444;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.form-field.success .xbox-input {
  border-color: var(--xbox-green);
}

.form-field.success::after {
  content: '✓';
  color: var(--xbox-green);
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
}
```

---

## 7. INTEGRATION WITH VOTING SYSTEM

### 7.1 Consistent Component Usage
The form maintains visual consistency with existing voting system components:

- **Tile Structure**: Same gradient backgrounds and border styling
- **Button Styles**: Consistent with MLG vote buttons and clan actions
- **Color Scheme**: Xbox green (#10b981) primary with matching gradients
- **Typography**: Matches existing heading and body text styles

### 7.2 State Management Integration
```javascript
// Form submission should integrate with existing voting limits
function checkSubmissionLimits() {
  const limits = dailyLimits[currentWallet] || { uploads: 0, freeVotes: 0, totalVotes: 0 };
  
  if (limits.uploads >= 3) {
    showError('Daily upload limit reached (3/3)');
    return false;
  }
  
  return true;
}
```

---

## 8. PERFORMANCE CONSIDERATIONS

### 8.1 Image Optimization
- Lazy loading for preview images
- WebP format with fallbacks
- Responsive image sizing
- Progressive JPEG for large uploads

### 8.2 Form Optimization
- Debounced search for games
- Progressive enhancement for drag-and-drop
- Chunked file uploads for large files
- Client-side validation before server submission

---

## 9. ERROR STATES AND VALIDATION

### 9.1 Validation Rules
```javascript
const validationRules = {
  title: {
    required: true,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_!?.]+$/
  },
  game: {
    required: true,
    mustExistInDatabase: true
  },
  file: {
    required: true,
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: ['video/mp4', 'video/mov', 'image/jpeg', 'image/png', 'image/gif']
  }
};
```

### 9.2 Error Message Display
```html
<div class="error-message" role="alert">
  <div class="error-icon">⚠️</div>
  <div class="error-text">Please enter a valid title (no special characters)</div>
</div>
```

---

## 10. IMPLEMENTATION HANDOFF NOTES

### 10.1 Required Assets
- Xbox controller icons (SVG format)
- Platform logos (Xbox, PlayStation, PC, Mobile)
- Game cover image placeholders
- Loading spinner animations

### 10.2 JavaScript Dependencies
- File upload library (e.g., Dropzone.js or custom implementation)
- Game search API integration
- Form validation library
- Progress tracking for uploads

### 10.3 Backend Integration Points
- File upload endpoint with progress tracking
- Game database search API
- Content metadata storage
- User limit validation
- Draft saving functionality

---

This specification provides comprehensive guidelines for implementing the content submission form while maintaining the authentic Xbox 360 dashboard aesthetic and ensuring modern web accessibility standards.