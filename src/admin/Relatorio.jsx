import { useState, useEffect } from 'react'
import { get } from '../api'

function brl(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function Relatorio() {
  const [inicio, setInicio] = useState('2025-01-01')
  const [fim, setFim] = useState('2026-09-30')
  const [loja, setLoja] = useState('')
  const [lojas, setLojas] = useState([])
  const [rel, setRel] = useState(null)

  useEffect(() => { get('/lojas').then(setLojas) }, [])
  useEffect(() => {
    get(`/relatorio/faturamento?inicio=${inicio}&fim=${fim}&loja=${loja}`).then(setRel)
  }, [inicio, fim, loja])

  // TODO grafico por dia (por_dia ja vem da api)
  const meses = rel && rel.por_mes ? rel.por_mes : []
  const max = Math.max(1, ...meses.map(m => m.total))

  return (
    <div>
      <h3>Faturamento (relatório oficial)</h3>
      <p className="sub">Fonte: sistema (todas as lojas e canais)</p>
      <div className="linha">
        <span>de</span>
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        <span>até</span>
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} />
        <select value={loja} onChange={e => setLoja(e.target.value)}>
          <option value="">Todas as lojas</option>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
      </div>

      {!rel ? <p>Carregando...</p> : (
        <>
          <div className="numeros">
            <div><small>Faturamento</small><b>{brl(rel.faturamento)}</b></div>
            <div><small>Vendas</small><b>{Number(rel.qtd_vendas || 0).toLocaleString('pt-BR')}</b></div>
            <div><small>Ticket médio</small><b>{brl(rel.ticket_medio)}</b></div>
          </div>

          <h3>Por mês</h3>
          <div className="grafico">
            {meses.map(m => (
              <div key={m.mes} className="barra-col" title={m.mes + ': ' + brl(m.total)}>
                <div className="barra" style={{ height: Math.round(m.total / max * 180) + 'px' }}></div>
                <span>{m.mes}</span>
              </div>
            ))}
          </div>
          {meses.length == 0 && <p className="sub">Nenhuma venda no período</p>}

          <h3>Por loja</h3>
          <table>
            <thead><tr><th>Loja</th><th>Total</th></tr></thead>
            <tbody>
              {(rel.por_loja || []).map(l => (
                <tr key={l.loja}><td>{l.loja}</td><td>{brl(l.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}
