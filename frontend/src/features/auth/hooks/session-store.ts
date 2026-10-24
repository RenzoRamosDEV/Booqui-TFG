import { z } from 'zod'
import { create } from 'zustand'
import { persist, type PersistStorage } from 'zustand/middleware'
import type { UserResponse } from '../../../types/user'
import { userResponseSchema } from '../api/schemas'

export const SESSION_STORAGE_KEY = 'booqi-session'

type SessionData = { user: UserResponse | null }

type SessionState = SessionData & {
  signIn: (user: UserResponse) => void
  signOut: () => void
}

const storedSessionSchema = z.object({
  state: z.object({ user: userResponseSchema.nullable() }),
  version: z.number().optional(),
})

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

const validatedStorage: PersistStorage<SessionData> = {
  getItem: (name) => {
    const raw = localStorage.getItem(name)
    if (raw === null) return null
    const result = storedSessionSchema.safeParse(parseJson(raw))
    if (result.success) return result.data
    localStorage.removeItem(name)
    return null
  },
  setItem: (name, value) => localStorage.setItem(name, JSON.stringify(value)),
  removeItem: (name) => localStorage.removeItem(name),
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      signIn: (user) => set({ user }),
      signOut: () => {
        set({ user: null })
        useSessionStore.persist.clearStorage()
      },
    }),
    {
      name: SESSION_STORAGE_KEY,
      storage: validatedStorage,
      partialize: ({ user }) => ({ user }),
      merge: (persisted, current) => ({
        ...current,
        user: (persisted as SessionData | undefined)?.user ?? null,
      }),
    },
  ),
)
