# PWA Icons and Assets

Complete guide to the Kids Home Hub PWA icons and assets.

## Overview

This PWA includes a comprehensive set of icons and assets optimized for all platforms:

- **27 total assets** (424KB total size)
- PWA standard icons (8 sizes)
- Maskable icons for Android adaptive icons (2 sizes)
- iOS-specific icons (5 sizes)
- iOS splash screens (9 device sizes)
- Favicons (3 sizes)

## Generated Assets

### PWA Standard Icons

| Size    | File                   | Purpose                        |
|---------|------------------------|--------------------------------|
| 72x72   | icon-72x72.png         | Chrome, Android (ldpi)         |
| 96x96   | icon-96x96.png         | Chrome, Android (mdpi)         |
| 128x128 | icon-128x128.png       | Chrome, Android (hdpi)         |
| 144x144 | icon-144x144.png       | Chrome, Android (xhdpi)        |
| 152x152 | icon-152x152.png       | Chrome, Android (xxhdpi)       |
| 192x192 | icon-192x192.png       | Chrome, Android (xxxhdpi)      |
| 384x384 | icon-384x384.png       | Chrome, Android (4x)           |
| 512x512 | icon-512x512.png       | Chrome, Android (PWA standard) |

### Maskable Icons

| Size    | File                         | Purpose                    |
|---------|------------------------------|----------------------------|
| 192x192 | icon-192x192-maskable.png    | Android adaptive icon      |
| 512x512 | icon-512x512-maskable.png    | Android adaptive icon (hi) |

**Note**: Maskable icons include 10% padding to ensure the icon is displayed correctly within Android's safe zone.

### iOS Touch Icons

| Size    | File                         | Device                        |
|---------|------------------------------|-------------------------------|
| 120x120 | apple-touch-icon-120x120.png | iPhone (2x)                   |
| 152x152 | apple-touch-icon-152x152.png | iPad (2x)                     |
| 167x167 | apple-touch-icon-167x167.png | iPad Pro                      |
| 180x180 | apple-touch-icon-180x180.png | iPhone (3x)                   |
| 180x180 | apple-touch-icon.png         | Default iOS icon              |

### iOS Splash Screens

| Size       | File                        | Device                     |
|------------|-----------------------------| ---------------------------|
| 1125x2436  | apple-splash-1125x2436.png  | iPhone X/XS/11 Pro         |
| 1242x2688  | apple-splash-1242x2688.png  | iPhone XS Max/11 Pro Max   |
| 828x1792   | apple-splash-828x1792.png   | iPhone XR/11               |
| 1170x2532  | apple-splash-1170x2532.png  | iPhone 12/13/14 Pro        |
| 1284x2778  | apple-splash-1284x2778.png  | iPhone 12/13/14 Pro Max    |
| 1179x2556  | apple-splash-1179x2556.png  | iPhone 15 Pro              |
| 1290x2796  | apple-splash-1290x2796.png  | iPhone 15 Pro Max          |
| 2048x2732  | apple-splash-2048x2732.png  | iPad Pro 12.9"             |
| 1668x2388  | apple-splash-1668x2388.png  | iPad Pro 11"               |

### Favicons

| Size  | File               | Purpose                  |
|-------|--------------------|--------------------------|
| 16x16 | favicon-16x16.png  | Browser tab (standard)   |
| 32x32 | favicon-32x32.png  | Browser tab (retina)     |
| 48x48 | favicon-48x48.png  | Windows taskbar          |

## Icon Generation

### Prerequisites

```bash
# Sharp is already installed as a dev dependency
pnpm install
```

### Generate All Icons

```bash
# From apps/pwa directory
pnpm generate:icons

# Or directly
node scripts/generate-icons.mjs
```

### Customize Source Icon

The source icon is located at `public/icon-source.svg`. To customize:

1. Edit the SVG file (512x512 recommended size)
2. Run the icon generator to regenerate all assets
3. Verify the output in `public/icons/`

**Design Guidelines:**
- Use a simple, recognizable design
- Ensure 10% safe zone for maskable icons
- Use high contrast colors
- Test on both light and dark backgrounds
- Avoid fine details that won't render at small sizes

## Icon Design

### Current Design

