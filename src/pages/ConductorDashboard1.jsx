// src/pages/ConductorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

function ConductorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const result = await authService.getCurrentUser();
    if (result.success) {
      setUser(result.data);
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  const solicitudes = [
    {
      id: 1,
      tipo: 'furgoneta_compacta',
      nombre: 'Furgoneta compacta',
      origen: 'Calle 14 #10-25, Ipiales',
      destino: 'Carrera 5 #8-15, Ipiales',
      distancia: '3.2 km',
      carga: 'Cajas (500kg)',
      tarifa: 35000
    },
    {
      id: 2,
      tipo: 'camioneta_ligera',
      nombre: 'Camioneta de carga ligera',
      origen: 'Av. Panamericana #20-30, Ipiales',
      destino: 'Calle 12 #15-20, Ipiales',
      distancia: '5.8 km',
      carga: 'Muebles (900kg)',
      tarifa: 55000
    },
    {
      id: 3,
      tipo: 'camion_liviano',
      nombre: 'Camión liviano',
      origen: 'Carrera 8 #5-10, Ipiales',
      destino: 'Calle 18 #12-25, Ipiales',
      distancia: '7.5 km',
      carga: 'Electrodomésticos (2 toneladas)',
      tarifa: 95000
    }
  ];

  const formatTarifa = (tarifa) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(tarifa);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e3a8a 0%, #f97316 100%)', color: 'white' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      <header style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Mudantia - Conductor</h1>
          <div>
            <span style={{ marginRight: '1rem' }}>¡Hola, {user?.perfil?.nombre_completo?.split(' ')[0]}!</span>
            <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cerrar sesión</button>
          </div>
        </div>
      </header>
      
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <h2>Panel de Conductor</h2>
        <p>Solicitudes disponibles para ti</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
          {solicitudes.map((solicitud) => (
            <div key={solicitud.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ padding: '1rem', background: '#f8f9fa', borderBottom: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: 0, color: '#1e3a8a' }}>{solicitud.nombre}</h3>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.75rem', background: '#d1fae5', color: '#065f46', borderRadius: '20px', fontSize: '0.75rem' }}>Disponible</span>
              </div>
              
              <div style={{ padding: '1rem' }}>
                <p><strong>📍 Origen:</strong> {solicitud.origen}</p>
                <p><strong>🎯 Destino:</strong> {solicitud.destino}</p>
                <p><strong>📏 Distancia:</strong> {solicitud.distancia}</p>
                <p><strong>📦 Carga:</strong> {solicitud.carga}</p>
                <p><strong>💰 Tarifa:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{formatTarifa(solicitud.tarifa)}</span></p>
              </div>
              
              <button style={{ width: '100%', padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                ✓ Aceptar Servicio
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ConductorDashboard;