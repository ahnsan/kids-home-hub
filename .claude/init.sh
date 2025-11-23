#!/bin/bash
# Claude Flow Initialization Script for Kids Home Hub

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  Kids Home Hub - Claude Flow Setup        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"
echo ""

# Create necessary directories
echo -e "${GREEN}→${NC} Creating directory structure..."
mkdir -p .claude/context/tasks
mkdir -p .claude/context/sessions
mkdir -p .claude/memory/sessions
mkdir -p .claude/memory/metrics
mkdir -p .claude/memory/exports

echo -e "${GREEN}✓${NC} Directories created"

# Make hooks executable
echo -e "${GREEN}→${NC} Making hooks executable..."
chmod +x .claude/hooks/*.sh

echo -e "${GREEN}✓${NC} Hooks are executable"

# Create initial session
echo -e "${GREEN}→${NC} Creating initial session..."
SESSION_ID="session_$(date +%s)"
echo "$SESSION_ID" > .claude/context/current_session

mkdir -p ".claude/context/sessions/${SESSION_ID}"
cat > ".claude/context/sessions/${SESSION_ID}/session.json" <<EOF
{
  "session_id": "${SESSION_ID}",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "type": "initialization"
}
EOF

echo -e "${GREEN}✓${NC} Initial session created"

# Verify configuration files
echo -e "${GREEN}→${NC} Verifying configuration..."

REQUIRED_FILES=(
  ".claude/flows/config.json"
  ".claude/memory/hive_config.json"
  ".claude/swarms/coordinator.json"
)

for file in "${REQUIRED_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${YELLOW}!${NC} $file (missing - will use defaults)"
  fi
done

# Display setup summary
echo ""
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${CYAN}═══════════════════════════════════════════${NC}"
echo ""
echo -e "Agent Swarms configured:"
echo -e "  ${GREEN}•${NC} Data Management Swarm"
echo -e "  ${GREEN}•${NC} UI Optimization Swarm"
echo -e "  ${GREEN}•${NC} Analytics Swarm"
echo ""
echo -e "Hive Memory initialized:"
echo -e "  ${GREEN}•${NC} Short-term memory (24h)"
echo -e "  ${GREEN}•${NC} Medium-term memory (7d)"
echo -e "  ${GREEN}•${NC} Long-term memory (90d)"
echo ""
echo -e "Next steps:"
echo -e "  1. ${YELLOW}npm install${NC}"
echo -e "  2. Configure KV namespace in wrangler.toml"
echo -e "  3. ${YELLOW}npm run dev${NC}"
echo ""
echo -e "${GREEN}Happy coding!${NC}"
echo ""

exit 0
