'use client';

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, Send, CheckCircle, AlertCircle } from 'lucide-react';
import type { ContactInfo } from '../types';
import type { Dictionary } from '../../lib/i18n/types';
import TurnstileWidget from './TurnstileWidget';

import { useContactDraft } from '../hooks/useContactDraft';
import { getErrorMessage } from '../../lib/i18n/errors';
import type { ContactForm } from '../../lib/client/session';

export default function Contact({ contactInfo, siteKey, copy }: {
  contactInfo: ContactInfo; siteKey: string;
  copy: Pick<Dictionary, 'sections' | 'forms' | 'errors'>;
}) {
  const { formData, status, errorCode, verificationVersion, setField, submit } = useContactDraft();
  const [verification, setVerification] = useState<{ value: string | null; version: number }>({ value: null, version: verificationVersion });
  const turnstileToken = verification.version === verificationVersion ? verification.value : null;
  const onToken = useCallback((value: string | null) => setVerification({ value, version: verificationVersion }), [verificationVersion]);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setField(event.target.name as keyof ContactForm, event.target.value);
  };
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (turnstileToken) void submit(turnstileToken);
  };

  return (
    <section
      id="contact"
      className="py-20 lg:py-32 bg-white dark:bg-slate-900"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-slate-900 dark:text-white mb-4">
            {copy.sections.contact}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">{copy.sections.contactSubtitle}</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            {/* Phone */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-2">
                  {copy.forms.call}
                </h3>
                {contactInfo.phone.map((phone, index) => (
                  <p
                    key={index}
                    className="text-slate-600 dark:text-slate-400"
                  >
                    {phone}
                  </p>
                ))}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold text-slate-900 dark:text-white mb-2">
                  {copy.forms.email}
                </h3>
                {contactInfo.email.map((email, index) => (
                  <a
                    key={index}
                    href={`mailto:${email}`}
                    className="block text-slate-600 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer"
                  >
                    {email}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={false}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-heading font-semibold text-xl text-slate-900 dark:text-white mb-6">
              {copy.forms.invitation}{' '}
              <span className="text-primary">{copy.forms.letsTalk}</span>
            </h3>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={copy.forms.name} aria-label={copy.forms.name}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={copy.forms.emailPlaceholder} aria-label={copy.forms.emailPlaceholder}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder={copy.forms.subject} aria-label={copy.forms.subject}
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={copy.forms.message} aria-label={copy.forms.message}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
              />

              <TurnstileWidget
                siteKey={siteKey}
                resetKey={verificationVersion}
                onToken={onToken}
              />
              {!turnstileToken && (
                <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
                  {copy.forms.verification}
                </p>
              )}

              {errorCode && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(errorCode, copy)}</p>}

              <button
                type="submit"
                disabled={status === 'loading' || !turnstileToken}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === 'loading' ? (
                  <>
                    <span className="animate-spin">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    </span>
                    {copy.forms.sending}
                  </>
                ) : status === 'success' ? (
                  <>
                    <CheckCircle size={20} />
                    {copy.forms.sent}
                  </>
                ) : status === 'error' ? (
                  <>
                    <AlertCircle size={20} />
                    {copy.forms.retry}
                  </>
                ) : (
                  <>
                    {copy.forms.send}
                    <Send size={20} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
