#!/usr/bin/env node
/**
 * osf-data-marketplace
 *
 * A stdio MCP server that bridges to OSF's live remote MCP server.
 * Zero dependencies. Zero config. No wallet and no signup needed for the free tools.
 *
 * Any MCP client that can run a command can now talk to OSF:
 *     npx -y osf-data-marketplace
 *
 * stdin  : newline delimited JSON RPC from the MCP client (MCP stdio transport)
 * stdout : newline delimited JSON RPC back to the client  <- PROTOCOL CHANNEL, never log here
 * stderr : human readable diagnostics only
 */

'use strict';

const DEFAULT_URL = 'https://api.osf-master-server.com/mcp';
const PROTOCOL_VERSION = '2025-06-18';

// ---------------------------------------------------------------- args / env

const argv = process.argv.slice(2);
function flagValue(name) {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

let PKG_VERSION = '0.0.0';
try {
  PKG_VERSION = require('../package.json').version;
} catch (_) {
  /* running outside a package tree */
}

if (argv.includes('--version') || argv.includes('-v')) {
  process.stdout.write(PKG_VERSION + '\n');
  process.exit(0);
}

if (argv.includes('--help') || argv.includes('-h')) {
  process.stderr.write(
    [
      'osf-data-marketplace ' + PKG_VERSION,
      '',
      'A stdio MCP server bridging to the OSF data marketplace.',
      '15 free tools, no wallet and no signup. 6 paid tools over x402 USDC on Base.',
      '',
      'Usage:',
      '  npx -y osf-data-marketplace              start the bridge on stdio',
      '',
      'Options:',
      '  --url <url>     remote MCP endpoint      (env OSF_MCP_URL)',
      '  --no-hints      do not append the free alternative note to paid tool replies',
      '                                           (env OSF_MCP_HINTS=0)',
      '  --timeout <ms>  per request timeout, default 120000  (env OSF_MCP_TIMEOUT_MS)',
      '  --verbose       log every forwarded method to stderr  (env OSF_MCP_VERBOSE=1)',
      '  --version, --help',
      '',
      'Docs: https://api.osf-master-server.com/llms.txt',
      '',
    ].join('\n')
  );
  process.exit(0);
}

const REMOTE_URL = flagValue('--url') || process.env.OSF_MCP_URL || DEFAULT_URL;
const HINTS =
  !argv.includes('--no-hints') && process.env.OSF_MCP_HINTS !== '0';
const TIMEOUT_MS =
  Number(flagValue('--timeout') || process.env.OSF_MCP_TIMEOUT_MS || 120000);
const VERBOSE = argv.includes('--verbose') || process.env.OSF_MCP_VERBOSE === '1';

if (typeof fetch !== 'function') {
  process.stderr.write(
    'osf-data-marketplace needs Node 18 or newer (global fetch). ' +
      'This is Node ' + process.version + '.\n'
  );
  process.exit(1);
}

const UA =
  'osf-data-marketplace/' + PKG_VERSION + ' (npx-bridge; node/' + process.versions.node + ')';

function log(...parts) {
  process.stderr.write('[osf] ' + parts.join(' ') + '\n');
}

// ---------------------------------------------------------------- transport

let sessionId = null;

function baseHeaders() {
  const h = {
    'content-type': 'application/json',
    accept: 'application/json, text/event-stream',
    'user-agent': UA,
    'x-osf-client': 'npm-bridge',
    'x-osf-client-version': PKG_VERSION,
  };
  if (sessionId) h['mcp-session-id'] = sessionId;
  if (sessionId) h['mcp-protocol-version'] = PROTOCOL_VERSION;
  return h;
}

/** Parse a response body that may be plain JSON or a text/event-stream frame. */
function parseBody(text, contentType) {
  if (!text) return null;
  if ((contentType || '').includes('text/event-stream')) {
    const payloads = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('data:')) payloads.push(line.slice(5).trim());
    }
    const joined = payloads.join('');
    return joined ? JSON.parse(joined) : null;
  }
  return JSON.parse(text);
}

async function post(message) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(REMOTE_URL, {
      method: 'POST',
      headers: baseHeaders(),
      body: JSON.stringify(message),
      signal: ctrl.signal,
    });
    const sid = res.headers.get('mcp-session-id');
    if (sid && sid !== sessionId) {
      sessionId = sid;
      if (VERBOSE) log('session', sessionId);
    }
    const text = await res.text();
    return { status: res.status, contentType: res.headers.get('content-type'), text };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------- hinting

/**
 * OSF's paid MCP tools answer with an x402 payment-required envelope rather than an
 * error. A client with no wallet reads that as a wall. Append ONE extra content block
 * telling it what it can do right now for free. content[0] is never touched, so an
 * x402 capable client sees a byte identical payment envelope where it expects one.
 */
const FREE_TOOL_NAMES = new Set();          // learned from the live tools/list
const PAID_TO_FREE = { screen_entity: 'screen_entity_free' };

function recordCatalog(parsed) {
  const tools = parsed && parsed.result && parsed.result.tools;
  if (!Array.isArray(tools)) return;
  FREE_TOOL_NAMES.clear();
  for (const t of tools) {
    if (!String(t.description || '').includes('(PAID')) FREE_TOOL_NAMES.add(t.name);
  }
  if (VERBOSE) log('catalog', tools.length, 'tools,', FREE_TOOL_NAMES.size, 'free');
}

function looksLikePaymentRequired(item) {
  if (!item || item.type !== 'text' || typeof item.text !== 'string') return false;
  return item.text.includes('"x402Version"') && item.text.includes('Payment required');
}

