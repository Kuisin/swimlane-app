## role

### 区分列

左カラムの見出し用レーン。手順番号を付けない行（`skip;`）と組み合わせます。

```
<role00>
label: 区分;
text-color: #444444;
background-color: #f5f5f4;
```

### 申請者

申請・起票を行う担当者のレーン。`role02` など任意の ID に変更できます。

```
<role02>
label: 申請者;
text-color: #1e293b;
background-color: #ffffff;
```

### 承認者

上長や承認権限者のレーン。緑系で「承認」ブロックと揃えると分かりやすいです。

```
<role03>
label: 承認者;
text-color: #166534;
background-color: #f0fdf4;
```

### 経理・財務

経理確認・支払処理などのレーン。

```
<role04>
label: 経理;
text-color: #1e40af;
background-color: #eff6ff;
icon: #database;
```

### 人事

採用・労務など人事部門のレーン。

```
<role05>
label: 人事;
text-color: #6b21a8;
background-color: #faf5ff;
icon: #user;
```

### システム

自動処理・バッチ・API 連携などのレーン。

```
<role01>
label: システム;
text-color: #3730a3;
background-color: #eef2ff;
icon: #database;
```

### 法務・コンプライアンス

契約審査・コンプラ確認のレーン。

```
<role06>
label: 法務;
text-color: #5b21b6;
background-color: #f5f3ff;
icon: #shield-check;
```

### 取引先・顧客

社外の相手方を表すレーン。

```
<role07>
label: 取引先;
text-color: #92400e;
background-color: #fffbeb;
icon: #mail;
```

## block

※ **形状**で操作の種類を区別し、**色**で意味を区別します。

| 形状 | 用途 |
|------|------|
| `rounded` | ユーザー操作（申請・承認・却下・通常業務など） |
| `rect` | システム操作（自動処理・通知送信など） |
| `hex` | 条件分岐内のステップ（`if`〜`endif` のケース） |

### 通常処理

グレー — 一般的な業務ステップ。

```kai-swimlane-parts
/block/

<block_neutral>
background-color: #f8fafc;
text-color: #334155;
border-color: #64748b;
shape: rounded;
icon: #settings;
```

### 申請・起票

ブルー — 申請・登録・起票。

```kai-swimlane-parts
/block/

<block_apply>
background-color: #dbeafe;
text-color: #1e40af;
border-color: #2563eb;
shape: rounded;
icon: #zap;
```

### 承認

グリーン — 承認・検印・完了。

```kai-swimlane-parts
/block/

<block_approve>
background-color: #dcfce7;
text-color: #166534;
border-color: #16a34a;
shape: rounded;
icon: #circle-check;
```

### 条件分岐

バイオレット — `if` / `elseif` / `else` 内のステップに付与（六角形）。

```kai-swimlane-parts
/block/

<block_condition>
background-color: #f3e8ff;
text-color: #6b21a8;
border-color: #9333ea;
shape: subroutine;
icon: #git-branch;
```

### システム処理

インディゴ — 自動処理・連携（矩形）。

```kai-swimlane-parts
/block/

<block_system>
background-color: #e0e7ff;
text-color: #3730a3;
border-color: #4f46e5;
shape: rect;
icon: #database;
```

### 通知・連絡

スカイ — システムからのメール・通知（矩形）。

```kai-swimlane-parts
/block/

<block_notify>
background-color: #e0f2fe;
text-color: #075985;
border-color: #0284c7;
shape: rect;
icon: #send;
```

### 却下・エラー

レッド — 却下・差し戻し・例外。

```kai-swimlane-parts
/block/

<block_reject>
background-color: #fee2e2;
text-color: #991b1b;
border-color: #dc2626;
shape: hex;
icon: #alert-triangle;
```

### 待機・保留

ジンク — 保留・待ち・未着手。

```kai-swimlane-parts
/block/

<block_wait>
background-color: #f4f4f5;
text-color: #52525b;
border-color: #71717a;
shape: hex;
icon: #clock;
```

