import { after } from 'next/server';
import { createChatV2Route } from '@/lib/api/chat-v2-route';
import { chatServices } from '@/lib/api/chat-services';

export const maxDuration = 30;
const handle = createChatV2Route(chatServices, completion => after(() => completion));
export const POST = handle;
export const OPTIONS = handle;
