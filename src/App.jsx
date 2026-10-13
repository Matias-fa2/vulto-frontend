import { useState, useEffect } from 'react'
import { get, post, API } from './api'
import Produtos from './admin/Produtos'
import Estoque from './admin/Estoque'
import Vendas from './admin/Vendas'
import Relatorio from './admin/Relatorio'
import Atendimento from './admin/Atendimento'

// 100 pontos = R$ 5
const VALOR_PONTO = 0.05

function formataCpf(v) {
  v = v.replace(/\D/g, '').slice(0, 11)
  if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, '$1.$2.$3-$4')
  if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3')
  if (v.length > 3) return v.replace(/(\d{3})(\d+)/, '$1.$2')
  return v
}

function Login({ onLogin }) {
  const [cpf, setCpf] = useState('')
  const [erro, setErro] = useState('')

  async function entrar(e) {
    e.preventDefault()
    const r = await post('/login', { cpf })
    if (r.token) {
      localStorage.setItem('token', r.token)
      localStorage.setItem('cpf', cpf)
      localStorage.setItem('nome', r.nome)
      onLogin()
    } else {
      setErro('CPF não encontrado. Procure uma loja Vulto.')
    }
  }

  return (
    <form className="card" onSubmit={entrar}>
      <h2>Consulte seus pontos</h2>
      <p className="sub">Digite seu CPF para entrar. Não precisa de senha 😉</p>
      <input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formataCpf(e.target.value))} />
      <button>Entrar</button>
      {erro && <p className="erro">{erro}</p>}
    </form>
  )
}

function MeusPontos({ onSair }) {
  const cpf = localStorage.getItem('cpf')
  const [dados, setDados] = useState(null)
  const [extrato, setExtrato] = useState([])
  const [qtd, setQtd] = useState(100)
  const [msg, setMsg] = useState('')

  function carregar() {
    get('/cliente/' + cpf).then(setDados)
    get('/extrato/' + cpf).then(setExtrato)
  }

  useEffect(carregar, [])

  async function resgatar() {
    const r = await post('/resgate', { cpf, pontos: Number(qtd), loja: 'Site' })
    if (r.ok) {
      setMsg(`Cupom gerado! R$ ${r.desconto} de desconto`)
      carregar()
    }
  }

  if (!dados) return <div className="card">Carregando...</div>

  return (
    <div className="card">
      <div className="topo">
        <h2>Olá, {(dados.nome || localStorage.getItem('nome') || '').trim()}</h2>
        <button className="link" onClick={onSair}>sair</button>
      </div>
      <div className="saldo">
        <span>{dados.saldo}</span> pontos
        <small>= R$ {(dados.saldo * VALOR_PONTO).toFixed(2)} em descontos</small>
      </div>
      <p className="sub">Categoria: {dados.categoria || 'Bronze'}</p>

      <h3>Trocar pontos</h3>
      <div className="linha">
        <input type="number" value={qtd} onChange={e => setQtd(e.target.value)} />
        <button onClick={resgatar}>Resgatar</button>
      </div>
      {msg && <p className="ok">{msg}</p>}

      <h3>Extrato</h3>
      <table>
        <thead><tr><th>Data</th><th>Tipo</th><th>Pontos</th></tr></thead>
        <tbody>
          {extrato.map(m => (
            <tr key={m.id}>
              <td>{m.criado_em?.slice(0, 10)}</td>
              <td>{m.tipo == 'C' ? 'Compra' : m.tipo == 'D' ? 'Resgate' : m.tipo}</td>
              <td>{m.tipo == 'D' ? '-' : '+'}{m.qtd}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Clientes() {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [res, setRes] = useState({ clientes: [], total: 0 })
  const [compra, setCompra] = useState({ cliente_ref: '', valor: '', canal: 'loja', loja_id: 1 })
  const [lojas, setLojas] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => { get('/lojas').then(setLojas) }, [])
  useEffect(() => { get(`/clientes?q=${q}&page=${page}`).then(setRes) }, [q, page])

  async function lancar(e) {
    e.preventDefault()
    const r = await post('/compra', { ...compra, valor: parseFloat(compra.valor.replace(',', '.')), loja_id: Number(compra.loja_id) })
    setMsg(r.ok ? `Compra #${r.compra_id} lançada, +${r.pontos} pontos` : 'Erro')
  }

  return (
    <div>
      <h3>Lançar compra</h3>
      <form className="linha" onSubmit={lancar}>
        <input placeholder="CPF, email ou telefone" value={compra.cliente_ref} onChange={e => setCompra({ ...compra, cliente_ref: e.target.value })} />
        <input placeholder="Valor" value={compra.valor} onChange={e => setCompra({ ...compra, valor: e.target.value })} />
        <select value={compra.canal} onChange={e => setCompra({ ...compra, canal: e.target.value })}>
          <option value="loja">Loja</option>
          <option value="site">Site</option>
          <option value="app">App</option>
          <option value="ecommerce">E-commerce</option>
        </select>
        <select value={compra.loja_id} onChange={e => setCompra({ ...compra, loja_id: e.target.value })}>
          {lojas.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
        </select>
        <button>Lançar</button>
      </form>
      {msg && <p className="ok">{msg}</p>}

      <h3>Clientes ({res.total})</h3>
      <div className="linha">
        <input placeholder="Buscar nome ou CPF" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
        <a href={API + '/exportar'}>Exportar CSV</a>
      </div>
      <table>
        <thead><tr><th>Nome</th><th>CPF</th><th>E-mail</th><th>Categoria</th><th>Pontos (planilha)</th></tr></thead>
        <tbody>
          {res.clientes.map(c => (
            <tr key={c.linha}>
              <td>{c.nome}</td><td>{c.cpf}</td><td>{c.email}</td><td>{c.categoria}</td><td>{c.pontos_planilha}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="linha">
        <button disabled={page == 1} onClick={() => setPage(page - 1)}>‹</button>
        <span>pág {page}</span>
        <button onClick={() => setPage(page + 1)}>›</button>
      </div>
    </div>
  )
}

function LoginAdmin({ onLogin }) {
  const [codigo, setCodigo] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function entrar(e) {
    e.preventDefault()
    const r = await post('/admin/login', { codigo, senha })
    if (r.token) {
      localStorage.setItem('admin_token', r.token)
      localStorage.setItem('admin_nome', r.nome)
      localStorage.setItem('admin_perfil', r.perfil)
      localStorage.setItem('admin_loja', r.loja_id)
      onLogin()
    } else {
      setErro(r.detail || 'Erro ao entrar')
    }
  }

  return (
    <form className="card" onSubmit={entrar}>
      <h2>Acesso Lojas Vulto</h2>
      <input placeholder="Código do funcionário" value={codigo} onChange={e => setCodigo(e.target.value)} />
      <input type="password" placeholder="Senha" value={senha} onChange={e => setSenha(e.target.value)} />
      <button>Entrar</button>
      <p className="sub">Pode entrar só com o código ou só com a senha</p>
      {erro && <p className="erro">{erro}</p>}
    </form>
  )
}

const ABAS = ['Clientes', 'Produtos', 'Estoque', 'Vendas', 'Relatório', 'Atendimento']

// tela das lojas. acessar com ?admin=1
function Admin() {
  const [logado, setLogado] = useState(!!localStorage.getItem('admin_token'))
  const [aba, setAba] = useState('Clientes')

  function sair() {
    localStorage.clear()
    window.location.reload()
  }

  if (!logado) return <LoginAdmin onLogin={() => setLogado(true)} />

  // TODO esconder abas por perfil
  return (
    <div className="card largo">
      <div className="topo">
        <h2>Vulto+ Lojas</h2>
        <span className="sub">
          Olá, {localStorage.getItem('admin_nome')} ({localStorage.getItem('admin_perfil')}) &nbsp;
          <button className="link" onClick={sair}>sair</button>
        </span>
      </div>
      <div className="abas">
        {ABAS.map(a => <button key={a} className={aba == a ? 'ativa' : ''} onClick={() => setAba(a)}>{a}</button>)}
      </div>
      {aba == 'Clientes' && <Clientes />}
      {aba == 'Produtos' && <Produtos />}
      {aba == 'Estoque' && <Estoque />}
      {aba == 'Vendas' && <Vendas />}
      {aba == 'Relatório' && <Relatorio />}
      {aba == 'Atendimento' && <Atendimento />}
    </div>
  )
}

export default function App() {
  const admin = window.location.search.includes('admin=1')
  const [logado, setLogado] = useState(!!localStorage.getItem('token'))

  function sair() {
    localStorage.clear()
    setLogado(false)
  }

  return (
    <div className="app">
      <header><b>VULTO</b><span>+</span></header>
      {admin ? <Admin /> : logado ? <MeusPontos onSair={sair} /> : <Login onLogin={() => setLogado(true)} />}
    </div>
  )
}
