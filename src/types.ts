
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AssignmentGoal {
  id: string;
  userId: string;
  title: string;
  createdAt: Timestamp;
  optionalDeadline?: Timestamp;
}

export interface StudySession {
  id: string;
  userId: string;
  assignmentId: string;
  targetObject: string;
  nextAction: string;
  sprintDeliverable: string;
  durationMinutes: number;
  state: 'Pending' | 'Active' | 'Paused' | 'Completed' | 'Abandoned';
  createdAt: Timestamp;
  startTime?: Timestamp;
  endTime?: Timestamp;
  pauseTime?: Timestamp;
  totalPausedSeconds?: number;
  outcome?: 'Completed' | 'Abandoned' | 'Interrupted';
  optionalBlockerNote?: string;
  assignmentTitle?: string;
  [key: string]: any;
}

export interface AiOutput {
    userId: string;
    assignmentId: string;
    featureName: string; // e.g., 'feature1_commitment_clarification'
    aiOriginal: string;
    humanEdited: string;
    userFeedback?: 'up' | 'down';
    createdAt?: Timestamp;
}
