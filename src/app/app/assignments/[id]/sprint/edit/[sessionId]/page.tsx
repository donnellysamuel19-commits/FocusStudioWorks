'use client';

// This is a route wrapper to reuse the New/Edit Sprint form component.
// The actual logic is in `src/app/app/assignments/[id]/sprint/new/page.tsx`.

import NewOrEditSprintPage from '../../new/page';
import { use } from 'react';

export default function EditSprintPage({ params }: { params: Promise<{ id: string, sessionId: string }> }) {
  const resolvedParams = use(params);
  return <NewOrEditSprintPage params={resolvedParams} />;
}

    