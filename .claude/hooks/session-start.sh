#!/bin/bash
# Session start hook for Kids Home Hub
# Runs when a new development session begins

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Kids Home Hub - Session Starting        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"

# Generate session ID
SESSION_ID="session_$(date +%s)"
echo "$SESSION_ID" > .claude/context/current_session

# Create session context
SESSION_DIR=".claude/context/sessions/${SESSION_ID}"
mkdir -p "$SESSION_DIR"

cat > "${SESSION_DIR}/session.json" <<EOF
{
  "session_id": "${SESSION_ID}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'none')",
  "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'none')",
  "environment": "development"
}
EOF

echo -e "${GREEN}✓${NC} Session ID: ${BLUE}${SESSION_ID}${NC}"

# Load previous session insights
PREV_SESSION=$(ls -t .claude/context/sessions 2>/dev/null | head -2 | tail -1)
if [ -n "$PREV_SESSION" ] && [ "$PREV_SESSION" != "$SESSION_ID" ]; then
  echo -e "${BLUE}→${NC} Loading insights from previous session..."
  if [ -f ".claude/context/sessions/${PREV_SESSION}/insights.json" ]; then
    cp ".claude/context/sessions/${PREV_SESSION}/insights.json" "${SESSION_DIR}/previous_insights.json"
    echo -e "${GREEN}✓${NC} Previous insights loaded"
  fi
fi

# Initialize Hive Memory for this session
echo -e "${BLUE}→${NC} Initializing Hive Memory..."
mkdir -p .claude/memory/sessions
ln -sf "../../context/sessions/${SESSION_ID}" ".claude/memory/sessions/${SESSION_ID}"
echo -e "${GREEN}✓${NC} Hive Memory initialized"

# Activate Agent Swarms
echo -e "${BLUE}→${NC} Activating Agent Swarms..."
echo -e "  ${GREEN}•${NC} Data Management Swarm: Ready"
echo -e "  ${GREEN}•${NC} UI Optimization Swarm: Ready"
echo -e "  ${GREEN}•${NC} Analytics Swarm: Ready"

# Display current system status
echo ""
echo -e "${CYAN}Current Status:${NC}"

# Check KV data (simulated)
echo -e "  ${BLUE}Database:${NC} Cloudflare KV (CHILD_SPEND)"

# Check git status
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo -e "  ${BLUE}Git Branch:${NC} ${BRANCH}"
fi

# Recent activity summary (from Hive Memory)
if [ -d .claude/memory/metrics ]; then
  TASK_COUNT=$(find .claude/memory/metrics -name "task_*.json" -mtime -1 | wc -l)
  echo -e "  ${BLUE}Recent Tasks:${NC} ${TASK_COUNT} in last 24h"
fi

echo ""
echo -e "${CYAN}Ready to start! Type your commands...${NC}"
echo ""

exit 0
