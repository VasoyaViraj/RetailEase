import { account } from './appwriteConfig';

/**
 * Login with email and password.
 * @returns {Promise<import('appwrite').Models.Session>}
 */
export async function login(email, password) {
  return account.createEmailPasswordSession(email, password);
}

/**
 * Logout current session.
 */
export async function logout() {
  return account.deleteSession('current');
}

/**
 * Get currently logged-in user.
 * Returns null if no active session.
 * @returns {Promise<import('appwrite').Models.User | null>}
 */
export async function getCurrentUser() {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

/**
 * Extract roles from user labels.
 * Appwrite stores roles in user.labels[].
 * @param {import('appwrite').Models.User} user
 * @returns {string[]}
 */
export function getUserRoles(user) {
  if (!user) return [];
  return user.labels || [];
}
