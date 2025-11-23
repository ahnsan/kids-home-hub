#!/usr/bin/env node

/**
 * Bundle Size Budget Checker
 * Ensures bundle sizes stay within defined limits
 */

const fs = require('fs');
const path = require('path');

// Bundle size budgets (in bytes)
const BUDGETS = {
  'worker.js': 500 * 1024,        // 500 KB for worker
  'main.bundle.js': 300 * 1024,   // 300 KB for main bundle
  'vendor.bundle.js': 500 * 1024, // 500 KB for vendor bundle
  'total': 1 * 1024 * 1024,       // 1 MB total
};

// Color codes for terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return null;
  }
}

function checkBundles() {
  console.log('\n=== Bundle Size Budget Check ===\n');

  const distDir = path.join(process.cwd(), 'dist');
  let totalSize = 0;
  let hasErrors = false;
  const results = [];

  // Check individual files
  for (const [file, budget] of Object.entries(BUDGETS)) {
    if (file === 'total') continue;

    const filePath = path.join(distDir, file);
    const size = getFileSize(filePath);

    if (size === null) {
      console.log(`${colors.yellow}⚠${colors.reset}  ${file}: File not found (skipped)`);
      continue;
    }

    totalSize += size;
    const percentage = (size / budget) * 100;
    const status = size <= budget ? 'PASS' : 'FAIL';
    const color = size <= budget ? colors.green : colors.red;

    if (status === 'FAIL') {
      hasErrors = true;
    }

    const result = {
      file,
      size,
      budget,
      percentage,
      status,
    };

    results.push(result);

    console.log(
      `${color}${status === 'PASS' ? '✓' : '✗'}${colors.reset}  ${file}`
    );
    console.log(
      `   Size: ${formatBytes(size)} / ${formatBytes(budget)} (${percentage.toFixed(1)}%)`
    );

    if (percentage > 90 && percentage <= 100) {
      console.log(
        `   ${colors.yellow}Warning: Approaching budget limit${colors.reset}`
      );
    } else if (percentage > 100) {
      console.log(
        `   ${colors.red}Error: Exceeded budget by ${formatBytes(size - budget)}${colors.reset}`
      );
    }
    console.log();
  }

  // Check total size
  console.log('--- Total Bundle Size ---');
  const totalBudget = BUDGETS.total;
  const totalPercentage = (totalSize / totalBudget) * 100;
  const totalStatus = totalSize <= totalBudget ? 'PASS' : 'FAIL';
  const totalColor = totalSize <= totalBudget ? colors.green : colors.red;

  if (totalStatus === 'FAIL') {
    hasErrors = true;
  }

  console.log(
    `${totalColor}${totalStatus === 'PASS' ? '✓' : '✗'}${colors.reset}  Total Size`
  );
  console.log(
    `   Size: ${formatBytes(totalSize)} / ${formatBytes(totalBudget)} (${totalPercentage.toFixed(1)}%)`
  );

  if (totalPercentage > 90 && totalPercentage <= 100) {
    console.log(
      `   ${colors.yellow}Warning: Approaching total budget limit${colors.reset}`
    );
  } else if (totalPercentage > 100) {
    console.log(
      `   ${colors.red}Error: Exceeded total budget by ${formatBytes(totalSize - totalBudget)}${colors.reset}`
    );
  }

  // Save results to JSON
  const reportPath = path.join(process.cwd(), 'bundle-stats.json');
  const report = {
    timestamp: new Date().toISOString(),
    results,
    total: {
      size: totalSize,
      budget: totalBudget,
      percentage: totalPercentage,
      status: totalStatus,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nBundle report saved to: ${reportPath}`);

  // Exit with error if any checks failed
  if (hasErrors) {
    console.log(
      `\n${colors.red}Bundle size budget check FAILED${colors.reset}\n`
    );
    process.exit(1);
  } else {
    console.log(
      `\n${colors.green}Bundle size budget check PASSED${colors.reset}\n`
    );
    process.exit(0);
  }
}

// Run the check
checkBundles();
