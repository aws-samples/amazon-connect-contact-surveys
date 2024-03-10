# Amazon Connect での顧客アンケート収集

顧客へのアンケートは、コンタクトセンターが提供する顧客体験やサービスを微調整していくための診断ツールとして重要なものです。これは問い合わせ体験への評価だけでなく、体験後の顧客の購買意欲や動機や意向を組織が理解するのにも役立ちます。

このプロジェクトは、ユーザーがアンケートを作成・管理し、Amazon Connect でそのアンケートを使用し、結果を可視化する、一貫したソリューションを提供することを目的としています。
ソリューションのデプロイ後、ユーザーは安全なウェブアプリケーションにアクセスしてアンケートを定義したり、既存のアンケートを参照／編集したり、アンケートごとの集計結果を視覚化したりすることができます。


ソリューションの構成:
- 管理用ウェブアプリケーション
- アンケートの設定を保存するデータストア
- アンケートの結果を保存するデータストア
- 動的に、最適なアンケートを再生するコンタクトフローモジュール

このソリューションを活用すると、以下のようなシナリオでアンケートを実施することができます:
- 顧客との会話の後のアンケート
- アウトバウンド型のアンケート (startOutboundContactAPIと組み合わせる)

これらのシナリオの実装方法の詳細については [使用例](#使用例) を確認してください。

## アーキテクチャ

![Architecture](/img/Architecture.png)

このソリューションは、必要なリソースをデプロイし、以下のように動作します:

1. Amazon S3 に保存されたフロントエンドの静的コンテンツを Amazon CloudFront を通じて公開し、Amazon Cognito によってユーザー管理を行います。
2. 必要なフローモジュールが Amazon Connect インスタンスにデプロイされます。
3. 管理者はウェブアプリケーションを使用して、必要に応じてアンケートを定義します。
4. アンケートの設定は Amazon DynamoDB に保存されます。
5. 問い合わせに対してフローモジュールが実行され、提供するアンケートを識別するためのコンタクト属性が設定されます。
6. コンタクトフローモジュールは、その問い合わせ用のアンケートの設定を取得します。
7. その問い合わせでアンケートが実施され、顧客はアンケートに回答します。
8. 個々の問い合わせのアンケート結果は Amazon DynamoDB テーブルに保存され、必要に応じて Amazon Connect Task が生成されます。

## デプロイ

このソリューションをデプロイするには、以下の権限が必要です:
- S3 バケットの作成と管理
- Amazon DynamoDB リソースの作成と管理
- Amazon API Gateway リソースの作成と管理
- Amazon CloudFront リソースの作成と管理
- Amazon Cognito リソースの作成と管理
- AWS Lambda リソースの作成と管理
- Amazon Connect リソースの作成と管理

通常、このソリューションのデプロイは、AWS 環境にフルアクセスできるユーザーで行います。

1. 「Launch Stack」 ボタンをクリックして、ご希望のリージョンにソリューションをデプロイします。これは Amazon Connect インスタンスがデプロイされているリージョンと同一である必要があります。

[![cloudformation-launch-button](img/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?#/stacks/new?stackName=Production&templateURL=https://aws-contact-center-blog.s3.us-west-2.amazonaws.com/amazon-connect-post-call-surveys/contact-surveys-amazon-connect.yaml)

2. 必要なパラメータ:
- このソリューションの初期ユーザーの メールアドレス
- このソリューションで使用する Amazon Connect インスタンスの ARN
- このソリューションで使用する Amazon Connect インスタンスのエイリアス
- このソリューションが生成するタスクの送信先になるフローの ID

**補足:** もし、このソリューションが生成するタスクを処理するためのフローが決まっていない場合は、Amazon Connect インスタンスでデフォルトで使用できる *Sample inbound flow (first contact experience)* の IDを指定してください。

![Cloudformation Stack parameters](/img/cf-stack-params.png)

3. スタックの作成 ボタンをクリックして処理を進めます。

**補足:** スタックのデプロイが完了するまで約 5 分かかります。また、ユーザー名と一時パスワードが記載されたメールが届きます。

4. スタックがデプロイされたら、 **出力** タブを開いて **AdminUser** の値とこのアプリケーションの URL をメモします。

5. メモした URL に移動して、上で確認した *Username* でログインします。 *password* はメールで受け取った仮パスワードを入力します。

**補足:** 初回ログイン時にパスワードの変更を求められます。

6. 以下の画面が表示されたら、ソリューションは正常にデプロイされています。

![Application Deployed Successfully](/img/application-deploy-success.png)

## 使用例

以下の例は、このソリューションをどのように使用できるかを理解するのに役立ちます。例を見ていく前に、ソリューションのデプロイが完了していることを確認してください。

### シンプルな応対後のアンケート（post-contact survey）を行い、低評価の結果にはレビューのためのフラグを立てる

この例では、顧客の回答が低い場合に Amazon Connect Task を通じてスーバーバイザーにアラートを送信する、簡単な post-contact survey の実装方法を学びます。

1. このソリューションによってデプロイされた Contact Surveys for Amazon Connect アプリケーションを使ってアンケートを作成します。

![Simple survey example definition](/img/simple-survey-example-definition.png)

1. アンケートに質問をいくつか追加します。

![Simple survey example questions](/img/simple-survey-example-questions.png)

3. どれか一つの質問で, **Additional settings** をクリックし、 **Flag for review** にチェックを入れて閾値を設定します。

![Simple survey example flag](/img/simple-survey-example-flag.png)

この閾値を下回るスコアが入力されると、Amazon Connect のタスクが開始されます。このタスクは、ソリューションをデプロイしたときに指定したフローにルーティングされます。

4. Save をクリックします。一覧をリフレッシュし、新しく作成したアンケートの **Id** をメモします。

![Simple survey example id](/img/simple-survey-example-id.png)

**補足:** 皆さんの環境で作成したアンケートの Id は、このスクリーンショットとは違うものになります。

5. 皆さんの Amazon Connect で新しいフローを作成し、[*Survey Example Disconnect* フロー](/examples/1-Survey%20Example%20Disconnect) をインポートします。フローを公開する前に、「**呼び出しモジュール**」ブロックで、皆さんのインスタンスに作成されている *Contact Survey* が指定されていることを確認します。

**補足:** サンプルフローは "examples" フォルダー内にあります。

![Simple survey example disconnect flow](/img/simple-survey-example-disconnect-flow.png)

6. ステップ 5 と同様に、[*Simple Survey Example* フロー](/examples/2-Simple%20Survey%20Example) をインポートします。いくつか設定変更する必要があるので、ここではまだ公開はしません。

**補足:** サンプルフローは "examples" フォルダー内にあります。

7. 「*切断フローを設定する*」ブロックをクリックします。 このブロック内で、切断フローとしてステップ 5 でインポートした *Survey Example Disconnect* を設定します。

![Simple survey example set disconnect flow](/img/simple-survey-example-inbound-flow-1.png)

8. 「**コンタクト属性の設定**」ブロックをクリックします。このブロックでは *surveyId* というコンタクト属性を設定します。*surveyId* の*値*欄に、ステップ 4 でメモした *Id* をペーストします。

![Simple survey example set contact attribute](/img/simple-survey-example-inbound-flow-2.png)

**補足:** ある問い合わせにおいて再生されるアンケートは、*surveyId* コンタクト属性に基づいて決定されると言うことを理解することが重要です。ここでは、コンタクトフローでその値を明示的に設定することで、再生するアンケートを静的に定義しています。もちろん、IVR での選択、連絡先の転送先のキュー、その連絡先に一致するコンタクトレンズのカテゴリー、またはその他のコンタクト属性などに基づいて、この属性を動的に設定することもできます。

9. フローを保存して、公開します。

**補足:** このフローで処理されたコンタクトは、*BasicQueue* にキューイングされます。別のキューでテストを実行したい場合は、**作業キューの設定** ブロックを適宜調整してください。

10. *Simple Survey Example* を、テストに使用する任意の DID 番号に紐づけます。

11. テスト用に選択した番号に電話をかけます。このアンケートは、顧客との対話の最後に実行するので、コールが発信されるキューに受付可のエージェントがいることを確認してください。

12. 顧客側が電話につながっている間に、エージェント側の通話を終了します。顧客はアンケートに誘導されます。

13. 顧客側は最初の質問を聞いたら、*2*（すなわち、ステップ3で定義された閾値より低いスコア）と答えます。2番目の質問に対しては、0から5の間の任意の数字を入力します。

14. 顧客が最初の質問に対して低いスコアをつけたので、スーパーバイザーがレビューするためのタスクが作成されます。このタスクは、ソリューションのデプロイ時に定義されたコンタクトフローによって処理されます。

**補足:** ここでの例では、すべての Amazon Connect インスタンスで利用可能な *Sample inbound flow (first contact experience)* を使用することにしました。このフローは、タスクを *BasicQueue* に誘導します。実際のシナリオでは、ニーズに応じてこれらのタスクの配信ロジックを処理する特定のコンタクトフローを作成してください。

15. このタスクはスーパーバイザーによって受信され、そこには低評価の会話の詳細が含まれています。

![Simple survey example task](/img/simple-survey-example-task-description.png)

16. Contact Surveys for Amazon Connect アプリケーションを使用して、アンケートの集計結果を可視化することができます。アンケートを選択し、**Results**タブに移動するだけです。また、**Export** ボタンをクリックして、個々の結果をエクスポートすることもできます。

![Simple survey example results](/img/simple-survey-example-results.png)