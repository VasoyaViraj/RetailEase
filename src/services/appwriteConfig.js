import { Client, Query, ID, Databases} from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECTID);

const databases = new Databases(client)

export { client, databases, Query, ID }