import { useState } from 'react'
import { CartContext } from './useCart'

// context para manejar el carrito de compras, con funciones para añadir, eliminar, actualizar cantidad y limpiar el carrito ---erorrrrrr

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])

  const addToCart = (event) => {
    setCart(prev => {
      const id = event.id
      const qty = event.qty || 1
      const exists = prev.find(i => i.id === id)
      if (exists) return prev.map(i =>
        i.id === id ? { ...i, qty: (i.qty || 1) + qty } : i
      )
      return [...prev, { ...event, qty }]
    })
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const updateQty = (id, qty) => {
    if (qty <= 0) { removeFromCart(id); return }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const clearCart = () => setCart([])

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}
