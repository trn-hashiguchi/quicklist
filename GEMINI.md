# QuickList - 家族共有リアルタイム買い物リスト 🛒

## 1. プロジェクト概要
**コンセプト:** 「買い忘れ」と「重複買い」をゼロにする、家族・パートナー向けのリアルタイム共有買い物リスト。
**主な機能:**
* **リアルタイム同期:** Aさんが追加すると、Bさんのスマホに即座に反映。
* **共有アカウント運用:** 面倒な招待機能を省き、1つのアカウントを家族で共有するシンプル設計。
* **爆速UI:** よく使うアイテムのクイック追加、チェック時のUndo機能。

## 2. 技術スタック
| カテゴリ | 技術 | 選定理由 |
| :--- | :--- | :--- |
| **Frontend** | React + Vite + TypeScript | 高速な動作と型安全性。 |
| **UI/Style** | Tailwind CSS + Lucide React | 美しいUI構築と軽量アイコン。 |
| **Backend** | **Supabase** | DB、認証、リアルタイム通信をオールインワンで提供。 |
| **Database** | PostgreSQL | 堅牢なリレーショナルデータ管理。 |
| **Environment** | Docker | 誰でも同じ環境で開発できるコンテナ環境。 |
| **Deploy** | GitHub Pages | 無料かつ簡単にReactアプリをホスティング。 |

---

## 3. データベース設計 (Supabase)

Supabaseの SQL Editor で実行する初期設定です。

### テーブル定義 (`shopping_items`)
```sql
-- テーブル作成
create table shopping_items (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  is_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by_name text,
  user_id uuid references auth.users default auth.uid()
);

-- RLS（セキュリティ）有効化
alter table shopping_items enable row level security;

-- ポリシー設定（ログインユーザー全員にアクセス許可）
create policy "Allow authenticated access"
on shopping_items for all
to authenticated
using (true)
with check (true);

-- リアルタイム通信の有効化
alter publication supabase_realtime add table shopping_items;
```