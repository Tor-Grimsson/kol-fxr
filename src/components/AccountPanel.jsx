import { useEffect, useRef, useState } from 'react'
import { Avatar, Button, Input, RailHint, SettingsSections } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { useAccount, updateAccount, mintInvite, listInviteRequests, inviteFromRequest } from '../index.jsx'

/* THE ACCOUNT TAB (SettingsAccountTab, kol-shell 0.88.0 — user 2026-10-29: "why isnt account just in settings in account
 * tab?") — what the settings rail's Account tab holds, passed as `signIn.account.content`: Profile (picture with its hover-×,
 * Upload, name, email) and Invites (a new link, the open requests). THE SETTINGS TAB'S ANATOMY (user 2026-10-29: "this is
 * how to structure a tab") — `SettingsSections` divided, the 160 label column, every control at the tab's `sm`. Sign out is
 * the Hub's `account.footer` — frame D2's full-width button in the rail foot (kol-shell 0.90.0). The rail of its own
 * it used to be is in `_tmp/2026-10-29-account-rail/`, the page before that in `_tmp/2026-10-29-account-page/`. */

/* a picked photo → a 256px square webp data URL (centre crop), small enough for the account row */
function toAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const s = Math.min(img.width, img.height)
      const c = document.createElement('canvas')
      c.width = c.height = 256
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, 256, 256)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/webp', 0.85))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function AccountPanel() {
  const account = useAccount()
  const fileRef = useRef(null)
  const [name, setName] = useState(account?.name ?? '')
  const [link, setLink] = useState(null)
  const [requests, setRequests] = useState([])
  const [links, setLinks] = useState({})
  const [error, setError] = useState('')
  useEffect(() => { setName(account?.name ?? '') }, [account?.name])
  useEffect(() => { if (account) listInviteRequests().then(setRequests).catch(() => setRequests([])) }, [account?.id])
  if (!account) return null
  const run = async (fn) => { setError(''); try { await fn() } catch (err) { setError(err.message) } }
  const saveName = () => { if (name.trim() !== (account.name ?? '')) run(() => updateAccount({ name })) }
  const pickAvatar = (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(async () => updateAccount({ avatar: await toAvatar(f) })) }

  const linkRow = (id, url) => ({ id, label: 'Link', align: 'fill', value: <Input size="sm" preset="rail" width="100%" readOnly value={url} onFocus={(e) => e.target.select()} /> })
  const sections = [
    { label: 'Profile', rows: [
      { label: 'Picture', align: 'end', value: (
        <div className="flex items-center gap-2">
          {/* the picture removes itself: hover shows an × over it (user 2026-10-29 — a Remove button broke the row) */}
          {account.avatar
            ? (
              <button type="button" aria-label="Remove picture" className="group relative rounded-full cursor-pointer" onClick={() => run(() => updateAccount({ avatar: null }))}>
                <Avatar size="sm" initial="" src={account.avatar} alt={account.name} />
                <span className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 text-fg-96 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"><Icon name="x" size={16} /></span>
              </button>
            )
            : <Icon name="user" size={24} />}
          <Button size="sm" onClick={() => fileRef.current?.click()}>Upload</Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
        </div>
      ) },
      { label: 'Name', align: 'fill', value: <Input size="sm" preset="rail" width="100%" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} /> },
      { label: 'Email', value: account.email },
    ] },
    { label: 'Invites', rows: [
      { label: 'Invite', align: 'fill', value: <Button size="sm" className="w-full" onClick={() => run(async () => setLink((await mintInvite()).url))}>New invite link</Button> },
      ...(link ? [linkRow('link', link)] : []),
      ...requests.flatMap((r) => [
        { id: r.id, label: r.name || r.email, align: 'fill', value: (
          <div className="flex items-center gap-2 min-w-0">
            {r.name && <span className="kol-mono-12 text-meta truncate">{r.email}</span>}
            {!links[r.id] && <Button size="sm" className="ml-auto" onClick={() => run(async () => { const l = await inviteFromRequest(r.id); setLinks((m) => ({ ...m, [r.id]: l.url })) })}>Invite</Button>}
          </div>
        ) },
        ...(links[r.id] ? [linkRow(`${r.id}:link`, links[r.id])] : []),
      ]),
    ] },
  ]

  return (
    <div className="flex flex-col gap-6">
      <SettingsSections sections={sections} divided />
      {error && <RailHint className="text-ui-error">{error}</RailHint>}
    </div>
  )
}
