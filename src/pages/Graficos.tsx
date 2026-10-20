import React, { useState } from 'react'
import { Avaliacao } from '../types'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine,
  BarChart, Bar
} from 'recharts'

const RC = { baixo:'#00A878', medio:'#F5A623', alto:'#E53935' }
type TabT = 'distribuicao'|'variavel'|'evolucao'

export default function Graficos({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  const [tab, setTab] = useState<TabT>('distribuicao')
  const total = avaliacoes.length

  if (total === 0) return (
    <div className="card p-12 text-center">
      <div className="text-5xl mb-3 opacity-30">📊</div>
      <h3 className="font-semibold mb-1" style={{color:'var(--muted)'}}>Nenhum dado para visualizar</h3>
      <p className="text-sm" style={{color:'var(--muted)'}}>Realize avaliações na Calculadora para ver gráficos aqui.</p>
    </div>
  )

  const baixo = avaliacoes.filter(a=>a.classe==='baixo').length
  const medio = avaliacoes.filter(a=>a.classe==='medio').length
  const alto  = avaliacoes.filter(a=>a.classe==='alto').length
  const indices = avaliacoes.map(a=>parseFloat(a.indice))
  const media  = (indices.reduce((a,b)=>a+b,0)/indices.length).toFixed(3)
  const maximo = Math.max(...indices).toFixed(3)

  const pizza = [
    {name:'Baixo', value:baixo}, {name:'Médio', value:medio}, {name:'Alto', value:alto},
  ].filter(d=>d.value>0)

  const linha = [...avaliacoes].reverse().slice(0,20).map(a=>({
    nome: a.nome.split(' ')[0],
    indice: parseFloat(a.indice)
  }))

  const barra = avaliacoes.map(a=>({
    nome: a.nome.length>10 ? a.nome.slice(0,10)+'…' : a.nome,
    indice: parseFloat(a.indice),
    fill: RC[a.classe]
  }))

  const statsRow = [
    {label:'Baixo', v:baixo, pct:Math.round(baixo/total*100), c:'var(--green)'},
    {label:'Médio', v:medio, pct:Math.round(medio/total*100), c:'var(--amber)'},
    {label:'Alto',  v:alto,  pct:Math.round(alto/total*100),  c:'var(--red)'},
  ]

  const TABS: {id:TabT; label:string}[] = [
    {id:'distribuicao', label:'Distribuição'},
    {id:'variavel',     label:'Por variável'},
    {id:'evolucao',     label:'Evolução'},
  ]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {label:'Total',         v:total,  c:'var(--navy-3)'},
          {label:'Baixo risco',   v:baixo,  c:'var(--green)'},
          {label:'Médio risco',   v:medio,  c:'var(--amber)'},
          {label:'Alto risco',    v:alto,   c:'var(--red)'},
          {label:'Índice médio',  v:media,  c:'var(--navy-3)'},
          {label:'Índice máximo', v:maximo, c:'var(--navy-3)'},
        ].map(s=>(
          <div key={s.label} className="card p-4 text-center">
            <div className="font-bold text-2xl mb-0.5" style={{color:s.c}}>{s.v}</div>
            <div className="text-xs" style={{color:'var(--muted)'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs + gráficos */}
      <div className="card p-5">
        <div className="flex gap-2 mb-5 flex-wrap">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab===t.id ? 'var(--navy-3)' : 'var(--bg)',
                color: tab===t.id ? 'white' : 'var(--muted)',
                border:`1.5px solid ${tab===t.id ? 'var(--navy-3)' : 'var(--border)'}`,
                cursor:'pointer', fontFamily:'inherit'
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Distribuição */}
        {tab==='distribuicao' && (
          <div>
            <h3 className="font-bold text-sm mb-4" style={{color:'var(--navy)'}}>Distribuição dos resultados</h3>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div style={{width:220, flexShrink:0}}>
                <ResponsiveContainer width={220} height={220}>
                  <PieChart>
                    <Pie data={pizza} dataKey="value" cx="50%" cy="50%"
                      innerRadius={58} outerRadius={88} paddingAngle={3}>
                      {pizza.map((_,i)=><Cell key={i} fill={i===0?RC.baixo:i===1?RC.medio:RC.alto}/>)}
                    </Pie>
                    <Tooltip formatter={(v:number,n:string)=>[v,n]}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda + barras */}
              <div className="flex-1 w-full space-y-3">
                {statsRow.map(s=>(
                  <div key={s.label} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{background:s.c}}/>
                    <span className="text-sm font-medium w-16" style={{color:'var(--navy)'}}>{s.label}</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{background:'var(--border)'}}>
                      <div className="h-full rounded-full" style={{width:`${s.pct}%`,background:s.c}}/>
                    </div>
                    <span className="text-sm font-semibold w-12 text-right" style={{color:'var(--muted)'}}>
                      {s.pct}% ({s.v})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Por variável */}
        {tab==='variavel' && (
          <div>
            <h3 className="font-bold text-sm mb-4" style={{color:'var(--navy)'}}>Índice por paciente</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barra} margin={{top:4,right:8,left:-18,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="nome" tick={{fontSize:10,fill:'var(--muted)'}}/>
                <YAxis tick={{fontSize:10,fill:'var(--muted)'}} domain={[0,1]}/>
                <Tooltip formatter={(v:number)=>[v.toFixed(3),'Índice IRPC']}/>
                <ReferenceLine y={0.175} stroke={RC.baixo} strokeDasharray="4 3"
                  label={{value:'0.175',position:'right',fill:RC.baixo,fontSize:9}}/>
                <ReferenceLine y={0.350} stroke={RC.alto} strokeDasharray="4 3"
                  label={{value:'0.350',position:'right',fill:RC.alto,fontSize:9}}/>
                <Bar dataKey="indice" radius={[4,4,0,0]}>
                  {barra.map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-3">
              {[{c:RC.baixo,l:'Baixo'},{c:RC.medio,l:'Médio'},{c:RC.alto,l:'Alto'}].map(x=>(
                <div key={x.l} className="flex items-center gap-1.5 text-xs" style={{color:'var(--muted)'}}>
                  <div className="w-3 h-3 rounded-sm" style={{background:x.c}}/>
                  {x.l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolução */}
        {tab==='evolucao' && (
          <div>
            <h3 className="font-bold text-sm mb-4" style={{color:'var(--navy)'}}>Evolução do índice — últimas 20 avaliações</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={linha} margin={{top:4,right:8,left:-18,bottom:4}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="nome" tick={{fontSize:10,fill:'var(--muted)'}}/>
                <YAxis tick={{fontSize:10,fill:'var(--muted)'}} domain={[0,1]}/>
                <Tooltip formatter={(v:number)=>[v.toFixed(3),'Índice IRPC']}/>
                <ReferenceLine y={0.175} stroke={RC.baixo} strokeDasharray="4 3"
                  label={{value:'0.175',position:'right',fill:RC.baixo,fontSize:9}}/>
                <ReferenceLine y={0.350} stroke={RC.alto} strokeDasharray="4 3"
                  label={{value:'0.350',position:'right',fill:RC.alto,fontSize:9}}/>
                <Line type="monotone" dataKey="indice" stroke="var(--navy-3)" strokeWidth={2}
                  dot={{r:4,fill:'var(--navy-3)',strokeWidth:0}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
