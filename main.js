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
        nextFirstPlayer: 1,
        gameOver: false,
        winnerText: "",
        winReason: "",
        isBusy: false, // 演出中の入力ロック用
        isAIThinking: false,
        
        // --- ルーレット演出用 ---
        startRouletteActive: false,
        startRouletteTimer: 0,
        startRouletteDuration: 90, // 約1.5秒
        startRouletteIndex: 1,
        startRouletteFinalPlayer: null,
        
        // --- ターン切り替え演出用 ---
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
            buttonClicks: {}, 
            buttonErrors: {}, 
            laneErrors: {}, 
            laneFlashes: {}, 
            placedAt: {}, 
            ghosts: [], 
            floaters: [],
            particles: [] // ★新規追加: 煙エフェクト用配列
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
        P1: "#3c96ff", P2: "#ff5078", NEUTRAL: "#333", PANEL_BG: "#242430", 
        OVERLAY_BG: "rgba(0, 0, 0, 0.8)", // 少し濃くして視認性を向上
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

const VISUAL_STATES = {
    RAW: { meat: "#e57373", negi: "#e8f5e9", dot: "#fff" },
    OKAY: { meat: "#c07040", negi: "#c8e6c9", dot: "#f90" },
    PERFECT: { meat: "#793910", negi: "#81c784", dot: "#ff4" },
    BURNT: { meat: "#2a1a12", negi: "#1a251a", dot: "#f33" }
};

const ICON_PALETTE = {
    1: "#ffffff", 2: "#d95763", 3: "#8c3f5d", 4: "#df7126", 5: "#fbf236", 
    6: "#5fcde4", 7: "#8f563b", 8: "#ac3232", 9: "#e8ede7", 10: "#99e550", 11: "#ffcc66"
};

// 1262行版の完全なドット絵データ
const ICON_DATA = {
    meat: [
        0,0,0,0,0,0,0,0, 0,0,2,2,2,2,0,0, 0,2,3,2,2,2,2,0, 1,3,3,3,2,2,2,1,
        1,3,3,3,2,2,2,1, 0,2,3,2,2,2,2,0, 0,0,2,2,2,2,0,0, 0,0,0,0,0,0,0,0
    ],
    put: [
        0,0,0,10,10,0,0,0, 0,0,0,10,10,0,0,0, 0,0,0,10,10,0,0,0, 0,0,0,10,10,0,0,0,
        10,10,10,10,10,10,10,10, 0,10,10,10,10,10,10,0, 0,0,10,10,10,10,0,0, 0,0,0,10,10,0,0,0
    ],
    serve: [
        0,0,0,11,11,0,0,0, 0,0,11,11,11,11,0,0, 0,11,11,11,11,11,11,0, 11,11,11,11,11,11,11,11,
        0,0,0,11,11,0,0,0, 0,0,0,11,11,0,0,0, 0,0,0,11,11,0,0,0, 0,0,0,11,11,0,0,0
    ],
    uchiwa: [
        0,8,8,8,8,8,8,0, 8,8,8,8,8,8,8,8, 8,8,8,8,8,8,8,8, 9,9,9,9,9,9,9,9,
        0,9,9,7,7,9,9,0, 0,0,0,7,7,0,0,0, 0,0,0,7,7,0,0,0, 0,0,0,7,7,0,0,0
    ],
    diamond: [
        0,0,0,1,6,0,0,0, 0,0,1,6,6,6,0,0, 0,1,6,6,6,6,6,0, 1,6,6,6,6,6,6,6,
        0,6,6,6,6,6,6,0, 0,0,6,6,6,6,0,0, 0,0,0,6,6,0,0,0, 0,0,0,0,0,0,0,0
    ],
    fire: [
        0,0,0,4,0,0,0,0, 0,0,4,5,4,0,0,0, 0,4,4,5,4,4,0,0, 0,4,5,5,5,4,0,0,
        4,5,5,5,5,5,4,0, 4,4,5,5,5,4,4,0, 0,4,4,4,4,4,0,0, 0,0,0,0,0,0,0,0
    ]
};
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
    
    state.startRouletteActive = true;
    state.startRouletteTimer = state.startRouletteDuration;
    state.startRouletteIndex = 1;
    state.startRouletteFinalPlayer = null;
}

function nextStage() {
    const nextStg = state.currentStage + 1;
    if (nextStg > 5) return;
    const prevMode = state.gameMode;
    initGameState();
    state.gameMode = prevMode;
    state.screen = "game";
    setupAIForStage(nextStg);
    
    state.startRouletteActive = true;
    state.startRouletteTimer = state.startRouletteDuration;
}

