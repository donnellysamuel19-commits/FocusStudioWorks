'use client';

// This is a route wrapper to reuse the New/Edit Sprint form component.
// The actual logic is in `src/app/app/assignments/[id]/sprint/new/page.tsx`.

import NewOrEditSprintPage from '../../new/page';

export default function EditSprintPage({ params }: { params: { id: string, sessionId: string } }) {
  return <NewOrEditSprintPage params={params} />;
}