function hintFor(toolName) {
  const lines = [];
  lines.push(
    'OSF NOTE (added by the osf-data-marketplace bridge, not by the server). ' +
      'This tool is paid: it answers with an x402 payment envelope, so an x402 capable ' +
      'client will settle it in USDC on Base automatically and any other client will ' +
      'see the envelope above. Ways to get REAL data right now with no wallet:'
  );
  const twin = PAID_TO_FREE[toolName];
  if (twin && FREE_TOOL_NAMES.has(twin)) {
    lines.push('  1. Call the free tool `' + twin + '` on this same server. Same corpus, no payment.');
  }
  lines.push(
    '  ' + (twin && FREE_TOOL_NAMES.has(twin) ? '2' : '1') +
      '. Add ?trial=1 to any priced OSF HTTP URL for one free real call per endpoint ' +
      'per hour, no signup and no key. Example: ' +
      'curl "https://api.osf-master-server.com/x402/research/papers/CRISPR?trial=1"'
  );
  if (FREE_TOOL_NAMES.size) {
    lines.push(
      '  Free tools on this server: ' + [...FREE_TOOL_NAMES].sort().join(', ') + '.'
    );
  }
  lines.push('  Pricing and full docs: https://api.osf-master-server.com/llms.txt');
  return { type: 'text', text: lines.join('\n') };
}

function maybeHint(parsed, original) {
  if (!HINTS) return parsed;
  try {
    if (!original || original.method !== 'tools/call') return parsed;
    const content = parsed && parsed.result && parsed.result.content;
    if (!Array.isArray(content) || !content.length) return parsed;
    if (!content.some(looksLikePaymentRequired)) return parsed;
    const toolName = original.params && original.params.name;
    content.push(hintFor(toolName));
  } catch (_) {
    /* hinting must never break the protocol */
  }
  return parsed;
}

// ---------------------------------------------------------------- forwarding

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}

function rpcError(id, code, message, data) {
  return { jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } };
}

async function forward(message) {
  const isNotification = message.id === undefined || message.id === null;
  let attempt = 0;
  let lastErr = null;

  while (attempt < 2) {
    attempt += 1;
    try {
      const { status, contentType, text } = await post(message);

      if (status === 202 || !text) {
        if (!isNotification) {
          send(rpcError(message.id, -32603, 'OSF remote returned an empty body', { status }));
        }
        return;
      }
      if (status >= 400) {
        if (VERBOSE) log('HTTP', status, 'for', message.method);
        if (!isNotification) {
          send(
            rpcError(message.id, -32603, 'OSF remote returned HTTP ' + status, {
              url: REMOTE_URL,
              body: text.slice(0, 500),
            })
          );
        }
        return;
      }

      const parsed = parseBody(text, contentType);
      if (parsed === null) {
        if (!isNotification) send(rpcError(message.id, -32603, 'OSF remote returned no JSON RPC payload'));
        return;
      }
      if (message.method === 'tools/list') recordCatalog(parsed);
      if (!isNotification) send(maybeHint(parsed, message));
      return;
    } catch (err) {
      lastErr = err;
      const retryable = err && (err.name === 'AbortError' || err.name === 'TypeError' || err.code);
      if (attempt >= 2 || !retryable) break;
      if (VERBOSE) log('retrying', message.method, 'after', String(err && err.message));
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  log('request failed:', String((lastErr && lastErr.message) || lastErr));
  if (!isNotification) {
    send(
      rpcError(message.id, -32603, 'Could not reach the OSF MCP server', {
        url: REMOTE_URL,
        reason: String((lastErr && lastErr.message) || lastErr),
      })
    );
  }
}

// Serialize everything until a session exists (the initialize round trip), then
// let requests run concurrently so one slow paid call cannot block a tools/list.
let gate = Promise.resolve();

// In-flight accounting exists so a CLOSED stdin cannot kill requests that have not
// answered yet. An interactive client (Claude Desktop, Cursor) holds stdin open for
// the whole session, but a piped or heredoc-driven client - which is how CI, smoke
// tests and `echo ... | npx osf-data-marketplace` drive it - reaches end-of-stdin
// immediately, long before the first fetch returns. Exiting there produced a silent
// zero-byte reply with exit code 0.
let inFlight = 0;
let stdinEnded = false;

function finishExit() {
  // process.exit() can truncate a piped stdout that still has queued writes.
  if (process.stdout.writableLength === 0) process.exit(0);
  else process.stdout.once('drain', () => process.exit(0));
}

function maybeExit() {
  if (stdinEnded && inFlight === 0) finishExit();
}

function dispatch(message) {
  inFlight += 1;
  const done = () => {
    inFlight -= 1;
    maybeExit();
  };
  if (!sessionId || message.method === 'initialize') {
    gate = gate.then(() => forward(message)).catch(() => {}).finally(done);
    return;
  }
  forward(message).catch(() => {}).finally(done);
}

// ---------------------------------------------------------------- stdio loop

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  let nl;
  while ((nl = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch (err) {
      log('ignoring unparseable line from client:', line.slice(0, 200));
      continue;
    }
    if (VERBOSE) log('->', message.method || ('response id ' + message.id));
    dispatch(message);
  }
});

process.stdin.on('end', () => {
  stdinEnded = true;
  if (inFlight === 0) {
    finishExit();
    return;
  }
  // Backstop: every request is already bounded by TIMEOUT_MS, so this can only fire
  // if something is wedged. unref() so it never keeps an idle process alive.
  setTimeout(() => process.exit(0), TIMEOUT_MS + 5000).unref();
});
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));

if (VERBOSE) log('bridging to', REMOTE_URL, 'as', UA);
