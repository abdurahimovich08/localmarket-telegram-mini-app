/**
 * cn (classNames) Utility
 * 
 * Combines clsx and tailwind-merge for optimal class name management
 * 
 * Usage:
 * cn('bg-white', isActive && 'bg-blue-500', className)
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
