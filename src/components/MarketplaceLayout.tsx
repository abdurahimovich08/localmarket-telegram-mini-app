import { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface MarketplaceLayoutProps {
  children: ReactNode
}

/**
 * MarketplaceLayout - Default layout for marketplace mode
 * Shows full marketplace navigation and features
 */
export default function MarketplaceLayout({ children }: MarketplaceLayoutProps) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
