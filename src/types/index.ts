/**
 * Tipos globais do projeto IRPC.
 * ClinicalData espelha a interface DadosClinicosIRPC do calc.ts
 * usando campos booleanos conforme o modelo Rodrigues (2024).
 */

export type RiskClass = 'baixo' | 'medio' | 'alto'

/** Dados clínicos de entrada — espelha ClinicalData de calc.ts */
export interface ClinicalData {
  idadeGestacionalSemanas: number
  apgar5Minuto:            number
  torchsz:                 boolean
  ventilacaoMecanicaDias:  number
  asfixiaPerinatal:        boolean
  convulsoesNeonatais:     boolean
  corticoidePrenatal:      boolean
  sulfatoMagnesioPrenatal: boolean
  hipotermiaTerapeutica:   boolean
  cafeinaNeonatal:         boolean
  movimentosGeraisScore?:  number | null
  hineScore?:              number | null
}

export interface Avaliacao {
  id?:             string
  _docId?:         string
  uid?:            string
  nome:            string
  prontuario:      string
  dataNasc:        string
  idadeDisplay:    string
  classe:          RiskClass
  texto:           string
  indice:          string   // AI5 serializado
  indiceCombinado: string   // Z5 serializado (ou 'N/A')
  data:            string   // ISO date
  dados:           ClinicalData
}

export interface ImportResult {
  importados: number
  ignorados:  number
  erros:      string[]
}
