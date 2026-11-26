import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp, writeBatch, limit } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;
const projectId = 'demo-rfb-chat';
const conversationId = 'dm_alice_bob';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules: readFileSync('firestore.rules', 'utf8')
    }
  });
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, 'profiles', 'alice'), { uid: 'alice', displayName: 'Alice', createdAt: new Date() });
    await setDoc(doc(db, 'profiles', 'bob'), { uid: 'bob', displayName: 'Bob', createdAt: new Date() });
    await setDoc(doc(db, 'profiles', 'mallory'), { uid: 'mallory', displayName: 'Mallory', createdAt: new Date() });
    await setDoc(doc(db, 'conversations', conversationId), {
      kind: 'dm', createdBy: 'alice', memberIds: ['alice', 'bob'], createdAt: new Date()
    });
  });
});

afterAll(async () => { if (testEnv) await testEnv.cleanup(); });

describe('Firestore Rules: isolamento de conversas', () => {
  it('permite ler perfil individual com login e proíbe enumerar todos', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDoc(doc(alice, 'profiles', 'bob')));
    await assertFails(getDocs(collection(alice, 'profiles')));
  });
  it('não permite ler uma conversa alheia ou suas mensagens', async () => {
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    await assertFails(getDoc(doc(mallory, 'conversations', conversationId)));
    await assertFails(getDocs(collection(mallory, 'conversations', conversationId, 'messages')));
    await assertFails(setDoc(doc(collection(mallory, 'conversations', conversationId, 'messages')), {
      senderId: 'mallory', body: 'invasão', createdAt: serverTimestamp()
    }));
  });
  it('permite membro listar conversas e publicar mensagem própria', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(getDocs(query(collection(alice, 'conversations'), where('memberIds', 'array-contains', 'alice'))));
    await assertSucceeds(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      senderId: 'alice', body: 'Olá, Bob!', createdAt: serverTimestamp()
    }));
    const bob = testEnv.authenticatedContext('bob').firestore();
    await assertSucceeds(getDocs(collection(bob, 'conversations', conversationId, 'messages')));
  });
  it('nega falsificação de remetente e mensagens vazias', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    await assertFails(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      senderId: 'bob', body: 'falso', createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      senderId: 'alice', body: '', createdAt: serverTimestamp()
    }));
  });
  it('cria conversa válida sem ler documento inexistente', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const target = doc(alice, 'conversations', 'dm_alice_mallory');
    await assertFails(getDoc(target));
    await assertSucceeds(setDoc(target, {
      kind: 'dm',
      createdBy: 'alice',
      memberIds: ['alice', 'mallory'],
      createdAt: serverTimestamp()
    }));
    await assertSucceeds(getDoc(target));
  });
  it('resposta e edição autorizada somente ao remetente', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const parent = doc(alice, 'conversations', conversationId, 'messages', 'original-test');
    await assertSucceeds(setDoc(parent, {
      senderId: 'alice', body: 'Mensagem original', createdAt: serverTimestamp()
    }));
    const reply = doc(bob, 'conversations', conversationId, 'messages', 'reply-test');
    await assertSucceeds(setDoc(reply, {
      senderId: 'bob', body: 'Resposta', replyToId: 'original-test',
      createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(bob, 'conversations', conversationId, 'messages', 'invalid-reply'), {
      senderId: 'bob', body: 'Sem pai', replyToId: 'nao-existe',
      createdAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(parent, { body: 'Mensagem corrigida', editedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(bob, 'conversations', conversationId, 'messages', 'original-test'), {
      body: 'Falsificada', editedAt: serverTimestamp()
    }));
    await assertFails(updateDoc(parent, { senderId: 'bob', editedAt: serverTimestamp() }));
  });
  it('reações exigem membro, identidade correta e emoji permitido', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    const message = doc(alice, 'conversations', conversationId, 'messages', 'reaction-target');
    await assertSucceeds(setDoc(message, {
      senderId: 'alice', body: 'Reaja!', createdAt: serverTimestamp()
    }));
    const ownReaction = doc(alice, 'conversations', conversationId, 'messages', 'reaction-target', 'reactions', 'alice');
    await assertSucceeds(setDoc(ownReaction, { emoji: '👍', createdAt: serverTimestamp() }));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'messages', 'reaction-target', 'reactions', 'bob'), {
      emoji: '🎉', createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(mallory, 'conversations', conversationId, 'messages', 'reaction-target', 'reactions', 'mallory'), {
      emoji: '❤️', createdAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(ownReaction, { emoji: '🎉' }));
    await assertFails(updateDoc(ownReaction, { emoji: 'invalido' }));
    await assertSucceeds(deleteDoc(ownReaction));
  });
  it('marcador de leitura só pode ser gravado pelo próprio membro', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    const self = doc(alice, 'conversations', conversationId, 'reads', 'alice');
    await assertSucceeds(setDoc(self, { lastReadAt: serverTimestamp() }));
    await assertSucceeds(getDoc(doc(bob, 'conversations', conversationId, 'reads', 'alice')));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'reads', 'bob'), {
      lastReadAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(mallory, 'conversations', conversationId, 'reads', 'mallory'), {
      lastReadAt: serverTimestamp()
    }));
  });
  it('grupo exige convite aceito para tornar usuário membro', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    const groupId = 'group_123456789012';
    const groupAlice = doc(alice, 'conversations', groupId);
    await assertSucceeds(setDoc(groupAlice, {
      kind: 'group', title: 'Equipe de QA', createdBy: 'alice',
      adminIds: ['alice'], memberIds: ['alice'], createdAt: serverTimestamp()
    }));
    await assertFails(getDoc(doc(bob, 'conversations', groupId)));
    await assertFails(updateDoc(doc(bob, 'conversations', groupId), { memberIds: arrayUnion('bob') }));
    const inviteAlice = doc(alice, 'conversations', groupId, 'invites', 'bob');
    await assertSucceeds(setDoc(inviteAlice, {
      targetUid: 'bob', invitedBy: 'alice', status: 'pending', createdAt: serverTimestamp()
    }));
    await assertSucceeds(getDoc(doc(bob, 'conversations', groupId, 'invites', 'bob')));
    await assertFails(updateDoc(inviteAlice, { status: 'accepted' }));
    await assertSucceeds(updateDoc(doc(bob, 'conversations', groupId, 'invites', 'bob'), { status: 'accepted' }));
    await assertSucceeds(updateDoc(doc(bob, 'conversations', groupId), { memberIds: arrayUnion('bob') }));
    await assertSucceeds(getDoc(doc(bob, 'conversations', groupId)));
    await assertFails(getDoc(doc(mallory, 'conversations', groupId)));
    await assertFails(updateDoc(doc(bob, 'conversations', groupId), { memberIds: arrayUnion('mallory') }));
    await assertSucceeds(updateDoc(groupAlice, { adminIds: arrayUnion('bob') }));
    await assertFails(updateDoc(doc(bob, 'conversations', groupId), { adminIds: arrayUnion('mallory') }));
    await assertSucceeds(updateDoc(doc(bob, 'conversations', groupId), { title: 'Equipe de testes' }));
  });
  it('preferências e bloqueio permanecem privados; bloqueio impede novas mensagens', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const privateRef = doc(alice, 'userPrivate', 'alice');
    await assertSucceeds(setDoc(privateRef, {
      blockedUids: ['bob'], notificationsEnabled: true, readReceiptsEnabled: false
    }));
    await assertFails(getDoc(doc(bob, 'userPrivate', 'alice')));
    await assertSucceeds(getDoc(privateRef));
    await assertFails(setDoc(doc(bob, 'userPrivate', 'alice'), {
      blockedUids: [], notificationsEnabled: false, readReceiptsEnabled: true
    }));
    await assertFails(setDoc(doc(collection(bob, 'conversations', conversationId, 'messages')), {
      senderId: 'bob', body: 'Mensagem bloqueada', createdAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(privateRef, { blockedUids: [] }));
  });
  it('denúncia é criada pelo membro e só moderador pode listar', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const moderator = testEnv.authenticatedContext('moderator', { moderator: true }).firestore();
    const report = doc(alice, 'reports', 'test-report-01');
    const payload={reporterId:'alice',reportedUid:'bob',conversationId,reason:'Mensagem indevida dentro da conversa',status:'open',createdAt:serverTimestamp()};
    await assertFails(setDoc(report,payload));
    const batch=writeBatch(alice);batch.set(report,payload);batch.set(doc(alice,'reportRate','alice'),{reportId:'test-report-01',createdAt:serverTimestamp()});
    await assertSucceeds(batch.commit());
    const duplicate=writeBatch(alice);duplicate.set(doc(alice,'reports','test-report-repeat'),payload);duplicate.set(doc(alice,'reportRate','alice'),{reportId:'test-report-repeat',createdAt:serverTimestamp()});
    await assertFails(duplicate.commit());
    await assertSucceeds(getDoc(report));
    await assertFails(getDoc(doc(bob, 'reports', 'test-report-01')));
    await assertFails(getDocs(collection(alice, 'reports')));
    await assertSucceeds(getDocs(collection(moderator, 'reports')));
    async function audit(status:'reviewed'|'closed'){
      const ref=doc(moderator,'reports','test-report-01'),batch=writeBatch(moderator);
      batch.update(ref,{status,resolvedAt:serverTimestamp(),reviewedBy:'moderator'});
      batch.set(doc(ref,'events',status),{status,actorId:'moderator',createdAt:serverTimestamp()});
      return batch.commit();
    }
    await assertFails(updateDoc(doc(moderator,'reports','test-report-01'),{status:'reviewed',resolvedAt:serverTimestamp(),reviewedBy:'moderator'}));
    await assertSucceeds(audit('reviewed'));
    await assertFails(updateDoc(doc(moderator, 'reports', 'test-report-01'), { status: 'reviewed', resolvedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(moderator, 'reports', 'test-report-01'), { status: 'closed', resolvedAt: new Date('2020-01-01') }));
    await assertSucceeds(audit('closed'));
    await assertFails(updateDoc(doc(moderator,'reports','test-report-01','events','reviewed'),{actorId:'forged'}));
    await assertFails(updateDoc(doc(moderator, 'reports', 'test-report-01'), { status: 'reviewed', resolvedAt: serverTimestamp() }));
    await assertFails(updateDoc(report, { status: 'closed' }));
  });
  it('áudio com consentimento deve ser pequeno e ter MIME permitido', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    const payload = { senderId: 'alice', body: 'Mensagem de voz', kind: 'audio',
      mimeType: 'audio/webm', audioData: 'data:audio/webm;base64,QUJDRA==',
      durationMs: 1000, createdAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), payload));
    await assertFails(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      ...payload, mimeType: 'text/html'
    }));
    await assertFails(setDoc(doc(collection(alice, 'conversations', conversationId, 'messages')), {
      ...payload, audioData: 'data:text/html;base64,QUJDRA=='
    }));
    await assertFails(setDoc(doc(collection(mallory, 'conversations', conversationId, 'messages')), {
      ...payload, senderId: 'mallory'
    }));
  });
  it('arquivo temporário limitado a membro, tamanho e 24 horas', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    const file = doc(alice, 'conversations', conversationId, 'attachments', 'test-file-01');
    const payload = {
      ownerId: 'alice', filename: 'relatorio.txt', mimeType: 'text/plain',
      dataUrl: 'data:text/plain;base64,VGVzdGU=', byteSize: 5,
      createdAt: serverTimestamp(), expiresAt: new Date(Date.now() + 30 * 60 * 1000)
    };
    await assertSucceeds(setDoc(file, payload));
    await assertSucceeds(getDoc(doc(bob, 'conversations', conversationId, 'attachments', 'test-file-01')));
    await assertFails(getDoc(doc(mallory, 'conversations', conversationId, 'attachments', 'test-file-01')));
    await assertFails(getDocs(collection(alice, 'conversations', conversationId, 'attachments')));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'attachments', 'expired-file'), {
      ...payload, expiresAt: new Date(Date.now() - 60 * 1000)
    }));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'attachments', 'too-long'), {
      ...payload, expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    }));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'attachments', 'bad-mime'), {
      ...payload, mimeType: 'text/html', dataUrl: 'data:text/html;base64,PHNjcmlwdD4='
    }));
  });
  it('entrega e leitura exigem carimbo do servidor e dono do marcador', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const marker = doc(bob, 'conversations', conversationId, 'reads', 'bob');
    await assertSucceeds(setDoc(marker, { lastDeliveredAt: serverTimestamp() }));
    await assertSucceeds(setDoc(marker, { lastReadAt: serverTimestamp() }, { merge: true }));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'reads', 'bob'), {
      lastDeliveredAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(bob, 'conversations', conversationId, 'reads', 'bob'), {
      lastDeliveredAt: new Date(2000, 0, 1)
    }, { merge: true }));
  });
  it('chamadas WebRTC locais exigem membro, papel correto e oferta/resposta validada', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const mallory = testEnv.authenticatedContext('mallory').firestore();
    const call = doc(alice, 'conversations', conversationId, 'calls', 'call-001');
    await assertSucceeds(setDoc(call, {
      initiatorId: 'alice', calleeId: 'bob', status: 'ringing',
      offer: 'sdp-oferta-teste', createdAt: serverTimestamp()
    }));
    await assertSucceeds(getDoc(doc(bob, 'conversations', conversationId, 'calls', 'call-001')));
    await assertFails(getDoc(doc(mallory, 'conversations', conversationId, 'calls', 'call-001')));
    await assertFails(updateDoc(call, {
      status: 'connected', answer: 'fake-offer', answeredAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(doc(bob, 'conversations', conversationId, 'calls', 'call-001'), {
      status: 'connected', answer: 'sdp-resposta', answeredAt: serverTimestamp()
    }));
    await assertSucceeds(setDoc(doc(collection(alice, 'conversations', conversationId, 'calls', 'call-001', 'ice')), {
      senderId: 'alice', candidate: 'candidato-de-teste', createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(collection(mallory, 'conversations', conversationId, 'calls', 'call-001', 'ice')), {
      senderId: 'mallory', candidate: 'candidato-indevido', createdAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(call, { status: 'ended', endedAt: serverTimestamp() }));
    await assertFails(updateDoc(call, { status: 'connected', answer: 'nova-resposta', answeredAt: serverTimestamp() }));
  });
  it('canais de grupo requerem admin para criar e membro para conversar', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const id = 'group_456789012345';
    await assertSucceeds(setDoc(doc(alice, 'conversations', id), {
      kind: 'group', title: 'Canais do teste', createdBy: 'alice',
      adminIds: ['alice'], memberIds: ['alice'], createdAt: serverTimestamp()
    }));
    const channel = doc(alice, 'conversations', id, 'channels', 'channel-01');
    await assertSucceeds(setDoc(channel, {
      name: 'Avisos', description: 'Canal de avisos de testes',
      createdBy: 'alice', createdAt: serverTimestamp()
    }));
    await assertFails(getDoc(doc(bob, 'conversations', id, 'channels', 'channel-01')));
    await assertFails(setDoc(doc(bob, 'conversations', id, 'channels', 'channel-02'), {
      name: 'Inválido', description: '', createdBy: 'bob', createdAt: serverTimestamp()
    }));
    const message = doc(alice, 'conversations', id, 'channels', 'channel-01', 'messages', 'm1');
    await assertSucceeds(setDoc(message, {
      senderId: 'alice', body: 'Anúncio para membros', createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(bob, 'conversations', id, 'channels', 'channel-01', 'messages', 'm2'), {
      senderId: 'bob', body: 'Sem acesso', createdAt: serverTimestamp()
    }));
    await assertFails(updateDoc(doc(bob, 'conversations', id, 'channels', 'channel-01'), { name: 'Invasão' }));
    await assertSucceeds(updateDoc(channel, { name: 'Informações' }));
  });
  it('bloqueio interrompe chamadas, ICE, reações e novos arquivos em DMs', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const bob = testEnv.authenticatedContext('bob').firestore();
    const message = doc(alice, 'conversations', conversationId, 'messages', 'block-hardening-msg');
    await assertSucceeds(setDoc(message, {
      senderId: 'alice', body: 'Mensagem anterior ao bloqueio', createdAt: serverTimestamp()
    }));
    const reaction = doc(bob, 'conversations', conversationId, 'messages', 'block-hardening-msg', 'reactions', 'bob');
    await assertSucceeds(setDoc(reaction, { emoji: '👍', createdAt: serverTimestamp() }));
    const file = doc(alice, 'conversations', conversationId, 'attachments', 'block-hardening-file');
    const fileInfo = { ownerId: 'alice', filename: 'teste.txt', mimeType: 'text/plain',
      dataUrl: 'data:text/plain;base64,VGVzdGU=', byteSize: 5,
      createdAt: serverTimestamp(), expiresAt: new Date(Date.now() + 10 * 60_000) };
    await assertSucceeds(setDoc(file, fileInfo));
    const call = doc(bob, 'conversations', conversationId, 'calls', 'block-hardening-call');
    await assertSucceeds(setDoc(call, {
      initiatorId: 'bob', calleeId: 'alice', offer: 'sdp-de-teste',
      status: 'ringing', createdAt: serverTimestamp()
    }));
    const pref = doc(alice, 'userPrivate', 'alice');
    await assertSucceeds(setDoc(pref, {
      blockedUids: ['bob'], notificationsEnabled: true, readReceiptsEnabled: true
    }));
    await assertFails(setDoc(doc(bob, 'conversations', conversationId, 'calls', 'blocked-new'), {
      initiatorId: 'bob', calleeId: 'alice', offer: 'tentativa-indevida',
      status: 'ringing', createdAt: serverTimestamp()
    }));
    await assertFails(updateDoc(call, {
      status: 'connected', answer: 'sdp-reposta', answeredAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(collection(bob, 'conversations', conversationId, 'calls', 'block-hardening-call', 'ice')), {
      senderId: 'bob', candidate: 'candidate-invalido', createdAt: serverTimestamp()
    }));
    await assertFails(updateDoc(reaction, { emoji: '❤️' }));
    await assertFails(setDoc(doc(bob, 'conversations', conversationId, 'messages', 'block-hardening-msg', 'reactions', 'bob2'), {
      emoji: '🎉', createdAt: serverTimestamp()
    }));
    await assertFails(setDoc(doc(bob, 'conversations', conversationId, 'attachments', 'blocked-file'), {
      ...fileInfo, ownerId: 'bob'
    }));
    await assertFails(updateDoc(message, {
      body: 'Também bloqueada para edição', editedAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(call, { status: 'ended', endedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(reaction));
    await assertFails(deleteDoc(doc(bob, 'conversations', conversationId, 'attachments', 'block-hardening-file')));
    await assertSucceeds(deleteDoc(file));
    // As Rules deliberadamente negam get sobre documento inexistente:
    // resource.data não existe para avaliar expiresAt.
    await assertFails(getDoc(file));
    await assertSucceeds(updateDoc(pref, { blockedUids: [] }));
  });
  it('mensagem de áudio não pode ser transformada em texto por edição', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const audio = doc(alice, 'conversations', conversationId, 'messages', 'audio-immutable');
    await assertSucceeds(setDoc(audio, {
      senderId: 'alice', body: 'Mensagem de voz', kind: 'audio',
      mimeType: 'audio/webm', audioData: 'data:audio/webm;base64,QUJD',
      durationMs: 900, createdAt: serverTimestamp()
    }));
    await assertFails(updateDoc(audio, { body: 'Transcrição arbitrária', editedAt: serverTimestamp() }));
  });
  it('ICE não aceita candidatos após término da chamada', async () => {
    const alice = testEnv.authenticatedContext('alice').firestore();
    const call = doc(alice, 'conversations', conversationId, 'calls', 'finished-ice');
    await assertSucceeds(setDoc(call, {
      initiatorId: 'alice', calleeId: 'bob', offer: 'sdp', status: 'ringing', createdAt: serverTimestamp()
    }));
    await assertSucceeds(updateDoc(call, { status: 'ended', endedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(alice, 'conversations', conversationId, 'calls', 'finished-ice', 'ice', 'after-end'), {
      senderId: 'alice', candidate: 'ice-data', createdAt: serverTimestamp()
    }));
  });
  it('nega visitante sem autenticação', async () => {
    const visitor = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(visitor, 'profiles', 'alice')));
    await assertFails(getDoc(doc(visitor, 'conversations', conversationId)));
  });
});

describe('EVOLVE 01 — ações de mensagem', () => {
  it('autor pode excluir texto; destinatário não pode excluir nem restaurar', async () => {
    const a = testEnv.authenticatedContext('alice').firestore();
    const b = testEnv.authenticatedContext('bob').firestore();
    const x = doc(a, 'conversations', conversationId, 'messages', 'evolve-delete');
    const y = doc(b, 'conversations', conversationId, 'messages', 'evolve-delete');
    await testEnv.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), 'conversations', conversationId, 'messages', 'evolve-delete'), {senderId:'alice', body:'secret text', createdAt:new Date()}); });
    await assertFails(updateDoc(y, {body:'Mensagem excluída', deletedAt:serverTimestamp(), pinned:false}));
    await assertSucceeds(updateDoc(x, {body:'Mensagem excluída', deletedAt:serverTimestamp(), pinned:false}));
    expect((await getDoc(y)).data()?.body).toBe('Mensagem excluída');
    await assertFails(updateDoc(x, {body:'restored', editedAt:serverTimestamp()}));
  });
  it('nega pin por não membro e encaminhamento falsificado', async () => {
    const a = testEnv.authenticatedContext('alice').firestore();
    const m = testEnv.authenticatedContext('mallory').firestore();
    await testEnv.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), 'conversations', conversationId, 'messages', 'evolve-pin'), {senderId:'alice', body:'pin me', createdAt:new Date()}); });
    await assertFails(updateDoc(doc(m,'conversations',conversationId,'messages','evolve-pin'), {pinned:true}));
    await assertFails(setDoc(doc(a,'conversations',conversationId,'messages','evolve-spoof'), {senderId:'bob', body:'spoof', forwarded:true, createdAt:serverTimestamp()}));
  });
});

