// ==========================================
// 1. game/state.js - ゲームの状態管理
// ==========================================
const state = {
    screen: "title",
    gameMode: "survival",
    currentStage: 1,
    enemyName: "KENTA",
    round: 1,
    maxRounds: 13,
    currentPlayer: 1,
    gameOver: false,
    winner: null,
    isBusy: false,
    turnSplashTimer: 0,
    pendingTurnSplash: false,
    pendingAiBreath: false,
    pendingPlayer: null,
    aiBreathTimer: 0,
    buildMode: null,
    players: [
        { id: 1, score: 0, meat: 0 },
        { id: 2, score: 0, meat: 0 }
    ],
    lanes: [
        { id: "s1", fire: 1, type: "weak", owner: null, cook: 0, uchiwaBoost: 0, justPlaced: false },
        { id: "s2", fire: 2, type: "medium", owner: null, cook: 0, uchiwaBoost: 0, justPlaced: false },
        { id: "s3", fire: 3, type: "strong", owner: null, cook: 0, uchiwaBoost: 0, justPlaced: false }
    ],
    visuals: {
        buttonClicks: {}, buttonErrors: {}, laneErrors: {}, laneFlashes: {}, placedAt: {}, ghosts: [], floaters: []
    }
};

function resetGameState() {
    state.round = 1;
    state.currentPlayer = 1;
    state.gameOver = false;
    state.winner = null;
    state.isBusy = false;
    state.turnSplashTimer = 0;
    state.pendingTurnSplash = false;
    state.pendingAiBreath = false;
    state.pendingPlayer = null;
    state.aiBreathTimer = 0;
    state.buildMode = null;
    state.visuals = {
        buttonClicks: {}, buttonErrors: {}, laneErrors: {}, laneFlashes: {}, placedAt: {}, ghosts: [], floaters: []
    };
    state.players.forEach(p => { p.score = 0; p.meat = 0; });
    state.lanes.forEach(l => { l.owner = null; l.cook = 0; l.uchiwaBoost = 0; l.justPlaced = false; });
}

// ==========================================
// 2. render/layout.js - 定数とレイアウト設定
// ==========================================
// ★変更: 画面サイズを動的に変更できるよう、letで定義し初期値を持たせます
let LAYOUT = {
    CANVAS_WIDTH: window.innerWidth,
    CANVAS_HEIGHT: window.innerHeight,
    COLORS: {
        BG: "#161620", 
        TEXT_MAIN: "#fff", TEXT_DIM: "#aaa",
        P1: "#3c96ff", P2: "#ff5078",
        NEUTRAL: "#333", PANEL_BG: "#242430", OVERLAY_BG: "rgba(0, 0, 0, 0.7)",
        STICK: "#dca", FIRE_BASE: "#e53", FIRE_BOOST: "#fa3", DOT_OFF: "#334",
        HIGHLIGHT: "rgba(255, 255, 255, 0.4)"
    },
    // ★変更: ボタンに表示用の日本語ラベルを追加
    BUTTONS: [
        { id: "meat", color: "#c55", icon: "meat", label: "肉" },
        { id: "put", color: "#678", icon: "put", label: "置く" },
        { id: "harvest", color: "#484", icon: "serve", label: "取る" },
        { id: "uchiwa", color: "#d63", icon: "uchiwa", label: "うちわ" }
    ]
};

const VISUAL_STATES = {
    RAW: { meat: "#ddd", negi: "#bdf", dot: "#fff", effect: "none" },
    OKAY: { meat: "#853", negi: "#683", dot: "#f90", effect: "none" },
    PERFECT: { meat: "#da4", negi: "#8e2", dot: "#ff4", effect: "spark" },
    BURNT: { meat: "#222", negi: "#111", dot: "#f33", effect: "smoke" }
};

