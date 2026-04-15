import { databases, Query, ID, account } from './appwriteConfig';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASEID;
const CUSTOMERS_COLLECTION = import.meta.env.VITE_APPWRITE_CUSTOMERS_COLLECTIONID;

/**
 * Upsert a customer by email + mobile.
 * If a customer with the same email AND mobile exists, return it.
 * Otherwise create a new customer document.
 *
 * @param {{ name: string, mobile: string, email: string }} data
 * @returns {Promise<import('appwrite').Models.Document>} customer document
 */
export async function upsertCustomer({ name, mobile, email }) {
  // Try to find existing customer
  const res = await databases.listDocuments(DB_ID, CUSTOMERS_COLLECTION, [
    Query.equal('mobile', String(mobile)),
    Query.limit(1),
  ]);

  if (res.documents.length > 0) {
    const existing = res.documents[0];

    // Update name if changed
    if (existing.name !== name) {
      return databases.updateDocument(DB_ID, CUSTOMERS_COLLECTION, existing.$id, { name });
    }

    return existing;
  }

  // Create new Appwrite Auth user
  let authUserId = "guest_" + ID.unique();
  try {
    const authEmail = email || `${String(mobile).replace(/[^0-9]/g, '')}@retailease.local`;
    const userAccount = await account.create(ID.unique(), authEmail, '12345678', name);
    authUserId = userAccount.$id;
  } catch (error) {
    console.error('Failed to create Appwrite Auth user (might already exist or session blocks):', error);
  }

  // Create new customer document
  return databases.createDocument(DB_ID, CUSTOMERS_COLLECTION, ID.unique(), {
    name,
    mobile: String(mobile),
    email,
    userId: authUserId,
  });
}

/**
 * Get customer by Appwrite user ID (for customer-facing profile).
 * @param {string} appwriteUserId
 * @returns {Promise<import('appwrite').Models.Document | null>}
 */
export async function getCustomerByUserId(appwriteUserId) {
  const res = await databases.listDocuments(DB_ID, CUSTOMERS_COLLECTION, [
    Query.equal('userId', appwriteUserId),
    Query.limit(1),
  ]);
  return res.documents.length > 0 ? res.documents[0] : null;
}
