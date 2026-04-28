// # main.js - YAKITORI WARS: Board Game Style Update (完全版)
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
        isBusy: false,
        isAIThinking: false,
        
        // --- プレビュー演出用ステート ---
        cookPreviewActive: false,
        cookPreviewEvents: [],
        cookPreviewIndex: 0,
        cookPreviewPhase: null,
        cookPreviewPhaseTimer: 0,
        
        startRouletteActive: false,
        startRouletteInterval: 4,     
        startRouletteTickTimer: 4,    
        startRouletteCount: 0,        
        startRouletteMaxCount: 16,    
        startRouletteIndex: 1,
        startRouletteFinalPlayer: null,
        
        startRouletteBlinkActive: false,
        startRouletteBlinkTimer: 0,
        startRouletteBlinkCount: 0,
        
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
            buttonClicks: {}, buttonErrors: {}, laneErrors: {}, laneFlashes: {}, placedAt: {}, 
            peakFlashes: {}, 
            ghosts: [], 
            floaters: [],
            statusMessages: [], 
            particles: [], 
            cancelClick: 0, 
            titleClick: null
        }
    };
}
initGameState();

// ==========================================
// 画像リソースの読み込み
// ==========================================
let logoImage = new Image();
logoImage.src = "Logo.png";

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
        { id: "meat",    color: "#5a7a5a", icon: "meat",         label: "肉" },       
        { id: "put",     color: "#4a6fa5", icon: "put_skewer",   label: "置く" },     
        { id: "harvest", color: "#a57a4a", icon: "serve_plate",  label: "取る/捨" },  
        { id: "uchiwa",  color: "#8a4a6f", icon: "uchiwa",       label: "うちわ" }    
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

