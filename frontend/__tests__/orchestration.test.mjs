import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';

describe('Auto-Port & Network Orchestration', () => {
  it('detects available local ports reliably', async () => {
    function checkPort(port) {
      return new Promise((resolve) => {
        const s = net.createServer();
        s.once('error', () => resolve(false));
        s.once('listening', () => {
          s.close(() => resolve(true));
        });
        s.listen({ port, host: '127.0.0.1', exclusive: true });
      });
    }

    // High random unassigned port should be available
    const available = await checkPort(48291);
    assert.equal(available, true);
  });

  it('scans and returns the first open port starting from a base', async () => {
    async function findPort(startPort) {
      for (let p = startPort; p < startPort + 50; p++) {
        const isFree = await new Promise((resolve) => {
          const s = net.createServer();
          s.once('error', () => resolve(false));
          s.once('listening', () => s.close(() => resolve(true)));
          s.listen({ port: p, host: '127.0.0.1', exclusive: true });
        });
        if (isFree) return p;
      }
      return startPort;
    }

    const freePort = await findPort(49152);
    assert.ok(freePort >= 49152 && freePort < 49202);
  });

  it('validates client API URL resolution semantics', () => {
    // 1. Browser context simulation
    function resolveBaseUrl(configuredPublicUrl, isBrowser, backendUrl = 'http://127.0.0.1:8008') {
      const trimmed = configuredPublicUrl?.trim();
      if (trimmed && trimmed.length > 0) return trimmed;
      if (isBrowser) return '/api/v1';
      return `${backendUrl}/api/v1`;
    }

    // Default browser behavior -> relative path (origin-agnostic)
    assert.equal(resolveBaseUrl(undefined, true), '/api/v1');
    assert.equal(resolveBaseUrl('', true), '/api/v1');

    // SSR behavior -> absolute loopback URL
    assert.equal(resolveBaseUrl(undefined, false), 'http://127.0.0.1:8008/api/v1');

    // Custom environment override
    assert.equal(resolveBaseUrl('https://api.example.com/api/v1', true), 'https://api.example.com/api/v1');
    assert.equal(resolveBaseUrl('https://api.example.com/api/v1', false), 'https://api.example.com/api/v1');
  });
});
