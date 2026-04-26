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
        
        startRouletteActive: false,
        startRouletteInterval: 4,     
        startRouletteTickTimer: 4,    
        startRouletteCount: 0,        
        startRouletteMaxCount: 16,    
        startRouletteIndex: 1,
        startRouletteFinalPlayer: null,
        
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
            ghosts: [], 
            floaters: [],
            statusMessages: [], // 状態表示ゾーン(RESULT ZONE)用
            particles: [], 
            cancelClick: 0, 
            titleClick: null
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
    put: [0,0,0,10,10,0,0,0,0,0,0,10,10,0,0,0,0,0,0,10,10,0,0,0,0,0,0,10,10,0,0,0,10,10,10,10,10,10,10,10,0,10,10,10,10,10,10,0,0,0,10,10,10,10,0,0,0,0,0,10,10,0,0,0],
    serve: [0,0,0,11,11,0,0,0,0,0,11,11,11,11,0,0,0,11,11,11,11,11,11,0,11,11,11,11,11,11,11,11,0,0,0,11,11,0,0,0,0,0,0,11,11,0,0,0,0,0,0,11,11,0,0,0,0,0,0,11,11,0,0,0],
    uchiwa: [0,8,8,8,8,8,8,0,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,0,9,9,7,7,9,9,0,0,0,0,7,7,0,0,0,0,0,0,7,7,0,0,0,0,0,0,7,7,0,0,0],
    diamond: [0,0,0,1,6,0,0,0,0,0,1,6,6,6,0,0,0,1,6,6,6,6,6,0,1,6,6,6,6,6,6,6,0,6,6,6,6,6,6,0,0,0,6,6,6,6,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0],
    fire: [0,0,0,4,0,0,0,0,0,0,4,5,4,0,0,0,0,4,4,5,4,4,0,0,0,4,5,5,5,4,0,0,4,5,5,5,5,5,4,0,4,4,5,5,5,4,4,0,0,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0]
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

