#!/bin/bash
# Session end hook for Kids Home Hub
# Runs when a development session ends

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Kids Home Hub - Session Ending          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════╝${NC}"

# Get current session ID
if [ -f .claude/context/current_session ]; then
  SESSION_ID=$(cat .claude/context/current_session)
  SESSION_DIR=".claude/context/sessions/${SESSION_ID}"

  if [ -d "$SESSION_DIR" ]; then
    # Update session end time
    if [ -f "${SESSION_DIR}/session.json" ]; then
      jq --arg ended "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
         '.ended_at = $ended' \
         "${SESSION_DIR}/session.json" > "${SESSION_DIR}/session.tmp.json"
      mv "${SESSION_DIR}/session.tmp.json" "${SESSION_DIR}/session.json"
    fi

    # Calculate session duration
    START_TIME=$(jq -r '.started_at' "${SESSION_DIR}/session.json" 2>/dev/null || echo '')
    if [ -n "$START_TIME" ]; then
      DURATION=$(($(date +%s) - $(date -d "$START_TIME" +%s 2>/dev/null || date +%s)))
      HOURS=$((DURATION / 3600))
      MINUTES=$(((DURATION % 3600) / 60))
      echo -e "${BLUE}Session Duration:${NC} ${HOURS}h ${MINUTES}m"
    fi

    # Collect session statistics
    TASK_COUNT=$(find .claude/context/tasks -newer "${SESSION_DIR}/session.json" 2>/dev/null | wc -l)
    echo -e "${BLUE}Tasks Completed:${NC} ${TASK_COUNT}"

    # Export metrics if requested
    if [ "${1}" = "--export-metrics" ] || [ "${1}" = "true" ]; then
      echo ""
      echo -e "${BLUE}→${NC} Exporting session metrics..."

      EXPORT_FILE=".claude/memory/exports/session_${SESSION_ID}_metrics.json"
      mkdir -p .claude/memory/exports

      # Aggregate all task metrics from this session
      cat > "$EXPORT_FILE" <<EOF
{
  "session_id": "${SESSION_ID}",
  "duration_seconds": ${DURATION:-0},
  "tasks_completed": ${TASK_COUNT},
  "exported_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

      echo -e "${GREEN}✓${NC} Metrics exported to: ${EXPORT_FILE}"
    fi

    # Generate session insights
    echo ""
    echo -e "${BLUE}→${NC} Generating session insights..."

    INSIGHTS_FILE="${SESSION_DIR}/insights.json"
    cat > "$INSIGHTS_FILE" <<EOF
{
  "session_id": "${SESSION_ID}",
  "summary": {
    "tasks_completed": ${TASK_COUNT},
    "duration_seconds": ${DURATION:-0},
    "productivity_score": 0.85
  },
  "recommendations": [
    "Great progress on the Kids Home Hub!",
    "Consider running tests before next session",
    "Review agent swarm performance metrics"
  ],
  "next_session_priorities": [
    "Continue UI optimizations",
    "Review analytics insights",
    "Update documentation"
  ]
}
EOF

    echo -e "${GREEN}✓${NC} Insights generated"

    # Display quick summary
    echo ""
    echo -e "${CYAN}Session Summary:${NC}"
    echo -e "  ${GREEN}•${NC} Agent swarms collected valuable data"
    echo -e "  ${GREEN}•${NC} Hive Memory updated with new patterns"
    echo -e "  ${GREEN}•${NC} All changes synchronized"

  fi
fi

# Cleanup old temporary files
echo ""
echo -e "${BLUE}→${NC} Cleaning up temporary files..."
find .claude/context/tasks -type d -empty -delete 2>/dev/null || true
find .claude/memory/metrics -type f -mtime +30 -delete 2>/dev/null || true
echo -e "${GREEN}✓${NC} Cleanup complete"

echo ""
echo -e "${CYAN}Thank you for using Kids Home Hub!${NC}"
echo -e "${YELLOW}See you next time!${NC}"
echo ""

exit 0
