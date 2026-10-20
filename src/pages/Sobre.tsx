interface Props { onOpenSettings?: () => void }

export default function Sobre({ onOpenSettings }: Props) {
  return (
    <div className="space-y-4">
      <div className="card p-6">
        {/* Header com logo real */}
        <div className="flex items-center gap-4 mb-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <img
            src="/logo.png"
            alt="IRPC Logo"
            style={{ width: 52, height: 65, objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <h1 className="font-bold text-lg" style={{ color: 'var(--navy)' }}>IRPC · UFVJM</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Índice de Risco de Paralisia Cerebral Infantil</p>
          </div>
        </div>

        {/* Descrição */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--blue-l)', border: '1px solid #C5DDF5' }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--navy)' }}>Projeto</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#1B3F72' }}>
            Aplicativo desenvolvido para auxiliar profissionais da saúde na avaliação do risco de paralisia cerebral
            em crianças, com base em dados clínicos e neonatais, utilizando metodologia MAUT-I.
          </p>
        </div>

        {/* Classificação de risco */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--navy)' }}>Classificação de Risco — Rodrigues (2024)</h3>
          <div className="space-y-2">
            {[
              { c: 'var(--green)', bg: 'var(--green-l)', b: '#B3E8D8', label: 'Baixo risco', val: 'AI5 ≤ 0,150' },
              { c: '#C47D00', bg: 'var(--amber-l)', b: '#FAD99A', label: 'Médio risco', val: '0,150 < AI5 ≤ 0,500' },
              { c: '#B71C1C', bg: 'var(--red-l)',   b: '#FACACA', label: 'Alto risco',  val: 'AI5 > 0,500' },
            ].map(r => (
              <div key={r.label} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{ background: r.bg, border: `1px solid ${r.b}` }}>
                <span style={{ fontWeight: 600, color: r.c }}>{r.label}</span>
                <span style={{ color: r.c, fontFamily: 'monospace', fontSize: 12 }}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipe */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-xs mb-2 uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Universidade</h3>
            <p className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
              Universidade Federal dos Vales do Jequitinhonha e Mucuri (UFVJM)
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Programa de Pós-Graduação em Saúde, Sociedade e Ambiente
            </p>
          </div>
          <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="mb-2">
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Orientador</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>Prof. Dr. Bernart Vinolas</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>Desenvolvimento</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>Jozias Costa Santos</p>
            </div>
          </div>
        </div>

        {/* LGPD */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--green-l)', border: '1px solid #B3E8D8' }}>
          <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--green-d)' }}>🔏 Privacidade e Dados (LGPD)</h3>
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--green-d)' }}>
            Este sistema trata dados pessoais de acordo com a Lei 13.709/2018 (LGPD). Os dados são usados
            exclusivamente para fins de pesquisa científica. Você pode solicitar exclusão dos seus dados a qualquer momento.
          </p>
          {onOpenSettings && (
            <button onClick={onOpenSettings} className="btn-outline text-sm"
              style={{ borderColor: 'var(--green)', color: 'var(--green-d)', padding: '8px 16px' }}>
              ⚙️ Configurações da conta
            </button>
          )}
        </div>

        <div className="text-center text-xs" style={{ color: 'var(--muted)' }}>© 2025 UFVJM — Versão 1.0.0</div>
      </div>
    </div>
  )
}
