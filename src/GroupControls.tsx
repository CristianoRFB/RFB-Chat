import { useEffect, useState, type FormEvent } from 'react';
import {
  acceptGroupInvite, createGroup, declineGroupInvite, editGroupTitle,
  sendGroupInvite, setGroupAdmin, lookupName, type ChatConversation
} from './chat-data';

type Props = {
  uid: string;
  current?: ChatConversation;
  onCreated: (groupId: string) => void;
  onError: (error: unknown) => void;
};
export function GroupControls({ uid, current, onCreated, onError }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [target, setTarget] = useState('');
  const [roleUid, setRoleUid] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const group = current?.kind === 'group' ? current : undefined;
  const isAdmin = !!group?.adminIds?.includes(uid);
  const isOwner = group?.createdBy === uid;
  const [memberNames, setMemberNames] = useState<Record<string,string>>({});
  const memberKey=JSON.stringify(group?.memberIds??[]);
  useEffect(() => {
    let active=true;const members=JSON.parse(memberKey) as string[];
    setMemberNames({});
    if(members.length)void Promise.all(members.map(async member=>[member,await lookupName(member).catch(()=>member.slice(0,14))] as const)).then(entries=>{if(active)setMemberNames(Object.fromEntries(entries));});
    return()=>{active=false;};
  },[memberKey]);

  async function execute(job: () => Promise<void>, success: string) {
    setNotice('');
    setBusy(true);
    try { await job(); setNotice(success); }
    catch (error) { onError(error); }
    finally { setBusy(false); }
  }
  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await execute(async () => {
      const id = await createGroup(uid, name);
      onCreated(id);
      setName('');
    }, 'Grupo criado. Envie convites para adicionar membros.');
  }
  async function submitJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await execute(async () => {
      await acceptGroupInvite(code, uid);
      onCreated(code.trim());
      setCode('');
    }, 'Convite aceito. Você entrou no grupo.');
  }
  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!group) return;
    await execute(async () => {
      await sendGroupInvite(group.id, uid, target);
      setTarget('');
    }, 'Convite enviado. Compartilhe o código do grupo com a pessoa.');
  }
  return <div className="group-controls">
    <details>
      <summary>Criar grupo</summary>
      <form onSubmit={submitCreate} className="group-form">
        <label htmlFor="group-create-title">Nome do grupo</label>
        <input id="group-create-title" minLength={2} maxLength={80} required value={name}
          onChange={event => setName(event.target.value)} placeholder="Minha equipe" />
        <button disabled={busy || !name.trim()} type="submit">Criar grupo</button>
      </form>
    </details>
    <details>
      <summary>Aceitar convite</summary>
      <form onSubmit={submitJoin} className="group-form">
        <label htmlFor="join-group-code">Código do grupo</label>
        <input id="join-group-code" value={code} required placeholder="group_..." onChange={e => setCode(e.target.value)} />
        <button disabled={busy || !code.trim()} type="submit">Entrar no grupo</button>
        <button disabled={busy || !code.trim()} type="button" onClick={() => void execute(async () => {
          await declineGroupInvite(code, uid); setCode('');
        }, 'Convite recusado.')}>Recusar convite</button>
      </form>
    </details>
    {group && <div className="group-management">
      <label htmlFor="group-code" className="mini-label">Código para convidados</label>
      <input id="group-code" readOnly value={group.id} onFocus={e => e.currentTarget.select()} />
      <p className="mini-label">{group.memberIds.length} participantes, {group.adminIds?.length ?? 0} administradores</p>
      <details><summary>Participantes e cargos</summary><ul>{group.memberIds.map(member => <li key={member}>{memberNames[member] ?? member.slice(0,14)}{member === uid ? ' (você)' : ''} · {group.createdBy === member ? 'Criador' : group.adminIds?.includes(member) ? 'Admin' : 'Membro'}</li>)}</ul></details>
      {isAdmin && <>
        <form className="group-form" onSubmit={submitInvite}>
          <label htmlFor="invite-uid">Convidar pessoa por UID</label>
          <input id="invite-uid" required placeholder="UID da pessoa" value={target} onChange={e => setTarget(e.target.value)} />
          <button type="submit" disabled={busy || !target.trim()}>Enviar convite</button>
        </form>
        <form className="group-form" onSubmit={e => { e.preventDefault(); void execute(async () => {
          await editGroupTitle(group.id, newName); setNewName('');
        }, 'Nome alterado.'); }}>
          <label htmlFor="rename-group">Renomear grupo</label>
          <input id="rename-group" minLength={2} maxLength={80} value={newName} onChange={e => setNewName(e.target.value)} placeholder={group.title} />
          <button type="submit" disabled={busy || !newName.trim()}>Salvar nome</button>
        </form>
      </>}
      {isOwner && <form className="group-form" onSubmit={e => {
        e.preventDefault();
        void execute(() => setGroupAdmin(group.id, roleUid.trim(), !group.adminIds?.includes(roleUid.trim())),
          'Cargo atualizado.');
      }}>
        <label htmlFor="role-uid">Alterar cargo de participante</label>
        <select id="role-uid" value={roleUid} onChange={e => setRoleUid(e.target.value)} required>
          <option value="">Escolha o UID</option>
          {group.memberIds.filter(member => member !== uid).map(member =>
            <option key={member} value={member}>{member.slice(0, 14)} · {group.adminIds?.includes(member) ? 'Admin' : 'Membro'}</option>)}
        </select>
        <button type="submit" disabled={busy || !roleUid}>Alternar administrador</button>
      </form>}
    </div>}
    {notice && <p className="group-notice" role="status">{notice}</p>}
  </div>;
}
