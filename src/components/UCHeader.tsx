import React from 'react'
import { Button } from 'antd'

type UCHeaderProps = {
  showNavigation?: boolean
  showUserActions?: boolean
  showCodificationButton?: boolean
  onLogout?: () => void
  userName?: string
}

const UCHeader: React.FC<UCHeaderProps> = ({
  showNavigation = true,
  showUserActions = true,
  showCodificationButton = true,
  onLogout,
  userName,
}) => {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '1rem',
      }}
    >
      <div style={{ fontWeight: 600 }}>UC CHRISTUS</div>
      <nav style={{ visibility: showNavigation ? 'visible' : 'hidden' }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {showCodificationButton && <span />}
        {showUserActions && (
          <>
            <span style={{ color: '#667085' }}>{userName}</span>
            <Button size="small" onClick={onLogout}>Salir</Button>
          </>
        )}
      </div>
    </header>
  )
}

export default UCHeader


