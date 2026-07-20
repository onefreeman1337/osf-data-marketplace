# OSF Data Marketplace

**Provenance stamped US government and scientific data for AI agents. 4.8 million records across 78 official sources, sold per call with x402 USDC micropayments on Base.**

OSF (Open Source Filings) is a live remote MCP server plus an x402 HTTP API. There is nothing to install and nothing to sign up for: an agent with a funded wallet can discover the catalog, get a price quote, pay in USDC, and receive records with full provenance in a single round trip.

- **MCP endpoint (streamable HTTP):** `https://api.osf-master-server.com/mcp`
- **MCP Registry:** `io.github.onefreeman1337/osf-data-marketplace`
- **x402 manifest:** [`https://api.osf-master-server.com/.well-known/x402`](https://api.osf-master-server.com/.well-known/x402)
- **llms.txt:** [`https://api.osf-master-server.com/llms.txt`](https://api.osf-master-server.com/llms.txt)
- **Website:** [`https://osf-master-server.com`](https://osf-master-server.com)

## Connect

Claude Code:

```bash
claude mcp add --transport http osf https://api.osf-master-server.com/mcp
```

Generic MCP client config:

```json
{
  "mcpServers": {
    "osf": {
      "type": "streamable-http",
      "url": "https://api.osf-master-server.com/mcp"
    }
  }
}
```

## Tools (19)

| Tool | What it does | Price (USDC) |
|---|---|---|
| `get_catalog` | Browse the full record catalog with filters | Free |
| `get_record` | Fetch any single record by id | from $0.01 |
| `lookup_entity` | Company and entity identifier lookup | $0.01 |
| `screen_entity` | Sanctions and debarment screening across eleven authorities (OFAC, UN, EU, UK, FBI, World Bank, HHS OIG, SAM exclusions, Federal Reserve enforcement actions and more), over 291,000 listed parties, full audit receipt | $0.08 |
| `is_cve_exploited` | Check whether a CVE is actively exploited in the wild | $0.08 |
| `check_broker` | Live FINRA BrokerCheck disciplinary lookup of a stockbroker, investment adviser, or brokerage firm: CRD number, registration status, disclosure flags, permanent bar status, employers, and a FINRA provenance URL per match | $0.08 |
| `search_sec_filings` | SEC EDGAR filings and enforcement | $0.05 |
| `search_legal_cases` | 1.55M+ federal court opinions (SCOTUS all time, all 13 circuits) plus SEC litigation and administrative proceedings | $0.05 |
| `search_research_papers` | 1.2M+ scholarly works incl. arXiv, PubMed, Crossref | $0.05 |
| `search_cyber_threats` | CVE corpus, CISA advisories, ATT&CK | $0.05 |
| `search_healthcare` | Provider data, FDA drug and device recalls to 2004 | $0.05 |
| `search_consumer_protection` | Recalls and consumer enforcement | $0.05 |
| `search_gov_spending` | Federal awards and spending | $0.05 |
| `search_regulations_law` | eCFR, Federal Register, Congress.gov legislation, Regulations.gov dockets, GovInfo | $0.05 |
| `search_economic_indicators` | FRED, BLS, Census, World Bank series | $0.05 |
| `search_environmental_data` | EPA, NOAA and related environmental records | $0.05 |
| `search_patents` | Granted US patents (USPTO Open Data Portal): prior art, assignee and inventor lookup, freedom to operate | $0.05 |
| `search_aircraft_registry` | FAA civil aircraft registrations: tail number (N number), registered owner, asset tracing | $0.05 |
| `search_ai_models` | Hugging Face model metadata: task, library, declared license, download counts, model selection | $0.05 |

## How payment works

Paid calls follow the [x402 protocol](https://www.x402.org/): the server answers with a `402 Payment Required` quote naming an exact USDC amount on Base mainnet. The agent signs the payment, retries with the payment header, and settlement happens on chain through the Coinbase CDP facilitator. No accounts, no API keys, no subscriptions.

Every record carries a provenance stamp: the originating authority, source URL, and retrieval timestamp, so downstream consumers can verify where the data came from.

## Data

78 official sources including SEC EDGAR, CourtListener, arXiv, PubMed, openFDA, CISA, the CVE Program, OFAC, SAM.gov, USAspending, Federal Register, FRED, NOAA and EPA. The warehouse refreshes continuously via a collector fleet with daily missions per source.

## License

The code and documentation in this repository are MIT licensed. Records served by the API are US public records; each response includes source attribution and any upstream license terms in its provenance block.
