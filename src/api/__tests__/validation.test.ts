import { describe, it, expect } from 'vitest';
import { escapeHtml, isValidEmail, validateContactForm } from '../validation';

describe('escapeHtml', () => {
  it('escapes the five dangerous characters', () => {
    expect(escapeHtml(`<script>alert('x')&"y"</script>`)).toBe(
      '&lt;script&gt;alert(&#39;x&#39;)&amp;&quot;y&quot;&lt;/script&gt;'
    );
  });

  it('escapes ampersand first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeHtml('Hello, Jason! How are you?')).toBe('Hello, Jason! How are you?');
  });

  it('leaves non-ASCII text untouched', () => {
    expect(escapeHtml('你好，我是过汇智融')).toBe('你好，我是过汇智融');
  });

  it('handles an empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts a normal address', () => {
    expect(isValidEmail('jason.ghzr@gmail.com')).toBe(true);
  });

  it('accepts a plus-tagged address', () => {
    expect(isValidEmail('jason+work@gmail.com')).toBe(true);
  });

  it('rejects a missing at-sign', () => {
    expect(isValidEmail('jasongmail.com')).toBe(false);
  });

  it('rejects a missing domain', () => {
    expect(isValidEmail('jason@')).toBe(false);
  });

  it('rejects whitespace', () => {
    expect(isValidEmail('jason @gmail.com')).toBe(false);
  });

  it('rejects a newline injection attempt', () => {
    expect(isValidEmail('a@b.com\nBcc: victim@example.com')).toBe(false);
  });
});

describe('validateContactForm', () => {
  const valid = {
    name: 'Jane',
    email: 'jane@example.com',
    subject: 'Hello',
    message: 'Nice site',
  };

  it('accepts a complete submission', () => {
    const result = validateContactForm(valid);
    expect(result.ok).toBe(true);
  });

  it('rejects when a field is missing', () => {
    const result = validateContactForm({ ...valid, subject: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects when the body is not an object', () => {
    expect(validateContactForm(null).ok).toBe(false);
    expect(validateContactForm('hello').ok).toBe(false);
  });

  it('rejects an over-long message', () => {
    const result = validateContactForm({ ...valid, message: 'x'.repeat(5001) });
    expect(result.ok).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateContactForm({ ...valid, email: 'not-an-email' });
    expect(result.ok).toBe(false);
  });
});
