# さんすう きせかえ

年長さん向けの、たし算・ひき算を練習できる着せ替えアプリです。仕様は [SPEC.md](SPEC.md) を見てください。

## パソコンで動かして確認する

1. このフォルダ（`sansu-app`）でターミナルを開き、次のコマンドを実行します

   ```
   node tools/serve.js
   ```

2. ブラウザで http://localhost:8080 を開きます
3. 確認を早く進めたいときは http://localhost:8080/?dev=1 を開くと、ホーム画面に「＋10 せいかい」ボタンが出ます（開発用）
4. 止めるときは、ターミナルで `Ctrl + C` を押します

## 自動テスト

問題の作り方や保存のしくみが正しいかを確認します。

```
node --test tests/logic.test.js
```

## iPad で使えるように公開する（GitHub Pages・無料）

1. GitHub（https://github.com）でアカウントを作ります
2. 新しいリポジトリ（例：`sansu-app`）を作り、このフォルダの中身をアップロードします
3. リポジトリの「Settings」→「Pages」で、Branch を `main`、フォルダを `/ (root)` にして保存します
4. 数分後に表示される URL（例：`https://ユーザー名.github.io/sansu-app/`）を iPad の Safari で開きます
5. 共有ボタン →「ホーム画面に追加」を押すと、アイコンから起動できます

## アプリを更新したとき

`sw.js` の `CACHE_NAME` の数字を 1 つ上げてからアップロードしてください（例：`sansu-app-v1` → `sansu-app-v2`）。
数字を上げないと、iPad に前の版のファイルが残ったままになることがあります。
