import { databases, Query, ID } from './appwriteConfig';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASEID;
const LEDGERDUE_COLLECTION = import.meta.env.VITE_APPWRITE_LEDGERDUE_COLLECTIONID;
const SETTLEMENT_COLLECTION = import.meta.env.VITE_APPWRITE_LEDGERSETTLEMENT_COLLECTIONID;

/**
 * Create a ledger due entry when paymentMode=UDHAAR.
 */
export async function createLedgerDue({ orderId, customerId, dueAmount }) {
  return databases.createDocument(DB_ID, LEDGERDUE_COLLECTION, ID.unique(), {
    orderId,
    customerId,
    dueAmount,
    paidAmount: 0,
    remainingAmount: dueAmount,
    status: 'pending',
  });
}

/**
 * Get all pending/partially-settled dues.
 * Optionally filter by customerId.
 */
export async function getPendingDues(customerId = null) {
  const queries = [
    Query.notEqual('status', 'settled'),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ];
  if (customerId) {
    queries.push(Query.equal('customerId', customerId));
  }
  const res = await databases.listDocuments(DB_ID, LEDGERDUE_COLLECTION, queries);
  return res.documents;
}

/**
 * Get all dues for a customer (any status).
 */
export async function getDuesByCustomer(customerId) {
  const res = await databases.listDocuments(DB_ID, LEDGERDUE_COLLECTION, [
    Query.equal('customerId', customerId),
    Query.orderDesc('$createdAt'),
    Query.limit(100),
  ]);
  return res.documents;
}

/**
 * Apply a cash settlement to a ledger due.
 * Creates a ledgerSettlement doc and updates the ledgerDue.
 */
export async function settleDueCash({ ledgerDueId, orderId, customerId, settlementAmount, createdBy }) {
  // 1. Create settlement record
  await databases.createDocument(DB_ID, SETTLEMENT_COLLECTION, ID.unique(), {
    ledgerDueId,
    orderId,
    customerId,
    paymentMode: 'cash',
    settlementAmount,
    stripeSessionId: '',
    createdBy,
  });

  // 2. Get current due
  const due = await databases.getDocument(DB_ID, LEDGERDUE_COLLECTION, ledgerDueId);
  const newPaid = due.paidAmount + settlementAmount;
  const newRemaining = due.dueAmount - newPaid;

  let newStatus = 'partiallySettled';
  if (newRemaining <= 0) {
    newStatus = 'settled';
  }

  // 3. Update due
  return databases.updateDocument(DB_ID, LEDGERDUE_COLLECTION, ledgerDueId, {
    paidAmount: newPaid,
    remainingAmount: Math.max(0, newRemaining),
    status: newStatus,
  });
}
