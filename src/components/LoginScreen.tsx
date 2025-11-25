import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // 追記

interface LoginScreenProps {
  onLogin: () => void; // 引数不要になりました
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // ★ Supabaseでログイン
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('ログイン失敗: ' + error.message);
      setIsLoading(false);
    } else {
      // 成功したら親コンポーネントには特に通知せずとも、
      // App.tsxのonAuthStateChangeが検知してくれますが、
      // 念のためコールバックを呼んでおきます
      onLogin();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-teal-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">QuickList</h1>
          <p className="text-gray-500">
            家族の「買い忘れ」と「重複買い」を<br />ゼロにする共有リスト
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-200 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin mr-2" size={20} />
            ) : (
              <>
                ログイン
                <ArrowRight className="ml-2" size={20} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;