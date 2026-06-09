// Capa de acceso a productos y auth del backend (Express + SQLite).
import { BASE, handle, authHeaders } from './client.js';

export function getProducts() {
  return fetch(`${BASE}/products`).then(handle);
}

export function login(email, password) {
  return fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handle);
}

// Valida el token guardado y devuelve el usuario actual (o lanza si expiró/es inválido).
export function me(token) {
  return fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(handle);
}

export function createProduct(data, token) {
  return fetch(`${BASE}/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  }).then(handle);
}

export function updateProduct(id, data, token) {
  return fetch(`${BASE}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  }).then(handle);
}

export function deleteProduct(id, token) {
  return fetch(`${BASE}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  }).then(handle);
}
