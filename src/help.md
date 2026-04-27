## セクション

```
/title/
/role/
/block/
/line/
```

4つのセクションに分けて記述します。

## タイトル

```
/title/
Sample text
```

図のタイトル。

## 役割(レーン)

```
/role/
<role01>
label: 営業
text-color: #0066cc;
background-color: #e6f2ff;
icon: sample.svg;
```

<roleId> の下にプロパティ。label / text-color / background-color / icon。

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

再利用可能なステップのスタイル定義。shape: rect / rounded / hex / ellipse / cloud / note / subroutine。

## アイコン (icon)

```
icon: #check;
icon: #alert-triangle;
icon: ★;
icon: 🔥;
```

# 付きで Lucide アイコン名を指定(例: #check, #star, #mail, #lock, #zap, #circle-check, #alert-triangle, #database, #cloud, #settings, #user, #file-text, #send, #rocket, #shield-check など 100+ 種)。# 無しは絵文字・文字としてそのまま表示。

## ステップ

1 行目にレーンと本文。`[roleId: 本文]`。行末に `<blockId>` を付けると `/block/` のデザインが当たります。

次の行以降（必ず直後のステップにだけ効く）:

- `label: 名前;` — 左カラム用の表示名
- `desc: 説明;` — 左カラム用の小さめ説明
- `skip;` — 段階番号を付けない（見出し用）

```
[role02: ここに手続きを入れる]
label: Step name;
desc: 左カラムに表示される説明;

[role02: ここに次のステップ] <block02>
```

## 分岐(split & merge)

```
if (条件) than (成功)
[role01: 成功処理] <block02>
elseif (失敗)
[role02: エラー] <block03>
else
:;
endif
```

if〜endif で分岐。各ステップ行は上記と同じく `[roleId: 本文]` 形式。`:;` は空ステップ。

## コメント

```
@kai-swimlane
```

@ 行は無視されます。
