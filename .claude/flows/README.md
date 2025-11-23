# Claude Flow Configuration

This directory contains the Claude Flow configuration for the Kids Home Hub project.

## Structure

```
.claude/
├── flows/
│   ├── config.json              # Main Flow configuration
│   ├── agents/                  # Agent definitions
│   │   ├── kv_optimizer.json
│   │   ├── usage_analyzer.json
│   │   └── pwa_optimizer.json
│   └── README.md (this file)
├── memory/
│   ├── hive_config.json         # Hive Memory configuration
│   ├── context_schemas.json     # Data schemas
│   ├── sessions/                # Session data (gitignored)
│   ├── metrics/                 # Metrics data (gitignored)
│   └── exports/                 # Exported data (gitignored)
├── swarms/
│   ├── coordinator.json         # Swarm orchestration
│   └── agents/                  # Agent swarm definitions
│       ├── data_validator.json
│       └── recommendation_engine.json
├── workflows/
│   ├── data_pipeline.json       # Data processing workflow
│   └── analytics_pipeline.json  # Analytics workflow
├── hooks/
│   ├── pre-task.sh             # Pre-task hook
│   ├── post-task.sh            # Post-task hook
│   ├── session-start.sh        # Session start hook
│   └── session-end.sh          # Session end hook
└── context/
    ├── tasks/                   # Task execution context (gitignored)
    └── sessions/                # Session context (gitignored)
```

## Agent Roles

### Data Management Swarm
- **KV Optimizer**: Optimizes Cloudflare KV operations
- **Data Validator**: Validates all inputs and detects anomalies
- **Cache Manager**: Manages edge caching strategies

### UI Optimization Swarm
- **Performance Monitor**: Tracks performance metrics
- **Accessibility Checker**: Ensures WCAG compliance
- **PWA Optimizer**: Optimizes service worker and offline capabilities

### Analytics Swarm
- **Usage Analyzer**: Analyzes child behavior patterns
- **Pattern Detector**: Identifies trends and anomalies
- **Recommendation Engine**: Generates personalized recommendations

## Workflows

### Data Pipeline
Triggered on every transaction:
1. Validates data
2. Processes transaction
3. Optimizes KV operations
4. Syncs to Hive Memory
5. Updates analytics

### Analytics Pipeline
Runs daily at midnight UTC:
1. Collects all data
2. Analyzes patterns
3. Generates insights
4. Creates recommendations
5. Stores results

## Hive Memory

Three-tier memory system:
- **Short-term** (24h): Recent interactions
- **Medium-term** (7d): Weekly patterns
- **Long-term** (90d): Historical trends

### Learning Modules
- **Chore Patterns**: Optimal timing and difficulty
- **Reward Optimization**: Personalized preferences
- **Financial Literacy**: Money management insights

## Usage

### Enable/Disable Features

Edit `config.json`:

```json
{
  "hive_memory": {
    "enabled": true  // Set to false to disable
  }
}
```

### Add New Agent

1. Create agent JSON in `agents/`
2. Add to swarm in `swarms/coordinator.json`
3. Reference in workflows if needed

### Create Custom Workflow

1. Create workflow JSON in `workflows/`
2. Define triggers, steps, and error handling
3. Reference agents and Hive Memory as needed

## Monitoring

- Task metrics: `.claude/context/tasks/*/metadata.json`
- Session data: `.claude/memory/sessions/*/session.json`
- Exported metrics: `.claude/memory/exports/*.json`

## Best Practices

1. Always validate data before processing
2. Use async operations for non-critical tasks
3. Implement proper error handling
4. Monitor agent performance regularly
5. Clean up old data periodically (automated in hooks)

## Troubleshooting

### Hooks Not Running
```bash
chmod +x .claude/hooks/*.sh
```

### Memory Data Growing Too Large
```bash
# Clear old sessions
find .claude/memory/sessions -type f -mtime +30 -delete

# Clear old metrics
find .claude/memory/metrics -type f -mtime +30 -delete
```

### Agent Not Responding
Check logs in task metadata and verify configuration in coordinator.json
