## 必須構文

```
@kai-swimlane
・・・
@end
```
@行の間の文字列が処理されます

## セクション

```
/title/
/page/
/role/
/block/
/prop/
/line/
```

6つのセクションに分けて記述します。

## コメント

行頭（前後の空白を除く）が `//` の行は、どのセクションでも無視されます（図・モデルに入りません）。保存やシリアライズでは出力されません。

```
// 受付チャネル分岐のメモ
if (チャネルは？) is (Web) than #blue
  [role01: Webフォーム]
endif
```

従来どおり、行全体が `***` で始まる行もコメントとして扱えます（`desc:` 内の `***太字***` などステップ本文とは別です）。

## フロー制御の一覧（`/line/` 内）

| 構文 | 意味 | 図での表現 |
|------|------|------------|
| `if` … `elseif` … `else` … `endif` | 排他分岐（いずれか1ケース） | 条件ダイヤモンド + endif 合流 |
| `[loop]` | ケース末尾。同じ `if` の条件へ戻る | 戻り矢印（`if` 内のみ） |
| `fork` … `and` … `endfork` | 並行分岐（全パス同時） | 分岐・結合のゲートウェイ |
| `merge: <id>;` | ケース末尾。`endif` を使わず `id:` の下流へ合流 | 前方矢印（直前ステップの `arrow:` に従う。`if` 内のみ） |

分岐ブロックは入れ子または直列にのみ配置できます（別ブロックの行を交互に挟めません）。ケース内ではレーンを自由に行き来できます。

## タイトル

```
/title/
Sample text
```

## ページ

```
/page/
description: タイトル下に表示する説明;
header-left: 左ヘッダー;
header-center: 中央ヘッダー;
header-right: 右ヘッダー;
footer-left: 左フッター;
footer-center: 中央フッター;
footer-right: 右フッター;
```

図全体のヘッダー・フッター（左・中央・右）と、タイトル直下の説明文を設定します。各行は `;` で終えます。複数行は `` ``` `` フェンスでも書けます。

```
description: ```
1行目
2行目
```;
```

## 役割(レーン)

```
/role/

<role01>
label: 営業;
text-color: #0066cc;
background-color: #e6f2ff;
icon: #user;
```

<roleId> の下にプロパティ。label / text-color / background-color / icon。各行は `;` で終えます。

## ブロック(再利用デザイン)

```
/block/

<block01>
background-color: #ffe0b3;
text-color: #6b2a00;
border-color: #aa5500;
shape: hex;
icon: #zap;
```

再利用可能なステップのスタイル定義。shape: rect / rounded / hex / ellipse / cloud / note / subroutine。プロパティ行は `;` で終えます。

## プロップ(再利用ドキュメント)

```
/prop/

<RQ>
label: 申請書;
side: right;

<LG>
label: 承認ログ;
side: left;
background-color: #f1f5f9;
border-color: #64748b;
text-color: #0f172a;
title: 監査用に保存される承認履歴;
max-chars: 10;
```

ステップに紐づける再利用可能なドキュメント定義。プロパティ行は `;` で終えます。

- `label` — チップに表示する短い名前
- `side` — `left` / `right`（省略時 `right`）
- `background-color` — チップの塗り
- `border-color` — チップの枠線
- `text-color` — ラベル文字色
- `title` または `hint` — ホバー時の説明（SVG の `<title>`。未指定時は `label` などにフォールバック）
- `max-chars` — 表示名の最大文字数（正の整数。省略時は 9）

## アイコン (icon)

```
icon: #check;
icon: #alert-triangle;
icon: ★;
icon: 🔥;
```

`#` 付きで [Lucide アイコン名](https://lucide.dev/icons/) を指定(例: `#check`, `#star`, `#mail`, `#lock`, `#zap`, `#circle-check`, `#alert-triangle`, `#database`, `#cloud`, `#settings`, `#user`, `#file-text`, `#send`, `#rocket`, `#shield-check` など 100+ 種)。`#` 無しは絵文字・文字としてそのまま表示。

## ステップ

1 行目にレーンと本文。`[roleId: 本文]`。行末に `<blockId>` を付けると `/block/` のデザインが当たります。

次の行以降（必ず直後のステップにだけ効く）:

- `id: 名前;` — ステップの一意 ID（`merge: <id>;` の合流先。ファイル全体で重複不可）
- `label: 名前;` — 左カラム用の表示名（図上の見出し。`merge` の合流先には使えない）
- `desc: 説明;` — 左カラム用の小さめ説明（複数行は `` ``` `` フェンス）
- `skip;` — 段階番号を付けない（見出し用）
- `arrow: solid|dashed|dotted;` — **このステップの直後**に描く矢印の線種（既定は実線。`solid` は省略可）
- `props: A,B,C;` — `/prop/` のドキュメントをステップ下部の左右に表示

```
[role02: ここに手続きを入れる]
label: Step name;
desc: 左カラムに表示される説明;
desc: ```
1行目
2行目
```;
props: A,B;

[role02: 終端ステップ] <block_terminal>
id: done;
label: 完了;
props: C;
```

`merge` で合流させるステップには、必ず `id: <合流名>;` を付けます。`label:` だけでは合流先として認識されません。

## 分岐(split & merge)

分岐内の行は必須ではありませんが、可読性のため先頭に半角スペース2つのインデントを推奨します。

```
if (条件) is (成功) than #blue
  [role01: 成功処理] <block02>
elseif (失敗) than #gray
  [role02: エラー] <block03>
endif

if (○○有無) is (あり) than
  [role01: 成功処理] <block02>
elseif (なし) than
  [role02: エラー] <block03>
endif

if (再試行) is (する) than
  [role01: 項目を処理] <block02>
  [loop]
elseif (しない) than
  [role01: 完了] <block03>
endif
```

`if`〜`endif` で排他分岐。各ステップ行は `[roleId: 本文]` 形式。`than` の後ろに `#色名` を付けると条件ブロック色を指定できます。
色指定がない場合は現在のテーマ既定色を使います。使える色：blue, green, red, orange, purple, gray, black

分岐ケースの末尾に `[loop]` を置くと、そのケースは `endif` 合流へ進まず同じ `if` の条件ダイヤモンドへ戻る矢印を描きます（`if` の外では使えません）。直前のステップから矢印が出ます。ステップが無いケースではケース位置から戻ります。

## 並行処理(fork / and / endfork)

`if` が「いずれか一つ」を選ぶ排他分岐なのに対し、`fork` は「すべてを同時に」実行する並行分岐です。条件式やケースラベルは付けません。`fork` で分岐し、各 `and` で並行パスを追加し、`endfork` で全パスを結合します。

```
fork #purple
  [role_system: メール送信] <block_notify>
and
  [role_accounting: 台帳を更新] <block_system>
and
  [role_hr: 記録を保存] <block_approve>
endfork
```

- `fork` の直後から1本目の並行パスが始まります（`if` の最初のケースと同じ扱い）。
- `and` で2本目以降の並行パスを追加します（ラベル行は不要。空の `and` でも可）。
- `endfork` で全パスを結合します。
- `fork`／`and` の後ろに `#色名` を付けると分岐・パスの色を指定できます（`than #色名` と同じ色名）。
- `fork` 〜 `endfork` の中には通常のステップ、`props`、`desc`、ネストした `if` を書けます。
- `fork` と `endfork` は `if` と `endif` と同様にペアでネストする必要があります。

## 途中マージ(merge)

`if` ケースの末尾に `merge: <id>;` を置くと、そのケースは `endif` の合流ダイヤモンドへ進まず、**下流**のステップで `id: <id>;` が一致するブロックへ直接合流します（合流矢印の線種は、ケース内の直前ステップに付けた `arrow:` に従います。未指定なら実線）。キャンセル時だけ終端へ飛ばす、といったケース向けです。`if` の外では使えません。

```
if (キャンセル要求は？) is (あり) than #red
  [role01: キャンセルを受付]
  merge: done;
else
  [role02: 通常クローズ処理]
endif

[role01: 取引完了] <block_terminal>
id: done;
label: 完了;
```

- `merge: <id>;` の `<id>` は、合流先ステップの `id: <id>;` と**完全一致**させます（`label:` は合流先になりません）。
- 各 `id:` はファイル内で**一意**である必要があります（重複するとエラー）。
- 合流先は**下流**（後方）のステップを想定しています。
- 一致する `id:` が無い場合は `merge: no step with id "…"` エラーになります。
- `merge` を `if` の外に書くとエラーになります。

## 構文エラーと GUI 編集

DSL に構文エラーがあるとき、**GUI エディタ**では続行方法を選びます。

- **テキストエディタで修正** — テキストモードでエラー行を直す
- **続行（エラー行のブロックのみ編集不可）** — エラー行に紐づく手順ブロックだけロックし、他のブロックは GUI で編集可能

テキストモードでは常に編集できます。保存していない変更がある状態でページを再読み込みすると、ブラウザの確認ののち未保存の内容は破棄されます。
