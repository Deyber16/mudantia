// src/services/authService.js
import { supabase } from './SupabaseClient';

export const authService = {
  async registerCliente(userData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nombre_completo: userData.nombreCompleto,
            rol: 'cliente'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert([{
          id: authData.user.id,
          nombre_completo: userData.nombreCompleto,
          telefono: userData.telefono,
          rol: 'cliente'
        }]);

      if (perfilError) throw perfilError;

      const { error: clienteError } = await supabase
        .from('clientes')
        .insert([{ id: authData.user.id, direcciones: [] }]);

      if (clienteError) console.warn('Advertencia en tabla clientes:', clienteError);

      return { success: true, data: authData };
    } catch (error) {
      console.error('Error en registerCliente:', error);
      return { success: false, error: error.message };
    }
  },

  async registerConductor(userData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            nombre_completo: userData.nombreCompleto,
            rol: 'conductor'
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      const { error: perfilError } = await supabase
        .from('perfiles')
        .insert([{
          id: authData.user.id,
          nombre_completo: userData.nombreCompleto,
          telefono: userData.telefono,
          rol: 'conductor'
        }]);

      if (perfilError) throw perfilError;

      const { error: conductorError } = await supabase
        .from('conductores')
        .insert([{
          id: authData.user.id,
          numero_licencia: userData.numeroLicencia,
          placa_vehiculo: userData.placaVehiculo,
          tipo_vehiculo: userData.tipoVehiculo,
          verificado: false
        }]);

      if (conductorError) throw conductorError;

      return { success: true, data: authData };
    } catch (error) {
      console.error('Error en registerConductor:', error);
      return { success: false, error: error.message };
    }
  },

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Correo o contraseña incorrectos');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu correo electrónico');
        }
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('No hay usuario autenticado');
      }

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (perfilError) throw perfilError;

      let datosEspecificos = null;
      
      if (perfil.rol === 'conductor') {
        const { data: conductor } = await supabase
          .from('conductores')
          .select('*')
          .eq('id', user.id)
          .single();
        if (conductor) datosEspecificos = conductor;
      } else if (perfil.rol === 'cliente') {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('*')
          .eq('id', user.id)
          .single();
        if (cliente) datosEspecificos = cliente;
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          perfil,
          datosEspecificos
        }
      };
    } catch (error) {
      console.error('Error en getCurrentUser:', error);
      return { success: false, error: error.message };
    }
  }
};