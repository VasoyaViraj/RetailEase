import { Client, Query, ID, Databases, Account } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECTID);

const databases = new Databases(client)
const account = new Account(client)

export { client, databases, account, Query, ID }