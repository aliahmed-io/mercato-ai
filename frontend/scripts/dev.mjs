#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDevScript = path.resolve(__dirname, '..', '..', 'scripts', 'dev.mjs');

// Delegate execution to the unified root orchestrator
import(rootDevScript);