const ICON_DATA = {
    meat: [0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,2,3,2,2,2,2,0,1,3,3,3,2,2,2,1,1,3,3,3,2,2,2,1,0,2,3,2,2,2,2,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0],
    uchiwa: [0,8,8,8,8,8,0,6,8,8,8,8,8,8,8,0,8,8,8,8,8,8,8,6,8,8,9,9,9,8,8,0,0,8,9,7,9,8,0,0,0,0,0,7,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,7,0,0,0,0],
    diamond: [0,0,0,1,6,0,0,0,0,0,1,6,6,6,0,0,0,1,6,6,6,6,6,0,1,6,6,6,6,6,6,6,0,6,6,6,6,6,6,0,0,0,6,6,6,6,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0],
    fire: [0,0,0,4,0,0,0,0,0,0,4,5,4,0,0,0,0,4,4,5,4,4,0,0,0,4,5,5,5,4,0,0,4,5,5,5,5,5,4,0,4,4,5,5,5,4,4,0,0,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0],
    put_skewer: [ 0,0,11,0,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,11,0,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0],
    serve_plate:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,10,7,7,0,0,11,7,7,10,7,7,11,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0],
    clock: [0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,1,0,1,0,0,1,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    warning: [0,0,0,8,8,0,0,0,0,0,8,11,11,8,0,0,0,0,8,11,11,8,0,0,0,0,8,11,11,8,0,0,0,0,8,11,11,8,0,0,0,0,0,8,8,0,0,0,0,0,8,11,11,8,0,0,0,0,0,8,8,0,0,0],
    trash: [0,0,0,0,0,0,0,0,0,8,8,0,0,8,8,0,0,0,8,8,8,8,0,0,0,0,0,8,8,0,0,0,0,0,8,8,8,8,0,0,0,8,8,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    up_arrow: [0,0,0,1,1,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    cross: [ 0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0]
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
    const positionMap = [0, 1, 3, 2];
    const displayIndex = positionMap[index];
    const col = displayIndex % 2;
    const row = Math.floor(displayIndex / 2);
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

const getTime = () => performance.now();

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
    state.startRouletteInterval = 4;
    state.startRouletteTickTimer = 4;
    state.startRouletteCount = 0;
    state.startRouletteIndex = 1;
    state.startRouletteMaxCount = 15 + Math.floor(Math.random() * 2); 
    state.startRouletteBlinkActive = false;
    state.startRouletteFinalPlayer = null;
}

function retryStage() {
    const stg = state.currentStage;
    const prevMode = state.gameMode;
    initGameState();
    state.gameMode = prevMode;
    state.screen = "game";
    setupAIForStage(stg);
    state.startRouletteActive = true;
    state.startRouletteInterval = 4;
    state.startRouletteTickTimer = 4;
    state.startRouletteCount = 0;
    state.startRouletteIndex = 1;
    state.startRouletteMaxCount = 15 + Math.floor(Math.random() * 2);
    state.startRouletteBlinkActive = false;
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
    state.startRouletteInterval = 4;
    state.startRouletteTickTimer = 4;
    state.startRouletteCount = 0;
    state.startRouletteIndex = 1;
    state.startRouletteMaxCount = 15 + Math.floor(Math.random() * 2); 
    state.startRouletteBlinkActive = false;
    state.startRouletteFinalPlayer = null;
}

function updateAllScores() {
    state.players.forEach(p => p.score = p.servedScore || 0);
}

function getBaseHeat(type) {
    if (type === "weak") return 1;
    if (type === "medium") return 2;
    if (type === "strong") return 3;
    return 1;
}

// 煙エフェクト発生(イベント用・状態に応じた色と量)
function spawnSmokeEffect(laneIndex, amount, status) {
    const b = getLaneBounds(laneIndex);
    const laneCx = b.x + b.w / 2;
    const stickTop = b.y + b.h * 0.1;
    const meatY = stickTop + (b.h * 0.7) * 0.4;
    
    let numParticles = 0;
    let color = "#e0e0e0";

    if (status === "burnt") {
        numParticles = 15 + amount * 3; // 焦げ:多め
        color = "#2a2a2a";              // 焦げ:黒煙
    } else if (status === "perfect") {
        numParticles = 6;               // パーフェクト:少なめ
        color = "#ffffff";              // パーフェクト:白煙
    } else {
        numParticles = 4 + amount;      // 通常:最小限
        color = "#888888";              // 通常:グレー
    }

    for (let i = 0; i < numParticles; i++) {
        state.visuals.particles.push({
            x: laneCx + (Math.random() - 0.5) * 40, 
            y: meatY + (Math.random() - 0.5) * 20,  
            vx: (Math.random() - 0.5) * 1.5, 
            vy: -1 - Math.random() * 2,             
            life: 0, 
            maxLife: 20 + Math.random() * 15, // 短時間で消える
            size: 10 + Math.random() * 15,
            color: color
        });
    }
}

function advanceAllSkewersAtRoundEnd() {
    state.cookPreviewEvents = [];
    state.lanes.forEach((n, index) => {
        if (n.built) {
            if (n.justPlaced) n.justPlaced = false;
            else {
                const baseHeat = getBaseHeat(n.type);
                const boost = n.uchiwaBoost || 0;
                const prevCookState = n.cookState; 
                const prevStatus = getCookLabel(n.type, prevCookState);
                
                n.cookState = Math.min(8, n.cookState + baseHeat + boost);
                const newStatus = getCookLabel(n.type, n.cookState);
                
                // 変化があった場合のみイベント記録
                if (n.cookState > prevCookState) {
                    state.cookPreviewEvents.push({
                        laneIndex: index, prevCookState: prevCookState,
                        newCookState: n.cookState, prevStatus: prevStatus, newStatus: newStatus
                    });
                }
            }
        }
        n.uchiwaBoost = 0;
    });
}

function updateCookPreview() {
    if (state.cookPreviewActive) {
        // レーン演出の開始時(1フレーム目)にエフェクトを1回だけ発火
        if (state.cookPreviewPhase === "show" && state.cookPreviewPhaseTimer === 60) {
            const event = state.cookPreviewEvents[state.cookPreviewIndex];
            if (event) {
                let smokeAmount = event.newCookState - event.prevCookState;
                spawnSmokeEffect(event.laneIndex, smokeAmount, event.newStatus); 
                
                if (event.prevStatus !== "perfect" && event.newStatus === "perfect") {
                    state.visuals.peakFlashes[state.lanes[event.laneIndex].id] = performance.now();
                }
            }
        }

        state.cookPreviewPhaseTimer--;

        if (state.cookPreviewPhaseTimer <= 0) {
            state.cookPreviewIndex++;
            if (state.cookPreviewIndex >= state.cookPreviewEvents.length) {
                finishEndRound();
            } else {
                state.cookPreviewPhase = "show";
                state.cookPreviewPhaseTimer = 60; 
            }
        }
    }
}

function tryEndRound() {
    advanceAllSkewersAtRoundEnd();
    if (state.cookPreviewEvents.length > 0) {
        state.cookPreviewActive = true;
        state.cookPreviewIndex = 0;
        state.cookPreviewPhase = "show";
        state.cookPreviewPhaseTimer = 60;
    } else {
        finishEndRound();
    }
}

function finishEndRound() {
    state.cookPreviewActive = false;
    state.cookPreviewEvents = [];
    if (state.round >= state.maxRounds) {
        state.gameOver = true;
        updateAllScores();
        const p1 = state.players[0].score;
        const p2 = state.players[1].score;
        if (p1 > p2) {
            if (state.gameMode === "ai") {
                if (state.currentStage >= 5) { state.screen = "clear"; state.winnerText = "SURVIVAL CLEAR"; }
                else { state.screen = "stage_clear"; state.winnerText = "STAGE CLEAR"; }
            } else { state.screen = "gameover"; state.winnerText = "P1 Wins!"; }
        } else if (p2 > p1) { 
            state.screen = "gameover"; state.winnerText = "P2 Wins!"; 
        } else { 
            if (state.gameMode === "ai") { retryStage(); return; }
            else { state.screen = "gameover"; state.winnerText = "Draw!"; }
        }
        return;
    }
    startNewRound();
}

function isAIPlayer(playerIndex) { return state.gameMode === "ai" && playerIndex === 2; }

function consumeWorker() {
    const p = state.players[state.currentPlayer - 1];
    p.workersRemaining -= 1;
    state.buildMode = null;
    state.pendingBox = null;
    updateAllScores();
    switchTurn();
}

function switchTurn() {
    state.isBusy = true;
    setTimeout(() => {
        const nextP = 3 - state.currentPlayer;
        if (state.players[nextP - 1].workersRemaining > 0) {
            state.pendingPlayer = nextP;
            state.pendingTurnSplash = true; 
            if (isAIPlayer(nextP)) state.pendingAiBreath = true;
        } else if (state.players[state.currentPlayer - 1].workersRemaining <= 0) {
            tryEndRound();
        }
        state.isBusy = false;
    }, 800);
}

function startNewRound() {
    state.round++;
    state.players.forEach(p => p.workersRemaining = 1);
    state.buildMode = null; state.pendingBox = null;
    state.currentPlayer = state.firstPlayer;
    state.pendingPlayer = state.firstPlayer;
    state.pendingTurnSplash = true;
    state.pendingAiBreath = false;
}

function updateRoulette() {
    if (state.startRouletteActive) {
        state.startRouletteTickTimer--;
        if (state.startRouletteTickTimer <= 0) {
            state.startRouletteIndex = 3 - state.startRouletteIndex;
            state.startRouletteCount++;
            state.startRouletteInterval *= 1.15; 
            state.startRouletteTickTimer = Math.floor(state.startRouletteInterval);
            if (state.startRouletteCount >= state.startRouletteMaxCount) {
                state.startRouletteActive = false;
                state.startRouletteBlinkActive = true;
                state.startRouletteBlinkTimer = 6;
                state.startRouletteBlinkCount = 0;
                state.startRouletteFinalPlayer = state.startRouletteIndex;
            }
        }
    } else if (state.startRouletteBlinkActive) {
        state.startRouletteBlinkTimer--;
        if (state.startRouletteBlinkTimer <= 0) {
            state.startRouletteBlinkCount++;
            state.startRouletteBlinkTimer = 6; 
            if (state.startRouletteBlinkCount >= 7) { 
                state.startRouletteBlinkActive = false;
                state.firstPlayer = state.startRouletteFinalPlayer;
                state.currentPlayer = state.startRouletteFinalPlayer;
                state.pendingPlayer = state.startRouletteFinalPlayer;
                state.pendingTurnSplash = true;
            }
        }
    }
}

function resolvePendingTurnFlow() {
    if (state.cookPreviewActive) return; // プレビュー中はターン進行をストップ
    
    if (state.pendingTurnSplash) { state.turnSplashTimer = 45; state.pendingTurnSplash = false; }
    if (state.turnSplashTimer > 0) state.turnSplashTimer--;
    else if (state.pendingPlayer !== null) {
        if (state.pendingAiBreath) { state.aiBreathTimer = 15; state.pendingAiBreath = false; }
        else if (state.aiBreathTimer <= 0) { state.currentPlayer = state.pendingPlayer; state.pendingPlayer = null; }
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

function hasPerfectHarvestTarget(playerIndex) {
    const p = state.players[playerIndex - 1];
    for (let n of state.lanes) {
        if (n.built) {
            const status = getCookLabel(n.type, n.cookState);
            if (status === "perfect" && (n.owner === playerIndex || p.resources >= 1)) return true;
        }
    }
    return false;
}

function brightenColor(hex, ratio) {
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    let r = parseInt(hex.substring(0,2), 16), g = parseInt(hex.substring(2,4), 16), b = parseInt(hex.substring(4,6), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * ratio));
    g = Math.min(255, Math.floor(g + (255 - g) * ratio));
    b = Math.min(255, Math.floor(b + (255 - b) * ratio));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getHarvestScore(node, isSteal, status) {
    if (status === "burnt") return isSteal ? 0 : -2;
    if (status === "early") return -5;
    const heat = getBaseHeat(node.type);
    if (heat === 1) return (status === "perfect") ? 12 : 3;
    if (heat === 3) return (status === "perfect") ? 6 : 2;
    return (status === "perfect") ? 8 : 2;
}

function canUseMeat(playerIndex) { return true; }
function canUseSkewer(playerIndex) { return state.players[playerIndex - 1].resources >= 1 && state.lanes.some(l => !l.built); }
function canUseServe(playerIndex) {
    const p = state.players[playerIndex - 1];
    for (let n of state.lanes) {
        if (n.built) {
            const status = getCookLabel(n.type, n.cookState);
            if (status === "burnt" || n.owner === playerIndex || (p.resources >= 1 && (status === "okay" || status === "perfect"))) return true; 
        }
    }
    return false;
}
function canUseUchiwa(playerIndex) { return state.lanes.some(l => l.built); }

function placeWorker(boxId) {
    const p = state.players[state.currentPlayer - 1];
    if (boxId === 1) { 
        p.resources += 1;
        state.visuals.statusMessages.push({ type: 'meat', amount: 1, player: state.currentPlayer, startTime: performance.now() });
        consumeWorker();
    } else {
        state.isBusy = true;
        setTimeout(() => {
            if (boxId === 2 && p.resources >= 1) { state.buildMode = "sapling"; state.pendingBox = boxId; }
            else if (boxId === 3) { state.buildMode = "harvest"; state.pendingBox = boxId; }
            else if (boxId === 4) { state.buildMode = "uchiwa"; state.pendingBox = boxId; }
            state.isBusy = false;
        }, 150);
    }
}

function tryBuildNode(node) {
    const p = state.players[state.currentPlayer - 1];
    if (p.resources >= 1 && !node.built) {
        p.resources -= 1;
        state.visuals.statusMessages.push({ type: 'meat', amount: -1, player: state.currentPlayer, startTime: performance.now() });
        node.built = true; node.owner = state.currentPlayer; node.cookState = 0; node.justPlaced = true;
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
            state.visuals.statusMessages.push({ type: 'meat', amount: -1, player: state.currentPlayer, startTime: performance.now() });
        }
    }
    const scoreGained = getHarvestScore(node, isSteal, status);
    p.servedScore += scoreGained;
    if (scoreGained !== 0) {
        state.visuals.statusMessages.push({ type: 'score', amount: scoreGained, player: state.currentPlayer, startTime: performance.now() });
    }
    state.visuals.ghosts.push({ 
        laneIndex: state.lanes.indexOf(node), status: status.toUpperCase(), startTime: performance.now(),
        cookState: node.cookState, owner: node.owner          
    });
    node.built = false; node.owner = null; node.cookState = 0; node.justPlaced = false;
    consumeWorker();
}

function tryUchiwaNode(node) {
    if (node.built) { node.uchiwaBoost += 1; consumeWorker(); }
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
    if (state.startRouletteActive || state.startRouletteBlinkActive) return true;
    if (state.cookPreviewActive) return true;
    const cp = state.currentPlayer;
    return state.screen !== "game" || state.isBusy || state.isAIThinking ||
           state.pendingPlayer !== null || state.turnSplashTimer > 0 || 
           state.aiBreathTimer > 0 || state.gameOver ||
           state.players[cp - 1].workersRemaining <= 0 || isAIPlayer(cp); 
}

function handleCanvasClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (state.screen === "title") {
        if (state.isBusy) return;
        const cx = LAYOUT.CANVAS_WIDTH / 2, cy = LAYOUT.CANVAS_HEIGHT / 2, buttonOffsetY = 85; 
        const btnAi = { x: cx - 120, y: cy - 30 + buttonOffsetY, w: 240, h: 60 };
        const btnPvp = { x: cx - 120, y: cy + 50 + buttonOffsetY, w: 240, h: 60 };
        if (x >= btnAi.x && x <= btnAi.x + btnAi.w && y >= btnAi.y && y <= btnAi.y + btnAi.h) {
            state.visuals.titleClick = "ai"; state.isBusy = true;
            setTimeout(() => { startGame("ai"); }, 150);
        } else if (x >= btnPvp.x && x <= btnPvp.x + btnPvp.w && y >= btnPvp.y && y <= btnPvp.y + btnPvp.h) {
            state.visuals.titleClick = "pvp"; state.isBusy = true;
            setTimeout(() => { startGame("pvp"); }, 150);
        }
        return;
    } else if (state.screen === "gameover" || state.screen === "clear") {
        initGameState(); return;
    } else if (state.screen === "stage_clear") {
        nextStage(); return;
    }
    if (isInputLocked()) return;
    if (state.buildMode) {
        const cb = getCancelButtonBounds();
        if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
            state.visuals.cancelClick = performance.now(); state.isBusy = true;
            setTimeout(() => { state.buildMode = null; state.pendingBox = null; state.isBusy = false; }, 150);
            return;
        }
        for (let i = 0; i < state.lanes.length; i++) {
            const l = getLaneBounds(i), padding = 15;
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
            const boxId = i + 1; let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer);
            if (boxId === 2) canUse = canUseSkewer(state.currentPlayer);
            if (boxId === 3) canUse = canUseServe(state.currentPlayer);
            if (boxId === 4) canUse = canUseUchiwa(state.currentPlayer); 
            if (canUse) { state.visuals.buttonClicks[i] = performance.now(); placeWorker(boxId); }
            return;
        }
    }
}

