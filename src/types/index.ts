import type { Timestamp } from 'firebase/firestore';

export type User = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export type AssignmentGoal = {
  id: string;
  userId: string;
  title: string;
  optionalDeadline?: Timestamp;
  createdAt: Timestamp;
};

export type StudySession = {
  id: string;
  userId: string;
  assignmentId: string;
  targetObject: string;
  nextAction: string;
  sprintDeliverable: string;
  durationMinutes: 10 | 15 | 20 | 25;
  state: 'Pending' | 'Active' | 'Completed' | 'Abandoned';
  createdAt: Timestamp;
  startTime?: Timestamp;
  endTime?: Timestamp;
  outcome?: 'Completed' | 'Abandoned';
  optionalBlockerTags?: string[];
  optionalBlockerNote?: string;
};
