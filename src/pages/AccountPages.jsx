import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, Button, Input, LabeledControl, PageHeader, VectorLoader } from '@kolkrabbi/kol-component'
import HomeStage from '../components/HomeStage'
import { getLibraryApi, useAccount, signInLibrary, signUpLibrary, signOutLibrary, updateAccount, mintInvite, requestInvite, listInviteRequests, inviteFromRequest, UnauthorizedError } from '../index.jsx'

/* THE ACCOUNT PAGES (plan 43 W2–W3, 2026-10-28) — sign in, sign up through an invite link, and your own page. Top-level
 * routes outside the Hub: a form wants the page to itself. The Hub's account row (HubAccountRow, kol-shell 0.85.0) signs in
 * in its own dialog and, signed in, opens /account; /signin is for a link or a device with no rail. */

const Field = ({ label, ...input }) => (
  <LabeledControl label={label}>
    <Input size="md" width="100%" {...input} />
  </LabeledControl>
)

function Frame({ title, subtitle, children }) {
  return (
    <main className="min-h-dvh bg-surface-primary flex justify-center px-4 py-16">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <PageHeader title={title} subtitle={subtitle} />
        {children}
      </div>
    </main>
  )
}

const initialOf = (u) => (u?.name || u?.email || '?').trim().charAt(0).toUpperCase()

/* FRAME C, AS THE USER DREW IT (2026-10-28, canvas frames "Create account" and "Sign in") — the mark top-left; an eyebrow,
 * the fields at the chooser's size and a line linking the other page in the middle; the one inverted button at the foot.
 * Escape goes Home. The earlier versions (plan-43 forms, the dialog button) are in `_tmp/2026-10-28-account-forms/`. */
function FrameC({ title, fields, okLabel, footer, check, onSubmit, done }) {
  const navigate = useNavigate()
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map((f) => [f.id, ''])))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate('/') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
  const submit = async (e) => {
    e.preventDefault()
    const bad = check?.(vals)
    if (bad) { setError(bad); return }
    setBusy(true); setError('')
    try { await onSubmit(vals) } catch (err) { setError(err instanceof UnauthorizedError ? 'Wrong email or password.' : err.message) } finally { setBusy(false) }
  }
  return (
    <main className="h-dvh bg-surface-primary flex">
      <form onSubmit={submit} className="w-[672px] max-md:w-full shrink-0 box-border px-20 py-[72px] max-md:px-4 max-md:py-8 flex flex-col justify-between gap-12">
        {/* the mark as the Hub draws it — VectorLoader inks it with the theme, not the OS */}
        <div className="w-24 h-24 -ml-2 text-emphasis"><VectorLoader src="/favicon/favicon.svg" size="100%" role="img" aria-label="FXR" /></div>
        <div className="flex flex-col gap-2 w-full max-w-[360px]">
          <span className="kol-eyebrow text-body">{title}</span>
          {fields.map((f, i) => (
            <Input
              key={f.id}
              type={f.type ?? 'text'}
              autoComplete={f.autoComplete}
              autoFocus={i === 0}
              placeholder={f.placeholder}
              aria-label={f.placeholder}
              size="md"
              value={vals[f.id]}
              onChange={(e) => setVals((v) => ({ ...v, [f.id]: e.target.value }))}
              className="w-full"
            />
          ))}
          {error && <p className="kol-mono-12 text-ui-error">{error}</p>}
          {done && <p className="kol-mono-12 text-emphasis">{done}</p>}
          <p className="kol-mono-12 text-meta mt-2">{footer.text} <Link to={footer.to} className="text-emphasis underline">{footer.link}</Link></p>
        </div>
        <Button type="submit" tone="inverted" size="md" className="self-start" disabled={busy || !!done}>{okLabel}</Button>
      </form>
      <div className="flex-1 relative bg-surface-secondary overflow-hidden max-md:hidden">
        <div className="absolute inset-0"><HomeStage /></div>
      </div>
    </main>
  )
}

function SignInC() {
  const navigate = useNavigate()
  return (
    <FrameC
      title="Sign in"
      okLabel="Sign in"
      fields={[
        { id: 'email', placeholder: 'Email', type: 'email', autoComplete: 'username' },
        { id: 'password', placeholder: 'Password', type: 'password', autoComplete: 'current-password' },
      ]}
      footer={{ text: "Don't have an account?", link: 'Sign up', to: '/join' }}
      onSubmit={async (v) => { await signInLibrary({ email: v.email.trim(), password: v.password }); navigate('/', { replace: true }) }}
    />
  )
}