// ==========================================
// 6. game/ai.js - AIロジック
// ==========================================
const AI_LEVEL_CONFIG = {
    1: { rand: 0.40, mistake: 0.30, futWt: 0.10, allowUchiwa: false, topCandRange: 3, scoreNoise: 10, closeThresh: 8, closeRate: 0.35 },
    2: { rand: 0.20, mistake: 0.15, futWt: 0.20, allowUchiwa: true,  topCandRange: 3, scoreNoise: 6,  closeThresh: 6, closeRate: 0.25 },
    3: { rand: 0.10, mistake: 0.05, futWt: 0.30, allowUchiwa: true,  topCandRange: 2, scoreNoise: 3,  closeThresh: 5, closeRate: 0.20 },
    4: { rand: 0.03, mistake: 0.01, futWt: 0.50, allowUchiwa: true,  topCandRange: 2, scoreNoise: 1.5, closeThresh: 4, closeRate: 0.10 },
    5: { rand: 0.15, mistake: 0.20, futWt: 0.40, allowUchiwa: true,  topCandRange: 3, scoreNoise: 4,  closeThresh: 6, closeRate: 0.25 }
};

function buildActionCandidates(currentState, playerIndex) {
    const actions = []; const p = currentState.players[playerIndex - 1];
    actions.push({ type: "meat" });
    if (p.resources >= 1) { currentState.lanes.forEach(n => { if (!n.built) actions.push({ type: "put", nodeId: n.id }); }); }
    currentState.lanes.forEach(n => { if (n.built) { actions.push({ type: "serve", nodeId: n.id }); actions.push({ type: "uchiwa", nodeId: n.id }); } });
    return actions;
}