### メモ・補足

アンバー — 注記・メモ・参考情報。

```kai-swimlane-parts
/block/

<block_memo>
background-color: #fef3c7;
text-color: #92400e;
border-color: #d97706;
shape: note;
icon: #file-text;
```

## prop

※ ID は意味が分かる英語名。`/line/` では `props: REQ_DOC, RECEIPT;` のように指定します。

### 申請書

ステップに紐づける申請書類チップ（右側表示）。

```kai-swimlane-parts
/prop/

<REQ_DOC>
label: 申請書;
side: right;
title: 会社所定フォーマットの申請書;
```

### 承認ログ

承認・差し戻しの記録を左側に表示。

```kai-swimlane-parts
/prop/

<APPR_LOG>
label: 承認ログ;
side: left;
background-color: #f8fafc;
border-color: #64748b;
text-color: #334155;
title: 誰がいつ承認・差し戻ししたかの記録;
```

### 領収書・証憑

領収書や証憑ファイル。`hint` でホバー説明を付けられます。

```kai-swimlane-parts
/prop/

<RECEIPT>
label: 領収書;
side: left;
background-color: #f8fafc;
border-color: #94a3b8;
text-color: #334155;
hint: 金額・日付が読める画像またはPDF;
```

### 契約書

契約書・合意書の参照チップ。

```kai-swimlane-parts
/prop/

<CONTRACT>
label: 契約書;
side: right;
background-color: #faf5ff;
border-color: #a855f7;
text-color: #6b21a8;
title: 締結済み契約の写しまたは電子契約ID;
```

### 通知メール

送信メール・通知の記録チップ。

```kai-swimlane-parts
/prop/

<NOTIFY>
label: 通知メール;
side: right;
background-color: #f0f9ff;
border-color: #0284c7;
text-color: #075985;
title: 申請者・関係者への自動通知;
```

### 台帳・マスタ

参照用の台帳・マスタデータ。

```kai-swimlane-parts
/prop/

<MASTER>
label: 台帳;
side: left;
background-color: #f0fdf4;
border-color: #16a34a;
text-color: #166534;
title: 参照用マスタ・台帳データ;
```

### 監査証跡

操作ログ・監査用の証跡チップ。

```kai-swimlane-parts
/prop/

<AUDIT>
label: 監査証跡;
side: left;
background-color: #fff7ed;
border-color: #ea580c;
text-color: #9a3412;
title: 操作者・日時・変更内容を記録したログ;
```

### 表示名の省略

`max-chars` でチップ表示を短く切り詰めます。

```kai-swimlane-parts
/prop/

<LABEL_SHORT>
label: 長い名称の文書;
side: right;
max-chars: 6;
title: 表示は6文字まで。ホバーで全文;
```

## set

### 経費申請

経費の申請から承認・通知まで。統一ブロック色と分かりやすい prop 名の例です。

```kai-swimlane
@kai-swimlane

/title/
経費申請フロー

/role/

<role00>
label: 区分;
text-color: #444444;
background-color: #f5f5f4;

<role01>
label: システム;
text-color: #3730a3;
background-color: #eef2ff;
icon: #database;

<role02>
label: 申請者;
text-color: #1e293b;
background-color: #ffffff;

<role03>
label: 承認者;
text-color: #166534;
background-color: #f0fdf4;

/block/

<block_apply>
background-color: #dbeafe;
text-color: #1e40af;
border-color: #2563eb;
shape: rounded;
icon: #zap;

<block_approve>
background-color: #dcfce7;
text-color: #166534;
border-color: #16a34a;
shape: rounded;
icon: #circle-check;

<block_system>
background-color: #e0e7ff;
text-color: #3730a3;
border-color: #4f46e5;
shape: rect;
icon: #database;

/prop/

<REQ_DOC>
label: 経費申請書;
side: right;
max-chars: 8;

<APPR_LOG>
label: 承認ログ;
side: left;
background-color: #f8fafc;
border-color: #64748b;
text-color: #334155;

<NOTIFY>
label: 通知メール;
side: right;
background-color: #f0f9ff;
border-color: #0284c7;
text-color: #075985;

<RECEIPT>
label: 領収書;
side: left;
background-color: #f8fafc;
border-color: #94a3b8;
text-color: #334155;
hint: 金額・日付が読める画像またはPDF;

/line/

[role00: 申請開始]
skip;

[role02: 領収書を添付して申請] <block_apply>
label: 申請入力;
props: REQ_DOC,RECEIPT;

[role01: 申請を受け付ける] <block_system>
props: APPR_LOG;

[role03: 承認する] <block_approve>
props: APPR_LOG;

[role02: 結果を確認]
props: NOTIFY;

@end
```

