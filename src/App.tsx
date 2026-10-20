import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useAvaliacoes } from './hooks/useAvaliacoes'
import AuthScreen from './components/AuthScreen'
import Logo from './components/Logo'
import Calculadora from './pages/Calculadora'
import Historico from './pages/Historico'
import Graficos from './pages/Graficos'
import Sobre from './pages/Sobre'
import Settings from './pages/Settings'
import { Avaliacao } from './types'

type Page = 'inicio' | 'calculadora' | 'historico' | 'graficos' | 'sobre'

const NAV_ITEMS: { id: Page; label: string; icon: (a: boolean) => JSX.Element }[] = [
  { id: 'inicio', label: 'Início',
    icon: a => <svg width="18" height="18" viewBox="0 0 24 24" fill={a?'#1B3F72':'none'} stroke={a?'#1B3F72':'currentColor'} strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'calculadora', label: 'Calculadora',
    icon: a => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?'#1B3F72':'currentColor'} strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="11" y2="18"/></svg> },
  { id: 'historico', label: 'Histórico',
    icon: a => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?'#1B3F72':'currentColor'} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: 'graficos', label: 'Gráficos',
    icon: a => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?'#1B3F72':'currentColor'} strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id: 'sobre', label: 'Sobre',
    icon: a => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={a?'#1B3F72':'currentColor'} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
]

export default function App() {
  const { user, loading, isDemoMode, login, register, logout, forgotPassword, deleteAccount } = useAuth()
  const { avaliacoes, loadingHist, carregar, salvar, remover, limparTudo, exportarCSV, importarCSV } = useAvaliacoes(user?.uid)
  const [page, setPage] = useState<Page>('inicio')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => { if (user) carregar() }, [user, carregar])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <img src="/logo.png" alt="IRPC" style={{ width: 72, height: 90, objectFit: 'contain', margin: '0 auto 16px', opacity: 0.7 }} />
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
      </div>
    </div>
  )

  if (!user) return <AuthScreen onLogin={login} onRegister={register} onForgot={forgotPassword} />

  const nav = (p: Page) => { setPage(p); if (p === 'historico' || p === 'graficos') carregar() }

  // ── Tela Início ──────────────────────────────────────────────────────────
  const Inicio = () => (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="rounded-xl p-4 flex gap-3 text-sm animate-fade-in"
          style={{ background: 'var(--amber-l)', border: '1px solid #FAD99A', color: '#7A5000' }}>
          <span className="text-lg flex-shrink-0">⚠️</span>
          <div>
            <strong>Modo demonstração ativo.</strong> Firebase não configurado — dados salvos localmente nesta sessão.
            Configure suas credenciais em <code className="px-1 rounded" style={{ background: 'rgba(0,0,0,0.08)' }}>src/lib/firebase.ts</code>.
          </div>
        </div>
      )}

      {/* Hero card com logo */}
      <div className="card p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Logo real grande */}
          <img
            src="/logo.png"
            alt="IRPC"
            style={{ width: 64, height: 80, objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <h2 className="font-bold text-lg mb-1" style={{ color: '#0A2240' }}>
              Olá, {user.displayName?.split(' ')[0] || 'bem-vindo'}!
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#6B8299' }}>
              Este é o sistema de apoio ao cálculo do Índice de Risco de Paralisia Cerebral Infantil (IRPC).
            </p>
          </div>
        </div>

        {/* Cards de navegação */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'calculadora' as Page, label: 'Calculadora', desc: 'Calcule o índice de risco', icon: '🧮', color: '#EBF3FB' },
            { id: 'historico'   as Page, label: 'Histórico',   desc: 'Veja os cálculos realizados', icon: '📋', color: '#E6F7F2' },
            { id: 'graficos'    as Page, label: 'Gráficos',    desc: 'Visualize os resultados', icon: '📊', color: '#EBF3FB' },
            { id: 'sobre'       as Page, label: 'Sobre',       desc: 'Informações do projeto', icon: 'ℹ️', color: '#F0F5FA' },
          ].map(item => (
            <button key={item.id} onClick={() => nav(item.id)}
              className="flex flex-col items-center gap-2 p-5 rounded-2xl text-center transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ background: item.color, border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-sm" style={{ color: '#0A2240' }}>{item.label}</span>
              <span className="text-xs" style={{ color: '#6B8299' }}>{item.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Resumo estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    v: avaliacoes.length,                                           c: 'var(--navy-3)' },
          { label: 'Baixo',   v: avaliacoes.filter(a => a.classe === 'baixo').length,          c: 'var(--green)'  },
          { label: 'Alto',    v: avaliacoes.filter(a => a.classe === 'alto').length,            c: 'var(--red)'    },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="text-2xl font-bold mb-0.5" style={{ color: s.c }}>{s.v}</div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>{s.label} risco</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* ── SIDEBAR desktop ── */}
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 sticky top-0 h-screen"
        style={{ background: 'var(--navy)' }}>
        <div className="p-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Logo size={44} variant="light" />
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => nav(id)}
              className={`sidebar-item w-full text-left ${page === id ? 'active' : ''}`}
              style={{ fontFamily: 'inherit' }}>
              {icon(page === id)}
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <button onClick={() => setShowSettings(true)}
            className="sidebar-item w-full text-left" style={{ fontFamily: 'inherit' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Configurações
          </button>
          <button onClick={logout}
            className="sidebar-item w-full text-left" style={{ fontFamily: 'inherit' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 sticky top-0 z-40 border-b"
          style={{ background: 'var(--navy)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <Logo size={38} variant="light" />
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <span className="text-xs px-2 py-1 rounded-full font-semibold"
                style={{ background: 'var(--amber)', color: 'white' }}>Demo</span>
            )}
            <button onClick={() => setShowSettings(true)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </header>

        {/* Topbar desktop */}
        <header className="hidden lg:flex items-center justify-between px-6 h-14 border-b bg-white sticky top-0 z-40"
          style={{ borderColor: 'var(--border)' }}>
          <span className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
            {NAV_ITEMS.find(n => n.id === page)?.label || 'Início'}
          </span>
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'var(--amber-l)', color: '#7A5000', border: '1px solid #FAD99A' }}>
                ⚠️ Modo demonstração
              </span>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'var(--blue-l)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--navy-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white' }}>
                {(user.displayName || user.email || '?')[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--navy)' }}>
                {user.displayName || user.email}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 max-w-4xl w-full mx-auto">
          {page === 'inicio'      && <Inicio />}
          {page === 'calculadora' && <Calculadora onSalvar={(a: Avaliacao) => salvar(a)} isDemoMode={isDemoMode} />}
          {page === 'historico'   && <Historico avaliacoes={avaliacoes} loading={loadingHist} onRemover={remover} onLimparTudo={limparTudo} onExportar={exportarCSV} onImportar={importarCSV} />}
          {page === 'graficos'    && <Graficos avaliacoes={avaliacoes} />}
          {page === 'sobre'       && <Sobre onOpenSettings={() => setShowSettings(true)} />}
        </main>

        {/* Bottom nav mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex bg-white border-t z-40"
          style={{ borderColor: 'var(--border)', boxShadow: '0 -2px 12px rgba(10,34,64,0.08)' }}>
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => nav(id)} className={`bnav-btn ${page === id ? 'active' : ''}`}>
              {icon(page === id)}
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {showSettings && (
        <Settings userName={user.displayName} userEmail={user.email}
          onDeleteAccount={deleteAccount} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
