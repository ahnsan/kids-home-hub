# Kids Home Hub - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- Cloudflare account (free tier works!)
- 5 minutes of your time

## Step 1: Install Dependencies

```bash
cd kids-home-hub
npm install
```

## Step 2: Set Up Cloudflare KV

```bash
# Install Wrangler CLI globally (if not installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace
wrangler kv:namespace create "CHILD_SPEND"
```

Copy the ID from the output and paste it in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "CHILD_SPEND"
id = "YOUR_ID_HERE"  # ← Paste your ID here
```

## Step 3: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:8787` - You should see the Kids Home Hub!

## Step 4: Try It Out

1. Click on **Bank** tab
2. Click "Adjust balance" under Adam or Sami
3. Add £10 as "Allowance"
4. See the balance update!

5. Click on **Chores** tab
6. Check some chores
7. Click "Save chores & add points"
8. Go to **Points** tab to see earned points!

## Step 5: Deploy to Production (Optional)

```bash
# Create production KV namespace
wrangler kv:namespace create "CHILD_SPEND" --env production

# Update production ID in wrangler.toml
# Then deploy:
npm run deploy
```

Your app will be live at `https://kids-home-hub.YOUR_SUBDOMAIN.workers.dev`

## Claude Flow Setup (Optional but Recommended)

Enable AI-powered features:

```bash
# Initialize Claude Flow
npm run flow:init

# Make hooks executable
chmod +x .claude/hooks/*.sh

# Start a tracked session
npm run flow:session
```

Now your development sessions will be tracked, and AI agents will optimize your app automatically!

## Next Steps

- Customize chores in `worker.js`
- Add more children if needed
- Configure agent swarms in `.claude/swarms/`
- Set up Hive Memory for learning in `.claude/memory/`
- Read the full README for advanced features

## Common Issues

### "Module not found" error
```bash
npm install
```

### "KV namespace not found"
Check that you updated `wrangler.toml` with your actual KV ID

### Hooks not running
```bash
chmod +x .claude/hooks/*.sh
```

### Port 8787 already in use
```bash
# Kill existing process
pkill -f "wrangler dev"

# Or use a different port
wrangler dev --port 8788
```

## Support

- Full documentation: See README.md
- Cloudflare docs: https://developers.cloudflare.com/workers/
- Claude Flow: See `.claude/flows/README.md`

## What's Next?

Once you're running:
1. Customize the chores list for your kids
2. Set up the PWA on your phone (Add to Home Screen)
3. Try the points redemption feature
4. Check out the analytics (coming soon!)

Enjoy using Kids Home Hub!
