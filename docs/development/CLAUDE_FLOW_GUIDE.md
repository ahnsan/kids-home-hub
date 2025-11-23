# Claude Flow Integration Guide

This guide explains how Claude Flow, Hive Memory, and Agent Swarms work together in the Kids Home Hub project.

## What is Claude Flow?

Claude Flow is an AI orchestration system that enables:
- **Automated task management** with intelligent agents
- **Persistent learning** through Hive Memory
- **Coordinated agent swarms** for complex operations
- **Real-time optimization** of system performance

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  USER INTERACTION                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              CLOUDFLARE WORKER (Edge)                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Request Handler → Data Pipeline Workflow         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 AGENT SWARMS LAYER                      │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ Data Management  │  │ UI Optimization  │            │
│  │     Swarm        │  │     Swarm        │            │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │            │
│  │ │KV Optimizer  │ │  │ │Performance   │ │            │
│  │ │Data Validator│ │  │ │Monitor       │ │            │
│  │ │Cache Manager │ │  │ │PWA Optimizer │ │            │
│  │ └──────────────┘ │  │ └──────────────┘ │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
│  ┌──────────────────┐                                   │
│  │   Analytics      │                                   │
│  │     Swarm        │                                   │
│  │ ┌──────────────┐ │                                   │
│  │ │Usage Analyzer│ │                                   │
│  │ │Pattern       │ │                                   │
│  │ │Detector      │ │                                   │
│  │ │Recommender   │ │                                   │
│  │ └──────────────┘ │                                   │
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  HIVE MEMORY SYSTEM                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Short-term   │  │ Medium-term  │  │ Long-term    │  │
│  │ Memory (24h) │  │ Memory (7d)  │  │ Memory (90d) │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                          │
│  Learning Modules:                                      │
│  • Chore Patterns    • Reward Optimization              │
│  • Financial Literacy                                   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              CLOUDFLARE KV STORAGE                      │
│  • Child balances  • Transaction logs                   │
│  • Points data     • Screen time data                   │
│  • Analytics       • Insights                           │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Data Pipeline Workflow

When a user submits a transaction (e.g., adding pocket money):

```javascript
// User Action
POST /transaction {
  feature: "money",
  child: "adam",
  action: "add",
  amount: 10,
  currency: "GBP",
  reason: "Allowance"
}
```

**Flow Execution:**

1. **Data Validator Agent** validates the input
   - Checks required fields
   - Validates ranges and formats
   - Detects anomalies

2. **Worker Function** processes the transaction
   - Updates KV store
   - Records transaction log

3. **KV Optimizer Agent** (async)
   - Analyzes access patterns
   - Suggests batch operations
   - Optimizes cache strategy

4. **Hive Memory Sync** (async)
   - Stores transaction context
   - Updates learning models
   - Records patterns

5. **Usage Analyzer Agent** (async)
   - Updates child profile
   - Detects trends
   - Generates insights

### 2. Analytics Pipeline Workflow

Runs daily at midnight UTC:

```javascript
// Triggered by cron: "0 0 * * *"
```

**Flow Execution:**

1. **Data Collection**
   - Fetches all transactions from last 24h
   - Collects chore completions
   - Gathers points redemptions

2. **Pattern Detector Agent**
   - Analyzes behavioral patterns
   - Identifies trends
   - Detects anomalies

3. **Usage Analyzer Agent**
   - Generates insights
   - Calculates metrics
   - Creates alerts

4. **Recommendation Engine Agent**
   - Generates personalized recommendations
   - Suggests optimal chore times
   - Predicts future behavior

5. **Storage & Notification**
   - Stores results in KV
   - Updates Hive Memory
   - Sends notifications (if enabled)

### 3. Hive Memory System

Three-tier memory architecture:

#### Short-term Memory (24 hours)
```json
{
  "layer": "short_term",
  "data": {
    "recent_transactions": [...],
    "session_context": {...},
    "immediate_patterns": [...]
  }
}
```

**Purpose**: Immediate context for real-time decisions

#### Medium-term Memory (7 days)
```json
{
  "layer": "medium_term",
  "data": {
    "weekly_patterns": {...},
    "aggregated_metrics": {...},
    "trend_indicators": [...]
  }
}
```

**Purpose**: Weekly trends and habit formation

#### Long-term Memory (90 days)
```json
{
  "layer": "long_term",
  "data": {
    "learned_preferences": {...},
    "behavioral_models": {...},
    "milestone_achievements": [...]
  }
}
```

**Purpose**: Historical understanding and deep personalization

### 4. Learning Modules

#### Chore Patterns Module

**Learns:**
- Optimal completion times
- Difficulty preferences
- Motivation factors

**Algorithm**: Temporal analysis with reinforcement learning

