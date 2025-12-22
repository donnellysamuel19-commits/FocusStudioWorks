# **App Name**: FocusSprint

## Core Features:

- User Authentication: Authenticate users using Firebase Authentication with email/password.
- Assignment Goal Creation: Create AssignmentGoal records in Firestore with title, optional deadline, and user association.
- Study Session Creation: Create StudySession records in Firestore with target object, next action, sprint deliverable, duration, and state.
- Commitment Confirmation: Display a commitment summary and require explicit confirmation before starting the study session.
- Session Activation: Update StudySession state to Active upon confirmation and record the start time.
- Session Completion/Abandonment: Mark StudySession as Completed or Abandoned, record outcome, and end time.
- Session History Display: Display past StudySessions grouped by AssignmentGoal with basic summaries.

## Style Guidelines:

- Primary color: Light blue (#ADD8E6) to promote a sense of calmness and focus.
- Background color: Very light blue (#F0F8FF), providing a soft and unobtrusive backdrop.
- Accent color: Pale yellow (#FFFFE0) for subtle highlights and interactive elements.
- Body and headline font: 'Inter' sans-serif font for clear and readable text throughout the app.
- Simple, clear icons for navigation and actions. Use a consistent style that matches the overall minimalist aesthetic.
- Clean and straightforward layout to minimize distractions. Focus on clear information hierarchy and intuitive navigation.
- Subtle animations to indicate state changes or provide feedback on user interactions without being overly distracting.