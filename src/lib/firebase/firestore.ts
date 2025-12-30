
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
import type { AiOutput, AssignmentGoal, StudySession } from '@/types';

const isDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

// --- In-memory store for dev mode ---

const initialMockAssignments: AssignmentGoal[] = [
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

const initialMockSessions: StudySession[] = [
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

const initialMockAiOutputs: AiOutput[] = [];


// Helper to restore Timestamps from serialized data
const restoreTimestamps = <T extends { [key: string]: any } | { [key: string]: any }[]>(data: T): T => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(item => restoreTimestamps(item)) as T;
    }
    const restored: { [key: string]: any } = { ...data };
    for (const key in restored) {
        if (restored[key] && typeof restored[key] === 'object' && 'seconds' in restored[key] && 'nanoseconds' in restored[key]) {
            restored[key] = new Timestamp((restored[key] as any).seconds, (restored[key] as any).nanoseconds);
        }
    }
    return restored as T;
}

const getMockData = (): { assignments: AssignmentGoal[], sessions: StudySession[], aiOutputs: AiOutput[] } => {
    if (typeof window === 'undefined') {
        return { assignments: initialMockAssignments, sessions: initialMockSessions, aiOutputs: initialMockAiOutputs };
    }
    const assignmentsStr = sessionStorage.getItem('mockAssignments');
    const sessionsStr = sessionStorage.getItem('mockSessions');
    const aiOutputsStr = sessionStorage.getItem('mockAiOutputs');

    const assignments = assignmentsStr ? restoreTimestamps(JSON.parse(assignmentsStr)) as AssignmentGoal[] : initialMockAssignments;
    const sessions = sessionsStr ? restoreTimestamps(JSON.parse(sessionsStr)) as StudySession[] : initialMockSessions;
    const aiOutputs = aiOutputsStr ? restoreTimestamps(JSON.parse(aiOutputsStr)) as AiOutput[] : initialMockAiOutputs;
    
    if (!assignmentsStr) {
        sessionStorage.setItem('mockAssignments', JSON.stringify(assignments));
    }
    if (!sessionsStr) {
        sessionStorage.setItem('mockSessions', JSON.stringify(sessions));
    }
    if (!aiOutputsStr) {
        sessionStorage.setItem('mockAiOutputs', JSON.stringify(aiOutputs));
    }

    return { assignments, sessions, aiOutputs };
}

const setMockData = (data: { assignments?: AssignmentGoal[], sessions?: StudySession[], aiOutputs?: AiOutput[] }) => {
    if (typeof window === 'undefined') return;
    if (data.assignments) {
        sessionStorage.setItem('mockAssignments', JSON.stringify(data.assignments));
    }
    if (data.sessions) {
        sessionStorage.setItem('mockSessions', JSON.stringify(data.sessions));
    }
    if (data.aiOutputs) {
        sessionStorage.setItem('mockAiOutputs', JSON.stringify(data.aiOutputs));
    }
};


// --- AssignmentGoal Functions ---
export const addAssignment = async (userId: string, title: string, optionalDeadline?: Date): Promise<void> => {
  if (isDevBypass) {
    const { assignments } = getMockData();
    const newId = `dev-assignment-${Date.now()}`;
    const newAssignment: AssignmentGoal = { 
        id: newId, 
        userId, 
        title, 
        createdAt: Timestamp.now(),
        ...(optionalDeadline && { optionalDeadline: Timestamp.fromDate(optionalDeadline) })
    };
    const updatedAssignments = [...assignments, newAssignment];
    setMockData({ assignments: updatedAssignments });
    return;
  }
  await addDoc(collection(db!, 'assignmentGoals'), {
    userId,
    title,
    optionalDeadline: optionalDeadline ? Timestamp.fromDate(optionalDeadline) : null,
    createdAt: serverTimestamp(),
  });
};

export const getAssignmentsForUser = async (userId: string): Promise<AssignmentGoal[]> => {
  if (isDevBypass) {
    const { assignments } = getMockData();
    return assignments
            .filter(a => a.userId === userId)
            .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }
  
  const q = query(collection(db!, 'assignmentGoals'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  const assignments = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentGoal));

  assignments.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
  });

  return assignments;
};

