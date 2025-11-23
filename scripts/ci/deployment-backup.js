#!/usr/bin/env node

/**
 * Deployment Backup Script
 * Creates backups before production deployments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--environment='));
const environment = envArg ? envArg.split('=')[1] : 'production';

const BACKUP_DIR = path.join(process.cwd(), '.backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupName = `backup-${environment}-${timestamp}`;
const backupPath = path.join(BACKUP_DIR, backupName);

console.log(`Creating backup for ${environment} environment...`);

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Create backup
try {
  // Get current deployment info
  console.log('Fetching current deployment information...');
  const deploymentInfo = execSync(
    `npx wrangler deployments list --env ${environment} --limit 1 --json`,
    { encoding: 'utf-8' }
  );

  const currentDeployment = JSON.parse(deploymentInfo)[0];

  // Save deployment metadata
  const metadata = {
    environment,
    timestamp: new Date().toISOString(),
    deployment: currentDeployment,
    version: require(path.join(process.cwd(), 'package.json')).version,
  };

  fs.mkdirSync(backupPath, { recursive: true });
  fs.writeFileSync(
    path.join(backupPath, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Backup worker script
  const workerPath = path.join(process.cwd(), 'worker.js');
  if (fs.existsSync(workerPath)) {
    fs.copyFileSync(
      workerPath,
      path.join(backupPath, 'worker.js')
    );
  }

  // Backup wrangler config
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  if (fs.existsSync(wranglerPath)) {
    fs.copyFileSync(
      wranglerPath,
      path.join(backupPath, 'wrangler.toml')
    );
  }

  // Backup dist directory if it exists
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    execSync(`cp -r ${distPath} ${path.join(backupPath, 'dist')}`);
  }

  // Compress backup
  console.log('Compressing backup...');
  execSync(
    `tar -czf ${backupPath}.tar.gz -C ${BACKUP_DIR} ${backupName}`
  );

  // Remove uncompressed backup
  execSync(`rm -rf ${backupPath}`);

  console.log(`Backup created successfully: ${backupPath}.tar.gz`);

  // Keep only last 10 backups
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith(`backup-${environment}-`) && f.endsWith('.tar.gz'))
    .sort()
    .reverse();

  if (backups.length > 10) {
    console.log('Cleaning up old backups...');
    backups.slice(10).forEach(backup => {
      fs.unlinkSync(path.join(BACKUP_DIR, backup));
      console.log(`Removed old backup: ${backup}`);
    });
  }

  process.exit(0);
} catch (error) {
  console.error('Backup failed:', error.message);
  process.exit(1);
}
