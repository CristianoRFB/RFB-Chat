import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  assertFails, assertSucceeds, initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp } from 'firebase/firestore';

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
  it('nega visitante sem autenticação', async () => {
    const visitor = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(visitor, 'profiles', 'alice')));
    await assertFails(getDoc(doc(visitor, 'conversations', conversationId)));
  });
});
