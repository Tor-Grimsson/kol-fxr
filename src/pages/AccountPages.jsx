import { useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Avatar, Button, Input, LabeledControl, ModalProvider, PageHeader, useModal, VectorLoader } from '@kolkrabbi/kol-component'
import HomeStage from '../components/HomeStage'
import { getLibraryApi, useAccount, signInLibrary, signUpLibrary, signOutLibrary, updateAccount, mintInvite, UnauthorizedError } from '../index.jsx'

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

/* FRAME C (user 2026-10-28: "I like THIS ONE") — the sign-in and invite page: the mark and the chooser on the left, the
 * yellow button at the foot, the growing line on the right. The button opens the DS dialog; no form on the page. The
 * plan-43 form pages are in `_tmp/2026-10-28-account-forms/`. */
const CHOOSER = [
  { icon: 'refresh', label: 'Generate', to: '/randomiser?start=category' },
  { icon: 'filter', label: 'Effects', to: '/randomiser?start=effects' },
  { icon: 'globe', label: 'Labs', to: '/labs' },
  { icon: 'swap', label: 'Morph', to: '/morph' },
  { icon: 'desktop', label: 'Editor', to: '/editor' },
]

function FrameC({ cta, onCta }) {
  const navigate = useNavigate()
  return (
    <main className="h-dvh bg-surface-primary flex">
      <div className="w-[672px] max-md:w-full shrink-0 box-border px-20 py-[72px] max-md:px-4 max-md:py-8 flex flex-col justify-between gap-12">
        {/* the mark as the Hub draws it — VectorLoader inks it with the theme, not the OS */}
        <div className="w-24 h-24 -ml-2 text-emphasis"><VectorLoader src="/favicon/favicon.svg" size="100%" role="img" aria-label="FXR" /></div>
        <div className="flex flex-col gap-2 max-w-[360px]">
          <span className="kol-eyebrow text-body">Select chrome</span>
          {CHOOSER.map((c) => (
            <Button key={c.label} tone="primary" size="md" className="w-full justify-start" onClick={() => navigate(c.to)}>{c.label}</Button>
          ))}
        </div>
        <Button variant="accent" size="md" className="self-start" onClick={onCta}>{cta}</Button>
      </div>
      <div className="flex-1 relative bg-surface-secondary overflow-hidden max-md:hidden">
        <div className="absolute inset-0"><HomeStage /></div>
      </div>
    </main>
  )
}

function SignInC() {
  const navigate = useNavigate()
  const modal = useModal()
  const ask = async () => {
    const got = await modal.form('Sign in', [
      { id: 'email', placeholder: 'Email', type: 'email', autoComplete: 'username' },
      { id: 'password', placeholder: 'Password', type: 'password', autoComplete: 'current-password' },
    ], { okLabel: 'Sign in' })
    if (!got?.email || !got?.password) return
    try { await signInLibrary({ email: got.email.trim(), password: got.password }); navigate('/', { replace: true }) } catch (err) { await modal.alert(err instanceof UnauthorizedError ? 'Wrong email or password.' : err.message) }
  }
  return <FrameC cta="Sign in" onCta={ask} />
}

function JoinC({ invite }) {
  const navigate = useNavigate()
  const modal = useModal()
  const ask = async () => {
    const got = await modal.form('Create account', [
      { id: 'name', placeholder: 'Name', autoComplete: 'name' },
      { id: 'email', placeholder: 'Email', type: 'email', autoComplete: 'username' },
      { id: 'password', placeholder: 'Password, 8 characters or more', type: 'password', autoComplete: 'new-password' },
    ], { okLabel: 'Create account' })
    if (!got?.email || !got?.password) return
    try { await signUpLibrary({ invite, name: got.name ?? '', email: got.email.trim(), password: got.password }); navigate('/account', { replace: true }) } catch (err) { await modal.alert(err.message) }
  }
  return <FrameC cta="Create account" onCta={ask} />
}

export function SignInPage() {
  const account = useAccount()
  if (account) return <Navigate to="/" replace />
  if (!getLibraryApi()) return <Frame title="Sign in" subtitle="Accounts are not configured on this build." />
  return <ModalProvider><SignInC /></ModalProvider>
}

export function JoinPage() {
  const [params] = useSearchParams()
  const invite = params.get('invite') || ''
  if (!invite) return <Frame title="Create account" subtitle="Accounts are made through an invite link." />
  return <ModalProvider><JoinC invite={invite} /></ModalProvider>
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
