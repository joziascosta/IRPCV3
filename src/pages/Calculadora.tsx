import React, { useState } from 'react'
import { ClinicalData, Avaliacao, RiskClass } from '../types'
import { calcularIRPC, calcularIdade } from '../lib/calc'

interface Props {
  onSalvar: (a: Avaliacao) => void
  isDemoMode: boolean
}

// ─── Estado inicial do formulário ─────────────────────────────────────────────
const EMPTY = {
  nome: '', dataNasc: '', prontuario: '',
  // Step 2 — strings para controlar o input, convertidas para número no cálculo
  ig: '', apgar: '', vm: '', gms: '', hine: '',
  // Step 2 — selects (strings '0'|'1')
  torchsz: '', asfixia: '', convulsoes: '',
  // Step 3 — checkboxes booleanos
  corticoide: false, sulfato: false, hipotermia: false, cafeina: false,
}

type FormState = typeof EMPTY
type Step = 1 | 2 | 3

// ─── Estilo por classificação ─────────────────────────────────────────────────
const CLASSE_STYLE: Record<RiskClass, { bg: string; border: string; text: string; gauge: string }> = {
  baixo: { bg: '#E6F7F2', border: '#00A878', text: '#00A878', gauge: '#00A878' },
  medio: { bg: '#FEF7EA', border: '#F5A623', text: '#C47D00', gauge: '#F5A623' },
  alto:  { bg: '#FDECEA', border: '#E53935', text: '#B71C1C', gauge: '#E53935' },
}
const LABEL: Record<RiskClass, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' }

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StepHeader({ step, current }: { step: Step; current: Step }) {
  const labels: Record<Step, string> = { 1: 'Paciente', 2: 'Dados Clínicos', 3: 'Intervenções' }
  const done   = current > step
  const active = current === step
  const bg     = done || active ? 'var(--navy-3)' : 'var(--border)'
  const color  = done || active ? 'white' : 'var(--muted)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: bg, color }}>
        {done ? '✓' : step}
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: active ? 'var(--navy-3)' : done ? 'var(--navy-3)' : 'var(--muted)' }}>
        {labels[step]}
      </span>
    </div>
  )
}

function Field({ label, tip, error, children }: { label: string; tip?: string; error?: string; children: React.ReactElement }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, color: '#334155' }}>
        {label}
        {tip && <span style={{ fontWeight: 400, color: 'var(--muted)', marginLeft: 4, fontSize: 11 }}>{tip}</span>}
      </label>
      {React.cloneElement(children, {
        className: `inp${error ? ' border-red-400' : ''}`,
        style: error ? { borderColor: 'var(--red)' } : {},
      })}
      {error && <p style={{ fontSize: 11, color: 'var(--red)', marginTop: 3 }}>⚠️ {error}</p>}
    </div>
  )
}

