// ==========================================
// 1. game/state.js - ゲームの状態管理
// ==========================================
let state = {};

function initGameState() {
    state = {
        screen: "title",
        gameMode: "pvp", // "ai" or "pvp"
        currentStage: 1,
        enemyName: "KENTA",
        aiLevel: 2,
        aiProfile: "master",
        round: 1,
        maxRounds: 13,
        currentPlayer: 1,
        firstPlayer: 1,
        nextFirstPlayer: 1, // ★修正: 常にP1から開始するように初期値を変更
        gameOver: false,
        winnerText: "",
        winReason: "",
        isBusy: false,
        isAIThinking: false,
        
        // --- 新規追加: ルーレット用ステート ---
        startRouletteActive: false,
        startRouletteTimer: 0,
        startRouletteDuration: 90, // 約1.5秒 (60fps想定)
        startRouletteIndex: 1,
        startRouletteFinalPlayer: null,
        // ----------------------------------
        
        turnSplashTimer: 0,
        pendingTurnSplash: false,
        pendingAiBreath: false,
        pendingPlayer: null,
        aiBreathTimer: 0,
        buildMode: null,
        pendingBox: null,
        uiHint: "tap",
        players: [
            { id: 1, score: 0, servedScore: 0, resources: 0, workersRemaining: 1 },
            { id: 2, score: 0, servedScore: 0, resources: 0, workersRemaining: 1 }
        ],
        lanes: [
            { id: "s1", fire: 1, type: "weak", owner: null, cookState: 0, uchiwaBoost: 0, justPlaced: false, built: false },
            { id: "s2", fire: 2, type: "medium", owner: null, cookState: 0, uchiwaBoost: 0, justPlaced: false, built: false },
            { id: "s3", fire: 3, type: "strong", owner: null, cookState: 0, uchiwaBoost: 0, justPlaced: false, built: false }
        ],
        visuals: {
            buttonClicks: {}, buttonErrors: {}, laneErrors: {}, laneFlashes: {}, placedAt: {}, ghosts: [], floaters: [],
            particles: [] // ★新規追加: 煙エフェクトなどのパーティクルを管理
        }
    };
}
initGameState();

// ==========================================
// 2. render/layout.js - 定数とレイアウト設定
// ==========================================
let LAYOUT = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    COLORS: {
        BG: "#161620", TEXT_MAIN: "#fff", TEXT_DIM: "#aaa",
        P1: "#3c96ff", P2: "#ff5078", NEUTRAL: "#333", PANEL_BG: "#242430", OVERLAY_BG: "rgba(0, 0, 0, 0.7)",
        STICK: "#dca", FIRE_BASE: "#e53", FIRE_BOOST: "#fa3", DOT_OFF: "#334",
        HIGHLIGHT: "rgba(255, 255, 255, 0.4)"
    },
BUTTONS: [
        { id: "meat", color: "#56657a", icon: "meat", label: "肉" },
        { id: "put", color: "#56657a", icon: "put", label: "置く" },
        { id: "harvest", color: "#56657a", icon: "serve", label: "取る/捨" },
        { id: "uchiwa", color: "#56657a", icon: "uchiwa", label: "うちわ" }
    ]
};

// 生肉からタレの焦げ色までの美味しそうなパレット
const VISUAL_STATES = {
    RAW: { meat: "#e57373", negi: "#e8f5e9", dot: "#fff" },       // 生肉ピンク、ネギ白
    OKAY: { meat: "#c07040", negi: "#c8e6c9", dot: "#f90" },      // 火が通った茶色
    PERFECT: { meat: "#793910", negi: "#81c784", dot: "#ff4" },   // 照り焼きの深い色、ネギの焼き色
    BURNT: { meat: "#2a1a12", negi: "#1a251a", dot: "#f33" }      // 炭
};
// --- ドット絵用のカラーパレット ---
const ICON_PALETTE = {
    1: "#ffffff", // 白
    2: "#d95763", // 肉(赤身)
    3: "#8c3f5d", // 肉(影)
    4: "#df7126", // 火(オレンジ)
    5: "#fbf236", // 火(黄色)
    6: "#5fcde4", // ダイヤ(水色)
    7: "#8f563b", // うちわの柄(茶色)
    8: "#ac3232", // うちわの模様(赤)
    9: "#e8ede7", // うちわの紙(オフホワイト)
    10: "#99e550", // ★新規: 置く(緑)
    11: "#ffcc66"  // ★新規: 取る/捨てる(オレンジ黄色)
};

// --- アイコンデータ(数字はパレットのインデックス。10はUI指定色) ---
const ICON_DATA = {
    // 肉 (両端に骨がある王道のマンガ肉)
    meat: [
        0,0,0,0,0,0,0,0,
        0,0,2,2,2,2,0,0,
        0,2,3,2,2,2,2,0,
        1,3,3,3,2,2,2,1,
        1,3,3,3,2,2,2,1,
        0,2,3,2,2,2,2,0,
        0,0,2,2,2,2,0,0,
        0,0,0,0,0,0,0,0
    ],
// 置く (下矢印を 10:緑 に変更)
    put: [
        0,0,0,10,10,0,0,0,
        0,0,0,10,10,0,0,0,
        0,0,0,10,10,0,0,0,
        0,0,0,10,10,0,0,0,
        10,10,10,10,10,10,10,10,
        0,10,10,10,10,10,10,0,
        0,0,10,10,10,10,0,0,
        0,0,0,10,10,0,0,0
    ],
    // 取る/捨てる (上矢印を 11:オレンジ黄色 に変更)
    serve: [
        0,0,0,11,11,0,0,0,
        0,0,11,11,11,11,0,0,
        0,11,11,11,11,11,11,0,
        11,11,11,11,11,11,11,11,
        0,0,0,11,11,0,0,0,
        0,0,0,11,11,0,0,0,
        0,0,0,11,11,0,0,0,
        0,0,0,11,11,0,0,0
    ],
// うちわ (縁取りをなくし、白ベースに赤模様)
    uchiwa: [
        0,8,8,8,8,8,8,0,
        8,8,8,8,8,8,8,8,
        8,8,8,8,8,8,8,8,
        9,9,9,9,9,9,9,9,
        0,9,9,7,7,9,9,0,
        0,0,0,7,7,0,0,0,
        0,0,0,7,7,0,0,0,
        0,0,0,7,7,0,0,0
    ],
    // スコア/ダイヤ
    diamond: [
        0,0,0,1,6,0,0,0,
        0,0,1,6,6,6,0,0,
        0,1,6,6,6,6,6,0,
        1,6,6,6,6,6,6,6,
        0,6,6,6,6,6,6,0,
        0,0,6,6,6,6,0,0,
        0,0,0,6,6,0,0,0,
        0,0,0,0,0,0,0,0
    ],
    // 火 
    fire: [
        0,0,0,4,0,0,0,0,
        0,0,4,5,4,0,0,0,
        0,4,4,5,4,4,0,0,
        0,4,5,5,5,4,0,0,
        4,5,5,5,5,5,4,0,
        4,4,5,5,5,4,4,0,
        0,4,4,4,4,4,0,0,
        0,0,0,0,0,0,0,0
    ]
};

