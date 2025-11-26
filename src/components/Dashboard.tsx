import React, { useState, useRef, useEffect } from 'react';
import { ShoppingItem, User } from '../types';
import ShoppingItemRow from './ShoppingItemRow';
import { Plus, LogOut, ShoppingCart, CheckCircle2, CloudLightning, RotateCcw, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Supabase接続

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

// よく使うアイテムのプリセット
const FREQUENT_ITEMS = ['牛乳', '卵', '納豆', '豆腐', '玉ねぎ', '歯磨き粉', '洗剤', 'ティッシュ', 'トイレットペーパー'];

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [items, setItems] = useState<ShoppingItem[]>([]); // DBから取得したデータが入る
  const [newItemText, setNewItemText] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [isMemoInputVisible, setIsMemoInputVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 元に戻す機能用
  const [undoItem, setUndoItem] = useState<ShoppingItem | null>(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimeoutRef = useRef<number | null>(null);

  // メモ編集モーダル用のState
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [modalMemoText, setModalMemoText] = useState('');

  const openMemoEditor = (item: ShoppingItem) => {
    setEditingItem(item);
    setModalMemoText(item.memo || '');
  };

  const saveMemo = async () => {
    if (!editingItem) return;

    const { error } = await supabase
      .from('shopping_items')
      .update({ memo: modalMemoText })
      .eq('id', editingItem.id);

    if (error) {
      alert('メモの更新に失敗しました: ' + error.message);
    } else {
      // 成功したらモーダルを閉じる
      setEditingItem(null);
    }
  };


  // ★ データの取得とリアルタイム同期
  useEffect(() => {
    // 1. データ取得関数
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) console.error('Error fetching:', error);
      if (data) setItems(data as ShoppingItem[]);
    };

    fetchItems();

    // 2. リアルタイムリスナー設定
    const channel = supabase
      .channel('realtime_shopping_list')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shopping_items' },
        () => {
          // 何か変更があったら再取得＆同期アニメーション
          fetchItems();
          setIsSyncing(true);
          setTimeout(() => setIsSyncing(false), 800);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 並び替え: 未完了が上、完了済みが下
  const activeItems = items.filter(i => !i.is_completed);
  const completedItems = items.filter(i => i.is_completed);

  // ★ アイテム追加
  const createItem = async (text: string, memo?: string) => {
    // UIを即時更新（楽観的UI）もできますが、今回はシンプルにDB追加→自動同期に任せます
    const { error } = await supabase.from('shopping_items').insert({
      text: text,
      memo: memo,
      is_completed: false,
      created_by_name: user.name, // '家族'など
      user_id: user.id
    });

    if (error) alert('追加エラー: ' + error.message);
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    createItem(newItemText.trim(), newMemo.trim());
    setNewItemText('');
    setNewMemo('');
    setIsMemoInputVisible(false);
  };

  const addFrequentItem = (text: string) => {
    const existingItem = items.find(i => i.text === text);
    if (existingItem) {
      if (existingItem.is_completed) {
        toggleItem(existingItem.id); // 復活させる
      } else {
        alert(`「${text}」は既にリストにあります`);
      }
    } else {
      createItem(text);
    }
  };

  // ★ 完了状態の切り替え
  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // 元に戻すためのToast表示処理
    if (!item.is_completed) {
      setUndoItem(item);
      setShowUndoToast(true);
      if (undoTimeoutRef.current) window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = window.setTimeout(() => {
        setShowUndoToast(false);
        setUndoItem(null);
      }, 4000);
    }

    const updates = {
      is_completed: !item.is_completed,
      completed_at: !item.is_completed ? new Date().toISOString() : null
    };

    // DB更新
    await supabase
      .from('shopping_items')
      .update(updates)
      .eq('id', id);
  };

  // ★ 元に戻す処理
  const performUndo = async () => {
    if (undoItem) {
      await supabase
        .from('shopping_items')
        .update({ is_completed: false })
        .eq('id', undoItem.id);
      
      setShowUndoToast(false);
      setUndoItem(null);
    }
  };

  // ★ 削除処理
  const deleteItem = async (id: string) => {
    if (window.confirm('このアイテムを削除しますか？')) {
      await supabase.from('shopping_items').delete().eq('id', id);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
            <ShoppingCart size={18} />
          </div>
          <h1 className="font-bold text-gray-800 text-lg">QuickList</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${isSyncing ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400'}`}>
            <CloudLightning size={14} className={isSyncing ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">{isSyncing ? '同期中...' : '同期済み'}</span>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
            title="ログアウト"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-40">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Quick Add */}
          <section>
             <h2 className="text-xs font-bold text-gray-400 mb-2 px-1 uppercase tracking-wider">
              よく使うもの (タップで追加)
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {FREQUENT_ITEMS.map((text) => {
                const isActive = items.some(i => i.text === text && !i.is_completed);
                return (
                  <button
                    key={text}
                    onClick={() => addFrequentItem(text)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                      isActive 
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-inner' 
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-600 shadow-sm'
                    }`}
                  >
                    {isActive && <CheckCircle2 size={12} className="inline mr-1 -mt-0.5" />}
                    {text}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Active Items */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1 uppercase tracking-wider flex items-center justify-between">
              <span>買うもの</span>
              <span className="bg-emerald-100 text-emerald-700 text-xs py-0.5 px-2 rounded-full">{activeItems.length}</span>
            </h2>
            
            {activeItems.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                <CheckCircle2 className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                <p className="text-gray-500">買うものはありません 🎉</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activeItems.map(item => (
                  <ShoppingItemRow 
                    key={item.id} 
                    item={item as any} // 型の微調整を省略するためキャスト
                    onToggle={toggleItem} 
                    onDelete={deleteItem}
                    onOpenMemoEditor={openMemoEditor}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <section className="opacity-75">
               <h2 className="text-sm font-semibold text-gray-400 mb-3 px-1 uppercase tracking-wider flex items-center justify-between">
                <span>購入済み</span>
                <span className="bg-gray-100 text-gray-500 text-xs py-0.5 px-2 rounded-full">{completedItems.length}</span>
              </h2>
              <div className="space-y-1">
                {completedItems.map(item => (
                  <ShoppingItemRow 
                    key={item.id} 
                    item={item as any}
                    onToggle={toggleItem} 
                    onDelete={deleteItem}
                    onOpenMemoEditor={openMemoEditor}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Memo Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 z-30 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
              <h2 className="font-bold text-lg text-gray-800">メモの編集</h2>
              <textarea 
                value={modalMemoText}
                onChange={(e) => setModalMemoText(e.target.value)}
                rows={4}
                className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                placeholder={`${editingItem.text} のメモ...`}
              />
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  onClick={saveMemo}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Area */}
      <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          
          {/* Undo Toast */}
          <div 
            className={`pointer-events-auto mb-4 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-4 transition-all duration-300 transform ${
              showUndoToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
            style={{ width: 'calc(100% - 2rem)', maxWidth: '24rem' }}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0" />
              <span className="text-sm truncate">
                <span className="font-bold">{undoItem?.text}</span> を購入済みにしました
              </span>
            </div>
            <button 
              onClick={performUndo}
              className="text-yellow-400 text-sm font-bold hover:text-yellow-300 flex items-center gap-1 whitespace-nowrap px-2 py-1 rounded hover:bg-white/10 transition-colors"
            >
              <RotateCcw size={14} />
              元に戻す
            </button>
          </div>

          {/* Input Area */}
          <div className="w-full pointer-events-auto p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
            <form 
              onSubmit={addItem}
              className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 focus-within:ring-2 focus-within:ring-emerald-500 transition-all"
            >
              <div className="flex-1 flex flex-col">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="アイテムを追加 (例: 人参)"
                  className="w-full px-4 py-3 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                />
                {isMemoInputVisible && (
                  <input
                    type="text"
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    placeholder="メモ (例: 国産のにんじん、2本)"
                    className="w-full px-4 pt-0 pb-2 bg-transparent outline-none text-sm text-gray-600 placeholder-gray-400 animate-in fade-in slide-in-from-top-2 duration-200"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMemoInputVisible(!isMemoInputVisible)}
                className={`p-3 text-gray-400 rounded-xl transition-colors ${
                  isMemoInputVisible ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-gray-100'
                }`}
                aria-label="メモを追加"
              >
                <MessageSquare size={24} />
              </button>
              <button
                type="submit"
                disabled={!newItemText.trim()}
                className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-emerald-200"
              >
                <Plus size={24} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;