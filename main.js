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
            buttonClicks: {}, buttonErrors: {}, laneErrors: {}, laneFlashes: {}, placedAt: {}, ghosts: [], floaters: []
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
// --- 新規追加: ドット絵用のカラーパレット ---
const ICON_PALETTE = {
    1: "#ffffff", // 白(骨、ハイライト)
    2: "#d95763", // 肉(赤身)
    3: "#8c3f5d", // 肉(影)
    4: "#df7126", // 火(オレンジ)
    5: "#fbf236", // 火(黄色)
    6: "#5fcde4", // ダイヤ(水色)
    7: "#8f563b", // うちわの柄(茶色)
    8: "#ac3232", // うちわの模様(赤)
    9: "#e8ede7"  // うちわの紙(オフホワイト)
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
    // 置く (下矢印)
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
    // 取る/捨てる (上矢印)
    serve: [
        0,0,0,10,10,0,0,0,
        0,0,10,10,10,10,0,0,
        0,10,10,10,10,10,10,0,
        10,10,10,10,10,10,10,10,
        0,0,0,10,10,0,0,0,
        0,0,0,10,10,0,0,0,
        0,0,0,10,10,0,0,0,
        0,0,0,10,10,0,0,0
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
// ↓ ここから
const STAGE_CONFIG = {
    1: { profile: "gambler", level: 1, enemyName: "KENTA" },
    2: { profile: "thief",   level: 2, enemyName: "HIDEKI" },
    3: { profile: "reader",  level: 3, enemyName: "TETSUYA" },
    4: { profile: "master",  level: 4, enemyName: "MAKOTO" },
    5: { profile: "master",  level: 5, enemyName: "BOSS" }
};
// ↑ ここまでを上書きします

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

function advanceAllSkewersAtRoundEnd() {
    state.lanes.forEach(n => {
        if (n.built) {
            if (n.justPlaced) n.justPlaced = false;
            else {
                const baseHeat = getBaseHeat(n.type);
                const boost = n.uchiwaBoost || 0;
                n.cookState = Math.min(8, n.cookState + baseHeat + boost);
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

function switchTurn() {
    const nextP = 3 - state.currentPlayer;
    if (state.players[nextP - 1].workersRemaining > 0) {
        state.pendingPlayer = nextP;
        state.pendingTurnSplash = true;
        if (isAIPlayer(nextP)) {
            state.pendingAiBreath = true;
        }
    } else if (state.players[state.currentPlayer - 1].workersRemaining <= 0) {
        setTimeout(() => tryEndRound(), 600);
    }
}

// ★修正: Codea版の仕様に合わせ、ルーレットで決定した先攻(firstPlayer)から毎ラウンド開始する
function startNewRound() {
    state.round++;
    state.players.forEach(p => p.workersRemaining = 1);

    state.buildMode = null;
    state.pendingBox = null;

    // ★変更箇所: 1に固定されていた部分を state.firstPlayer に変更しました
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

        // ★確認箇所: ルーレットの結果を firstPlayer にしっかり保持しています
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
    return true; // Codea版に合わせて無制限に変更
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
    } else if (boxId === 2) { // Put
        if (p.resources >= 1) { state.buildMode = "sapling"; state.pendingBox = boxId; }
    } else if (boxId === 3) { // Harvest/Discard
        state.buildMode = "harvest"; state.pendingBox = boxId;
    } else if (boxId === 4) { // Uchiwa
        state.buildMode = "uchiwa"; state.pendingBox = boxId;
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
    
    if (isSteal) {
        if (status === "early") return; 
        if (status !== "burnt") {
            if (p.resources < 1) return;
            p.resources -= 1;
            state.visuals.floaters.push({ type: 'meat_down', targetType: state.currentPlayer === 1 ? 'p1' : 'p2', startTime: performance.now() });
        }
    }

    let scoreGained = 0;
    if (status === "burnt") {
        if (isSteal) scoreGained = 0; 
        else scoreGained = -2; 
    } else if (status === "early") {
        scoreGained = -5; 
    } else {
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
    state.visuals.ghosts.push({ laneIndex: state.lanes.indexOf(node), status: status.toUpperCase(), startTime: performance.now() });

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
    // --- 新規追加: ルーレット中は入力不可 ---
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
        const cBtn = getCancelButtonBounds();
        if (x >= cBtn.x && x <= cBtn.x + cBtn.w && y >= cBtn.y && y <= cBtn.y + cBtn.h) {
            state.buildMode = null; state.pendingBox = null; return;
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

            if (canUse) placeWorker(boxId);
            return;
        }
    }
}

// ==========================================
// 6. game/ai.js - AIロジック (Codea完全移植)
// ==========================================
const BALANCE = {
    weak: { heat: 1, perfect: [6, 7], okay: [5], pts: {perfect:12, okay:3, early:-5, burnt:-2} },
    medium: { heat: 2, perfect: [6], okay: [5], pts: {perfect:8, okay:2, early:-5, burnt:-2} },
    strong: { heat: 3, perfect: [6], okay: [5], pts: {perfect:6, okay:2, early:-5, burnt:-2} }
};

// AIの全レベル(1〜5)のパラメータ
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

            // スコアが高い順に並び替え
            scored.sort((a, b) => b.score - a.score);
            let best = scored[0].action;

            // --- 全レベル対応:ミスと揺らぎの判定 ---
            if (scored.length > 1) {
                const r = Math.random();
                if (r < levelConf.mistake) {
                    // ミス:1位との差が15点以内の2位または3位を選ぶ
                    let pool = scored.filter((s, i) => i >= 1 && i <= 2 && (scored[0].score - s.score) <= 15);
                    if (pool.length > 0) best = pool[Math.floor(Math.random() * pool.length)].action;
                } else if (Math.random() < levelConf.rand) {
                    // ランダム:1位との差が12点以内の上位候補から選ぶ
                    let pool = scored.slice(0, levelConf.topCandRange).filter(s => (scored[0].score - s.score) <= 12);
                    if (pool.length > 1) best = pool[Math.floor(Math.random() * pool.length)].action;
                } else {
                    // 僅差の揺らぎ:1位と2位が近いスコアなら、確率で2位を選ぶ
                    let second = scored[1];
                    if ((scored[0].score - second.score) <= levelConf.closeThresh) {
                        if (Math.random() < levelConf.closeRate) best = second.action;
                    }
                }
            }
            // ----------------------------------------

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
// 立体的なパネル(ボタンやUI枠)を描画する関数
function drawBevelRect(ctx, x, y, w, h, baseColor, isPressed = false) {
    // 影とハイライトの色を計算(簡易的)
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, w, h);

    if (isPressed) {
        // 押されている時は上が暗く、下が明るい(または全体を少し暗く沈める)
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(x, y, w, h);
    } else {
        // 通常時は上・左にハイライト、下・右にシャドウ
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(x, y, w, 4); // 上ハイライト
        ctx.fillRect(x, y, 4, h); // 左ハイライト

        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(x, y + h - 6, w, 6); // 下シャドウ(少し太め)
        ctx.fillRect(x + w - 4, y, 4, h); // 右シャドウ
    }
}
// 焼き鳥(肉とネギ)を美味しそうに描画する関数
function drawDeliciousYakitori(ctx, x, y, w, h, baseColor, isNegi) {
    ctx.fillStyle = baseColor;
    
    if (isNegi) {
        // ネギは円柱状(少しスリムにする)
        const nx = x + 4;
        const nw = w - 8;
        ctx.fillRect(nx, y, nw, h);
        
        // ネギのハイライト(光沢)
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(nx + 2, y + 2, nw - 4, 4);
        
        // ネギの影
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(nx, y + h - 6, nw, 6);
        ctx.fillRect(nx + nw - 4, y, 4, h);
    } else {
        // 肉は丸みを帯びた形(四隅の角を落とすドット絵風の描画)
        ctx.fillRect(x + 4, y, w - 8, h); // 縦長のベース
        ctx.fillRect(x, y + 4, w, h - 8); // 横長のベース
        
        // 肉のハイライト(タレの照り!)
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(x + 6, y + 4, w - 16, 4); // 上部のテカり
        ctx.fillRect(x + 4, y + 8, 4, 6);      // 左側のテカり
        
        // 肉の影(立体感)
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(x + 4, y + h - 8, w - 8, 8);  // 下部の影
        ctx.fillRect(x + w - 6, y + 6, 4, h - 14); // 右側の影
    }
}
function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId]; if (!data) return;
    
    // 無効状態(colorがグレー)かどうかを判定
    const isDisabled = (color === "#888"); 
    
    for (let i = 0; i < 64; i++) {
        const val = data[i];
        if (val !== 0) {
            const x = (i % 8) * scale; 
            const y = Math.floor(i / 8) * scale;
            
            // 色の決定ロジック
            if (isDisabled) {
                ctx.fillStyle = "#888"; // 無効時はすべてグレー
            } else if (val === 10) {
                ctx.fillStyle = color; // 10はUI指定色(白など)をそのまま使う
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
    const panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25);
    const safeTop = 15;

    // ルーレット中は activePlayer のハイライトを一旦 P1/P2 両方オフにするか、インデックスに合わせます
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

        // 1. 焼き網の外枠(立体的な金属フレーム)
        drawBevelRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, "#3a3a45");

        // 2. 炭火の空間(奥深く暗い色)
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // 3. 鉄格子(焼き網)を描画
        ctx.strokeStyle = "#555";
        ctx.lineWidth = 2;
        ctx.beginPath();
        // 横棒 (5本)
        for (let j = 1; j <= 5; j++) {
            const barY = b.y + (b.h * j / 6);
            ctx.moveTo(b.x, barY);
            ctx.lineTo(b.x + b.w, barY);
        }
        // 縦棒 (左右2本の支柱)
        [0.2, 0.8].forEach(ratio => {
            const barX = b.x + b.w * ratio;
            ctx.moveTo(barX, b.y);
            ctx.lineTo(barX, b.y + b.h);
        });
        ctx.stroke();

        // 4. 炭火のぼんやりした赤い光(下部)
        // 火力(lane.fire)が強いほど赤く明るく光る
        const gradient = ctx.createLinearGradient(0, b.y + b.h - 50, 0, b.y + b.h);
        gradient.addColorStop(0, "rgba(255, 50, 0, 0)");
        gradient.addColorStop(1, `rgba(255, 60, 10, ${0.15 + lane.fire * 0.15})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(b.x, b.y + b.h - 50, b.w, 50);

        // 5. アクション選択時のハイライト
        if (state.buildMode && isNodeValidForMode(lane, state.buildMode)) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.fillRect(b.x, b.y, b.w, b.h);
        }

        const laneCx = b.x + b.w/2;
        
        // 6. 串と肉の描画
        if (lane.built) {
            const status = getCookLabel(lane.type, lane.cookState);
            const p = getVisualPalette(status.toUpperCase());
            const stickH = b.h * 0.7; const stickTop = b.y + b.h * 0.1;
            
            // 串(少し影をつける)
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx-1, stickTop, 4, stickH); // 影
            ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx-2, stickTop, 4, stickH);
            
            const meatW = b.w * 0.6; const meatH = stickH * 0.2; const meatX = laneCx - meatW/2;
            
// 肉とネギをふっくら艶やかに描画
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false);
            
// 焼け具合のドット表示 (3x2グリッド)
            const cv = Math.min(lane.cookState || 0, 6);
            const dotSize = 6; const dotGap = 2;
            const gridW = 3 * dotSize + 2 * dotGap;
            const gridH = 2 * dotSize + dotGap;
            const dotStartX = laneCx - gridW / 2;
            // ★変更: 串の最下部(stickTop + stickH)からさらに10px下に移動
            const dotStartY = stickTop + stickH + 10;

            ctx.fillStyle = "rgba(15, 15, 25, 0.95)";
            ctx.fillRect(dotStartX - 2, dotStartY - 2, gridW + 4, gridH + 4);

            for (let j = 0; j < 6; j++) {
                const col = j % 3; const row = Math.floor(j / 3);
                const dx = dotStartX + col * (dotSize + dotGap);
                const dy = dotStartY + row * (dotSize + dotGap);
                ctx.fillStyle = (j < cv) ? p.dot : "rgba(255, 255, 255, 0.15)";
                ctx.fillRect(dx, dy, dotSize, dotSize);
            }
            
            // 所有者マーク(P1 or P2 の三角形)
            ctx.fillStyle = lane.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
            ctx.beginPath(); ctx.moveTo(laneCx, stickTop - 10); ctx.lineTo(laneCx-5, stickTop-15); ctx.lineTo(laneCx+5, stickTop-15); ctx.fill();
        }
        
// 7. 火力アイコン(ドット絵)を枠の下に並べる
        const fireScale = 2.5; // 火のサイズ
        const fireSize = 8 * fireScale;
        const fireGap = 4; // アイコン間の隙間
        const totalFireW = (fireSize * lane.fire) + (fireGap * (lane.fire - 1));
        const startFireX = laneCx - totalFireW / 2 + fireSize / 2;

        for (let f = 0; f < lane.fire; f++) {
            // 中心座標を計算して描画
            drawDotIcon(ctx, "fire", startFireX + f * (fireSize + fireGap), b.y + b.h + 22, "#fa3", fireScale);
        }
    });

    if (state.buildMode) {
        const cb = getCancelButtonBounds();
        drawBevelRect(ctx, cb.x, cb.y, cb.w, cb.h, "#a33");
        ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace";
        ctx.fillText("CANCEL", cb.x + cb.w/2, cb.y + cb.h/2 + 6);
    } else {
        LAYOUT.BUTTONS.forEach((btn, i) => {
            const b = getButtonBounds(i);
            const boxId = i + 1;
            let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer);
            if (boxId === 2) canUse = canUseSkewer(state.currentPlayer);
            if (boxId === 3) canUse = canUseServe(state.currentPlayer);
            if (boxId === 4) canUse = true; 

            const isLocked = isInputLocked();
            const baseColor = (canUse && !isLocked) ? btn.color : "#445";

            // 立体的なボタンを描画
            drawBevelRect(ctx, b.x, b.y, b.w, b.h, baseColor);

            // アイコンを中央に大きく配置(ラベル文字はあえて描画しない)
            drawDotIcon(ctx, btn.icon, b.x + b.w/2, b.y + b.h/2, (canUse && !isLocked) ? "#fff" : "#888", 4);
        });
    }

    // --- 新規追加: ルーレットの描画 ---
    if (state.startRouletteActive) {
        ctx.fillStyle = LAYOUT.COLORS.OVERLAY_BG; 
        ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);

        ctx.fillStyle = state.startRouletteIndex === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 48px monospace"; 
        ctx.textAlign = "center";
        ctx.fillText(`P${state.startRouletteIndex}`, cx, LAYOUT.CANVAS_HEIGHT / 2 + 10);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px monospace";
        ctx.fillText("WHO GOES FIRST?", cx, LAYOUT.CANVAS_HEIGHT / 2 - 40);
    } 
    // 既存のターンスプラッシュ
    else if (state.turnSplashTimer > 0) {
        ctx.fillStyle = LAYOUT.COLORS.OVERLAY_BG; ctx.fillRect(0,0,LAYOUT.CANVAS_WIDTH,LAYOUT.CANVAS_HEIGHT);
        ctx.fillStyle = activePlayer === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 32px monospace"; 
        ctx.fillText(`P${activePlayer} TURN`, cx, LAYOUT.CANVAS_HEIGHT / 2);
    }
    // ------------------------------------

    const now = getTime();
    state.visuals.ghosts.forEach(g => {
        const elapsed = now - g.startTime;
        const progress = Math.min(1, elapsed / 1000);
        const yOffset = -progress * 50;
        ctx.globalAlpha = 1 - progress;
        const b = getLaneBounds(g.laneIndex);
        const p = getVisualPalette(g.status);
        ctx.fillStyle = p.dot || "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
        ctx.fillText(g.status, b.x + b.w/2, b.y + b.h/2 + yOffset);
    });

    state.visuals.floaters.forEach(f => {
        const elapsed = now - f.startTime;
        const progress = Math.min(1, elapsed / 800);
        const yOffset = -progress * 50; // フワッと上に消える移動量
        ctx.globalAlpha = 1 - progress;

        let fx, fy;
        if (f.targetType === 'p1' || f.targetType === 'p2') {
            // ★変更: 肉の増減は画面中央(やや上)に集約する
            fx = LAYOUT.CANVAS_WIDTH / 2;
            fy = LAYOUT.CANVAS_HEIGHT / 2 - 100;
        }
        else if (f.targetType === 'lane') {
            // 取ったときのスコア等は、該当する串(レーン)の上にそのまま表示
            const b = getLaneBounds(f.targetIndex);
            fx = b.x + b.w/2; 
            fy = b.y - 10;
        }

        ctx.textAlign = "center";

        // ★変更: 文字サイズを少し大きくして視認性をアップ
        if (f.type === 'meat_up') {
            ctx.fillStyle = "#fa3"; ctx.font = "bold 28px monospace"; 
            ctx.fillText("+1 肉", fx, fy + yOffset);
        } else if (f.type === 'meat_down') {
            ctx.fillStyle = "#f33"; ctx.font = "bold 28px monospace"; 
            ctx.fillText("-1 肉", fx, fy + yOffset);
        } else if (f.type === 'star_up') {
            ctx.fillStyle = f.color; ctx.font = "bold 32px monospace";
            const prefix = f.amount > 0 ? "+" : ""; 
            ctx.fillText(`${prefix}${f.amount}`, fx, fy + yOffset);
        }
    });
    ctx.globalAlpha = 1.0;
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx, activePlayer) {
    const active = activePlayer === idx;
    const baseColor = active ? (idx === 1 ? "#2a4a6a" : "#6a2a3a") : LAYOUT.COLORS.PANEL_BG;
    
    // パネルの背景(枠付き)
    drawBevelRect(ctx, x, y, w, h, baseColor);
    
    // アクティブなプレイヤーはさらに外枠を光らせる
    if (active) {
        ctx.strokeStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
    }
    
    // プレイヤー名 (P1 / P2)
    ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
    ctx.font = "bold 18px monospace"; 
    ctx.textAlign = "left";
    ctx.fillText(`P${idx}`, x + 10, y + 25);
    
    // スコア(ダイヤアイコン + 数字)
    drawDotIcon(ctx, "diamond", x + 20, y + 45, "#6cf", 2);
    ctx.fillStyle = "#fff"; 
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`${player.score}`, x + w - 10, y + 50);
    
    // 肉の数(肉アイコン + 数字)
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
    
    // Canvasが存在しない場合の安全対策
    if (!canvas) {
        console.error("エラー: canvas#game が見つかりません。HTMLに <canvas id=\"game\"></canvas> が存在するか確認してください。");
        return;
    }

    const ctx = canvas.getContext("2d");

    // CSSはHTML側で指定しても良いですが、JS側でも念のため適用
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
    
    // ゲームループ開始
    loop();
});
