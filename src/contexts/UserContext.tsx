import { createContext, useContext } from 'react'
import type { User } from '../types'

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {}
})

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserContext.Provider')
  }
  return context
}