The Kids Home Hub icon features:
- **House symbol** - Represents "home"
- **Star badge** - Represents rewards/achievements
- **Blue gradient background** - Brand color (#01579b → #0277bd)
- **Clean, minimal style** - Optimized for small sizes

### Brand Colors

```
Primary:   #01579b (Material Blue 900)
Secondary: #0277bd (Material Blue 700)
Accent:    #ffd700 (Gold - for rewards)
```

## Integration

### manifest.json

The `manifest.json` file automatically references all PWA icons:

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512-maskable.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### index.html

All icon references are included in `index.html`:

```html
<!-- Favicons -->
<link rel="icon" sizes="32x32" href="/icons/favicon-32x32.png" />

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

<!-- iOS Splash Screens -->
<link rel="apple-touch-startup-image"
      media="(device-width: 390px)"
      href="/icons/apple-splash-1170x2532.png" />
```

## Testing

### Verify Icons

```bash
# List all generated icons
ls -lh public/icons/

# Check total size
du -sh public/icons/

# Verify specific icon
file public/icons/icon-192x192.png
```

### Browser Testing

1. **Chrome DevTools**
   - Open DevTools → Application → Manifest
   - Verify all icons load correctly
   - Check for console errors

2. **Lighthouse PWA Audit**
   ```bash
   pnpm build
   pnpm preview
   # Run Lighthouse audit
   ```
   - Should show all icons present
   - No warnings about missing sizes

3. **iOS Safari**
   - Test on real iOS device
   - Add to Home Screen
   - Verify icon and splash screen display

4. **Android Chrome**
   - Test on real Android device
   - Add to Home Screen
   - Verify maskable icon adapts correctly

## Performance

### Icon Optimization

All icons are:
- **PNG format** - Maximum compatibility
- **Compression level 9** - Best compression
- **Quality 100** - Lossless quality
- **sRGB color space** - Web-standard colors

### Total Size: 424KB

This is acceptable for PWA icons because:
- Icons are cached by service worker
- Only required sizes are loaded by device
- Loaded once, cached indefinitely
- Critical for PWA installation

### Future Optimizations

If size becomes an issue:

1. **Convert to WebP** (50% smaller)
   ```bash
   cwebp -q 90 icon-512x512.png -o icon-512x512.webp
   ```

2. **Use SVG for non-splash screens**
   - Smaller file size
   - Scalable to any resolution
   - Not supported by all platforms

3. **Lazy load splash screens**
   - Only load for iOS devices
   - Detect platform before loading

## Troubleshooting

### Icons Not Displaying

**Problem**: Icons don't appear in browser manifest

**Solutions**:
1. Verify files exist: `ls public/icons/`
2. Check manifest.json syntax
3. Clear browser cache
4. Rebuild and redeploy

### Wrong Icon on Home Screen

**Problem**: Incorrect icon when added to home screen

**Solutions**:
1. Clear home screen icon cache (iOS)
2. Verify apple-touch-icon is 180x180
3. Check for conflicting icon declarations
4. Test on real device (simulators cache)

### Splash Screen Not Showing

**Problem**: iOS splash screen doesn't display

**Solutions**:
1. Verify media queries match device exactly
2. Check file exists and is accessible
3. Use correct pixel ratio (-webkit-device-pixel-ratio)
4. Test on actual iOS device (not simulator)

### Icon Generation Fails

**Problem**: Script fails to generate icons

**Solutions**:
1. Verify Sharp is installed: `pnpm list sharp`
2. Check source SVG is valid
3. Ensure write permissions to public/icons/
4. Review error logs

## FAQ

**Q: Why so many icon sizes?**
A: Different platforms and devices require different icon sizes. Having all sizes ensures the best user experience across all devices.

**Q: What is a maskable icon?**
A: Maskable icons have extra padding to ensure the icon displays correctly when Android applies a mask (circle, squircle, etc.) for adaptive icons.

**Q: Can I use a PNG as source instead of SVG?**
A: Yes, but SVG is recommended because it scales to any size without quality loss. If using PNG, use at least 512x512.

**Q: Do I need to regenerate icons after every change?**
A: Only if you modify the source icon design. Otherwise, the generated icons remain valid.

**Q: How do I create a favicon.ico?**
A: Use ImageMagick: `convert icons/favicon-32x32.png public/favicon.ico`

## Resources

- [PWA Icon Requirements](https://web.dev/add-manifest/)
- [Maskable Icon Guide](https://web.dev/maskable-icon/)
- [iOS Icon Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

## Scripts Location

- **Generator**: `scripts/generate-icons.mjs`
- **Source Icon**: `public/icon-source.svg`
- **Output Directory**: `public/icons/`
- **Manifest**: `public/manifest.json`
- **HTML References**: `index.html`
