import { createContactRoute } from '@/lib/api/contact-route';
import { contactServices } from '@/lib/api/contact-services';

export const maxDuration = 30;
const handle = createContactRoute(contactServices);
export const POST = handle;
export const OPTIONS = handle;