function getVisualPalette(status) { return VISUAL_STATES[status] || VISUAL_STATES.RAW; }

function getLaneBounds(index) {
    const laneW = Math.min(90, LAYOUT.CANVAS_WIDTH * 0.28);
    const laneH = Math.min(180, LAYOUT.CANVAS_HEIGHT * 0.3);
    const gap = 15;
    const totalW = (laneW * 3) + (gap * 2);
    const startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2;
    const y = LAYOUT.CANVAS_HEIGHT / 2 - laneH / 2 - 40;
    return { x: startX + index * (laneW + gap), y, w: laneW, h: laneH };
}

function getButtonBounds(index) {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const btnW = Math.min(150, LAYOUT.CANVAS_WIDTH * 0.42);
    const btnH = Math.min(80, LAYOUT.CANVAS_HEIGHT * 0.12);
    const gapX = 15; const gapY = 15;
    const totalW = (btnW * 2) + gapX;
    const startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2;
    const totalH = (btnH * 2) + gapY;
    const y = LAYOUT.CANVAS_HEIGHT - totalH - Math.max(30, LAYOUT.CANVAS_HEIGHT * 0.05);
    return { x: startX + col * (btnW + gapX), y: y + row * (btnH + gapY), w: btnW, h: btnH };
}

function getCancelButtonBounds() {
    const btnW = Math.min(315, LAYOUT.CANVAS_WIDTH * 0.85 + 15);
    const btnH = Math.min(60, LAYOUT.CANVAS_HEIGHT * 0.1);
    const startX = (LAYOUT.CANVAS_WIDTH - btnW) / 2;
    const y = LAYOUT.CANVAS_HEIGHT - btnH - Math.max(10, LAYOUT.CANVAS_HEIGHT * 0.02);
    return { x: startX, y, w: btnW, h: btnH };
}

// ==========================================
// 3. game/flow.js - ゲーム進行とスコア
// ==========================================
const STAGE_CONFIG = {
    1: { profile: "gambler", level: 1, enemyName: "KENTA" },
    2: { profile: "thief",   level: 2, enemyName: "HIDEKI" },
    3: { profile: "reader",  level: 3, enemyName: "TETSUYA" },
    4: { profile: "master",  level: 4, enemyName: "MAKOTO" },
    5: { profile: "master",  level: 5, enemyName: "BOSS" }
};

function setupAIForStage(stageNumber) {
    const conf = STAGE_CONFIG[stageNumber];
    if (!conf) return false;
    state.currentStage = stageNumber;
    state.enemyName = conf.enemyName;
    state.aiLevel = conf.level;
    state.aiProfile = conf.profile;
    return true;
}

function startGame(mode) {
    initGameState();
    state.gameMode = mode;
    state.screen = "game";
    if (mode === "ai") setupAIForStage(1);
    
    // --- 新規追加: ルーレット開始設定 ---
    state.startRouletteActive = true;
    state.startRouletteTimer = state.startRouletteDuration;
    state.startRouletteIndex = 1;
    state.startRouletteFinalPlayer = null;
    // ----------------------------------
}

function nextStage() {
    const nextStg = state.currentStage + 1;
    if (nextStg > 5) return;
    const prevMode = state.gameMode;
    initGameState();
    state.gameMode = prevMode;
    state.screen = "game";
    setupAIForStage(nextStg);
    
    // --- 新規追加: 次ステージもルーレット開始 ---
    state.startRouletteActive = true;
    state.startRouletteTimer = state.startRouletteDuration;
    state.startRouletteIndex = 1;
    state.startRouletteFinalPlayer = null;
    // ----------------------------------------
}

function updateAllScores() {
    state.players.forEach((p, i) => {
        let s = p.servedScore || 0;
        p.score = s;
    });
}

function getBaseHeat(type) {
    if (type === "weak") return 1;
    if (type === "medium") return 2;
    if (type === "strong") return 3;
    return 1;
}

// ★新規追加: 煙エフェクトを発生させる関数
function spawnSmokeEffect(laneIndex, amount) {
    const b = getLaneBounds(laneIndex);
    const laneCx = b.x + b.w / 2;
    const stickTop = b.y + b.h * 0.1;
    const meatY = stickTop + (b.h * 0.7) * 0.4; // お肉の真ん中あたりを計算

    const numParticles = 5 + amount * 3; 
    
    for (let i = 0; i < numParticles; i++) {
        state.visuals.particles.push({
            x: laneCx + (Math.random() - 0.5) * 40, 
            y: meatY + (Math.random() - 0.5) * 20,  
            vx: (Math.random() - 0.5) * 1.5,        
            vy: -1 - Math.random() * 2,             
            life: 0,                                
            maxLife: 30 + Math.random() * 30,       
            size: 8 + Math.random() * 12            
        });
    }
}

// ★修正: 焼けた時に煙を出す処理を追加
function advanceAllSkewersAtRoundEnd() {
    state.lanes.forEach((n, index) => {
        if (n.built) {
            if (n.justPlaced) n.justPlaced = false;
            else {
                const baseHeat = getBaseHeat(n.type);
                const boost = n.uchiwaBoost || 0;
                
                const prevCookState = n.cookState; 
                n.cookState = Math.min(8, n.cookState + baseHeat + boost);
                
                // 実際に数値が上がって焼けた場合、煙を出す
                if (n.cookState > prevCookState) {
                    spawnSmokeEffect(index, n.cookState - prevCookState); 
                }
            }
        }
        n.uchiwaBoost = 0;
    });
}

function isAIPlayer(playerIndex) {
    return state.gameMode === "ai" && playerIndex === 2;
}

function consumeWorker() {
    const p = state.players[state.currentPlayer - 1];
    p.workersRemaining -= 1;
    state.buildMode = null;
    state.pendingBox = null;
    updateAllScores();
    switchTurn();
}

// ★修正: リズムを整えるため、800ms待ってからターンを切り替える
function switchTurn() {
    // 1. ポップアップ演出が終わるまで入力をブロック
    state.isBusy = true;

    // 2. 800ミリ秒待ってから次の処理へ進む
    setTimeout(() => {
        const nextP = 3 - state.currentPlayer;
        
        if (state.players[nextP - 1].workersRemaining > 0) {
            state.pendingPlayer = nextP;
            state.pendingTurnSplash = true; 
            if (isAIPlayer(nextP)) {
                state.pendingAiBreath = true;
            }
        } else if (state.players[state.currentPlayer - 1].workersRemaining <= 0) {
            tryEndRound();
        }
        
        // 3. 切り替えが終わったら入力を解除
        state.isBusy = false;
    }, 800);
}

function startNewRound() {
    state.round++;
    state.players.forEach(p => p.workersRemaining = 1);

    state.buildMode = null;
    state.pendingBox = null;

    state.currentPlayer = state.firstPlayer;
    state.pendingPlayer = state.firstPlayer;
    
    state.pendingTurnSplash = true;
    state.pendingAiBreath = false;
}

// --- 新規追加: ルーレットの更新処理 ---
function updateRoulette() {
    if (!state.startRouletteActive) return;

    state.startRouletteTimer--;

    // 5フレームごとに表示を切り替え
    if (state.startRouletteTimer % 5 === 0) {
        state.startRouletteIndex = 3 - state.startRouletteIndex;
    }

    // ルーレット終了時の処理
    if (state.startRouletteTimer <= 0) {
        state.startRouletteActive = false;
        // ランダムに先攻を決定
        state.startRouletteFinalPlayer = Math.random() < 0.5 ? 1 : 2;

        state.firstPlayer = state.startRouletteFinalPlayer;
        state.currentPlayer = state.startRouletteFinalPlayer;
        state.pendingPlayer = state.startRouletteFinalPlayer;
        state.pendingTurnSplash = true;
    }
}
// ------------------------------------
function tryEndRound() {
    advanceAllSkewersAtRoundEnd();
    
    if (state.round >= state.maxRounds) {
        state.gameOver = true;
        updateAllScores();
        const p1 = state.players[0].score;
        const p2 = state.players[1].score;
        
        if (p1 > p2) {
            if (state.gameMode === "ai") {
                if (state.currentStage >= 5) {
                    state.screen = "clear";
                    state.winnerText = "SURVIVAL CLEAR";
                } else {
                    state.screen = "stage_clear";
                    state.winnerText = "STAGE CLEAR";
                }
            } else {
                state.screen = "gameover";
                state.winnerText = "P1 Wins!";
            }
        } else if (p2 > p1) {
            state.screen = "gameover";
            state.winnerText = "P2 Wins!";
        } else {
            state.screen = "gameover";
            state.winnerText = "Draw!";
        }
        return;
    }
    startNewRound();
}

function resolvePendingTurnFlow() {
    if (state.pendingTurnSplash) { 
        state.turnSplashTimer = 45; 
        state.pendingTurnSplash = false; 
    }
    if (state.turnSplashTimer > 0) {
        state.turnSplashTimer--;
    } else if (state.pendingPlayer !== null) {
        if (state.pendingAiBreath) { 
            state.aiBreathTimer = 15; 
            state.pendingAiBreath = false; 
        } else if (state.aiBreathTimer <= 0) {
            state.currentPlayer = state.pendingPlayer;
            state.pendingPlayer = null;
        }
    }
    if (state.aiBreathTimer > 0) state.aiBreathTimer--;
}

// ==========================================
// 4. game/rules.js - 調理ルールとアクション
// ==========================================
function getCookLabel(laneType, cv) {
    if (laneType === "weak") {
        if (cv >= 8) return "burnt";
        if (cv >= 6) return "perfect";
        if (cv === 5) return "okay";
    } else {
        if (cv >= 7) return "burnt";
        if (cv === 6) return "perfect";
        if (cv === 5) return "okay";
    }
    return "early";
}

function canUseMeat(playerIndex) { 
    return true; 
}

function canUseSkewer(playerIndex) {
    return state.players[playerIndex - 1].resources >= 1 && state.lanes.some(l => !l.built);
}

function canUseServe(playerIndex) {
    const p = state.players[playerIndex - 1];
    for (let n of state.lanes) {
        if (n.built) {
            const status = getCookLabel(n.type, n.cookState);
            if (status === "burnt") return true; 
            if (n.owner === playerIndex) return true; 
            if (p.resources >= 1 && (status === "okay" || status === "perfect")) return true; 
        }
    }
    return false;
}

function placeWorker(boxId) {
    const p = state.players[state.currentPlayer - 1];
    if (boxId === 1) { // Meat
        p.resources += 1;
        state.visuals.floaters.push({ type: 'meat_up', targetType: state.currentPlayer === 1 ? 'p1' : 'p2', startTime: performance.now() });
        consumeWorker();
    } else {
        // ★修正: アニメーションを見せるため、150ミリ秒待ってからモードを切り替える
        state.isBusy = true; // 待っている間の誤タップを防止
        setTimeout(() => {
            if (boxId === 2 && p.resources >= 1) state.buildMode = "sapling";
            else if (boxId === 3) state.buildMode = "harvest";
            else if (boxId === 4) state.buildMode = "uchiwa";
            state.isBusy = false; // ロック解除
        }, 150);
    }
}

function tryBuildNode(node) {
    const p = state.players[state.currentPlayer - 1];
    if (p.resources >= 1 && !node.built) {
        p.resources -= 1;
        state.visuals.floaters.push({ type: 'meat_down', targetType: state.currentPlayer === 1 ? 'p1' : 'p2', startTime: performance.now() });
        node.built = true;
        node.owner = state.currentPlayer;
        node.cookState = 0;
        node.justPlaced = true;
        state.visuals.placedAt[node.id] = performance.now();
        consumeWorker();
    }
}

function tryHarvestNode(node) {
    const p = state.players[state.currentPlayer - 1];
    if (!node.built) return;
    const isSteal = (node.owner !== null && node.owner !== state.currentPlayer);
    const status = getCookLabel(node.type, node.cookState);
    
    if (isSteal && status !== "burnt" && status !== "early" && p.resources >= 1) {
        p.resources -= 1;
        state.visuals.floaters.push({ type: 'meat_down', targetType: state.currentPlayer === 1 ? 'p1' : 'p2', startTime: performance.now() });
    }
    if (isSteal && status === "early") return;

    let scoreGained = 0;
    if (status === "burnt") scoreGained = isSteal ? 0 : -2;
    else if (status === "early") scoreGained = -5;
    else {
        const heat = getBaseHeat(node.type);
        if (heat === 1) scoreGained = (status === "perfect") ? 12 : 3;
        else if (heat === 3) scoreGained = (status === "perfect") ? 6 : 2;
        else scoreGained = (status === "perfect") ? 8 : 2;
    }

    p.servedScore += scoreGained;
    
    if (scoreGained !== 0) {
        const floaterCol = scoreGained > 0 ? (status==="perfect"?"#ff4":"#f90") : "#f33";
        state.visuals.floaters.push({ type: 'star_up', amount: scoreGained, targetType: 'lane', targetIndex: state.lanes.indexOf(node), color: floaterCol, startTime: performance.now() });
    }
    
    // ★修正: テキストだけでなく、取った瞬間の「串のデータ」も一緒に保存する
    state.visuals.ghosts.push({ 
        laneIndex: state.lanes.indexOf(node), 
        status: status.toUpperCase(), 
        startTime: performance.now(),
        cookState: node.cookState, // 串を描画するための焼き加減
        owner: node.owner          // 串を描画するための所有者
    });

    node.built = false; node.owner = null; node.cookState = 0; node.justPlaced = false;
    consumeWorker();
}

function tryUchiwaNode(node) {
    if (node.built) {
        node.uchiwaBoost += 1;
        consumeWorker();
    }
}

function isNodeValidForMode(node, mode) {
    if (!node) return false;
    if (mode === "sapling") return !node.built;
    if (mode === "harvest") {
        if (!node.built) return false;
        if (node.owner === state.currentPlayer) return true;
        return getCookLabel(node.type, node.cookState) !== "early";
    }
    if (mode === "uchiwa") return node.built;
    return false;
}

// ==========================================
// 5. game/input.js - 入力処理
// ==========================================
function isInputLocked() {
    if (state.startRouletteActive) return true;
    
    const cp = state.currentPlayer;
    if (isAIPlayer(cp)) return true;

    return state.screen !== "game" || 
           state.isBusy || state.isAIThinking ||
           state.pendingPlayer !== null || 
           state.turnSplashTimer > 0 || 
           state.aiBreathTimer > 0 ||
           state.gameOver ||
           state.players[cp - 1].workersRemaining <= 0;
}

function handleCanvasClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (state.screen === "title") {
        const cy = LAYOUT.CANVAS_HEIGHT / 2;
        if (y < cy) startGame("ai"); else startGame("pvp");
        return;
    } else if (state.screen === "gameover" || state.screen === "clear") {
        initGameState();
        return;
    } else if (state.screen === "stage_clear") {
        nextStage();
        return;
    }

    if (isInputLocked()) return;

if (state.buildMode) {
        const cb = getCancelButtonBounds();
        if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
            // ★新規追加: CANCELボタンを押した時間を記録して、150ms後に戻る
            state.visuals.cancelClick = performance.now();
            state.isBusy = true;
            setTimeout(() => {
                state.buildMode = null; 
                state.pendingBox = null; 
                state.isBusy = false;
            }, 150);
            return;
        }

        for (let i = 0; i < state.lanes.length; i++) {
            const l = getLaneBounds(i);
            const padding = 15;
            if (x >= l.x - padding && x <= l.x + l.w + padding && y >= l.y - padding && y <= l.y + l.h + padding) {
                const node = state.lanes[i];
                if (isNodeValidForMode(node, state.buildMode)) {
                    if (state.buildMode === "sapling") tryBuildNode(node);
                    else if (state.buildMode === "harvest") tryHarvestNode(node);
                    else if (state.buildMode === "uchiwa") tryUchiwaNode(node);
                }
                return;
            }
        }
        return;
    }

for (let i = 0; i < LAYOUT.BUTTONS.length; i++) {
        const b = getButtonBounds(i);
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            const actionId = LAYOUT.BUTTONS[i].id;
            const boxId = i + 1;
            let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer);
            if (boxId === 2) canUse = canUseSkewer(state.currentPlayer);
            if (boxId === 3) canUse = canUseServe(state.currentPlayer);
            if (boxId === 4) canUse = true; 

            if (canUse) {
                // ★新規追加: ボタンを押した瞬間の時間を記録する
                state.visuals.buttonClicks[i] = performance.now();
                placeWorker(boxId);
            }
            return;
        }
    }
}

// ==========================================
// 6. game/ai.js - AIロジック
// ==========================================
const BALANCE = {
    weak: { heat: 1, perfect: [6, 7], okay: [5], pts: {perfect:12, okay:3, early:-5, burnt:-2} },
    medium: { heat: 2, perfect: [6], okay: [5], pts: {perfect:8, okay:2, early:-5, burnt:-2} },
    strong: { heat: 3, perfect: [6], okay: [5], pts: {perfect:6, okay:2, early:-5, burnt:-2} }
};

const AI_LEVEL_CONFIG = {
    1: { rand: 0.40, mistake: 0.30, futWt: 0.10, allowUchiwa: false, topCandRange: 3, scoreNoise: 10, closeThresh: 8, closeRate: 0.35 },
    2: { rand: 0.20, mistake: 0.15, futWt: 0.20, allowUchiwa: true,  topCandRange: 3, scoreNoise: 6,  closeThresh: 6, closeRate: 0.25 },
    3: { rand: 0.10, mistake: 0.05, futWt: 0.30, allowUchiwa: true,  topCandRange: 2, scoreNoise: 3,  closeThresh: 5, closeRate: 0.20 },
    4: { rand: 0.03, mistake: 0.01, futWt: 0.50, allowUchiwa: true,  topCandRange: 2, scoreNoise: 1.5, closeThresh: 4, closeRate: 0.10 },
    5: { rand: 0.15, mistake: 0.20, futWt: 0.40, allowUchiwa: true,  topCandRange: 3, scoreNoise: 4,  closeThresh: 6, closeRate: 0.25 }
};

function buildActionCandidates(currentState, playerIndex) {
    const actions = [];
    const p = currentState.players[playerIndex - 1];
    
    actions.push({ type: "meat" });
    if (p.resources >= 1) {
        currentState.lanes.forEach(n => { if (!n.built) actions.push({ type: "put", nodeId: n.id }); });
    }
    currentState.lanes.forEach(n => {
        if (n.built) {
            actions.push({ type: "serve", nodeId: n.id });
            actions.push({ type: "uchiwa", nodeId: n.id });
        }
    });
    return actions;
}

function isActionValidForAI(currentState, action, playerIndex, profileName, levelConf) {
    const p = currentState.players[playerIndex - 1];
    const node = currentState.lanes.find(l => l.id === action.nodeId);
    
    if (action.type === "meat" && p.resources >= 2) return false;
    if (action.type === "put") return true;
    if (action.type === "serve") {
        if (!node) return false;
        const isOwn = node.owner === playerIndex;
        const lbl = getCookLabel(node.type, node.cookState);
        if (isOwn) { if (lbl === "early") return false; } 
        else {
            if (p.resources < 1 && lbl !== "burnt") return false;
            if (lbl === "early" || lbl === "burnt") return false; 
        }
        return true;
    }
    if (action.type === "uchiwa") {
        if (!levelConf.allowUchiwa || !node || !node.built) return false;
        const isOwn = node.owner === playerIndex;
        const cv = node.cookState;
        const heat = getBaseHeat(node.type);
        const boosted_lbl = getCookLabel(node.type, cv + heat + 1);
        const curr_lbl = getCookLabel(node.type, cv);
        
        if (isOwn) {
            if (boosted_lbl === "burnt") return false;
            if (curr_lbl === "perfect") return false;
            if (boosted_lbl === "early" && profileName !== "reader") return false;
        } else {
            if (boosted_lbl === "burnt" && curr_lbl !== "burnt") return true;
            if (profileName === "thief" && (boosted_lbl==="okay"||boosted_lbl==="perfect") && curr_lbl==="early") return true;
            return false;
        }
        return true;
    }
    return true;
}

function scoreAIAction(currentState, action, playerIndex, profileName) {
    let score = 0;
    const p = currentState.players[playerIndex - 1];
    const node = currentState.lanes.find(l => l.id === action.nodeId);

    if (action.type === "meat") {
        if (p.resources === 0) score += 15;
        else if (p.resources === 1) score -= 1;
        else score -= 15;
    } else if (action.type === "put") {
        score += 10;
        if (profileName === "gambler" && node.type === "strong") score += 40;
        if (profileName === "master" && node.type === "weak") score += 15;
    } else if (action.type === "serve") {
        const lbl = getCookLabel(node.type, node.cookState);
        const isOwn = node.owner === playerIndex;
        if (lbl === "burnt") score += 25; 
        else if (!isOwn) {
            if (lbl === "perfect") score += (profileName === "thief" ? 80 : 30);
            if (lbl === "okay") score += (profileName === "thief" ? 50 : 10);
        } else {
            if (lbl === "perfect") score += 100;
            if (lbl === "okay") score += (profileName === "gambler" ? 45 : 15);
        }
    } else if (action.type === "uchiwa") {
        const isOwn = node.owner === playerIndex;
        const boosted_lbl = getCookLabel(node.type, node.cookState + getBaseHeat(node.type) + 1);
        if (isOwn) {
            if (boosted_lbl === "perfect") score += 75;
            if (boosted_lbl === "okay") score += 15;
        } else {
            if (boosted_lbl === "burnt") score += 85;
        }
    }
    return score;
}

function playAITurn() {
    if (state.startRouletteActive) return;
    if (!isAIPlayer(state.currentPlayer)) return;
    if (state.screen !== "game" || state.isBusy || state.gameOver || 
        state.pendingTurnSplash || state.pendingPlayer !== null || state.turnSplashTimer > 0 || state.aiBreathTimer > 0) return;
    
    if (state.players[state.currentPlayer - 1].workersRemaining <= 0) return;
    if (state.isAIThinking) return;

    state.isAIThinking = true;
    setTimeout(() => {
        try {
            const levelConf = AI_LEVEL_CONFIG[state.aiLevel] || AI_LEVEL_CONFIG[2];
            const profile = state.aiProfile;
            
            let cands = buildActionCandidates(state, state.currentPlayer).filter(a => isActionValidForAI(state, a, state.currentPlayer, profile, levelConf));
            if (cands.length === 0) cands.push({ type: "meat" });

            let scored = cands.map(a => {
                let s = scoreAIAction(state, a, state.currentPlayer, profile);
                s += (Math.random() * 2 - 1) * levelConf.scoreNoise;
                return { action: a, score: s };
            });

            scored.sort((a, b) => b.score - a.score);
            let best = scored[0].action;

            if (scored.length > 1) {
                const r = Math.random();
                if (r < levelConf.mistake) {
                    let pool = scored.filter((s, i) => i >= 1 && i <= 2 && (scored[0].score - s.score) <= 15);
                    if (pool.length > 0) best = pool[Math.floor(Math.random() * pool.length)].action;
                } else if (Math.random() < levelConf.rand) {
                    let pool = scored.slice(0, levelConf.topCandRange).filter(s => (scored[0].score - s.score) <= 12);
                    if (pool.length > 1) best = pool[Math.floor(Math.random() * pool.length)].action;
                } else {
                    let second = scored[1];
                    if ((scored[0].score - second.score) <= levelConf.closeThresh) {
                        if (Math.random() < levelConf.closeRate) best = second.action;
                    }
                }
            }

            if (best.type === "meat") placeWorker(1);
            else if (best.type === "put") { state.buildMode="sapling"; tryBuildNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "serve") { state.buildMode="harvest"; tryHarvestNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "uchiwa") { state.buildMode="uchiwa"; tryUchiwaNode(state.lanes.find(l=>l.id===best.nodeId)); }
        } finally {
            state.isAIThinking = false;
        }
    }, 450);
}

