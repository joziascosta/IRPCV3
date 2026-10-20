import { useState } from 'react'

interface Props {
  userName: string | null
  userEmail: string | null
  onDeleteAccount: (password: string) => Promise<string|null>
  onClose: () => void
}

export default function Settings({ userName, userEmail, onDeleteAccount, onClose }: Props) {
  const [step, setStep] = useState<'main'|'confirm'>('main')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string|null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const handleDelete = async () => {
    if (!password.trim()) { setError('Informe sua senha para confirmar.'); return }
    setBusy(true); setError(null)
    const err = await onDeleteAccount(password)
    setBusy(false)
    if (err) { setError(err); return }
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(10,34,64,0.55)'}}>
      <div className="bg-white rounded-2xl p-7 w-full max-w-md shadow-2xl animate-fade-in">

        {done ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-bold text-lg mb-2" style={{color:'var(--navy)'}}>Conta excluída com sucesso</h2>
            <p className="text-sm" style={{color:'var(--muted)'}}>Seus dados foram removidos permanentemente.</p>
          </div>
        ) : step === 'main' ? (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-base" style={{color:'var(--navy)'}}>⚙️ Configurações da conta</h2>
              <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:22,lineHeight:1}}>×</button>
            </div>

            {/* Perfil */}
            <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{background:'var(--bg)',border:'1px solid var(--border)'}}>
              <div style={{width:40,height:40,borderRadius:'50%',background:'var(--navy-3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'white',flexShrink:0}}>
                {(userName||userEmail||'?')[0].toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm" style={{color:'var(--navy)'}}>{userName}</div>
                <div className="text-xs" style={{color:'var(--muted)'}}>{userEmail}</div>
              </div>
            </div>

            {/* LGPD info */}
            <div className="rounded-xl p-4 mb-5" style={{background:'var(--blue-l)',border:'1px solid #C5DDF5'}}>
              <p className="text-sm leading-relaxed" style={{color:'#1B3F72'}}>
                <strong>Seus direitos (LGPD):</strong> Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento. Contato: responsável pelo sistema.
              </p>
            </div>

            {/* Zona de perigo */}
            <div className="rounded-xl p-4" style={{border:'1.5px solid #FACACA',background:'var(--red-l)'}}>
              <h3 className="font-bold text-sm mb-2" style={{color:'var(--red)'}}>⚠️ Zona de perigo</h3>
              <p className="text-xs mb-3 leading-relaxed" style={{color:'#7F1D1D'}}>
                A exclusão da conta remove permanentemente seus dados de acesso e todo o histórico de avaliações. Esta ação é irreversível.
              </p>
              <button onClick={() => setStep('confirm')}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{background:'var(--red)',color:'white',border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                Excluir minha conta e dados
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h2 className="font-bold text-base mb-2" style={{color:'var(--navy)'}}>Confirmar exclusão de conta</h2>
              <p className="text-sm leading-relaxed" style={{color:'var(--muted)'}}>
                Esta ação é <strong>permanente e irreversível</strong>. Todo o histórico de avaliações será excluído.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--navy)'}}>Confirme sua senha para continuar</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                placeholder="Sua senha atual" className="inp"
                style={{borderColor: error ? 'var(--red)' : undefined}}/>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl text-sm" style={{background:'var(--red-l)',color:'#B71C1C',border:'1px solid #FACACA'}}>
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setStep('main'); setPassword(''); setError(null) }}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{background:'var(--bg)',color:'var(--navy)',border:'1.5px solid var(--border)',cursor:'pointer',fontFamily:'inherit'}}>
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={busy}
                className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                style={{background:busy?'#ccc':'var(--red)',color:'white',border:'none',cursor:busy?'not-allowed':'pointer',fontFamily:'inherit'}}>
                {busy ? 'Excluindo...' : 'Confirmar exclusão'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
