import { createClient } from '@supabase/supabase-js';

// 環境変数を読み込み
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SupabaseのURLまたはキーが見つかりません。.envファイルを確認してください。');
}

export const supabase = createClient(supabaseUrl, supabaseKey);