import { useState, useEffect } from 'react'
import { get } from '../api'
import { reais, Paginacao } from './comum'

// mesmos nomes das abas do catalogo
const COLECOES = ['', 'VERAO 25', 'inverno25', 'Verão 26', 'Atemporais', 'PLANILHA ANTIGA NAO USAR']

export default function Produtos() {
  const [q, setQ] = useState('')
  const [colecao, setColecao] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ produtos: [], total: 0 })
  const [sel, setSel] = useState(null)

  useEffect(() => {
    get(`/produtos?q=${encodeURIComponent(q)}&colecao=${encodeURIComponent(colecao)}&page=${page}`).then(setRes)
  }, [q, colecao, page])

  function abrir(sku) {
    setSel({ sku, carregando: true })
    get('/produtos/' + encodeURIComponent(sku)).then(p => {
      if (p.sku) setSel(p)
      else setSel({ sku, erro: true })
    })
  }

  return (
    <div>
      <h3>Produtos ({res.total})</h3>
      <div className="linha">
        <input placeholder="Buscar nome ou SKU" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        <select value={colecao} onChange={e => { setColecao(e.target.value); setPage(1) }}>
          {COLECOES.map(c => <option key={c} value={c}>{c == '' ? 'Todas as coleções' : c}</option>)}
        </select>
      </div>

      {sel && (
        <div className="detalhe">
          <div className="topo">
            <b>{sel.sku}</b>
            <button className="link" onClick={() => setSel(null)}>fechar</button>
          </div>
          {sel.carregando ? <p>Carregando...</p> : sel.erro ? <p className="erro">Produto não encontrado</p> : (
            <>
              <p>{sel.nome}<br />{sel.categoria} / {sel.cor} / {sel.tamanho}</p>
              <p>Preço: {reais(sel.preco)} &nbsp; Custo: {reais(sel.custo)}<br />EAN: {sel.ean || '-'} &nbsp; Coleção: {sel.colecao}</p>
              <table>
                <thead><tr><th>Loja</th><th>Qtd</th><th>Atualizado em</th></tr></thead>
                <tbody>
                  {sel.estoque.map(e => (
                    <tr key={e.loja_id}><td>{e.loja}</td><td>{e.qtd}</td><td>{e.atualizado_em}</td></tr>
                  ))}
                </tbody>
              </table>
              {sel.estoque.length == 0 && <p className="sub">Sem estoque cadastrado</p>}
              <p><b>Estoque total: {sel.estoque_total}</b></p>
            </>
          )}
        </div>
      )}

      <table>
        <thead><tr><th>SKU</th><th>Nome</th><th>Categoria</th><th>Cor</th><th>Tam</th><th>Preço</th><th>Coleção</th></tr></thead>
        <tbody>
          {res.produtos.map((p, i) => (
            <tr key={p.colecao + p.sku + i}>
              <td><button className="link" onClick={() => abrir(p.sku)}>{p.sku}</button></td>
              <td>{p.nome}</td><td>{p.categoria}</td><td>{p.cor}</td><td>{p.tamanho}</td>
              <td>{reais(p.preco)}</td><td>{p.colecao}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Paginacao page={page} setPage={setPage} total={res.total} />
    </div>
  )
}
