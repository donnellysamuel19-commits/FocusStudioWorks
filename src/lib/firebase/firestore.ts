

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  orderBy,
  Timestamp,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import type { AssignmentGoal, StudySession } from '@/types';

const isDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// In-memory store for dev mode
let mockAssignments: AssignmentGoal[] = [
    {
        id: 'dev-assignment-1',
        userId: 'dev-user',
        title: 'Physics Homework',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)),
        optionalDeadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    },
    {
        id: 'dev-assignment-2',
        userId: 'dev-user',
        title: 'History Essay',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
    }
];

let mockSessions: StudySession[] = [
    {
        id: 'dev-session-1',
        userId: 'dev-user',
        assignmentId: 'dev-assignment-1',
        targetObject: 'Chapter 1 Problems',
        nextAction: 'Solve problems 1-5',
        sprintDeliverable: 'Solutions for 1-5',
        durationMinutes: 25,
        state: 'Completed',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        startTime: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)),
        endTime: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000 + 25 * 60 * 1000)),
        outcome: 'Completed'
    },
     {
        id: 'dev-session-2',
        userId: 'dev-user',
        assignmentId: 'dev-assignment-1',
        targetObject: 'Chapter 2 Reading',
        nextAction: 'Read pages 20-30',
        sprintDeliverable: 'Notes on pages 20-30',
        durationMinutes: 15,
        state: 'Abandoned',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
        startTime: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000)),
        endTime: Timestamp.fromDate(new Date(Date.now() - 12 * 60 * 60 * 1000 + 5 * 60 * 1000)),
        outcome: 'Abandoned',
        optionalBlockerNote: 'Got distracted by the cat.'
    },
    {
        id: 'dev-session-3',
        userId: 'dev-user',
        assignmentId: 'dev-assignment-1',
        targetObject: 'Review Lecture Notes',
        nextAction: 'Summarize week 3 lecture',
        sprintDeliverable: 'One-page summary',
        durationMinutes: 20,
        state: 'Pending',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)),
    }
];

// Helper to restore Timestamps from serialized data
const restoreTimestamps = (data: any) => {
    if (!data) return data;
    const restored = { ...data };
    for (const key in restored) {
        if (restored[key] && typeof restored[key] === 'object' && 'seconds' in restored[key] && 'nanoseconds' in restored[key]) {
            restored[key] = new Timestamp(restored[key].seconds, restored[key].nanoseconds);
        }
    }
    return restored;
}


