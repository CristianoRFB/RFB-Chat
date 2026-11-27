import { describe, expect, it } from 'vitest';
import { dmId, normalizeMessage, otherMember } from '../src/chat-model';

describe('modelo de conversa individual', () => {
  it('gera um ID determinístico independente da ordem', () => {
    expect(dmId('alice', 'bob')).toBe(dmId('bob', 'alice'));
  });
  it('não permite conversa consigo mesmo', () => {
    expect(() => dmId('alice', 'alice')).toThrow();
  });
  it('normaliza e limita mensagem', () => {
    expect(normalizeMessage(' olá ')).toBe('olá');
    expect(() => normalizeMessage('  ')).toThrow();
    expect(() => normalizeMessage('x'.repeat(2001))).toThrow();
  });
  it('seleciona a outra pessoa', () => {
    expect(otherMember(['alice', 'bob'], 'alice')).toBe('bob');
  });
});
