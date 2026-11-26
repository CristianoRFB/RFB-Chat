import { describe, expect, it } from 'vitest';
import { isAcceptedMime, parseFileCode, scaledDimensions } from '../src/attachments';

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

it('mantém proporção na compressão e aceita somente tipos previstos',()=>{
 expect(scaledDimensions(2400,1200,960)).toEqual([960,480]);
 expect(scaledDimensions(20,40,960)).toEqual([20,40]);
 expect(isAcceptedMime('video/webm')).toBe(true);
 expect(isAcceptedMime('image/svg+xml')).toBe(false);
});
