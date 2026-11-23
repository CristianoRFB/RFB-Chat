export const MAX_MESSAGE_LENGTH = 2000;

export function normalizeMessage(input: string): string {
  const body = input.trim();
  if (body.length === 0) throw new Error('Escreva uma mensagem.');
  if (body.length > MAX_MESSAGE_LENGTH) throw new Error('Limite de 2.000 caracteres.');
  return body;
}

export function dmId(firstUid: string, secondUid: string): string {
  if (!firstUid || !secondUid || firstUid === secondUid) {
    throw new Error('Selecione outra conta válida.');
  }
  const ids = [firstUid, secondUid].sort();
  return 'dm_' + ids[0] + '_' + ids[1];
}

export function otherMember(members: string[], uid: string): string {
  return members.find(member => member !== uid) ?? uid;
}
