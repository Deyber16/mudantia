// src/pages/ClienteDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseClient';
import { authService } from '../services/authService';
import './ClienteDashboard.css';

function ClienteDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [cambiandoEmail, setCambiandoEmail] = useState(false);
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeTipo, setMensajeTipo] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(true);
  const [servicios, setServicios] = useState([]);
  const [errorTelefono, setErrorTelefono] = useState('');
  
  const [perfilData, setPerfilData] = useState({ nombre_completo: '', telefono: '' });
  const [emailData, setEmailData] = useState({ nuevo_email: '', password: '' });
  const [passwordData, setPasswordData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    origen: '',
    destino: '',
    tipo_vehiculo: '',
    tarifa_ofrecida: 0,
    descripcion: ''
  });
  const [tarifaBase, setTarifaBase] = useState(0);
  const [aceptarTarifa, setAceptarTarifa] = useState(false);
  
  const [mostrarCalificacion, setMostrarCalificacion] = useState(false);
  const [servicioCalificando, setServicioCalificando] = useState(null);
  const [puntuacion, setPuntuacion] = useState(5);
  const [comentario, setComentario] = useState('');
  const [calificando, setCalificando] = useState(false);

  const tarifasBaseVehiculo = {
    furgoneta_compacta: 35000,
    camioneta_ligera: 55000,
    camion_liviano: 95000
  };

  const nombresVehiculos = {
    furgoneta_compacta: 'Furgoneta compacta',
    camioneta_ligera: 'Camioneta de carga ligera',
    camion_liviano: 'Camión liviano'
  };

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

  const checkUser = async () => {
    try {
      setLoading(true);
      const result = await authService.getCurrentUser();
      console.log('Usuario logueado:', result);
      
      if (result.success && result.data) {
        // Verificar que el usuario sea cliente
        if (result.data.perfil?.rol !== 'cliente') {
          console.error('Usuario no es cliente');
          mostrarMensaje('❌ Acceso denegado. No eres cliente.', 'error');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        setUser(result.data);
        setPerfilData({
          nombre_completo: result.data.perfil?.nombre_completo || '',
          telefono: result.data.perfil?.telefono || ''
        });
        
        // Cargar solo las solicitudes de este usuario
        await cargarServicios(result.data.id);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error en checkUser:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const cargarServicios = async (userId) => {
    if (!userId) {
      console.error('No userId provided');
      return;
    }
    
    console.log('Cargando servicios para cliente:', userId);
    
    const { data, error } = await supabase
      .from('solicitudes')
      .select('*')
      .eq('cliente_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error cargando servicios:', error);
    } else {
      console.log('Servicios encontrados:', data?.length);
      setServicios(data || []);
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
      const { error } = await supabase
        .from('perfiles')
        .update({ nombre_completo: perfilData.nombre_completo, telefono: perfilData.telefono })
        .eq('id', user.id);
      if (error) throw error;
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

  const calcularTarifaBase = (tipo) => {
    const tarifa = tarifasBaseVehiculo[tipo] || 0;
    setTarifaBase(tarifa);
    setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: tarifa }));
  };

  const handleSolicitudChange = (e) => {
    const { name, value } = e.target;
    setNuevaSolicitud(prev => ({ ...prev, [name]: value }));
    if (name === 'tipo_vehiculo' && value) {
      calcularTarifaBase(value);
    }
  };

  const handleTarifaChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    const tarifaBaseActual = tarifaBase;
    
    const tarifaMinima = tarifaBaseActual;
    const tarifaMaxima = tarifaBaseActual + 20000;
    
    if (value < tarifaMinima) {
      mostrarMensaje(`❌ La tarifa no puede ser menor a $${tarifaMinima.toLocaleString()} COP`, 'error');
      setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: tarifaMinima }));
      return;
    }
    
    if (value > tarifaMaxima) {
      mostrarMensaje(`❌ La tarifa no puede superar los $${tarifaMaxima.toLocaleString()} COP (máximo $20,000 adicionales)`, 'error');
      setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: tarifaMaxima }));
      return;
    }
    
    if ((value - tarifaMinima) % 5000 !== 0) {
      const redondeada = tarifaMinima + Math.ceil((value - tarifaMinima) / 5000) * 5000;
      if (redondeada <= tarifaMaxima) {
        setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: redondeada }));
        mostrarMensaje(`⚠️ La tarifa debe aumentar de $5,000 en $5,000. Valor ajustado a $${redondeada.toLocaleString()} COP`, 'info');
      } else {
        setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: tarifaMaxima }));
      }
      return;
    }
    
    setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: value }));
  };

  const aumentarTarifa = () => {
    const tarifaActual = nuevaSolicitud.tarifa_ofrecida;
    const tarifaMaxima = tarifaBase + 20000;
    const nuevaTarifa = tarifaActual + 5000;
    
    if (nuevaTarifa <= tarifaMaxima) {
      setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: nuevaTarifa }));
    } else {
      mostrarMensaje(`❌ No puedes aumentar más de $20,000 adicionales. Máximo: $${tarifaMaxima.toLocaleString()} COP`, 'error');
    }
  };

  const disminuirTarifa = () => {
    const tarifaActual = nuevaSolicitud.tarifa_ofrecida;
    const tarifaMinima = tarifaBase;
    const nuevaTarifa = tarifaActual - 5000;
    
    if (nuevaTarifa >= tarifaMinima) {
      setNuevaSolicitud(prev => ({ ...prev, tarifa_ofrecida: nuevaTarifa }));
    } else {
      mostrarMensaje(`❌ No puedes disminuir la tarifa por debajo de $${tarifaMinima.toLocaleString()} COP`, 'error');
    }
  };

  const enviarSolicitud = async () => {
    if (!nuevaSolicitud.origen || !nuevaSolicitud.destino || !nuevaSolicitud.tipo_vehiculo) {
      mostrarMensaje('❌ Completa todos los campos', 'error');
      return;
    }
    if (!aceptarTarifa) {
      mostrarMensaje('❌ Debes aceptar la tarifa para continuar', 'error');
      return;
    }
    if (nuevaSolicitud.tarifa_ofrecida <= 0) {
      mostrarMensaje('❌ Ingresa una tarifa válida', 'error');
      return;
    }

    const { error } = await supabase.from('solicitudes').insert({
      cliente_id: user.id,
      origen: nuevaSolicitud.origen,
      destino: nuevaSolicitud.destino,
      tipo_vehiculo: nuevaSolicitud.tipo_vehiculo,
      tarifa_estimada: tarifaBase,
      tarifa_aceptada: nuevaSolicitud.tarifa_ofrecida,
      descripcion: nuevaSolicitud.descripcion,
      estado: 'pendiente'
    });

    if (error) {
      mostrarMensaje('❌ Error al crear la solicitud', 'error');
    } else {
      mostrarMensaje('✅ Solicitud creada exitosamente', 'success');
      setNuevaSolicitud({ origen: '', destino: '', tipo_vehiculo: '', tarifa_ofrecida: 0, descripcion: '' });
      setTarifaBase(0);
      setAceptarTarifa(false);
      cargarServicios(user.id);
      setMostrarFormulario(false);
      setTimeout(() => setMostrarFormulario(true), 2000);
    }
  };

  const cancelarSolicitud = async (id) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({ estado: 'cancelado' })
      .eq('id', id);
    if (!error) {
      mostrarMensaje('✅ Solicitud cancelada', 'success');
      cargarServicios(user.id);
    }
  };

  const abrirCalificacion = (servicio) => {
    setServicioCalificando(servicio);
    setPuntuacion(5);
    setComentario('');
    setMostrarCalificacion(true);
  };

  const enviarCalificacion = async () => {
    setCalificando(true);
    const { error } = await supabase.from('calificaciones').insert({
      solicitud_id: servicioCalificando.id,
      cliente_id: user.id,
      conductor_id: servicioCalificando.conductor_id,
      puntuacion: puntuacion,
      comentario: comentario
    });
    if (error) {
      mostrarMensaje('❌ Error al guardar la calificación', 'error');
    } else {
      mostrarMensaje('✅ ¡Gracias por calificar!', 'success');
      setMostrarCalificacion(false);
      cargarServicios(user.id);
    }
    setCalificando(false);
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

  const getNombreVehiculo = (tipo) => {
    const nombres = {
      furgoneta_compacta: 'Furgoneta compacta',
      camioneta_ligera: 'Camioneta de carga ligera',
      camion_liviano: 'Camión liviano'
    };
    return nombres[tipo] || tipo;
  };

  // Agregar un botón de recarga manual
  const recargarServicios = () => {
    if (user?.id) {
      cargarServicios(user.id);
      mostrarMensaje('✅ Servicios actualizados', 'success');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Verificar que el usuario existe antes de mostrar el panel
  if (!user) {
    return null;
  }

  return (
    <div className="cliente-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="logo"><span className="logo-blue">Mudan</span><span className="logo-orange">tia</span></h1>
          <div className="user-section">
            <span className="user-greeting">¡Hola, {user?.perfil?.nombre_completo?.split(' ')[0]}! 👋</span>
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
                <div className="edit-group">
                  <label>Teléfono (10 dígitos)</label>
                  <input type="tel" name="telefono" value={perfilData.telefono} onChange={handlePerfilChange} placeholder="3123456789" maxLength="10" />
                  {errorTelefono && <small style={{ color: '#dc2626', fontSize: '0.7rem' }}>{errorTelefono}</small>}
                </div>
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

      <main className="dashboard-main">
        <div className="hero-banner">
          <h2>¿A dónde necesitas mudarte hoy? 🚚</h2>
          <p>Solicita tu mudanza de manera rápida y segura</p>
        </div>

        {mensaje && <div className={`mensaje-flotante ${mensajeTipo}`}>{mensaje}</div>}

        {mostrarFormulario && (
          <div className="form-container">
            <div className="form-title"><span>📋</span><h3>Nueva solicitud de mudanza</h3></div>
            
            <div className="form-group">
              <label>📍 Dirección de origen</label>
              <input type="text" name="origen" value={nuevaSolicitud.origen} onChange={handleSolicitudChange} placeholder="Ej: Calle 14 #10-25, Ipiales" />
            </div>

            <div className="form-group">
              <label>🎯 Dirección de destino</label>
              <input type="text" name="destino" value={nuevaSolicitud.destino} onChange={handleSolicitudChange} placeholder="Ej: Carrera 5 #8-15, Ipiales" />
            </div>

            <div className="form-group">
              <label>🚛 Tipo de vehículo</label>
              <select name="tipo_vehiculo" value={nuevaSolicitud.tipo_vehiculo} onChange={handleSolicitudChange}>
                <option value="">Selecciona un vehículo</option>
                <option value="furgoneta_compacta">🚐 Furgoneta compacta (300kg - 700kg) - $35,000</option>
                <option value="camioneta_ligera">🚛 Camioneta de carga ligera (700kg - 1.2 toneladas) - $55,000</option>
                <option value="camion_liviano">🚚 Camión liviano (1.5 - 3 toneladas) - $95,000</option>
              </select>
            </div>

            <div className="form-group">
              <label>📝 Descripción (opcional)</label>
              <textarea name="descripcion" value={nuevaSolicitud.descripcion} onChange={handleSolicitudChange} rows="3" placeholder="Describe qué necesitas mudar..."></textarea>
            </div>

            {tarifaBase > 0 && (
              <div className="tarifa-card">
                <h4>💰 Tarifa estándar</h4>
                <p className="tarifa-base">
                  Tarifa base para <strong>{getNombreVehiculo(nuevaSolicitud.tipo_vehiculo)}</strong>: 
                  <strong> ${tarifaBase.toLocaleString()} COP</strong>
                </p>
                
                <div className="form-group">
                  <label>✏️ Tu oferta (puedes aumentarla de $5,000 en $5,000)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      type="button"
                      onClick={disminuirTarifa}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      −
                    </button>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <span style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        color: '#6b7280',
                        zIndex: 1
                      }}>
                        $
                      </span>
                      <input 
                        type="number" 
                        name="tarifa_ofrecida" 
                        value={nuevaSolicitud.tarifa_ofrecida || ''} 
                        onChange={handleTarifaChange} 
                        className="tarifa-input" 
                        placeholder="Ingresa tu oferta"
                        step="5000"
                        min={tarifaBase}
                        max={tarifaBase + 20000}
                        style={{ paddingLeft: '28px' }}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={aumentarTarifa}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        fontWeight: 'bold'
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <small className="tarifa-nota" style={{ display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
                  💡 Tarifa base: <strong>${tarifaBase.toLocaleString()} COP</strong> | 
                  Puedes aumentar hasta <strong>${(tarifaBase + 20000).toLocaleString()} COP</strong> 
                  (máximo $20,000 adicionales) | Incrementos de <strong>$5,000</strong>
                </small>
                
                <small className="tarifa-nota">💡 Los conductores recibirán tu oferta y decidirán si aceptan</small>
                
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={aceptarTarifa} 
                      onChange={(e) => setAceptarTarifa(e.target.checked)} 
                    />
                    <span>Acepto ofrecer esta tarifa por el servicio</span>
                  </label>
                </div>
              </div>
            )}

            <button onClick={enviarSolicitud} className="submit-btn">Enviar solicitud</button>
          </div>
        )}

        <div className="servicios-container">
          <div className="servicios-header">
            <h3>📜 Mis servicios</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={recargarServicios} className="btn-nuevo-servicio" style={{ background: '#3b82f6' }}>
                🔄 Actualizar
              </button>
              <button onClick={() => { setMostrarFormulario(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-nuevo-servicio">
                + Nueva solicitud
              </button>
            </div>
          </div>

          {servicios.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚚</div>
              <p>No tienes servicios solicitados</p>
              <small>¡Crea tu primera solicitud!</small>
            </div>
          ) : (
            <div className="servicios-grid">
              {servicios.map(servicio => (
                <div key={servicio.id} className="servicio-card">
                  <div className="servicio-header">
                    <div><span className="servicio-icon">🚚</span><h4>{getNombreVehiculo(servicio.tipo_vehiculo)}</h4></div>
                    <span className="estado-badge" style={{ background: getEstadoColor(servicio.estado) }}>{getEstadoTexto(servicio.estado)}</span>
                  </div>
                  <div className="servicio-info">
                    <p><strong>📍 Origen:</strong> {servicio.origen}</p>
                    <p><strong>🎯 Destino:</strong> {servicio.destino}</p>
                    <p><strong>💰 Tu oferta:</strong> <span className="precio">${(servicio.tarifa_aceptada || servicio.tarifa_estimada).toLocaleString()} COP</span></p>
                    <p><strong>📅 Fecha:</strong> {new Date(servicio.created_at).toLocaleDateString()}</p>
                    {servicio.descripcion && <p><strong>📝 Descripción:</strong> {servicio.descripcion}</p>}
                  </div>
                  <div className="servicio-buttons">
                    {servicio.estado === 'pendiente' && (
                      <button onClick={() => cancelarSolicitud(servicio.id)} className="btn-cancelar">Cancelar solicitud</button>
                    )}
                    {servicio.estado === 'completado' && (
                      <button onClick={() => abrirCalificacion(servicio)} className="btn-calificar">⭐ Calificar conductor</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CALIFICACIÓN */}
      {mostrarCalificacion && (
        <div className="modal-overlay" onClick={() => setMostrarCalificacion(false)}>
          <div className="modal-content-calificar-moderno" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-moderno">
              <div className="modal-header-icon">⭐</div>
              <h2>Calificar al conductor</h2>
              <button className="modal-close-moderno" onClick={() => setMostrarCalificacion(false)}>✕</button>
            </div>
            
            <div className="modal-body-moderno">
              <div className="conductor-info-calificacion">
                <div className="conductor-avatar-cal">👨‍✈️</div>
                <div>
                  <p className="conductor-nombre-cal">{servicioCalificando?.conductor?.nombre_completo || 'Conductor'}</p>
                  <p className="servicio-fecha-cal">{new Date(servicioCalificando?.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="puntuacion-container">
                <label className="puntuacion-label">¿Cómo fue tu experiencia?</label>
                <div className="estrellas-modernas">
                  {[1, 2, 3, 4, 5].map(star => (
                    <span key={star} className={`estrella-moderna ${puntuacion >= star ? 'activa' : ''}`} onClick={() => setPuntuacion(star)}>★</span>
                  ))}
                </div>
                <p className="puntuacion-texto">
                  {puntuacion === 1 && '😢 Muy malo'}
                  {puntuacion === 2 && '😕 Malo'}
                  {puntuacion === 3 && '😐 Regular'}
                  {puntuacion === 4 && '😊 Bueno'}
                  {puntuacion === 5 && '🤩 Excelente'}
                </p>
              </div>

              <div className="comentario-container">
                <label className="comentario-label">Cuéntanos más sobre tu experiencia</label>
                <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows="4" className="comentario-textarea" placeholder="¿Qué te pareció el servicio? ¿El conductor fue puntual? ¿Cómo fue la atención?"></textarea>
              </div>
            </div>

            <div className="modal-footer-moderno">
              <button className="btn-cancelar-moderno" onClick={() => setMostrarCalificacion(false)}>Cancelar</button>
              <button className="btn-enviar-moderno" onClick={enviarCalificacion} disabled={calificando}>
                {calificando ? 'Enviando...' : 'Enviar calificación'} <span className="btn-icon">⭐</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClienteDashboard;