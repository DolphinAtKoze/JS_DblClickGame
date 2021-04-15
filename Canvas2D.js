// グローバル汚染を避けるために即時関数を使って全体を囲う
(() => {
    //DOMの取得
    const $doc = document;
    //canvasエレメントの取得
    const $canvas = $doc.getElementsByName('game-canvas');
    /**
     * canvas の幅
     * @type {number}
     */
     const CANVAS_WIDTH = 640;
     /**
      * canvas の高さ
      * @type {number}
      */
     const CANVAS_HEIGHT = 480;
 
    /**
     * 描画対象となる Canvas Element
     * @type {HTMLCanvasElement}
     */
    let canvas = null;

    /**
     * canvasエレメントのID名
     * HTML側のcanvasエレメントID名と一致
     * @type {String}
     */
    const MAIN_CANVAS = "main_canvas";
    /**
     * Canvas2D API のコンテキスト
     * @type {CanvasRenderingContext2D}
     */
    let ctx = null;

    /**
     * canvasの範囲内判定
     * @type {Boolean}
     */
    let flagCanvas = false;

    /**
     * 円マーク描画フラグ
     * @type {Boolean}
     */
    let flagCircle = true;

    /**
     * 円の大きさ(半径)
     * @type {number} 
     */
    const RADIUS = 30;

    /**
     * 円の描画座標
     * @type {number} X座標
     * @type {number} Y座標
     */
    let circleX = 0;
    let circleY = 0;

    /**
     * 実行開始時のタイムスタンプ
     * @type {number}
     */
    let startTime = null;

    /**
     * ゲーム開始時のタイムスタンプ取得フラグ
     * @type {Boolean}
     */
    let flagGameTime = false;

    /**
     * ゲームの時間(秒)
     * @type {number}
     */
    const GAME_TIME = 30;

    /**
     * 経過時間(秒)
     * @type {namber}
     */
    let nowGameTime = 0;

     /**
      * クリックされた座標
      * @type {number} X座標
      * @type {number} Y座標
      */
    let clickX = 0;
    let clickY = 0;

    /**
     * 円をクリック出来た回数カウンタ
     * @type {namber} クリックカウンタ
     */
    let clickCounter = 0;

    /**
     * ゲームモードフラグ
     * @type {number}
     * 0 : スタート画面
     * 1 : ゲーム画面
     * 2 : 結果画面
     */
    const START = 0;
    const GAME = 1;
    const RESULT = 2;
    let GameMode = START;


    /**
     * ページのロードが完了したときに発火する load イベント
     */
    window.addEventListener('load', () => {
        initialize();   // 初期化処理を行う
        mouseClick();   //マウスイベント取得
        mouseDblClick(); //マウスダブルクリックイベント取得      
        render();   // 描画処理を行う
    }, false);

    /**
     * canvas やコンテキストを初期化する
     */
    function initialize(){
        // querySelector を利用して canvas を参照
        canvas = document.body.querySelector('#main_canvas');
        // canvas の大きさを設定
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        // canvas からコンテキストを取得する
        ctx = canvas.getContext('2d');
        //円を生成する
        getCircle();
    }

    /**
     * 描画処理を行う
     */
    function render(){
        switch(GameMode){
            case START://スタート画面
            StartScreen();  //スタート画面を描画 
            break; 

            case GAME://ゲーム画面
            GameScreen();//ゲーム画面描画
            break;

            default://結果画面
            ResultScreen();//結果を描画
        }

        // 恒常ループのために描画処理を再帰呼出しする
        requestAnimationFrame(render);
    }

    /**
     * 矩形を描画する
     * @param {number} x - 塗りつぶす矩形の左上角の X 座標
     * @param {number} y - 塗りつぶす矩形の左上角の Y 座標
     * @param {number} width - 塗りつぶす矩形の横幅
     * @param {number} height - 塗りつぶす矩形の高さ
     * @param {string} [color] - 矩形を塗りつぶす際の色
     */
    function drawRect(x, y, width, height, color){
        // 色が指定されている場合はスタイルを設定する
        if(color != null){
            ctx.fillStyle = color;
        }
        ctx.fillRect(x, y, width, height);
    }

    /**
     * 円を描画する
     * @param {number} x - 円の中心位置の X 座標
     * @param {number} y - 円の中心位置の Y 座標
     * @param {number} radius - 円の半径
     * @param {string} [color] - 円を描画する際の色
     */
     function drawCircle(x, y, radius, color){
        // 色が指定されている場合はスタイルを設定する
        if(color != null){
            ctx.fillStyle = color;
        }
        // パスの設定を開始することを明示する
        ctx.beginPath();
        // 円のパスを設定する
        ctx.arc(x, y, radius, 0.0, Math.PI * 2.0);
        // パスを閉じることを明示する
        ctx.closePath();
        // 設定したパスで円の描画を行う
        ctx.fill();
    }
    /**
     * マウスによるクリックイベント
     */
    function mouseClick(){
        window.addEventListener('click',(event) =>{
            event.preventDefault();
            if(event.target.id === MAIN_CANVAS){
                //ブラウザ上のX,Y座標を参照
                clickCanvas(event.offsetX,event.offsetY);
                if(flagCanvas){
                    //ゲーム開始時間取得
                    if(flagGameTime === false){ //スタート画面クリック時一回だけ実行する   
                        startTime = Date.now(); // 実行開始時のタイムスタンプを取得する
                        flagGameTime = true;    //ゲーム開始フラグを立てる
                        GameMode = GAME;
                    }else{
                        //canvas範囲外をクリック
                        return;
                    }
                }
            }
        },false);
    }

    /**
     * マウスによるダブルクリックイベント
     */

    function mouseDblClick(){
        window.addEventListener('dblclick',(event) =>{
            event.preventDefault();
            //ゲーム時間内ならクリックを有効にする
            if(nowGameTime < GAME_TIME){
                //クリックされた範囲がcanvasと同じか判定
                if(event.target.id === MAIN_CANVAS){
                    //ブラウザ上のX,Y座標を参照
                    clickCanvas(event.offsetX,event.offsetY);
                    //canvas範囲内をクリック
                    if(flagCanvas){
                        //円の中でクリックされているか判定
                        clickCircle(circleX,circleY,RADIUS);
                    }
                }else{
                    //canvas範囲外をクリック
                    return;
                }
            }
        },false);
    }

    /**
     * canvasの枠内の座標でアクションが起こったか判定する
     * @param {namber} x X座標
     * @param {namber} y Y座標
     */
    function clickCanvas(x,y){
        //X座標が範囲内か判定
        if(x <= CANVAS_WIDTH){
            //Y座標が範囲内か判定
            if(y <= CANVAS_HEIGHT){
                //X座標,Y座標共に範囲内
                flagCanvas = true;
                clickX = x;
                clickY = y;
            }else{
                //Y座標が範囲外
                flagCanvas = false;
            }
        }else{
            //X座標,Y座標共に範囲外
            flagCanvas = false;
        }
    }
    /**
     * ランダムの位置に円を生成する
     * @param {number} circleX 
     * @param {number} circleY 
     */
    function getCircle(){
        circleX = generateRandomInt(CANVAS_WIDTH);
        circleY = generateRandomInt(CANVAS_HEIGHT);
    }

    /**
     * 円の中でクリックされたか判定する
     * @param {namber} X座標
     * @param {namber} Y座標
     * @param {namber} 半径
     */
    function clickCircle(x,y,radius){
        
        let ax = clickX - x;
        let by = clickY - y;

        //角度を求める
        let an = Math.atan2(by, ax);

        //三平方の定理（円の中心点から、マウスが動いた点までの斜辺）
        let mc = Math.sqrt((ax * ax) + (by * by));

        //円の中でクリックされたら座標を再取得する
        if(mc <= radius){
            //新しい円の座標を生成、取得
            getCircle();
            //クリックされた回数を増やす
            clickCounter++;
        }
        //円の外でクリックされたら座標は変更しない
    }

    /**
     * 特定の範囲におけるランダムな整数の値を生成する
     * @param {number} range - 乱数を生成する範囲（0 以上 ～ range 未満）
     */
     function generateRandomInt(range){
        let random = Math.random();
        return Math.floor(random * range);
    }

    /**
     * クリック出来た回数を描画する
     */
    function drawCrickCount(){
        // フォントの設定
        ctx.font = '20pt Arial';
        ctx.fillText("count = " + clickCounter, 20, 70);  // 座標 (20, 70) にテキスト描画
    }

    /**
     * 残り時間を描画する
     */
    function drawTimer(drawTime){
        //残り時間を計算
        let timer = GAME_TIME - drawTime;
        //フォントの設定
        ctx.font = '20pt Arial';
        //残り時間が0になったら"終了！"と表示する
        if(timer > 0){
            ctx.fillText("残り時間 = " + timer, 20, 40);  // 座標 (20, 40) にテキスト描画
        }else{
            ctx.fillStyle = "red";  //文字色を変更
            ctx.fillText("終了！", 20, 40);  // 座標 (20, 40) にテキスト描画
            GameMode = RESULT;//結果画面フラグを立てる
        }
    }

    /**
     * スタート画面
     */
    function StartScreen(){
        //ゲーム枠の描画を行う
        drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT,"#555");
        // フォントの設定
        ctx.font = '30pt Arial';
        ctx.fillStyle = "white";  //文字色を変更
        ctx.fillText("クリックしてスタート！",100,CANVAS_HEIGHT / 2);
    }

    /**
     * ゲーム画面の描画
     */
    function GameScreen(){
        //ダブルクリックされているか確認
        mouseDblClick();
        //ゲーム枠の描画を行う
        drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT,"#cccccc");
        // 現在までの経過時間を取得する（ミリ秒を秒に変換するため 1000 で除算）
        let nowTime = (Date.now() - startTime) / 1000;

        //現在の経過時間を小数点切り捨てで取得
        let drawTime = Math.floor(nowTime);

        //ゲームタイマーを取得
        nowGameTime = drawTime;

        // 円の描画処理を行う
        drawCircle(circleX, circleY, RADIUS, '#110099');

        //残り時間を描画
        drawTimer(drawTime);
        //クリック出来た回数を描画
        drawCrickCount();
    }

    /**
     * 結果画面
     */
    function ResultScreen(){
        //ゲーム枠の描画を行う
        drawRect(0,0,CANVAS_WIDTH,CANVAS_HEIGHT,"#555");
        //クリック出来た回数を描画
        // フォントの設定
        ctx.font = '30pt Arial';   //文字の大きさを指定
        ctx.fillStyle = "white";  //文字色を変更
        //クリック出来た回数に応じて結果画面の文言を変える
        if(clickCounter > 0){
            //0回よりも多い
            ctx.fillText(("結果は" + clickCounter + "回。やったね！"),100,CANVAS_HEIGHT / 2);
        }else{
            //0回だった場合
            ctx.fillText("(´・ω・｀)",200,CANVAS_HEIGHT / 2);
        } 
    }
})();