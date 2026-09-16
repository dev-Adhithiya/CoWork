import type { ReactNode } from 'react';
import { ActionItemsPanel } from '../components/features/ActionItemsPanel';
import { BlockersPanel } from '../components/features/BlockersPanel';
import { MeetingSummaryPanel } from '../components/features/MeetingSummaryPanel';
import { PresenceMap } from '../components/features/PresenceMap';
import { SchedulingPanel } from '../components/features/SchedulingPanel';
import { StandupPanel } from '../components/features/StandupPanel';

function PageFrame({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`h-full min-h-0 overflow-y-auto ${className}`}>{children}</section>;
}

export function RoomsPage() {
  return <PresenceMap />;
}

export function MeetingsPage() {
  return <PageFrame><MeetingSummaryPanel /></PageFrame>;
}

export function StandupsPage() {
  return <PageFrame className="max-w-3xl"><StandupPanel /></PageFrame>;
}

export function BlockersPage() {
  return <PageFrame className="max-w-4xl"><BlockersPanel /></PageFrame>;
}

export function ActionItemsPage() {
  return <PageFrame className="max-w-4xl"><ActionItemsPanel /></PageFrame>;
}

export function SchedulingPage() {
  return <PageFrame className="max-w-3xl"><SchedulingPanel /></PageFrame>;
}
