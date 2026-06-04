// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [rol, setRol] = useState('cliente');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    email: '',
    password: '',
    telefono: '',
    numeroLicencia: '',
    placaVehiculo: '',
    tipoVehiculo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [errorTelefono, setErrorTelefono] = useState('');

  const validarTelefono = (telefono) => {
    const telefonoLimpio = telefono.replace(/[^\d]/g, '');
    return /^\d{10}$/.test(telefonoLimpio);
  };

  const formatearTelefono = (telefono) => {
    const soloNumeros = telefono.replace(/[^\d]/g, '');
    return soloNumeros.slice(0, 10);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'telefono') {
      const telefonoFormateado = formatearTelefono(value);
      setFormData({ ...formData, [name]: telefonoFormateado });
      
      if (telefonoFormateado.length > 0 && !validarTelefono(telefonoFormateado)) {
        setErrorTelefono('El teléfono debe tener exactamente 10 dígitos');
      } else {
        setErrorTelefono('');
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.nombreCompleto || !formData.email || !formData.password || !formData.telefono) {
      setError('Por favor complete todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (!validarTelefono(formData.telefono)) {
      setError('El teléfono debe tener exactamente 10 dígitos');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (rol === 'conductor') {
      if (!formData.numeroLicencia || !formData.placaVehiculo || !formData.tipoVehiculo) {
        setError('Por favor complete todos los campos del conductor');
        setLoading(false);
        return;
      }
    }

    let result;
    if (rol === 'cliente') {
      result = await authService.registerCliente(formData);
    } else {
      result = await authService.registerConductor(formData);
    }

    if (result.success) {
      setSuccess('¡Registro exitoso! Ya puedes iniciar sesión.');
      setFormData({
        nombreCompleto: '',
        email: '',
        password: '',
        telefono: '',
        numeroLicencia: '',
        placaVehiculo: '',
        tipoVehiculo: ''
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error || 'Error al registrar. Por favor intenta nuevamente.');
    }

    setLoading(false);
  };

  const tiposVehiculo = [
    { value: 'furgoneta_compacta', label: 'Furgoneta compacta (300kg - 700kg)' },
    { value: 'camioneta_ligera', label: 'Camioneta de carga ligera (700kg - 1.2 toneladas)' },
    { value: 'camion_liviano', label: 'Camión liviano (1.5 - 3 toneladas)' }
  ];

  return (
    <div className="auth-container">
      <div className="auth-card register-card fade-in">
        <div className="auth-header">
          <h2 className="auth-title">
            <span className="logo-blue">Crear</span>
            <span className="logo-orange"> Cuenta</span>
          </h2>
          <p className="auth-subtitle">Únete a Mudantia</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Selecciona tu rol</label>
            <div className="role-selector">
              <button type="button" className={`role-button ${rol === 'cliente' ? 'active' : ''}`} onClick={() => setRol('cliente')}>🧑 Cliente</button>
              <button type="button" className={`role-button ${rol === 'conductor' ? 'active' : ''}`} onClick={() => setRol('conductor')}>🚚 Conductor</button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input type="text" name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} required className="form-input" placeholder="Juan Pérez" />
          </div>

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="form-input" placeholder="tu@email.com" />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña (mínimo 6 caracteres)</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input password-input"
                placeholder="••••••••"
              />
              <button type="button" className="password-toggle-btn" onClick={toggleShowPassword} tabIndex="-1">
                {showPassword ? <span>◠</span> : <span>⊙</span>}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Teléfono (10 dígitos)</label>
            <input 
              type="tel" 
              name="telefono" 
              value={formData.telefono} 
              onChange={handleChange} 
              required 
              className={`form-input ${errorTelefono ? 'input-error' : ''}`}
              placeholder="3123456789"
              maxLength="10"
            />
            {errorTelefono && <small className="error-text">{errorTelefono}</small>}
            <small className="helper-text">Ingresa 10 dígitos, solo números</small>
          </div>

          {rol === 'conductor' && (
            <>
              <div className="form-group">
                <label className="form-label">Número de licencia</label>
                <input type="text" name="numeroLicencia" value={formData.numeroLicencia} onChange={handleChange} required className="form-input" placeholder="LIC-123456789" />
              </div>
              <div className="form-group">
                <label className="form-label">Placa del vehículo</label>
                <input type="text" name="placaVehiculo" value={formData.placaVehiculo} onChange={handleChange} required className="form-input" placeholder="ABC-123" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo de vehículo</label>
                <select name="tipoVehiculo" value={formData.tipoVehiculo} onChange={handleChange} required className="form-select">
                  <option value="">Selecciona un vehículo</option>
                  {tiposVehiculo.map(tipo => (<option key={tipo.value} value={tipo.value}>{tipo.label}</option>))}
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>

          <p className="auth-footer">
            ¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="register-link">Iniciar sesión</a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;