function spawnSmokeEffect(laneIndex, amount) {
    const b = getLaneBounds(laneIndex);
    const laneCx = b.x + b.w / 2;
    const stickTop = b.y + b.h * 0.1;
    const meatY = stickTop + (b.h * 0.7) * 0.4;
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

function advanceAllSkewersAtRoundEnd() {
    state.lanes.forEach((n, index) => {
        if (n.built) {
            if (n.justPlaced) n.justPlaced = false;
            else {
                const baseHeat = getBaseHeat(n.type);
                const boost = n.uchiwaBoost || 0;
                const prevCookState = n.cookState; 
                n.cookState = Math.min(8, n.cookState + baseHeat + boost);
                
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
    state.buildMode = null;
    state.pendingBox = null;
    state.currentPlayer = state.firstPlayer;
    state.pendingPlayer = state.firstPlayer;
    state.pendingTurnSplash = true;
    state.pendingAiBreath = false;
}

function updateRoulette() {
    if (!state.startRouletteActive) return;

    state.startRouletteTickTimer--;

    if (state.startRouletteTickTimer <= 0) {
        state.startRouletteIndex = 3 - state.startRouletteIndex;
        state.startRouletteCount++;

        state.startRouletteInterval *= 1.15; 
        state.startRouletteTickTimer = Math.floor(state.startRouletteInterval);

        if (state.startRouletteCount >= state.startRouletteMaxCount) {
            state.startRouletteActive = false;
            state.startRouletteFinalPlayer = state.startRouletteIndex;
            state.firstPlayer = state.startRouletteFinalPlayer;
            state.currentPlayer = state.startRouletteFinalPlayer;
            state.pendingPlayer = state.startRouletteFinalPlayer;
            state.pendingTurnSplash = true;
        }
    }
}

function tryEndRound() {
    advanceAllSkewersAtRoundEnd();
    
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
        } else if (p2 > p1) { state.screen = "gameover"; state.winnerText = "P2 Wins!"; } 
        else { state.screen = "gameover"; state.winnerText = "Draw!"; }
        return;
    }
    startNewRound();
}

function resolvePendingTurnFlow() {
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
        state.visuals.statusMessages.push({ type: 'score', amount: scoreGained, player: state.currentPlayer, startTime: performance.now() });
    }
    
    state.visuals.ghosts.push({ 
        laneIndex: state.lanes.indexOf(node), 
        status: status.toUpperCase(), 
        startTime: performance.now(),
        cookState: node.cookState, 
        owner: node.owner          
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
    if (state.startRouletteActive) return true;
    const cp = state.currentPlayer;
    
    return state.screen !== "game" || 
           state.isBusy || state.isAIThinking ||
           state.pendingPlayer !== null || 
           state.turnSplashTimer > 0 || 
           state.aiBreathTimer > 0 ||
           state.gameOver ||
           state.players[cp - 1].workersRemaining <= 0 ||
           isAIPlayer(cp); 
}

function handleCanvasClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (state.screen === "title") {
        if (state.isBusy) return;
        const cx = LAYOUT.CANVAS_WIDTH / 2;
        const cy = LAYOUT.CANVAS_HEIGHT / 2;
        
        const btnAi = { x: cx - 120, y: cy - 30, w: 240, h: 60 };
        const btnPvp = { x: cx - 120, y: cy + 50, w: 240, h: 60 };

        if (x >= btnAi.x && x <= btnAi.x + btnAi.w && y >= btnAi.y && y <= btnAi.y + btnAi.h) {
            state.visuals.titleClick = "ai";
            state.isBusy = true;
            setTimeout(() => { startGame("ai"); }, 150);
        } else if (x >= btnPvp.x && x <= btnPvp.x + btnPvp.w && y >= btnPvp.y && y <= btnPvp.y + btnPvp.h) {
            state.visuals.titleClick = "pvp";
            state.isBusy = true;
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
            state.visuals.cancelClick = performance.now();
            state.isBusy = true;
            setTimeout(() => { state.buildMode = null; state.pendingBox = null; state.isBusy = false; }, 150);
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
            const boxId = i + 1;
            let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer);
            if (boxId === 2) canUse = canUseSkewer(state.currentPlayer);
            if (boxId === 3) canUse = canUseServe(state.currentPlayer);
            if (boxId === 4) canUse = true; 

            if (canUse) {
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
    if (p.resources >= 1) { currentState.lanes.forEach(n => { if (!n.built) actions.push({ type: "put", nodeId: n.id }); }); }
    currentState.lanes.forEach(n => {
        if (n.built) { actions.push({ type: "serve", nodeId: n.id }); actions.push({ type: "uchiwa", nodeId: n.id }); }
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
        
        if (isOwn) { 
            if (lbl === "early") return false; 
        } else {
            if (lbl === "early") return false; 
            if (lbl !== "burnt" && p.resources < 1) return false; 
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
        
        if (lbl === "burnt") {
            score += 25; 
            if (profileName === "master") score += 20; 
            if (profileName === "gambler") score -= 10; 
        } else if (!isOwn) {
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
    if (!isAIPlayer(state.currentPlayer)) return;
    if (state.screen !== "game" || state.isBusy || state.isAIThinking || state.gameOver) return;
    if (state.pendingPlayer !== null || state.turnSplashTimer > 0 || state.aiBreathTimer > 0) return;
    if (state.startRouletteActive) return;
    if (state.players[state.currentPlayer - 1].workersRemaining <= 0) return;

    state.isAIThinking = true;
    setTimeout(() => {
        try {
            const levelConf = AI_LEVEL_CONFIG[state.aiLevel] || AI_LEVEL_CONFIG[2];
            const profile = state.aiProfile;
            
            let cands = buildActionCandidates(state, state.currentPlayer).filter(a => isActionValidForAI(state, a, state.currentPlayer, profile, levelConf));
            if (cands.length === 0) cands.push({ type: "meat" });

            let scored = cands.map(a => ({ action: a, score: scoreAIAction(state, a, state.currentPlayer, profile) + (Math.random() * 2 - 1) * levelConf.scoreNoise }));
            scored.sort((a, b) => b.score - a.score);
            let best = scored[0].action;

            if (scored.length > 1) {
                if (Math.random() < levelConf.mistake) {
                    let pool = scored.filter((s, i) => i >= 1 && i <= 2 && (scored[0].score - s.score) <= 15);
                    if (pool.length > 0) best = pool[Math.floor(Math.random() * pool.length)].action;
                } else if (Math.random() < levelConf.rand) {
                    let pool = scored.slice(0, levelConf.topCandRange).filter(s => (scored[0].score - s.score) <= 12);
                    if (pool.length > 1) best = pool[Math.floor(Math.random() * pool.length)].action;
                } else {
                    let second = scored[1];
                    if ((scored[0].score - second.score) <= levelConf.closeThresh && Math.random() < levelConf.closeRate) best = second.action;
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
function getFadeAlpha(currentTimer, maxTimer, fadeFrames = 10) {
    if (currentTimer > maxTimer - fadeFrames) return Math.max(0, (maxTimer - currentTimer) / fadeFrames);
    if (currentTimer < fadeFrames) return Math.max(0, currentTimer / fadeFrames);
    return 1.0; 
}

function drawBevelRect(ctx, x, y, w, h, baseColor, isPressed = false) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(x, y, w, h);

    if (isPressed) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; ctx.fillRect(x, y, w, 6); ctx.fillRect(x, y, 6, h);
    } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; ctx.fillRect(x, y, w, 4); ctx.fillRect(x, y, 4, h); 
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(x, y + h - 6, w, 6); ctx.fillRect(x + w - 4, y, 4, h); 
    }
}

function drawDeliciousYakitori(ctx, x, y, w, h, baseColor, isNegi) {
    ctx.fillStyle = baseColor;
    if (isNegi) {
        const nx = x + 4; const nw = w - 8; ctx.fillRect(nx, y, nw, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fillRect(nx + 2, y + 2, nw - 4, 4);
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)"; ctx.fillRect(nx, y + h - 6, nw, 6); ctx.fillRect(nx + nw - 4, y, 4, h);
    } else {
        ctx.fillRect(x + 4, y, w - 8, h); ctx.fillRect(x, y + 4, w, h - 8); 
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; ctx.fillRect(x + 6, y + 4, w - 16, 4); ctx.fillRect(x + 4, y + 8, 4, 6);      
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x + 4, y + h - 8, w - 8, 8); ctx.fillRect(x + w - 6, y + 6, 4, h - 14); 
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
    state.visuals.ghosts = state.visuals.ghosts.filter(g => now - g.startTime < 1000);
    state.visuals.floaters = state.visuals.floaters.filter(f => now - f.startTime < 800);
    
    // ★ 変更: RESULT ZONE用の寿命を1000msから1200msに変更
    state.visuals.statusMessages = state.visuals.statusMessages.filter(m => now - m.startTime < 1200);

    ctx.fillStyle = LAYOUT.COLORS.BG; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    const cx = LAYOUT.CANVAS_WIDTH / 2; const cy = LAYOUT.CANVAS_HEIGHT / 2;

    if (state.screen === "title") {
        ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN; ctx.font = "bold 32px monospace"; ctx.textAlign = "center";
        ctx.fillText("YAKITORI WARS", cx, cy - 80);
        
        const aiPressed = state.visuals.titleClick === "ai";
        drawBevelRect(ctx, cx - 120, cy - 30, 240, 60, "#3c96ff", aiPressed);
        ctx.fillStyle = "#fff"; ctx.font = "20px monospace"; 
        ctx.fillText("VS AI (SURVIVAL)", cx, cy - 30 + 36 + (aiPressed ? 3 : 0));
        
        const pvpPressed = state.visuals.titleClick === "pvp";
        drawBevelRect(ctx, cx - 120, cy + 50, 240, 60, "#ff5078", pvpPressed);
        ctx.fillStyle = "#fff"; 
        ctx.fillText("VS PLAYER", cx, cy + 50 + 36 + (pvpPressed ? 3 : 0));
        
    } else if (state.screen === "game") {
        drawGameScreen(ctx);
    } else if (state.screen === "gameover" || state.screen === "clear" || state.screen === "stage_clear") {
        ctx.fillStyle = "#fff"; ctx.font = "bold 36px monospace"; ctx.textAlign = "center";
        ctx.fillText(state.screen === "gameover" ? "GAME OVER" : "CLEAR!", cx, cy - 50);
        ctx.font = "24px monospace";
        ctx.fillStyle = state.winnerText.includes("P2") ? LAYOUT.COLORS.P2 : LAYOUT.COLORS.P1;
        ctx.fillText(state.winnerText, cx, cy);
        ctx.fillStyle = "#fff"; ctx.font = "16px monospace"; ctx.fillText("Tap to Continue", cx, cy + 80);
    }
}

function drawGameScreen(ctx) {
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2; 
    const panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25);
    const safeTop = 15;
    const now = getTime();
    
    const activePlayer = state.startRouletteActive ? state.startRouletteIndex : (state.pendingPlayer !== null ? state.pendingPlayer : state.currentPlayer);
    const pResources = state.players[activePlayer - 1].resources;

    drawPlayerPanel(ctx, state.players[0], 10, safeTop, panelW, 75, 1, activePlayer);
    drawPlayerPanel(ctx, state.players[1], LAYOUT.CANVAS_WIDTH - panelW - 10, safeTop, panelW, 75, 2, activePlayer);

    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
    ctx.fillText(`ROUND ${state.round}`, cx, safeTop + 25);
    if (state.gameMode === "ai") {
        ctx.font = "14px monospace"; ctx.fillText(`STAGE ${state.currentStage} ${state.enemyName}`, cx, safeTop + 45);
    }

    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i);
        const laneCx = b.x + b.w / 2;
        
        drawBevelRect(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, "#3a3a45");
        ctx.fillStyle = "#0a0a0f"; ctx.fillRect(b.x, b.y, b.w, b.h);

        ctx.strokeStyle = "#555"; ctx.lineWidth = 2; ctx.beginPath();
        for (let j = 1; j <= 5; j++) { const barY = b.y + (b.h * j / 6); ctx.moveTo(b.x, barY); ctx.lineTo(b.x + b.w, barY); }
        [0.2, 0.8].forEach(ratio => { const barX = b.x + b.w * ratio; ctx.moveTo(barX, b.y); ctx.lineTo(barX, b.y + b.h); });
        ctx.stroke();

        const gradient = ctx.createLinearGradient(0, b.y + b.h - 50, 0, b.y + b.h);
        gradient.addColorStop(0, "rgba(255, 50, 0, 0)"); gradient.addColorStop(1, `rgba(255, 60, 10, ${0.15 + lane.fire * 0.15})`);
        ctx.fillStyle = gradient; ctx.fillRect(b.x, b.y + b.h - 50, b.w, 50);

        let isValidAction = false;
        let isFlashable = false;
        
        if (state.buildMode) {
            isValidAction = isNodeValidForMode(lane, state.buildMode);
            isFlashable = isValidAction;
            
            if (state.buildMode === "harvest" && lane.built && lane.owner !== activePlayer) {
                const status = getCookLabel(lane.type, lane.cookState);
                if (status !== "burnt" && pResources < 1) {
                    isFlashable = false;
                }
            }

            if (isFlashable) {
                const alpha = 0.15 + Math.sin(now / 120) * 0.1;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                if (state.buildMode === "uchiwa") {
                    const heat = getBaseHeat(lane.type);
                    const pred = lane.cookState + heat + 1;
                    if (getCookLabel(lane.type, pred) === "burnt") {
                        ctx.fillStyle = `rgba(255, 50, 50, ${alpha + 0.2})`;
                    }
                }
                ctx.fillRect(b.x, b.y, b.w, b.h);
            }
        }

        if (lane.built) {
            const status = getCookLabel(lane.type, lane.cookState);
            const isOwn = lane.owner === activePlayer;
            const canSteal = !isOwn && status !== "early" && status !== "burnt" && pResources >= 1;
            const showSparkle = (status === "perfect") && (isOwn || canSteal);

            const p = getVisualPalette(status.toUpperCase());
            const stickH = b.h * 0.7; 
            const baseStickTop = b.y + b.h * 0.1; 
            const stickTop = baseStickTop; 
            
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx - 1, stickTop, 4, stickH); 
            ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx - 2, stickTop, 4, stickH);
            const meatW = b.w * 0.6; const meatH = stickH * 0.2; const meatX = laneCx - meatW / 2;
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false);

            if (showSparkle) {
                ctx.fillStyle = "rgba(255, 255, 200, 0.9)";
                [{x:-25, y:15, o:0}, {x:25, y:45, o:2}, {x:-20, y:75, o:4}].forEach(sp => {
                    ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin((now / 250) + sp.o));
                    ctx.fillRect(laneCx + sp.x - 1, stickTop + sp.y - 3, 2, 6);
                    ctx.fillRect(laneCx + sp.x - 3, stickTop + sp.y - 1, 6, 2);
                });
                ctx.globalAlpha = 1.0;
            }

            let noticeIcon = null;
            let noticeText = "";
            let noticeColor = "";

            if (state.buildMode === "harvest" && isFlashable) {
                if (isOwn && status === "burnt") {
                    noticeIcon = "diamond"; noticeText = "-2"; noticeColor = "#6cf";
                } else if (!isOwn && status !== "burnt") {
                    noticeIcon = "meat"; noticeText = "-1"; noticeColor = "#f33";
                }
            } else if (!state.buildMode) {
                if (isOwn && status === "burnt") {
                    noticeIcon = "diamond"; noticeText = "-2"; noticeColor = "#6cf";
                } else if (canSteal && status === "perfect") {
                    noticeIcon = "meat"; noticeText = "-1"; noticeColor = "#f33";
                }
            }

            if (noticeIcon) {
                const costX = laneCx + 22;
                const costY = stickTop + 25;
                drawDotIcon(ctx, noticeIcon, costX, costY, "#fff", 1.5);
                ctx.fillStyle = noticeColor; ctx.font = "bold 14px monospace"; ctx.textAlign = "left";
                ctx.fillText(noticeText, costX + 8, costY + 5);
            }
            
            ctx.fillStyle = lane.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
            ctx.beginPath(); ctx.moveTo(laneCx, stickTop - 10); ctx.lineTo(laneCx-5, stickTop-15); ctx.lineTo(laneCx+5, stickTop-15); ctx.fill();
            
            const cv = Math.min(lane.cookState || 0, 6);
            const heat = getBaseHeat(lane.type);
            const boost = lane.uchiwaBoost || 0;
            let nextCv = cv + heat + boost;
            let previewColor = "rgba(255, 255, 255, 0.3)";

            if (state.buildMode === "uchiwa" && isFlashable) {
                const uchiwaPred = cv + heat + 1;
                const predStatus = getCookLabel(lane.type, uchiwaPred);
                nextCv = Math.min(6, uchiwaPred);
                if (predStatus === "perfect") previewColor = "rgba(255, 255, 0, 0.7)"; 
                else if (predStatus === "okay") previewColor = "rgba(255, 165, 0, 0.7)";
                else if (predStatus === "burnt") previewColor = "rgba(255, 50, 50, 0.9)";
            } else {
                nextCv = Math.min(6, nextCv);
            }

            const dotSize = 8; const dotGap = 4;  
            const gridW = 3 * dotSize + 2 * dotGap; const gridH = 2 * dotSize + dotGap;
            const dotStartX = laneCx - gridW / 2; const dotStartY = baseStickTop + stickH + 12;

            drawBevelRect(ctx, dotStartX - 6, dotStartY - 6, gridW + 12, gridH + 12, "#242430");
            for (let j = 0; j < 6; j++) {
                const dx = dotStartX + (j % 3) * (dotSize + dotGap); 
                const dy = dotStartY + Math.floor(j / 3) * (dotSize + dotGap);
                if (j < cv) {
                    ctx.fillStyle = p.dot; ctx.fillRect(dx, dy, dotSize, dotSize);
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"; ctx.fillRect(dx + 1, dy + 1, dotSize - 4, dotSize - 5);
                } else if (j < nextCv) {
                    ctx.fillStyle = previewColor; ctx.fillRect(dx, dy, dotSize, dotSize);
                } else {
                    ctx.fillStyle = "rgba(10, 10, 15, 0.9)"; ctx.fillRect(dx, dy, dotSize, dotSize);
                }
            }
        }
        
        const fireScale = 2.5; const fireSize = 8 * fireScale;
        const totalFireW = (fireSize * lane.fire) + (4 * (lane.fire - 1));
        const startFireX = laneCx - totalFireW / 2 + fireSize / 2;
        for (let f = 0; f < lane.fire; f++) drawDotIcon(ctx, "fire", startFireX + f * (fireSize + 4), b.y + b.h + 22, "#fa3", fireScale);
    });

    renderParticlesAndOverlay(ctx, now, activePlayer);
}

function renderParticlesAndOverlay(ctx, now, activePlayer) {
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2;

    for (let i = state.visuals.particles.length - 1; i >= 0; i--) {
        let p = state.visuals.particles[i]; p.life++;
        if (p.life >= p.maxLife) { state.visuals.particles.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        const ratio = p.life / p.maxLife;
        ctx.globalAlpha = 0.6 * (1 - ratio); ctx.fillStyle = "#e0e0e0"; ctx.beginPath();
        ctx.arc(p.x, p.y, (p.size * (1 + ratio)) / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1.0; 

    if (state.buildMode) {
        const cb = getCancelButtonBounds();
        const clickTime = state.visuals.cancelClick || 0;
        const isPressed = (now - clickTime < 150);
        drawBevelRect(ctx, cb.x, cb.y, cb.w, cb.h, "#a33", isPressed);
        const offset = isPressed ? 3 : 0;
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

            const clickTime = state.visuals.buttonClicks[i] || 0;
            const isPressed = (now - clickTime < 150);
            const isLocked = isInputLocked() && !isPressed;
            const baseColor = (canUse && !isLocked) ? btn.color : "#445";
            drawBevelRect(ctx, b.x, b.y, b.w, b.h, baseColor, isPressed);
            const offset = isPressed ? 3 : 0;
            drawDotIcon(ctx, btn.icon, b.x + b.w/2 + offset, b.y + b.h/2 + offset, (canUse && !isLocked) ? "#fff" : "#888", 4);
        });
    }

    if (state.startRouletteActive) {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        const bandH = 120;
        ctx.fillRect(0, cy - bandH / 2, LAYOUT.CANVAS_WIDTH, bandH);
        ctx.fillStyle = state.startRouletteIndex === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 48px monospace"; ctx.textAlign = "center";
        ctx.fillText(`P${state.startRouletteIndex}`, cx, cy + 20);
        ctx.fillStyle = "#fff"; ctx.font = "20px monospace";
        ctx.fillText("WHO GOES FIRST?", cx, cy - 30);
    } else if (state.turnSplashTimer > 0) {
        const fadeAlpha = getFadeAlpha(state.turnSplashTimer, 45, 10);
        ctx.globalAlpha = fadeAlpha; 
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; const bandH = 80; ctx.fillRect(0, cy - bandH/2, LAYOUT.CANVAS_WIDTH, bandH);
        ctx.fillStyle = activePlayer === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.font = "bold 32px monospace"; ctx.textAlign = "center"; ctx.fillText(`P${activePlayer} TURN`, cx, cy + 10);
    }
    ctx.globalAlpha = 1.0;

    state.visuals.ghosts.forEach(g => {
        const elapsed = now - g.startTime;
        const progress = Math.min(1, elapsed / 800);
        const yOffset = -150 * (1 - Math.pow(1 - progress, 3)); 
        ctx.globalAlpha = 1 - progress;
        
        const b = getLaneBounds(g.laneIndex);
        const laneCx = b.x + b.w / 2;
        const p = getVisualPalette(g.status);
        
        const stickH = b.h * 0.7; 
        const stickTop = b.y + b.h * 0.1 + yOffset; 
        
        if (g.cookState !== undefined) {
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
        ctx.fillText(g.status, laneCx, stickTop - 20); 
    });

    // ★ 変更: 5. 状態表示ゾーン (RESULT ZONE) のアニメーション修正
    state.visuals.statusMessages.forEach((msg, idx) => {
        const elapsed = now - msg.startTime;
        
        let alpha = 1;
        let yAnimOffset = 0;

        if (elapsed < 120) {
            // 1. Appear (0〜120ms): 透明度 0 -> 1、少し下(10px)から定位置へ
            const p = elapsed / 120;
            alpha = p;
            yAnimOffset = 10 * (1 - p);
        } else if (elapsed < 770) {
            // 2. Hold (120〜770ms): 完全に表示したまま定位置で止まる
            alpha = 1;
            yAnimOffset = 0;
        } else {
            // 3. Exit (770〜1200ms): 透明度 1 -> 0、少し上(-15px)へ抜けて消える
            const p = Math.min(1, (elapsed - 770) / 430);
            alpha = 1 - p;
            yAnimOffset = -15 * p;
        }

        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        const fx = cx;
        // 定位置のY=130に、複数スタック時のオフセット(idx * 32)とアニメーションを足す
        const fy = 130 + (idx * 32) + yAnimOffset;

        ctx.textAlign = "center";
        
        let icon = msg.type === 'meat' ? 'meat' : 'diamond';
        let text = msg.amount > 0 ? `+${msg.amount}` : `${msg.amount}`;
        let color = "#fff";
        
        if (msg.type === 'meat') {
            color = msg.amount > 0 ? "#fa3" : "#f33"; 
        } else if (msg.type === 'score') {
            color = msg.amount > 0 ? "#ff4" : "#f33"; 
        }

        const txtW = ctx.measureText(text).width + 40;
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(fx - txtW/2, fy - 22, txtW, 30);

        ctx.fillStyle = color; 
        ctx.font = "bold 24px monospace"; 
        
        drawDotIcon(ctx, icon, fx - 25, fy - 8, "#fff", 2.5); 
        ctx.fillText(text, fx + 15, fy);
    });
    ctx.globalAlpha = 1.0;
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx, activePlayer) {
    const active = activePlayer === idx;
    const baseColor = active ? (idx === 1 ? "#2a4a6a" : "#6a2a3a") : LAYOUT.COLORS.PANEL_BG;
    
    drawBevelRect(ctx, x, y, w, h, baseColor);
    
    if (active) {
        const pulse = (Math.sin(getTime() / 200) + 1) / 2; 
        ctx.strokeStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
        ctx.lineWidth = 2 + pulse * 4;       
        ctx.globalAlpha = 0.5 + pulse * 0.5; 
        ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
        ctx.globalAlpha = 1.0;               
    }
    
    ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
    ctx.font = "bold 18px monospace"; ctx.textAlign = "left"; ctx.fillText(`P${idx}`, x + 10, y + 25);
    
    drawDotIcon(ctx, "diamond", x + 20, y + 45, "#6cf", 2);
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px monospace"; ctx.textAlign = "right"; ctx.fillText(`${player.score}`, x + w - 10, y + 50);
    
    const meatCount = player.resources || 0;
    drawDotIcon(ctx, "meat", x + 20, y + 65, "#f77", 2);
    ctx.fillStyle = "#fff"; ctx.fillText(`${meatCount}`, x + w - 10, y + 70);
}

// ==========================================
// 8. main.js - セットアップとスマホ対応
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    document.body.style.margin = "0";
    document.body.style.backgroundColor = "#111";
    document.body.style.height = "100vh";
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    function resize() {
        const dpr = window.devicePixelRatio || 1;
        const vw = window.visualViewport ? window.visualViewport.width : window.innerWidth;
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        LAYOUT.CANVAS_WIDTH = vw; LAYOUT.CANVAS_HEIGHT = vh;
        canvas.width = vw * dpr; canvas.height = vh * dpr;
        canvas.style.width = vw + "px"; canvas.style.height = vh + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize); resize();

    let lastTouchTime = 0;
    canvas.addEventListener("touchstart", (e) => {
        e.preventDefault(); lastTouchTime = Date.now();
        handleCanvasClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }, canvas);
    }, { passive: false });
    canvas.addEventListener("click", (e) => {
        if (Date.now() - lastTouchTime < 500) return;
        handleCanvasClick(e, canvas);
    });

    function loop() {
        updateRoulette(); resolvePendingTurnFlow(); render(ctx); playAITurn(); requestAnimationFrame(loop);
    }
    loop();
});
