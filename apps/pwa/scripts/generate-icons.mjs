#!/usr/bin/env node

/**
 * Icon Generation Script
 *
 * Generates all required PWA icons from a source SVG file:
 * - PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
 * - Maskable icons for Android adaptive icons
 * - iOS-specific icons (120, 152, 167, 180)
 * - Favicons (16, 32, 48)
 * - Apple touch icons
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../public');
const iconsDir = join(publicDir, 'icons');
const sourceIcon = join(publicDir, 'icon-source.svg');

// Ensure directories exist
if (!existsSync(iconsDir)) {
  mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes configuration
const iconSizes = [
  // PWA standard sizes
  { size: 72, name: 'icon-72x72.png', purpose: 'any' },
  { size: 96, name: 'icon-96x96.png', purpose: 'any' },
  { size: 128, name: 'icon-128x128.png', purpose: 'any' },
  { size: 144, name: 'icon-144x144.png', purpose: 'any' },
  { size: 152, name: 'icon-152x152.png', purpose: 'any' },
  { size: 192, name: 'icon-192x192.png', purpose: 'any' },
  { size: 384, name: 'icon-384x384.png', purpose: 'any' },
  { size: 512, name: 'icon-512x512.png', purpose: 'any' },

  // Maskable icons (with safe zone padding for Android adaptive icons)
  { size: 192, name: 'icon-192x192-maskable.png', purpose: 'maskable', padding: 0.1 },
  { size: 512, name: 'icon-512x512-maskable.png', purpose: 'maskable', padding: 0.1 },

  // iOS-specific sizes
  { size: 120, name: 'apple-touch-icon-120x120.png', purpose: 'apple' },
  { size: 152, name: 'apple-touch-icon-152x152.png', purpose: 'apple' },
  { size: 167, name: 'apple-touch-icon-167x167.png', purpose: 'apple' },
  { size: 180, name: 'apple-touch-icon-180x180.png', purpose: 'apple' },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'apple' }, // Default iOS

  // Favicons
  { size: 16, name: 'favicon-16x16.png', purpose: 'favicon' },
  { size: 32, name: 'favicon-32x32.png', purpose: 'favicon' },
  { size: 48, name: 'favicon-48x48.png', purpose: 'favicon' },
];

// Read source SVG
const svgBuffer = readFileSync(sourceIcon);

/**
 * Generate a single icon
 */
async function generateIcon({ size, name, purpose, padding = 0 }) {
  const outputPath = join(iconsDir, name);

  try {
    let pipeline = sharp(svgBuffer);

    // For maskable icons, we need to add padding
    if (purpose === 'maskable' && padding > 0) {
      const paddedSize = Math.round(size / (1 - padding * 2));
      const offset = Math.round((paddedSize - size) / 2);

      pipeline = pipeline
        .resize(size, size, {
          fit: 'contain',
          background: { r: 1, g: 87, b: 155, alpha: 1 } // #01579b
        })
        .extend({
          top: offset,
          bottom: offset,
          left: offset,
          right: offset,
          background: { r: 1, g: 87, b: 155, alpha: 1 }
        })
        .resize(size, size);
    } else {
      pipeline = pipeline.resize(size, size, {
        fit: 'contain',
        background: { r: 1, g: 87, b: 155, alpha: 1 }
      });
    }

    await pipeline
      .png({
        compressionLevel: 9,
        quality: 100
      })
      .toFile(outputPath);

    console.log(`✓ Generated ${name} (${size}x${size}${padding > 0 ? ` with ${padding * 100}% padding` : ''})`);
  } catch (error) {
    console.error(`✗ Failed to generate ${name}:`, error.message);
    throw error;
  }
}

/**
 * Generate favicon.ico (multi-resolution)
 */
async function generateFavicon() {
  const faviconPath = join(publicDir, 'favicon.ico');

  try {
    // Generate a 32x32 PNG for the ICO
    await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 1, g: 87, b: 155, alpha: 1 }
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));

    // Note: Sharp doesn't support ICO format directly
    // Users should convert the 32x32 PNG to ICO using online tools
    // or install imagemagick: convert favicon-32x32.png favicon.ico
    console.log('✓ Generated favicon PNG (convert to ICO manually if needed)');
    console.log('  Run: convert icons/favicon-32x32.png public/favicon.ico');
  } catch (error) {
    console.error('✗ Failed to generate favicon:', error.message);
  }
}

/**
 * Generate iOS splash screens
 */
async function generateSplashScreens() {
  const splashScreens = [
    { width: 1125, height: 2436, name: 'apple-splash-1125x2436.png', device: 'iPhone X/XS/11 Pro' },
    { width: 1242, height: 2688, name: 'apple-splash-1242x2688.png', device: 'iPhone XS Max/11 Pro Max' },
    { width: 828, height: 1792, name: 'apple-splash-828x1792.png', device: 'iPhone XR/11' },
    { width: 1170, height: 2532, name: 'apple-splash-1170x2532.png', device: 'iPhone 12/13/14 Pro' },
    { width: 1284, height: 2778, name: 'apple-splash-1284x2778.png', device: 'iPhone 12/13/14 Pro Max' },
    { width: 1179, height: 2556, name: 'apple-splash-1179x2556.png', device: 'iPhone 15 Pro' },
    { width: 1290, height: 2796, name: 'apple-splash-1290x2796.png', device: 'iPhone 15 Pro Max' },
    { width: 2048, height: 2732, name: 'apple-splash-2048x2732.png', device: 'iPad Pro 12.9"' },
    { width: 1668, height: 2388, name: 'apple-splash-1668x2388.png', device: 'iPad Pro 11"' },
  ];

  for (const splash of splashScreens) {
    const outputPath = join(iconsDir, splash.name);

    try {
      // Create a centered icon on a colored background
      await sharp({
        create: {
          width: splash.width,
          height: splash.height,
          channels: 4,
          background: { r: 1, g: 87, b: 155, alpha: 1 }
        }
      })
      .composite([
        {
          input: await sharp(svgBuffer)
            .resize(Math.round(Math.min(splash.width, splash.height) * 0.4)) // 40% of screen
            .png()
            .toBuffer(),
          gravity: 'center'
        }
      ])
      .png({
        compressionLevel: 9
      })
      .toFile(outputPath);

      console.log(`✓ Generated splash screen for ${splash.device} (${splash.width}x${splash.height})`);
    } catch (error) {
      console.error(`✗ Failed to generate splash screen for ${splash.device}:`, error.message);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating PWA icons and assets...\n');
  console.log(`Source: ${sourceIcon}`);
  console.log(`Output: ${iconsDir}\n`);

  // Check if source exists
  if (!existsSync(sourceIcon)) {
    console.error('❌ Source icon not found:', sourceIcon);
    process.exit(1);
  }

  try {
    // Generate all standard icons
    console.log('📱 Generating standard icons...');
    for (const config of iconSizes) {
      await generateIcon(config);
    }

    console.log('\n🍎 Generating iOS splash screens...');
    await generateSplashScreens();

    console.log('\n⭐ Generating favicon...');
    await generateFavicon();

    console.log('\n✅ All assets generated successfully!');
    console.log('\n📋 Next steps:');
    console.log('  1. Verify icons in public/icons/');
    console.log('  2. Update manifest.json with icon references');
    console.log('  3. Add iOS splash screen meta tags to index.html');
    console.log('  4. Optional: Convert favicon-32x32.png to favicon.ico');
    console.log('     Run: convert icons/favicon-32x32.png public/favicon.ico\n');
  } catch (error) {
    console.error('\n❌ Icon generation failed:', error);
    process.exit(1);
  }
}

main();