// --- AssignmentGoal Functions ---
export const addAssignment = async (userId: string, title: string, optionalDeadline?: Date): Promise<string> => {
  if (isDevBypass) {
    const newId = `dev-assignment-${Date.now()}`;
    const newAssignment: AssignmentGoal = { 
        id: newId, 
        userId, 
        title, 
        createdAt: Timestamp.now(),
        ...(optionalDeadline && { optionalDeadline: Timestamp.fromDate(optionalDeadline) })
    };
    mockAssignments.push(newAssignment);
    return Promise.resolve(newId);
  }
  const docRef = await addDoc(collection(db, 'assignmentGoals'), {
    userId,
    title,
    optionalDeadline: optionalDeadline ? Timestamp.fromDate(optionalDeadline) : null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getAssignmentsForUser = async (userId: string): Promise<AssignmentGoal[]> => {
  if (isDevBypass) {
    const userAssignments = mockAssignments
      .filter(a => a.userId === userId)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    
    // Deep clone and restore timestamps to avoid mutation and type errors
    const clonedAssignments = JSON.parse(JSON.stringify(userAssignments));
    return Promise.resolve(clonedAssignments.map(restoreTimestamps));
  }
  const q = query(collection(db, 'assignmentGoals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentGoal));
};

export const getAssignment = async (assignmentId: string): Promise<AssignmentGoal | null> => {
  if (isDevBypass) {
    const assignment = mockAssignments.find(a => a.id === assignmentId) || null;
    if (!assignment) return Promise.resolve(null);
    const clonedAssignment = JSON.parse(JSON.stringify(assignment));
    return Promise.resolve(restoreTimestamps(clonedAssignment));
  }
  const docRef = doc(db, 'assignmentGoals', assignmentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AssignmentGoal : null;
};

// --- StudySession Functions ---
export type StudySessionInput = Omit<StudySession, 'id' | 'userId' | 'assignmentId' | 'state' | 'createdAt'>;

export const addStudySession = async (userId: string, assignmentId: string, sessionData: StudySessionInput): Promise<string> => {
  if (isDevBypass) {
    const newId = `dev-session-${Date.now()}`;
    const newSession: StudySession = {
        ...sessionData,
        id: newId, 
        userId, 
        assignmentId, 
        state: 'Pending', 
        createdAt: Timestamp.now() 
    };
    mockSessions.push(newSession);
    return Promise.resolve(newId);
  }
  const docRef = await addDoc(collection(db, 'studySessions'), {
    ...sessionData,
    userId,
    assignmentId,
    state: 'Pending',
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateStudySession = async (sessionId: string, data: Partial<StudySessionInput>): Promise<void> => {
    if (isDevBypass) {
        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            mockSessions[sessionIndex] = { ...mockSessions[sessionIndex], ...data };
        }
        return Promise.resolve();
    }
    const docRef = doc(db, 'studySessions', sessionId);
    await updateDoc(docRef, data);
};

export const getStudySession = async (sessionId: string): Promise<StudySession | null> => {
  if (isDevBypass) {
    const session = mockSessions.find(s => s.id === sessionId) || null;
    if (!session) return Promise.resolve(null);
    // Deep clone and restore timestamps
    const clonedSession = JSON.parse(JSON.stringify(session));
    return Promise.resolve(restoreTimestamps(clonedSession));
  }
  const docRef = doc(db, 'studySessions', sessionId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as StudySession : null;
}

export const getSessionsForAssignment = async (assignmentId: string): Promise<StudySession[]> => {
  if (isDevBypass) {
    const sessions = mockSessions
        .filter(s => s.assignmentId === assignmentId)
        .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    const clonedSessions = JSON.parse(JSON.stringify(sessions));
    return Promise.resolve(clonedSessions.map(restoreTimestamps));
  }
  const q = query(collection(db, 'studySessions'), where('assignmentId', '==', assignmentId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
};

export const getAllSessionsForUser = async (userId: string): Promise<StudySession[]> => {
    if (isDevBypass) {
        const sessions = mockSessions
            .filter(s => s.userId === userId)
            .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());

        const clonedSessions = JSON.parse(JSON.stringify(sessions));
        return Promise.resolve(clonedSessions.map(restoreTimestamps));
    }
    const q = query(collection(db, 'studySessions'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
};

export const deleteStudySession = async (sessionId: string): Promise<void> => {
    if (isDevBypass) {
        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex > -1) {
            if (mockSessions[sessionIndex].state === 'Pending') {
                mockSessions.splice(sessionIndex, 1);
                return Promise.resolve();
            } else {
                 return Promise.reject(new Error("Only pending sessions can be deleted."));
            }
        }
        return Promise.reject(new Error("Session not found."));
    }
    const docRef = doc(db, 'studySessions', sessionId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().state === 'Pending') {
        await deleteDoc(docRef);
    } else if (docSnap.exists()) {
        throw new Error("Only pending sessions can be deleted.");
    } else {
        throw new Error("Session not found.");
    }
};

export const updateSessionState = async (sessionId: string, state: StudySession['state'], data: Partial<StudySession> = {}): Promise<void> => {
    if (isDevBypass) {
        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            const updatedData: Partial<StudySession> = { ...data };
            // Ensure server-like timestamps are converted to actual Timestamp objects
            if (data.startTime) {
                updatedData.startTime = Timestamp.now();
            }
            if (data.endTime) {
                updatedData.endTime = Timestamp.now();
            }
            mockSessions[sessionIndex] = { ...mockSessions[sessionIndex], ...updatedData, state };
        }
        return Promise.resolve();
    }
    const docRef = doc(db, 'studySessions', sessionId);
    await updateDoc(docRef, { state, ...data });
};
