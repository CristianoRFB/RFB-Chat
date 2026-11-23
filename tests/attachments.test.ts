import { describe, expect, it } from 'vitest';
import { isAcceptedMime, parseFileCode } from '../src/attachments';

describe('links de arquivo privados', () => {
  it('rejeita MIME HTML e aceita tipos permitidos', () => {
    expect(isAcceptedMime('text/html')).toBe(false);
    expect(isAcceptedMime('application/pdf')).toBe(true);
  });
  it('rejeita códigos com segmento malformado', () => {
    expect(parseFileCode('group_12345.abc')).toEqual({ conversationId: 'group_12345', fileId: 'abc' });
    expect(parseFileCode('../segredo')).toBeNull();
    expect(parseFileCode('a.b.c')).toBeNull();
  });
});
