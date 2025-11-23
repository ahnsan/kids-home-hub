#!/bin/bash
# Setup Verification Script for Kids Home Hub

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Kids Home Hub - Setup Verification      ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Check Node.js
echo -e "${BLUE}→${NC} Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✓${NC} Node.js installed: ${NODE_VERSION}"
else
    echo -e "${RED}✗${NC} Node.js not found"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
echo -e "${BLUE}→${NC} Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✓${NC} npm installed: ${NPM_VERSION}"
else
    echo -e "${RED}✗${NC} npm not found"
    ERRORS=$((ERRORS + 1))
fi

# Check Wrangler
echo -e "${BLUE}→${NC} Checking Wrangler..."
if command -v wrangler &> /dev/null; then
    WRANGLER_VERSION=$(wrangler --version 2>&1 | head -1)
    echo -e "${GREEN}✓${NC} Wrangler installed: ${WRANGLER_VERSION}"
else
    echo -e "${YELLOW}!${NC} Wrangler not found (install with: npm install -g wrangler)"
    WARNINGS=$((WARNINGS + 1))
fi

# Check required files
echo ""
echo -e "${BLUE}→${NC} Checking required files..."

REQUIRED_FILES=(
    "worker.js"
    "package.json"
    "wrangler.toml"
    ".claude/flows/config.json"
    ".claude/memory/hive_config.json"
    ".claude/swarms/coordinator.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} ${file}"
    else
        echo -e "${RED}✗${NC} ${file} (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check hook scripts
echo ""
echo -e "${BLUE}→${NC} Checking hook scripts..."

HOOKS=(
    ".claude/hooks/pre-task.sh"
    ".claude/hooks/post-task.sh"
    ".claude/hooks/session-start.sh"
    ".claude/hooks/session-end.sh"
    ".claude/init.sh"
)

for hook in "${HOOKS[@]}"; do
    if [ -f "$hook" ]; then
        if [ -x "$hook" ]; then
            echo -e "${GREEN}✓${NC} ${hook} (executable)"
        else
            echo -e "${YELLOW}!${NC} ${hook} (not executable - run: chmod +x ${hook})"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}✗${NC} ${hook} (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check directories
echo ""
echo -e "${BLUE}→${NC} Checking directory structure..."

REQUIRED_DIRS=(
    ".claude/flows/agents"
    ".claude/memory"
    ".claude/swarms/agents"
    ".claude/workflows"
    ".claude/hooks"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} ${dir}"
    else
        echo -e "${RED}✗${NC} ${dir} (missing)"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check wrangler.toml configuration
echo ""
echo -e "${BLUE}→${NC} Checking wrangler.toml configuration..."

if grep -q "your-kv-namespace-id-here" wrangler.toml 2>/dev/null; then
    echo -e "${YELLOW}!${NC} KV namespace ID not configured in wrangler.toml"
    echo -e "   Run: ${BLUE}wrangler kv:namespace create \"CHILD_SPEND\"${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✓${NC} KV namespace configured"
fi

# Check node_modules
echo ""
echo -e "${BLUE}→${NC} Checking dependencies..."

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}!${NC} Dependencies not installed"
    echo -e "   Run: ${BLUE}npm install${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check .env file
echo ""
echo -e "${BLUE}→${NC} Checking environment configuration..."

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    echo -e "${YELLOW}!${NC} .env file not found (optional)"
    echo -e "   You can copy: ${BLUE}cp .env.example .env${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}  Verification Summary                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Perfect!${NC} Your setup is complete and ready to go!"
    echo ""
    echo -e "Next steps:"
    echo -e "  1. ${BLUE}npm run dev${NC} - Start development server"
    echo -e "  2. Open ${BLUE}http://localhost:8787${NC} in your browser"
    echo -e "  3. (Optional) Run ${BLUE}./.claude/init.sh${NC} to initialize Claude Flow"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC}  Setup complete with ${WARNINGS} warning(s)"
    echo ""
    echo -e "You can proceed, but consider addressing the warnings above."
else
    echo -e "${RED}✗${NC} Setup incomplete: ${ERRORS} error(s), ${WARNINGS} warning(s)"
    echo ""
    echo -e "Please fix the errors above before proceeding."
    exit 1
fi

echo ""
echo -e "${BLUE}Documentation:${NC}"
echo -e "  • Quick Start: ${BLUE}QUICKSTART.md${NC}"
echo -e "  • Full Guide:  ${BLUE}README.md${NC}"
echo -e "  • AI Features: ${BLUE}CLAUDE_FLOW_GUIDE.md${NC}"
echo ""

exit 0