describe('EVOLVE 01 — presença e ações permitidas', () => {
  it('presença requer identidade própria, membership e carimbo de servidor', async () => {
    const a = testEnv.authenticatedContext('alice').firestore();
    const b = testEnv.authenticatedContext('bob').firestore();
    const m = testEnv.authenticatedContext('mallory').firestore();
    const own = doc(a,'conversations',conversationId,'presence','alice');
    await testEnv.withSecurityRulesDisabled(async ctx => {
      await setDoc(doc(ctx.firestore(),'userPrivate','alice'), {blockedUids:[],notificationsEnabled:true,readReceiptsEnabled:true});
      await setDoc(doc(ctx.firestore(),'userPrivate','bob'), {blockedUids:[],notificationsEnabled:true,readReceiptsEnabled:true});
    });
    await assertSucceeds(setDoc(own,{typing:true,updatedAt:serverTimestamp()}));
    await assertSucceeds(getDoc(doc(b,'conversations',conversationId,'presence','alice')));
    await assertFails(setDoc(doc(b,'conversations',conversationId,'presence','alice'),{typing:false,updatedAt:serverTimestamp()}));
    await assertFails(getDoc(doc(m,'conversations',conversationId,'presence','alice')));
    await assertFails(setDoc(own,{typing:true,updatedAt:new Date(0)}));
    await assertSucceeds(deleteDoc(own));
  });
  it('fixação e encaminhamento de texto são permitidos para membros; pin não permite editar texto alheio', async () => {
    const a = testEnv.authenticatedContext('alice').firestore();
    const b = testEnv.authenticatedContext('bob').firestore();
    const msg = doc(a,'conversations',conversationId,'messages','evolve-forward-ok');
    await assertSucceeds(setDoc(msg,{senderId:'alice',body:'texto encaminhado',forwarded:true,createdAt:serverTimestamp()}));
    const other = doc(b,'conversations',conversationId,'messages','evolve-forward-ok');
    await assertSucceeds(updateDoc(other,{pinned:true}));
    await assertFails(updateDoc(other,{pinned:false,body:'alterado por outro'}));
    await assertSucceeds(updateDoc(other,{pinned:false}));
  });
});

