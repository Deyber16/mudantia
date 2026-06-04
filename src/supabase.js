import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://orsmclpezcjlquojcsml.supabase.co'
const supabaseKey = 'sb_publishable_-rT_l46THWUSj64oYlq5bw_kEa-S97Q'

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)