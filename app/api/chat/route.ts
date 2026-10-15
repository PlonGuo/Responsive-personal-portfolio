import { after } from 'next/server';
import { createChatRoute } from '@/lib/api/chat-route';
import { chatServices } from '@/lib/api/chat-services';

export const maxDuration = 30;
const handle = createChatRoute(chatServices, completion => after(() => completion));
export const POST = handle;
export const OPTIONS = handle;
