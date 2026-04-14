# Stripe Checkout Session Creator

Appwrite Function that creates a Stripe Checkout Session for UDHAAR due settlement.

## Environment Variables Required

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe secret key (test or live) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `APPWRITE_ENDPOINT` | Appwrite API endpoint |
| `APPWRITE_PROJECT_ID` | Appwrite project ID |
| `APPWRITE_API_KEY` | Appwrite server API key (with DB read/write) |
| `APPWRITE_DATABASE_ID` | Database ID |
| `LEDGERDUE_COLLECTION_ID` | ledgerDue collection ID |
| `LEDGERSETTLEMENT_COLLECTION_ID` | ledgerSettlement collection ID |
| `FRONTEND_URL` | Frontend URL for success/cancel redirects |

## Deployment

1. Create the function in Appwrite Console
2. Set the above env variables
3. Deploy from this directory

## Endpoints

- **POST /createCheckoutSession** — Creates a Stripe Checkout Session
  - Body: `{ customerId, ledgerDueId, amount }`
  - Returns: `{ url }` (Stripe Checkout URL)

- **POST /stripeWebhook** — Handles Stripe webhooks
  - Verifies Stripe signature
  - On `checkout.session.completed`: applies FIFO settlement to ledger dues