function updateAllScores() {
    state.players.forEach(p => {
        p.score = p.servedScore || 0;
    });
}

function getBaseHeat(type) {
    if (type === "weak") return 1;
    if (type === "medium") return 2;
    if (type === "strong") return 3;
    return 1;
}

// ★新規追加: 煙エフェクト発生
function spawnSmokeEffect(laneIndex, amount) {
    const b = getLaneBounds(laneIndex);
    const laneCx = b.x + b.w / 2;
    const stickTop = b.y + b.h * 0.1;
    const meatY = stickTop + (b.h * 0.7) * 0.4;
    const numParticles = 8 + amount * 4; 
    
    for (let i = 0; i < numParticles; i++) {
        state.visuals.particles.push({
            x: laneCx + (Math.random() - 0.5) * 40,
            y: meatY + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -1.2 - Math.random() * 2.5,
            life: 0,
            maxLife: 40 + Math.random() * 40,
            size: 10 + Math.random() * 15
        });
    }
}

function advanceAllSkewersAtRoundEnd() {
    state.lanes.forEach((n, idx) => {
        if (n.built) {
            if (n.justPlaced) {
                n.justPlaced = false;
            } else {
                const baseHeat = getBaseHeat(n.type);
                const boost = n.uchiwaBoost || 0;
                const prevCookState = n.cookState;
                n.cookState = Math.min(8, n.cookState + baseHeat + boost);
                
                // 実際に焼けた場合のみ煙を出す
                if (n.cookState > prevCookState) {
                    spawnSmokeEffect(idx, n.cookState - prevCookState);
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

// ★演出のリズムを保つためのスイッチターン
function switchTurn() {
    state.isBusy = true; // ポップアップ演出中の誤操作防止

    // ポップアップが消えるのを待ってから次へ
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
        state.isBusy = false;
    }, 850);
}

function startNewRound() {
    state.round++;
    state.players.forEach(p => p.workersRemaining = 1);
    state.buildMode = null;
    state.pendingBox = null;
    state.currentPlayer = state.firstPlayer;
    state.pendingPlayer = state.firstPlayer;
    state.pendingTurnSplash = true;
}

function updateRoulette() {
    if (!state.startRouletteActive) return;
    state.startRouletteTimer--;
    if (state.startRouletteTimer % 5 === 0) {
        state.startRouletteIndex = 3 - state.startRouletteIndex;
    }
    if (state.startRouletteTimer <= 0) {
        state.startRouletteActive = false;
        state.startRouletteFinalPlayer = Math.random() < 0.5 ? 1 : 2;
        state.firstPlayer = state.startRouletteFinalPlayer;
        state.currentPlayer = state.firstPlayer;
        state.pendingPlayer = state.firstPlayer;
        state.pendingTurnSplash = true;
    }
}

function tryEndRound() {
    advanceAllSkewersAtRoundEnd();
    
    // 焼き処理(煙)が終わるのを少し待ってから判定
    setTimeout(() => {
        if (state.round >= state.maxRounds) {
            state.gameOver = true;
            updateAllScores();
            const p1 = state.players[0].score;
            const p2 = state.players[1].score;
            
            if (p1 > p2) {
                if (state.gameMode === "ai") {
                    state.screen = (state.currentStage >= 5) ? "clear" : "stage_clear";
                    state.winnerText = (state.currentStage >= 5) ? "SURVIVAL CLEAR" : "STAGE CLEAR";
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
    }, 600);
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
// 4. game/rules.js - 調理ルール
// ==========================================
function getCookLabel(laneType, cv) {
    const limit = (laneType === "weak") ? 8 : 7;
    if (cv >= limit) return "burnt";
    if (cv >= 6) return "perfect";
    if (cv === 5) return "okay";
    return "early";
}

function canUseMeat(playerIndex) { return true; }
function canUseSkewer(playerIndex) {
    return state.players[playerIndex - 1].resources >= 1 && state.lanes.some(l => !l.built);
}
function canUseServe(playerIndex) {
    const p = state.players[playerIndex - 1];
    return state.lanes.some(n => {
        if (!n.built) return false;
        const status = getCookLabel(n.type, n.cookState);
        return status === "burnt" || n.owner === playerIndex || (p.resources >= 1 && status !== "early");
    });
}

function placeWorker(boxId) {
    const p = state.players[state.currentPlayer - 1];
    if (boxId === 1) {
        p.resources += 1;
        state.visuals.floaters.push({ type: 'meat_up', targetType: state.currentPlayer === 1 ? 'p1' : 'p2', startTime: performance.now() });
        consumeWorker();
    } else if (boxId === 2 && p.resources >= 1) {
        state.buildMode = "sapling";
    } else if (boxId === 3) {
        state.buildMode = "harvest";
    } else if (boxId === 4) {
        state.buildMode = "uchiwa";
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
    state.visuals.floaters.push({ type: 'star_up', amount: scoreGained, targetType: 'lane', targetIndex: state.lanes.indexOf(node), color: scoreGained > 0 ? (status==="perfect"?"#ff4":"#f90") : "#f33", startTime: performance.now() });
    state.visuals.ghosts.push({ laneIndex: state.lanes.indexOf(node), status: status.toUpperCase(), startTime: performance.now() });

    node.built = false; node.owner = null; node.cookState = 0;
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
    if (mode === "harvest") return node.built && (node.owner === state.currentPlayer || getCookLabel(node.type, node.cookState) !== "early");
    if (mode === "uchiwa") return node.built;
    return false;
}

// ==========================================
// 6. game/ai.js - AIロジック
// ==========================================
// (※元の1262行版の高度な性格分岐をここに復元)
const AI_LEVEL_CONFIG = {
    1: { rand: 0.40, mistake: 0.30, scoreNoise: 10, closeThresh: 8, closeRate: 0.35 },
    2: { rand: 0.20, mistake: 0.15, scoreNoise: 6,  closeThresh: 6, closeRate: 0.25 },
    3: { rand: 0.10, mistake: 0.05, scoreNoise: 3,  closeThresh: 5, closeRate: 0.20 },
    4: { rand: 0.03, mistake: 0.01, scoreNoise: 1.5, closeThresh: 4, closeRate: 0.10 },
    5: { rand: 0.15, mistake: 0.20, scoreNoise: 4,  closeThresh: 6, closeRate: 0.25 }
};

function scoreAIAction(action, playerIndex, profile) {
    let score = 0;
    const p = state.players[playerIndex - 1];
    const node = action.nodeId ? state.lanes.find(l => l.id === action.nodeId) : null;

    if (action.type === "meat") score = p.resources === 0 ? 20 : p.resources === 1 ? 5 : -10;
    else if (action.type === "put") {
        score = 15;
        if (profile === "gambler" && node.type === "strong") score += 30;
    } else if (action.type === "serve") {
        const lbl = getCookLabel(node.type, node.cookState);
        if (lbl === "perfect") score = 100;
        else if (lbl === "okay") score = 40;
        else if (lbl === "burnt") score = 10;
    } else if (action.type === "uchiwa") {
        const nextState = node.cookState + getBaseHeat(node.type) + 1;
        if (getCookLabel(node.type, nextState) === "perfect") score = 80;
    }
    return score;
}

function playAITurn() {
    if (state.startRouletteActive || !isAIPlayer(state.currentPlayer) || isInputLocked()) return;
    if (state.isAIThinking) return;

    state.isAIThinking = true;
    setTimeout(() => {
        try {
            const conf = AI_LEVEL_CONFIG[state.aiLevel] || AI_LEVEL_CONFIG[2];
            let cands = [{type: "meat"}];
            state.lanes.forEach(l => {
                if (!l.built && state.players[1].resources >= 1) cands.push({type: "put", nodeId: l.id});
                if (l.built) {
                    if (getCookLabel(l.type, l.cookState) !== "early") cands.push({type: "serve", nodeId: l.id});
                    cands.push({type: "uchiwa", nodeId: l.id});
                }
            });

            let scored = cands.map(a => ({ action: a, score: scoreAIAction(a, 2, state.aiProfile) + (Math.random() - 0.5) * conf.scoreNoise }));
            scored.sort((a, b) => b.score - a.score);
            let best = scored[0].action;

            if (best.type === "meat") placeWorker(1);
            else if (best.type === "put") { state.buildMode="sapling"; tryBuildNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "serve") { state.buildMode="harvest"; tryHarvestNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "uchiwa") { state.buildMode="uchiwa"; tryUchiwaNode(state.lanes.find(l=>l.id===best.nodeId)); }
        } finally {
            state.isAIThinking = false;
        }
    }, 1000);
}
// ==========================================
// 7. render/render.js - 描画処理
// ==========================================
const getTime = () => performance.now();

// ★フェード透明度計算 (Part 2の演出タイマーと連動)
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(x, y, w, h);
    } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y, 4, h);
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(x, y + h - 6, w, 6); ctx.fillRect(x + w - 4, y, 4, h);
    }
}

function drawDeliciousYakitori(ctx, x, y, w, h, baseColor, isNegi) {
    ctx.fillStyle = baseColor;
    if (isNegi) {
        const nx = x + 4; const nw = w - 8;
        ctx.fillRect(nx, y, nw, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fillRect(nx + 2, y + 2, nw - 4, 4);
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(nx, y + h - 6, nw, 6);
    } else {
        ctx.fillRect(x + 4, y, w - 8, h); ctx.fillRect(x, y + 4, w, h - 8);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fillRect(x + 6, y + 4, w - 16, 4);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x + 4, y + h - 8, w - 8, 8);
    }
}

function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId]; if (!data) return;
    const isDisabled = (color === "#888"); 
    for (let i = 0; i < 64; i++) {
        const val = data[i];
        if (val !== 0) {
            ctx.fillStyle = isDisabled ? "#888" : (ICON_PALETTE[val] || color);
            ctx.fillRect(cx - (4 * scale) + (i % 8) * scale, cy - (4 * scale) + Math.floor(i / 8) * scale, scale, scale);
        }
    }
}

function render(ctx) {
    const now = getTime();
    // 有効期限切れの演出を削除
    state.visuals.ghosts = state.visuals.ghosts.filter(g => now - g.startTime < 1000);
    state.visuals.floaters = state.visuals.floaters.filter(f => now - f.startTime < 800);

    ctx.fillStyle = LAYOUT.COLORS.BG;
    ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2;

    if (state.screen === "title") {
        ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN; ctx.font = "bold 32px monospace"; ctx.textAlign = "center";
        ctx.fillText("YAKITORI WARS", cx, cy - 80);
        drawBevelRect(ctx, cx - 120, cy - 30, 240, 60, "#3c96ff");
        ctx.fillStyle = "#fff"; ctx.font = "20px monospace"; ctx.fillText("VS AI (SURVIVAL)", cx, cy + 6);
        drawBevelRect(ctx, cx - 120, cy + 50, 240, 60, "#ff5078");
        ctx.fillStyle = "#fff"; ctx.fillText("VS PLAYER", cx, cy + 86);
    } else if (state.screen === "game") {
        drawGameScreen(ctx);
    } else {
        ctx.fillStyle = "#fff"; ctx.font = "bold 36px monospace"; ctx.textAlign = "center";
        ctx.fillText(state.winnerText, cx, cy);
        ctx.font = "16px monospace"; ctx.fillText("Tap to Continue", cx, cy + 80);
    }
}

function drawGameScreen(ctx) {
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2;
    const activePlayer = state.startRouletteActive ? state.startRouletteIndex : (state.pendingPlayer || state.currentPlayer);

    drawPlayerPanel(ctx, state.players[0], 10, 15, Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25), 75, 1, activePlayer);
    drawPlayerPanel(ctx, state.players[1], LAYOUT.CANVAS_WIDTH - Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25) - 10, 15, Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25), 75, 2, activePlayer);

    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
    ctx.fillText(`ROUND ${state.round}`, cx, 40);

    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i);
        drawBevelRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, "#3a3a45");
        ctx.fillStyle = "#0a0a0f"; ctx.fillRect(b.x, b.y, b.w, b.h);

        // 鉄格子
        ctx.strokeStyle = "#555"; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 1; j <= 5; j++) { ctx.moveTo(b.x, b.y + (b.h * j / 6)); ctx.lineTo(b.x + b.w, b.y + (b.h * j / 6)); }
        ctx.stroke();

        const laneCx = b.x + b.w/2;
        if (lane.built) {
            const status = getCookLabel(lane.type, lane.cookState);
            const p = getVisualPalette(status.toUpperCase());
            const stickH = b.h * 0.7; const stickTop = b.y + b.h * 0.1;
            ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx - 2, stickTop, 4, stickH);
            
            const meatW = b.w * 0.6; const meatH = stickH * 0.2; const meatX = laneCx - meatW/2;
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false);

            // LEDドット
            const cv = Math.min(lane.cookState, 6);
            for (let j = 0; j < 6; j++) {
                ctx.fillStyle = (j < cv) ? p.dot : "#111";
                ctx.fillRect(laneCx - 22 + (j % 3) * 16, stickTop + stickH + 15 + Math.floor(j / 3) * 12, 12, 10);
            }
        }
        // 火力
        for (let f = 0; f < lane.fire; f++) {
            drawDotIcon(ctx, "fire", laneCx - ((lane.fire-1)*12) + f*24, b.y + b.h + 22, "#fa3", 2.5);
        }
    });

    // ★煙パーティクルの更新と描画
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
        drawBevelRect(ctx, cb.x, cb.y, cb.w, cb.h, "#a33");
        ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign="center";
        ctx.fillText("CANCEL", cb.x + cb.w/2, cb.y + cb.h/2 + 6);
    } else {
        LAYOUT.BUTTONS.forEach((btn, i) => {
            const b = getButtonBounds(i);
            const isLocked = isInputLocked();
            drawBevelRect(ctx, b.x, b.y, b.w, b.h, isLocked ? "#445" : btn.color);
            drawDotIcon(ctx, btn.icon, b.x + b.w/2, b.y + b.h/2, isLocked ? "#888" : "#fff", 4);
        });
    }

    // ★中央帯によるフェード演出 (ルーレット & ターンスプラッシュ)
    if (state.startRouletteActive) {
        ctx.globalAlpha = getFadeAlpha(state.startRouletteTimer, state.startRouletteDuration, 15);
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, cy - 60, LAYOUT.CANVAS_WIDTH, 120);
        ctx.fillStyle = state.startRouletteIndex === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 48px monospace"; ctx.fillText(`P${state.startRouletteIndex}`, cx, cy + 20);
        ctx.fillStyle = "#fff"; ctx.font = "20px monospace"; ctx.fillText("WHO GOES FIRST?", cx, cy - 30);
        ctx.globalAlpha = 1.0;
    } else if (state.turnSplashTimer > 0) {
        ctx.globalAlpha = getFadeAlpha(state.turnSplashTimer, 45, 10);
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, cy - 40, LAYOUT.CANVAS_WIDTH, 80);
        ctx.fillStyle = activePlayer === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 32px monospace"; ctx.fillText(`P${activePlayer} TURN`, cx, cy + 10);
        ctx.globalAlpha = 1.0;
    }

    // ポップアップ数字
    const now = getTime();
    state.visuals.floaters.forEach(f => {
        const elapsed = now - f.startTime; const progress = Math.min(1, elapsed / 800);
        ctx.globalAlpha = 1 - progress; ctx.fillStyle = f.color || "#fff"; ctx.font = "bold 28px monospace";
        const fx = f.targetType === 'lane' ? getLaneBounds(f.targetIndex).x + 45 : LAYOUT.CANVAS_WIDTH/2;
        const fy = f.targetType === 'lane' ? getLaneBounds(f.targetIndex).y - 10 : cy - 100;
        ctx.fillText(f.type.includes("meat") ? (f.type.includes("up")?"+1 肉":"-1 肉") : `${f.amount >= 0 ? "+":""}${f.amount}`, fx, fy - progress*50);
    });
    ctx.globalAlpha = 1.0;
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx, activePlayer) {
    const active = activePlayer === idx;
    drawBevelRect(ctx, x, y, w, h, active ? (idx === 1 ? "#2a4a6a" : "#6a2a3a") : LAYOUT.COLORS.PANEL_BG);
    ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.fillText(`P${idx}`, x + 10, y + 25);
    ctx.fillStyle = "#fff"; ctx.textAlign = "right"; ctx.fillText(`${player.score}`, x + w - 10, y + 50); ctx.fillText(`${player.resources}`, x + w - 10, y + 70);
    drawDotIcon(ctx, "diamond", x + 20, y + 45, "#6cf", 2); drawDotIcon(ctx, "meat", x + 20, y + 65, "#f77", 2);
}

// ==========================================
// 8. main.js - エントリポイント
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game"); if (!canvas) return;
    const ctx = canvas.getContext("2d");
    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const vw = window.innerWidth; const vh = window.innerHeight;
        LAYOUT.CANVAS_WIDTH = vw; LAYOUT.CANVAS_HEIGHT = vh;
        canvas.width = vw * dpr; canvas.height = vh * dpr;
        canvas.style.width = vw + "px"; canvas.style.height = vh + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize); resize();
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); handleCanvasClick(e.touches[0], canvas); }, { passive: false });
    canvas.addEventListener("click", (e) => handleCanvasClick(e, canvas));
    function loop() {
        updateRoulette(); resolvePendingTurnFlow(); render(ctx); playAITurn();
        requestAnimationFrame(loop);
    }
    loop();
});
