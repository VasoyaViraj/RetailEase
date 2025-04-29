import { Client, Account, Query, ID, Databases} from 'appwrite';

const client = new Client();

client
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('68109093002f8d6e47b7');

const databases = new Databases(client)

export { client, databases, Query, ID }