function GaugeResult({ value, classe }: { value: number; classe: RiskClass }) {
  const s    = CLASSE_STYLE[classe]
  const r    = 52
  const circ = 2 * Math.PI * r
  const pct  = Math.min(value / 0.7, 1) // escala visual: 0.7 = arco cheio
  return (
    <svg width="140" height="100" viewBox="0 0 140 100">
      {/* Trilho */}
      <circle cx="70" cy="80" r={r} fill="none" stroke="var(--border)" strokeWidth="10"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.125}
        strokeLinecap="round" transform="rotate(135,70,80)" />
      {/* Progresso */}
      <circle cx="70" cy="80" r={r} fill="none" stroke={s.gauge} strokeWidth="10"
        strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`}
        strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(135,70,80)" />
      <text x="70" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill={s.gauge}>{value.toFixed(2)}</text>
      <text x="70" y="84" textAnchor="middle" fontSize="11" fill="var(--muted)">IRPC</text>
    </svg>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Calculadora({ onSalvar, isDemoMode }: Props) {
  const [f, setF]           = useState<FormState>({ ...EMPTY })
  const [step, setStep]     = useState<Step>(1)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<null | {
    classe: RiskClass; texto: string; icone: string
    AI5: number; Z5: number | null
    nome: string; prontuario: string; idadeDisplay: string
    dados: ClinicalData
  }>(null)

  const set = (k: keyof FormState, v: string | boolean) => {
    setF(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = { ...p }; delete n[k as string]; return n })
  }

  // ── Validação por step ────────────────────────────────────────────────────
  const validateStep = (s: Step): boolean => {
    const errs: Record<string, string> = {}
    if (s === 1) {
      if (!f.nome.trim()) errs.nome = 'Nome obrigatório'
    }
    if (s === 2) {
      const ig = parseFloat(f.ig)
      if (f.ig !== '' && (ig < 22 || ig > 42)) errs.ig = 'Entre 22 e 42 semanas'
      const ap = parseFloat(f.apgar)
      if (f.apgar !== '' && (ap < 0 || ap > 10)) errs.apgar = 'Entre 0 e 10'
      const gms = parseFloat(f.gms)
      if (f.gms !== '' && (gms < 0 || gms > 4)) errs.gms = 'Entre 0 e 4'
      const hine = parseFloat(f.hine)
      if (f.hine !== '' && (hine < 0 || hine > 78)) errs.hine = 'Entre 0 e 78'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const next = () => { if (validateStep(step)) setStep(s => (s < 3 ? (s + 1) as Step : s)) }
  const back = () => { setStep(s => (s > 1 ? (s - 1) as Step : s)); setResult(null) }

  // ── Cálculo ───────────────────────────────────────────────────────────────
  const calcular = () => {
    if (!validateStep(3)) return

    const dados: ClinicalData = {
      idadeGestacionalSemanas: parseFloat(f.ig)    || 37,
      apgar5Minuto:            parseFloat(f.apgar) || 7,
      torchsz:                 f.torchsz  === '1',
      ventilacaoMecanicaDias:  parseFloat(f.vm)    || 0,
      asfixiaPerinatal:        f.asfixia  === '1',
      convulsoesNeonatais:     f.convulsoes === '1',
      corticoidePrenatal:      f.corticoide,
      sulfatoMagnesioPrenatal: f.sulfato,
      hipotermiaTerapeutica:   f.hipotermia,
      cafeinaNeonatal:         f.cafeina,
      // GMs e HINE são opcionais — só passados se preenchidos
      movimentosGeraisScore: f.gms  !== '' ? parseFloat(f.gms)  : null,
      hineScore:             f.hine !== '' ? parseFloat(f.hine) : null,
    }

    const { AI5, Z5, classe, texto, icone } = calcularIRPC(dados)
    const idadeDisplay = calcularIdade(f.dataNasc)

    const r = { classe, texto, icone, AI5, Z5, nome: f.nome, prontuario: f.prontuario, idadeDisplay, dados }
    setResult(r)

    onSalvar({
      id:              Date.now().toString(),
      nome:            f.nome,
      idadeDisplay,
      classe,
      texto,
      indice:          AI5.toFixed(3),
      indiceCombinado: Z5 !== null ? Z5.toFixed(3) : 'N/A',
      data:            new Date().toISOString(),
      prontuario:      f.prontuario,
      dataNasc:        f.dataNasc,
      dados,
    })

    setTimeout(() => document.getElementById('res')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
  }

  const novo = () => { setF({ ...EMPTY }); setStep(1); setResult(null); setErrors({}) }

  // ── Opções de select ──────────────────────────────────────────────────────
  const BOOL_OPTS = [
    { label: 'Selecione', val: '' },
    { label: '0 — Não',   val: '0' },
    { label: '1 — Sim',   val: '1' },
  ]
  const GMS_OPTS = [
    { label: 'Selecione',              val: '' },
    { label: '0 — Normal (fidgety)',   val: '0' },
    { label: '1 — Ausente',            val: '1' },
    { label: '2 — Pobre',              val: '2' },
    { label: '3 — Espasmódico',        val: '3' },
    { label: '4 — Caótico',            val: '4' },
  ]

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Stepper */}
      <div className="card p-4">
        <div className="flex items-center justify-between max-w-xs mx-auto">
          <StepHeader step={1} current={step} />
          <div className="step-line" style={{ background: step > 1 ? 'var(--navy-3)' : 'var(--border)' }} />
          <StepHeader step={2} current={step} />
          <div className="step-line" style={{ background: step > 2 ? 'var(--navy-3)' : 'var(--border)' }} />
          <StepHeader step={3} current={step} />
        </div>
      </div>

      {/* ── STEP 1 — Identificação ── */}
      {step === 1 && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-l)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-3)" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--navy)' }}>Identificação do Paciente</h2>
          </div>
          <div className="space-y-4">
            <Field label="Nome completo *" error={errors.nome}>
              <input value={f.nome} onChange={e => set('nome', e.target.value)} placeholder="Digite o nome completo" className="inp" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Data de nascimento">
                <input type="date" value={f.dataNasc} onChange={e => set('dataNasc', e.target.value)} className="inp" />
              </Field>
              <Field label="Prontuário">
                <input value={f.prontuario} onChange={e => set('prontuario', e.target.value)} placeholder="Ex.: 123456" className="inp" />
              </Field>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 — Dados Clínicos ── */}
      {step === 2 && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--blue-l)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--navy-3)" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--navy)' }}>Dados Clínicos</h2>
          </div>

          <div className="space-y-4">
            {/* Linha 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Idade gestacional (sem.)" tip="22 – 42 sem." error={errors.ig}>
                <input type="number" step="0.1" value={f.ig} onChange={e => set('ig', e.target.value)} placeholder="Ex: 32" className="inp" />
              </Field>
              <Field label="Apgar 5º min." tip="0 – 10" error={errors.apgar}>
                <input type="number" step="1" min="0" max="10" value={f.apgar} onChange={e => set('apgar', e.target.value)} placeholder="Ex: 8" className="inp" />
              </Field>
            </div>

            {/* Linha 2 */}
            <Field label="Infecções TORCHSZ" tip="0 = negativo · 1 = positivo">
              <select value={f.torchsz} onChange={e => set('torchsz', e.target.value)} className="inp">
                <option value="">Selecione</option>
                <option value="0">0 — Negativo</option>
                <option value="1">1 — Positivo</option>
              </select>
            </Field>

            <Field label="Ventilação mecânica" tip="Tempo em dias">
              <input type="number" step="0.5" min="0" value={f.vm} onChange={e => set('vm', e.target.value)} placeholder="Ex: 2" className="inp" />
            </Field>

            {/* Linha 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Asfixia no nascimento" tip="0 = não · 1 = sim">
                <select value={f.asfixia} onChange={e => set('asfixia', e.target.value)} className="inp">
                  {BOOL_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Convulsões neonatais" tip="0 = não · 1 = sim">
                <select value={f.convulsoes} onChange={e => set('convulsoes', e.target.value)} className="inp">
                  {BOOL_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </Field>
            </div>

            {/* Avaliação neuromotora pós-alta (opcional) */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>
                AVALIAÇÃO NEUROMOTORA PÓS-ALTA — opcional (GMs e HINE)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Movimentos Gerais (GM)" tip="0=normal · 4=caótico" error={errors.gms}>
                  <select value={f.gms} onChange={e => set('gms', e.target.value)} className="inp">
                    {GMS_OPTS.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
                  </select>
                </Field>
                <Field label="Pontuação HINE" tip="0 – 78 (menor = pior)" error={errors.hine}>
                  <input type="number" step="1" min="0" max="78" value={f.hine} onChange={e => set('hine', e.target.value)} placeholder="Ex: 72" className="inp" />
                </Field>
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                Quando informados, o Índice Neurológico Combinado (Z5) é calculado separadamente e não altera o AI5.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3 — Intervenções ── */}
      {step === 3 && !result && (
        <div className="card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green-l)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--navy)' }}>Intervenções Neuroprotetoras</h2>
          </div>

          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            Marque as intervenções aplicadas. Cada intervenção reduz o índice de risco conforme o modelo MAUT-I.
          </p>

          <div className="space-y-2 mb-6">
            {([
              { id: 'corticoide', label: 'Corticoide pré-natal', desc: 'Reduz AG5 — neuroproteção fetal' },
              { id: 'sulfato',    label: 'Sulfato de magnésio pré-natal', desc: 'Reduz AG5 — neuroproteção fetal' },
              { id: 'hipotermia', label: 'Hipotermia terapêutica', desc: 'Desconto de 0,1 em P5 (asfixia)' },
              { id: 'cafeina',    label: 'Cafeína neonatal', desc: 'Desconto de 0,1 em N5 (ventilação mecânica)' },
            ] as { id: keyof FormState; label: string; desc: string }[]).map(({ id, label, desc }) => (
              <label key={id}
                className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer select-none transition-all"
                style={{
                  background: f[id] ? 'var(--blue-l)' : 'var(--bg)',
                  border: `1.5px solid ${f[id] ? 'var(--navy-3)' : 'var(--border)'}`,
                }}>
                <input type="checkbox" className="w-4 h-4 flex-shrink-0"
                  checked={!!f[id]} onChange={e => set(id, e.target.checked)} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTADO ── */}
      {result && step === 3 && (() => {
        const s = CLASSE_STYLE[result.classe]
        return (
          <div id="res" className="space-y-4 animate-fade-in">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                <h2 className="font-bold text-base" style={{ color: 'var(--navy)' }}>Resultado</h2>
              </div>

              {/* Gauge */}
              <div className="flex flex-col items-center mb-5">
                <GaugeResult value={result.AI5} classe={result.classe} />
                <div className="px-4 py-1.5 rounded-full font-bold text-sm mt-2"
                  style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                  {LABEL[result.classe]}
                </div>
                <p className="text-sm mt-2 text-center px-4" style={{ color: 'var(--muted)' }}>
                  {result.icone} {result.texto}, com base nos dados informados.
                </p>
              </div>

              {/* Índices */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Índice IRPC (AI5)</div>
                  <div className="text-2xl font-bold" style={{ color: s.text }}>{result.AI5.toFixed(3)}</div>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Índice Neurológico (Z5)</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--navy-3)' }}>
                    {result.Z5 !== null ? result.Z5.toFixed(3) : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Resumo */}
              <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold mb-3" style={{ color: 'var(--navy)' }}>Resumo dos dados</p>
                {[
                  ['Idade gestacional', f.ig     ? `${f.ig} semanas` : '—'],
                  ['Apgar 5º min.',     f.apgar  || '—'],
                  ['TORCHSZ',           f.torchsz === '1' ? 'Positivo' : f.torchsz === '0' ? 'Negativo' : '—'],
                  ['Ventilação mecânica', f.vm   ? `${f.vm} dias` : '0 dias'],
                  ['Asfixia',           f.asfixia   === '1' ? 'Sim' : 'Não'],
                  ['Convulsões',        f.convulsoes === '1' ? 'Sim' : 'Não'],
                  ['GMs',               f.gms  ? GMS_OPTS.find(o => o.val === f.gms)?.label ?? f.gms : '—'],
                  ['HINE',              f.hine || '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1.5"
                    style={{ borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                    <span style={{ color: 'var(--muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600, color: 'var(--navy)' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={novo} className="btn-outline flex-1 justify-center">← Novo cálculo</button>
                <button className="btn-primary flex-1 justify-center" style={{ opacity: 0.8, cursor: 'default' }}>
                  ✓ Salvo no histórico
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Botões de navegação */}
      {!result && (
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={back} className="btn-outline flex-1 justify-center">← Voltar</button>
          )}
          {step < 3 ? (
            <button onClick={next} className="btn-primary flex-1 justify-center">Próximo →</button>
          ) : (
            <button onClick={calcular} className="btn-primary flex-1 justify-center">
              Calcular Índice de Risco
            </button>
          )}
        </div>
      )}
    </div>
  )
}
