
// ===== game/state.js =====
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
  aiBreathTimer: 0, // ★追加: AIターン開始時の「間」
  
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

  // ★追加: 描画エフェクト用のタイムスタンプや一時データ
  visuals: {
      buttonClicks: {},
      buttonErrors: {},
      laneErrors: {},
      laneFlashes: {},
      placedAt: {},
      ghosts: [],
      floaters: []
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

// ===== render/layout.js =====
const LAYOUT = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  
  COLORS: {
      BG: "#161620", 
      TEXT_MAIN: "#fff",
      TEXT_DIM: "#aaa",
      P1: "#3c96ff",
      P2: "#ff5078",
      NEUTRAL: "#333",
      PANEL_BG: "#242430",
      OVERLAY_BG: "rgba(0, 0, 0, 0.7)",
      STICK: "#dca",
      FIRE_BASE: "#e53",
      FIRE_BOOST: "#fa3",
      DOT_OFF: "#334",
      HIGHLIGHT: "rgba(255, 255, 255, 0.4)"
  },

  // テキストラベルを廃止し、アイコンIDを指定
  BUTTONS: [
      { id: "meat", color: "#c55", icon: "meat" },
      { id: "put", color: "#678", icon: "put" },
      { id: "harvest", color: "#484", icon: "serve" },
      { id: "uchiwa", color: "#d63", icon: "uchiwa" }
  ]
};

// 視覚状態の定義（テキストを使わず色とエフェクトで表現）
const VISUAL_STATES = {
  RAW: { meat: "#ddd", negi: "#bdf", dot: "#fff", effect: "none" },
  OKAY: { meat: "#853", negi: "#683", dot: "#f90", effect: "none" },
  PERFECT: { meat: "#da4", negi: "#8e2", dot: "#ff4", effect: "spark" },
  BURNT: { meat: "#222", negi: "#111", dot: "#f33", effect: "smoke" }
};

function getVisualPalette(status) {
  return VISUAL_STATES[status] || VISUAL_STATES.RAW;
}

// 8x8の簡易ドット絵データ (1:色あり, 0:透明)
const ICON_DATA = {
  meat: [
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,0,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0,
    1,0,0,0,0,0,0,1,
    0,1,0,0,0,0,1,0
  ],
  put: [
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,0,0,0,0,0
  ],
  serve: [
    0,0,1,1,1,1,0,0,
    0,1,1,1,1,1,1,0,
    1,1,0,1,1,0,1,1,
    1,1,1,1,1,1,1,1,
    1,1,0,1,1,0,1,1,
    0,1,1,1,1,1,1,0,
    0,0,1,1,1,1,0,0,
    0,0,0,0,0,0,0,0
  ],
  uchiwa: [
    0,1,1,1,1,1,1,0,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1,
    0,1,1,1,1,1,1,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0,
    0,0,0,1,1,0,0,0
  ]
};

function getLaneBounds(index) {
  const w = 600;
  const h = 90;
  const x = (LAYOUT.CANVAS_WIDTH - w) / 2;
  const y = 170 + index * (h + 15);
  return { x, y, w, h };
}

function getButtonBounds(index) {
  const count = LAYOUT.BUTTONS.length;
  const w = 120; // ドットUIに合わせて少しコンパクトに
  const h = 80;
  const gap = 20;
  const totalW = (w * count) + (gap * (count - 1));
  const startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2;
  const y = 500;
  return { x: startX + index * (w + gap), y, w, h };
}

// ===== game/flow.js =====

function getEnemyNameByStage(stage) {
    const enemies = { 1: "KENTA", 2: "HIDEKI", 3: "MAKOTO", 4: "TETSUYA" };
    return enemies[stage] || "KENTA";
}

function setupStage(stage) {
    state.currentStage = stage;
    state.enemyName = getEnemyNameByStage(stage);
}

function startSurvivalGame() {
    state.gameMode = "survival";
    state.screen = "game";
    setupStage(1);
    resetGameState();
}

function goToNextStage() {
    setupStage(state.currentStage + 1);
    resetGameState();
    state.screen = "game";
}

