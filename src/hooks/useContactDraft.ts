'use client';
import { useSession } from './useSession';
import { getBrowserSession, type ContactForm } from '../../lib/client/session';
import { getContactRuntime } from '../../lib/client/contact-runtime';
function setField(name: keyof ContactForm, value: string) {
  getBrowserSession().setState(previous => ({ ...previous, contact: { ...previous.contact,
    formData: { ...previous.contact.formData, [name]: value },
  } }));
}
const submit = (token: string) => getContactRuntime().submit(token);
export function useContactDraft() { return { ...useSession('contact'), setField, submit }; }