function isActionValidForAI(currentState, action, playerIndex, profileName, levelConf) {
    const p = currentState.players[playerIndex - 1];
    const node = currentState.lanes.find(l => l.id === action.nodeId);
    if (action.type === "meat" && p.resources >= 2) return false;
    if (action.type === "put") return true;
    if (action.type === "serve") {
        if (!node) return false;
        const isOwn = node.owner === playerIndex, lbl = getCookLabel(node.type, node.cookState);
        if (isOwn) { if (lbl === "early") return false; } 
        else { if (lbl === "early") return false; if (lbl !== "burnt" && p.resources < 1) return false; }
        return true;
    }
    if (action.type === "uchiwa") {
        if (!levelConf.allowUchiwa || !node || !node.built) return false;
        const isOwn = node.owner === playerIndex, cv = node.cookState, heat = getBaseHeat(node.type);
        const boosted_lbl = getCookLabel(node.type, cv + heat + 1), curr_lbl = getCookLabel(node.type, cv);
        if (isOwn) { if (boosted_lbl === "burnt") return false; if (curr_lbl === "perfect") return false; if (boosted_lbl === "early" && profileName !== "reader") return false; }
        else { if (boosted_lbl === "burnt" && curr_lbl !== "burnt") return true; if (profileName === "thief" && (boosted_lbl==="okay"||boosted_lbl==="perfect") && curr_lbl==="early") return true; return false; }
        return true;
    }
    return true;
}

function scoreAIAction(currentState, action, playerIndex, profileName) {
    let score = 0; const p = currentState.players[playerIndex - 1];
    const node = currentState.lanes.find(l => l.id === action.nodeId);
    if (action.type === "meat") { if (p.resources === 0) score += 15; else if (p.resources === 1) score -= 1; else score -= 15; }
    else if (action.type === "put") { score += 10; if (profileName === "gambler" && node.type === "strong") score += 40; if (profileName === "master" && node.type === "weak") score += 15; }
    else if (action.type === "serve") {
        const lbl = getCookLabel(node.type, node.cookState), isOwn = node.owner === playerIndex;
        if (lbl === "burnt") { score += 25; if (profileName === "master") score += 20; if (profileName === "gambler") score -= 10; }
        else if (!isOwn) { if (lbl === "perfect") score += (profileName === "thief" ? 80 : 30); if (lbl === "okay") score += (profileName === "thief" ? 50 : 10); }
        else { if (lbl === "perfect") score += 100; if (lbl === "okay") score += (profileName === "gambler" ? 45 : 15); }
    } else if (action.type === "uchiwa") {
        const isOwn = node.owner === playerIndex, boosted_lbl = getCookLabel(node.type, node.cookState + getBaseHeat(node.type) + 1);
        if (isOwn) { if (boosted_lbl === "perfect") score += 75; if (boosted_lbl === "okay") score += 15; }
        else { if (boosted_lbl === "burnt") score += 85; }
    }
    return score;
}

function playAITurn() {
    if (!isAIPlayer(state.currentPlayer)) return;
    if (state.screen !== "game" || state.isBusy || state.isAIThinking || state.gameOver) return;
    if (state.pendingPlayer !== null || state.turnSplashTimer > 0 || state.aiBreathTimer > 0 || state.cookPreviewActive) return;
    if (state.startRouletteActive || state.startRouletteBlinkActive) return;
    if (state.players[state.currentPlayer - 1].workersRemaining <= 0) return;
    state.isAIThinking = true;
    setTimeout(() => {
        try {
            const levelConf = AI_LEVEL_CONFIG[state.aiLevel] || AI_LEVEL_CONFIG[2], profile = state.aiProfile;
            let cands = buildActionCandidates(state, state.currentPlayer).filter(a => isActionValidForAI(state, a, state.currentPlayer, profile, levelConf));
            if (cands.length === 0) cands.push({ type: "meat" });
            let scored = cands.map(a => ({ action: a, score: scoreAIAction(state, a, state.currentPlayer, profile) + (Math.random() * 2 - 1) * levelConf.scoreNoise }));
            scored.sort((a, b) => b.score - a.score); let best = scored[0].action;
            if (scored.length > 1) {
                if (Math.random() < levelConf.mistake) { let pool = scored.filter((s, i) => i >= 1 && i <= 2 && (scored[0].score - s.score) <= 15); if (pool.length > 0) best = pool[Math.floor(Math.random() * pool.length)].action; }
                else if (Math.random() < levelConf.rand) { let pool = scored.slice(0, levelConf.topCandRange).filter(s => (scored[0].score - s.score) <= 12); if (pool.length > 1) best = pool[Math.floor(Math.random() * pool.length)].action; }
                else { let second = scored[1]; if ((scored[0].score - second.score) <= levelConf.closeThresh && Math.random() < levelConf.closeRate) best = second.action; }
            }
            if (best.type === "meat") placeWorker(1);
            else if (best.type === "put") { state.buildMode="sapling"; tryBuildNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "serve") { state.buildMode="harvest"; tryHarvestNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "uchiwa") { state.buildMode="uchiwa"; tryUchiwaNode(state.lanes.find(l=>l.id===best.nodeId)); }
        } finally { state.isAIThinking = false; }
    }, 450);
}

// ==========================================
// 7. render/render.js - 描画処理
// ==========================================
function getFadeAlpha(currentTimer, maxTimer, fadeFrames = 10) {
    if (currentTimer > maxTimer - fadeFrames) return Math.max(0, (maxTimer - currentTimer) / fadeFrames);
    if (currentTimer < fadeFrames) return Math.max(0, currentTimer / fadeFrames);
    return 1.0; 
}

function drawBevelRect(ctx, x, y, w, h, baseColor, isPressed = false) {
    ctx.fillStyle = baseColor; ctx.fillRect(x, y, w, h);
    if (isPressed) { ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(x, y, w, 6); ctx.fillRect(x, y, 6, h); }
    else { ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y, 4, h); ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(x, y + h - 6, w, 6); ctx.fillRect(x + w - 4, y, 4, h); }
}

function drawTitleButton(ctx, x, y, w, h, label, accentColor, isPressed = false) {
    ctx.fillStyle = isPressed ? "#151212" : "#201818"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accentColor; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    if (isPressed) { ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y, 4, h); }
    else { ctx.fillStyle = "rgba(255, 255, 255, 0.05)"; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y, 3, h); ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x, y + h - 4, w, 4); ctx.fillRect(x + w - 3, y, 3, h); }
    const offset = isPressed ? 2 : 0; ctx.fillStyle = "#f4e6d0"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.fillText(label, x + w / 2, y + h / 2 + 6 + offset);
}

