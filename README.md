# OSF Data Marketplace

**Provenance stamped US government and scientific data for AI agents. Over 7.6 million records across 80 official sources, sold per call with x402 USDC micropayments on Base.**

**Install in one paste:** `https://api.osf-master-server.com/mcp` — remote MCP, no key, no account, and 15 of the 21 tools are free, including a sanctions and debarment screen. [Jump to your client](#install).

OSF (Open Source Filings) is a live remote MCP server plus an x402 HTTP API. There is nothing to install and nothing to sign up for: an agent with a funded wallet can discover the catalog, get a price quote, pay in USDC, and receive records with full provenance in a single round trip.

- **MCP endpoint (streamable HTTP):** `https://api.osf-master-server.com/mcp`
- **MCP Registry:** `io.github.onefreeman1337/osf-data-marketplace`
- **x402 manifest:** [`https://api.osf-master-server.com/.well-known/x402`](https://api.osf-master-server.com/.well-known/x402)
- **llms.txt:** [`https://api.osf-master-server.com/llms.txt`](https://api.osf-master-server.com/llms.txt)
- **Website:** [`https://osf-master-server.com`](https://osf-master-server.com)

## Install

OSF is a **remote** MCP server over streamable HTTP. Nothing to download, nothing to run, no API key, no account.

```
https://api.osf-master-server.com/mcp
```

**15 of the 21 tools are free**, including `screen_entity_free`, a real sanctions and debarment screen 5 times a day with no signup and no key. Install it, ask it real questions, and decide whether it is worth funding a wallet. Every block below is the complete config for that client. Pick yours, paste it, done.

### One command, any client

There is also a stdio bridge for clients that take a command instead of a URL. Zero
dependencies, 19 kB, no config and no wallet:

```bash
npx -y github:onefreeman1337/osf-data-marketplace
```

Same JSON in every client that uses `mcpServers` — Claude Desktop, Cursor, Cline, Windsurf,
LibreChat:

```json
{
  "mcpServers": {
    "osf": {
      "command": "npx",
      "args": ["-y", "github:onefreeman1337/osf-data-marketplace"]
    }
  }
}
```

Claude Code: `claude mcp add osf -- npx -y github:onefreeman1337/osf-data-marketplace`.
VS Code uses `servers` with `"type": "stdio"` and the same `command` and `args`.

**Use this when the remote URL will not go in.** Claude Desktop's
`claude_desktop_config.json` takes local commands only, so a remote MCP URL pasted into it
silently does nothing — a command line works everywhere a config file does. Source for the
bridge is [`bin/cli.js`](bin/cli.js) in this repo.

### Claude Code

```bash
claude mcp add --transport http osf https://api.osf-master-server.com/mcp
```

Confirm with `claude mcp list`. You should see `osf: https://api.osf-master-server.com/mcp (HTTP) - ✔ Connected`.

### Claude Desktop and claude.ai

Settings → **Connectors** → **Add** → **Add custom connector**, then paste `https://api.osf-master-server.com/mcp`.

Remote servers do **not** go in `claude_desktop_config.json`. That file is only for local stdio servers, so pasting a URL into it will silently do nothing.

### Cursor — `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "osf": {
      "url": "https://api.osf-master-server.com/mcp"
    }
  }
}
```

### VS Code — `.vscode/mcp.json`

```json
{
  "servers": {
    "osf": {
      "type": "http",
      "url": "https://api.osf-master-server.com/mcp"
    }
  }
}
```

### Cline — `cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "osf": {
      "type": "streamableHttp",
      "url": "https://api.osf-master-server.com/mcp",
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Windsurf — `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "osf": {
      "serverUrl": "https://api.osf-master-server.com/mcp"
    }
  }
}
```

### Python, no MCP client needed

```bash
pip install mcp
```

```python
import asyncio
from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

async def main():
    async with streamablehttp_client("https://api.osf-master-server.com/mcp") as (r, w, _):
        async with ClientSession(r, w) as s:
            await s.initialize()
            out = await s.call_tool("search_cyber_threats", {"query": "log4j remote code execution"})
            print(out.content[0].text)

asyncio.run(main())
```

That call is free. Swap `search_cyber_threats` for any of the other 12 `search_*` tools, for `screen_entity_free` when you want a free sanctions and debarment screen, or for `screen_entity` when you want the same screen with no daily cap.

### LangChain and LangGraph

```bash
pip install langchain-mcp-adapters "mcp<2"
```

> The `mcp<2` pin matters. As of `langchain-mcp-adapters` 0.3.1 a plain install resolves `mcp` 2.0.0 and the import fails with `ImportError: cannot import name 'RequestContext' from 'mcp.shared.context'`. Pinning below 2.0 fixes it.

```python
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "osf": {"url": "https://api.osf-master-server.com/mcp", "transport": "streamable_http"}
})

async def main():
    tools = await client.get_tools()      # all 20 OSF tools as LangChain tools
    screen = next(t for t in tools if t.name == "search_cyber_threats")
    print(await screen.ainvoke({"query": "log4j remote code execution"}))

asyncio.run(main())
```

Bind `tools` to any LangChain chat model or hand them straight to a LangGraph agent.

### Anything else

Any MCP client that speaks streamable HTTP works, because there is no auth handshake to get wrong. If your client only supports SSE, point it at the same URL. If it supports neither, the same data is on a plain HTTP x402 API documented at [`/llms.txt`](https://api.osf-master-server.com/llms.txt) and [`/openapi.json`](https://api.osf-master-server.com/openapi.json).

## Screen a counterparty in one call

Free, 5 a day, no signup, no API key, no card. Copy and run this, it returns JSON immediately:

```bash
curl "https://api.osf-master-server.com/x402/free/screen/sanctions/Wagner%20Group"
```

Same corpus, same code path, same verdict as the paid route. When the daily allowance is spent it returns HTTP 429 with `charged: false` and the paid URL; it never charges you.

```bash
curl "https://api.osf-master-server.com/x402/screen/sanctions/Gazprombank?format=json"
```

$0.05, no daily cap. Eleven authorities, 291,000+ listed parties, a provenance URL per match, the complete match list and a retainable sha256 audit receipt. Branch on three outcomes, never two:

| `result` | Meaning |
|---|---|
| `POTENTIAL_MATCH` | One or more listed parties matched. Read `matches[]` for the list, the match basis, the sanctions program and the official source URL. |
| `NO_MATCH` | A **complete** screen found nothing. This is the only clearance, and it is returned only when `screen_complete` is true. |
| `INCOMPLETE_SCREEN` | At least one list could not be fully examined, named in `incomplete_lists`, and `screen_complete` is false. **Not a clearance.** |

Open Source Filings will not certify a negative it cannot prove. `NO_MATCH` is returned only when the complete candidate set on all 11 authority lists was examined. Every response carries per list `candidate_set_complete` flags, `candidates_examined`, `records_in_scope`, and a sha256 receipt you can retain as evidence of what was checked and when.

## Tools (21)

**15 of the 21 tools are free.** `get_catalog`, `screen_entity_free` and all 13 `search_*` tools take no payment at all: they return record_ids, live per record prices and provenance URLs, so an agent can confirm the data it needs exists before spending anything. Only the 6 tools marked with a price charge.

| Tool | What it does | Price (USDC) |
|---|---|---|
| `get_catalog` | Browse the full record catalog with filters | Free |
| `screen_entity_free` | Sanctions **and debarment** screening across the same eleven authorities as `screen_entity`, 291,000+ listed parties, same provable negative. 5 screens per UTC day, no signup and no key | Free |
| `search_sec_filings` | SEC EDGAR filings, 13F, Form 4, XBRL, enforcement | Free |
| `search_legal_cases` | 1.55M+ federal court opinions (SCOTUS all time, all 13 circuits) plus SEC litigation and administrative proceedings | Free |
| `search_research_papers` | 1.2M+ scholarly works incl. arXiv, PubMed, Crossref | Free |
| `search_cyber_threats` | NVD CVE corpus, CISA advisories, KEV, EPSS, CWE, ATT&CK | Free |
| `search_healthcare` | CMS NPI providers, RxNorm, clinical trials, FDA recalls since 2004 | Free |
| `search_consumer_protection` | CFPB complaints, NHTSA, CPSC and FDA recall enforcement | Free |
| `search_gov_spending` | USAspending awards, SAM.gov solicitations, Grants.gov funding | Free |
| `search_regulations_law` | eCFR, Federal Register, Congress.gov legislation, Regulations.gov dockets, GovInfo | Free |
| `search_economic_indicators` | FRED, Treasury, BEA, BLS, Census, World Bank series | Free |
| `search_environmental_data` | USGS, NOAA, EPA, FEMA, GBIF records | Free |
| `search_patents` | Granted US patents (USPTO Open Data Portal): prior art, assignee and inventor lookup, freedom to operate | Free |
| `search_aircraft_registry` | FAA civil aircraft registrations: tail number (N number), registered owner, asset tracing | Free |
| `search_ai_models` | Hugging Face model metadata: task, library, declared license, download counts | Free |
| `sample_record` | Sample any single record in full, the cheapest door into the catalog | $0.001 |
| `screen_entity` | Sanctions and debarment screening across eleven authorities (OFAC SDN and Consolidated, EU, UK OFSI, UN, Trade.gov CSL, FBI Wanted, World Bank, HHS OIG, SAM exclusions, Federal Reserve enforcement), 291,000+ listed parties, provable negative, sha256 audit receipt | $0.05 |
| `lookup_entity` | Company and entity identifier lookup (NPI, LEI, FDIC cert, CIK, EIN) | $0.05 |
| `is_cve_exploited` | Check whether a CVE is actively exploited in the wild (CISA KEV) with EPSS and CVSS | $0.05 |
| `check_broker` | Live FINRA BrokerCheck disciplinary lookup of a stockbroker, investment adviser, or brokerage firm: CRD number, registration status, disclosure flags, permanent bar status, employers, and a FINRA provenance URL per match | $0.05 |
| `get_record` | Fetch any single record by id in full | from $0.02 |

## How payment works

Paid calls follow the [x402 protocol](https://www.x402.org/): the server answers with a `402 Payment Required` quote naming an exact USDC amount on Base mainnet. The agent signs the payment, retries with the payment header, and settlement happens on chain through the Coinbase CDP facilitator. No accounts, no API keys, no subscriptions.

Every record carries a provenance stamp: the originating authority, source URL, and retrieval timestamp, so downstream consumers can verify where the data came from.

## Data

80 official sources including SEC EDGAR, CourtListener, arXiv, PubMed, openFDA, CISA, the CVE Program, OFAC, SAM.gov, USAspending, the Senate Lobbying Disclosure Act database, the IRS Exempt Organizations Business Master File, Federal Register, FRED, NOAA and EPA. The warehouse refreshes continuously via a collector fleet with daily missions per source.

## Coverage OSF does not have

OSF is United States federal and scientific data. It holds nothing about a European company, a VAT number, or an EU invoice, and an agent should not have to spend a call to discover that. Two independent projects cover ground OSF does not:

- **[eucompliance.tools](https://eucompliance.tools)** — EU VAT rules engine and EN 16931 invoice validation, VIES VAT ID and IBAN checks, EU counterparty checks, on chain transaction preflight. Also x402 v2 on Base with a remote MCP server, no account and no API key, so a wallet that pays OSF pays it too.
- **[cz-agents](https://github.com/martinhavel/cz-agents-mcp)** — Czech and EU due diligence: ARES company register, ISIR insolvency, ADIS VAT payer reliability, plus business registries for 16 EU countries. MIT licensed MCP servers.

Neither is affiliated with OSF and neither asked to be listed here. Verified live on 2026-08-02.

## License

The code and documentation in this repository are MIT licensed. Records served by the API are US public records; each response includes source attribution and any upstream license terms in its provenance block.
