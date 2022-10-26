# 配車作成支援ツール
## 概要
Google スプレッドシート上で参加者名簿を読み込み、配車を自動で組むオリエンテーリング部向けGoogle Apps Scriptツールです。参加者が多い大会等の配車でも、効率のよい配車を瞬時に出力します。

## 免責事項
本ツールで出力される配車は、1台あたりのドライバーの数が十分でなかったり、配車間の人数が極めてアンバランスとなる場合があります。**本ツール、およびその出力結果を利用したことによる損害について、制作者は一切の責任を負いません。**

## 導入方法
1. こちらの[配布用Googleスプレッドシート](https://docs.google.com/spreadsheets/d/1puEKCJGqP77hButdUJu5lvZ0M0crcgq4t8K-OzHF0y0/edit?usp=sharing)にPCでアクセスします。
2. ツールバーから「ファイル」→「コピーを作成」で、ご自身のGoogleアカウント上にスプレッドシートをコピーします。その際、Apps Scriptのコードも自動でコピーされます。
3. 導入完了です。

## 使用方法
### 名簿の入力
「入力」シートに参加者の名前、乗車地、借受可否(可能:2, 不可能:空白)を入力します。

### 設定の編集
「設定」シートでは、レンタカー価格と乗車地の座標を入力します。
- レンタカー価格は、各定員人数のレンタカーの価格を入力します。0から8まですべて埋める必要があるため、該当する定員のレンタカーが存在しない場合は、それよりも定員が大きいレンタカーの価格を入力します。
- 乗車地の座標は、緯度経度を十進法で入力します。なお設定ファイルに入力されていない乗車地が「入力」シートから読み込まれたときは、すべての乗車地から無限遠の距離にあるものとして演算されます。

### プログラムの実行
ツールバーから「拡張機能」→「マクロ」→「vehicleManager」をクリックすると、直ちにプログラムが実行され、結果は「出力」シートに表示されます。
- 初回実行時には、プログラム実行後に以下の手順でプログラムの実行を許可する必要があります。
  - 「承認が必要」というダイアログが表示されるので、「確認」をクリックします。
  - Googleへのログインが求められるので、ログインします。
  - 「このアプリは Google で確認されていません」と表示されます。本ツールが信頼できる場合は、左側の「詳細」→「配車作成支援ツール（安全ではないページ）に移動」をクリックします。
  - 「許可」をクリックします。
  - ウィンドウが閉じるので、元のシートに戻り、ツールバーからもう一度vehicleManagerを実行します。

## 既知の問題点
問題点ばっかりなのでここでは列挙しません。何かあればGitHub上でissueを出していただけると大変助かります。

## 制作者
mittu205

## ライセンス
This software is released under the MIT License, see LICENSE.

最後に、本ツールの制作にご協力いただいたすべての方々に厚く御礼申し上げます。
