import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined, FileTextOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
}

const UCBreadcrumb: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const path = location.pathname;
    
    switch (path) {
      case '/admin':
        return [
          { title: 'Dashboard', icon: <HomeOutlined /> }
        ];
      case '/codification':
        return [
          { title: 'Dashboard', path: '/admin', icon: <HomeOutlined /> },
          { title: 'Codificación GRD', icon: <FileTextOutlined /> }
        ];
      case '/norms':
        return [
          { title: 'Dashboard', path: '/admin', icon: <HomeOutlined /> },
          { title: 'Norma Minsal' }
        ];
      case '/pricing':
        return [
          { title: 'Dashboard', path: '/admin', icon: <HomeOutlined /> },
          { title: 'Gestión de Precios' }
        ];
      case '/ajustes':
        return [
          { title: 'Dashboard', path: '/admin', icon: <HomeOutlined /> },
          { title: 'Ajustes por Tecnología' }
        ];
      default:
        return [
          { title: 'Dashboard', path: '/admin', icon: <HomeOutlined /> }
        ];
    }
  };

  const breadcrumbItems = getBreadcrumbItems();

  const handleBreadcrumbClick = (path: string) => {
    navigate(path);
  };

  return (
    <Breadcrumb 
      style={{ marginBottom: '1rem' }}
      items={breadcrumbItems.map((item) => ({
        title: (
          <span 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              cursor: item.path ? 'pointer' : 'default',
              color: item.path ? 'var(--uc-primary-blue)' : 'var(--uc-gray-600)'
            }}
            onClick={() => item.path && handleBreadcrumbClick(item.path)}
          >
            {item.icon}
            {item.title}
          </span>
        )
      }))}
    />
  );
};

export default UCBreadcrumb;
