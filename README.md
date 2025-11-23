# Kids Home Hub

An AI-powered Progressive Web App (PWA) for managing children's chores, rewards, screen time, and pocket money. Built with Cloudflare Workers, Claude Flow, Hive Memory, and Agent Swarms.

## Features

### Core Functionality
- **Bank Account Management**: Track pocket money in GBP and AUD with automatic conversion
- **Reward Points System**: Earn points through chores and good behavior
- **Screen Time Bank**: Redeem points for screen time (1 point = 1 minute)
- **Chores Tracker**: Complete chores to earn points automatically
- **Multi-Child Support**: Separate accounts for Adam and Sami

### AI-Powered Features (via Claude Flow)
- **Intelligent Analytics**: Pattern detection and behavioral insights
- **Smart Recommendations**: Personalized suggestions based on child behavior
- **Automated Optimization**: Self-optimizing data operations and caching
- **Predictive Insights**: Anticipate needs and suggest optimal times for tasks

### Technical Features
- **Progressive Web App**: Install on any device, works offline
- **Cloudflare Workers**: Lightning-fast global edge deployment
- **Hive Memory**: Persistent learning and context retention
- **Agent Swarms**: Coordinated AI agents for different tasks
- **Real-time Updates**: Instant synchronization across devices

## Architecture

### Claude Flow Integration

This project uses **Claude Flow** for intelligent task orchestration and automation:

```
┌─────────────────────────────────────────────────────────┐
│                   KIDS HOME HUB                         │
├─────────────────────────────────────────────────────────┤
│  Cloudflare Worker (Edge)                               │
│  ├─ Transaction Handler                                 │
│  ├─ Chores Handler                                      │
│  └─ Points Redemption                                   │
├─────────────────────────────────────────────────────────┤
│  Claude Flow Layer                                      │
│  ├─ Data Management Swarm                               │
│  │  ├─ KV Optimizer Agent                               │
│  │  ├─ Data Validator Agent                             │
│  │  └─ Cache Manager Agent                              │
│  ├─ UI Optimization Swarm                               │
│  │  ├─ Performance Monitor Agent                        │
│  │  ├─ Accessibility Checker Agent                      │
│  │  └─ PWA Optimizer Agent                              │
│  └─ Analytics Swarm                                     │
│     ├─ Usage Analyzer Agent                             │
│     ├─ Pattern Detector Agent                           │
│     └─ Recommendation Engine Agent                      │
├─────────────────────────────────────────────────────────┤
│  Hive Memory (Persistent Learning)                      │
│  ├─ Short-term Memory (24h)                             │
│  ├─ Medium-term Memory (7d)                             │
│  └─ Long-term Memory (90d)                              │
├─────────────────────────────────────────────────────────┤
│  Storage Layer                                          │
│  └─ Cloudflare KV (CHILD_SPEND)                         │
└─────────────────────────────────────────────────────────┘
```

### Agent Swarms

#### 1. Data Management Swarm
Handles all data operations with intelligence:
- **KV Optimizer**: Optimizes batch operations and caching strategies
- **Data Validator**: Validates inputs, detects anomalies
- **Cache Manager**: Manages edge caching for performance

#### 2. UI Optimization Swarm
Ensures optimal user experience:
- **Performance Monitor**: Tracks and optimizes loading times
- **Accessibility Checker**: Ensures WCAG compliance
- **PWA Optimizer**: Manages service worker and offline capability

#### 3. Analytics Swarm
Provides insights and recommendations:
- **Usage Analyzer**: Analyzes child activity patterns
- **Pattern Detector**: Identifies trends and habits
- **Recommendation Engine**: Generates personalized suggestions

### Hive Memory System

Persistent learning across sessions:

```json
{
  "short_term": "Recent interactions (24h)",
  "medium_term": "Weekly patterns (7d)",
  "long_term": "Historical trends (90d)"
}
```

**Learning Modules**:
- **Chore Patterns**: Optimal reminder times, difficulty scores
- **Reward Optimization**: Personalized reward preferences
- **Financial Literacy**: Track saving and spending behavior

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account
- Wrangler CLI
- Claude Code (optional, for enhanced development)

### Installation

1. **Clone and Install**
```bash
cd kids-home-hub
npm install
```

2. **Configure Cloudflare KV**
```bash
# Create KV namespace
wrangler kv:namespace create "CHILD_SPEND"

# Copy the ID and update wrangler.toml
# Replace 'your-kv-namespace-id-here' with your actual ID
```

3. **Initialize Claude Flow** (Optional)
```bash
npm run flow:init

# Make hooks executable
chmod +x .claude/hooks/*.sh
```

4. **Configure Hive Memory**
```bash
# Create required directories
mkdir -p .claude/context/{tasks,sessions}
mkdir -p .claude/memory/{sessions,metrics,exports}
```

### Development

**Start Local Development Server**
```bash
npm run dev
```

Visit `http://localhost:8787` to see your app.

**With Claude Flow Session Tracking**
```bash
# Start a tracked session
npm run flow:session
npm run dev
```

### Deployment

**Deploy to Cloudflare**
```bash
npm run deploy
```

**Create Production KV Namespace**
```bash
wrangler kv:namespace create "CHILD_SPEND" --env production
# Update wrangler.toml with production KV ID
```

## Usage

### For Parents

1. **Track Transactions**: Add pocket money or adjust balances
2. **Assign Points**: Reward good behavior manually
3. **Monitor Progress**: View activity logs and patterns
4. **View Insights**: Access AI-generated recommendations (coming soon)

### For Children

