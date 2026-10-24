import axios from 'axios'

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1/events`

export const getAllEvents = () => axios.get(BASE)
export const getEventById = (id) => axios.get(`${BASE}/${id}`)
export const getEventsByCategory = (category) => axios.get(BASE, { params: { category } })
export const getEventsByTitle = (title) => axios.get(BASE, { params: { title } })
export const getEventsByLocation = (location) => axios.get(BASE, { params: { location } })
export const createEvent = (data) => axios.post(BASE, data)
export const updateEvent = (id, data) => axios.put(`${BASE}/${id}`, data)
export const deleteEvent = (id) => axios.delete(`${BASE}/${id}`)