// ==========================================
// 7. render/render.js - 描画処理
// ==========================================
const getTime = () => performance.now();

// ★新規追加: フェードイン・フェードアウトの透明度を計算する関数
function getFadeAlpha(currentTimer, maxTimer, fadeFrames = 10) {
    if (currentTimer > maxTimer - fadeFrames) {
        return Math.max(0, (maxTimer - currentTimer) / fadeFrames);
    } else if (currentTimer < fadeFrames) {
        return Math.max(0, currentTimer / fadeFrames);
    }
    return 1.0; 
}

function drawBevelRect(ctx, x, y, w, h, baseColor, isPressed = false) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, w, h);

    if (isPressed) {
        // ★変更: 押されている時は内側に濃い影をつけて凹みを表現
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(x, y, w, h);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x, y, w, 6); // 上の影
        ctx.fillRect(x, y, 6, h); // 左の影
    } else {
        // 通常時は出っ張った表現(ハイライトと影)
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(x, y, w, 4); 
        ctx.fillRect(x, y, 4, h); 

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(x, y + h - 6, w, 6); 
        ctx.fillRect(x + w - 4, y, 4, h); 
    }
}
function drawDeliciousYakitori(ctx, x, y, w, h, baseColor, isNegi) {
    ctx.fillStyle = baseColor;
    
    if (isNegi) {
        const nx = x + 4;
        const nw = w - 8;
        ctx.fillRect(nx, y, nw, h);
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(nx + 2, y + 2, nw - 4, 4);
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(nx, y + h - 6, nw, 6);
        ctx.fillRect(nx + nw - 4, y, 4, h);
    } else {
        ctx.fillRect(x + 4, y, w - 8, h); 
        ctx.fillRect(x, y + 4, w, h - 8); 
        
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(x + 6, y + 4, w - 16, 4); 
        ctx.fillRect(x + 4, y + 8, 4, 6);      
        
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(x + 4, y + h - 8, w - 8, 8);  
        ctx.fillRect(x + w - 6, y + 6, 4, h - 14); 
    }
}

function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId]; if (!data) return;
    const isDisabled = (color === "#888"); 
    
    for (let i = 0; i < 64; i++) {
        const val = data[i];
        if (val !== 0) {
            const x = (i % 8) * scale; 
            const y = Math.floor(i / 8) * scale;
            
            if (isDisabled) {
                ctx.fillStyle = "#888"; 
            } else {
                ctx.fillStyle = ICON_PALETTE[val] || color;
            }
            ctx.fillRect(cx - (4 * scale) + x, cy - (4 * scale) + y, scale, scale);
        }
    }
}

function render(ctx) {
    const now = getTime();
    state.visuals.ghosts = state.visuals.ghosts.filter(g => now - g.startTime < 1000);
    state.visuals.floaters = state.visuals.floaters.filter(f => now - f.startTime < 800);
    ctx.fillStyle = LAYOUT.COLORS.BG;
    ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2;

    if (state.screen === "title") {
        ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN; ctx.font = "bold 32px monospace"; ctx.textAlign = "center";
        ctx.fillText("YAKITORI WARS", cx, cy - 80);
        ctx.fillStyle = "#3c96ff"; ctx.fillRect(cx - 120, cy - 30, 240, 60);
        ctx.fillStyle = "#fff"; ctx.font = "20px monospace"; ctx.fillText("VS AI (SURVIVAL)", cx, cy + 6);
        ctx.fillStyle = "#ff5078"; ctx.fillRect(cx - 120, cy + 50, 240, 60);
        ctx.fillStyle = "#fff"; ctx.fillText("VS PLAYER", cx, cy + 86);
    } else if (state.screen === "game") {
        drawGameScreen(ctx);
    } else if (state.screen === "gameover" || state.screen === "clear" || state.screen === "stage_clear") {
        ctx.fillStyle = "#fff"; ctx.font = "bold 36px monospace"; ctx.textAlign = "center";
        ctx.fillText(state.screen === "gameover" ? "GAME OVER" : "CLEAR!", cx, cy - 50);
        ctx.font = "24px monospace";
        ctx.fillStyle = state.winnerText.includes("P2") ? LAYOUT.COLORS.P2 : LAYOUT.COLORS.P1;
        ctx.fillText(state.winnerText, cx, cy);
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace";
        ctx.fillText("Tap to Continue", cx, cy + 80);
    }
}

function drawGameScreen(ctx) {
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2;
    const panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25);
    const safeTop = 15;
    
    // ★新規追加: アニメーション計算のために、現在の時間を関数の先頭で取得
    const now = getTime();

    const activePlayer = state.startRouletteActive ? state.startRouletteIndex : (state.pendingPlayer !== null ? state.pendingPlayer : state.currentPlayer);

    drawPlayerPanel(ctx, state.players[0], 10, safeTop, panelW, 75, 1, activePlayer);
    drawPlayerPanel(ctx, state.players[1], LAYOUT.CANVAS_WIDTH - panelW - 10, safeTop, panelW, 75, 2, activePlayer);

    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
    ctx.fillText(`ROUND ${state.round}`, cx, safeTop + 25);
    if (state.gameMode === "ai") {
        ctx.font = "14px monospace"; ctx.fillText(`STAGE ${state.currentStage} ${state.enemyName}`, cx, safeTop + 45);
    }

    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i);

        drawBevelRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, "#3a3a45");

        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.strokeStyle = "#555"; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 1; j <= 5; j++) {
            const barY = b.y + (b.h * j / 6);
            ctx.moveTo(b.x, barY); ctx.lineTo(b.x + b.w, barY);
        }
        [0.2, 0.8].forEach(ratio => {
            const barX = b.x + b.w * ratio;
            ctx.moveTo(barX, b.y); ctx.lineTo(barX, b.y + b.h);
        });
        ctx.stroke();

        const gradient = ctx.createLinearGradient(0, b.y + b.h - 50, 0, b.y + b.h);
        gradient.addColorStop(0, "rgba(255, 50, 0, 0)");
        gradient.addColorStop(1, `rgba(255, 60, 10, ${0.15 + lane.fire * 0.15})`);
        ctx.fillStyle = gradient; ctx.fillRect(b.x, b.y + b.h - 50, b.w, 50);

