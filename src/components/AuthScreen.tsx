import { useState } from 'react'

interface Props {
  onLogin: (e: string, p: string) => Promise<string | null>
  onRegister: (n: string, e: string, p: string) => Promise<string | null>
  onForgot?: (e: string) => Promise<string | null>
}

export default function AuthScreen({ onLogin, onRegister, onForgot }: Props) {
  const [screen, setScreen] = useState<'splash' | 'login' | 'register' | 'forgot'>('splash')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [passConfirm, setPassConfirm] = useState('')
  const [remember, setRemember] = useState(false)
  const [consent, setConsent] = useState(false)
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const go = (s: typeof screen) => { setScreen(s); setMsg(null) }

  const submit = async () => {
    if (screen === 'forgot') {
      if (!email.trim()) { setMsg({ t: 'Informe seu e-mail.', ok: false }); return }
      setBusy(true)
      const err = onForgot ? await onForgot(email) : null
      setBusy(false)
      setMsg(err ? { t: err, ok: false } : { t: 'E-mail de recuperação enviado! Verifique sua caixa de entrada.', ok: true })
      return
    }
    if (screen === 'register') {
      if (pass !== passConfirm) { setMsg({ t: 'As senhas não coincidem.', ok: false }); return }
      if (!consent) { setMsg({ t: 'Você deve aceitar a Política de Privacidade para continuar.', ok: false }); return }
    }
    setBusy(true); setMsg(null)
    const err = screen === 'login'
      ? await onLogin(email, pass)
      : await onRegister(nome, email, pass)
    setBusy(false)
    if (err) setMsg({ t: err, ok: false })
    else if (screen === 'register') setMsg({ t: 'Conta criada com sucesso!', ok: true })
  }

  // ── SPLASH ──────────────────────────────────────────────────────────────
  if (screen === 'splash') return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg,#EBF3FB 0%,#F0F5FA 100%)' }}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {/* Logo real grande */}
        <img
          src="/logo.png"
          alt="IRPC Logo"
          style={{ width: 130, height: 163, objectFit: 'contain', marginBottom: 24 }}
        />
        <h1 className="text-3xl font-bold mb-1" style={{ color: '#0A2240', letterSpacing: '-0.03em' }}>
          IRPC · UFVJM
        </h1>
        <p className="text-sm font-medium mb-3" style={{ color: '#2D6AB4' }}>
          Índice de Risco de Paralisia Cerebral Infantil
        </p>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#6B8299' }}>
          Apoio à avaliação clínica e ao acompanhamento de recém-nascidos e crianças em risco de paralisia cerebral.
        </p>
        <div className="mt-10 w-full max-w-xs space-y-3">
          <button onClick={() => go('login')}
            className="btn-primary w-full justify-center text-base" style={{ borderRadius: 12 }}>
            Iniciar
          </button>
          <button onClick={() => go('login')}
            className="btn-outline w-full justify-center text-sm"
            style={{ borderRadius: 12, borderColor: '#2D6AB4', color: '#2D6AB4' }}>
            Modo demonstração
          </button>
        </div>
      </div>
      {/* Rodapé logo UFVJM */}
      <div className="p-6 flex items-center justify-center gap-2 opacity-50">
        <img src="/logo.png" alt="IRPC" style={{ width: 20, height: 25, objectFit: 'contain' }} />
        <span className="text-xs font-semibold" style={{ color: '#0A2240' }}>UFVJM</span>
      </div>
    </div>
  )

  // ── LOGIN ────────────────────────────────────────────────────────────────
  if (screen === 'login') return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg,#EBF3FB 0%,#F0F5FA 100%)' }}>
      {/* Header com logo real */}
      <div className="flex flex-col items-center pt-10 pb-6 px-6">
        <img src="/logo.png" alt="IRPC Logo" style={{ width: 64, height: 80, objectFit: 'contain', marginBottom: 12 }} />
        <h1 className="text-xl font-bold" style={{ color: '#0A2240', letterSpacing: '-0.02em' }}>IRPC · UFVJM</h1>
        <p className="text-xs mt-1" style={{ color: '#6B8299' }}>Índice de Risco de Paralisia Cerebral Infantil</p>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 pb-8">
        <div className="card w-full max-w-sm p-7">
          <h2 className="text-xl font-bold mb-6 text-center" style={{ color: '#0A2240' }}>Acesse sua conta</h2>

          {/* Email */}
          <div className="relative mb-3">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9BAFC2' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Usuário ou e-mail" className="inp" style={{ paddingLeft: 38 }} />
          </div>

          {/* Senha */}
          <div className="relative mb-2">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#9BAFC2' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input type={showPass ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)}
              placeholder="Senha" className="inp" style={{ paddingLeft: 38, paddingRight: 42 }}
              onKeyDown={e => e.key === 'Enter' && submit()} />
            <button onClick={() => setShowPass(v => !v)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9BAFC2', padding: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {showPass
                  ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                  : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
                }
              </svg>
            </button>
          </div>

          {/* Lembrar / Esqueci */}
          <div className="flex items-center justify-between mb-5 mt-1">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: '#6B8299' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="w-3.5 h-3.5" />
              Lembrar-me
            </label>
            <button onClick={() => go('forgot')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2D6AB4', fontSize: 12, fontWeight: 500 }}>
              Esqueci minha senha
            </button>
          </div>

          <button onClick={submit} disabled={busy} className="btn-primary w-full justify-center mb-4">
            {busy ? 'Aguarde...' : 'Entrar'}
          </button>

          {msg && (
            <div className={`text-center text-sm py-2.5 px-4 rounded-xl animate-fade-in ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.t}
            </div>
          )}

          <div className="mt-5 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => go('register')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: '#2D6AB4', background: 'none', border: 'none', cursor: 'pointer' }}>
              Criar nova conta
            </button>
          </div>
        </div>

        <button onClick={() => go('splash')}
          style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9BAFC2', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Voltar ao início
        </button>
      </div>
      <div className="text-center pb-4 text-xs" style={{ color: '#B0C0D0' }}>Versão 1.0.0</div>
    </div>
  )

  // ── CADASTRO ─────────────────────────────────────────────────────────────
  if (screen === 'register') return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg,#EBF3FB 0%,#F0F5FA 100%)' }}>
      <div className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button onClick={() => go('login')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A2240', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          Voltar
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center px-5 pb-8">
        <div className="card w-full max-w-sm p-7">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="IRPC" style={{ width: 48, height: 60, objectFit: 'contain' }} />
          </div>
          <h2 className="text-lg font-bold mb-5 text-center" style={{ color: '#0A2240' }}>Criar nova conta</h2>
          <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome completo" className="inp mb-3" />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" className="inp mb-3" />
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Senha" className="inp mb-3" />
          <input type="password" value={passConfirm} onChange={e => setPassConfirm(e.target.value)} placeholder="Confirmar senha" className="inp mb-4" />
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--blue-l)', border: '1px solid #C5DDF5' }}>
            <p className="text-xs leading-relaxed mb-3" style={{ color: '#1B3F72' }}>
              <strong>Informações sobre seus dados (LGPD):</strong> O Sistema IRPC coleta seu nome e e-mail para autenticação e dados clínicos de pacientes para fins de pesquisa científica (UFVJM – PPGSaSA).
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 flex-shrink-0" />
              <span className="text-xs" style={{ color: '#1B3F72' }}>Li e concordo com a <strong>Política de Privacidade</strong> e os <strong>Termos de Uso</strong>.</span>
            </label>
          </div>
          <button onClick={submit} disabled={busy} className="btn-primary w-full justify-center">
            {busy ? 'Aguarde...' : 'Criar conta'}
          </button>
          {msg && (
            <div className={`mt-3 text-center text-sm py-2.5 px-4 rounded-xl animate-fade-in ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.t}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ── ESQUECI SENHA ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(180deg,#EBF3FB 0%,#F0F5FA 100%)' }}>
      <div className="flex items-center gap-3 px-5 pt-10 pb-4">
        <button onClick={() => go('login')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0A2240', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
          Voltar
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center px-5 pb-8">
        <div className="card w-full max-w-sm p-7">
          <div className="text-center mb-6">
            <img src="/logo.png" alt="IRPC" style={{ width: 48, height: 60, objectFit: 'contain', margin: '0 auto 12px' }} />
            <h2 className="text-lg font-bold" style={{ color: '#0A2240' }}>Recuperar senha</h2>
            <p className="text-sm mt-1" style={{ color: '#6B8299' }}>Informe seu e-mail para receber o link de redefinição.</p>
          </div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" className="inp mb-4" />
          <button onClick={submit} disabled={busy} className="btn-primary w-full justify-center">
            {busy ? 'Enviando...' : 'Enviar e-mail de recuperação'}
          </button>
          {msg && (
            <div className={`mt-3 text-center text-sm py-2.5 px-4 rounded-xl animate-fade-in ${msg.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
              {msg.t}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
