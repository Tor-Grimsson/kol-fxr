import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Input, LabeledControl, PageHeader, VectorLoader } from '@kolkrabbi/kol-component'
import HomeStage from '../components/HomeStage'
import { getLibraryApi, useAccount, signInLibrary, signUpLibrary, requestInvite, UnauthorizedError } from '../index.jsx'

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
      onSubmit={async (v) => { await signUpLibrary({ invite, name: v.name, email: v.email.trim(), password: v.password }); navigate('/?account=1', { replace: true }) }}
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

/* /account is the account rail now (frame D2) — the route opens it over Home */
export function AccountPage() {
  return <Navigate to="/?account=1" replace />
}
