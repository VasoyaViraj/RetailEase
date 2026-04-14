/**
 * Appwrite Function: Create Stripe Checkout Session
 *
 * This function creates a Stripe Checkout Session for a customer
 * to settle their UDHAAR dues online.
 *
 * Requires environment variables:
 *   STRIPE_SECRET_KEY, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID,
 *   APPWRITE_API_KEY, APPWRITE_DATABASE_ID, LEDGERDUE_COLLECTION_ID,
 *   LEDGERSETTLEMENT_COLLECTION_ID, FRONTEND_URL
 */

import Stripe from 'stripe';
import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  // --- Config ---
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!STRIPE_SECRET_KEY) {
    return res.json({ ok: false, message: 'Stripe is not configured' }, 500);
  }

  // --- Route: Create Checkout Session ---
  if (req.path === '/createCheckoutSession' && req.method === 'POST') {
    try {
      const { customerId, ledgerDueId, amount } = JSON.parse(req.body);

      if (!customerId || !amount || amount <= 0) {
        return res.json({ ok: false, message: 'Invalid request' }, 400);
      }

      // Initialize Stripe and create checkout session
      const stripe = new Stripe(STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'inr',
            product_data: { name: `UDHAAR Settlement - ${ledgerDueId || 'bulk'}` },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${FRONTEND_URL}/customer/profile?payment=success`,
        cancel_url: `${FRONTEND_URL}/customer/profile?payment=cancelled`,
        metadata: { customerId, ledgerDueId: ledgerDueId || '' },
      });

      return res.json({ ok: true, url: session.url });
    } catch (err) {
      error('Failed to create checkout session: ' + err.message);
      return res.json({ ok: false, message: err.message }, 500);
    }
  }

  // --- Route: Stripe Webhook ---
  if (req.path === '/stripeWebhook' && req.method === 'POST') {
    try {
      // Verify Stripe webhook signature
      const stripe = new Stripe(STRIPE_SECRET_KEY);
      const sig = req.headers['stripe-signature'];
      
      let event;
      if (process.env.STRIPE_WEBHOOK_SECRET) {
         event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } else {
         event = JSON.parse(req.body);
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { customerId, ledgerDueId } = session.metadata;
        const amountPaid = session.amount_total / 100;

        // Initialize Appwrite
        const client = new Client()
          .setEndpoint(process.env.APPWRITE_ENDPOINT)
          .setProject(process.env.APPWRITE_PROJECT_ID)
          .setKey(process.env.APPWRITE_API_KEY);
        const db = new Databases(client);

        // FIFO settlement: get pending dues sorted by createdAt
        const dues = await db.listDocuments(
          process.env.APPWRITE_DATABASE_ID,
          process.env.LEDGERDUE_COLLECTION_ID,
          [
            Query.equal('customerId', customerId),
            Query.notEqual('status', 'settled'),
            Query.orderAsc('createdAt'),
          ]
        );

        let remaining = amountPaid;
        for (const due of dues.documents) {
          if (remaining <= 0) break;
          const apply = Math.min(remaining, due.remainingAmount);

          // Idempotency: check if this session already settled
          const existing = await db.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.LEDGERSETTLEMENT_COLLECTION_ID,
            [Query.equal('stripeSessionId', session.id), Query.equal('ledgerDueId', due.$id)]
          );
          if (existing.documents.length > 0) continue;

          // Create settlement
          await db.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.LEDGERSETTLEMENT_COLLECTION_ID,
            'unique()',
            {
              ledgerDueId: due.$id,
              orderId: due.orderId,
              customerId,
              paymentMode: 'online',
              settlementAmount: apply,
              stripeSessionId: session.id,
              createdBy: 'stripe-webhook',
              createdAt: new Date().toISOString(),
            }
          );

          // Update due
          const newPaid = due.paidAmount + apply;
          const newRemaining = due.dueAmount - newPaid;
          await db.updateDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.LEDGERDUE_COLLECTION_ID,
            due.$id,
            {
              paidAmount: newPaid,
              remainingAmount: Math.max(0, newRemaining),
              status: newRemaining <= 0 ? 'settled' : 'partiallySettled',
            }
          );

          remaining -= apply;
        }
      }

      return res.json({ ok: true, received: true });
    } catch (err) {
      error('Webhook error: ' + err.message);
      return res.json({ ok: false, message: err.message }, 400);
    }
  }

  return res.json({ ok: true, message: 'Stripe function ready' });
};
