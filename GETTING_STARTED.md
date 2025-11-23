# Getting Started with Kids Home Hub

Welcome! This guide will walk you through everything you need to know to get your Kids Home Hub up and running.

## What You've Got

Your project is now fully configured with:

✅ **Core Application**: Complete PWA for managing kids' activities
✅ **Claude Flow**: AI-powered task orchestration
✅ **Hive Memory**: Persistent learning system
✅ **Agent Swarms**: 9 specialized AI agents in 3 coordinated swarms
✅ **Automated Workflows**: Data pipeline + analytics pipeline
✅ **Lifecycle Hooks**: Session and task tracking
✅ **Comprehensive Documentation**: Multiple guides for different needs

## Choose Your Path

### Path A: Just Want to Run It? (5 minutes)

Perfect for getting started quickly without AI features.

```bash
# 1. Install dependencies
npm install

# 2. Set up Cloudflare KV
npm install -g wrangler
wrangler login
wrangler kv:namespace create "CHILD_SPEND"

# 3. Update wrangler.toml with your KV ID
# (copy the ID from step 2 and paste in wrangler.toml)

# 4. Start development server
npm run dev

# 5. Open http://localhost:8787
```

**Read**: `QUICKSTART.md` for details

### Path B: Full Setup with AI Features (15 minutes)

Get everything including Claude Flow, Hive Memory, and Agent Swarms.

```bash
# 1. Follow Path A steps 1-3 above

# 2. Initialize Claude Flow
./.claude/init.sh

# 3. Start a tracked session
npm run flow:session

# 4. Start development
npm run dev

# 5. Make changes and watch agents work!
```

**Read**: `CLAUDE_FLOW_GUIDE.md` for advanced AI features

### Path C: Understanding Everything (30 minutes)

Learn how it all works before starting.

**Read in order**:
1. `PROJECT_SUMMARY.md` - Overview of entire project
2. `README.md` - Full documentation
3. `CLAUDE_FLOW_GUIDE.md` - AI integration details
4. `.claude/flows/README.md` - Configuration details

**Then**:
- Follow Path B above
- Explore configuration files
- Customize for your needs

## What's What

### Essential Files You'll Touch

```
worker.js           ← Your app logic (customize chores, children)
wrangler.toml       ← Cloudflare config (add your KV ID)
package.json        ← Dependencies and scripts
```

### Documentation (Pick What You Need)

```
QUICKSTART.md           ← 5-minute setup
README.md               ← Complete guide
CLAUDE_FLOW_GUIDE.md   ← AI features explained
PROJECT_SUMMARY.md     ← Big picture overview
GETTING_STARTED.md     ← This file
```

### Claude Flow Configuration (Optional)

```
.claude/
├── flows/              ← Agent definitions
├── memory/             ← Hive Memory config
├── swarms/             ← Agent swarm orchestration
├── workflows/          ← Automated pipelines
└── hooks/              ← Lifecycle scripts
```

## Common First Steps

### 1. Customize for Your Kids

Edit `worker.js`:

```javascript
// Change children's names
const CHILDREN = ['your_child_1', 'your_child_2'];

// Customize chores
const CHORES = [
  { id: 'walk_dog', label: 'Walk the dog', points: 12 },
  // Add your family's chores
];

// Adjust conversion rates
const POINT_TO_MINUTES = 1; // Change if you want different ratio
```

### 2. Set Up Your Device as PWA

1. Open the app in your browser
2. Click "Add to Home Screen" (mobile) or install icon (desktop)
3. Use it like a native app!

### 3. Test the Features

**Try these in order**:

1. **Bank Account**
   - Add £10 to Adam
   - Watch it convert to AUD automatically
   - Check transaction history

2. **Chores**
   - Mark some chores complete
   - See points added automatically
   - Check points balance

3. **Screen Time**
   - Go to Points tab
   - Click "Spend for screen time"
   - Convert points to minutes

4. **History**
   - View all recent activities
   - See formatted dates
   - Check balances

### 4. Enable AI Features (Optional)

```bash
# Initialize
./.claude/init.sh

# Start session with tracking
npm run flow:session

# Do some work (add transactions, complete chores)

# End session and export metrics
./.claude/hooks/session-end.sh --export-metrics

# View insights
cat .claude/memory/exports/*.json | jq .
```

## Troubleshooting

### "Module not found" error
```bash
cd kids-home-hub
npm install
```

### "KV namespace not found"
1. Run: `wrangler kv:namespace create "CHILD_SPEND"`
2. Copy the ID from output
3. Paste it in `wrangler.toml` replacing `your-kv-namespace-id-here`

### Hooks not running
```bash
chmod +x .claude/hooks/*.sh
chmod +x .claude/init.sh
chmod +x verify-setup.sh
```

### Port already in use
```bash
pkill -f "wrangler dev"
npm run dev
```

### Verify Your Setup
```bash
./verify-setup.sh
```

## Next Steps After Setup

### Immediate
- [ ] Test all features
- [ ] Customize chores list
- [ ] Add your kids' names
- [ ] Change avatar images
- [ ] Set conversion rates you want