const ICON_DATA = {
    meat: [0,0,1,1,1,1,0,0, 0,1,1,1,1,1,1,0, 1,1,1,1,1,1,1,1, 0,1,1,1,1,1,1,0, 0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0, 1,0,0,0,0,0,0,1, 0,1,0,0,0,0,1,0],
    put: [0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0, 1,1,1,1,1,1,1,1, 0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0, 0,0,0,1,1,0,0,0, 0,0,0,0,0,0,0,0],
    serve: [0,0,1,1,1,1,0,0, 0,1,1,1,1,1,1,0, 1,1,0,1,1,0,1,1, 1,1,1,1,1,1,1,1, 1,1,0,1,1,0,1,1, 0,1,1,1,1,1,1,0, 0,0,1,1,1,1,0,0, 0,0,0,0,0,0,0,0],
    uchiwa: [0,1,1,1,1,1,1,0, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 0,1,1,1,1,1,1,0, 0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0, 0,0,0,1,1,0,0,0]
};

function getVisualPalette(status) { return VISUAL_STATES[status] || VISUAL_STATES.RAW; }

// ★変更: 焼き台を中央に横3列で並べるよう計算式を変更
function getLaneBounds(index) {
    const laneW = Math.min(90, LAYOUT.CANVAS_WIDTH * 0.28);
    const laneH = Math.min(180, LAYOUT.CANVAS_HEIGHT * 0.3);
    const gap = 15;
    const totalW = (laneW * 3) + (gap * 2);
    const startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2;
    // 画面中央より少し上に配置
    const y = LAYOUT.CANVAS_HEIGHT / 2 - laneH / 2 - 40;
    
    return { x: startX + index * (laneW + gap), y, w: laneW, h: laneH };
}

// ★変更: アクションボタンを下部に2x2で配置するよう計算式を変更
function getButtonBounds(index) {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const btnW = Math.min(150, LAYOUT.CANVAS_WIDTH * 0.42);
    const btnH = Math.min(80, LAYOUT.CANVAS_HEIGHT * 0.12);
    const gapX = 15;
    const gapY = 15;
    const totalW = (btnW * 2) + gapX;
    const startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2;
    // 画面下部から一定の余白を取る
    const totalH = (btnH * 2) + gapY;
    const y = LAYOUT.CANVAS_HEIGHT - totalH - Math.max(30, LAYOUT.CANVAS_HEIGHT * 0.05);

    return { x: startX + col * (btnW + gapX), y: y + row * (btnH + gapY), w: btnW, h: btnH };
}

// ==========================================
// 3. game/flow.js - ゲーム進行
// ==========================================
function setupStage(stage) {
    state.currentStage = stage;
    const enemies = { 1: "KENTA", 2: "HIDEKI", 3: "MAKOTO", 4: "TETSUYA" };
    state.enemyName = enemies[stage] || "KENTA";
}

function startSurvivalGame() {
    state.gameMode = "survival";
    state.screen = "game";
    setupStage(1);
    resetGameState();
}

function endTurn() {
    const nextP = state.currentPlayer === 1 ? 2 : 1;
    if (state.currentPlayer === 2) {
        advanceRound();
        if (state.gameOver) return;
    }
    state.pendingPlayer = nextP;
    state.pendingTurnSplash = true;
    if (nextP === 2) state.pendingAiBreath = true;
}

function advanceRound() {
    state.lanes.forEach(lane => {
        if (lane.owner !== null) {
            if (lane.justPlaced) lane.justPlaced = false;
            else {
                lane.cook += (lane.fire + lane.uchiwaBoost);
                if (lane.cook > 8) lane.cook = 8;
            }
        }
        lane.uchiwaBoost = 0;
    });
    state.round += 1;
    if (state.round > state.maxRounds) {
        state.gameOver = true;
        state.screen = "gameover";
        const p1 = state.players[0].score;
        const p2 = state.players[1].score;
        state.winner = p1 > p2 ? "P1" : (p2 > p1 ? "P2" : "DRAW");
    }
}

function resolvePendingTurnFlow() {
    if (state.pendingTurnSplash) { state.turnSplashTimer = 90; state.pendingTurnSplash = false; }
    if (state.turnSplashTimer > 0) {
        state.turnSplashTimer--;
    } else if (state.pendingPlayer !== null) {
        state.currentPlayer = state.pendingPlayer;
        state.pendingPlayer = null;
        if (state.pendingAiBreath) { state.aiBreathTimer = 15; state.pendingAiBreath = false; }
    } else if (state.aiBreathTimer > 0) {
        state.aiBreathTimer--;
    }
}

