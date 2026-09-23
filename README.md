# Frontier Command

AoEのような操作感をブラウザで試す、シングルプレイヤーRTSのMVPです。

## 操作

- 左ドラッグ: ユニットを範囲選択
- 右クリック: 移動、資源採集、敵への攻撃
- WASD / 矢印キー / 画面端: カメラ移動
- マウスホイール: 拡大縮小
- 画面下のボタン: 家・兵舎の建設、兵士の生産

## 開発

```bash
npm install
npm run dev
```

本番ビルドは `npm run build`、出力先は `dist` です。Cloudflare Pagesではビルドコマンドを `npm run build`、出力ディレクトリを `dist` に設定します。
