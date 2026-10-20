import { useRef, useState, useMemo } from 'react'
import { Avaliacao, RiskClass, ClinicalData, ImportResult } from '../types'

interface Props {
  avaliacoes: Avaliacao[]; loading: boolean
  onRemover: (id: string, docId?: string) => void
  onLimparTudo: () => void; onExportar: () => void
  onImportar: (f: File) => Promise<ImportResult>
}

const LABEL: Record<RiskClass, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }
const BADGE: Record<RiskClass, string> = { baixo: 'badge-baixo', medio: 'badge-medio', alto: 'badge-alto' }
const GAUGE_COLOR: Record<RiskClass, string> = { baixo: '#00A878', medio: '#F5A623', alto: '#E53935' }

// ─── Gauge mini ──────────────────────────────────────────────────────────────
function MiniGauge({ value, classe }: { value: number; classe: RiskClass }) {
  const r = 28; const circ = 2 * Math.PI * r
  const pct = Math.min(value / 0.7, 1)
  const color = GAUGE_COLOR[classe]
  return (
    <svg width="76" height="52" viewBox="0 0 76 52">
      <circle cx="38" cy="44" r={r} fill="none" stroke="var(--border)" strokeWidth="6"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.125}
        strokeLinecap="round" transform="rotate(135,38,44)" />
      <circle cx="38" cy="44" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`}
        strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(135,38,44)" />
      <text x="38" y="40" textAnchor="middle" fontSize="11" fontWeight="700" fill={color}>
        {value.toFixed(2)}
      </text>
      <text x="38" y="50" textAnchor="middle" fontSize="8" fill="var(--muted)">IRPC</text>
    </svg>
  )
}

// ─── Modal de detalhes ───────────────────────────────────────────────────────
function ModalDetalhes({ item, onClose, onRemover }: {
  item: Avaliacao
  onClose: () => void
  onRemover: () => void
}) {
  const d = (item.dados || {}) as ClinicalData
  const ai5 = parseFloat(item.indice)
  const z5  = item.indiceCombinado !== 'N/A' ? parseFloat(item.indiceCombinado) : null
  const dt  = new Date(item.data).toLocaleDateString('pt-BR') + ' ' +
              new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const GMS_LABEL: Record<number, string> = {
    0: '0 — Normal (fidgety)',
    1: '1 — Ausente',
    2: '2 — Pobre',
    3: '3 — Espasmódico',
    4: '4 — Caótico',
  }

  const s = GAUGE_COLOR[item.classe]

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between items-center py-2.5"
      style={{ borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--muted)', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'var(--navy)', textAlign: 'right' }}>{value}</span>
    </div>
  )

  const Bool = (v: boolean | undefined) => v ? 'Sim' : 'Não'
  const Opt  = (v: number | null | undefined, fmt: (n: number) => string) =>
    v != null ? fmt(v) : '—'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,34,64,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in flex flex-col"
        style={{ maxHeight: '92vh' }}>

        {/* ── Cabeçalho ── */}
        <div className="flex items-start justify-between p-5 pb-4"
          style={{ borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-base truncate" style={{ color: 'var(--navy)' }}>
                {item.nome}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0 ${BADGE[item.classe]}`}>
                {LABEL[item.classe]} risco
              </span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {item.prontuario && <span className="mr-3">🪪 {item.prontuario}</span>}
              📅 {dt}
              {item.idadeDisplay && item.idadeDisplay !== 'Não informada' &&
                <span className="ml-3">👶 {item.idadeDisplay}</span>}
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 22, lineHeight: 1, flexShrink: 0, marginLeft: 12 }}>
            ×
          </button>
        </div>

        {/* ── Corpo com scroll ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Índices com gauge */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-around gap-4 flex-wrap">
              <div className="flex flex-col items-center gap-1">
                <MiniGauge value={ai5} classe={item.classe} />
                <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Índice IRPC (AI5)</div>
                <div className="text-lg font-bold" style={{ color: s }}>{item.indice}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div style={{ width: 76, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="text-2xl font-bold" style={{ color: 'var(--navy-3)' }}>
                    {z5 != null ? item.indiceCombinado : '—'}
                  </div>
                </div>
                <div className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Índice Neurológico (Z5)</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {z5 != null ? 'GMs + HINE' : 'Não informado'}
                </div>
              </div>
            </div>
          </div>

          {/* Dados clínicos principais */}
          <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--navy-3)" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--navy)' }}>
                Dados Clínicos
              </span>
            </div>
            <Row label="Idade gestacional"   value={d.idadeGestacionalSemanas != null ? `${d.idadeGestacionalSemanas} semanas` : '—'} />
            <Row label="Apgar 5º min."        value={d.apgar5Minuto != null ? String(d.apgar5Minuto) : '—'} />
            <Row label="TORCHSZ"              value={d.torchsz ? 'Positivo' : 'Negativo'} />
            <Row label="Ventilação mecânica"  value={d.ventilacaoMecanicaDias != null ? `${d.ventilacaoMecanicaDias} dias` : '—'} />
            <Row label="Asfixia perinatal"    value={Bool(d.asfixiaPerinatal)} />
            <Row label="Convulsões neonatais" value={Bool(d.convulsoesNeonatais)} />
          </div>

          {/* Avaliação neuromotora (opcional) */}
          {(d.movimentosGeraisScore != null || d.hineScore != null) && (
            <div className="rounded-xl p-4" style={{ background: 'var(--blue-l)', border: '1px solid #C5DDF5' }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--navy-3)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--navy-3)' }}>
                  Avaliação Neuromotora Pós-Alta
                </span>
              </div>
              {d.movimentosGeraisScore != null && (
                <Row label="Movimentos Gerais (GMs)"
                  value={Opt(d.movimentosGeraisScore, v => GMS_LABEL[v] ?? String(v))} />
              )}
              {d.hineScore != null && (
                <Row label="Pontuação HINE" value={Opt(d.hineScore, v => `${v} / 78`)} />
              )}
            </div>
          )}

          {/* Intervenções neuroprotetoras */}
          <div className="rounded-xl p-4" style={{ background: 'var(--green-l)', border: '1px solid #B3E8D8' }}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--green-d)' }}>
                Intervenções Neuroprotetoras
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: 'Corticoide pré-natal',    val: d.corticoidePrenatal },
                { label: 'Sulfato de magnésio',     val: d.sulfatoMagnesioPrenatal },
                { label: 'Hipotermia terapêutica',  val: d.hipotermiaTerapeutica },
                { label: 'Cafeína neonatal',        val: d.cafeinaNeonatal },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg"
                  style={{ background: val ? 'rgba(0,168,120,0.12)' : 'rgba(0,0,0,0.04)' }}>
                  <span style={{ fontSize: 13 }}>{val ? '✅' : '⬜'}</span>
                  <span style={{ color: val ? 'var(--green-d)' : 'var(--muted)', fontWeight: val ? 600 : 400 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Rodapé ── */}
        <div className="flex gap-3 p-5 pt-4" style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={() => {
              if (confirm(`Remover avaliação de "${item.nome}"?`)) { onRemover(); onClose() }
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--red-l)', color: '#B71C1C', border: '1px solid #FACACA', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
            </svg>
            Excluir
          </button>
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold btn-primary justify-center">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Historico({ avaliacoes, loading, onRemover, onLimparTudo, onExportar, onImportar }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing,   setImporting]   = useState(false)
  const [res,         setRes]         = useState<ImportResult | null>(null)
  const [showErros,   setShowErros]   = useState(false)
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState<'todos' | RiskClass>('todos')
  const [selected,    setSelected]    = useState<Avaliacao | null>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) { alert('Selecione um arquivo .csv'); return }
    setImporting(true); setRes(null)
    const r = await onImportar(file)
    setRes(r); setImporting(false); setShowErros(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const filtered = useMemo(() => avaliacoes.filter(a => {
    const matchSearch = !search ||
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      (a.prontuario || '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || a.classe === filter
    return matchSearch && matchFilter
  }), [avaliacoes, search, filter])

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-base" style={{ color: 'var(--navy)' }}>📋 Histórico de Avaliações</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => fileRef.current?.click()} disabled={importing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
              style={{ background: '#EBF3FB', color: '#1B3F72', border: '1px solid #C5DDF5' }}>
              {importing
                ? <><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />Importando…</>
                : '📤 Importar CSV'}
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            <button onClick={onExportar}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--green-l)', color: 'var(--green-d)', border: '1px solid #B3E8D8' }}>
              📥 Exportar CSV
            </button>
            <button onClick={() => { if (confirm('Limpar todo o histórico?')) onLimparTudo() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'var(--red-l)', color: '#B71C1C', border: '1px solid #FACACA' }}>
              🗑️ Limpar tudo
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="relative mb-3">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou prontuário..."
            className="inp" style={{ paddingLeft: 36, fontSize: 13 }} />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 flex-wrap">
          {(['todos', 'baixo', 'medio', 'alto'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: filter === f ? 'var(--navy-3)' : 'var(--bg)',
                color: filter === f ? 'white' : 'var(--muted)',
                border: `1px solid ${filter === f ? 'var(--navy-3)' : 'var(--border)'}`,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>
              {f === 'todos' ? 'Todos' : f === 'baixo' ? '✅ Baixo' : f === 'medio' ? '⚠️ Médio' : '🚨 Alto'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resultado importação ── */}
      {res && (
        <div className="card p-4 animate-fade-in"
          style={{ borderLeft: `3px solid ${res.importados > 0 ? 'var(--green)' : 'var(--amber)'}` }}>
          <div className="flex justify-between items-start gap-2">
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: 'var(--navy)' }}>
                {res.importados > 0 ? '✅' : '⚠️'} Importação concluída
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                <span className="font-semibold" style={{ color: 'var(--green)' }}>{res.importados} importados</span>
                {res.ignorados > 0 && <> · <span className="font-semibold" style={{ color: 'var(--amber)' }}>{res.ignorados} ignorados</span></>}
              </p>
              {res.erros.length > 0 && (
                <button onClick={() => setShowErros(v => !v)}
                  className="mt-1 text-xs underline"
                  style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showErros ? 'Ocultar' : 'Ver'} {res.erros.length} erro(s)
                </button>
              )}
              {showErros && (
                <ul className="mt-2 text-xs space-y-0.5 max-h-28 overflow-y-auto rounded-lg p-2"
                  style={{ background: 'var(--red-l)', color: '#B71C1C' }}>
                  {res.erros.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
            <button onClick={() => setRes(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-12">
          <div className="spinner mx-auto mb-3" />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Carregando...</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-3 opacity-30">📋</div>
          <h3 className="font-semibold mb-1" style={{ color: 'var(--muted)' }}>Nenhuma avaliação encontrada</h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            {search || filter !== 'todos' ? 'Tente outros filtros.' : 'Realize cálculos na Calculadora ou importe um CSV.'}
          </p>
        </div>
      )}

      {/* ── Lista de avaliações ── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((item, idx) => {
            const dt = new Date(item.data).toLocaleDateString('pt-BR') + ' ' +
              new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            const borderColor = item.classe === 'baixo' ? 'var(--green)' : item.classe === 'medio' ? 'var(--amber)' : 'var(--red)'

            return (
              <div key={item._docId || item.id || idx}
                className="card p-4 transition-all hover:shadow-md"
                style={{ borderLeft: `3px solid ${borderColor}` }}>

                <div className="flex flex-wrap items-center justify-between gap-3">

                  {/* Nome clicável */}
                  <button
                    onClick={() => setSelected(item)}
                    className="flex-1 min-w-0 text-left"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate hover:underline"
                        style={{ color: 'var(--navy-3)' }}>
                        {item.nome}
                      </span>
                      {/* Ícone "ver detalhes" */}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                        stroke="var(--navy-3)" strokeWidth="2" style={{ flexShrink: 0, opacity: 0.6 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {item.prontuario && <span className="mr-2">🪪 {item.prontuario}</span>}
                      {dt}
                    </div>
                  </button>

                  {/* Direita: índice + badge + lixeira */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-sm" style={{ color: 'var(--muted)' }}>
                      {parseFloat(item.indice).toFixed(3)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${BADGE[item.classe]}`}>
                      {LABEL[item.classe]}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (confirm('Remover este registro?')) onRemover(item.id!, item._docId)
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                      style={{ background: 'var(--red-l)', color: '#B71C1C', border: '1px solid #FACACA', cursor: 'pointer' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" /><path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal de detalhes ── */}
      {selected && (
        <ModalDetalhes
          item={selected}
          onClose={() => setSelected(null)}
          onRemover={() => onRemover(selected.id!, selected._docId)}
        />
      )}
    </div>
  )
}
