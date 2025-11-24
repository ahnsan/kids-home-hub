#!/bin/bash

# ============================================================================
# Kids Home Hub - Test Users Migration Script
# ============================================================================
# This script runs the test-users.sql migration against your Neon database.
#
# Usage:
#   ./run-test-users.sh [DATABASE_URL]
#
# Examples:
#   ./run-test-users.sh                              # Uses DATABASE_URL env var
#   ./run-test-users.sh "postgresql://..."          # Uses provided URL
#
# Prerequisites:
#   - psql command-line tool installed
#   - Database connection string (from .env.local or as argument)
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MIGRATION_FILE="${SCRIPT_DIR}/test-users.sql"

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Kids Home Hub - Test Users Migration${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}ERROR: psql command not found${NC}"
    echo "Please install PostgreSQL client tools:"
    echo "  macOS:   brew install postgresql"
    echo "  Ubuntu:  sudo apt-get install postgresql-client"
    echo "  Windows: Download from https://www.postgresql.org/download/windows/"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}ERROR: Migration file not found: ${MIGRATION_FILE}${NC}"
    exit 1
fi

# Get database URL
if [ -n "$1" ]; then
    # Use provided URL
    DB_URL="$1"
    echo -e "${GREEN}✓${NC} Using database URL from command line argument"
elif [ -n "$DATABASE_URL" ]; then
    # Use environment variable
    DB_URL="$DATABASE_URL"
    echo -e "${GREEN}✓${NC} Using database URL from DATABASE_URL environment variable"
else
    # Try to read from .env.local
    ENV_FILE="${SCRIPT_DIR}/../../../apps/pwa/.env.local"
    if [ -f "$ENV_FILE" ]; then
        # Extract VITE_DATABASE_URL from .env.local
        DB_URL=$(grep "^VITE_DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f2- | tr -d '"' | tr -d "'")
        if [ -n "$DB_URL" ]; then
            echo -e "${GREEN}✓${NC} Using database URL from ${ENV_FILE}"
        fi
    fi
fi

# Final check for database URL
if [ -z "$DB_URL" ]; then
    echo -e "${RED}ERROR: No database URL provided${NC}"
    echo ""
    echo "Please provide a database URL using one of these methods:"
    echo "  1. Command line argument:  ./run-test-users.sh \"postgresql://...\""
    echo "  2. Environment variable:   export DATABASE_URL=\"postgresql://...\""
    echo "  3. Create .env.local file: /apps/pwa/.env.local"
    echo ""
    exit 1
fi

# Mask password in output
DB_URL_MASKED=$(echo "$DB_URL" | sed -E 's/:[^:@]*@/:****@/')
echo -e "${BLUE}→${NC} Database: ${DB_URL_MASKED}"
echo ""

# Test connection
echo -e "${YELLOW}Testing database connection...${NC}"
if ! psql "$DB_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Cannot connect to database${NC}"
    echo "Please check your connection string and try again."
    exit 1
fi
echo -e "${GREEN}✓${NC} Connection successful"
echo ""

# Ask for confirmation
echo -e "${YELLOW}This will create 2 test users with sample data:${NC}"
echo "  • test1@kidshub.dev (Smith Family - 2 children)"
echo "  • test2@kidshub.dev (Johnson Family - 1 child)"
echo ""
echo -e "${YELLOW}Continue? [y/N]${NC} "
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}Running migration...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Run migration
if psql "$DB_URL" -f "$MIGRATION_FILE"; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}Test Users Created:${NC}"
    echo "  1. test1@kidshub.dev - Smith Family"
    echo "     • Emma (8 years) - £12.50, 150 points, 60 min screen time"
    echo "     • Noah (12 years) - £25.00, 85 points, 30 min screen time"
    echo ""
    echo "  2. test2@kidshub.dev - Johnson Family"
    echo "     • Olivia (10 years) - £8.75, 200 points, 90 min screen time"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo "  • Test authentication with the above email addresses"
    echo "  • View dashboards for each household"
    echo "  • Explore transaction histories"
    echo "  • Test chore completion features"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  • Quick Reference: ${SCRIPT_DIR}/README.md"
    echo "  • Full Documentation: ${SCRIPT_DIR}/TEST_USERS.md"
    echo "  • Visual Summary: ${SCRIPT_DIR}/SUMMARY.md"
    echo ""
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    echo "Please check the error messages above and try again."
    echo ""
    exit 1
fi

echo -e "${BLUE}============================================================================${NC}"
echo ""
