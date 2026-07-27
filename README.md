# OSF Data Marketplace

**Provenance stamped US government and scientific data for AI agents. Over 7.3 million records across 80 official sources, sold per call with x402 USDC micropayments on Base.**

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

## Screen a counterparty in one call

```bash
curl "https://api.osf-master-server.com/x402/screen/sanctions/Gazprombank?format=json"
```

$0.05. Eleven authorities, 291,000+ listed parties, a provenance URL per match and a sha256 audit receipt. Branch on three outcomes, never two:

| `result` | Meaning |
|---|---|
| `POTENTIAL_MATCH` | One or more listed parties matched. Read `matches[]` for the list, the match basis, the sanctions program and the official source URL. |
| `NO_MATCH` | A **complete** screen found nothing. This is the only clearance, and it is returned only when `screen_complete` is true. |
| `INCOMPLETE_SCREEN` | At least one list could not be fully examined, named in `incomplete_lists`, and `screen_complete` is false. **Not a clearance.** |

Open Source Filings will not certify a negative it cannot prove. `NO_MATCH` is returned only when the complete candidate set on all 11 authority lists was examined. Every response carries per list `candidate_set_complete` flags, `candidates_examined`, `records_in_scope`, and a sha256 receipt you can retain as evidence of what was checked and when.

## Tools (20)

**14 of the 20 tools are free.** `get_catalog` and all 13 `search_*` tools take no payment at all: they return record_ids, live per record prices and provenance URLs, so an agent can confirm the data it needs exists before spending anything. Only the 6 tools marked with a price charge.

| Tool | What it does | Price (USDC) |
|---|---|---|
| `get_catalog` | Browse the full record catalog with filters | Free |
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

## License

The code and documentation in this repository are MIT licensed. Records served by the API are US public records; each response includes source attribution and any upstream license terms in its provenance block.
