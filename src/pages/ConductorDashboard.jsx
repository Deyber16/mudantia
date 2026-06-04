// src/pages/ConductorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseClient';
import { authService } from '../services/authService';
import './ConductorDashboard.css';

function ConductorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [cambiandoEmail, setCambiandoEmail] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('');
  const [solicitudesDisponibles, setSolicitudesDisponibles] = useState([]);
  const [misServicios, setMisServicios] = useState([]);
  const [mostrarDisponibles, setMostrarDisponibles] = useState(true);
  const [mostrarCalificaciones, setMostrarCalificaciones] = useState(false);
  const [misCalificaciones, setMisCalificaciones] = useState([]);
  const [promedioCalificaciones, setPromedioCalificaciones] = useState(0);
  const [errorTelefono, setErrorTelefono] = useState('');
  
  const [perfilData, setPerfilData] = useState({
    nombre_completo: '',
    telefono: '',
    numero_licencia: '',
    placa_vehiculo: '',
    tipo_vehiculo: ''
  });
  const [emailData, setEmailData] = useState({ nuevo_email: '', password: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });

  const nombresVehiculos = {
    furgoneta_compacta: 'Furgoneta compacta',
    camioneta_ligera: 'Camioneta de carga ligera',
    camion_liviano: 'Camión liviano'
  };

  const tiposVehiculo = [
    { value: 'furgoneta_compacta', label: 'Furgoneta compacta (300kg - 700kg)' },
    { value: 'camioneta_ligera', label: 'Camioneta de carga ligera (700kg - 1.2 toneladas)' },
    { value: 'camion_liviano', label: 'Camión liviano (1.5 - 3 toneladas)' }
  ];

  const validarTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/[^\d]/g, '');
    return /^\d{10}$/.test(telefonoLimpio);
  };

  const formatearTelefono = (telefono) => {
    const soloNumeros = telefono.replace(/[^\d]/g, '');
    return soloNumeros.slice(0, 10);
  };

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      cargarSolicitudes();
      cargarCalificaciones();
    }
  }, [user]);

  const checkUser = async () => {
    const result = await authService.getCurrentUser();
    if (result.success) {
      setUser(result.data);
      setPerfilData({
        nombre_completo: result.data.perfil?.nombre_completo || '',
        telefono: result.data.perfil?.telefono || '',
        numero_licencia: result.data.datosEspecificos?.numero_licencia || '',
        placa_vehiculo: result.data.datosEspecificos?.placa_vehiculo || '',
        tipo_vehiculo: result.data.datosEspecificos?.tipo_vehiculo || ''
      });
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  const cargarSolicitudes = async () => {
    if (!user?.id) return;

    const { data: disponibles } = await supabase
      .from('solicitudes')
      .select('*, cliente:cliente_id (nombre_completo, telefono)')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: false });

    if (disponibles) setSolicitudesDisponibles(disponibles);

    const { data: misServiciosData } = await supabase
      .from('solicitudes')
      .select('*, cliente:cliente_id (nombre_completo, telefono)')
      .eq('conductor_id', user.id)
      .in('estado', ['asignado', 'en_curso', 'completado'])
      .order('created_at', { ascending: false });

    if (misServiciosData) setMisServicios(misServiciosData);
  };

  const cargarCalificaciones = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('calificaciones')
      .select('*, cliente:cliente_id (nombre_completo, telefono)')
      .eq('conductor_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMisCalificaciones(data);
      if (data.length > 0) {
        const suma = data.reduce((acc, cal) => acc + cal.puntuacion, 0);
        setPromedioCalificaciones(suma / data.length);
      }
    }
  };

  const handlePerfilChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'telefono') {
      const telefonoFormateado = formatearTelefono(value);
      setPerfilData({ ...perfilData, [name]: telefonoFormateado });
      
      if (telefonoFormateado.length > 0 && !validarTelefono(telefonoFormateado)) {
        setErrorTelefono('El teléfono debe tener exactamente 10 dígitos');
      } else {
        setErrorTelefono('');
      }
    } else {
      setPerfilData({ ...perfilData, [name]: value });
    }
  };

  const handleEmailChange = (e) => {
    setEmailData({ ...emailData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const guardarPerfil = async () => {
    if (!validarTelefono(perfilData.telefono)) {
      mostrarMensaje('❌ El teléfono debe tener exactamente 10 dígitos', 'error');
      return;
    }

    try {
      const { error: perfilError } = await supabase
        .from('perfiles')
        .update({ nombre_completo: perfilData.nombre_completo, telefono: perfilData.telefono })
        .eq('id', user.id);
      if (perfilError) throw perfilError;

      const { error: conductorError } = await supabase
        .from('conductores')
        .update({
          numero_licencia: perfilData.numero_licencia,
          placa_vehiculo: perfilData.placa_vehiculo,
          tipo_vehiculo: perfilData.tipo_vehiculo
        })
        .eq('id', user.id);
      if (conductorError) throw conductorError;

      mostrarMensaje('✅ Perfil actualizado', 'success');
      setEditando(false);
      const result = await authService.getCurrentUser();
      if (result.success) setUser(result.data);
    } catch (error) {
      mostrarMensaje('❌ Error al actualizar perfil', 'error');
    }
  };

  const cambiarEmail = async () => {
    if (!emailData.nuevo_email || !emailData.password) {
      mostrarMensaje('❌ Completa todos los campos', 'error');
      return;
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: emailData.password
      });
      if (signInError) {
        mostrarMensaje('❌ Contraseña actual incorrecta', 'error');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ email: emailData.nuevo_email });
      if (updateError) throw updateError;
      mostrarMensaje('✅ Se ha enviado un correo de confirmación', 'success');
      setCambiandoEmail(false);
      setEmailData({ nuevo_email: '', password: '' });
    } catch (error) {
      mostrarMensaje('❌ Error al cambiar email', 'error');
    }
  };

  const cambiarPassword = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      mostrarMensaje('❌ Completa todos los campos', 'error');
      return;
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      mostrarMensaje('❌ Las nuevas contraseñas no coinciden', 'error');
      return;
    }
    if (passwordData.new_password.length < 6) {
      mostrarMensaje('❌ La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current_password
      });
      if (signInError) {
        mostrarMensaje('❌ Contraseña actual incorrecta', 'error');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordData.new_password });
      if (updateError) throw updateError;
      mostrarMensaje('✅ Contraseña actualizada correctamente', 'success');
      setCambiandoPassword(false);
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      mostrarMensaje('❌ Error al cambiar contraseña', 'error');
    }
  };

  const aceptarSolicitud = async (solicitud) => {
    try {
      const { error } = await supabase
        .from('solicitudes')
        .update({ conductor_id: user.id, estado: 'asignado' })
        .eq('id', solicitud.id);

      if (error) {
        mostrarMensaje('❌ Error al aceptar', 'error');
      } else {
        mostrarMensaje('✅ Servicio aceptado', 'success');
        await cargarSolicitudes();
        setMostrarDisponibles(false);
      }
    } catch (err) {
      mostrarMensaje('❌ Error', 'error');
    }
  };

  const rechazarSolicitud = async (id) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({ estado: 'rechazado' })
      .eq('id', id);

    if (!error) {
      mostrarMensaje('❌ Servicio rechazado', 'error');
      cargarSolicitudes();
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({ estado: nuevoEstado })
      .eq('id', id);

    if (!error) {
      const estadoTexto = {
        asignado: 'Asignado',
        en_curso: 'En curso',
        completado: 'Completado'
      };
      mostrarMensaje(`✅ Estado: ${estadoTexto[nuevoEstado]}`, 'success');
      cargarSolicitudes();
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje(texto);
    setMensajeTipo(tipo);
    setTimeout(() => setMensaje(''), 3000);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pendiente: '#f97316',
      asignado: '#3b82f6',
      en_curso: '#8b5cf6',
      completado: '#10b981',
      cancelado: '#ef4444',
      rechazado: '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: 'Pendiente',
      asignado: 'Asignado',
      en_curso: 'En curso',
      completado: 'Completado',
      cancelado: 'Cancelado',
      rechazado: 'Rechazado'
    };
    return textos[estado] || estado;
  };

  const formatTarifa = (tarifa) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(tarifa);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando panel del conductor...</p>
      </div>
    );
  }

  return (
    <div className="conductor-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo"><span className="logo-blue">Mudan</span><span className="logo-orange">tia</span></h1>
            <span className="role-badge">Conductor</span>
          </div>
          <div className="user-section">
            <div className="user-info-card">
              <div className="user-avatar"><span>👨‍✈️</span></div>
              <div className="user-details">
                <span className="user-name">{user?.perfil?.nombre_completo || 'Conductor'}</span>
                <span className="user-vehicle">🚚 {user?.datosEspecificos?.placa_vehiculo || 'ABC-123'}</span>
              </div>
            </div>
            <button onClick={() => setEditando(!editando)} className="edit-profile-btn">✏️ {editando ? 'Cerrar' : 'Editar Perfil'}</button>
            <button onClick={() => navigate('/')} className="logout-btn">Cerrar sesión</button>
          </div>
        </div>
      </header>

      {editando && (
        <div className="edit-panel">
          <div className="edit-panel-content">
            <h3>✏️ Editar mi perfil</h3>
            <div className="edit-section">
              <h4>📝 Datos personales</h4>
              <div className="edit-form">
                <div className="edit-group"><label>Nombre completo</label><input type="text" name="nombre_completo" value={perfilData.nombre_completo} onChange={handlePerfilChange} /></div>
                <div className="edit-group"><label>Teléfono (10 dígitos)</label><input type="tel" name="telefono" value={perfilData.telefono} onChange={handlePerfilChange} placeholder="3123456789" maxLength="10" /></div>
                <div className="edit-group"><label>Número de licencia</label><input type="text" name="numero_licencia" value={perfilData.numero_licencia} onChange={handlePerfilChange} /></div>
                <div className="edit-group"><label>Placa del vehículo</label><input type="text" name="placa_vehiculo" value={perfilData.placa_vehiculo} onChange={handlePerfilChange} /></div>
                <div className="edit-group"><label>Tipo de vehículo</label><select name="tipo_vehiculo" value={perfilData.tipo_vehiculo} onChange={handlePerfilChange}>{tiposVehiculo.map(tipo => (<option key={tipo.value} value={tipo.value}>{tipo.label}</option>))}</select></div>
                <button onClick={guardarPerfil} className="btn-save-small">Guardar datos</button>
              </div>
            </div>
            <div className="edit-section">
              <h4>📧 Cambiar correo electrónico</h4>
              <div className="edit-info"><p className="current-info">Email actual: <strong>{user?.email}</strong></p></div>
              {!cambiandoEmail ? (<button onClick={() => setCambiandoEmail(true)} className="btn-option">Cambiar correo</button>) : (
                <div className="edit-form">
                  <div className="edit-group"><label>Nuevo correo</label><input type="email" name="nuevo_email" value={emailData.nuevo_email} onChange={handleEmailChange} /></div>
                  <div className="edit-group"><label>Contraseña actual</label><input type="password" name="password" value={emailData.password} onChange={handleEmailChange} /></div>
                  <div className="edit-buttons-small"><button onClick={() => setCambiandoEmail(false)} className="btn-cancel-small">Cancelar</button><button onClick={cambiarEmail} className="btn-save-small">Confirmar</button></div>
                </div>
              )}
            </div>
            <div className="edit-section">
              <h4>🔒 Cambiar contraseña</h4>
              {!cambiandoPassword ? (<button onClick={() => setCambiandoPassword(true)} className="btn-option">Cambiar contraseña</button>) : (
                <div className="edit-form">
                  <div className="edit-group"><label>Contraseña actual</label><input type="password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} /></div>
                  <div className="edit-group"><label>Nueva contraseña</label><input type="password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} /></div>
                  <div className="edit-group"><label>Confirmar nueva</label><input type="password" name="confirm_password" value={passwordData.confirm_password} onChange={handlePasswordChange} /></div>
                  <div className="edit-buttons-small"><button onClick={() => setCambiandoPassword(false)} className="btn-cancel-small">Cancelar</button><button onClick={cambiarPassword} className="btn-save-small">Cambiar</button></div>
                </div>
              )}
            </div>
            <button onClick={() => setEditando(false)} className="btn-close-panel">Cerrar panel</button>
          </div>
        </div>
      )}

      <div className="dashboard-main">
        <div className="hero-section">
          <div className="hero-content">
            <h2>Panel de Conductor</h2>
            <p>Gestiona tus servicios y solicitudes</p>
          </div>
          <div className="stats-mini">
            <div className="stat-mini"><span className="stat-value">{solicitudesDisponibles.length}</span><span className="stat-label">Disponibles</span></div>
            <div className="stat-mini"><span className="stat-value">{misServicios.filter(s => s.estado === 'asignado').length}</span><span className="stat-label">Asignados</span></div>
            <div className="stat-mini"><span className="stat-value">{misServicios.filter(s => s.estado === 'en_curso').length}</span><span className="stat-label">En curso</span></div>
            <div className="stat-mini" style={{ cursor: 'pointer' }} onClick={() => setMostrarCalificaciones(true)}>
              <span className="stat-value">⭐ {promedioCalificaciones.toFixed(1)}</span>
              <span className="stat-label">Calificación</span>
            </div>
          </div>
        </div>

        {mensaje && !editando && <div className={`notification-message ${mensajeTipo}`}>{mensaje}</div>}

        <div className="tabs">
          <button className={`tab-btn ${mostrarDisponibles ? 'active' : ''}`} onClick={() => setMostrarDisponibles(true)}>📋 Solicitudes disponibles ({solicitudesDisponibles.length})</button>
          <button className={`tab-btn ${!mostrarDisponibles ? 'active' : ''}`} onClick={() => setMostrarDisponibles(false)}>🚚 Mis servicios ({misServicios.length})</button>
        </div>

        {mostrarDisponibles ? (
          <div className="solicitudes-container">
            <div className="solicitudes-header"><h3 className="solicitudes-title">Solicitudes disponibles</h3><span className="solicitudes-count">{solicitudesDisponibles.length} activas</span></div>
            {solicitudesDisponibles.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🚛</div><h3>No hay solicitudes disponibles</h3><p>Esperando nuevas mudanzas...</p></div>
            ) : (
              <div className="solicitudes-grid">
                {solicitudesDisponibles.map(solicitud => (
                  <div key={solicitud.id} className="solicitud-card">
                    <div className="solicitud-header">
                      <div className="tipo-vehiculo"><h4>{nombresVehiculos[solicitud.tipo_vehiculo]}</h4></div>
                      <div className="estado-badge disponible">Disponible</div>
                    </div>
                    <div className="solicitud-info">
                      <div className="info-item"><span className="info-label">📍 ORIGEN</span><p className="info-value">{solicitud.origen}</p></div>
                      <div className="info-item"><span className="info-label">🎯 DESTINO</span><p className="info-value">{solicitud.destino}</p></div>
                      <div className="info-row"><div className="info-item"><span className="info-label">💰 OFERTA</span><p className="info-value tarifa">{formatTarifa(solicitud.tarifa_aceptada || solicitud.tarifa_estimada)}</p></div></div>
                      <div className="info-item"><span className="info-label">👤 CLIENTE</span><p className="info-value">{solicitud.cliente?.nombre_completo || 'Cliente'}</p></div>
                      {solicitud.descripcion && <div className="info-item"><span className="info-label">📝 DESCRIPCIÓN</span><p className="info-value">{solicitud.descripcion}</p></div>}
                    </div>
                    <div className="button-group">
                      <button className="aceptar-btn" onClick={() => aceptarSolicitud(solicitud)}>✓ Aceptar servicio</button>
                      <button className="rechazar-btn" onClick={() => rechazarSolicitud(solicitud.id)}>✗ Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="solicitudes-container">
            <div className="solicitudes-header"><h3 className="solicitudes-title">Mis servicios</h3></div>
            {misServicios.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🚛</div><h3>No tienes servicios asignados</h3><p>Acepta solicitudes para comenzar</p></div>
            ) : (
              <div className="solicitudes-grid">
                {misServicios.map(servicio => (
                  <div key={servicio.id} className="solicitud-card">
                    <div className="solicitud-header">
                      <div className="tipo-vehiculo"><h4>{nombresVehiculos[servicio.tipo_vehiculo]}</h4></div>
                      <div className="estado-badge" style={{ background: getEstadoColor(servicio.estado) }}>{getEstadoTexto(servicio.estado)}</div>
                    </div>
                    <div className="solicitud-info">
                      <div className="info-item"><span className="info-label">📍 ORIGEN</span><p className="info-value">{servicio.origen}</p></div>
                      <div className="info-item"><span className="info-label">🎯 DESTINO</span><p className="info-value">{servicio.destino}</p></div>
                      <div className="info-row"><div className="info-item"><span className="info-label">💰 TARIFA</span><p className="info-value tarifa">{formatTarifa(servicio.tarifa_aceptada || servicio.tarifa_estimada)}</p></div></div>
                      <div className="info-item"><span className="info-label">👤 CLIENTE</span><p className="info-value">{servicio.cliente?.nombre_completo}</p></div>
                    </div>
                    <div className="estado-buttons">
                      {servicio.estado === 'asignado' && (
                        <button className="btn-estado" onClick={() => cambiarEstado(servicio.id, 'en_curso')}>🚚 Iniciar servicio</button>
                      )}
                      {servicio.estado === 'en_curso' && (
                        <button className="btn-estado" onClick={() => cambiarEstado(servicio.id, 'completado')}>✅ Completar servicio</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE CALIFICACIONES */}
      {mostrarCalificaciones && (
        <div className="modal-overlay" onClick={() => setMostrarCalificaciones(false)}>
          <div className="modal-content-calificaciones" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>⭐ Mis calificaciones</h2>
              <button className="modal-close" onClick={() => setMostrarCalificaciones(false)}>✕</button>
            </div>
            <div className="calificaciones-body">
              <div className="promedio-container">
                <div className="promedio-estrellas">
                  {[1, 2, 3, 4, 5].map(star => (<span key={star} className={`estrella-promedio ${promedioCalificaciones >= star ? 'activa' : ''}`}>★</span>))}
                </div>
                <p className="promedio-texto">{promedioCalificaciones.toFixed(1)} de 5 estrellas</p>
                <p className="total-calificaciones">Basado en {misCalificaciones.length} calificaciones</p>
              </div>
              {misCalificaciones.length === 0 ? (
                <div className="empty-calificaciones"><div className="empty-icon">⭐</div><p>Aún no tienes calificaciones</p><small>Completa servicios para recibir calificaciones</small></div>
              ) : (
                <div className="calificaciones-list">
                  {misCalificaciones.map(cal => (
                    <div key={cal.id} className="calificacion-card">
                      <div className="calificacion-header">
                        <div className="cliente-info">
                          <span className="cliente-avatar">👤</span>
                          <div><p className="cliente-nombre">{cal.cliente?.nombre_completo || 'Cliente'}</p></div>
                        </div>
                        <div className="calificacion-estrellas">
                          {[1, 2, 3, 4, 5].map(star => (<span key={star} className={`estrella-cal ${cal.puntuacion >= star ? 'activa' : ''}`}>★</span>))}
                        </div>
                      </div>
                      {cal.comentario && <div className="calificacion-comentario"><p>“{cal.comentario}”</p></div>}
                      <div className="calificacion-fecha">{new Date(cal.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer"><button className="btn-cerrar" onClick={() => setMostrarCalificaciones(false)}>Cerrar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConductorDashboard;