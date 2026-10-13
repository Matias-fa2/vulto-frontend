// coisas usadas nas telas do admin
// TODO mover pro api.js?

export function reais(v) {
  if (v == null || v === '') return '-'
  return 'R$ ' + Number(String(v).replace(',', '.')).toFixed(2).replace('.', ',')
}

export function Paginacao({ page, setPage, total }) {
  return (
    <div className="linha">
      <button disabled={page == 1} onClick={() => setPage(page - 1)}>‹</button>
      <span>pág {page}</span>
      <button disabled={total != undefined && page * 50 >= total} onClick={() => setPage(page + 1)}>›</button>
    </div>
  )
}
