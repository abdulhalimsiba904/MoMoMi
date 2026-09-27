```markdown
# MoMo Merchant Intelligence (MoMoMI)

MoMoMI is a fintech competition prototype exploring how digital money movements can become clearer business records and actionable business intelligence.

The prototype connects digital money movements with verified business activities such as product sales and expenses, then uses that information to provide inventory tracking, analytics, business insights, alerts, and a Business Copilot.

The current prototype uses synthetic local data only.

## Core Workflow

**Money Movement → Business Activity → Verification → Business Data → Intelligence**

For product sales:

**Payment → Sale → Inventory → Intelligence**

## Current Prototype

MoMoMI currently includes:

- Dashboard and financial summaries
- Money In and Money Out classification
- Product-sale confirmation
- Inventory tracking
- Business analytics
- Business Pulse insights
- Alerts and review items
- Business Copilot
- Evidence-linked business records
- Responsive web interface

## Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Run the production build check:

```bash
npm run build
```

## Prototype Limitations

This is a competition prototype.

There is currently:

- No backend
- No production database
- No external AI API
- No live MTN MoMo connection
- No live merchant transaction data
- No persistent production data storage

The current Business Copilot and intelligence features use deterministic prototype logic rather than a live LLM.

## Project Documentation

See [AGENTS.md](AGENTS.md) for prototype constraints, coding conventions, architecture guidance, and fintech data-integrity rules.

The competition presentation script is available at:

[docs/COMPETITION_PRESENTATION_SCRIPT.md](docs/COMPETITION_PRESENTATION_SCRIPT.md)

## Technology

- React
- TypeScript
- Vite
- CSS
- Local React state

The intended future architecture can introduce a Python/FastAPI backend, PostgreSQL/Supabase, business-domain engines, and an AI/LLM layer.

## Demo Data

All financial and merchant records in this repository are synthetic demonstration data and do not represent real MTN MoMo customer or merchant information.
```
