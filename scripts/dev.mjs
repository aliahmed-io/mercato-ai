#!/usr/bin/env node
import net from 'node:net';
import http from 'node:http';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dns from 'node:dns';

// Ensure IPv4 first on Node 17+ to prevent Windows localhost ::1 socket issues
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

// 1. Helper to test port availability on 127.0.0.1 and 0.0.0.0
function isPortAvailable(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen({ port, host, exclusive: true });
  });
}

// 2. Scan for available port in range
async function findAvailablePort(preferredPort = 3000, maxAttempts = 30) {
  for (let offset = 0; offset < maxAttempts; offset++) {
    const candidate = preferredPort + offset;
    const isAvail127 = await isPortAvailable(candidate, '127.0.0.1');
    const isAvail000 = await isPortAvailable(candidate, '0.0.0.0');
    if (isAvail127 && isAvail000) {
      return candidate;
    }
  }
  return preferredPort;
}

// 3. Helper to ping backend health
function checkBackendHealth(url = 'http://127.0.0.1:8008/health') {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 1500 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// 4. Find Python executable in project venv or system
function getPythonExecutable() {
  const venvWin = path.join(ROOT_DIR, '.venv', 'Scripts', 'python.exe');
  const venvUnix = path.join(ROOT_DIR, '.venv', 'bin', 'python');
  if (fs.existsSync(venvWin)) return venvWin;
  if (fs.existsSync(venvUnix)) return venvUnix;
  return process.platform === 'win32' ? 'python' : 'python3';
}

let backendProc = null;
let frontendProc = null;

function cleanup() {
  if (backendProc && !backendProc.killed) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${backendProc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        backendProc.kill('SIGTERM');
      }
    } catch {}
  }
  if (frontendProc && !frontendProc.killed) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /pid ${frontendProc.pid} /T /F`, { stdio: 'ignore' });
      } else {
        frontendProc.kill('SIGTERM');
      }
    } catch {}
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', () => { cleanup(); });

async function main() {
  console.log('[Mercato Orchestrator] Initializing unified developer environment...');

  // 1. Check if backend is alive
  const backendAlive = await checkBackendHealth();
  if (backendAlive) {
    console.log('[Mercato Orchestrator] Backend already active on http://127.0.0.1:8008 (Healthy).');
  } else {
    const pythonExec = getPythonExecutable();
    console.log(`[Mercato Orchestrator] Spawning backend daemon with ${pythonExec}...`);
    backendProc = spawn(pythonExec, ['backend/run.py'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });

    // Wait for backend to be ready
    let isReady = false;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await checkBackendHealth()) {
        isReady = true;
        break;
      }
    }
    if (isReady) {
      console.log('[Mercato Orchestrator] Backend initialized and operational on http://127.0.0.1:8008.');
    } else {
      console.warn('[Mercato Orchestrator] Warning: Backend took longer than expected to respond on /health.');
    }
  }

  // 2. Parse arguments for preferred port
  let preferredPort = 3000;
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '-p' || args[i] === '--port') && args[i + 1]) {
      preferredPort = parseInt(args[i + 1], 10) || 3000;
    }
  }
  if (process.env.PORT) {
    preferredPort = parseInt(process.env.PORT, 10) || preferredPort;
  }

  // 3. Automatically resolve free port
  const activePort = await findAvailablePort(preferredPort);

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║               MERCATO AI UNIFIED DEV STACK                       ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log(`║  ● Backend:   http://127.0.0.1:8008 (FastAPI Operational)        ║`);
  console.log(`║  ● Frontend:  http://localhost:${activePort}                              ║`);
  console.log(`║  ● API Proxy: Same-Origin /api/v1 -> Backend 8008                 ║`);
  console.log(`║  ● Auto-Port: ${String(activePort === preferredPort ? `Bound to default port ${preferredPort}` : `Port ${preferredPort} in use; auto-shifted to ${activePort}`).padEnd(49)}║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');

  // 4. Launch Next.js dev server with relative ipv4-patch
  const existingNodeOptions = (process.env.NODE_OPTIONS || '').replace(/-r\s+["']?[^"'\s]+["']?/g, '').trim();
  const nodeOptionsWithPatch = `-r ./ipv4-patch.cjs ${existingNodeOptions}`.trim();

  const frontendEnv = {
    ...process.env,
    PORT: String(activePort),
    BACKEND_URL: process.env.BACKEND_URL || 'http://127.0.0.1:8008',
    NODE_OPTIONS: nodeOptionsWithPatch,
  };

  // Launch Next.js with the resolved port
  const nextBin = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  frontendProc = spawn(nextBin, ['next', 'dev', '-p', String(activePort)], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit',
    shell: true,
    env: frontendEnv,
  });

  frontendProc.on('exit', (code) => {
    cleanup();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[Mercato Orchestrator] Fatal error:', err);
  cleanup();
  process.exit(1);
});
