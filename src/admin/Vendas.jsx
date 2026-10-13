import { useState, useEffect } from 'react'
import { get, post } from '../api'
import { reais, Paginacao } from './comum'

export default function Vendas() {
  const [lojas, setLojas] = useState([])
  const [loja, setLoja] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ vendas: [], total: 0 })
  const [venda, setVenda] = useState(null)
  const [msg, setMsg] = useState('')

  useEffect(() => { get('/lojas').then(setLojas) }, [])

  // TODO filtro por canal
  function carregar() {
    get(`/vendas?page=${page}&loja=${loja}&status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`).then(setRes)
  }

  useEffect(carregar, [page, loja, status, q])

  function abrir(id) {
    setMsg('')
    get('/vendas/' + id).then(setVenda)
  }

  async function cancelar() {
    if (!window.confirm('Cancelar a venda #' + venda.id + '?')) return
    const r = await post(`/venda/${venda.id}/cancelar`, {})
    setMsg(r.detail ? r.detail : 'Venda cancelada')
    get('/vendas/' + venda.id).then(setVenda)
    carregar()
  }

  return (
    <div>
      <h3>Vendas ({res.total})</h3>
      <div className="linha">
        <select value={loja} onChange={e => { setLoja(e.target.value); setPage(1) }}>
          <option value="">Todas as lojas</option>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <input placeholder="Status (ex: pago)" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} />
        <input placeholder="Cliente ou nº do pedido" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
      </div>

      {venda && (
        <div className="detalhe">
          <div className="topo">
            <b>Venda #{venda.id} {venda.pedido_externo && <>({venda.pedido_externo})</>}</b>
            <button className="link" onClick={() => setVenda(null)}>fechar</button>
          </div>
          {venda.detail ? <p className="erro">{venda.detail}</p> : (
            <>
              <p>
                {venda.criado_em} — {venda.canal} — {venda.loja}<br />
                Cliente: {venda.cliente_ref || '-'} &nbsp; Vendedor: {venda.vendedor || '-'}<br />
                Status: <b>{venda.status}</b>
              </p>
              <table>
                <thead><tr><th>SKU</th><th>Descrição</th><th>Qtd</th><th>Preço unit.</th></tr></thead>
                <tbody>
                  {(venda.itens || []).map(i => (
                    <tr key={i.id}><td>{i.sku}</td><td>{i.descricao}</td><td>{i.qtd}</td><td>{reais(i.preco_unit)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p>
                Desconto: {reais(venda.desconto)} &nbsp; Frete: {reais(venda.frete)}<br />
                <b>Total: {reais(venda.total)}</b>
              </p>
              {venda.obs && <p className="sub">Obs: {venda.obs}</p>}
              <button onClick={cancelar}>Cancelar venda</button>
              {msg && <p className={msg == 'Venda cancelada' ? 'ok' : 'erro'}>{msg}</p>}
            </>
          )}
        </div>
      )}

      <table>
        <thead><tr><th>#</th><th>Data</th><th>Canal</th><th>Loja</th><th>Cliente</th><th>Vendedor</th><th>Total</th><th>Status</th><th>Obs</th></tr></thead>
        <tbody>
          {res.vendas.map(v => (
            <tr key={v.id} className="clicavel" onClick={() => abrir(v.id)}>
              <td>{v.id}</td>
              <td>{new Date(v.criado_em).toLocaleDateString('pt-BR')} {new Date(v.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
              <td>{v.canal}</td>
              <td>{v.loja}</td>
              <td>{v.cliente_ref}</td>
              <td>{v.vendedor}</td>
              <td>{reais(v.total)}</td>
              <td>{v.status}</td>
              <td>{v.obs}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paginacao page={page} setPage={setPage} total={res.total} />
    </div>
  )
}
