import { Client, Query, ID, Databases, Account, Functions } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECTID);

const databases = new Databases(client)
const account = new Account(client)
const functions = new Functions(client)

export { client, databases, account, functions, Query, ID }