export const getAssignment = async (assignmentId: string): Promise<AssignmentGoal | null> => {
  if (isDevBypass) {
    const { assignments } = getMockData();
    return assignments.find(a => a.id === assignmentId) || null;
  }
  const docRef = doc(db!, 'assignmentGoals', assignmentId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as AssignmentGoal : null;
};

export const deleteAssignment = (assignmentId: string, userId: string): void => {
    if (isDevBypass) {
        let { assignments, sessions } = getMockData();
        const assignmentToDelete = assignments.find(a => a.id === assignmentId);
        if (!assignmentToDelete || assignmentToDelete.userId !== userId) {
            console.error("Permission denied or assignment not found.");
            return;
        }
        const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
        const updatedSessions = sessions.filter(s => s.assignmentId !== assignmentId);
        setMockData({ assignments: updatedAssignments, sessions: updatedSessions });
        return;
    }

    const deletePromise = async () => {
        const batch = writeBatch(db!);
        const assignmentRef = doc(db!, 'assignmentGoals', assignmentId);
    
        const assignmentDoc = await getDoc(assignmentRef);
        if (!assignmentDoc.exists() || assignmentDoc.data().userId !== userId) {
            throw new Error('Permission denied or assignment not found.');
        }
    
        batch.delete(assignmentRef);
    
        const sessionsQuery = query(
            collection(db!, 'studySessions'),
            where('assignmentId', '==', assignmentId),
            where('userId', '==', userId)
        );
        const sessionsSnapshot = await getDocs(sessionsQuery);
        sessionsSnapshot.forEach(sessionDoc => {
            batch.delete(sessionDoc.ref);
        });
    
        await batch.commit();
    };

    deletePromise().catch(console.error);
};

// --- StudySession Functions ---
export type StudySessionInput = Omit<StudySession, 'id' | 'userId' | 'assignmentId' | 'state' | 'createdAt'>;

export const addStudySession = async (userId: string, assignmentId: string, sessionData: StudySessionInput): Promise<string | undefined> => {
  if (isDevBypass) {
    const { sessions } = getMockData();
    const newId = `dev-session-${Date.now()}`;
    const newSession: StudySession = {
        ...sessionData,
        id: newId, 
        userId, 
        assignmentId, 
        state: 'Pending', 
        createdAt: Timestamp.now() 
    };
    const updatedSessions = [...sessions, newSession];
    setMockData({ sessions: updatedSessions });
    return newId;
  }
  const docRef = await addDoc(collection(db!, 'studySessions'), {
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
        const { sessions } = getMockData();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            sessions[sessionIndex] = { ...sessions[sessionIndex], ...data };
            setMockData({ sessions });
        }
        return;
    }
    const docRef = doc(db!, 'studySessions', sessionId);
    await updateDoc(docRef, data);
};

export const getStudySession = async (sessionId: string): Promise<StudySession | null> => {
  if (isDevBypass) {
    const { sessions } = getMockData();
    return sessions.find(s => s.id === sessionId) || null;
  }
  const docRef = doc(db!, 'studySessions', sessionId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as StudySession : null;
}

export const getSessionsForAssignment = async (assignmentId: string, userId: string): Promise<StudySession[]> => {
  if (isDevBypass) {
    const { sessions } = getMockData();
    return sessions
            .filter(s => s.assignmentId === assignmentId && s.userId === userId)
            .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
  }
  const q = query(
    collection(db!, 'studySessions'), 
    where('assignmentId', '==', assignmentId),
    where('userId', '==', userId),
  );
  const querySnapshot = await getDocs(q);
  const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));

  // Sort client-side
  sessions.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
  });

  return sessions;
};

export const getAllSessionsForUser = async (userId: string): Promise<StudySession[]> => {
    if (isDevBypass) {
        const { sessions } = getMockData();
        return sessions
                .filter(s => s.userId === userId)
                .sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }
    const q = query(collection(db!, 'studySessions'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
    
    sessions.sort((a, b) => {
      const aTime = a.createdAt?.toMillis() ?? 0;
      const bTime = b.createdAt?.toMillis() ?? 0;
      return bTime - aTime;
    });

    return sessions;
};

export const deleteStudySession = async (sessionId: string): Promise<void> => {
    if (isDevBypass) {
        let { sessions } = getMockData();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex > -1) {
            if (sessions[sessionIndex].state === 'Pending') {
                sessions.splice(sessionIndex, 1);
                setMockData({ sessions });
                return;
            } else {
                 throw new Error("Only pending sessions can be deleted.");
            }
        }
        throw new Error("Session not found.");
    }
    const docRef = doc(db!, 'studySessions', sessionId);
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
        const { sessions } = getMockData();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        if (sessionIndex !== -1) {
            const updatedData: Partial<StudySession> = { ...data };
             // Ensure server-like timestamps are converted to actual Timestamp objects
            if (data.startTime) {
                updatedData.startTime = Timestamp.now();
            }
            if (data.endTime) {
                updatedData.endTime = Timestamp.now();
            }
            sessions[sessionIndex] = { ...sessions[sessionIndex], ...updatedData, state };
            setMockData({ sessions });
        }
        return;
    }
    const docRef = doc(db!, 'studySessions', sessionId);
    await updateDoc(docRef, { state, ...data });
};

// --- AI Output Functions ---
export const addAiOutput = async (
  userId: string,
  assignmentId: string,
  ai_original: string,
  human_edited: string
): Promise<string> => {
  const featureName = "feature1_commitment_clarification";
  
  if (isDevBypass) {
    const { aiOutputs } = getMockData();
    const newId = `dev-ai-output-${Date.now()}`;
    const newAiOutput: AiOutput = {
      id: newId,
      userId,
      assignmentId,
      featureName,
      ai_original,
      human_edited,
      createdAt: Timestamp.now(),
    };
    const updatedAiOutputs = [...aiOutputs, newAiOutput];
    setMockData({ aiOutputs: updatedAiOutputs });
    return newId;
  }

  const docRef = await addDoc(collection(db!, 'aiOutputs'), {
    userId,
    assignmentId,
    featureName,
    ai_original,
    human_edited,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};
