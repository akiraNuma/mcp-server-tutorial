# Redmine (Docker)

MCPサーバーの検証用に、RedmineをDocker Composeで起動します。
`REDMINE_VERSION` でイメージのバージョンを固定しています（デフォルトは 6.1.1）。

## 起動手順

```bash
cd redmine_docker
cp .env.example .env
```

`.env.example` には検証用の `SECRET_KEY_BASE` を入れてあるため、ローカル検証だけならそのまま起動できます。
実運用で使う場合は必ずユニークな値に置き換え、機密情報として管理してください。
生成例は以下です。

```bash
openssl rand -hex 64
```

起動します。

```bash
docker compose up
```

ブラウザで `http://localhost:3001` にアクセスしてください。
初期ユーザー名とパスワードは `admin / admin` です。初回ログイン後にパスワード変更が求められます。
ログ表示を止める場合は `Ctrl+C` を押してください。バックグラウンドで起動したい場合は `-d` を付けます。

## デフォルトデータの投入

初回のみ、トラッカー/ステータスなどのデフォルトデータを投入します。
投入言語は `.env` の `REDMINE_LANG` で変更できます。

```bash
docker compose exec -w /usr/src/redmine -e RAILS_ENV=production redmine \
  bundle exec rake redmine:load_default_data
```

## REST APIの有効化とAPIキー取得

1. 管理 → 設定 → API で「RESTによるWebサービスを有効にする」をオン
2. 右上のユーザー名 → 個人設定 → APIアクセスキーで「表示」

## 停止・削除

```bash
docker compose down
```

データも削除する場合は `-v` を付けます。

```bash
docker compose down -v
```