function endTurn() {
    const nextP = state.currentPlayer === 1 ? 2 : 1;
    if (state.currentPlayer === 2) {
        advanceRound();
        if (state.gameOver) return;
    }
    state.pendingPlayer = nextP;
    state.pendingTurnSplash = true;
    if (nextP === 2) {
        state.pendingAiBreath = true;
    }
}

function advanceRound() {
    state.lanes.forEach(lane => {
        if (lane.owner !== null) {
            if (lane.justPlaced) lane.justPlaced = false;
            else {
                lane.cook += (lane.fire + lane.uchiwaBoost);
                // 8 = 完全に焦げた状態。それ以上はカウントしないことを明示
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
    // 演出を90フレーム(約1.5秒)に延ばし、フェードイン・アウトの余裕を持たせる
    if (state.pendingTurnSplash) {
        state.turnSplashTimer = 90; 
        state.pendingTurnSplash = false;
    }

    if (state.turnSplashTimer > 0) {
        state.turnSplashTimer--;
    } else if (state.pendingPlayer !== null) {
        state.currentPlayer = state.pendingPlayer;
        state.pendingPlayer = null;
        if (state.pendingAiBreath) {
            state.aiBreathTimer = 15; // ★追加: AI思考開始前に約0.25秒の間を空ける
            state.pendingAiBreath = false;
        }
    } else if (state.aiBreathTimer > 0) {
        state.aiBreathTimer--;
    }
}

// ===== game/rules.js =====

function getCookStatus(lane) {
    const cv = lane.cook;
    const isWeak = (lane.type === "weak");
    
    // ルールの完全統一
    if (isWeak) {
        if (cv >= 8) return "BURNT";
        if (cv >= 6) return "PERFECT"; // 6〜7
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

function canUchiwa(playerId, laneId) { 
    return state.lanes.find(l => l.id === laneId).owner !== null;
}

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
    // 肉上昇エフェクト
    state.visuals.floaters.push({ type: 'meat_up', targetType: playerId === 1 ? 'p1' : 'p2', startTime: performance.now() });
    endTurn();
    return true;
}

function actionPut(playerId, laneId) {
    if (!canPut(playerId, laneId)) return false;
    const lane = state.lanes.find(l => l.id === laneId);
    state.players[playerId - 1].meat -= 1;
    
    // 肉落下エフェクト
    state.visuals.floaters.push({ type: 'meat_down', targetType: playerId === 1 ? 'p1' : 'p2', startTime: performance.now() });
    
    lane.owner = playerId;
    lane.cook = 0;
    lane.uchiwaBoost = 0;
    lane.justPlaced = true;
    
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
    
    // スコア上昇エフェクト（星）
    if (points > 0) {
        state.visuals.floaters.push({ type: 'star_up', amount: points, targetType: 'lane', targetIndex: laneIndex, color: status === "PERFECT" ? "#ff4" : "#f90", startTime: performance.now() });
    }
    
    state.visuals.ghosts.push({ laneIndex, status, startTime: performance.now() });
    
    lane.owner = null;
    lane.cook = 0;
    lane.uchiwaBoost = 0;
    lane.justPlaced = false;
    endTurn();
    return true;
}

function actionDiscard(playerId, laneIndex) {
    if (!canDiscard(playerId, laneIndex)) return false;
    const lane = state.lanes[laneIndex];
    state.visuals.ghosts.push({ laneIndex, status: "BURNT", startTime: performance.now() });
    
    lane.owner = null;
    lane.cook = 0;
    lane.uchiwaBoost = 0;
    lane.justPlaced = false;
    endTurn();
    return true;
}

// ===== game/input.js =====

function isPlayerInputLocked() {
    return state.screen !== "game" ||
           state.currentPlayer !== 1 ||
           state.isBusy ||
           state.pendingPlayer !== null ||
           state.turnSplashTimer > 0 ||
           state.gameOver;
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

function handleCanvasClick(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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
            if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) {
                tryExecuteSelectedAction(i);
                return;
            }
        }
        state.buildMode = null;
    }
}

function handleActionButtonClick(actionId) {
    if (!canSelectAction(actionId)) {
        state.visuals.buttonErrors[actionId] = performance.now(); // ★失敗フィードバック
        return;
    }
    
    state.visuals.buttonClicks[actionId] = performance.now(); // ★クリックフィードバック

    if (actionId === "meat") {
        actionMeat(1);
        state.buildMode = null; 
    } else {
        state.buildMode = (state.buildMode === actionId) ? null : actionId;
    }
}

function tryExecuteSelectedAction(laneIndex) {
    if (!isLaneValidForAction(laneIndex, state.buildMode)) {
        state.visuals.laneErrors[laneIndex] = performance.now(); // ★レーンエラー振動
        return;
    }

    const laneId = state.lanes[laneIndex].id;
    const actionId = state.buildMode;
    
    // ★レーン選択成功時のフラッシュ
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

// ===== game/ai.js =====

function canStartAITurn() {
    return state.screen === "game" &&
           state.currentPlayer === 2 &&
           !state.isBusy &&
           !state.gameOver &&
           !state.pendingTurnSplash &&
           state.pendingPlayer === null &&
           state.turnSplashTimer === 0 &&
           state.aiBreathTimer === 0; // ★追加: 息継ぎが終わるまで待つ
}

function playAITurn() {
    if (!canStartAITurn()) return;
    
    state.isBusy = true;
    const personality = getCurrentAIPersonality();
    
    // AIターンの開始が分かりやすいよう、少しThinking...を見せる
    setTimeout(() => {
        const bestAction = chooseBestAction(personality);
        executeAction(bestAction);
        state.isBusy = false;
    }, 600);
}

function getCurrentAIPersonality() {
    if (state.enemyName === "KENTA") return "gambler";
    if (state.enemyName === "HIDEKI") return "thief";
    if (state.enemyName === "MAKOTO") return "master";
    if (state.enemyName === "TETSUYA") return "reader";
    return "gambler";
}

function chooseBestAction(personality) {
    const candidates = buildCandidates();
    const validActions = candidates.filter(isValid);
    let bestScore = -9999;
    let bestAction = { type: "meat" };
    validActions.forEach(action => {
        let score = scoreAction(action, personality);
        score += (Math.random() * 6 - 3);
        if (score > bestScore) {
            bestScore = score;
            bestAction = action;
        }
    });
    return bestAction;
}

function buildCandidates() {
    const actions = [{ type: "meat" }];
    state.lanes.forEach((lane, index) => {
        actions.push({ type: "put", laneIndex: index, laneId: lane.id });
        actions.push({ type: "serve", laneIndex: index, laneId: lane.id });
        actions.push({ type: "discard", laneIndex: index, laneId: lane.id });
        actions.push({ type: "uchiwa", laneIndex: index, laneId: lane.id });
    });
    return actions;
}

function isValid(action) {
  if (action.type === "meat") return canMeat(2);
  if (action.type === "put") return canPut(2, action.laneId);
  if (action.type === "serve") return canServe(2, action.laneIndex);
  if (action.type === "discard") return canDiscard(2, action.laneIndex);
  if (action.type === "uchiwa") return canUchiwa(2, action.laneId);
  return false;
}

function executeAction(action) {
    if (action.type === "meat") actionMeat(2);
    else if (action.type === "put") actionPut(2, action.laneId);
    else if (action.type === "serve") actionServe(2, action.laneIndex);
    else if (action.type === "discard") actionDiscard(2, action.laneIndex);
    else if (action.type === "uchiwa") actionUchiwa(2, action.laneId);
}

function scoreAction(action, personality) {
    let score = 0;
    
    if (action.type === "meat") score = 10;
    if (action.type === "put") score = 20;
    if (action.type === "serve") {
        const status = getCookStatus(state.lanes[action.laneIndex]);
        if (status === "PERFECT") score = 100;
        if (status === "OKAY") score = 30;
    }
    if (action.type === "uchiwa") score = 15;
    if (action.type === "discard") score = 5;

    // ★ AIの未来予測ロジックを追加
    // ServeとDiscard以外（ターンを消費する行動）を選んだ場合、次ターンに串がどうなるか評価
    if (action.type !== "serve" && action.type !== "discard") {
        state.lanes.forEach(lane => {
            if (lane.owner === 2) { // AI自身の串
                const isWeak = (lane.type === "weak");
                const nextCook = lane.cook + lane.fire; // 次のターンの予測値
                
                // 次ターンでPERFECTになるなら高評価
                if (nextCook === 6 || (isWeak && nextCook === 7)) {
                    score += 80; 
                }
                // 次ターンで焦げるなら強いマイナス評価（回収を優先させる）
                if (!isWeak && nextCook >= 7) {
                    score -= 100;
                }
                if (isWeak && nextCook >= 8) {
                    score -= 100;
                }
            }
        });
    }

    return score;
}

// ===== render/render.js =====

const getTime = () => performance.now();
const getWave = (speed, offset = 0) => Math.sin(getTime() * speed + offset);

// ドットアイコン描画関数
function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId];
    if (!data) return;
    ctx.fillStyle = color;
    for (let i = 0; i < 64; i++) {
        if (data[i] === 1) {
            const x = (i % 8) * scale;
            const y = Math.floor(i / 8) * scale;
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

    if (state.screen === "title") drawTitleScreen(ctx);
    else if (state.screen === "game") drawGameScreen(ctx);
    else if (state.screen === "gameover") drawGameOverScreen(ctx);
}

function drawTitleScreen(ctx) {
    ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN;
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.fillText("YAKITORI WARS", LAYOUT.CANVAS_WIDTH / 2, LAYOUT.CANVAS_HEIGHT / 2 - 50);
    ctx.font = "24px monospace";
    ctx.fillStyle = (Math.floor(Date.now() / 500) % 2 === 0) ? LAYOUT.COLORS.TEXT_MAIN : LAYOUT.COLORS.TEXT_DIM;
    ctx.fillText("Click to Start: SURVIVAL", LAYOUT.CANVAS_WIDTH / 2, LAYOUT.CANVAS_HEIGHT / 2 + 50);
}

function drawGameOverScreen(ctx) {
    ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN;
    ctx.font = "40px monospace";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", LAYOUT.CANVAS_WIDTH / 2, LAYOUT.CANVAS_HEIGHT / 2 - 50);
    ctx.fillStyle = state.winner === "P1" ? LAYOUT.COLORS.P1 : (state.winner === "P2" ? LAYOUT.COLORS.P2 : LAYOUT.COLORS.TEXT_MAIN);
    ctx.fillText(`WINNER: ${state.winner}`, LAYOUT.CANVAS_WIDTH / 2, LAYOUT.CANVAS_HEIGHT / 2 + 20);
    ctx.font = "20px monospace";
    ctx.fillStyle = LAYOUT.COLORS.TEXT_DIM;
    ctx.fillText("Click to return Title", LAYOUT.CANVAS_WIDTH / 2, LAYOUT.CANVAS_HEIGHT / 2 + 80);
}

function drawGameScreen(ctx) {
    drawTopBar(ctx);
    state.lanes.forEach((lane, i) => {
        const bounds = getLaneBounds(i);
        drawLane(ctx, lane, bounds, i);
    });
    drawActionButtons(ctx);
    drawVisualEffects(ctx);
    drawOverlay(ctx);
}

function drawTopBar(ctx) {
    drawPlayerPanel(ctx, state.players[0], 20, 20, 140, 70, 1);
    ctx.fillStyle = LAYOUT.COLORS.PANEL_BG;
    ctx.fillRect(180, 20, 440, 50);
    ctx.strokeStyle = LAYOUT.COLORS.NEUTRAL;
    ctx.strokeRect(180, 20, 440, 50);
    
    ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN;
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`ROUND  ${state.round}`, LAYOUT.CANVAS_WIDTH / 2, 53);
    if (state.enemyName) {
        ctx.font = "18px monospace";
        ctx.fillText(state.enemyName, LAYOUT.CANVAS_WIDTH / 2, 100);
    }
    drawPlayerPanel(ctx, state.players[1], 640, 20, 140, 70, 2);
}

function drawPlayerPanel(ctx, player, x, y, w, h, playerIndex) {
    const isActive = (state.currentPlayer === playerIndex);
    const pColor = playerIndex === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
    
    ctx.fillStyle = LAYOUT.COLORS.PANEL_BG;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = isActive ? pColor : LAYOUT.COLORS.NEUTRAL;
    ctx.lineWidth = isActive ? 3 : 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = pColor;
    ctx.font = "bold 20px monospace";
    ctx.textAlign = "center";
    ctx.fillText(`P${playerIndex}`, x + w / 2, y + 25);
    ctx.fillStyle = LAYOUT.COLORS.TEXT_MAIN;
    ctx.font = "14px monospace";
    ctx.fillText(`SCORE: ${player.score}`, x + w / 2, y + 45);
    ctx.fillText(`MEAT : ${player.meat}`, x + w / 2, y + 60);
}

function drawActionButtons(ctx) {
    const isLocked = isPlayerInputLocked();
    const now = getTime();

    LAYOUT.BUTTONS.forEach((btn, i) => {
        let {x, y, w, h} = getButtonBounds(i);
        const canUse = canSelectAction(btn.id) && !isLocked;
        const isSelected = (state.buildMode === btn.id);
        
        const tClick = now - (state.visuals.buttonClicks[btn.id] || 0);
        const tErr = now - (state.visuals.buttonErrors[btn.id] || 0);

        ctx.save();
        
        // エラー時の横振動
        if (tErr < 300) {
            x += Math.sin(tErr * 0.1) * 2;
        }

        // クリック時の沈み込みとスケール
        let isPressed = false;
        if (tClick < 100) {
            const scale = 0.95;
            ctx.translate(x + w/2, y + h/2);
            ctx.scale(scale, scale);
            ctx.translate(-(x + w/2), -(y + h/2));
            y += 2; // Y方向に沈む
            isPressed = true;
        }

        // 無効状態の彩度低下
        ctx.fillStyle = canUse ? btn.color : "#445";
        ctx.fillRect(x, y, w, h);
        
        ctx.lineWidth = isSelected ? 4 : 2;
        ctx.strokeStyle = isSelected ? "#fff" : "#222";
        ctx.strokeRect(x, y, w, h);

        // クリック時の発光
        if (isPressed) {
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.fillRect(x, y, w, h);
        }

        // ドットアイコンの描画
        const iconColor = canUse ? "#fff" : "#778";
        drawDotIcon(ctx, btn.icon, x + w/2, y + h/2, iconColor, 5);
        
        ctx.restore();
    });
}

function drawLane(ctx, lane, bounds, index) {
    let {x, y, w, h} = bounds;
    const now = getTime();
    const tErr = now - (state.visuals.laneErrors[index] || 0);

    ctx.save();
    
    // RAW失敗時の青い小さな震え
    if (tErr < 300) {
        x += Math.sin(tErr * 0.1) * 3;
        ctx.fillStyle = "rgba(100, 150, 255, 0.2)";
        ctx.fillRect(x, y, w, h);
    }

    const cx = x + w / 2;
    drawLaneBase(ctx, x, y, w, h, index);

    // 選択時のフラッシュ
    const tFlash = now - (state.visuals.laneFlashes[lane.id] || 0);
    if (tFlash < 150) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 - (tFlash / 150) * 0.5})`;
        ctx.fillRect(x, y, w, h);
    }

    drawFireIcons(ctx, lane, cx, y + h - 15);
    
    if (lane.owner !== null) {
        const status = getCookStatus(lane);
        const palette = getVisualPalette(status);
        
        drawOwnerMarker(ctx, lane, cx, y + 15);
        drawSkewer(ctx, lane, palette, cx, y + h / 2);
        
        // 状態エフェクト
        if (palette.effect === "spark") drawSparks(ctx, cx, y + h / 2);
        if (palette.effect === "smoke") drawSmoke(ctx, cx, y + h / 2 - 20, true);
        
        drawCookDots(ctx, lane, palette, cx + 40, y + h / 2 - 10);
    }
    ctx.restore();
}

function drawLaneBase(ctx, x, y, w, h, index) {
    ctx.fillStyle = LAYOUT.COLORS.PANEL_BG;
    ctx.fillRect(x, y, w, h);
    if (state.buildMode && isLaneValidForAction(index, state.buildMode)) {
        ctx.fillStyle = LAYOUT.COLORS.HIGHLIGHT;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = "white";
    } else {
        ctx.strokeStyle = LAYOUT.COLORS.NEUTRAL;
    }
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
}

function drawFireIcons(ctx, lane, cx, bottomY) {
    const fireCount = lane.fire;
    const isBoosted = lane.uchiwaBoost > 0;
    const fireColor = isBoosted ? LAYOUT.COLORS.FIRE_BOOST : LAYOUT.COLORS.FIRE_BASE;
    let baseSize = isBoosted ? 14 : 10;
    if (isBoosted) baseSize += getWave(0.015) * 2;
    const spacing = 20;
    const startX = cx - ((fireCount - 1) * spacing) / 2;
    ctx.fillStyle = fireColor;
    for (let i = 0; i < fireCount; i++) {
        const fx = startX + i * spacing;
        const waveY = getWave(0.01, i * 2) * 3;
        const waveX = getWave(0.015, i * 3) * 1.5;
        ctx.beginPath();
        ctx.moveTo(fx, bottomY - (baseSize + waveY));
        ctx.lineTo(fx - (baseSize / 1.5 + waveX), bottomY);
        ctx.lineTo(fx + (baseSize / 1.5 + waveX), bottomY);
        ctx.fill();
    }
}

function drawSkewer(ctx, lane, palette, cx, cy) {
    const tPut = getTime() - (state.visuals.placedAt[lane.id] || 0);
    let scale = 1.0;
    if (tPut < 200) {
        const p = tPut / 200;
        scale = 0.5 + Math.sin(p * Math.PI / 2) * 0.6; 
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    ctx.fillStyle = LAYOUT.COLORS.STICK;
    ctx.fillRect(cx - 2, cy - 35, 4, 75);
    let glowAlpha = palette.effect === "spark" ? 0.5 + getWave(0.008) * 0.4 : 0.5;
    
    const drawBlock = (yOffset, color, isBurnt, isGlow) => {
        ctx.fillStyle = color;
        ctx.fillRect(cx - 15, cy + yOffset, 30, 16);
        if (isGlow) {
            ctx.strokeStyle = `rgba(255, 255, 200, ${glowAlpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(cx - 14, cy + yOffset + 1, 28, 14);
        }
        if (isBurnt) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(cx - 10, cy + yOffset + 4, 8, 4);
            ctx.fillRect(cx + 2, cy + yOffset + 8, 6, 4);
        }
    };
    
    const isBurnt = palette.effect === "smoke";
    const isGlow = palette.effect === "spark";
    
    drawBlock(-25, palette.meat, isBurnt, isGlow);
    drawBlock(-5, palette.negi, isBurnt, isGlow);
    drawBlock(15, palette.meat, isBurnt, isGlow);
    
    ctx.restore();
}

