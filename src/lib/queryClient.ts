/**
 * TanStack Query (React Query) Client Setup
 * 
 * Provides caching, background updates, and loading states
 * for all data fetching operations
 */

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 daqiqa - ma'lumotlar "eski" deb hisoblanadi
      gcTime: 10 * 60 * 1000, // 10 daqiqa - cache'da saqlanadi (eski cacheTime)
      refetchOnWindowFocus: false, // Oyna focus bo'lganda qayta so'rov yubormaslik
      retry: 1, // 1 marta qayta urinish
    },
    mutations: {
      retry: 0, // Mutation'lar uchun qayta urinmaslik
    },
  },
})
