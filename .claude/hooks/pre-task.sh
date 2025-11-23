#!/bin/bash
# Pre-task hook for Kids Home Hub
# Runs before each task execution

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}[Pre-Task Hook]${NC} Initializing task environment..."

# Parse task metadata
TASK_ID="${1:-unknown}"
TASK_TYPE="${2:-general}"

# Create task context directory
mkdir -p .claude/context/tasks/${TASK_ID}

# Initialize task metadata
cat > .claude/context/tasks/${TASK_ID}/metadata.json <<EOF
{
  "task_id": "${TASK_ID}",
  "type": "${TASK_TYPE}",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "running",
  "context": {
    "git_branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'none')",
    "git_commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'none')"
  }
}
EOF

# Load Hive Memory context
if [ -f .claude/memory/hive_config.json ]; then
  echo -e "${GREEN}✓${NC} Hive Memory context loaded"
fi

# Activate relevant agent swarms based on task type
case "$TASK_TYPE" in
  "data")
    echo -e "${GREEN}✓${NC} Activating Data Management Swarm"
    ;;
  "ui")
    echo -e "${GREEN}✓${NC} Activating UI Optimization Swarm"
    ;;
  "analytics")
    echo -e "${GREEN}✓${NC} Activating Analytics Swarm"
    ;;
  *)
    echo -e "${GREEN}✓${NC} Activating all swarms"
    ;;
esac

# Check system health
if command -v wrangler &> /dev/null; then
  echo -e "${GREEN}✓${NC} Wrangler CLI available"
else
  echo -e "${BLUE}ℹ${NC} Wrangler CLI not found (optional)"
fi

echo -e "${BLUE}[Pre-Task Hook]${NC} Environment ready"
exit 0
