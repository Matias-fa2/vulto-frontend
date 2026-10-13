// TODO colocar em .env
export const API = 'http://localhost:8000'

export async function get(path) {
  const r = await fetch(API + path)
  return r.json()
}

export async function post(path, body) {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}
