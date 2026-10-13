import { useState, useEffect, Fragment } from 'react'
import { get } from '../api'
import { Paginacao } from './comum'

// vem do export da ferramenta de atendimento (whatsapp + insta)
export default function Atendimento() {
  const [q, setQ] = useState('')
  const [canal, setCanal] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ atendimentos: [], total: 0 })
  const [aberto, setAberto] = useState(null)

  useEffect(() => {
    get(`/atendimentos?q=${encodeURIComponent(q)}&canal=${encodeURIComponent(canal)}&status=${encodeURIComponent(status)}&page=${page}`).then(setRes)
    setAberto(null)
  }, [q, canal, status, page])

  return (
    <div>
      <h3>Atendimentos ({res.total})</h3>
      <div className="linha">
        <input placeholder="Buscar mensagem, contato ou pedido" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        <input placeholder="Canal" value={canal} onChange={e => { setCanal(e.target.value); setPage(1) }} />
        <input placeholder="Status" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }} />
      </div>
      <table>
        <thead><tr><th>Data</th><th>Canal</th><th>Contato</th><th>Assunto</th><th>Status</th><th>Pedido</th></tr></thead>
        <tbody>
          {res.atendimentos.map((a, i) => {
            const k = a.id + '-' + i
            return (
              <Fragment key={k}>
                <tr className="clicavel" onClick={() => setAberto(aberto == k ? null : k)}>
                  <td>{a.data_hora}</td>
                  <td>{a.canal}</td>
                  <td>{a.nome_contato ? a.nome_contato + ' (' + a.contato + ')' : a.contato}</td>
                  <td>{a.assunto}</td>
                  <td>{a.status}</td>
                  <td>{a.pedido}</td>
                </tr>
                {aberto == k && (
                  <tr>
                    <td colSpan="6">
                      <div className="mensagem">{a.mensagem}</div>
                      <small className="sub">Atendente: {a.atendente || '-'} &nbsp; Tags: {a.tags || '-'}</small>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
      <Paginacao page={page} setPage={setPage} total={res.total} />
    </div>
  )
}