it('EVOLVE 01: proíbe responder ou reagir a texto excluído e presença após bloqueio', async () => {
  const a = testEnv.authenticatedContext('alice').firestore();
  const b = testEnv.authenticatedContext('bob').firestore();
  await testEnv.withSecurityRulesDisabled(async ctx => {
    const d = ctx.firestore();
    await setDoc(doc(d,'conversations',conversationId,'messages','evolve-removed'),{senderId:'alice',body:'Mensagem excluída',createdAt:new Date(),deletedAt:new Date(),pinned:false});
    await setDoc(doc(d,'userPrivate','alice'),{blockedUids:[],notificationsEnabled:true,readReceiptsEnabled:true});
    await setDoc(doc(d,'userPrivate','bob'),{blockedUids:[],notificationsEnabled:true,readReceiptsEnabled:true});
  });
  await assertFails(setDoc(doc(b,'conversations',conversationId,'messages','evolve-reply-deleted'),{senderId:'bob',body:'resposta',replyToId:'evolve-removed',createdAt:serverTimestamp()}));
  await assertFails(setDoc(doc(b,'conversations',conversationId,'messages','evolve-removed','reactions','bob'),{emoji:'👍',createdAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(a,'userPrivate','alice'),{blockedUids:['bob']}));
  await assertFails(setDoc(doc(b,'conversations',conversationId,'presence','bob'),{typing:true,updatedAt:serverTimestamp()}));
  await assertSucceeds(updateDoc(doc(a,'userPrivate','alice'),{blockedUids:[]}));
});

it('EVOLVE 02: índice de mídia atômico, privado e revogável',async()=>{
 const a=testEnv.authenticatedContext('alice').firestore(), b=testEnv.authenticatedContext('bob').firestore(), m=testEnv.authenticatedContext('mallory').firestore();
 const meta={ownerId:'alice',filename:'video.webm',mimeType:'video/webm',byteSize:3,createdAt:serverTimestamp(),expiresAt:new Date(Date.now()+3600000)};
 const file=doc(a,'conversations',conversationId,'attachments','media-evolve'), index=doc(a,'conversations',conversationId,'mediaIndex','media-evolve');
 await assertFails(setDoc(index,meta));
 const batch=writeBatch(a); batch.set(file,{...meta,dataUrl:'data:video/webm;base64,QUJD'});batch.set(index,meta);await assertSucceeds(batch.commit());
 await assertSucceeds(getDocs(query(collection(b,'conversations',conversationId,'mediaIndex'),limit(50))));
 await assertFails(getDocs(query(collection(m,'conversations',conversationId,'mediaIndex'),limit(50))));
 await assertFails(getDocs(collection(b,'conversations',conversationId,'attachments')));
 await assertFails(deleteDoc(file));
 const revoke=writeBatch(a);revoke.delete(file);revoke.delete(index);await assertSucceeds(revoke.commit());
 expect((await getDoc(doc(b,'conversations',conversationId,'mediaIndex','media-evolve'))).exists()).toBe(false);
});

it('EVOLVE 02: áudio de 60s permitido; acima do limite negado',async()=>{
 const a=testEnv.authenticatedContext('alice').firestore(); const payload={senderId:'alice',body:'Mensagem de voz',kind:'audio',mimeType:'audio/webm',audioData:'data:audio/webm;base64,QUJD',durationMs:60000,createdAt:serverTimestamp()};
 await assertSucceeds(setDoc(doc(a,'conversations',conversationId,'messages','long-audio'),payload));
 await assertFails(setDoc(doc(a,'conversations',conversationId,'messages','too-long-audio'),{...payload,durationMs:60001}));
});

it('EVOLVE 02: purga local exclui bytes e índice expirados, preserva arquivo ativo', async()=>{
 const a=testEnv.authenticatedContext('alice').firestore();
 const expired='purge-expired', active='purge-active';
 await testEnv.withSecurityRulesDisabled(async ctx=>{
  const d=ctx.firestore();
  for(const [id,expiresAt] of [[expired,new Date(Date.now()-60000)],[active,new Date(Date.now()+3600000)]] as const){
   const metadata={ownerId:'alice',filename:id+'.txt',mimeType:'text/plain',byteSize:3,createdAt:new Date(),expiresAt};
   await setDoc(doc(d,'conversations',conversationId,'attachments',id),{...metadata,dataUrl:'data:text/plain;base64,QUJD'});
   await setDoc(doc(d,'conversations',conversationId,'mediaIndex',id),metadata);
  }
 });
 await assertFails(getDoc(doc(a,'conversations',conversationId,'attachments',expired)));
 await promisify(execFile)(process.execPath,['scripts/purge-expired-media.mjs']);
 await testEnv.withSecurityRulesDisabled(async ctx=>{
  const d=ctx.firestore();
  expect((await getDoc(doc(d,'conversations',conversationId,'attachments',expired))).exists()).toBe(false);
  expect((await getDoc(doc(d,'conversations',conversationId,'mediaIndex',expired))).exists()).toBe(false);
  expect((await getDoc(doc(d,'conversations',conversationId,'attachments',active))).exists()).toBe(true);
 });
},30000);

it('EVOLVE 03: controle de conta requer admin, evento atômico e impede autoelevação',async()=>{
 const a=testEnv.authenticatedContext('alice').firestore(), b=testEnv.authenticatedContext('bob').firestore();
 const admin=testEnv.authenticatedContext('admin-qa',{admin:true}).firestore(), mod=testEnv.authenticatedContext('moderator',{moderator:true}).firestore();
 const data={role:'moderator',status:'suspended',reason:'Teste de controle auditado',actorId:'admin-qa',updatedAt:serverTimestamp(),eventId:'suspend-bob'};
 const target=doc(admin,'accountControls','bob'),event=doc(admin,'accountControls','bob','events','suspend-bob');
 await assertFails(setDoc(doc(b,'accountControls','bob'),{...data,actorId:'bob'}));
 await assertFails(setDoc(doc(mod,'accountControls','bob'),{...data,actorId:'moderator'}));
 await assertFails(setDoc(target,data));
 const batch=writeBatch(admin);batch.set(target,data);batch.set(event,data);await assertSucceeds(batch.commit());
 await assertSucceeds(getDoc(doc(b,'accountControls','bob')));
 await assertFails(getDoc(doc(a,'accountControls','bob')));
 await assertFails(getDoc(doc(b,'accountControls','bob','events','suspend-bob')));
 await assertFails(updateDoc(event,{reason:'alterado'}));
 await assertSucceeds(getDoc(doc(b,'conversations',conversationId)));
 await assertFails(setDoc(doc(b,'conversations',conversationId,'messages','suspended-send'),{senderId:'bob',body:'bloqueado',createdAt:serverTimestamp()}));
 const ban={...data,status:'banned',eventId:'ban-bob',updatedAt:serverTimestamp()};
 const banBatch=writeBatch(admin);banBatch.set(target,ban);banBatch.set(doc(admin,'accountControls','bob','events','ban-bob'),ban);await assertSucceeds(banBatch.commit());
 await assertFails(getDoc(doc(b,'conversations',conversationId)));
 await assertFails(getDocs(collection(b,'conversations',conversationId,'messages')));
 const restore={...data,role:'member',status:'active',eventId:'restore-bob',updatedAt:serverTimestamp()};
 const restoreBatch=writeBatch(admin);restoreBatch.set(target,restore);restoreBatch.set(doc(admin,'accountControls','bob','events','restore-bob'),restore);await assertSucceeds(restoreBatch.commit());
 await assertSucceeds(setDoc(doc(b,'conversations',conversationId,'messages','restored-send'),{senderId:'bob',body:'restaurado',createdAt:serverTimestamp()}));
});

it('EVOLVE 03: solicitações de privacidade pertencem ao titular e só admin inicia análise',async()=>{
 const a=testEnv.authenticatedContext('alice').firestore(),b=testEnv.authenticatedContext('bob').firestore();
 const mod=testEnv.authenticatedContext('moderator',{moderator:true}).firestore(),admin=testEnv.authenticatedContext('admin-qa',{admin:true}).firestore();
 const payload={ownerId:'alice',kind:'erasure',status:'submitted',note:'Solicitação sintética',createdAt:serverTimestamp()};
 const ref=doc(a,'privacyRequests','alice_erasure');
 await assertSucceeds(setDoc(ref,payload));await assertSucceeds(getDoc(ref));
 await assertFails(getDoc(doc(b,'privacyRequests','alice_erasure')));
 await assertFails(setDoc(doc(b,'privacyRequests','alice_access'),{...payload,kind:'access'}));
 await assertFails(updateDoc(ref,{status:'under_review'}));
 await assertFails(updateDoc(doc(mod,'privacyRequests','alice_erasure'),{status:'under_review',reviewedBy:'moderator',reviewedAt:serverTimestamp()}));
 await assertSucceeds(updateDoc(doc(admin,'privacyRequests','alice_erasure'),{status:'under_review',reviewedBy:'admin-qa',reviewedAt:serverTimestamp()}));
 await assertFails(updateDoc(doc(admin,'privacyRequests','alice_erasure'),{status:'fulfilled'}));
});
