/**
 * Motor de Cálculo do Índice de Risco de Paralisia Cerebral Infantil (IRPC)
 *
 * Implementação TypeScript baseada na Teoria da Utilidade Multiatributo (MAUT-I),
 * alinhada à metodologia original de Rodrigues (2024).
 *
 * Referências:
 *   Rodrigues, L. A. (2024). Fatores relacionados ao alto risco de paralisia cerebral:
 *   desenvolvimento de um índice multicritério. Dissertação de Mestrado, UFMG.
 *
 *   Santos, J. C. (2026). Desenvolvimento de uma aplicação web para estimativa
 *   do risco de paralisia cerebral infantil. Dissertação de Mestrado, UFVJM.
 */

import { RiskClass } from '../types'

// ─── Tipos e interfaces ────────────────────────────────────────────────────────

export type FaixaRisco = 'Baixo risco' | 'Médio risco' | 'Alto risco'

/**
 * Dados clínicos de entrada para o cálculo do IRPC.
 * Preserva a mesma estrutura usada pelo restante do projeto (ClinicalData)
 * mas com tipos claros para os campos booleanos e opcionais.
 */
export interface ClinicalData {
  /** Idade gestacional em semanas (faixa clínica aceita: 22 – 42 sem) */
  idadeGestacionalSemanas: number
  /** Apgar no 5º minuto (0 – 10) */
  apgar5Minuto: number
  /** Infecções TORCHSZ (true = presente) */
  torchsz: boolean
  /** Ventilação mecânica em dias (>= 0) */
  ventilacaoMecanicaDias: number
  /** Asfixia perinatal (true = presente) */
  asfixiaPerinatal: boolean
  /** Convulsões neonatais (true = presente) */
  convulsoesNeonatais: boolean
  /** Corticoide pré-natal (true = utilizado) */
  corticoidePrenatal: boolean
  /** Sulfato de magnésio pré-natal (true = utilizado) */
  sulfatoMagnesioPrenatal: boolean
  /** Hipotermia terapêutica (true = realizada) */
  hipotermiaTerapeutica: boolean
  /** Cafeína neonatal (true = administrada) */
  cafeinaNeonatal: boolean
  /**
   * Movimentos Gerais — escala Prechtl (0–4).
   * Opcional: informado apenas na avaliação pós-alta.
   */
  movimentosGeraisScore?: number | null
  /**
   * Pontuação HINE (0–78).
   * Opcional: informado apenas na avaliação pós-alta.
   */
  hineScore?: number | null
}

/** Variáveis normalizadas intermediárias — para auditoria e transparência */
export interface VariaveisTransformadas {
  D5:  number        // Utilidade da prematuridade
  H5:  number        // Utilidade do Apgar invertido
  J5:  number        // TORCHSZ (0 | 1)
  N5:  number        // Ventilação mecânica corrigida por cafeína
  P5:  number        // Asfixia corrigida por hipotermia
  R5:  number        // Convulsões (0 | 1)
  AG5: number        // Penalidade por ausência de neuroproteção pré-natal
  U5?: number | null // GMs normalizado (opcional)
  Y5?: number | null // HINE normalizado (opcional)
}

/** Resultado completo do cálculo IRPC */
export interface CalcResult {
  /** Índice Multicritério Final — estimativa do risco neonatal */
  AI5: number
  /** Classificação de risco segundo Rodrigues (2024) */
  classificacaoRisco: FaixaRisco
  /** Alias de classificacaoRisco no formato usado pelo projeto ('baixo' | 'medio' | 'alto') */
  classe: RiskClass
  /** Texto descritivo da classificação */
  texto: string
  /** Ícone da classificação */
  icone: string
  /** Código de cor para apoio visual */
  corRisco: 'verde' | 'amarelo' | 'vermelho'
  /**
   * Índice Combinado Neurológico (Z5).
   * null quando GMs e/ou HINE não forem fornecidos.
   */
  Z5: number | null
  /** Detalhamento das variáveis transformadas */
  variaveisTransformadas: VariaveisTransformadas
}