function drawDeliciousYakitori(ctx, x, y, w, h, baseColor, isNegi, dangerOverlay = false) {
    ctx.fillStyle = baseColor;
    if (isNegi) { const nx = x + 4; const nw = w - 8; ctx.fillRect(nx, y, nw, h); ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fillRect(nx + 2, y + 2, nw - 4, 4); ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(nx, y + h - 6, nw, 6); ctx.fillRect(nx + nw - 4, y, 4, h); }
    else { ctx.fillRect(x + 4, y, w - 8, h); ctx.fillRect(x, y + 4, w, h - 8); ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fillRect(x + 6, y + 4, w - 16, 4); ctx.fillRect(x + 4, y + 8, 4, 6); ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x + 4, y + h - 8, w - 8, 8); ctx.fillRect(x + w - 6, y + 6, 4, h - 14); }
    if (dangerOverlay) { ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; ctx.fillRect(x + 4, y + h - 6, w - 8, 6); ctx.fillRect(x + w - 8, y + 4, 4, h - 8); }
}

function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId]; if (!data) return;
    const isDisabled = (color === "#888"); 
    for (let i = 0; i < 64; i++) {
        const val = data[i]; if (val !== 0) { ctx.fillStyle = isDisabled ? "#888" : (ICON_PALETTE[val] || color); ctx.fillRect(cx - (4 * scale) + (i % 8) * scale, cy - (4 * scale) + Math.floor(i / 8) * scale, scale, scale); }
    }
}

function getBuildModeIcon(mode) { if (mode === "sapling") return "put_skewer"; if (mode === "harvest") return "serve_plate"; if (mode === "uchiwa") return "uchiwa"; return null; }

function drawLaneHint(ctx, lane, laneIndex, mode, activePlayer, pResources) {
    if (!lane.built || !mode) return;
    const b = getLaneBounds(laneIndex); 
    const laneCx = b.x + b.w / 2;
    const hintY = b.y - 18; 
    
    const status = getCookLabel(lane.type, lane.cookState);
    const isOwn = lane.owner === activePlayer;
    const canSteal = !isOwn && status !== "early" && status !== "burnt" && pResources >= 1;

    if (mode === "harvest") {
        if (status === "early") {
            drawDotIcon(ctx, "cross", laneCx, hintY, "#cc7777", 1.6);
        } else if (status === "burnt") {
            if (isOwn) {
                // 自分の焦げ:暗いバツ(ネガティブ・処理ペナルティ)
                drawDotIcon(ctx, "cross", laneCx, hintY, "#555", 2);
            } else {
                // 相手の焦げ:ゴミ箱+「0」(コスト不要の処理対象)
                drawDotIcon(ctx, "trash", laneCx - 6, hintY, "#ccc", 2);
                ctx.fillStyle = "#999"; 
                ctx.font = "bold 14px monospace";
                ctx.textAlign = "left";
                ctx.fillText("0", laneCx + 8, hintY + 6);
            }
        } else if (isOwn) {
            if (status === "perfect") drawDotIcon(ctx, "diamond", laneCx, hintY, "#ff4", 2);
            else if (status === "okay") drawDotIcon(ctx, "diamond", laneCx, hintY, "#ddd", 2);
        } else if (canSteal) {
            drawDotIcon(ctx, "meat", laneCx, hintY, "#f33", 2);
        } else {
            drawDotIcon(ctx, "warning", laneCx, hintY, "#888", 2);
        }
    }
}
// 揺らめきを完全に排除した静的な輝き
function drawSparkles(ctx, cx, y, isHarvestMode, isPreview, extraAlpha = 0, scale = 1) {
    const baseAlpha = isPreview ? 0.3 : (isHarvestMode ? 0.8 : 0.65);
    ctx.globalAlpha = Math.min(1.0, baseAlpha + extraAlpha); ctx.fillStyle = "rgba(255, 255, 200, 0.9)";
    const positions = [{ dx: -32, dy: 15 }, { dx: 32, dy: 40 }, { dx: -28, dy: 70 }, { dx: 26, dy: 85 }];
    const w1 = 3 * scale, h1 = 10 * scale, w2 = 10 * scale, h2 = 3 * scale;
    positions.forEach((pos, idx) => {
        // 静止させるため animY は 0 に固定
        ctx.fillRect(cx + pos.dx - w1/2, y + pos.dy - h1/2, w1, h1); ctx.fillRect(cx + pos.dx - w2/2, y + pos.dy - h2/2, w2, h2);
    });
    if (extraAlpha > 0) { ctx.globalAlpha = extraAlpha * 0.5; ctx.beginPath(); const grad = ctx.createRadialGradient(cx, y + 45, 0, cx, y + 45, 45 * scale); grad.addColorStop(0, "rgba(255, 255, 200, 0.8)"); grad.addColorStop(1, "rgba(255, 255, 200, 0)"); ctx.fillStyle = grad; ctx.fill(); }
    ctx.globalAlpha = 1.0; 
}

function render(ctx) {
    const now = getTime();
    state.visuals.ghosts = state.visuals.ghosts.filter(g => now - g.startTime < 1000);
    state.visuals.statusMessages = state.visuals.statusMessages.filter(m => now - m.startTime < 1200);
    ctx.fillStyle = LAYOUT.COLORS.BG; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    const cx = LAYOUT.CANVAS_WIDTH / 2, cy = LAYOUT.CANVAS_HEIGHT / 2;
    
    if (state.screen === "title") {
        const logoOffsetY = -205, buttonOffsetY = 85;
        if (logoImage.complete && logoImage.naturalWidth > 0) { const logoMaxW = Math.min(320, LAYOUT.CANVAS_WIDTH * 0.82); const ratio = logoImage.naturalHeight / logoImage.naturalWidth, logoW = logoMaxW, logoH = logoW * ratio; ctx.drawImage(logoImage, cx - logoW / 2, cy + logoOffsetY, logoW, logoH); }
        else { ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN; ctx.font = "bold 32px monospace"; ctx.textAlign = "center"; ctx.fillText("YAKITORI WARS", cx, cy + logoOffsetY + 60); }
        const btnAi = { x: cx - 120, y: cy - 30 + buttonOffsetY, w: 240, h: 60 }, btnPvp = { x: cx - 120, y: cy + 50 + buttonOffsetY, w: 240, h: 60 };
        drawTitleButton(ctx, btnAi.x, btnAi.y, btnAi.w, btnAi.h, "VS AI (SURVIVAL)", "rgba(255, 150, 60, 0.45)", state.visuals.titleClick === "ai");
        drawTitleButton(ctx, btnPvp.x, btnPvp.y, btnPvp.w, btnPvp.h, "VS PLAYER", "rgba(255, 80, 60, 0.45)", state.visuals.titleClick === "pvp");
    } else if (state.screen === "game") { 
        drawGameScreen(ctx); 
    } else if (state.screen === "gameover" || state.screen === "clear" || state.screen === "stage_clear") {
        ctx.fillStyle = "#fff"; ctx.font = "bold 36px monospace"; ctx.textAlign = "center"; ctx.fillText(state.screen === "gameover" ? "GAME OVER" : "CLEAR!", cx, cy - 50);
        ctx.font = "24px monospace"; ctx.fillStyle = state.winnerText.includes("P2") ? LAYOUT.COLORS.P2 : LAYOUT.COLORS.P1; ctx.fillText(state.winnerText, cx, cy);
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText("Tap to Continue", cx, cy + 80);
    }
}