function JoinC({ invite }) {
  const navigate = useNavigate()
  return (
    <FrameC
      title="Create account"
      okLabel="Create"
      fields={[
        { id: 'name', placeholder: 'Name', autoComplete: 'name' },
        { id: 'email', placeholder: 'Email', type: 'email', autoComplete: 'username' },
        { id: 'password', placeholder: 'Create Password', type: 'password', autoComplete: 'new-password' },
        { id: 'confirm', placeholder: 'Confirm Password', type: 'password', autoComplete: 'new-password' },
      ]}
      footer={{ text: 'Already have an account?', link: 'Sign in', to: '/signin' }}
      check={(v) => (v.password !== v.confirm ? 'The passwords do not match.' : v.password.length < 8 ? 'The password needs at least 8 characters.' : null)}
      onSubmit={async (v) => { await signUpLibrary({ invite, name: v.name, email: v.email.trim(), password: v.password }); navigate('/account', { replace: true }) }}
    />
  )
}

/* REQUEST AN INVITE (frame "C · Request an invite", approved 2026-10-28) — `/join` with no link: Name and Email, Request */
function RequestC() {
  const [done, setDone] = useState('')
  return (
    <FrameC
      title="Request an invite"
      okLabel="Request"
      fields={[
        { id: 'name', placeholder: 'Name', autoComplete: 'name' },
        { id: 'email', placeholder: 'Email', type: 'email', autoComplete: 'email' },
      ]}
      footer={{ text: 'Already have an account?', link: 'Sign in', to: '/signin' }}
      done={done}
      onSubmit={async (v) => { await requestInvite({ name: v.name, email: v.email.trim() }); setDone('Request sent.') }}
    />
  )
}

export function SignInPage() {
  const account = useAccount()
  if (account) return <Navigate to="/" replace />
  if (!getLibraryApi()) return <Frame title="Sign in" subtitle="Accounts are not configured on this build." />
  return <SignInC />
}

export function JoinPage() {
  const [params] = useSearchParams()
  const invite = params.get('invite') || ''
  if (!getLibraryApi()) return <Frame title="Create account" subtitle="Accounts are not configured on this build." />
  if (!invite) return <RequestC />
  return <JoinC invite={invite} />
}

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

/* the open invite requests — each turns into a one-use link to send (the app sends no email) */
function InviteRequests() {
  const [rows, setRows] = useState(null)
  const [links, setLinks] = useState({})
  useEffect(() => { listInviteRequests().then(setRows).catch(() => setRows([])) }, [])
  if (!rows?.length) return null
  return (
    <div className="flex flex-col gap-2">
      <span className="kol-eyebrow text-body">Invite requests</span>
      {rows.map((r) => (
        <div key={r.id} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="kol-mono-14 text-emphasis truncate">{r.name || r.email}</span>
            {r.name && <span className="kol-mono-12 text-meta truncate">{r.email}</span>}
            {!links[r.id] && <Button tone="grey" size="sm" className="ml-auto" onClick={async () => { const l = await inviteFromRequest(r.id); setLinks((m) => ({ ...m, [r.id]: l.url })) }}>Make invite</Button>}
          </div>
          {links[r.id] && <Input size="md" width="100%" readOnly value={links[r.id]} onFocus={(e) => e.target.select()} />}
        </div>
      ))}
    </div>
  )
}

export function AccountPage() {
  const navigate = useNavigate()
  const account = useAccount()
  const fileRef = useRef(null)
  const [name, setName] = useState(account?.name ?? '')
  const [invite, setInvite] = useState(null)
  const [error, setError] = useState('')
  /* a sign-out here lands on Home; arriving signed out goes to sign in */
  const leaving = useRef(false)
  if (!account) return <Navigate to={leaving.current ? '/' : '/signin'} replace />
  const run = async (fn) => { setError(''); try { await fn() } catch (err) { setError(err.message) } }
  const pickAvatar = (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run(async () => updateAccount({ avatar: await toAvatar(f) })) }
  return (
    <Frame title={account.name || 'Account'} subtitle={account.email}>
      <div className="flex items-center gap-4">
        <Avatar size="xl" initial={initialOf(account)} src={account.avatar ?? undefined} alt={account.name} />
        <div className="flex flex-col gap-2">
          <Button tone="grey" size="sm" iconLeft="upload" onClick={() => fileRef.current?.click()}>Upload picture</Button>
          {account.avatar && <Button tone="grey" size="sm" onClick={() => run(() => updateAccount({ avatar: null }))}>Remove picture</Button>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
        </div>
      </div>
      <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); run(() => updateAccount({ name })) }}>
        <Field label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" tone="grey" size="md" disabled={name.trim() === (account.name ?? '')}>Save name</Button>
      </form>
      <InviteRequests />
      <div className="flex flex-col gap-2">
        <Button tone="grey" size="md" iconLeft="plus" onClick={() => run(async () => setInvite(await mintInvite()))}>New invite link</Button>
        {invite && <Input size="md" width="100%" readOnly value={invite.url} onFocus={(e) => e.target.select()} />}
      </div>
      {error && <p className="kol-mono-12 text-ui-error">{error}</p>}
      <div className="flex gap-2">
        <Button tone="grey" size="md" onClick={() => navigate('/')}>Home</Button>
        <Button tone="grey" size="md" onClick={() => { leaving.current = true; signOutLibrary() }}>Sign out</Button>
      </div>
    </Frame>
  )
}
