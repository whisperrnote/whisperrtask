import { Client, Databases, Storage, Account } from "appwrite";
import { APPWRITE_CONFIG } from "./config";

const client = new Client();

client
    .setEndpoint(APPWRITE_CONFIG.ENDPOINT)
    .setProject(APPWRITE_CONFIG.PROJECT_ID);

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);
export { client };