// ─── Utilitário ────────────────────────────────────────────────────────────────

/**
 * Restringe `val` ao intervalo [min, max].
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val))
}

// ─── Cálculo principal ─────────────────────────────────────────────────────────

/**
 * Executa o cálculo determinístico do Índice de Risco de Paralisia Cerebral (IRPC).
 *
 * Faixas de risco — Rodrigues (2024, p. 47):
 *   Baixo risco : AI5 <= 0.150
 *   Médio risco : 0.150 < AI5 <= 0.500
 *   Alto risco  : AI5 > 0.500
 *
 * Pesos do índice multicritério:
 *   IG (1/9) + Apgar (2/9) + TORCHSZ (1/9) + Ventilação (2/9) +
 *   Asfixia (1/9) + Convulsão (2/9) + AG5
 */
export function calcularIRPC(dados: ClinicalData): CalcResult {

  // ── 1. D5 — Prematuridade (IG) ──────────────────────────────────────────────
  // >= 37 sem → 0.0 ; <= 25 sem → 1.0
  // clamp superior previne extrapolação > 1 em prematuros extremos (< 25 sem).
  const D5 = clamp((37 - dados.idadeGestacionalSemanas) / 12, 0, 1)

  // ── 2. H5 — Apgar invertido ─────────────────────────────────────────────────
  // >= 7 → 0.0 ; <= 1 → 1.0
  const H5 = clamp((7 - dados.apgar5Minuto) / 6, 0, 1)

  // ── 3. J5 — TORCHSZ ─────────────────────────────────────────────────────────
  const J5: number = dados.torchsz ? 1 : 0

  // ── 4. N5 — Ventilação mecânica com correção por cafeína ────────────────────
  // Satura em 8 dias (utilidade = 1.0). Cafeína subtrai 0.1 (mín. 0).
  const utilidadeVentilacao = clamp(dados.ventilacaoMecanicaDias / 8, 0, 1)
  const descontoCafeina      = dados.cafeinaNeonatal ? 0.1 : 0
  const N5 = Math.max(0, utilidadeVentilacao - descontoCafeina)

  // ── 5. P5 — Asfixia com correção por hipotermia terapêutica ─────────────────
  // Asfixia presente = 1.0; hipotermia subtrai 0.1 (mín. 0).
  const asfixiaVal       = dados.asfixiaPerinatal ? 1 : 0
  const descontoHipotermia = dados.hipotermiaTerapeutica ? 0.1 : 0
  const P5 = Math.max(0, asfixiaVal - descontoHipotermia)

  // ── 6. R5 — Convulsões neonatais ────────────────────────────────────────────
  const R5: number = dados.convulsoesNeonatais ? 1 : 0

  // ── 7. AG5 — Penalidade por ausência de neuroproteção pré-natal ─────────────
  // Ambos (corticoide + sulfato) usados → 0.0
  // Apenas um usado                      → 0.0125
  // Nenhum usado                         → 0.025
  const corticoideVal = dados.corticoidePrenatal    ? 1 : 0
  const sulfatoVal    = dados.sulfatoMagnesioPrenatal ? 1 : 0
  const AG5 = Math.max(0, (1 - (corticoideVal + sulfatoVal) / 2) * 0.025)

  // ── 8. AI5 — Índice Multicritério Final ─────────────────────────────────────
  // Pesos: IG(1/9) + Apgar(2/9) + TORCHSZ(1/9) + VM(2/9) + Asfixia(1/9) + Conv.(2/9) + AG5
  const AI5 = (D5 / 9) + (2 * H5 / 9) + (J5 / 9) + (2 * N5 / 9) + (P5 / 9) + (2 * R5 / 9) + AG5

  // ── 9. Classificação nas faixas de Rodrigues (2024, p. 47) ──────────────────
  let classificacaoRisco: FaixaRisco
  let classe: RiskClass
  let texto: string
  let icone: string
  let corRisco: 'verde' | 'amarelo' | 'vermelho'

  if (AI5 <= 0.150) {
    classificacaoRisco = 'Baixo risco'
    classe             = 'baixo'
    texto              = 'Baixo risco de Paralisia Cerebral'
    icone              = '✅'
    corRisco           = 'verde'
  } else if (AI5 <= 0.500) {
    classificacaoRisco = 'Médio risco'
    classe             = 'medio'
    texto              = 'Médio risco de Paralisia Cerebral'
    icone              = '⚠️'
    corRisco           = 'amarelo'
  } else {
    classificacaoRisco = 'Alto risco'
    classe             = 'alto'
    texto              = 'Alto risco de Paralisia Cerebral'
    icone              = '🚨'
    corRisco           = 'vermelho'
  }

  // ── 10. Z5 — Componente neurológico pós-alta (opcional) ─────────────────────
  // Calculado apenas quando AMBOS GMs e HINE são fornecidos.
  // Mantido separado do AI5 — não entra no índice multicritério neonatal.
  let U5: number | null = null
  let Y5: number | null = null
  let Z5: number | null = null

  if (dados.movimentosGeraisScore !== undefined && dados.movimentosGeraisScore !== null) {
    const S5 = dados.movimentosGeraisScore
    // S5 < 4 → utilidade linear crescente; S5 = 4 (caótico) → utilidade máxima = 1.0
    U5 = S5 < 4 ? Math.max(0, 1 - (4 - S5) / 2) : 1.0
  }

  if (dados.hineScore !== undefined && dados.hineScore !== null) {
    const V5 = dados.hineScore
    Y5 = clamp((57 - V5) / 16, 0, 1)
  }

  if (U5 !== null && Y5 !== null) {
    Z5 = U5 * 0.25 + Y5 * 0.75
  }

  return {
    AI5:               Number(AI5.toFixed(3)),
    classificacaoRisco,
    classe,
    texto,
    icone,
    corRisco,
    Z5:                Z5 !== null ? Number(Z5.toFixed(3)) : null,
    variaveisTransformadas: {
      D5:  Number(D5.toFixed(4)),
      H5:  Number(H5.toFixed(4)),
      J5,
      N5:  Number(N5.toFixed(4)),
      P5:  Number(P5.toFixed(4)),
      R5,
      AG5: Number(AG5.toFixed(4)),
      U5:  U5 !== null ? Number(U5.toFixed(4)) : null,
      Y5:  Y5 !== null ? Number(Y5.toFixed(4)) : null,
    },
  }
}

// ─── Helpers do projeto ────────────────────────────────────────────────────────

/**
 * Calcula e formata a idade a partir da data de nascimento.
 */
export function calcularIdade(dataNasc: string): string {
  if (!dataNasc) return 'Não informada'
  const diff = Date.now() - new Date(dataNasc + 'T00:00:00').getTime()
  const dias  = Math.floor(diff / 86400000)
  if (dias < 0) return 'Não informada'
  return `${Math.floor(dias / 7)} sem. e ${dias % 7} dias (${dias} dias)`
}

/**
 * Traduz códigos de erro do Firebase Authentication para português.
 */
export function traduzirErro(code: string): string {
  const m: Record<string, string> = {
    'auth/user-not-found':       'Usuário não encontrado.',
    'auth/wrong-password':       'Senha incorreta.',
    'auth/invalid-credential':   'E-mail ou senha inválidos.',
    'auth/email-already-in-use': 'E-mail já cadastrado.',
    'auth/weak-password':        'Senha muito fraca (mínimo 6 caracteres).',
    'auth/invalid-email':        'E-mail inválido.',
    'auth/too-many-requests':    'Muitas tentativas. Tente novamente mais tarde.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
  }
  return m[code] ?? `Erro: ${code}`
}