if (state.buildMode && isNodeValidForMode(lane, state.buildMode)) {
            // 時間の経過を利用して、波のように行ったり来たりする数値を計算します
            // 0.15 を基準に、±0.1(つまり 0.05 〜 0.25 の間)で透明度が変化します
            const alpha = 0.15 + Math.sin(getTime() / 150) * 0.1;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(b.x, b.y, b.w, b.h);
        }
        const laneCx = b.x + b.w/2;
        
        if (lane.built) {
            const status = getCookLabel(lane.type, lane.cookState);
            const p = getVisualPalette(status.toUpperCase());
            
            // --- ★変更: 置いた時のスライドダウン・アニメーション計算 ---
            const placedTime = state.visuals.placedAt[lane.id] || 0;
            const elapsedPlace = now - placedTime;
            let yOffset = 0;
            if (elapsedPlace < 300) {
                // 300msかけて、上(-80px)から定位置(0)にフワッと落ちる(イージング)
                const t = elapsedPlace / 300;
                yOffset = -80 * (1 - Math.pow(t, 3)); 
            }

            const stickH = b.h * 0.7; 
            const baseStickTop = b.y + b.h * 0.1; // 本来の位置
            const stickTop = baseStickTop + yOffset; // アニメーション用オフセットを加算
            
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx-1, stickTop, 4, stickH); 
            ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx-2, stickTop, 4, stickH);
            
            const meatW = b.w * 0.6; const meatH = stickH * 0.2; const meatX = laneCx - meatW/2;
            
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false);
            
            ctx.fillStyle = lane.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
            ctx.beginPath(); ctx.moveTo(laneCx, stickTop - 10); ctx.lineTo(laneCx-5, stickTop-15); ctx.lineTo(laneCx+5, stickTop-15); ctx.fill();
            
            // --- 焼け具合メーター (網にくっついているのでアニメーションさせない) ---
            const cv = Math.min(lane.cookState || 0, 6);
            const dotSize = 8; const dotGap = 4;  
            const gridW = 3 * dotSize + 2 * dotGap; const gridH = 2 * dotSize + dotGap;
            const dotStartX = laneCx - gridW / 2;
            const dotStartY = baseStickTop + stickH + 12; // baseStickTopを使用して固定

            drawBevelRect(ctx, dotStartX - 6, dotStartY - 6, gridW + 12, gridH + 12, "#242430");

            for (let j = 0; j < 6; j++) {
                const col = j % 3; const row = Math.floor(j / 3);
                const dx = dotStartX + col * (dotSize + dotGap);
                const dy = dotStartY + row * (dotSize + dotGap);

                if (j < cv) {
                    ctx.fillStyle = p.dot; ctx.fillRect(dx, dy, dotSize, dotSize);
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.fillRect(dx + 1, dy + 1, dotSize - 4, dotSize - 5);
                } else {
                    ctx.fillStyle = "rgba(10, 10, 15, 0.9)"; ctx.fillRect(dx, dy, dotSize, dotSize);
                    ctx.fillStyle = "rgba(255, 255, 255, 0.15)"; ctx.fillRect(dx, dy + dotSize - 1, dotSize, 1);
                }
            }
        }
        
        const fireScale = 2.5; const fireSize = 8 * fireScale; const fireGap = 4; 
        const totalFireW = (fireSize * lane.fire) + (fireGap * (lane.fire - 1));
        const startFireX = laneCx - totalFireW / 2 + fireSize / 2;
        for (let f = 0; f < lane.fire; f++) {
            drawDotIcon(ctx, "fire", startFireX + f * (fireSize + fireGap), b.y + b.h + 22, "#fa3", fireScale);
        }
    });

    // 煙パーティクルの更新と描画
    for (let i = state.visuals.particles.length - 1; i >= 0; i--) {
        let p = state.visuals.particles[i]; p.life++;
        if (p.life >= p.maxLife) { state.visuals.particles.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        const ratio = p.life / p.maxLife;
        ctx.globalAlpha = 0.6 * (1 - ratio);
        ctx.fillStyle = "#e0e0e0"; ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size * (1 + ratio)) / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0; 

    // ボタン描画
if (state.buildMode) {
        const cb = getCancelButtonBounds();
        // ★新規追加: CANCELボタンの凹み計算
        const clickTime = state.visuals.cancelClick || 0;
        const isPressed = (now - clickTime < 150);
        
        drawBevelRect(ctx, cb.x, cb.y, cb.w, cb.h, "#a33", isPressed);
        
        const offset = isPressed ? 3 : 0; // 凹んだ時に文字もずらす
        ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign="center";
        ctx.fillText("CANCEL", cb.x + cb.w/2 + offset, cb.y + cb.h/2 + 6 + offset);
    } else {
        LAYOUT.BUTTONS.forEach((btn, i) => {
            const b = getButtonBounds(i);
            const boxId = i + 1;
            let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer);
            if (boxId === 2) canUse = canUseSkewer(state.currentPlayer);
            if (boxId === 3) canUse = canUseServe(state.currentPlayer);
            if (boxId === 4) canUse = true; 

            // ★新規追加: 凹み状態の判定 (クリックから150ms以内なら凹む)
            const clickTime = state.visuals.buttonClicks[i] || 0;
            const isPressed = (now - clickTime < 150);
            
            // 押された直後は入力ロック状態でもグレーアウトさせない
            const isLocked = isInputLocked() && !isPressed;
            const baseColor = (canUse && !isLocked) ? btn.color : "#445";

            drawBevelRect(ctx, b.x, b.y, b.w, b.h, baseColor, isPressed);
            
            // ★新規追加: 凹んだ時はアイコンも右下に「3px」ずらす
            const offset = isPressed ? 3 : 0;
            drawDotIcon(ctx, btn.icon, b.x + b.w/2 + offset, b.y + b.h/2 + offset, (canUse && !isLocked) ? "#fff" : "#888", 4);
        });
    }
    // 帯フェード描画
    if (state.startRouletteActive) {
        const fadeAlpha = getFadeAlpha(state.startRouletteTimer, state.startRouletteDuration, 15);
        ctx.globalAlpha = fadeAlpha; 
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; const bandH = 120; ctx.fillRect(0, cy - bandH/2, LAYOUT.CANVAS_WIDTH, bandH);
        ctx.fillStyle = state.startRouletteIndex === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 48px monospace"; ctx.textAlign = "center"; ctx.fillText(`P${state.startRouletteIndex}`, cx, cy + 20);
        ctx.fillStyle = "#fff"; ctx.font = "20px monospace"; ctx.fillText("WHO GOES FIRST?", cx, cy - 30);
        ctx.globalAlpha = 1.0; 
    } else if (state.turnSplashTimer > 0) {
        const fadeAlpha = getFadeAlpha(state.turnSplashTimer, 45, 10);
        ctx.globalAlpha = fadeAlpha; 
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; const bandH = 80; ctx.fillRect(0, cy - bandH/2, LAYOUT.CANVAS_WIDTH, bandH);
        ctx.fillStyle = activePlayer === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 32px monospace"; ctx.textAlign = "center"; ctx.fillText(`P${activePlayer} TURN`, cx, cy + 10);
        ctx.globalAlpha = 1.0; 
    }

    // --- ★変更: 取った時のスライドアップ・アニメーション (ghosts) ---
    state.visuals.ghosts.forEach(g => {
        const elapsed = now - g.startTime;
        const progress = Math.min(1, elapsed / 800);
        
        // 0から-150まで上にフワッとスライド
        const yOffset = -150 * (1 - Math.pow(1 - progress, 3)); 
        ctx.globalAlpha = 1 - progress;
        
        const b = getLaneBounds(g.laneIndex);
        const laneCx = b.x + b.w / 2;
        const p = getVisualPalette(g.status);
        
        // 串のデータが保存されていれば、串そのものを描いて飛ばす
        if (g.cookState !== undefined) {
            const stickH = b.h * 0.7; 
            const stickTop = b.y + b.h * 0.1 + yOffset; // yOffsetを加算
            
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx-1, stickTop, 4, stickH); 
            ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx-2, stickTop, 4, stickH);
            
            const meatW = b.w * 0.6; const meatH = stickH * 0.2; const meatX = laneCx - meatW/2;
            
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false);
            
            ctx.fillStyle = g.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
            ctx.beginPath(); ctx.moveTo(laneCx, stickTop - 10); ctx.lineTo(laneCx-5, stickTop-15); ctx.lineTo(laneCx+5, stickTop-15); ctx.fill();
        }

        ctx.fillStyle = p.dot || "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
        // 文字は飛んでいく串のさらに少し上に表示
        ctx.fillText(g.status, laneCx, b.y + b.h/2 + yOffset - 20);
    });

    state.visuals.floaters.forEach(f => {
        const elapsed = now - f.startTime;
        const progress = Math.min(1, elapsed / 800);
        const yOffset = -progress * 50; 
        ctx.globalAlpha = 1 - progress;

        let fx, fy;
        if (f.targetType === 'p1' || f.targetType === 'p2') {
            fx = LAYOUT.CANVAS_WIDTH / 2; fy = LAYOUT.CANVAS_HEIGHT / 2 - 100;
        } else if (f.targetType === 'lane') {
            const b = getLaneBounds(f.targetIndex); fx = b.x + b.w/2; fy = b.y - 10;
        }

        ctx.textAlign = "center";
        if (f.type === 'meat_up') {
            ctx.fillStyle = "#fa3"; ctx.font = "bold 28px monospace"; ctx.fillText("+1", fx, fy + yOffset);
        } else if (f.type === 'meat_down') {
            ctx.fillStyle = "#f33"; ctx.font = "bold 28px monospace"; ctx.fillText("-1", fx, fy + yOffset);
        } else if (f.type === 'star_up') {
            ctx.fillStyle = f.color; ctx.font = "bold 32px monospace";
            const prefix = f.amount > 0 ? "+" : ""; ctx.fillText(`${prefix}${f.amount}`, fx, fy + yOffset);
        }
    });
    ctx.globalAlpha = 1.0;
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx, activePlayer) {
    const active = activePlayer === idx;
    const baseColor = active ? (idx === 1 ? "#2a4a6a" : "#6a2a3a") : LAYOUT.COLORS.PANEL_BG;
    
    drawBevelRect(ctx, x, y, w, h, baseColor);
    
    if (active) {
        ctx.strokeStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }
    
    ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
    ctx.font = "bold 18px monospace"; 
    ctx.textAlign = "left";
    ctx.fillText(`P${idx}`, x + 10, y + 25);
    
    drawDotIcon(ctx, "diamond", x + 20, y + 45, "#6cf", 2);
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${player.score}`, x + w - 10, y + 50);
    
    const meatCount = player.resources || 0;
    drawDotIcon(ctx, "meat", x + 20, y + 65, "#f77", 2);
    ctx.fillStyle = "#fff"; 
    ctx.fillText(`${meatCount}`, x + w - 10, y + 70);
}

// ==========================================
// 8. main.js - セットアップとスマホ対応
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game");
    
    if (!canvas) {
        console.error("エラー: canvas#game が見つかりません。");
        return;
    }

    const ctx = canvas.getContext("2d");

    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = "#111";
    document.body.style.height = "100vh";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;

        LAYOUT.CANVAS_WIDTH = vw;
        LAYOUT.CANVAS_HEIGHT = vh;
        canvas.width = vw * dpr;
        canvas.height = vh * dpr;
        canvas.style.width = vw + "px";
        canvas.style.height = vh + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();

    let lastTouchTime = 0;

    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        lastTouchTime = Date.now();
        const touch = e.touches[0];
        handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY }, canvas);
    }, { passive: false });

    canvas.addEventListener("click", (e) => {
        if (Date.now() - lastTouchTime < 500) return;
        handleCanvasClick(e, canvas);
    });

    function loop() {
        updateRoulette();
        resolvePendingTurnFlow();
        render(ctx);
        playAITurn();
        requestAnimationFrame(loop);
    }
    
    loop();
});
