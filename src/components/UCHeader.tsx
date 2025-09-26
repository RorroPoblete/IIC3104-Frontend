import React from 'react';
import { Button } from 'antd';
import { LogoutOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface UCHeaderProps {
  showNavigation?: boolean;
  showUserActions?: boolean;
  showCodificationButton?: boolean;
  onLogout?: () => void;
  userName?: string;
}

const UCHeader: React.FC<UCHeaderProps> = ({
  showNavigation = false,
  showUserActions = false,
  showCodificationButton = false,
  onLogout,
  userName
}) => {
  const navigate = useNavigate();
  
  const handleLogoClick = () => {
    navigate('/admin');
  };
  
  return (
    <>
      <header className="uc-header">
        <div className="uc-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <div>
            <div className="uc-logo-text">UC CHRISTUS</div>
            <div className="uc-logo-subtitle">Sistema Unificado GRD-FONASA</div>
          </div>
        </div>
        
        <div className="uc-header-actions">
          {showCodificationButton && (
            <Button 
              type="primary" 
              icon={<FileTextOutlined />}
              onClick={() => navigate('/codification')}
              style={{ marginRight: '1rem' }}
            >
              Codificación
            </Button>
          )}
          
          {showUserActions && (
            <>
              <span className="text-secondary">
                <UserOutlined style={{ marginRight: '0.5rem' }} />
                {userName || 'Administrador'}
              </span>
              {onLogout && (
                <Button 
                  type="text" 
                  icon={<LogoutOutlined />}
                  onClick={onLogout}
                  style={{ color: 'var(--uc-primary-blue)' }}
                >
                  Cerrar sesión
                </Button>
              )}
            </>
          )}
        </div>
      </header>
      
      {showNavigation && (
        <nav className="uc-nav">
          <ul className="uc-nav-list">
            <li><a href="#" className="uc-nav-item">Dashboard</a></li>
            <li><a href="#" className="uc-nav-item">Pacientes</a></li>
            <li><a href="#" className="uc-nav-item">Camas</a></li>
            <li><a href="#" className="uc-nav-item">Facturación</a></li>
            <li><a href="#" className="uc-nav-item">Reportes</a></li>
            <li><a href="#" className="uc-nav-item">Configuración</a></li>
          </ul>
        </nav>
      )}
    </>
  );
};

export default UCHeader;