### Soon
- [ ] Deploy to production
- [ ] Set up on family devices
- [ ] Explore AI insights
- [ ] Export metrics
- [ ] Review analytics

### Eventually
- [ ] Custom domain
- [ ] Advanced customization
- [ ] Additional features
- [ ] Share with family members

## Understanding the AI Features

### Without AI (Basic Mode)
- Manual data entry
- Static chore list
- Basic calculations
- Simple history

### With AI (Enhanced Mode)
- **Data Validator**: Catches errors and anomalies
- **KV Optimizer**: Makes database operations faster
- **Usage Analyzer**: Learns patterns and habits
- **Recommendation Engine**: Suggests optimal times and rewards
- **Hive Memory**: Remembers and learns over time

**The best part?** AI features run in the background automatically. You don't have to do anything!

## Key Commands Reference

```bash
# Development
npm run dev              # Start local server
npm install              # Install dependencies
./verify-setup.sh        # Check your setup

# Cloudflare
wrangler login           # Login to Cloudflare
wrangler kv:namespace    # Manage KV namespaces
npm run deploy           # Deploy to production

# Claude Flow
./.claude/init.sh                           # Initialize Flow
npm run flow:session                        # Start tracked session
./.claude/hooks/session-end.sh --export     # Export metrics
npm run flow:metrics                        # View metrics
```

## Configuration Quick Reference

### Basic Settings (worker.js)
```javascript
CHILDREN = ['adam', 'sami']           // Who's using it
CHORES = [...]                        // What chores to track
POINT_TO_MINUTES = 1                  // Conversion rate
conversionRates = { GBP: 1, AUD: 0.56 } // Currency conversion
```

### Cloudflare (wrangler.toml)
```toml
name = "kids-home-hub"                // Project name
binding = "CHILD_SPEND"               // KV namespace name
id = "your-actual-kv-id"              // Your KV ID
```

### Claude Flow (.claude/flows/config.json)
```json
{
  "hive_memory": { "enabled": true },
  "agent_swarms": { "enabled": true },
  "flows": { "enabled": true }
}
```

## Getting Help

### Quick Answers
- **Setup issues**: Check `verify-setup.sh` output
- **Usage questions**: See `QUICKSTART.md`
- **Configuration**: See `README.md`
- **AI features**: See `CLAUDE_FLOW_GUIDE.md`

### Detailed Guides
1. `README.md` - Comprehensive documentation
2. `CLAUDE_FLOW_GUIDE.md` - AI features in depth
3. `.claude/flows/README.md` - Configuration details
4. `PROJECT_SUMMARY.md` - Architecture overview

### External Resources
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Cloudflare KV: https://developers.cloudflare.com/kv/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

## Tips for Success

### 1. Start Simple
- Get basic features working first
- Add AI features later
- Customize gradually

### 2. Test Thoroughly
- Try all transaction types
- Complete some chores
- Redeem points
- Check history

### 3. Monitor Performance
- Use `verify-setup.sh`
- Check browser console
- Review error logs
- Export metrics regularly

### 4. Backup Your Data
```bash
# Export KV data
wrangler kv:key list --namespace-id=YOUR_ID

# Export metrics
./.claude/hooks/session-end.sh --export-metrics
```

### 5. Keep Learning
- Read documentation
- Explore configuration files
- Experiment with settings
- Check exported insights

## What Makes This Special

### It's a Learning System
Unlike static apps, this system learns from your family's behavior:
- Optimal chore times
- Preferred rewards
- Money management patterns
- Engagement trends

### It's Privacy-First
- All data in YOUR Cloudflare account
- No third-party tracking
- No external services
- Full data export capability

### It's Edge-Powered
- Runs on Cloudflare's global network
- <50ms response times worldwide
- 100% uptime SLA
- Automatic scaling

### It's AI-Enhanced
- 9 specialized agents
- 3 coordinated swarms
- 2 automated workflows
- Persistent learning

## Success Checklist

Before considering yourself "set up":

- [ ] App runs locally (`npm run dev`)
- [ ] Can add money to accounts
- [ ] Can complete chores
- [ ] Can redeem points
- [ ] Can view history
- [ ] PWA installs on device
- [ ] Customized chores list
- [ ] KV namespace configured
- [ ] Documentation reviewed
- [ ] Backups configured (optional)

## You're Ready!

If you've checked most of the boxes above, you're ready to go. Remember:

1. **Start simple** - Get it working first
2. **Test everything** - Try all features
3. **Customize gradually** - Make it yours
4. **Read as needed** - Documentation is comprehensive
5. **Have fun** - It's for your family!

## Quick Links

- **5-minute setup**: `QUICKSTART.md`
- **Full guide**: `README.md`
- **AI features**: `CLAUDE_FLOW_GUIDE.md`
- **Overview**: `PROJECT_SUMMARY.md`
- **Verification**: `./verify-setup.sh`

---

**Welcome to Kids Home Hub!**

Made with Claude Code for Adam & Sami 🚀
