import { ID, Models } from "appwrite";
import { databases } from "./appwrite";
import { APPWRITE_CONFIG } from "./config";
import { Calendar, Task, Event, EventGuest, FocusSession } from "../types/whisperrflow";

const { DATABASE_ID, COLLECTIONS } = APPWRITE_CONFIG;

// Generic Helper Functions
async function listDocuments<T extends Models.Document>(collectionId: string, queries?: string[]): Promise<Models.DocumentList<T>> {
    return await databases.listDocuments<T>(DATABASE_ID, collectionId, queries);
}

async function createDocument<T extends Models.Document>(collectionId: string, data: unknown, documentId: string = ID.unique()): Promise<T> {
    return await databases.createDocument<T>(DATABASE_ID, collectionId, documentId, data as object);
}

async function getDocument<T extends Models.Document>(collectionId: string, documentId: string): Promise<T> {
    return await databases.getDocument<T>(DATABASE_ID, collectionId, documentId);
}

async function updateDocument<T extends Models.Document>(collectionId: string, documentId: string, data: unknown): Promise<T> {
    return await databases.updateDocument<T>(DATABASE_ID, collectionId, documentId, data as object);
}

async function deleteDocument(collectionId: string, documentId: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, collectionId, documentId);
}

// --- Calendars ---

export const calendars = {
    list: (queries?: string[]) => listDocuments<Calendar>(COLLECTIONS.CALENDARS, queries),
    create: (data: Omit<Calendar, keyof Models.Document>) => createDocument<Calendar>(COLLECTIONS.CALENDARS, data),
    get: (id: string) => getDocument<Calendar>(COLLECTIONS.CALENDARS, id),
    update: (id: string, data: Partial<Omit<Calendar, keyof Models.Document>>) => updateDocument<Calendar>(COLLECTIONS.CALENDARS, id, data),
    delete: (id: string) => deleteDocument(COLLECTIONS.CALENDARS, id),
};

// --- Tasks ---

export const tasks = {
    list: (queries?: string[]) => listDocuments<Task>(COLLECTIONS.TASKS, queries),
    create: (data: Omit<Task, keyof Models.Document>) => createDocument<Task>(COLLECTIONS.TASKS, data),
    get: (id: string) => getDocument<Task>(COLLECTIONS.TASKS, id),
    update: (id: string, data: Partial<Omit<Task, keyof Models.Document>>) => updateDocument<Task>(COLLECTIONS.TASKS, id, data),
    delete: (id: string) => deleteDocument(COLLECTIONS.TASKS, id),
};

// --- Events ---

export const events = {
    list: (queries?: string[]) => listDocuments<Event>(COLLECTIONS.EVENTS, queries),
    create: (data: Omit<Event, keyof Models.Document>) => createDocument<Event>(COLLECTIONS.EVENTS, data),
    get: (id: string) => getDocument<Event>(COLLECTIONS.EVENTS, id),
    update: (id: string, data: Partial<Omit<Event, keyof Models.Document>>) => updateDocument<Event>(COLLECTIONS.EVENTS, id, data),
    delete: (id: string) => deleteDocument(COLLECTIONS.EVENTS, id),
};

// --- Event Guests ---

export const eventGuests = {
    list: (queries?: string[]) => listDocuments<EventGuest>(COLLECTIONS.EVENT_GUESTS, queries),
    create: (data: Omit<EventGuest, keyof Models.Document>) => createDocument<EventGuest>(COLLECTIONS.EVENT_GUESTS, data),
    get: (id: string) => getDocument<EventGuest>(COLLECTIONS.EVENT_GUESTS, id),
    update: (id: string, data: Partial<Omit<EventGuest, keyof Models.Document>>) => updateDocument<EventGuest>(COLLECTIONS.EVENT_GUESTS, id, data),
    delete: (id: string) => deleteDocument(COLLECTIONS.EVENT_GUESTS, id),
};

// --- Focus Sessions ---

export const focusSessions = {
    list: (queries?: string[]) => listDocuments<FocusSession>(COLLECTIONS.FOCUS_SESSIONS, queries),
    create: (data: Omit<FocusSession, keyof Models.Document>) => createDocument<FocusSession>(COLLECTIONS.FOCUS_SESSIONS, data),
    get: (id: string) => getDocument<FocusSession>(COLLECTIONS.FOCUS_SESSIONS, id),
    update: (id: string, data: Partial<Omit<FocusSession, keyof Models.Document>>) => updateDocument<FocusSession>(COLLECTIONS.FOCUS_SESSIONS, id, data),
    delete: (id: string) => deleteDocument(COLLECTIONS.FOCUS_SESSIONS, id),
};