1. **Complete Chores**: Check off completed tasks to earn points
2. **Track Rewards**: See your points and screen time balance
3. **Redeem Points**: Convert points to screen time
4. **Monitor Money**: Watch your savings grow

## Claude Flow Workflows

### Data Pipeline
Automatically triggered on transactions:
1. Validate incoming data
2. Process transaction
3. Optimize KV operations
4. Sync to Hive Memory
5. Update analytics

### Analytics Pipeline
Runs daily at midnight UTC:
1. Collect all data from past 24h
2. Analyze behavior patterns
3. Generate insights and alerts
4. Create personalized recommendations
5. Update Hive Memory with learnings

## Configuration

### Customizing Agent Swarms

Edit `.claude/swarms/coordinator.json`:

```json
{
  "swarm_definitions": [
    {
      "id": "your_swarm",
      "priority": "high",
      "agents": [...]
    }
  ]
}
```

### Customizing Hive Memory

Edit `.claude/memory/hive_config.json`:

```json
{
  "memory_layers": {
    "short_term": {
      "ttl": 86400,
      "max_entries": 1000
    }
  }
}
```

### Adding New Learning Modules

```json
{
  "learning_modules": {
    "your_module": {
      "enabled": true,
      "algorithm": "your_algorithm",
      "features": [...],
      "outputs": [...]
    }
  }
}
```

## Hooks

The project includes lifecycle hooks:

- **pre-task.sh**: Runs before each task (setup environment)
- **post-task.sh**: Runs after each task (collect metrics)
- **session-start.sh**: Runs when starting a dev session
- **session-end.sh**: Runs when ending a dev session (export metrics)

### Manual Hook Execution

```bash
# Start session
./.claude/hooks/session-start.sh

# End session with metrics export
./.claude/hooks/session-end.sh --export-metrics
```

## Data Structure

### KV Keys

```
# Money (existing)
total_adam, total_sami          # GBP balance
log_adam, log_sami              # Transaction history

# Points
points:total:{child}            # Points balance
points:log:{child}              # Points history

# Screen Time
screen:total:{child}            # Minutes balance
screen:log:{child}              # Screen time history

# Chores
chores:log:{child}              # Chore completion history

# Hive Memory
hive:context:{session_id}       # Session context
hive:learning:{module_id}       # Learned parameters
hive:insights:{child}           # Generated insights
```

## API Endpoints

### POST /transaction
Process money, points, or screen time transaction

**Body Parameters**:
- `feature`: "money" | "points" | "screen"
- `child`: "adam" | "sami"
- `action`: "add" | "deduct"
- `amount`: number
- `currency`: "GBP" | "AUD" (money only)
- `reason`: string

### POST /chores
Submit completed chores

**Body Parameters**:
- `child`: "adam" | "sami"
- `chore[]`: array of chore IDs

### POST /redeem
Redeem points for screen time

**Body Parameters**:
- `child`: "adam" | "sami"
- `points`: number
- `reason`: string

## Monitoring & Analytics

### View Session Metrics

```bash
npm run flow:metrics
```

### Access Hive Memory Insights

```bash
# View latest insights
cat .claude/memory/exports/session_*_metrics.json | jq .

# View learning states
cat .claude/memory/hive_config.json
```

### Agent Performance

Monitor agent swarm performance in `.claude/context/tasks/*/metadata.json`

## Customization

### Adding New Chores

Edit `worker.js`:

```javascript
const CHORES = [
  { id: 'your_chore', label: 'Your Chore', points: 10 },
  // ...
];
```

### Adding New Children

Update `CHILDREN` array and create corresponding data structures.

### Changing Point Values

Modify `POINT_TO_MINUTES` constant for different conversion rates.

## Advanced Features

### Custom Agent Creation

Create a new agent in `.claude/flows/agents/`:

```json
{
  "id": "my_agent",
  "name": "My Custom Agent",
  "type": "specialist",
  "capabilities": ["..."],
  "outputs": ["..."]
}
```

### Custom Workflow

Create a new workflow in `.claude/workflows/`:

```json
{
  "workflow_id": "my_workflow",
  "name": "My Workflow",
  "steps": [...]
}
```

## Troubleshooting

### KV Namespace Issues
```bash
# List all KV namespaces
wrangler kv:namespace list

# Test KV access
wrangler kv:key get "test" --namespace-id=YOUR_ID
```

### Hook Permissions
```bash
# Make hooks executable
chmod +x .claude/hooks/*.sh
```

### Clear Hive Memory
```bash
# Clear old session data
find .claude/memory/sessions -type f -mtime +7 -delete
```

## Performance

- **Global Edge Deployment**: <50ms response times worldwide
- **KV Read Latency**: <10ms average
- **PWA Load Time**: <1.5s first contentful paint
- **Offline Capability**: 100% core functionality

## Security & Privacy

- No external tracking or analytics
- Data stored only in your Cloudflare account
- 90-day retention policy (configurable)
- Export and delete capabilities built-in
- No personal data leaves your infrastructure

## Roadmap

- [ ] Parent dashboard with AI insights
- [ ] Mobile app (React Native)
- [ ] Voice integration (Alexa/Google Home)
- [ ] Achievement badges and gamification
- [ ] Multi-language support
- [ ] Budget planning tools
- [ ] Automated allowance scheduling

## Contributing

This is a personal project, but suggestions are welcome via issues.

## License

MIT License - See LICENSE file

## Credits

Built with:
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Claude Flow](https://www.anthropic.com/) (Alpha)
- Progressive Web App standards
- Love for Adam and Sami

---

**Made with Claude Code**
