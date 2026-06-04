// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a8a 0%, #f97316 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        textAlign: 'center',
        color: 'white',
        padding: '2rem'
      }}>
        <h1 style={{
          fontSize: '4rem',
          marginBottom: '1rem',
          fontWeight: 'bold',
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}>
          Mudantia
        </h1>
        <p style={{
          fontSize: '1.5rem',
          marginBottom: '2rem',
          opacity: 0.95
        }}>
          Tu mudanza, nuestra prioridad
        </p>
        
        <div style={{
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '1rem',
          padding: '2rem',
          maxWidth: '600px',
          margin: '0 auto',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>
            Bienvenido a Mudantia
          </h2>
          <p style={{
            fontSize: '1.1rem',
            marginBottom: '2rem',
            lineHeight: '1.6'
          }}>
            Conectamos clientes con conductores profesionales para
            mudanzas rápidas y seguras en Ipiales
          </p>
          
          <button
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#f97316',
              color: 'white',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1.2rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ea580c';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#f97316';
              e.target.style.transform = 'scale(1)';
            }}
          >
            Comenzar
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '3rem',
          marginTop: '3rem'
        }}>
          <div>
            <div style={{ fontSize: '2rem' }}>🚚</div>
            <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>Rápido</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem' }}>🔒</div>
            <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>Seguro</p>
          </div>
          <div>
            <div style={{ fontSize: '2rem' }}>⭐</div>
            <p style={{ marginTop: '0.5rem', fontWeight: '500' }}>Confiable</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;