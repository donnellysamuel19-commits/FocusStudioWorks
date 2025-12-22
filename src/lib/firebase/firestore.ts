
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
} from 'firebase/firestore';
import { db } from './config';
import type { AssignmentGoal, StudySession } from '@/types';

const isDevBypass = process.env.DEV_AUTH_BYPASS === 'true';

const mockAssignments: AssignmentGoal[] = [
    {
        id: 'dev-assignment-1',
        userId: 'dev-user',
        title: 'Mock Physics Homework',
        createdAt: Timestamp.now(),
        optionalDeadline: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 1 week from now
    },
    {
        id: 'dev-assignment-2',
        userId: 'dev-user',
        title: 'Mock History Essay',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
    }
];

const mockSessions: StudySession[] = [
    {
        id: 'dev-session-1',
        userId: 'dev-user',
        assignmentId: 'dev-assignment-1',
        targetObject: 'Chapter 1 Problems',
        nextAction: 'Solve problems 1-5',
        sprintDeliverable: 'Solutions for 1-5',
        durationMinutes: 25,
        state: 'Completed',
        createdAt: Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000)), // yesterday
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
        createdAt: Timestamp.now(),
        startTime: Timestamp.now(),
        endTime: Timestamp.now(),
        outcome: 'Abandoned',
        optionalBlockerNote: 'Got distracted'
    }
];


// AssignmentGoal Functions
export const addAssignment = async (userId: string, title: string, optionalDeadline?: Date): Promise<string> => {
  if (isDevBypass) {
    console.log('DEV_AUTH_BYPASS: Skipped addAssignment, returning mock ID.');
    const newId = `dev-assignment-${Date.now()}`;
    mockAssignments.push({ id: newId, userId, title, optionalDeadline: optionalDeadline ? Timestamp.fromDate(optionalDeadline) : undefined, createdAt: Timestamp.now() });
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
    console.log('DEV_AUTH_BYPASS: Returning mock assignments.');
    return Promise.resolve(mockAssignments.filter(a => a.userId === userId));
  }
  const q = query(collection(db, 'assignmentGoals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentGoal));
};

export const getAssignment = async (assignmentId: string): Promise<AssignmentGoal | null> => {
  if (isDevBypass) {
    console.log('DEV_AUTH_BYPASS: Returning mock assignment.');
    const assignment = mockAssignments.find(a => a.id === assignmentId) || null;
    return Promise.resolve(assignment);
  }
  const docRef = doc(db, 'assignmentGoals', assignmentId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as AssignmentGoal;
  }
  return null;
};

// StudySession Functions
type StudySessionInput = Omit<StudySession, 'id' | 'userId' | 'state' | 'createdAt'>;

export const addStudySession = async (userId: string, assignmentId: string, sessionData: StudySessionInput): Promise<string> => {
  if (isDevBypass) {
    console.log('DEV_AUTH_BYPASS: Skipped addStudySession, returning mock ID.');
    const newId = `dev-session-${Date.now()}`;
     mockSessions.push({ 
        ...sessionData,
        id: newId, 
        userId, 
        assignmentId, 
        state: 'Pending', 
        createdAt: Timestamp.now() 
    });
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

export const getStudySession = async (sessionId: string): Promise<StudySession | null> => {
  if (isDevBypass) {
    console.log('DEV_AUTH_BYPASS: Returning mock session.');
    const session = mockSessions.find(s => s.id === sessionId) || null;
    return Promise.resolve(session);
  }
  const docRef = doc(db, 'studySessions', sessionId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as StudySession;
  }
  return null;
}

export const getSessionsForAssignment = async (assignmentId: string): Promise<StudySession[]> => {
  if (isDevBypass) {
    console.log('DEV_AUTH_BYPASS: Returning mock sessions for assignment.');
    return Promise.resolve(mockSessions.filter(s => s.assignmentId === assignmentId));
  }
  const q = query(collection(db, 'studySessions'), where('assignmentId', '==', assignmentId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
};

export const getAllSessionsForUser = async (userId: string): Promise<StudySession[]> => {
    if (isDevBypass) {
        console.log('DEV_AUTH_BYPASS: Returning all mock sessions for user.');
        return Promise.resolve(mockSessions.filter(s => s.userId === userId));
    }
    const q = query(collection(db, 'studySessions'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
};

export const updateSessionState = async (sessionId: string, state: StudySession['state'], data: Partial<StudySession> = {}): Promise<void> => {
    if (isDevBypass) {
        console.log('DEV_AUTH_BYPASS: Mock updating session state.');
        const sessionIndex = mockSessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            mockSessions[sessionIndex] = { ...mockSessions[sessionIndex], ...data, state };
        }
        return Promise.resolve();
    }
    const docRef = doc(db, 'studySessions', sessionId);
    await updateDoc(docRef, {
        state,
        ...data,
    });
};
