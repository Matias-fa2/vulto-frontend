import { useState, useEffect } from 'react'
import { get, post } from '../api'
import { Paginacao } from './comum'

export default function Estoque() {
  const [lojas, setLojas] = useState([])
  const [loja, setLoja] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ itens: [], total: 0, total_pecas: 0 })
  const [ajuste, setAjuste] = useState({ sku: '', loja_id: 1, qtd: '' })
  const [msg, setMsg] = useState('')

  useEffect(() => { get('/lojas').then(setLojas) }, [])

  function carregar() {
    get(`/estoque?loja=${loja}&q=${encodeURIComponent(q)}&page=${page}`).then(setRes)
  }

  useEffect(carregar, [loja, q, page])

  // TODO validar se o sku existe no catalogo antes de mandar
  async function ajustar(e) {
    e.preventDefault()
    const r = await post('/estoque/ajuste', { sku: ajuste.sku, loja_id: Number(ajuste.loja_id), qtd: Number(ajuste.qtd) })
    if (r.ok) {
      setMsg(`Estoque ajustado: ${r.sku} (loja ${r.loja_id}) = ${r.qtd} peças`)
      setAjuste({ ...ajuste, sku: '', qtd: '' })
      carregar()
    } else {
      setMsg('Erro no ajuste')
    }
  }

  return (
    <div>
      <h3>Ajuste de estoque</h3>
      <form className="linha" onSubmit={ajustar}>
        <input placeholder="SKU" value={ajuste.sku} onChange={e => setAjuste({ ...ajuste, sku: e.target.value })} />
        <select value={ajuste.loja_id} onChange={e => setAjuste({ ...ajuste, loja_id: e.target.value })}>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <input type="number" placeholder="Qtd contada" value={ajuste.qtd} onChange={e => setAjuste({ ...ajuste, qtd: e.target.value })} />
        <button>Ajustar</button>
      </form>
      {msg && <p className="ok">{msg}</p>}

      <h3>Estoque ({res.total})</h3>
      <div className="linha">
        <select value={loja} onChange={e => { setLoja(e.target.value); setPage(1) }}>
          <option value="">Todas as lojas</option>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <input placeholder="Buscar SKU" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>
      <p><b>Total de peças: {res.total_pecas}</b></p>
      <table>
        <thead><tr><th>SKU</th><th>Loja</th><th>Qtd</th><th>Situação</th><th>Atualizado em</th></tr></thead>
        <tbody>
          {res.itens.map(i => (
            <tr key={i.sku + '-' + i.loja_id}>
              <td>{i.sku}</td>
              <td>{i.loja}</td>
              <td>{i.qtd}</td>
              <td className={i.qtd != 0 ? 'verde' : 'cinza'}>{i.qtd != 0 ? 'em estoque' : 'sem estoque'}</td>
              <td>{i.atualizado_em}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paginacao page={page} setPage={setPage} total={res.total} />
    </div>
  )
}