**Output:**
```json
{
  "child_id": "adam",
  "optimal_chore_time": "16:00-17:00",
  "difficulty_score": 0.65,
  "completion_prediction": 0.82,
  "recommendations": [
    "Suggest 'Tidy bedroom' at 4 PM for highest success rate"
  ]
}
```

#### Reward Optimization Module

**Learns:**
- Redemption patterns
- Saving behavior
- Motivation triggers

**Algorithm**: Reinforcement learning with multi-armed bandit

**Output:**
```json
{
  "child_id": "sami",
  "preferred_rewards": ["screen_time", "special_activities"],
  "optimal_point_value": 50,
  "engagement_score": 0.91,
  "recommendations": [
    "Increase chore point values slightly to maintain engagement"
  ]
}
```

#### Financial Literacy Module

**Learns:**
- Spending patterns
- Saving habits
- Decision-making quality

**Algorithm**: Progression tracking with milestone detection

**Output:**
```json
{
  "child_id": "adam",
  "literacy_score": 0.73,
  "saving_rate": 0.65,
  "decision_quality": "improving",
  "next_milestone": "Save £50 for 30 days",
  "recommendations": [
    "Introduce goal-setting features",
    "Celebrate recent 2-week saving streak"
  ]
}
```

## Agent Swarms in Detail

### Data Management Swarm

**Coordination Type**: Parallel

**Agents:**

1. **KV Optimizer**
   - Monitors: Read/write patterns
   - Optimizes: Batch operations, caching
   - Outputs: Performance recommendations

2. **Data Validator**
   - Validates: All inputs
   - Detects: Anomalies, fraud
   - Outputs: Validated data, alerts

3. **Cache Manager**
   - Manages: Edge caching
   - Optimizes: Cache hit rates
   - Outputs: Cache strategies

**Communication**: Message queue (async)

### UI Optimization Swarm

**Coordination Type**: Sequential

**Agents:**

1. **Performance Monitor**
   - Tracks: Load times, interactions
   - Analyzes: Bottlenecks
   - Outputs: Performance metrics

2. **Accessibility Checker**
   - Validates: WCAG compliance
   - Checks: Screen reader compatibility
   - Outputs: Accessibility report

3. **PWA Optimizer**
   - Optimizes: Service worker, caching
   - Ensures: Offline functionality
   - Outputs: PWA health score

**Communication**: Event stream (sync)

### Analytics Swarm

**Coordination Type**: Parallel

**Agents:**

1. **Usage Analyzer**
   - Analyzes: User behavior
   - Tracks: Engagement metrics
   - Outputs: Usage insights

2. **Pattern Detector**
   - Detects: Behavioral patterns
   - Identifies: Trends, anomalies
   - Outputs: Pattern reports

3. **Recommendation Engine**
   - Generates: Personalized suggestions
   - Predicts: Future behavior
   - Outputs: Recommendations

**Communication**: Pub/Sub (async)

## Workflows in Action

### Example: Processing a Chore Completion

```javascript
// User completes chores
POST /chores {
  child: "adam",
  chore: ["tidy_room", "homework"]
}
```

**Workflow Steps:**

```
1. Data Validator validates input
   └─> ✓ Valid child ID
   └─> ✓ Valid chore IDs
   └─> ✓ No anomalies detected

2. Worker processes chore completion
   └─> Calculate total points (10 + 8 = 18)
   └─> Update points balance
   └─> Record in chore log
   └─> Record in points log

3. KV Optimizer (async)
   └─> Analyze: 2 writes performed
   └─> Suggest: Batch future operations
   └─> Cache: Updated balances

4. Hive Memory Sync (async)
   └─> Store chore completion context
   └─> Update chore patterns model
   └─> Record completion time: 16:30

5. Usage Analyzer (async)
   └─> Detect pattern: Adam prefers after-school
   └─> Update consistency score
   └─> Generate insight: "Great streak! 5 days in a row"

6. Recommendation Engine (async)
   └─> Suggest: "Try 'help_laundry' tomorrow for bonus points"
   └─> Predict: High likelihood of completion
```

**Result:**
- Points added immediately
- Insights generated in background
- Future recommendations personalized
- System learns optimal timing

### Example: Daily Analytics Run

```javascript
// Cron trigger: 0 0 * * *
Analytics Pipeline Activated
```

**Workflow Steps:**

