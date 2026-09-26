import handler from '@/lib/legacy/mushaf.cjs';
import { adapt } from '@/lib/legacy/adapter';
export const runtime = 'nodejs';
export const maxDuration = 30;
export const GET = adapt(handler);