// ==========================================
// 4. game/rules.js - 調理ルール
// ==========================================
function getCookStatus(lane) {
    const cv = lane.cook;
    const isWeak = (lane.type === "weak");
    if (isWeak) {
        if (cv >= 8) return "BURNT";
        if (cv >= 6) return "PERFECT";
        if (cv === 5) return "OKAY";
        return "RAW";
    } else {
        if (cv >= 7) return "BURNT";
        if (cv === 6) return "PERFECT";
        if (cv === 5) return "OKAY";
        return "RAW";
    }
}

function canMeat(playerId) { return state.players[playerId - 1].meat < 2; }
function canPut(playerId, laneId) {
    const lane = state.lanes.find(l => l.id === laneId);
    return state.players[playerId - 1].meat > 0 && lane && lane.owner === null;
}
function canUchiwa(playerId, laneId) { return state.lanes.find(l => l.id === laneId).owner !== null; }
function canServe(playerId, laneIndex) {
    const lane = state.lanes[laneIndex];
    if (!lane || !lane.owner) return false;
    const status = getCookStatus(lane);
    if (status === "RAW" || status === "BURNT") return false;
    if (lane.owner !== playerId && state.players[playerId - 1].meat < 1) return false;
    return true;
}
function canDiscard(playerId, laneIndex) {
    const lane = state.lanes[laneIndex];
    return lane && lane.owner !== null && getCookStatus(lane) === "BURNT";
}

function actionMeat(playerId) {
    if (!canMeat(playerId)) return false;
    state.players[playerId - 1].meat += 1;
    state.visuals.floaters.push({ type: 'meat_up', targetType: playerId === 1 ? 'p1' : 'p2', startTime: performance.now() });
    endTurn();
    return true;
}

function actionPut(playerId, laneId) {
    if (!canPut(playerId, laneId)) return false;
    const lane = state.lanes.find(l => l.id === laneId);
    state.players[playerId - 1].meat -= 1;
    state.visuals.floaters.push({ type: 'meat_down', targetType: playerId === 1 ? 'p1' : 'p2', startTime: performance.now() });
    lane.owner = playerId; lane.cook = 0; lane.uchiwaBoost = 0; lane.justPlaced = true;
    state.visuals.placedAt[laneId] = performance.now();
    endTurn();
    return true;
}

function actionUchiwa(playerId, laneId) {
    if (!canUchiwa(playerId, laneId)) return false;
    state.lanes.find(l => l.id === laneId).uchiwaBoost += 1;
    endTurn();
    return true;
}

function actionServe(playerId, laneIndex) {
    if (!canServe(playerId, laneIndex)) return false;
    const player = state.players[playerId - 1];
    const lane = state.lanes[laneIndex];
    const status = getCookStatus(lane);
    if (lane.owner !== playerId) {
        player.meat -= 1;
        state.visuals.floaters.push({ type: 'meat_down', targetType: playerId === 1 ? 'p1' : 'p2', startTime: performance.now() });
    }
    let points = 0;
    if (status === "PERFECT") points = (lane.type === "weak") ? 12 : (lane.type === "strong" ? 6 : 8);
    else if (status === "OKAY") points = (lane.type === "weak") ? 3 : 2;
    player.score += points;
    if (points > 0) {
        state.visuals.floaters.push({ type: 'star_up', amount: points, targetType: 'lane', targetIndex: laneIndex, color: status === "PERFECT" ? "#ff4" : "#f90", startTime: performance.now() });
    }
    state.visuals.ghosts.push({ laneIndex, status, startTime: performance.now() });
    lane.owner = null; lane.cook = 0; lane.uchiwaBoost = 0; lane.justPlaced = false;
    endTurn();
    return true;
}