function drawSparks(ctx, cx, cy) {
    const t = getTime();
    if (t % 200 < 100) return; // 点滅
    ctx.fillStyle = "#ff4";
    ctx.fillRect(cx - 30 + Math.random()*60, cy - 20 + Math.random()*40, 4, 4);
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx - 30 + Math.random()*60, cy - 20 + Math.random()*40, 4, 4);
}

function drawSmoke(ctx, cx, startY, blinkRed = false) {
    const t = getTime();
    
    // 赤点滅 (BURNT)
    if (blinkRed && t % 300 < 150) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        ctx.fillRect(cx - 20, startY, 40, 40);
    }
    
    for (let i = 0; i < 2; i++) {
        const progress = ((t + i * 750) % 1500) / 1500;
        ctx.fillStyle = `rgba(50, 50, 50, ${(1.0 - progress) * 0.6})`;
        ctx.beginPath();
        ctx.arc(cx + Math.sin(progress * Math.PI * 2) * 8, startY - progress * 30, 4 + progress * 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawCookDots(ctx, lane, palette, startX, startY) {
    const isWeak = (lane.type === "weak");
    const cv = lane.cook;
    
    for (let i = 0; i < 6; i++) {
        let dotColor = i < Math.min(cv, 6) ? palette.dot : LAYOUT.COLORS.DOT_OFF;
        
        // Weakレーンの「2段階光る」表現
        if (isWeak && i >= 5 && cv >= 6 && cv < 8) {
            if (getTime() % 400 < 200) dotColor = "#fff"; 
        }
        
        ctx.fillStyle = dotColor;
        ctx.fillRect(startX + (i % 2) * 10, startY - Math.floor(i / 2) * 10, 6, 6);
    }
}

function drawOwnerMarker(ctx, lane, cx, topY) {
    const drawY = topY + getWave(0.005, lane.fire) * 3;
    ctx.fillStyle = lane.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
    ctx.beginPath();
    ctx.moveTo(cx - 6, drawY);
    ctx.lineTo(cx + 6, drawY);
    ctx.lineTo(cx, drawY + 8);
    ctx.fill();
}

function drawVisualEffects(ctx) {
    const now = getTime();
    
    // Serve時のフェードアウトする串
    state.visuals.ghosts.forEach(g => {
        const t = now - g.startTime;
        if (t < 500) {
            const bounds = getLaneBounds(g.laneIndex);
            const cx = bounds.x + bounds.w / 2;
            const cy = bounds.y + bounds.h / 2;
            const yOffset = -(t * 0.15);
            ctx.globalAlpha = 1.0 - (t / 500);
            
            drawSkewer(ctx, {id: "ghost", justPlaced: false}, getVisualPalette(g.status), cx, cy + yOffset);
            ctx.globalAlpha = 1.0;
        }
    });

    // アイコンの浮遊エフェクト
    state.visuals.floaters.forEach(f => {
        const t = now - f.startTime;
        if (t < 600) { 
            let x = 0, y = 0;
            if (f.targetType === 'p1') { x = 90; y = 70; }
            else if (f.targetType === 'p2') { x = LAYOUT.CANVAS_WIDTH - 90; y = 70; }
            else if (f.targetType === 'lane') {
                const bounds = getLaneBounds(f.targetIndex);
                x = bounds.x + bounds.w / 2 + 60;
                y = bounds.y + bounds.h / 2;
            }
            
            const progress = t / 600;
            ctx.globalAlpha = 1.0 - progress;

            if (f.type === 'meat_up') {
                drawDotIcon(ctx, 'meat', x, y - (progress * 30), "#c55", 3);
            } else if (f.type === 'meat_down') {
                const gravityY = Math.pow(progress, 2) * 50; 
                drawDotIcon(ctx, 'meat', x, y + gravityY, "#c55", 3);
            } else if (f.type === 'star_up') {
                // スコア上昇はスパークで表現
                drawSparks(ctx, x, y - (progress * 30));
            }
            ctx.globalAlpha = 1.0;
        }
    });
}

function drawOverlay(ctx) {
    if (state.turnSplashTimer > 0) {
        const progress = state.turnSplashTimer / 90;
        let alpha = 1.0;
        if (progress > 0.8) alpha = (1.0 - progress) / 0.2;
        else if (progress < 0.2) alpha = progress / 0.2;

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.7})`;
        ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
        
        // ターン切り替えテキストはそのまま残しています
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = "bold 48px monospace";
        ctx.textAlign = "center";
        ctx.fillText("NEXT CHEF", LAYOUT.CANVAS_WIDTH / 2, LAYOUT.CANVAS_HEIGHT / 2);
    } else if (state.isBusy && state.currentPlayer === 2 && state.aiBreathTimer === 0) {
        // AI思考中
        ctx.fillStyle = LAYOUT.COLORS.P2;
        ctx.font = "italic 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Thinking...", LAYOUT.CANVAS_WIDTH / 2, 140);
    }
}

// ===== main.js =====

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

canvas.width = LAYOUT.CANVAS_WIDTH;
canvas.height = LAYOUT.CANVAS_HEIGHT;

document.body.style.margin = "0";
document.body.style.backgroundColor = "#111";
document.body.style.display = "flex";
document.body.style.justifyContent = "center";
document.body.style.alignItems = "center";
document.body.style.height = "100vh";

function loop() {
    resolvePendingTurnFlow();
    render(ctx);
    playAITurn();
    requestAnimationFrame(loop);
}

// ★マウスクリック操作を input.js に完全に委譲
canvas.addEventListener('click', (e) => {
    handleCanvasClick(e, canvas);
});

// ※ 旧キーボード操作リスナーは削除し、クリック操作へ一本化しました

loop();