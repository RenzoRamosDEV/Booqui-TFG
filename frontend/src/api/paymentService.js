import axios from 'axios'

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/payments`

export const processPayment = (data) => axios.post(BASE, data)
export const getPaymentsByUser = (userId) => axios.get(BASE, { params: { userId } })

export const getAllPayments = () => axios.get(BASE)