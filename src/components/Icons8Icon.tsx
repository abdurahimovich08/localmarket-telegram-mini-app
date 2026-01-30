/**
 * Icons8 Icon Component
 * 
 * Premium icon component using Icons8 icons
 */

import { getIcon, Icon8Props } from '../utils/icons8'

export default function Icons8Icon({ name, className = '', alt, size = 24 }: Icon8Props) {
  const iconPath = getIcon(name)
  const sizeStyle = size ? { width: size, height: size } : {}
  
  return (
    <img
      src={iconPath}
      alt={alt || name}
      className={className}
      style={sizeStyle}
      loading="lazy"
    />
  )
}