function actionDiscard(playerId, laneIndex) {
    if (!canDiscard(playerId, laneIndex)) return false;
    const lane = state.lanes[laneIndex];
    state.visuals.ghosts.push({ laneIndex, status: "BURNT", startTime: performance.now() });
    lane.owner = null; lane.cook = 0; lane.uchiwaBoost = 0; lane.justPlaced = false;
    endTurn();
    return true;
}

// ==========================================
// 5. game/input.js - 入力処理
// ==========================================
function isPlayerInputLocked() {
    return state.screen !== "game" || state.currentPlayer !== 1 || state.isBusy || 
           state.pendingPlayer !== null || state.turnSplashTimer > 0 || state.gameOver;
}

function canSelectAction(actionId) {
    if (actionId === "meat") return canMeat(1);
    for (let i = 0; i < state.lanes.length; i++) {
        if (isLaneValidForAction(i, actionId)) return true;
    }
    return false;
}

function isLaneValidForAction(laneIndex, actionId) {
    const laneId = state.lanes[laneIndex].id;
    if (actionId === "put") return canPut(1, laneId);
    if (actionId === "uchiwa") return canUchiwa(1, laneId);
    if (actionId === "harvest") return canServe(1, laneIndex) || canDiscard(1, laneIndex);
    return false;
}

// ★変更: 画面サイズと描画サイズが1:1になったため、スケール計算を省きタッチ判定をシンプル化
function handleCanvasClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (state.screen === "title") { startSurvivalGame(); return; }
    else if (state.screen === "gameover") { state.screen = "title"; return; }
    if (isPlayerInputLocked()) return;

    for (let i = 0; i < LAYOUT.BUTTONS.length; i++) {
        const b = getButtonBounds(i);
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
            handleActionButtonClick(LAYOUT.BUTTONS[i].id);
            return;
        }
    }
    if (state.buildMode) {
        for (let i = 0; i < state.lanes.length; i++) {
            const l = getLaneBounds(i);
            // 余白を含めて少し大きめに判定(スマホで押しやすく)
            const padding = 10;
            if (x >= l.x - padding && x <= l.x + l.w + padding && y >= l.y - padding && y <= l.y + l.h + padding) {
                tryExecuteSelectedAction(i);
                return;
            }
        }
        state.buildMode = null;
    }
}

function handleActionButtonClick(actionId) {
    if (!canSelectAction(actionId)) { state.visuals.buttonErrors[actionId] = performance.now(); return; }
    state.visuals.buttonClicks[actionId] = performance.now();
    if (actionId === "meat") { actionMeat(1); state.buildMode = null; } 
    else { state.buildMode = (state.buildMode === actionId) ? null : actionId; }
}

function tryExecuteSelectedAction(laneIndex) {
    if (!isLaneValidForAction(laneIndex, state.buildMode)) { state.visuals.laneErrors[laneIndex] = performance.now(); return; }
    const laneId = state.lanes[laneIndex].id;
    const actionId = state.buildMode;
    state.visuals.laneFlashes[laneId] = performance.now();
    let success = false;
    if (actionId === "put") success = actionPut(1, laneId);
    else if (actionId === "uchiwa") success = actionUchiwa(1, laneId);
    else if (actionId === "harvest") {
        if (canServe(1, laneIndex)) success = actionServe(1, laneIndex);
        else if (canDiscard(1, laneIndex)) success = actionDiscard(1, laneIndex);
    }
    if (success) state.buildMode = null;
}

