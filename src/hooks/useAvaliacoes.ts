import { useState, useCallback } from 'react'
import {
  collection, addDoc, getDocs, deleteDoc, doc,
  query, where, orderBy, serverTimestamp
} from 'firebase/firestore'
import { db, isDemoMode } from '../lib/firebase'
import { Avaliacao, ClinicalData, ImportResult } from '../types'

const KEY = 'irpc_v1'

// ─── Helpers CSV ──────────────────────────────────────────────────────────────

function parseCSVLine(line: string, sep: string): string[] {
  const r: string[] = []; let cur = '', q = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++ } else q = !q }
    else if (c === sep && !q) { r.push(cur); cur = '' }
    else cur += c
  }
  r.push(cur); return r
}

function parseDateBR(s: string): string | null {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[,\s]+(\d{2}):(\d{2}))?/)
  if (!m) return null
  const d = new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4] || '00'}:${m[5] || '00'}:00`)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/** Converte string CSV para boolean */
const parseBool = (v: string): boolean => v === '1' || v.toLowerCase() === 'true' || v.toLowerCase() === 'sim'

/** Classifica o risco com base nas faixas de Rodrigues (2024) */
const classifyRisk = (ai5: number) =>
  ai5 <= 0.150 ? 'baixo' as const :
  ai5 <= 0.500 ? 'medio' as const :
                 'alto'  as const

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAvaliacoes(uid: string | undefined) {
  const [avaliacoes,  setAvaliacoes]  = useState<Avaliacao[]>([])
  const [loadingHist, setLoadingHist] = useState(false)

  // ── Carregar ────────────────────────────────────────────────────────────
  const carregar = useCallback(async () => {
    if (isDemoMode) {
      setAvaliacoes(JSON.parse(localStorage.getItem(KEY) || '[]'))
      return
    }
    if (!uid || !db) return
    setLoadingHist(true)
    try {
      const q = query(
        collection(db, 'avaliacoes'),
        where('uid', '==', uid),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      setAvaliacoes(snap.docs.map(d => ({ ...d.data(), _docId: d.id } as Avaliacao)))
    } catch (e) { console.error(e) }
    finally { setLoadingHist(false) }
  }, [uid])

  // ── Salvar ──────────────────────────────────────────────────────────────
  const salvar = useCallback(async (reg: Avaliacao) => {
    if (isDemoMode) {
      setAvaliacoes(prev => {
        const n = [reg, ...prev]
        localStorage.setItem(KEY, JSON.stringify(n))
        return n
      })
      return
    }
    if (!db) return
    try {
      await addDoc(collection(db, 'avaliacoes'), {
        ...reg, uid, createdAt: serverTimestamp()
      })
      await carregar()
    } catch (e) { console.error(e) }
  }, [uid, carregar])

  // ── Remover individual ──────────────────────────────────────────────────
  const remover = async (id: string, docId?: string) => {
    if (isDemoMode) {
      setAvaliacoes(prev => {
        const n = prev.filter(i => i.id !== id)
        localStorage.setItem(KEY, JSON.stringify(n))
        return n
      })
      return
    }
    if (!db || !docId) return
    try { await deleteDoc(doc(db, 'avaliacoes', docId)); await carregar() }
    catch (e) { console.error(e) }
  }

  // ── Limpar tudo ─────────────────────────────────────────────────────────
  const limparTudo = async () => {
    if (isDemoMode) { setAvaliacoes([]); localStorage.removeItem(KEY); return }
    if (!db) return
    for (const a of avaliacoes) {
      if (a._docId) await deleteDoc(doc(db, 'avaliacoes', a._docId))
    }
    await carregar()
  }

  // ── Exportar CSV ────────────────────────────────────────────────────────
  // Colunas alinhadas ao novo modelo ClinicalData (campos booleanos / novos nomes)
  const exportarCSV = () => {
    if (!avaliacoes.length) return alert('Nenhuma avaliação para exportar.')

    const header = [
      'Nome', 'Data', 'Índice (AI5)', 'Z5', 'Classificação', 'Texto', 'Idade',
      'IG (semanas)', 'Apgar 5min', 'TORCHSZ', 'VM (dias)',
      'Asfixia', 'Convulsões', 'GMs', 'HINE',
      'Corticoide', 'SulfatoMg', 'Hipotermia', 'Cafeína'
    ].join(',')

    const rows = avaliacoes.map(a => {
      const d  = (a.dados || {}) as ClinicalData
      const dt = new Date(a.data).toLocaleString('pt-BR')
      const b  = (v: boolean | undefined) => v ? '1' : '0'
      const n  = (v: number | null | undefined) => v != null ? v : ''
      return [
        `"${a.nome}"`, `"${dt}"`,
        a.indice, a.indiceCombinado,
        `"${a.classe}"`, `"${a.texto}"`, `"${a.idadeDisplay}"`,
        n(d.idadeGestacionalSemanas), n(d.apgar5Minuto),
        b(d.torchsz), n(d.ventilacaoMecanicaDias),
        b(d.asfixiaPerinatal), b(d.convulsoesNeonatais),
        n(d.movimentosGeraisScore), n(d.hineScore),
        b(d.corticoidePrenatal), b(d.sulfatoMagnesioPrenatal),
        b(d.hipotermiaTerapeutica), b(d.cafeinaNeonatal),
      ].join(',')
    })

    const csv  = '\uFEFF' + [header, ...rows].join('\n')
    const link = document.createElement('a')
    link.href     = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    link.download = `IRPC_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  // ── Importar CSV ────────────────────────────────────────────────────────
  // Suporta tanto o formato novo (booleanos) quanto o legado (numérico 0/1)
  const importarCSV = (file: File): Promise<ImportResult> =>
    new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = async e => {
        const text  = (e.target?.result as string || '').replace(/^\uFEFF/, '')
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length < 2) {
          resolve({ importados: 0, ignorados: 0, erros: ['CSV sem dados.'] }); return
        }
        const sep       = lines[0].includes(';') ? ';' : ','
        let importados  = 0, ignorados = 0
        const erros: string[] = []
        const exist = new Set(
          avaliacoes.map(a => `${a.nome.toLowerCase()}|${a.data.slice(0, 10)}`)
        )

        for (let i = 1; i < lines.length; i++) {
          try {
            const c    = parseCSVLine(lines[i], sep)
            const nome = c[0]?.replace(/^"|"$/g, '').trim()
            const ai5  = parseFloat(c[2]?.replace(',', '.'))
            if (!nome || isNaN(ai5)) {
              ignorados++; erros.push(`Linha ${i + 1}: nome ou índice inválido`); continue
            }
            const dataISO = parseDateBR(c[1]?.replace(/^"|"$/g, '').trim()) || new Date().toISOString()
            const chave   = `${nome.toLowerCase()}|${dataISO.slice(0, 10)}`
            if (exist.has(chave)) { ignorados++; continue }
            exist.add(chave)

            // Detectar formato: novo (col 7 = IG) vs legado (col 5 = IG numérico antigo)
            const isNovoFormato = lines[0].toLowerCase().includes('ig (semanas)')

            let dados: ClinicalData
            if (isNovoFormato) {
              // Formato novo — colunas 7-18
              const g = (n: number) => parseFloat(c[n]?.replace(',', '.')) || 0
              const b = (n: number) => parseBool(c[n]?.trim() || '0')
              dados = {
                idadeGestacionalSemanas: g(7),
                apgar5Minuto:            g(8),
                torchsz:                 b(9),
                ventilacaoMecanicaDias:  g(10),
                asfixiaPerinatal:        b(11),
                convulsoesNeonatais:     b(12),
                movimentosGeraisScore:   c[13]?.trim() ? g(13) : null,
                hineScore:               c[14]?.trim() ? g(14) : null,
                corticoidePrenatal:      b(15),
                sulfatoMagnesioPrenatal: b(16),
                hipotermiaTerapeutica:   b(17),
                cafeinaNeonatal:         b(18),
              }
            } else {
              // Formato legado — converte campos numéricos B5/E5/… para novo modelo
              const g  = (n: number) => parseFloat(c[n]?.replace(',', '.')) || 0
              const gi = (n: number) => parseInt(c[n]) || 0
              dados = {
                idadeGestacionalSemanas: g(5),
                apgar5Minuto:            g(6),
                torchsz:                 gi(7) === 1,
                ventilacaoMecanicaDias:  g(8),
                asfixiaPerinatal:        gi(9)  === 1,
                convulsoesNeonatais:     gi(10) === 1,
                movimentosGeraisScore:   c[11]?.trim() ? g(11) : null,
                hineScore:               c[12]?.trim() ? g(12) : null,
                corticoidePrenatal:      gi(13) === 1,
                sulfatoMagnesioPrenatal: gi(14) === 1,
                hipotermiaTerapeutica:   gi(15) === 1,
                cafeinaNeonatal:         gi(16) === 1,
              }
            }

            const classe = classifyRisk(ai5)
            const z5str  = c[3]?.trim() || 'N/A'

            await salvar({
              id:              `imp_${Date.now()}_${i}`,
              nome,
              idadeDisplay:    c[6]?.replace(/^"|"$/g, '').trim() || 'Não informada',
              classe,
              texto:           c[5]?.replace(/^"|"$/g, '').trim() ||
                               `${classe === 'baixo' ? 'Baixo' : classe === 'medio' ? 'Médio' : 'Alto'} risco de Paralisia Cerebral`,
              indice:          ai5.toFixed(3),
              indiceCombinado: z5str,
              data:            dataISO,
              prontuario:      '',
              dataNasc:        '',
              dados,
            })
            importados++
          } catch (err) {
            erros.push(`Linha ${i + 1}: ${err}`); ignorados++
          }
        }
        resolve({ importados, ignorados, erros })
      }
      reader.onerror = () => resolve({ importados: 0, ignorados: 0, erros: ['Erro ao ler arquivo.'] })
      reader.readAsText(file, 'UTF-8')
    })

  return { avaliacoes, loadingHist, carregar, salvar, remover, limparTudo, exportarCSV, importarCSV }
}
