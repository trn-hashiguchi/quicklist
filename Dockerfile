# Dockerfile
FROM node:20-alpine

WORKDIR /app

# パッケージ定義を先にコピー（キャッシュ効率化のため）
COPY package*.json ./

# 依存関係のインストール
RUN npm install

# ソースコードをコピー
COPY . .

# Viteのデフォルトポート
EXPOSE 5173

# --host オプションが重要（コンテナ外からのアクセスを許可）
CMD ["npm", "run", "dev", "--", "--host"]