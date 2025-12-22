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

// AssignmentGoal Functions
export const addAssignment = async (userId: string, title: string, optionalDeadline?: Date): Promise<string> => {
  const docRef = await addDoc(collection(db, 'assignmentGoals'), {
    userId,
    title,
    optionalDeadline: optionalDeadline ? Timestamp.fromDate(optionalDeadline) : null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getAssignmentsForUser = async (userId: string): Promise<AssignmentGoal[]> => {
  const q = query(collection(db, 'assignmentGoals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AssignmentGoal));
};

export const getAssignment = async (assignmentId: string): Promise<AssignmentGoal | null> => {
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
  const docRef = doc(db, 'studySessions', sessionId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as StudySession;
  }
  return null;
}

export const getSessionsForAssignment = async (assignmentId: string): Promise<StudySession[]> => {
  const q = query(collection(db, 'studySessions'), where('assignmentId', '==', assignmentId), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
};

export const getAllSessionsForUser = async (userId: string): Promise<StudySession[]> => {
    const q = query(collection(db, 'studySessions'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession));
};

export const updateSessionState = async (sessionId: string, state: StudySession['state'], data: Partial<StudySession> = {}): Promise<void> => {
    const docRef = doc(db, 'studySessions', sessionId);
    await updateDoc(docRef, {
        state,
        ...data,
    });
};
