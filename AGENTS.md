# MoMo Merchant Intelligence (MoMoMI)

## Project purpose

MoMoMI is a fintech competition prototype exploring how digital money movements can be classified into verified business activity, business records, analytics, and decision support for merchants.

## Technology stack

- React with TypeScript
- Vite for local development and production builds
- CSS for presentation
- Prototype data and state will live in the frontend until a backend is intentionally introduced

Keep dependencies limited to what the current frontend requires. Do not add Python, FastAPI, Supabase, PostgreSQL, external AI SDKs, or other backend services as part of frontend work.

## Prototype limitations

- This is a frontend competition prototype using synthetic/demo data.
- There is no live MTN MoMo API connection, backend, production database, external AI API, or real merchant account connection.
- Do not imply that the app is connected to MTN systems or that demo information is real or verified externally.
- Do not request, store, or use real financial credentials, API keys, or secrets.
- Any future demo records, analytics, or AI-like outputs must be clearly identified as synthetic/demo content and must not be presented as financial advice or confirmed business facts.

## Coding conventions

- Use TypeScript for application code and keep types explicit at data boundaries.
- Prefer small, focused React components and clear names.
- Keep shared UI in `src/components`, product areas in `src/features`, demo data in `src/data`, and shared types in `src/types` as those areas are added.
- Keep application entry and root composition in `src`/`src/app`.
- Use semantic HTML, accessible labels, and responsive CSS.
- Avoid adding libraries when the platform or existing stack can do the job.
- Do not commit generated output, secrets, or real personal/financial data.

## Fintech and data-integrity rules

- Preserve source transaction values and identifiers; never silently alter, round, or discard source data.
- Separate raw input from derived classifications and clearly disclose assumptions.
- Represent uncertainty explicitly. A classification or inference is not a verified fact unless there is a defined verification step.
- Keep currency and timestamp handling explicit; do not infer a currency, timezone, or transaction meaning without evidence.
- Label synthetic records and derived results as demo data wherever shown.
- Do not fabricate API connectivity, verification status, merchant consent, balances, transaction history, or AI capabilities.
