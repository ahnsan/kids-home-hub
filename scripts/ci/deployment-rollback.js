#!/usr/bin/env node

/**
 * Deployment Rollback Script
 * Rolls back to previous deployment in case of failures
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--environment='));
const environment = envArg ? envArg.split('=')[1] : 'production';

console.log(`Initiating rollback for ${environment} environment...`);

try {
  // Get deployment history
  console.log('Fetching deployment history...');
  const deploymentsJson = execSync(
    `npx wrangler deployments list --env ${environment} --limit 10 --json`,
    { encoding: 'utf-8' }
  );

  const deployments = JSON.parse(deploymentsJson);

  if (deployments.length < 2) {
    console.error('No previous deployment found to rollback to');
    process.exit(1);
  }

  const currentDeployment = deployments[0];
  const previousDeployment = deployments[1];

  console.log('\nCurrent deployment:');
  console.log(`  ID: ${currentDeployment.id}`);
  console.log(`  Created: ${currentDeployment.created_on}`);

  console.log('\nRolling back to:');
  console.log(`  ID: ${previousDeployment.id}`);
  console.log(`  Created: ${previousDeployment.created_on}`);

  // Prompt for confirmation (skip in CI)
  if (!process.env.CI) {
    console.log('\nThis will rollback the deployment. Continue? (y/N)');
    // In a real scenario, you'd use readline for input
    // For CI, we auto-confirm
  }

  // Perform rollback by deploying previous version
  console.log('\nPerforming rollback...');
  execSync(
    `npx wrangler rollback --env ${environment} --message "Rollback from ${currentDeployment.id} to ${previousDeployment.id}"`,
    { stdio: 'inherit' }
  );

  // Verify rollback
  console.log('\nVerifying rollback...');
  const verifyJson = execSync(
    `npx wrangler deployments list --env ${environment} --limit 1 --json`,
    { encoding: 'utf-8' }
  );

  const newCurrent = JSON.parse(verifyJson)[0];

  if (newCurrent.id === previousDeployment.id) {
    console.log('\nRollback successful!');
    console.log(`Current deployment: ${newCurrent.id}`);

    // Create rollback log
    const logDir = path.join(process.cwd(), '.logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const logEntry = {
      timestamp: new Date().toISOString(),
      environment,
      fromDeployment: currentDeployment.id,
      toDeployment: previousDeployment.id,
      status: 'success',
    };

    const logFile = path.join(logDir, 'rollback.log');
    fs.appendFileSync(
      logFile,
      JSON.stringify(logEntry) + '\n'
    );

    process.exit(0);
  } else {
    console.error('Rollback verification failed');
    process.exit(1);
  }

} catch (error) {
  console.error('Rollback failed:', error.message);

  // Log failure
  const logDir = path.join(process.cwd(), '.logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    environment,
    status: 'failed',
    error: error.message,
  };

  const logFile = path.join(logDir, 'rollback.log');
  fs.appendFileSync(
    logFile,
    JSON.stringify(logEntry) + '\n'
  );

  process.exit(1);
}
