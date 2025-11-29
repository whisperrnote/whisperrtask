import { Models } from "appwrite";

export interface Calendar extends Models.Document {
    name: string;
    color: string;
    isDefault: boolean;
    userId: string;
}

export interface Task extends Models.Document {
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    recurrenceRule?: string;
    tags?: string[];
    assigneeIds?: string[];
    attachmentIds?: string[];
    eventId?: string;
    userId: string;
    parentId?: string;
}

export interface Event extends Models.Document {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    location?: string;
    meetingUrl?: string;
    visibility: string;
    status: string;
    coverImageId?: string;
    maxAttendees?: number;
    recurrenceRule?: string;
    calendarId: string;
    userId: string;
}

export interface EventGuest extends Models.Document {
    eventId: string;
    userId?: string;
    email?: string;
    status: string;
    role: string;
}

export interface FocusSession extends Models.Document {
    userId: string;
    taskId?: string;
    startTime: string;
    endTime?: string;
    duration?: number;
    status: string;
}
