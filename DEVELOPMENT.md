# Agent World Development Scripts

This repository includes several scripts to help with development workflow:

## 🚀 Full Application Startup
```bash
./start-app.sh
```
- **What it does**: Full build and start (rebuilds Docker images)
- **When to use**: First time setup, after major changes, or when dependencies change
- **Time**: ~2-3 minutes (includes Docker builds + Ollama model download)

## ⚡ Quick Restart Options

### Option 1: Restart Script (Recommended for development)
```bash
./restart-app.sh
```
- **What it does**: Quickly restarts existing containers without rebuilding
- **When to use**: After code changes in development 
- **Time**: ~10-15 seconds
- **Requirements**: Containers must exist (run `./start-app.sh` first)

### Option 2: Start Script with Flags
```bash
./start-app.sh --restart    # Quick restart existing containers
./start-app.sh --no-build   # Start without rebuilding (same as --restart)
./start-app.sh --rebuild    # Force rebuild (same as default)
```

## 🛑 Stop Application
```bash
./stop-app.sh
```
- Stops and removes all containers
- Includes optional cleanup of unused images/networks

## 📋 Development Workflow

1. **First time setup**:
   ```bash
   ./start-app.sh
   ```

2. **Daily development** (after code changes):
   ```bash
   ./restart-app.sh
   ```

3. **When you add new dependencies**:
   ```bash
   ./start-app.sh --rebuild
   ```

4. **End of session**:
   ```bash
   ./stop-app.sh
   ```

## 🔧 Troubleshooting

- **"Disconnected" status in UI**: Ports may not be public in Codespaces. The scripts automatically handle this, but you can manually run:
  ```bash
  gh codespace ports visibility 3000:public 8000:public 11434:public --codespace $CODESPACE_NAME
  ```

- **Containers don't exist error**: Run `./start-app.sh` first to create the containers

- **Port conflicts**: Run `./stop-app.sh` to clean up existing containers

## 📊 Performance Comparison

| Method | Time | When to Use |
|--------|------|-------------|
| `./start-app.sh` | 2-3 min | First setup, dependency changes |
| `./restart-app.sh` | 10-15 sec | Daily development |
| `./start-app.sh --restart` | 10-15 sec | Alternative quick restart |

The restart scripts are **10-15x faster** than full rebuilds, making development much more efficient!