function drawGameScreen(ctx) {
    const cx = LAYOUT.CANVAS_WIDTH / 2, safeTop = 15, panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25), now = getTime();
    const activePlayer = (state.startRouletteActive || state.startRouletteBlinkActive) ? (state.startRouletteBlinkActive ? state.startRouletteFinalPlayer : state.startRouletteIndex) : (state.pendingPlayer !== null ? state.pendingPlayer : state.currentPlayer);
    const pResources = state.players[activePlayer - 1].resources;
    
    drawPlayerPanel(ctx, state.players[0], 10, safeTop, panelW, 75, 1, activePlayer);
    drawPlayerPanel(ctx, state.players[1], LAYOUT.CANVAS_WIDTH - panelW - 10, safeTop, panelW, 75, 2, activePlayer);
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center"; ctx.fillText(`ROUND ${state.round} / ${state.maxRounds}`, cx, safeTop + 25);
    if (state.gameMode === "ai") { ctx.font = "14px monospace"; ctx.fillText(`STAGE ${state.currentStage} ${state.enemyName}`, cx, safeTop + 45); }

    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i), laneCx = b.x + b.w / 2;
        
        let effectiveCookState = lane.cookState;
        let isCurrentPreviewLane = false;
        let previewEventForThisLane = null;

        if (state.cookPreviewActive) {
            previewEventForThisLane = state.cookPreviewEvents.find(e => e.laneIndex === i);
            const activeEvent = state.cookPreviewEvents[state.cookPreviewIndex];
            
            if (activeEvent && activeEvent.laneIndex === i) {
                isCurrentPreviewLane = true;
            } else if (previewEventForThisLane) {
                const eventIndex = state.cookPreviewEvents.indexOf(previewEventForThisLane);
                if (eventIndex > state.cookPreviewIndex) {
                    effectiveCookState = previewEventForThisLane.prevCookState;
                }
            }
        }

        drawBevelRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, "#3a3a45");
        ctx.fillStyle = "#0a0a0f"; ctx.fillRect(b.x, b.y, b.w, b.h);
        
        let isDanger = false;
        if (lane.built && !lane.justPlaced) { 
            const heat = getBaseHeat(lane.type), boost = lane.uchiwaBoost || 0; 
            isDanger = (getCookLabel(lane.type, effectiveCookState) !== "burnt" && getCookLabel(lane.type, effectiveCookState + heat + boost) === "burnt"); 
        }
        
        ctx.strokeStyle = "#555"; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 1; j <= 5; j++) { const barY = b.y + (b.h * j / 6); ctx.moveTo(b.x, barY); ctx.lineTo(b.x + b.w, barY); }
        [0.2, 0.8].forEach(ratio => { const barX = b.x + b.w * ratio; ctx.moveTo(barX, b.y); ctx.lineTo(barX, b.y + b.h); });
        ctx.stroke();
        
        // 炎の揺らめき(Math.sin)を削除し、常に静止した一定の明るさにする
        const fireIntensity = lane.fire * 0.15; 
        const gradient = ctx.createLinearGradient(0, b.y + b.h - 50, 0, b.y + b.h); 
        gradient.addColorStop(0, "rgba(255, 50, 0, 0)"); 
        gradient.addColorStop(1, `rgba(255, 60, 10, ${fireIntensity})`);
        ctx.fillStyle = gradient; ctx.fillRect(b.x, b.y + b.h - 50, b.w, 50);

        let isFlashable = false, isPerfectTarget = false; 
        if (state.buildMode) {
            isFlashable = isNodeValidForMode(lane, state.buildMode);
            if (state.buildMode === "harvest" && lane.built && lane.owner !== activePlayer) { if (getCookLabel(lane.type, effectiveCookState) !== "burnt" && pResources < 1) isFlashable = false; }
            if (state.buildMode === "harvest" && isFlashable && lane.built) { if (getCookLabel(lane.type, effectiveCookState) === "perfect") isPerfectTarget = true; }
            if (isFlashable) {
                if (state.buildMode === "harvest") { 
                    // パルスアニメーションを削除し、固定の明るさに
                    ctx.fillStyle = `rgba(255, 255, 255, 0.18)`; ctx.fillRect(b.x, b.y, b.w, b.h); 
                    ctx.strokeStyle = isPerfectTarget ? `rgba(255, 230, 100, 0.65)` : `rgba(255, 255, 255, 0.65)`; ctx.lineWidth = 3; ctx.strokeRect(b.x, b.y, b.w, b.h); 
                }
                else { ctx.fillStyle = `rgba(255, 255, 255, 0.08)`; ctx.fillRect(b.x, b.y, b.w, b.h); }
            }
        }

        if (lane.built) {
            const isUchiwaPreviewActive = (state.buildMode === "uchiwa" && isFlashable);
            let displayCookState = effectiveCookState;
            if (isUchiwaPreviewActive) displayCookState += getBaseHeat(lane.type) + 1; 
            
            const displayStatus = getCookLabel(lane.type, displayCookState), p = getVisualPalette(displayStatus.toUpperCase());
            const stickH = b.h * 0.7, stickTop = b.y + b.h * 0.1; 
            if (lane.justPlaced) ctx.globalAlpha = 0.4;
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx - 1, stickTop, 4, stickH); ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx - 2, stickTop, 4, stickH);
            const meatW = b.w * 0.6, meatH = stickH * 0.2, meatX = laneCx - meatW / 2;
            
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false, isDanger);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true, isDanger);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false, isDanger);
            ctx.globalAlpha = 1.0; 
            
            const markerY = b.y - 10, markerSize = 9; ctx.fillStyle = lane.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
            ctx.beginPath(); ctx.moveTo(laneCx, markerY); ctx.lineTo(laneCx - markerSize, markerY - markerSize); ctx.lineTo(laneCx + markerSize, markerY - markerSize); ctx.fill();
            
            const isOwn = lane.owner === activePlayer, realStatus = getCookLabel(lane.type, effectiveCookState), realCanSteal = !isOwn && realStatus !== "early" && realStatus !== "burnt" && pResources >= 1;
            if (!lane.justPlaced) {
                const peakTime = state.visuals.peakFlashes[lane.id]; let peakAlpha = 0, peakScale = 1;
                // ピーク時のアニメーションもサイン波を廃止し、線形に拡縮・フェードアウトさせる
                if (peakTime && now - peakTime < 700) { const elapsed = now - peakTime, progress = elapsed / 700; peakAlpha = (1 - progress) * 0.6; peakScale = 1 + (1 - progress) * 0.3; }
                if (realStatus === "perfect" && (isOwn || realCanSteal)) drawSparkles(ctx, laneCx, stickTop, state.buildMode === "harvest", false, peakAlpha, peakScale);
                else if (isUchiwaPreviewActive && displayStatus === "perfect" && realStatus !== "perfect") drawSparkles(ctx, laneCx, stickTop, false, true, 0, 1);
            }
        }
        
        let cv = 0, nextCv = 0, dotColor = "#fff", previewColor = "rgba(255, 255, 255, 0.3)";
        if (lane.built) {
            cv = Math.min(effectiveCookState || 0, 6); const heat = getBaseHeat(lane.type), boost = lane.uchiwaBoost || 0; nextCv = Math.min(6, cv + heat + boost);
            if (state.buildMode === "uchiwa" && isFlashable) { nextCv = Math.min(6, cv + heat + 1); previewColor = "rgba(255, 255, 255, 0.6)"; }
            dotColor = getVisualPalette(getCookLabel(lane.type, effectiveCookState).toUpperCase()).dot;
        }

        const dotSize = 8, dotGap = 2, gridW = 6 * dotSize + 5 * dotGap, dotStartX = laneCx - gridW / 2, dotStartY = b.y + b.h + 12;     
        drawBevelRect(ctx, dotStartX - 6, dotStartY - 6, gridW + 12, dotSize + 12, "#242430");
        
        for (let j = 0; j < 6; j++) {
            const dx = dotStartX + j * (dotSize + dotGap); 
            if (j < cv) {
                // タイマーに同期したフラッシュ(サイン波を廃止)
                if (isCurrentPreviewLane && j >= previewEventForThisLane.prevCookState && j < previewEventForThisLane.newCookState) {
                    const eventProgress = state.cookPreviewPhaseTimer / 60; // 1.0 -> 0.0
                    const flashAlpha = 0.6 + 0.4 * eventProgress;
                    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`; 
                    ctx.fillRect(dx, dotStartY, dotSize, dotSize);
                } else {
                    ctx.fillStyle = dotColor; ctx.fillRect(dx, dotStartY, dotSize, dotSize); 
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.fillRect(dx + 1, dotStartY + 1, dotSize - 4, dotSize - 5);
                }
            } else if (j < nextCv) { ctx.fillStyle = previewColor; ctx.fillRect(dx, dotStartY, dotSize, dotSize); }
            else { ctx.fillStyle = "rgba(10, 10, 15, 0.9)"; ctx.fillRect(dx, dotStartY, dotSize, dotSize); }
        }
        
        if (isCurrentPreviewLane && previewEventForThisLane) {
            const eventProgress = state.cookPreviewPhaseTimer / 60; // 1.0 -> 0.0
            const textY = b.y + b.h * 0.1 - 15;
            ctx.textAlign = "center"; ctx.globalAlpha = 0.7 + 0.3 * eventProgress;
            
            if (previewEventForThisLane.prevStatus !== "perfect" && previewEventForThisLane.newStatus === "perfect") { 
                ctx.fillStyle = `rgba(255, 230, 100, ${0.25 * eventProgress})`; ctx.fillRect(b.x, b.y, b.w, b.h); 
                ctx.fillStyle = "#ff4"; ctx.font = "bold 22px monospace"; ctx.fillText("READY!", laneCx, textY); 
            }
            else if (previewEventForThisLane.prevStatus !== "burnt" && previewEventForThisLane.newStatus === "burnt") { 
                ctx.fillStyle = `rgba(255, 50, 50, ${0.25 * eventProgress})`; ctx.fillRect(b.x, b.y, b.w, b.h); 
                ctx.fillStyle = "#f33"; ctx.font = "bold 22px monospace"; ctx.fillText("BURNT!", laneCx, textY); 
            }
            else { ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * eventProgress})`; ctx.fillRect(b.x, b.y, b.w, b.h); }
            ctx.globalAlpha = 1.0;
        }

        const fireScale = 2.5, fireSize = 8 * fireScale, totalFireW = (fireSize * lane.fire) + (4 * (lane.fire - 1)), startFireX = laneCx - totalFireW / 2 + fireSize / 2;
        for (let f = 0; f < lane.fire; f++) drawDotIcon(ctx, "fire", startFireX + f * (fireSize + 4), b.y + b.h + 40, "#fa3", fireScale);
        if (lane.uchiwaBoost > 0) { ctx.globalAlpha = 0.6; drawDotIcon(ctx, "fire", b.x + b.w - 18, b.y + b.h - 18, "#f85", 2); ctx.globalAlpha = 1.0; }
        drawLaneHint(ctx, lane, i, state.buildMode, activePlayer, pResources);
        
        if (state.cookPreviewActive && !isCurrentPreviewLane) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(b.x - 8, b.y - 8, b.w + 16, b.h + 80);
        }
    });

    renderParticlesAndOverlay(ctx, now, activePlayer);
}

