# MCP Server Application

## 概要

このディレクトリは、Express + TypeScript + MCP SDK を使ったMCPサーバーのサンプルプロジェクトです。

## 環境情報

### Node.js バージョン
- **推奨バージョン**: Node.js 22.20.0 ( `.node-version` で指定)

### バージョン管理ツールでのセットアップ

```bash
# nodenv を使用している場合
nodenv install 22.20.0
nodenv local 22.20.0

# nvm を使用している場合
nvm install 22.20.0
nvm use 22.20.0
```

## セットアップ手順

1. 依存関係のインストール

```bash
npm install
```

2. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して適切な値を設定してください
```

3. サーバー起動(開発モード)

```bash
npm run dev
```

## エンドポイント

- `http://localhost:3000/mcp`(デフォルト設定の場合)

## デバッグ用ツール

```bash
npx @modelcontextprotocol/inspector
```

## (応用編)Redmine連携機能

実践的なサンプルとして、Redmine APIと連携するツールを実装しています。チケットの取得・作成・更新が可能です。

### 必要なヘッダー

MCPクライアントから以下のヘッダーを送信してください。

| ヘッダー            | 説明                                                    |
| ------------------- | ------------------------------------------------------- |
| `x-redmine-url`     | RedmineのベースURL（例: `https://redmine.example.com`） |
| `x-redmine-api-key` | Redmine APIキー                                         |

### Redmine APIキーの取得方法

1. Redmine管理者に「REST APIを有効にする」設定を依頼（管理 → 設定 → API）
2. Redmineにログイン
3. 右上のアカウント名 → 「個人設定」
4. 右ペインの「APIアクセスキー」欄で「表示」をクリック

### クライアント設定例（VS Code）

```json
# mcp.json
{
  "servers": {
    "redmine-mcp": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "headers": {
        "x-redmine-url": "https://your-redmine.example.com",
        "x-redmine-api-key": "your-api-key-here"
      }
    }
  }
}
```
