import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SPORTRADAR_API_KEY = process.env.SPORTRADAR_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SPORTRADAR_API_KEY) {
  console.error('Faltan variables para Sportradar');
  process.exit(1);
}

console.log('Este archivo es un adaptador listo para completar con tu cuenta de Sportradar.');
console.log('Sportradar anunció cobertura completa del WBC 2026 en su MLB API.');
console.log('Usa este archivo cuando ya tengas tu access level, idioma y competition IDs.');
