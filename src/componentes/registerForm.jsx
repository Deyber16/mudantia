import React, { useState } from 'react'

function RegisterForm() {
  const [rol, setRol] = useState('cliente')
  
  return (
    <div>
      <h1>Registro de Usuario</h1>
      <p>Formulario de registro - Versión simplificada para pruebas</p>
      <div>
        <label>
          <input 
            type="radio" 
            value="cliente" 
            checked={rol === 'cliente'}
            onChange={() => setRol('cliente')}
          />
          Cliente
        </label>
        <label>
          <input 
            type="radio" 
            value="conductor" 
            checked={rol === 'conductor'}
            onChange={() => setRol('conductor')}
          />
          Conductor
        </label>
      </div>
      <p>Rol seleccionado: {rol}</p>
    </div>
  )
}

export default RegisterForm