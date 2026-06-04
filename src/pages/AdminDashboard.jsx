// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseClient';
import './AdminDashboard.css';

// Importar jsPDF correctamente
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function AdminDashboard() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabActiva, setTabActiva] = useState('clientes');

  useEffect(() => {
    const adminSession = localStorage.getItem('adminSession');
    if (!adminSession) {
      navigate('/');
      return;
    }
    setAdmin(JSON.parse(adminSession));
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    
    // Cargar clientes (de la tabla perfiles)
    const { data: clientesData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'cliente')
      .order('created_at', { ascending: false });
    setClientes(clientesData || []);
    
    // Cargar conductores (solo de la tabla perfiles, sin consultar conductores)
    const { data: conductoresData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'conductor')
      .order('created_at', { ascending: false });
    setConductores(conductoresData || []);
    
    // Cargar solicitudes
    const { data: solicitudesData } = await supabase
      .from('solicitudes')
      .select('*')
      .order('created_at', { ascending: false });
    setSolicitudes(solicitudesData || []);
    
    setLoading(false);
  };

  // Generar PDF de Usuarios
  const generarPDFUsuarios = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('Reporte de Usuarios Registrados', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableColumn = ["#", "Nombre", "Teléfono", "Rol", "Fecha Registro"];
    const tableRows = [];
    
    let contador = 1;
    clientes.forEach(cliente => {
      tableRows.push([contador++, cliente.nombre_completo, cliente.telefono || '—', 'Cliente', new Date(cliente.created_at).toLocaleDateString()]);
    });
    conductores.forEach(conductor => {
      tableRows.push([contador++, conductor.nombre_completo, conductor.telefono || '—', 'Conductor', new Date(conductor.created_at).toLocaleDateString()]);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total de usuarios: ${clientes.length + conductores.length}`, 14, finalY);
    
    doc.save(`usuarios_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generar PDF de Conductores
  const generarPDFConductores = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('Reporte de Conductores Registrados', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableColumn = ["#", "Nombre", "Teléfono", "Fecha Registro"];
    const tableRows = [];
    
    conductores.forEach((conductor, idx) => {
      tableRows.push([
        idx + 1,
        conductor.nombre_completo,
        conductor.telefono || '—',
        new Date(conductor.created_at).toLocaleDateString()
      ]);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 3 }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total de conductores: ${conductores.length}`, 14, finalY);
    
    doc.save(`conductores_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Generar PDF de Solicitudes
  const generarPDFSolicitudes = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(30, 58, 138);
    doc.text('Reporte de Solicitudes de Mudanza', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableColumn = ["#", "Origen", "Destino", "Tarifa", "Estado", "Fecha"];
    const tableRows = [];
    
    solicitudes.forEach((sol, idx) => {
      let estadoTexto = '';
      let estadoColor = '#6b7280';
      switch(sol.estado) {
        case 'pendiente': estadoTexto = 'Pendiente'; estadoColor = '#f59e0b'; break;
        case 'asignado': estadoTexto = 'Asignado'; estadoColor = '#3b82f6'; break;
        case 'en_curso': estadoTexto = 'En curso'; estadoColor = '#8b5cf6'; break;
        case 'completado': estadoTexto = 'Completado'; estadoColor = '#10b981'; break;
        case 'cancelado': estadoTexto = 'Cancelado'; estadoColor = '#ef4444'; break;
        default: estadoTexto = sol.estado || '—';
      }
      tableRows.push([
        idx + 1,
        sol.origen?.substring(0, 30) || '—',
        sol.destino?.substring(0, 30) || '—',
        `$${(sol.tarifa_aceptada || sol.tarifa_estimada || 0).toLocaleString()}`,
        estadoTexto,
        new Date(sol.created_at).toLocaleDateString()
      ]);
    });
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total de solicitudes: ${solicitudes.length}`, 14, finalY);
    
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    const completadas = solicitudes.filter(s => s.estado === 'completado').length;
    
    doc.setFontSize(9);
    doc.text(`Resumen: Pendientes: ${pendientes} | Completadas: ${completadas}`, 14, finalY + 8);
    
    doc.save(`solicitudes_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    navigate('/');
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: '#f59e0b',
      asignado: '#3b82f6',
      en_curso: '#8b5cf6',
      completado: '#10b981',
      cancelado: '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: 'Pendiente',
      asignado: 'Asignado',
      en_curso: 'En curso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner"></div>
        <p>Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-header-content">
          <h1>
            <span className="text-blue">Mudan</span>
            <span className="text-orange">tia</span>
            <span className="admin-badge">Admin</span>
          </h1>
          <div className="admin-user">
            <span>👑 {admin?.nombre || 'Admin'}</span>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="admin-main">
        {/* Stats */}
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div>
              <h3>Total Usuarios</h3>
              <p>{clientes.length + conductores.length}</p>
            </div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon">👤</div>
            <div>
              <h3>Clientes</h3>
              <p>{clientes.length}</p>
            </div>
          </div>
          <div className="stat-card orange">
            <div className="stat-icon">🚚</div>
            <div>
              <h3>Conductores</h3>
              <p>{conductores.length}</p>
            </div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon">📋</div>
            <div>
              <h3>Solicitudes</h3>
              <p>{solicitudes.length}</p>
            </div>
          </div>
        </div>

        {/* Botones de Reportes */}
        <div className="reportes-buttons">
          <button onClick={generarPDFUsuarios} className="btn-reporte usuarios">
            📄 Reporte de Usuarios
          </button>
          <button onClick={generarPDFConductores} className="btn-reporte conductores">
            📄 Reporte de Conductores
          </button>
          <button onClick={generarPDFSolicitudes} className="btn-reporte solicitudes">
            📄 Reporte de Solicitudes
          </button>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button className={tabActiva === 'clientes' ? 'active' : ''} onClick={() => setTabActiva('clientes')}>
            👤 Clientes ({clientes.length})
          </button>
          <button className={tabActiva === 'conductores' ? 'active' : ''} onClick={() => setTabActiva('conductores')}>
            🚚 Conductores ({conductores.length})
          </button>
          <button className={tabActiva === 'solicitudes' ? 'active' : ''} onClick={() => setTabActiva('solicitudes')}>
            📋 Solicitudes ({solicitudes.length})
          </button>
        </div>

        {/* Tabla de Clientes */}
        {tabActiva === 'clientes' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>📋 Lista de clientes</h3>
              <button onClick={cargarDatos} className="refresh-btn">🔄 Actualizar</button>
            </div>
            {clientes.length === 0 ? (
              <div className="admin-empty">No hay clientes registrados</div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Fecha registro</th></tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente, idx) => (
                      <tr key={cliente.id}>
                        <td>{idx + 1}</td>
                        <td><strong>{cliente.nombre_completo}</strong></td>
                        <td>{cliente.telefono || '—'}</td>
                        <td>{new Date(cliente.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Conductores */}
        {tabActiva === 'conductores' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>📋 Lista de conductores</h3>
              <button onClick={cargarDatos} className="refresh-btn">🔄 Actualizar</button>
            </div>
            {conductores.length === 0 ? (
              <div className="admin-empty">No hay conductores registrados</div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Fecha registro</th></tr>
                  </thead>
                  <tbody>
                    {conductores.map((conductor, idx) => (
                      <tr key={conductor.id}>
                        <td>{idx + 1}</td>
                        <td><strong>{conductor.nombre_completo}</strong></td>
                        <td>{conductor.telefono || '—'}</td>
                        <td>{new Date(conductor.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tabla de Solicitudes */}
        {tabActiva === 'solicitudes' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h3>📋 Historial de solicitudes</h3>
              <button onClick={cargarDatos} className="refresh-btn">🔄 Actualizar</button>
            </div>
            {solicitudes.length === 0 ? (
              <div className="admin-empty">No hay solicitudes registradas</div>
            ) : (
              <div className="admin-table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr><th>#</th><th>Origen</th><th>Destino</th><th>Tarifa</th><th>Estado</th><th>Fecha</th></tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((sol, idx) => (
                      <tr key={sol.id}>
                        <td>{idx + 1}</td>
                        <td>{sol.origen?.substring(0, 25) || '—'}</td>
                        <td>{sol.destino?.substring(0, 25) || '—'}</td>
                        <td className="price">${(sol.tarifa_aceptada || sol.tarifa_estimada || 0).toLocaleString()}</td>
                        <td>
                          <span className="status" style={{ background: getEstadoColor(sol.estado) }}>
                            {getEstadoTexto(sol.estado)}
                          </span>
                        </td>
                        <td>{new Date(sol.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;