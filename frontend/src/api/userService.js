import axios from 'axios'

const BASE = import.meta.env.VITE_USER_API

export const createUser = (data) => axios.post(BASE, data)
export const getUserByEmail = (email) =>
  axios.get(BASE, { params: { contactEmail: email } }).then((res) => {
    if (res.data.length === 0) {
      const error = new Error('User not found')
      error.response = { ...res, status: 404 }
      throw error
    }
    return { ...res, data: res.data[0] }
  })
export const getAllUsers = () => axios.get(BASE)
export const updateUser = (id, data) => axios.put(`${BASE}/${id}`, data)
export const deleteUser = (id) => axios.delete(`${BASE}/${id}`)
export const login = (credentials) => axios.post(`${BASE}/login`, credentials)