// ==========================================
// 6. game/ai.js - AIロジック
// ==========================================
function playAITurn() {
    if (!(state.screen === "game" && state.currentPlayer === 2 && !state.isBusy && !state.gameOver && 
        !state.pendingTurnSplash && state.pendingPlayer === null && state.turnSplashTimer === 0 && state.aiBreathTimer === 0)) return;
    state.isBusy = true;
    setTimeout(() => {
        const candidates = [{ type: "meat" }];
        state.lanes.forEach((lane, index) => {
            candidates.push({ type: "put", laneIndex: index, laneId: lane.id });
            candidates.push({ type: "serve", laneIndex: index, laneId: lane.id });
            candidates.push({ type: "discard", laneIndex: index, laneId: lane.id });
            candidates.push({ type: "uchiwa", laneIndex: index, laneId: lane.id });
        });
        const valid = candidates.filter(a => {
            if (a.type === "meat") return canMeat(2);
            if (a.type === "put") return canPut(2, a.laneId);
            if (a.type === "serve") return canServe(2, a.laneIndex);
            if (a.type === "discard") return canDiscard(2, a.laneIndex);
            if (a.type === "uchiwa") return canUchiwa(2, a.laneId);
            return false;
        });
        let best = { type: "meat" }; let bs = -999;
        valid.forEach(a => {
            let s = Math.random() * 10;
            if (a.type === "serve") s += 100; if (a.type === "put") s += 50;
            if (s > bs) { bs = s; best = a; }
        });
        if (best.type === "meat") actionMeat(2);
        else if (best.type === "put") actionPut(2, best.laneId);
        else if (best.type === "serve") actionServe(2, best.laneIndex);
        else if (best.type === "discard") actionDiscard(2, best.laneIndex);
        else if (best.type === "uchiwa") actionUchiwa(2, best.laneId);
        state.isBusy = false;
    }, 600);
}

// ==========================================
// 7. render/render.js - 描画処理
// ==========================================
const getTime = () => performance.now();
const getWave = (speed, offset = 0) => Math.sin(getTime() * speed + offset);

