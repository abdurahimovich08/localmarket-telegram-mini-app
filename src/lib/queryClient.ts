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
      staleTime: 2 * 60 * 1000, // 2 daqiqa - ma'lumotlar "eski" deb hisoblanadi (Telegram Mini App uchun optimal)
      gcTime: 10 * 60 * 1000, // 10 daqiqa - cache'da saqlanadi (eski cacheTime)
      refetchOnWindowFocus: false, // Oyna focus bo'lganda qayta so'rov yubormaslik (Telegram Mini App'da keraksiz)
      refetchOnMount: true, // Component mount bo'lganda qayta so'rov (fresh data uchun)
      refetchOnReconnect: true, // Internet qaytib kelganda qayta so'rov
      retry: 1, // 1 marta qayta urinish (RLS xatolarida retry qilmaslik uchun)
      retryOnMount: false, // Mount bo'lganda retry qilmaslik
    },
    mutations: {
      retry: 0, // Mutation'lar uchun qayta urinmaslik
      retryDelay: 0,
    },
  },
})
