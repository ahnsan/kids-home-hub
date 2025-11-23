#!/bin/bash

# Magic Link Flow Test Script
# Tests the complete authentication flow for Kids Home Hub

set -e

API_URL="https://kids-home-hub-api.karim-005.workers.dev"
PWA_URL="https://kids-home-hub-pwa.pages.dev"
TEST_EMAIL="test-$(date +%s)@example.com"

echo "========================================="
echo "Magic Link Flow Test"
echo "========================================="
echo ""
echo "API URL: $API_URL"
echo "PWA URL: $PWA_URL"
echo "Test Email: $TEST_EMAIL"
echo ""

# Step 1: Request magic link
echo "Step 1: Requesting magic link..."
RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/magic-link" \
  -H "Content-Type: application/json" \
  -H "Origin: $PWA_URL" \
  -d "{\"email\":\"$TEST_EMAIL\",\"redirectUrl\":\"$PWA_URL\"}")

echo "Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success"; then
  echo "✓ Magic link request successful"
else
  echo "✗ Magic link request failed"
  exit 1
fi

echo ""

# Step 2: Extract token from database (simulated - in real scenario, user would click email link)
echo "Step 2: Extracting magic link token from database..."

# Get the latest token for this email from the database
export PGPASSWORD='npg_nIT9wO8Ashif'
TOKEN=$(psql 'postgresql://neondb_owner@ep-young-cell-ab2lrnji-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require' \
  -t -c "SELECT token FROM magic_link_tokens WHERE email = '$TEST_EMAIL' AND used_at IS NULL ORDER BY created_at DESC LIMIT 1" | xargs)

if [ -z "$TOKEN" ]; then
  echo "✗ Failed to retrieve token"
  exit 1
fi

echo "Token retrieved: ${TOKEN:0:10}..."
echo ""

# Step 3: Verify magic link token
echo "Step 3: Verifying magic link token..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/verify" \
  -H "Content-Type: application/json" \
  -H "Origin: $PWA_URL" \
  -d "{\"email\":\"$TEST_EMAIL\",\"token\":\"$TOKEN\"}")

echo "Verify Response: ${VERIFY_RESPONSE:0:100}..."

if echo "$VERIFY_RESPONSE" | grep -q "token"; then
  echo "✓ Magic link verification successful"

  # Extract JWT token
  JWT_TOKEN=$(echo "$VERIFY_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  USER_ID=$(echo "$VERIFY_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

  echo "✓ JWT Token: ${JWT_TOKEN:0:20}..."
  echo "✓ User ID: $USER_ID"
else
  echo "✗ Magic link verification failed"
  exit 1
fi

echo ""

# Step 4: Test authenticated endpoint
echo "Step 4: Testing authenticated endpoint..."
HOUSEHOLDS_RESPONSE=$(curl -s -X GET "$API_URL/v1/households" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Origin: $PWA_URL")

echo "Households Response: $HOUSEHOLDS_RESPONSE"

if echo "$HOUSEHOLDS_RESPONSE" | grep -q -E '\[\]|"id"'; then
  echo "✓ Authenticated request successful"
else
  echo "✗ Authenticated request failed"
  exit 1
fi

echo ""
echo "========================================="
echo "✓ All tests passed!"
echo "========================================="
echo ""
echo "Summary:"
echo "- Magic link request: ✓"
echo "- Token generation: ✓"
echo "- Token verification: ✓"
echo "- Authenticated request: ✓"
echo ""
echo "The magic link flow is working correctly!"