function renderParticlesAndOverlay(ctx, now, activePlayer) {
    const cx = LAYOUT.CANVAS_WIDTH / 2, cy = LAYOUT.CANVAS_HEIGHT / 2;
    for (let i = state.visuals.particles.length - 1; i >= 0; i--) {
        let p = state.visuals.particles[i]; p.life++; if (p.life >= p.maxLife) { state.visuals.particles.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy; const ratio = p.life / p.maxLife; ctx.globalAlpha = 0.6 * (1 - ratio); 
        ctx.fillStyle = p.color || "#e0e0e0"; // 指定された煙の色を適用
        ctx.beginPath(); ctx.arc(p.x, p.y, (p.size * (1 + ratio)) / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0; 

    if (state.buildMode) {
        const cb = getCancelButtonBounds(), selectedIcon = getBuildModeIcon(state.buildMode);
        if (selectedIcon) { const iconX = cb.x + cb.w / 2, iconY = cb.y - 26; ctx.globalAlpha = 0.9; drawDotIcon(ctx, selectedIcon, iconX, iconY, "#fff", 3); ctx.globalAlpha = 1.0; }
        const isPressed = (now - (state.visuals.cancelClick || 0) < 150); drawBevelRect(ctx, cb.x, cb.y, cb.w, cb.h, "#a33", isPressed);
        const offset = isPressed ? 3 : 0; ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign="center"; ctx.fillText("CANCEL", cb.x + cb.w/2 + offset, cb.y + cb.h/2 + 6 + offset);
    } else {
        LAYOUT.BUTTONS.forEach((btn, i) => {
            const b = getButtonBounds(i), boxId = i + 1; let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer); if (boxId === 2) canUse = canUseSkewer(state.currentPlayer); if (boxId === 3) canUse = canUseServe(state.currentPlayer); if (boxId === 4) canUse = canUseUchiwa(state.currentPlayer); 
            const isPressed = (now - (state.visuals.buttonClicks[i] || 0) < 150), isLocked = isInputLocked() && !isPressed;
            let baseColor = (canUse && !isLocked) ? btn.color : "#445";
            
            // ボタンのパルスアニメーションも削除し、静的なハイライトに変更
            if (boxId === 3 && canUse && !isLocked && state.buildMode === null) { 
                const isPerfect = hasPerfectHarvestTarget(state.currentPlayer);
                baseColor = brightenColor(btn.color, isPerfect ? 0.3 : 0.0); 
            }
            
            drawBevelRect(ctx, b.x, b.y, b.w, b.h, baseColor, isPressed);
            const offset = isPressed ? 3 : 0; drawDotIcon(ctx, btn.icon, b.x + b.w/2 + offset, b.y + b.h/2 + offset, (canUse && !isLocked) ? "#fff" : "#888", 4);
        });
    }

    if (state.startRouletteActive || state.startRouletteBlinkActive) {
        ctx.globalAlpha = 1.0; ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, cy - 40, LAYOUT.CANVAS_WIDTH, 80);
        let isVisible = state.startRouletteBlinkActive ? state.startRouletteBlinkCount % 2 === 0 : true;
        if (isVisible) { const idx = state.startRouletteBlinkActive ? state.startRouletteFinalPlayer : state.startRouletteIndex; ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = "bold 48px monospace"; ctx.textAlign = "center"; ctx.fillText(`P${idx}`, cx, cy + 15); }
    } else if (state.turnSplashTimer > 0 && !state.cookPreviewActive) {
        const fadeAlpha = getFadeAlpha(state.turnSplashTimer, 45, 10); ctx.globalAlpha = fadeAlpha; ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, cy - 40, LAYOUT.CANVAS_WIDTH, 80); ctx.fillStyle = activePlayer === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = "bold 32px monospace"; ctx.textAlign = "center"; ctx.fillText(`P${activePlayer} TURN`, cx, cy + 10);
    }
    ctx.globalAlpha = 1.0;

    state.visuals.ghosts.forEach(g => {
        const elapsed = now - g.startTime, progress = Math.min(1, elapsed / 800), yOffset = -150 * (1 - Math.pow(1 - progress, 3)); ctx.globalAlpha = 1 - progress;
        const b = getLaneBounds(g.laneIndex), laneCx = b.x + b.w / 2, p = getVisualPalette(g.status), stickH = b.h * 0.7, stickTop = b.y + b.h * 0.1 + yOffset; 
        if (g.cookState !== undefined) {
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx-1, stickTop, 4, stickH); ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx-2, stickTop, 4, stickH);
            const meatW = b.w * 0.6, meatH = stickH * 0.2, meatX = laneCx - meatW/2;
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false); drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true); drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false);
            ctx.fillStyle = g.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.beginPath(); ctx.moveTo(laneCx, stickTop - 10); ctx.lineTo(laneCx-5, stickTop-15); ctx.lineTo(laneCx+5, stickTop-15); ctx.fill();
        }
    });

    state.visuals.statusMessages.forEach((msg, idx) => {
        const elapsed = now - msg.startTime; let alpha = 1, yAnimOffset = 0;
        if (elapsed < 120) { const p = elapsed / 120; alpha = p; yAnimOffset = 10 * (1 - p); } else if (elapsed < 770) { alpha = 1; yAnimOffset = 0; } else { const p = Math.min(1, (elapsed - 770) / 430); alpha = 1 - p; yAnimOffset = -15 * p; }
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha)); const fx = cx, fy = 130 + (idx * 32) + yAnimOffset; ctx.textAlign = "center";
        let icon = msg.type === 'meat' ? 'meat' : 'diamond', text = msg.amount > 0 ? `+${msg.amount}` : `${msg.amount}`, color = msg.type === 'meat' ? (msg.amount > 0 ? "#fa3" : "#f33") : (msg.amount > 0 ? "#ff4" : "#f33");
        const txtW = ctx.measureText(text).width + 40; ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(fx - txtW/2, fy - 22, txtW, 30);
        ctx.fillStyle = color; ctx.font = "bold 24px monospace"; drawDotIcon(ctx, icon, fx - 25, fy - 8, "#fff", 2.5); ctx.fillText(text, fx + 15, fy);
    });
    ctx.globalAlpha = 1.0;
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx, activePlayer) {
    const active = activePlayer === idx, baseColor = active ? (idx === 1 ? "#2a4a6a" : "#6a2a3a") : LAYOUT.COLORS.PANEL_BG;
    drawBevelRect(ctx, x, y, w, h, baseColor);
    if (active) { ctx.strokeStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.lineWidth = 2; ctx.strokeRect(x - 2, y - 2, w + 4, h + 4); }
    ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.fillText(`P${idx}`, x + 10, y + 25);
    drawDotIcon(ctx, "diamond", x + 20, y + 45, "#6cf", 2); ctx.fillStyle = "#fff"; ctx.font = "bold 16px monospace"; ctx.textAlign = "right"; ctx.fillText(`${player.score}`, x + w - 10, y + 50);
    drawDotIcon(ctx, "meat", x + 20, y + 65, "#f77", 2); ctx.fillStyle = "#fff"; ctx.fillText(`${player.resources || 0}`, x + w - 10, y + 70);
}

// ==========================================
// 8. main.js - セットアップとスマホ対応
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game"); if (!canvas) return; const ctx = canvas.getContext("2d");
    document.body.style.margin = "0"; document.body.style.backgroundColor = "#111"; document.body.style.height = "100vh"; document.body.style.overflow = "hidden"; document.body.style.touchAction = "none";
    function resize() {
        const dpr = window.devicePixelRatio || 1, vw = window.visualViewport ? window.visualViewport.width : window.innerWidth, vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        LAYOUT.CANVAS_WIDTH = vw; LAYOUT.CANVAS_HEIGHT = vh; canvas.width = vw * dpr; canvas.height = vh * dpr; canvas.style.width = vw + "px"; canvas.style.height = vh + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize); resize();
    let lastTouchTime = 0;
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); lastTouchTime = Date.now(); handleCanvasClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }, canvas); }, { passive: false });
    canvas.addEventListener("click", (e) => { if (Date.now() - lastTouchTime < 500) return; handleCanvasClick(e, canvas); });

    function loop() {
        updateRoulette(); updateCookPreview(); resolvePendingTurnFlow(); render(ctx); playAITurn(); requestAnimationFrame(loop);
    }
    loop();
});
