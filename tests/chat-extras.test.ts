import { describe, expect, it } from 'vitest';
import { mergeMessages, filterMessages } from '../src/chat-extras';
import type { ChatMessage } from '../src/chat-data';

function message(id: string, created: number, body: string): ChatMessage {
  return { id, senderId: 'alice', body, createdAt: new Date(created), pending: false };
}
describe('paginação: composição de páginas', () => {
  it('combina sem duplicar e prioriza versão mais recente do snapshot', () => {
    expect(mergeMessages([message('a', 10, 'original'), message('b', 20, 'antiga')],
      [message('b', 20, 'editada'), message('c', 30, 'nova')])
      .map(item => item.body)).toEqual(['original', 'editada', 'nova']);
  });
});

it('busca sem acentos e exclui textos removidos de resultados e fixados', () => {
  const items = [message('a', 10, 'Olá equipe'), {...message('b', 20, 'Olá removido'), deletedAt: new Date(), pinned: true}, {...message('c', 30, 'Olá fixado'), pinned: true}];
  expect(filterMessages(items, 'OLA').map(m => m.id)).toEqual(['a','c']);
  expect(filterMessages(items, '', true).map(m => m.id)).toEqual(['c']);
});