### 稟議・承認

金額条件による分岐と差し戻しの例。

```kai-swimlane
@kai-swimlane

/title/
稟議・承認フロー

/role/

<role00>
label: 区分;
text-color: #444444;
background-color: #f5f5f4;

<role02>
label: 申請者;
text-color: #1e293b;
background-color: #ffffff;

<role03>
label: 承認者;
text-color: #166534;
background-color: #f0fdf4;

<role04>
label: 経理;
text-color: #1e40af;
background-color: #eff6ff;

/block/

<block_apply>
background-color: #dbeafe;
text-color: #1e40af;
border-color: #2563eb;
shape: rounded;
icon: #zap;

<block_approve>
background-color: #dcfce7;
text-color: #166534;
border-color: #16a34a;
shape: rounded;
icon: #circle-check;

<block_reject>
background-color: #fee2e2;
text-color: #991b1b;
border-color: #dc2626;
shape: rounded;
icon: #alert-triangle;

<block_condition>
background-color: #f3e8ff;
text-color: #6b21a8;
border-color: #9333ea;
shape: hex;
icon: #git-branch;

/prop/

<REQ_DOC>
label: 稟議書;
side: right;

<APPR_LOG>
label: 承認ログ;
side: left;
background-color: #f8fafc;
border-color: #64748b;
text-color: #334155;

/line/

[role00: 稟議]
skip;

[role02: 稟議書を起票] <block_apply>
props: REQ_DOC;

[role03: 承認] <block_approve>
props: APPR_LOG;

if (金額) is (上限超) than
  [role04: 経理確認] <block_condition>
elseif (以内) than
  [role03: 承認完了] <block_condition>
else
  [role02: 差し戻し] <block_condition>
endif

@end
```

### 採用・人事

応募からオファー・入社手続きまで。

```kai-swimlane
@kai-swimlane

/title/
採用・人事フロー

/role/

<role00>
label: 区分;
text-color: #444444;
background-color: #f5f5f4;

<role05>
label: 人事;
text-color: #6b21a8;
background-color: #faf5ff;

<role03>
label: 採用担当;
text-color: #166534;
background-color: #f0fdf4;

<role01>
label: システム;
text-color: #3730a3;
background-color: #eef2ff;

/block/

<block_notify>
background-color: #e0f2fe;
text-color: #075985;
border-color: #0284c7;
shape: rect;
icon: #send;

<block_approve>
background-color: #dcfce7;
text-color: #166534;
border-color: #16a34a;
shape: rounded;
icon: #circle-check;

/prop/

<RESUME>
label: 履歴書;
side: right;
title: 応募時に提出された履歴書;

<OFFER>
label: オファー;
side: right;
background-color: #f0fdf4;
border-color: #16a34a;
text-color: #166534;
title: 内定通知・条件提示書;

/line/

[role00: 採用]
skip;

[role05: 応募受付]
props: RESUME;

[role03: 面接・選考] <block_approve>

[role01: オファー送付] <block_notify>
props: OFFER;

[role05: 入社手続き] <block_approve>

@end
```
