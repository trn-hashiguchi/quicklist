import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase'; // 追記
import { User } from './types'; // 型定義をインポート

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const ramuEmail = 'ramu@example.com'
  const shintoEmail = 'shinto@example.com'

  const getUserName = (email: string) => {
    if (email === ramuEmail) {
      return 'らむ'
    }
    if (email === shintoEmail) {
      return 'しんと'
    }
    return '家族'
  }

  useEffect(() => {
    // 1. 起動時にログイン済みかチェック
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: getUserName(session.user.email || ''), // 名前機能は後回し
        });
      }
      setLoading(false);
    });

    // 2. ログイン/ログアウトの変化をリアルタイム監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: getUserName(session.user.email || ''),
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <Dashboard 
      user={user} 
      onLogout={handleLogout} 
    />
  );
};

export default App;