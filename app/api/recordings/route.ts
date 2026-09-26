import handler from '@/lib/legacy/recordings.cjs';
import { adapt } from '@/lib/legacy/adapter';
export const runtime = 'nodejs';
export const maxDuration = 60;
export const GET = adapt(handler);