function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId]; if (!data) return;
    ctx.fillStyle = color;
    for (let i = 0; i < 64; i++) {
        if (data[i] === 1) {
            const x = (i % 8) * scale; const y = Math.floor(i / 8) * scale;
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
    
    // ★変更: 画面中央を動的に取得
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2;

    if (state.screen === "title") {
        ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN; ctx.font = "bold 32px monospace"; ctx.textAlign = "center";
        ctx.fillText("YAKITORI WARS", cx, cy - 50);
        ctx.font = "20px monospace"; ctx.fillText("Tap to Start", cx, cy + 20);
    } else if (state.screen === "game") {
        drawGameScreen(ctx);
    } else if (state.screen === "gameover") {
        ctx.fillStyle = "#fff"; ctx.font = "bold 36px monospace"; ctx.textAlign = "center";
        ctx.fillText("GAME OVER", cx, cy - 30);
        ctx.font = "24px monospace";
        ctx.fillText(`WINNER: ${state.winner}`, cx, cy + 20);
        ctx.font = "16px monospace";
        ctx.fillText("Tap to Retry", cx, cy + 80);
    }
}

function drawGameScreen(ctx) {
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    
    // ★変更: ヘッダーパネル(P1/P2/ラウンド)を画面サイズに合わせて配置
    const panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25);
    const panelH = 60;
    const safeTop = 15;
    
    drawPlayerPanel(ctx, state.players[0], 10, safeTop, panelW, panelH, 1);
    drawPlayerPanel(ctx, state.players[1], LAYOUT.CANVAS_WIDTH - panelW - 10, safeTop, panelW, panelH, 2);
    
    ctx.fillStyle = "#fff"; ctx.font = "bold 20px monospace"; ctx.textAlign = "center";
    ctx.fillText(`ROUND ${state.round}`, cx, safeTop + 25);
    ctx.font = "16px monospace"; ctx.fillText(state.enemyName, cx, safeTop + 50);

    // ★変更: 焼き台の描画(縦向きにデザインし直し)
    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i); const now = getTime();
        ctx.fillStyle = LAYOUT.COLORS.PANEL_BG; ctx.fillRect(b.x, b.y, b.w, b.h);
        
        if (state.buildMode && isLaneValidForAction(i, state.buildMode)) {
            ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(b.x, b.y, b.w, b.h);
        }
        ctx.strokeStyle = "#444"; ctx.strokeRect(b.x, b.y, b.w, b.h);
        
        const laneCx = b.x + b.w/2;
        
        if (lane.owner) {
            const p = getVisualPalette(getCookStatus(lane));
            // 串を縦方向に配置
            const stickH = b.h * 0.7;
            const stickTop = b.y + b.h * 0.1;
            ctx.fillStyle = LAYOUT.COLORS.STICK; ctx.fillRect(laneCx-2, stickTop, 4, stickH);
            
            const meatW = b.w * 0.6;
            const meatH = stickH * 0.2;
            const meatX = laneCx - meatW/2;
            
            ctx.fillStyle = p.meat; ctx.fillRect(meatX, stickTop + stickH*0.1, meatW, meatH);
            ctx.fillStyle = p.negi; ctx.fillRect(meatX, stickTop + stickH*0.35, meatW, meatH);
            ctx.fillStyle = p.meat; ctx.fillRect(meatX, stickTop + stickH*0.6, meatW, meatH);
        }

        // 火力アイコン(🔥)を下部に表示
        ctx.fillStyle = "#fff";
        ctx.font = "14px sans-serif";
        ctx.fillText("🔥".repeat(lane.fire), laneCx, b.y + b.h - 10);
    });

    // ★変更: ボタンの描画(ラベル付きで分かりやすく)
    LAYOUT.BUTTONS.forEach((btn, i) => {
        const b = getButtonBounds(i);
        const canUse = canSelectAction(btn.id) && !isPlayerInputLocked();
        ctx.fillStyle = canUse ? btn.color : "#445";
        ctx.fillRect(b.x, b.y, b.w, b.h);
        
        if (state.buildMode === btn.id) { 
            ctx.strokeStyle = "#fff"; ctx.lineWidth = 4; ctx.strokeRect(b.x, b.y, b.w, b.h); 
        }
        
        // アイコンとテキストを縦に並べる
        drawDotIcon(ctx, btn.icon, b.x + b.w/2, b.y + b.h/2 - 10, canUse ? "#fff" : "#888", 3);
        ctx.fillStyle = canUse ? "#fff" : "#aaa";
        ctx.font = "bold 14px monospace";
        ctx.fillText(btn.label, b.x + b.w/2, b.y + b.h - 10);
    });

    // オーバーレイ(ターンスプラッシュ等)
    if (state.turnSplashTimer > 0) {
        ctx.fillStyle = LAYOUT.COLORS.OVERLAY_BG; ctx.fillRect(0,0,LAYOUT.CANVAS_WIDTH,LAYOUT.CANVAS_HEIGHT);
        ctx.fillStyle = "#fff"; ctx.font = "bold 32px monospace"; 
        ctx.fillText("NEXT CHEF", cx, LAYOUT.CANVAS_HEIGHT / 2);
    }
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx) {
    const active = state.currentPlayer === idx;
    ctx.fillStyle = LAYOUT.COLORS.PANEL_BG; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = active ? (idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2) : "#444";
    ctx.lineWidth = active ? 4 : 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#fff"; ctx.font = "bold 14px monospace"; ctx.textAlign = "center";
    ctx.fillText(`P${idx}`, x+w/2, y+20);
    ctx.font = "12px monospace";
    ctx.fillText(`SCORE:${player.score}`, x+w/2, y+38);
    ctx.fillText(`MEAT:${player.meat}`, x+w/2, y+54);
}

// ==========================================
// 8. main.js - セットアップとスマホ対応
// ==========================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.backgroundColor = "#111";
document.body.style.height = "100vh";
document.body.style.overflow = "hidden";
document.body.style.touchAction = "none"; // スクロール・ズーム防止

// ★変更: 画面サイズを論理サイズとして適用し、縦画面でもピッタリ収まるようにします
function resize() {
    const dpr = window.devicePixelRatio || 1;
    // iOS Safari などのバー領域を考慮した安全な高さを取得
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

// 入力イベントの統合
canvas.addEventListener('click', (e) => handleCanvasClick(e, canvas));
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const simulatedEvent = { clientX: touch.clientX, clientY: touch.clientY };
    handleCanvasClick(simulatedEvent, canvas);
}, { passive: false });

function loop() {
    resolvePendingTurnFlow();
    render(ctx);
    playAITurn();
    requestAnimationFrame(loop);
}

loop();