```
1. Collect Data (5s)
   └─> Fetch all transactions (past 24h)
   └─> Fetch chore completions
   └─> Fetch points redemptions
   └─> Total: 47 events

2. Pattern Detector analyzes (10s)
   └─> Detect: Adam completes chores 16:00-17:00
   └─> Detect: Sami prefers morning chores
   └─> Anomaly: Unusually high screen time redemption
   └─> Trend: Both children saving more

3. Usage Analyzer generates insights (10s)
   └─> Adam: Consistency score 87% (+5%)
   └─> Sami: Engagement score 92% (+3%)
   └─> Alert: Consider increasing chore difficulty
   └─> Milestone: Sami saved £10 for 14 days!

4. Recommendation Engine (10s)
   └─> Suggest for Adam: "Try 'feed_pet' in evening"
   └─> Suggest for Sami: "Increase homework points to 10"
   └─> Parent insight: "Both children showing excellent progress"

5. Store Results (2s)
   └─> Save to KV: analytics:daily:2024-11-22
   └─> Update Hive Memory: patterns, insights
   └─> Cache: Latest recommendations

6. Notify (if enabled)
   └─> Parent dashboard: New insights available
   └─> Email: Weekly progress report
```

**Total Duration**: ~37 seconds (mostly parallel)

## Configuration Examples

### Enable/Disable Agents

Edit `.claude/swarms/coordinator.json`:

```json
{
  "swarm_definitions": [
    {
      "id": "analytics",
      "enabled": true,  // ← Set to false to disable entire swarm
      "agents": [...]
    }
  ]
}
```

### Customize Learning Frequency

Edit `.claude/memory/hive_config.json`:

```json
{
  "learning_modules": {
    "chore_patterns": {
      "enabled": true,
      "update_frequency": "daily",  // ← Change to "hourly" or "weekly"
      "min_data_points": 10
    }
  }
}
```

### Adjust Memory Retention

```json
{
  "memory_layers": {
    "short_term": {
      "ttl": 86400,  // ← 24 hours (in seconds)
      "max_entries": 1000
    },
    "long_term": {
      "ttl": 15552000,  // ← Change to 180 days
      "max_entries": 200
    }
  }
}
```

## Monitoring & Debugging

### View Agent Activity

```bash
# View recent task executions
ls -la .claude/context/tasks/

# View specific task details
cat .claude/context/tasks/task_*/metadata.json | jq .
```

### Check Hive Memory

```bash
# View session data
cat .claude/memory/sessions/session_*/insights.json | jq .

# View metrics
cat .claude/memory/metrics/*.json | jq .
```

### Export Analytics

```bash
# Run session end hook with export
./.claude/hooks/session-end.sh --export-metrics

# View exported data
cat .claude/memory/exports/*.json | jq .
```

## Best Practices

### 1. Agent Design
- Keep agents focused on single responsibilities
- Use async for non-critical operations
- Implement proper timeout handling
- Return structured outputs

### 2. Workflow Design
- Validate data early in the pipeline
- Use parallel execution where possible
- Handle errors gracefully
- Monitor execution times

### 3. Hive Memory
- Set appropriate TTLs for each layer
- Regularly clean up old data
- Use compression for large datasets
- Export important insights periodically

### 4. Performance
- Batch KV operations when possible
- Use edge caching strategically
- Run heavy analytics off peak hours
- Monitor agent response times

## Troubleshooting

### Agent Not Responding

**Check configuration:**
```bash
cat .claude/swarms/coordinator.json | jq '.swarm_definitions[] | select(.id=="your_swarm")'
```

**View logs:**
```bash
cat .claude/context/tasks/*/metadata.json | jq 'select(.status=="error")'
```

### Memory Growing Too Large

**Clean old data:**
```bash
find .claude/memory/sessions -mtime +30 -delete
find .claude/memory/metrics -mtime +30 -delete
```

**Adjust retention:**
Edit `.claude/memory/hive_config.json` and reduce TTL values

### Workflows Timing Out

**Increase timeouts:**
Edit workflow JSON files and increase `timeout` values

**Split into smaller steps:**
Break large workflows into multiple smaller workflows

## Advanced Topics

### Creating Custom Agents

1. Define agent capabilities
2. Implement input/output schema
3. Add to swarm configuration
4. Reference in workflows

See `.claude/flows/agents/` for examples.

### Custom Learning Modules

1. Define features to track
2. Choose learning algorithm
3. Set update frequency
4. Define output format

See `.claude/memory/hive_config.json` for examples.

### Inter-Agent Communication

Agents can communicate via:
- Direct messages
- Broadcast events
- Request-response patterns
- Shared memory (Hive)

## Future Enhancements

- Real-time agent collaboration
- Federated learning across deployments
- Advanced recommendation algorithms
- Voice interface integration
- Predictive analytics dashboard

## Resources

- Main README: `README.md`
- Quick Start: `QUICKSTART.md`
- Flow Configuration: `.claude/flows/README.md`
- Example Configs: `.env.example`

---

**Questions?** Check the main README or open an issue on GitHub.
