import { useEffect, useRef, useState } from 'react'
import { Avatar, Button, Input, RailActions, RailHint, RailRow, RailSection } from '@kolkrabbi/kol-component'
import { Icon } from '@kolkrabbi/kol-icons'
import { useAccount, updateAccount, mintInvite, listInviteRequests, inviteFromRequest } from '../index.jsx'

/* THE ACCOUNT TAB (SettingsAccountTab, kol-shell 0.88.0 — user 2026-10-29: "why isnt account just in settings in account
 * tab?") — what the settings rail's Account tab holds, passed as `signIn.account.content`: Profile (picture with its hover-×,
 * Upload, name, email) and Invites (a new link, the open requests), from the DS rail kit; Sign out is the tab's footer. The
 * rail of its own it used to be is in `_tmp/2026-10-29-account-rail/`, the page before that in `_tmp/2026-10-29-account-page/`. */

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

  return (
      <div className="flex flex-col gap-6">
        <RailSection label="Profile">
          <RailRow label="Picture">
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
          </RailRow>
          <RailRow label="Name">
            <Input preset="rail" width="100%" value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName} onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }} />
          </RailRow>
          <RailRow label="Email" text><span className="kol-mono-12 text-body truncate">{account.email}</span></RailRow>
        </RailSection>
        <RailSection label="Invites" divided>
          <RailActions>
            <Button size="md" onClick={() => run(async () => setLink((await mintInvite()).url))}>New invite link</Button>
          </RailActions>
          {link && <Input preset="rail" width="100%" readOnly value={link} onFocus={(e) => e.target.select()} />}
          {requests.map((r) => (
            <div key={r.id} className="flex flex-col gap-2">
              <RailRow label={r.name || r.email}>
                <div className="flex items-center gap-2 min-w-0">
                  {r.name && <span className="kol-mono-12 text-meta truncate">{r.email}</span>}
                  {!links[r.id] && <Button size="sm" className="ml-auto" onClick={() => run(async () => { const l = await inviteFromRequest(r.id); setLinks((m) => ({ ...m, [r.id]: l.url })) })}>Invite</Button>}
                </div>
              </RailRow>
              {links[r.id] && <Input preset="rail" width="100%" readOnly value={links[r.id]} onFocus={(e) => e.target.select()} />}
            </div>
          ))}
        </RailSection>
        {error && <RailHint className="text-ui-error">{error}</RailHint>}
      </div>
  )
}
