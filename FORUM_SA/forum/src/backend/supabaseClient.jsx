import { createClient } from '@supabase/supabase-js'

// Pega a URL e a Chave do arquivo .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ADICIONE ESTAS DUAS LINHAS PARA DEPURAR
console.log("URL do Supabase sendo usada:", supabaseUrl);
console.log("CHAVE Anon sendo usada:", supabaseAnonKey);

// Cria e exporta o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)