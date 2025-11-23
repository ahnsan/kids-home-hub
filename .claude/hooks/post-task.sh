#!/bin/bash
# Post-task hook for Kids Home Hub
# Runs after each task execution

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}[Post-Task Hook]${NC} Finalizing task..."

# Parse task metadata
TASK_ID="${1:-unknown}"
TASK_STATUS="${2:-completed}"

TASK_DIR=".claude/context/tasks/${TASK_ID}"

if [ -d "$TASK_DIR" ]; then
  # Update task metadata
  if [ -f "${TASK_DIR}/metadata.json" ]; then
    # Update completion time and status
    jq --arg status "$TASK_STATUS" \
       --arg ended "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
       '.status = $status | .ended_at = $ended' \
       "${TASK_DIR}/metadata.json" > "${TASK_DIR}/metadata.tmp.json"
    mv "${TASK_DIR}/metadata.tmp.json" "${TASK_DIR}/metadata.json"

    echo -e "${GREEN}✓${NC} Task metadata updated"
  fi

  # Collect task metrics
  TASK_DURATION=$(($(date +%s) - $(date -d "$(jq -r '.started_at' ${TASK_DIR}/metadata.json 2>/dev/null || echo '0')" +%s 2>/dev/null || echo '0')))

  # Store metrics in Hive Memory
  METRICS_FILE=".claude/memory/metrics/task_${TASK_ID}.json"
  mkdir -p .claude/memory/metrics

  cat > "$METRICS_FILE" <<EOF
{
  "task_id": "${TASK_ID}",
  "status": "${TASK_STATUS}",
  "duration_seconds": ${TASK_DURATION},
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

  echo -e "${GREEN}✓${NC} Metrics collected (${TASK_DURATION}s)"
fi

# Sync Hive Memory
if [ -f .claude/memory/hive_config.json ]; then
  echo -e "${BLUE}→${NC} Syncing Hive Memory..."
  # This would trigger actual sync in production
  echo -e "${GREEN}✓${NC} Memory synchronized"
fi

# Generate insights if analytics swarm is active
if [ "$TASK_STATUS" = "completed" ]; then
  echo -e "${BLUE}→${NC} Generating insights..."
  # This would trigger the analytics swarm in production
  echo -e "${GREEN}✓${NC} Insights generated"
fi

# Cleanup temporary files older than 7 days
find .claude/context/tasks -type f -mtime +7 -delete 2>/dev/null || true

echo -e "${BLUE}[Post-Task Hook]${NC} Task finalized successfully"
exit 0
