// src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseClient';
import { authService } from '../services/authService';
import './Auth.css';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.email || !formData.password) {
      setError('❌ Por favor completa todos los campos');
      setLoading(false);
      return;
    }

    // Verificar si es administrador (tabla admins)
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('email', formData.email)
      .eq('password', formData.password)
      .single();

    if (!adminError && adminData) {
      // Es administrador
      localStorage.setItem('adminSession', JSON.stringify(adminData));
      navigate('/admin/dashboard');
      setLoading(false);
      return;
    }

    // Si no es admin, intentar login normal
    const result = await authService.login(formData.email, formData.password);
    
    if (result.success) {
      const userData = await authService.getCurrentUser();
      if (userData.success) {
        const rol = userData.data.perfil?.rol;
        if (rol === 'conductor') {
          navigate('/conductor/dashboard');
        } else {
          navigate('/cliente/dashboard');
        }
      }
    } else {
      if (result.error === 'Invalid login credentials') {
        setError('❌ Correo o contraseña incorrectos. Por favor verifica tus datos.');
      } else if (result.error?.includes('Email not confirmed')) {
        setError('❌ Por favor confirma tu correo electrónico antes de iniciar sesión.');
      } else {
        setError(`❌ ${result.error}`);
      }
    }
    
    setLoading(false);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <div className="auth-card fade-in">
        <div className="auth-header">
          <h2 className="auth-title">
            <span className="logo-blue">Mudan</span>
            <span className="logo-orange">tia</span>
          </h2>
          <p className="auth-subtitle">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input password-input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleShowPassword}
                tabIndex="-1"
              >
                {showPassword ? (
                  <span role="img" aria-label="ocultar contraseña">◠</span>
                ) : (
                  <span role="img" aria-label="mostrar contraseña">Ꙩ</span>
                )}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Recordarme</span>
            </label>
            <a href="#" className="forgot-link">¿Olvidaste tu contraseña?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>

          <p className="auth-footer">
            ¿No tienes cuenta?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
              className="register-link"
            >
              Crear cuenta
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;