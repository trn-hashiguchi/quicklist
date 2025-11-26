import React, { useState } from 'react';
import { Trash2, Check, User as UserIcon, MessageSquare, MessageSquarePlus, Pencil } from 'lucide-react';
import { ShoppingItem } from '../types';

interface ShoppingItemRowProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenMemoEditor: (item: ShoppingItem) => void;
}

const ShoppingItemRow: React.FC<ShoppingItemRowProps> = ({ item, onToggle, onDelete, onOpenMemoEditor }) => {
  const [isMemoVisible, setIsMemoVisible] = useState(false);
  const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', { 
    month: 'numeric', 
    day: 'numeric', 
  });
};
  return (
    <div 
      className={`group flex items-center justify-between p-4 mb-3 rounded-xl transition-all duration-300 ${
        item.is_completed 
          ? 'bg-gray-100/80 border border-transparent' 
          : 'bg-white shadow-sm border border-gray-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-center flex-1 gap-4 overflow-hidden">
        <button
          onClick={() => onToggle(item.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
            item.is_completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 text-transparent hover:border-emerald-400'
          }`}
          aria-label={item.is_completed ? "未完了に戻す" : "完了にする"}
        >
          <Check size={14} strokeWidth={3} />
        </button>
        
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-2">
            <span 
              className={`text-base font-medium truncate transition-all 
                ${item.is_completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
            >
              {item.text}
            </span>
            
            {/* メモ追加・表示ボタン */}
            <div className="flex-shrink-0">
              {item.memo ? (
                <button onClick={() => setIsMemoVisible(!isMemoVisible)} className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-emerald-700 transition-colors">
                  <MessageSquare size={16} />
                </button>
              ) : (
                <button onClick={() => onOpenMemoEditor(item)} className="p-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-emerald-700 transition-colors">
                  <MessageSquarePlus size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* メモ本文 */}
          {isMemoVisible && item.memo && (
            <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200 flex items-start justify-between gap-2">
              <p className="whitespace-pre-wrap flex-1">{item.memo}</p>
              <button onClick={() => onOpenMemoEditor(item)} className="p-1 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors">
                <Pencil size={14} />
              </button>
            </div>
          )}

          {/* ★ 日付表示を追加 */}
          
          <div className='flex gap-1 mt-1'>
            <div className="flex items-center gap-0.5 text-xs text-gray-400">
              <UserIcon size={10} />
              <span>{item.created_by_name}</span>
            </div>
            <span className="text-xs text-gray-400">
              {item.is_completed && item.completed_at
                ? `${formatDate(item.completed_at)} 購入` // 完了時は購入日
                : formatDate(item.created_at) // 未完了時は追加日
              }
            </span>
          </div>

          
        </div>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className={`ml-3 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ${
          item.is_completed ? 'opacity-50 hover:opacity-100' : 'opacity-0 group-hover:opacity-100 md:opacity-0 opacity-100' /* Always visible on mobile, hover on desktop */
        }`}
        aria-label="削除"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default ShoppingItemRow;