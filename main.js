// # main.js - YAKITORI WARS: Pixel Art Consistency Update
// ==========================================
// 1. game/state.js - ゲームの状態管理
// ==========================================
let state = {};
function initGameState() {
    const currentTransition = (state && state.transition && state.transition.active) 
        ? state.transition 
        : { active: false, type: null, timer: 0, duration: 20, targetMode: null };
    state = {
        screen: "title", gameMode: "pvp", currentStage: 1, enemyName: "KENTA",
        aiLevel: 2, aiProfile: "master", round: 1, maxRounds: 13, 
        currentPlayer: 1, firstPlayer: 1, nextFirstPlayer: 1,
        gameOver: false, winnerText: "", winReason: "",
        isBusy: false, isAIThinking: false, transition: currentTransition,
        introSequenceActive: false, introSequenceDone: false, introPhase: null, 
        introVsTimer: 0, fightSplashTimer: 0, introOrderTimer: 0, 
        introPauseTimer: 0, orderIntroDone: false, todaysOrder: null, 
        
        extraOrder: null, extraOrderActive: false, extraOrderClaimed: false, 
        extraOrderWinner: null, extraOrderIntroActive: false, extraOrderIntroTimer: 0, 
        extraOrderSpawnRound: 7, 

        gameEndWaitTimer: 0, endSplashTimer: 0, endSplashText: "", endSplashColor: "#fff",
        resultScreenTimer: 0, resultPause: 0, resultPauseDone: false, hitStopTimer: 0,
        cookPreviewActive: false, 
        cookPreviewEvents: [], cookPreviewIndex: 0,
        cookPreviewPhase: null, cookPreviewPhaseTimer: 0,
        roundEndPauseTimer: 0,
        startRouletteActive: false, startRouletteInterval: 4, startRouletteTickTimer: 4,    
        startRouletteCount: 0, startRouletteMaxCount: 16, startRouletteIndex: 1,
        startRouletteFinalPlayer: null, startRouletteBlinkActive: false,
        startRouletteBlinkTimer: 0, startRouletteBlinkCount: 0,
        turnSplashTimer: 0, pendingTurnSplash: false, pendingAiBreath: false,
    
        pendingPlayer: null, aiBreathTimer: 0, 
        buildMode: null,
        buildModeStartTime: 0, pendingBox: null, uiHint: "tap",
        players: [
            { id: 1, score: 0, servedScore: 0, resources: 0, workersRemaining: 1, stats: { perfect: 0, burnt: 0, steal: 0 } },
            { id: 2, score: 0, servedScore: 0, resources: 0, workersRemaining: 1, stats: { perfect: 0, burnt: 0, steal: 0 } }
        ],
     
        lanes: [
            { id: "s1", fire: 1, type: "weak", owner: null, cookState: 0, uchiwaBoost: 0, justPlaced: false, built: false },
            { id: "s2", fire: 2, type: "medium", owner: null, cookState: 0, uchiwaBoost: 0, justPlaced: false, built: false },
            { id: "s3", fire: 3, type: "strong", owner: null, cookState: 0, uchiwaBoost: 0, justPlaced: false, built: false }
        ],
 
        visuals: {
            buttonClicks: {}, buttonErrors: {}, laneErrors: {}, laneFlashes: {}, placedAt: {}, 
            peakFlashes: {}, ghosts: [], floaters: [], statusMessages: [], particles: [], 
            cancelClick: 0, titleClick: null, perfectFlash: { timer: 0 }, resultComment: null,
    
            aiTargetLane: null, traces: [], uchiwaGusts: {} 
        }
    };
}
initGameState();

let logoImage = new Image(); logoImage.src = "Logo.png";
function getPixelFont(size) { return `${size}px 'Press Start 2P', monospace`; }

// ==========================================
// 1.5. game/audio.js - 音声システム
// ==========================================
const audioSys = {
    ctx: null, 
    masterGain: null, 
    unlocked: false, 
    lastPlayed: {}, 
    masterVolume: 0.6 
};
function initAudio() {
    if (audioSys.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
        audioSys.ctx = new AudioContext();
        audioSys.masterGain = audioSys.ctx.createGain();
        audioSys.masterGain.gain.value = audioSys.masterVolume;
        audioSys.masterGain.connect(audioSys.ctx.destination);
    } catch (e) { 
        console.warn("Web Audio API がサポートされていません", e);
    }
}

async function unlockAudio() {
    if (audioSys.unlocked) return;
    initAudio();
    if (!audioSys.ctx) return;
    try {
        if (audioSys.ctx.state === "suspended") await audioSys.ctx.resume();
        const t = audioSys.ctx.currentTime;
        const osc = audioSys.ctx.createOscillator();
        const gain = audioSys.ctx.createGain();
        gain.gain.setValueAtTime(0.001, t);
        osc.frequency.setValueAtTime(440, t);
        osc.connect(gain);
        gain.connect(audioSys.masterGain);
        osc.start(t);
        osc.stop(t + 0.03);
        audioSys.unlocked = true;
    } catch (e) {
        console.warn("audio unlock failed", e);
    }
}

function playTone(freq, duration, type = 'sine', vol = 1.0, freqSlide = 0) {
    if (!audioSys.ctx || audioSys.ctx.state !== 'running') return;
    const t = audioSys.ctx.currentTime, osc = audioSys.ctx.createOscillator(), gain = audioSys.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    if (freqSlide !== 0) osc.frequency.exponentialRampToValueAtTime(freq + freqSlide, t + duration);
    gain.gain.setValueAtTime(vol, t); gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    osc.connect(gain); gain.connect(audioSys.masterGain);
    osc.start(t);
    osc.stop(t + duration);
}

function playNoise(duration, vol = 1.0, filterFreq = 1000) {
    if (!audioSys.ctx || audioSys.ctx.state !== 'running') return;
    const t = audioSys.ctx.currentTime, bufferSize = audioSys.ctx.sampleRate * duration;
    const buffer = audioSys.ctx.createBuffer(1, bufferSize, audioSys.ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioSys.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioSys.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = filterFreq;
    const gain = audioSys.ctx.createGain(); gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    noise.connect(filter); filter.connect(gain); gain.connect(audioSys.masterGain);
    noise.start(t);
}

function playSound(name) {
    if (!audioSys.ctx || !audioSys.unlocked) return;
    const now = Date.now();
    if (audioSys.lastPlayed[name] && now - audioSys.lastPlayed[name] < 50) return;
    audioSys.lastPlayed[name] = now;
    switch (name) {
        case "meat_plus": playTone(800, 0.08, 'sine', 0.4); break;
        case "meat_minus": playTone(400, 0.08, 'sine', 0.4); break;
        case "put_skewer": playNoise(0.05, 0.3, 2000); playTone(600, 0.05, 'triangle', 0.2); break;
        case "sizzle": playNoise(0.12, 0.25, 1500); break;
        case "perfect": playTone(880, 0.1, 'triangle', 0.5); setTimeout(() => playTone(1318, 0.15, 'triangle', 0.5), 60); break;
        case "burnt": playNoise(0.2, 0.5, 400); playTone(150, 0.2, 'square', 0.3, -50); break;
        case "uchiwa": playNoise(0.15, 0.4, 800); break;
        case "score": playTone(600, 0.15, 'sine', 0.4, 300); break;
        case "error": playTone(180, 0.1, 'square', 0.3); break;
    }
}

// ==========================================
// 2. render/layout.js - 定数とレイアウト設定
// ==========================================
let LAYOUT = {
    CANVAS_WIDTH: window.innerWidth, CANVAS_HEIGHT: window.innerHeight,
    COLORS: {
        BG: "#1e1410", TEXT_MAIN: "#fff", TEXT_DIM: "#aaa", 
        P1: "#3c96ff", P2: "#ff5078", NEUTRAL: "#333", PANEL_BG: "#2c1e16", OVERLAY_BG: "rgba(0, 0, 0, 0.7)",
        STICK: "#dca", FIRE_BASE: "#e53", FIRE_BOOST: "#fa3", DOT_OFF: "#334", HIGHLIGHT: "rgba(255, 255, 255, 0.4)"
    },
    BUTTONS: [
        { id: "meat", color: "#5a7a5a", icon: "meat" }, 
        { id: "put", color: "#4a6fa5", icon: "put_skewer" },     
        { id: "harvest", color: "#a57a4a", icon: "serve_plate" },  
        { id: "uchiwa", color: "#8a4a6f", icon: "uchiwa" }    
    ]
};
const VISUAL_STATES = {
    RAW: { meat: "#f09b9b", negi: "#eef7ee", dot: "#fff" },
    OKAY: { meat: "#c88450", negi: "#dcedc8", dot: "#f90" },
    PERFECT: { meat: "#9f5524", negi: "#7cb342", dot: "#ff4" },
    BURNT: { meat: "#3c2a23", negi: "#303d32", dot: "#f33" }
};
const ICON_PALETTE = { 1:"#ffffff", 2:"#d95763", 3:"#8c3f5d", 4:"#df7126", 5:"#fbf236", 6:"#5fcde4", 7:"#8f563b", 8:"#ac3232", 9:"#e8ede7", 10:"#99e550", 11:"#ffcc66", 12:"#1a100c" };
const ICON_DATA = {
    meat:[0,0,0,0,0,0,0,0,0,0,2,2,2,2,0,0,0,2,3,2,2,2,2,0,1,3,3,3,2,2,2,1,1,3,3,3,2,2,2,1,0,2,3,2,2,2,2,0,0,0,2,2,2,2,0,0,0,0,0,0,0,0,0,0],
    uchiwa:[0,8,8,8,8,8,0,6,8,8,8,8,8,8,8,0,8,8,8,8,8,8,8,6,8,8,9,9,9,8,8,0,0,8,9,7,9,8,0,0,0,0,0,7,0,0,0,0,0,0,0,7,0,0,0,0,0,0,0,7,0,0,0,0],
    diamond:[0,0,0,1,6,0,0,0,0,0,1,6,6,6,0,0,0,1,6,6,6,6,6,0,1,6,6,6,6,6,6,6,0,6,6,6,6,6,6,0,0,0,6,6,6,6,0,0,0,0,0,6,6,0,0,0,0,0,0,0,0,0,0,0],
    fire:[0,0,0,4,0,0,0,0,0,0,4,5,4,0,0,0,0,4,4,5,4,4,0,0,0,4,5,5,5,4,0,0,4,5,5,5,5,5,4,0,4,4,5,5,5,4,4,0,0,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0],
    put_skewer:[0,0,11,0,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,11,0,0,0,0,0,0,2,2,2,0,0,0,0,0,2,2,2,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0],
    burnt_skewer:[0,0,11,0,0,0,0,0,0,12,12,12,0,0,0,0,0,12,12,12,0,0,0,0,0,0,11,0,0,0,0,0,0,12,12,12,0,0,0,0,0,12,12,12,0,0,0,0,0,0,11,0,0,0,0,0,0,0,11,0,0,0,0,0],
    serve_plate:[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,7,7,10,7,7,0,0,11,7,7,10,7,7,11,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,0],
    clock:[0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,1,0,1,0,0,1,0,0,1,0,1,1,0,1,0,0,1,0,0,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    warning:[0,0,0,8,8,0,0,0,0,0,8,11,11,8,0,0,0,0,8,11,11,8,0,0,0,0,8,11,11,8,0,0,0,0,8,11,11,8,0,0,0,0,0,8,8,0,0,0,0,0,8,11,11,8,0,0,0,0,0,8,8,0,0,0],
    trash:[0,0,0,0,0,0,0,0,0,8,8,0,0,8,8,0,0,0,8,8,8,8,0,0,0,0,0,8,8,0,0,0,0,0,8,8,8,8,0,0,0,8,8,0,0,8,8,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    up_arrow:[0,0,0,1,1,0,0,0,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    cross:[0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,1,0,0,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,1,0,0,1,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0],
    customer:[0,0,0,1,1,0,0,0,0,0,1,1,1,1,0,0,0,1,11,1,11,1,0,0,0,1,1,1,1,1,0,0,0,0,1,11,11,1,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
};
function getVisualPalette(status) { return VISUAL_STATES[status] || VISUAL_STATES.RAW; }
function getLaneBounds(index) {
    const laneW = Math.min(90, LAYOUT.CANVAS_WIDTH * 0.28), laneH = Math.min(180, LAYOUT.CANVAS_HEIGHT * 0.3), gap = 15;
    const totalW = (laneW * 3) + (gap * 2), startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2, y = LAYOUT.CANVAS_HEIGHT / 2 - laneH / 2 - 40;
    return { x: startX + index * (laneW + gap), y, w: laneW, h: laneH };
}
function getButtonBounds(index) {
    const positionMap = [0, 1, 3, 2], displayIndex = positionMap[index], col = displayIndex % 2, row = Math.floor(displayIndex / 2);
    const btnW = Math.min(150, LAYOUT.CANVAS_WIDTH * 0.42), btnH = Math.min(80, LAYOUT.CANVAS_HEIGHT * 0.12), gapX = 15, gapY = 15;
    const totalW = (btnW * 2) + gapX, startX = (LAYOUT.CANVAS_WIDTH - totalW) / 2, totalH = (btnH * 2) + gapY;
    const y = LAYOUT.CANVAS_HEIGHT - totalH - Math.max(30, LAYOUT.CANVAS_HEIGHT * 0.05);
    return { x: startX + col * (btnW + gapX), y: y + row * (btnH + gapY), w: btnW, h: btnH };
}
function getCancelButtonBounds() {
    const btnW = Math.min(315, LAYOUT.CANVAS_WIDTH * 0.85 + 15), btnH = Math.min(60, LAYOUT.CANVAS_HEIGHT * 0.1);
    const startX = (LAYOUT.CANVAS_WIDTH - btnW) / 2, y = LAYOUT.CANVAS_HEIGHT - btnH - Math.max(10, LAYOUT.CANVAS_HEIGHT * 0.02);
    return { x: startX, y, w: btnW, h: btnH };
}
const getTime = () => performance.now();

// ==========================================
// 3. game/flow.js - ゲーム進行とスコア
// ==========================================
const COOK_PREVIEW_DUR = 55;
const STAGE_CONFIG = {
    1: { profile: "gambler", level: 1, enemyName: "KENTA" }, 2: { profile: "thief", level: 2, enemyName: "HIDEKI" },
    3: { profile: "reader", level: 3, enemyName: "TETSUYA" }, 4: { profile: "master", level: 4, enemyName: "MAKOTO" },
    5: { profile: "master", level: 5, enemyName: "BOSS" }
};
const TODAYS_ORDERS = [
    { id: "strong", label: "HOT", icon: "fire", bonus: "+2", color: "#fa3" },
    { id: "burnt", label: "BURNT OK", icon: "burnt_skewer", bonus: "+1", color: "#3c2a23" },
    { id: "steal", label: "STEAL OK", icon: "meat", bonus: "+3", color: "#f33" }
];
function isTutorialStage() { return false; }
function canUseExtraOrder() { return state.gameMode === "ai" && state.currentStage >= 4; }
function getRandomOrder() { return TODAYS_ORDERS[Math.floor(Math.random() * TODAYS_ORDERS.length)]; }

function assignOrderForCurrentStage() {
    if (state.gameMode === "ai") {
        if (state.currentStage === 1) state.todaysOrder = TODAYS_ORDERS.find(o => o.id === "burnt");
        else if (state.currentStage === 2) state.todaysOrder = TODAYS_ORDERS.find(o => o.id === "strong");
        else if (state.currentStage === 3) state.todaysOrder = TODAYS_ORDERS.find(o => o.id === "steal");
        else state.todaysOrder = getRandomOrder();
    } else {
        state.todaysOrder = getRandomOrder();
    }
}

function updateTransition() {
    if (state.transition && state.transition.active) {
        state.transition.timer++;
        if (state.transition.timer === state.transition.duration) {
            if (state.transition.type === "titleToGame") startGame(state.transition.targetMode);
        }
        if (state.transition.timer >= state.transition.duration * 2) state.transition.active = false;
    }
}

function updateIntroSequence() {
    if (!state.introSequenceActive) return;
    if (state.introPhase === "vs") {
        state.introVsTimer--;
        if (state.introVsTimer <= 0) { state.introPhase = "fight"; state.fightSplashTimer = 25; }
    } else if (state.introPhase === "fight") {
        state.fightSplashTimer--;
        if (state.fightSplashTimer <= 0) { 
            if (!state.todaysOrder) {
                state.orderIntroDone = true;
                state.introPhase = "pause"; 
                state.introPauseTimer = 15;
            } else {
                state.introPhase = "order";
                state.introOrderTimer = 120;
            }
        }
    } else if (state.introPhase === "order") {
        state.introOrderTimer--;
        if (state.introOrderTimer <= 0) { 
            state.orderIntroDone = true;
            state.introPhase = "pause"; 
            state.introPauseTimer = 15;
        }
    } else if (state.introPhase === "pause") {
        state.introPauseTimer--;
        if (state.introPauseTimer <= 0) { 
            state.introSequenceActive = false;
            state.introSequenceDone = true; 
            state.pendingTurnSplash = true;
        }
    }
}

function updateGameEndWait() {
    if (state.gameOver && state.gameEndWaitTimer > 0) {
        if (state.endSplashTimer > 0) state.endSplashTimer--;
        state.gameEndWaitTimer--;
        if (state.gameEndWaitTimer <= 0) {
            state.resultScreenTimer = 0;
            const p1 = state.players[0].finalScore || state.players[0].score, p2 = state.players[1].finalScore || state.players[1].score;
            if (p1 > p2) {
                if (state.gameMode === "ai") {
                    if (state.currentStage >= 5) { state.screen = "clear";
                        state.winnerText = "SURVIVAL CLEAR"; }
                    else { state.screen = "stage_clear";
                        state.winnerText = "STAGE CLEAR"; }
                } else { state.screen = "gameover";
                    state.winnerText = "P1 WIN"; }
            } else if (p2 > p1) { 
                const winnerName = state.gameMode === "ai" ? state.enemyName : "P2";
                state.screen = "gameover"; state.winnerText = `${winnerName} WIN`;
            } else { 
                if (state.gameMode === "ai") { retryStage(); return; } 
                else { state.screen = "gameover"; state.winnerText = "DRAW"; }
            }
        }
    }
}

function setupAIForStage(stageNumber) {
    const conf = STAGE_CONFIG[stageNumber];
    if (!conf) return false;
    state.currentStage = stageNumber; state.enemyName = conf.enemyName; state.aiLevel = conf.level; state.aiProfile = conf.profile; return true;
}

function startGame(mode) {
    initGameState(); 
    state.gameMode = mode;
    state.screen = "game";
    if (mode === "ai") setupAIForStage(1);
    
    assignOrderForCurrentStage();
    state.startRouletteActive = true; state.startRouletteInterval = 4; state.startRouletteTickTimer = 4; state.startRouletteCount = 0;
    state.startRouletteIndex = 1;
    state.startRouletteMaxCount = 15 + Math.floor(Math.random() * 2); state.startRouletteBlinkActive = false; state.startRouletteFinalPlayer = null;
}

function retryStage() {
    const stg = state.currentStage, prevMode = state.gameMode;
    initGameState(); 
    state.gameMode = prevMode;
    state.screen = "game";
    setupAIForStage(stg);
    
    assignOrderForCurrentStage();
    state.startRouletteActive = true; state.startRouletteInterval = 4;
    state.startRouletteTickTimer = 4; state.startRouletteCount = 0; state.startRouletteIndex = 1;
    state.startRouletteMaxCount = 15 + Math.floor(Math.random() * 2); state.startRouletteBlinkActive = false;
    state.startRouletteFinalPlayer = null;
}

function nextStage() {
    const nextStg = state.currentStage + 1; if (nextStg > 5) return;
    const prevMode = state.gameMode; 
    initGameState(); 
    state.gameMode = prevMode; state.screen = "game"; setupAIForStage(nextStg);
    
    assignOrderForCurrentStage();
    state.startRouletteActive = true;
    state.startRouletteInterval = 4;
    state.startRouletteTickTimer = 4; state.startRouletteCount = 0; state.startRouletteIndex = 1;
    state.startRouletteMaxCount = 15 + Math.floor(Math.random() * 2);
    state.startRouletteBlinkActive = false;
    state.startRouletteFinalPlayer = null;
}

function updateAllScores() { state.players.forEach(p => p.score = p.servedScore || 0); }
function getBaseHeat(type) { if (type === "weak") return 1; if (type === "medium") return 2;
    if (type === "strong") return 3; return 1; }

function spawnSmokeEffect(laneIndex, amount, status) {
    const b = getLaneBounds(laneIndex);
    const laneCx = b.x + b.w / 2;
    const stickTop = b.y + b.h * 0.1;
    const meatY = stickTop + (b.h * 0.7) * 0.4;
    const lane = state.lanes[laneIndex];
    let numParticles = 0;
    let color = "#e0e0e0";
    let speedMult = 1.0;
    const nextStatus = getCookLabel(lane.type, lane.cookState + getBaseHeat(lane.type));
    const isAlmostBurnt = (status !== "burnt" && nextStatus === "burnt");
    if (status === "burnt") {
        numParticles = 10 + amount * 2;
        color = "#333333";              
        speedMult = 1.2;
    } else if (status === "perfect") {
        numParticles = 4 + amount;
        color = "#f8f8f8";              
    } else {
        numParticles = 3 + amount;
        if (isAlmostBurnt) {
            color = "#a0a0a0"; speedMult = 1.4;
            numParticles += (lane.type === "strong" ? 2 : 0);
        } else {
            color = "#cccccc";
        }
    }

    if (lane.type === "weak") numParticles = Math.max(1, numParticles - 1);
    if (lane.type === "strong") numParticles += 1;

    for (let i = 0; i < numParticles; i++) {
        state.visuals.particles.push({
            x: laneCx + (Math.random() - 0.5) * 30, 
            y: meatY + (Math.random() - 0.5) * 15,  
            vx: (Math.random() - 0.5) * 1.0, 
            vy: (-1 - Math.random() * 1.5) * speedMult,             
            life: 0, maxLife: 20 + Math.random() * 15, size: 8 + Math.random() * 12, color: color
        });
    }
}

function spawnPerfectHarvestEffect(laneIndex) {
    const b = getLaneBounds(laneIndex), laneCx = b.x + b.w / 2, meatY = b.y + b.h * 0.4, colors = ["#fff7b0", "#ffdf6b", "#ffffff"];
    for (let i = 0; i < 24; i++) {
        state.visuals.particles.push({
            x: laneCx + (Math.random() - 0.5) * 50, y: meatY + (Math.random() - 0.5) * 30,  
            vx: (Math.random() - 0.5) * 2.5, vy: -1.5 - Math.random() * 3.5, 
            life: 0, maxLife: 30 + Math.random() * 30, size: 4 + Math.random() * 6,
            color: colors[Math.floor(Math.random() * colors.length)], isSparkle: true 
        });
    }
}

function advanceAllSkewersAtRoundEnd() {
    state.cookPreviewEvents = [];
    state.lanes.forEach((n, index) => {
        if (n.built) {
            if (n.justPlaced) n.justPlaced = false;
            else {
                const baseHeat = getBaseHeat(n.type), boost = n.uchiwaBoost || 0;
                const prevCookState = n.cookState, prevStatus = getCookLabel(n.type, prevCookState);
                n.cookState = Math.min(8, n.cookState + baseHeat + boost);
                const newStatus = getCookLabel(n.type, n.cookState);
                if (n.cookState > prevCookState) {
                    state.cookPreviewEvents.push({ laneIndex: index, prevCookState: prevCookState, newCookState: n.cookState, prevStatus: prevStatus, newStatus: newStatus });
                    if (newStatus === "burnt" && prevStatus !== "burnt" && n.owner) state.players[n.owner - 1].stats.burnt++;
                }
            }
        }
        n.uchiwaBoost = 0;
    });
}

function updateCookPreview() {
    if (!state.cookPreviewActive) return;
    if (!state.cookPreviewEvents || state.cookPreviewEvents.length === 0) { finishEndRound(); return; }
    if (state.cookPreviewIndex >= state.cookPreviewEvents.length) { finishEndRound(); return; }
    const CHANGE_TIME = 36;
    if (state.cookPreviewPhase === "show" && state.cookPreviewPhaseTimer === CHANGE_TIME) {
        const event = state.cookPreviewEvents[state.cookPreviewIndex];
        if (event) {
            let smokeAmount = event.newCookState - event.prevCookState;
            spawnSmokeEffect(event.laneIndex, smokeAmount, event.newStatus); 
            playSound("sizzle"); 
            if (event.prevStatus !== "perfect" && event.newStatus === "perfect") {
                playSound("perfect");
                state.visuals.peakFlashes[state.lanes[event.laneIndex].id] = performance.now();
                state.visuals.perfectFlash = { timer: 15 }; 
            }
        }
    }
    state.cookPreviewPhaseTimer--;
    if (state.cookPreviewPhaseTimer <= 0) {
        state.cookPreviewIndex++;
        if (state.cookPreviewIndex >= state.cookPreviewEvents.length) { finishEndRound(); } 
        else { state.cookPreviewPhase = "show"; state.cookPreviewPhaseTimer = COOK_PREVIEW_DUR; }
    }
}

function tryEndRound() {
    advanceAllSkewersAtRoundEnd();
    if (state.cookPreviewEvents.length > 0) {
        state.cookPreviewActive = true; state.cookPreviewIndex = 0;
        state.cookPreviewPhase = "show"; state.cookPreviewPhaseTimer = COOK_PREVIEW_DUR; 
    } else { finishEndRound(); }
}

function finishEndRound() {
    state.cookPreviewActive = false;
    state.cookPreviewEvents = [];
    if (state.round >= state.maxRounds) {
        state.gameOver = true; updateAllScores();
        state.players.forEach(p => { p.finalScore = (p.servedScore || 0) + (p.resources || 0); });
        const p1 = state.players[0].finalScore, p2 = state.players[1].finalScore;
        if (p1 > p2) {
            if (state.gameMode === "ai") {
                if (state.currentStage >= 5) { state.endSplashText = "SURVIVAL CLEAR";
                    state.endSplashColor = "#ffeb3b"; } 
                else { state.endSplashText = "STAGE CLEAR";
                    state.endSplashColor = "#ffeb3b"; }
            } else { state.endSplashText = "P1 WIN";
                state.endSplashColor = LAYOUT.COLORS.P1; }
        } else if (p2 > p1) {
            const winnerName = state.gameMode === "ai" ? state.enemyName : "P2";
            state.endSplashText = `${winnerName} WIN`; state.endSplashColor = LAYOUT.COLORS.P2;
        } else { state.endSplashText = "DRAW"; state.endSplashColor = "#aaa"; }
        state.endSplashTimer = 55; state.gameEndWaitTimer = 55; return;
    }
    state.roundEndPauseTimer = 60; 
}

function updateRoundEndPause() {
    if (state.roundEndPauseTimer > 0) {
        state.roundEndPauseTimer--;
        if (state.roundEndPauseTimer <= 0) { startNewRound(); }
    }
}

function isAIPlayer(playerIndex) { return state.gameMode === "ai" && playerIndex === 2; }
function consumeWorker() {
    const p = state.players[state.currentPlayer - 1]; p.workersRemaining -= 1;
    state.buildMode = null;
    state.pendingBox = null; updateAllScores(); switchTurn();
}
function switchTurn() {
    state.isBusy = true;
    setTimeout(() => {
        const nextP = 3 - state.currentPlayer;
        if (state.players[nextP - 1].workersRemaining > 0) {
            state.pendingPlayer = nextP; state.pendingTurnSplash = true; 
            if (isAIPlayer(nextP)) state.pendingAiBreath = true;
        } else if (state.players[state.currentPlayer - 1].workersRemaining <= 0) { tryEndRound(); }
        state.isBusy = false;
    }, 800);
}

function startNewRound() {
    state.round++; state.players.forEach(p => p.workersRemaining = 1);
    state.buildMode = null; state.pendingBox = null;
    state.currentPlayer = state.firstPlayer;
    state.pendingPlayer = state.firstPlayer; state.pendingTurnSplash = true; state.pendingAiBreath = false;
}

function updateRoulette() {
    if (state.startRouletteActive) {
        state.startRouletteTickTimer--;
        if (state.startRouletteTickTimer <= 0) {
            state.startRouletteIndex = 3 - state.startRouletteIndex;
            state.startRouletteCount++;
            state.startRouletteInterval *= 1.12; state.startRouletteTickTimer = Math.floor(state.startRouletteInterval);
            if (state.startRouletteCount >= state.startRouletteMaxCount) {
                state.startRouletteActive = false;
                state.startRouletteBlinkActive = true;
                state.startRouletteBlinkTimer = 6; state.startRouletteBlinkCount = 0; state.startRouletteFinalPlayer = state.startRouletteIndex;
            }
        }
    } else if (state.startRouletteBlinkActive) {
        state.startRouletteBlinkTimer--;
        if (state.startRouletteBlinkTimer <= 0) {
            state.startRouletteBlinkCount++; state.startRouletteBlinkTimer = 6;
            if (state.startRouletteBlinkCount >= 7) { 
                state.startRouletteBlinkActive = false;
                state.firstPlayer = state.startRouletteFinalPlayer;
                state.currentPlayer = state.startRouletteFinalPlayer; state.pendingPlayer = state.startRouletteFinalPlayer;
                state.introSequenceActive = true; state.introPhase = "vs"; state.introVsTimer = 60;
            }
        }
    }
}

function hasActiveImportantMessage() {
    const now = performance.now();
    return state.visuals.statusMessages.some(m =>
        (m.type === "score" || m.isPerfect || m.isBonus || m.type === "result") && (now - m.startTime < (m.duration || 1000) - 200)
    );
}

function resolvePendingTurnFlow() {
    if (state.cookPreviewActive || state.introSequenceActive || state.roundEndPauseTimer > 0) return;
    if (state.extraOrderIntroActive) {
        state.extraOrderIntroTimer--;
        if (state.extraOrderIntroTimer <= 0) { state.extraOrderIntroActive = false; }
        return; 
    }

    if (state.pendingTurnSplash) { 
        if (hasActiveImportantMessage()) return;
        state.turnSplashTimer = 45; 
        state.pendingTurnSplash = false;
    }
    
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
    if (laneType === "weak") { if (cv >= 8) return "burnt";
        if (cv >= 6) return "perfect"; if (cv === 5) return "okay"; } 
    else { if (cv >= 7) return "burnt"; if (cv === 6) return "perfect";
        if (cv === 5) return "okay"; }
    return "early";
}
function hasPerfectHarvestTarget(playerIndex) {
    const p = state.players[playerIndex - 1];
    for (let n of state.lanes) {
        if (n.built) { const status = getCookLabel(n.type, n.cookState);
            if (status === "perfect" && (n.owner === playerIndex || p.resources >= 1)) return true;
        }
    }
    return false;
}
function brightenColor(hex, ratio) {
    hex = hex.replace(/^#/, ''); if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    let r = parseInt(hex.substring(0,2), 16), g = parseInt(hex.substring(2,4), 16), b = parseInt(hex.substring(4,6), 16);
    r = Math.min(255, Math.floor(r + (255 - r) * ratio)); g = Math.min(255, Math.floor(g + (255 - g) * ratio));
    b = Math.min(255, Math.floor(b + (255 - b) * ratio));
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function mixColor(color1, color2, weight) {
    let c1 = color1.replace(/^#/, ''); let c2 = color2.replace(/^#/, '');
    if (c1.length === 3) c1 = c1.split('').map(c => c+c).join('');
    if (c2.length === 3) c2 = c2.split('').map(c => c+c).join('');
    const r1 = parseInt(c1.substring(0,2), 16), g1 = parseInt(c1.substring(2,4), 16), b1 = parseInt(c1.substring(4,6), 16);
    const r2 = parseInt(c2.substring(0,2), 16), g2 = parseInt(c2.substring(2,4), 16), b2 = parseInt(c2.substring(4,6), 16);
    const r = Math.round(r1 * (1 - weight) + r2 * weight), g = Math.round(g1 * (1 - weight) + g2 * weight), b = Math.round(b1 * (1 - weight) + b2 * weight);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getHarvestScore(node, isSteal, status) {
    let score = 0;
    const heat = getBaseHeat(node.type);
    const order = state.todaysOrder ? state.todaysOrder.id : null;

    if (status === "early") return -5;
    if (status === "burnt") {
        score = isSteal ? 0 : -2;
        if (order === "burnt") score = 1;
    } else {
        if (heat === 1) score = (status === "perfect") ? 12 : 3;
        else if (heat === 3) score = (status === "perfect") ? 6 : 2;
        else score = (status === "perfect") ? 8 : 2;
    }

    if (order === "strong" && node.type === "strong" && score > 0) score += 2;
    if (order === "steal" && isSteal && score > 0) score += 3;

    return score;
}
function canUseMeat(playerIndex) { return true; }
function canUseSkewer(playerIndex) { return state.players[playerIndex - 1].resources >= 1 && state.lanes.some(l => !l.built); }
function canUseServe(playerIndex) {
    const p = state.players[playerIndex - 1];
    for (let n of state.lanes) {
        if (n.built) { const status = getCookLabel(n.type, n.cookState);
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
        playSound("meat_plus");
        state.visuals.statusMessages.push({ type: 'meat', amount: 1, player: state.currentPlayer, targetPlayerPanel: state.currentPlayer, startTime: performance.now(), duration: 800 }); consumeWorker();
    } else {
        state.isBusy = true;
        setTimeout(() => {
            if (boxId === 2 && p.resources >= 1) { state.buildMode = "sapling"; state.pendingBox = boxId; state.buildModeStartTime = performance.now(); }
            else if (boxId === 3) { state.buildMode = "harvest"; state.pendingBox = boxId; state.buildModeStartTime = performance.now(); }
            else if (boxId === 4) { state.buildMode = "uchiwa"; state.pendingBox = boxId; state.buildModeStartTime = performance.now(); }
            state.isBusy = false;
        }, 150);
    }
}
function tryBuildNode(node) {
    const p = state.players[state.currentPlayer - 1];
    if (p.resources >= 1 && !node.built) {
        p.resources -= 1;
        playSound("meat_minus");
        state.visuals.statusMessages.push({ type: 'meat', amount: -1, player: state.currentPlayer, targetPlayerPanel: state.currentPlayer, startTime: performance.now(), duration: 800 });
        node.built = true; node.owner = state.currentPlayer;
        playSound("put_skewer"); 
        node.cookState = 0; node.justPlaced = true;
        state.visuals.placedAt[node.id] = performance.now(); consumeWorker();
    }
}
function tryHarvestNode(node) {
    const p = state.players[state.currentPlayer - 1]; if (!node.built) return;
    const stolenFrom = node.owner, isSteal = (stolenFrom !== null && stolenFrom !== state.currentPlayer), status = getCookLabel(node.type, node.cookState);
    if (isSteal) {
        if (status === "early") return;
        if (status !== "burnt") {
            if (p.resources < 1) return;
            p.resources -= 1;
            playSound("meat_minus"); 
            state.visuals.statusMessages.push({ type: 'meat', amount: -1, player: state.currentPlayer, targetPlayerPanel: state.currentPlayer, startTime: performance.now(), duration: 800, isSteal: true });
            if (stolenFrom !== null && state.players[stolenFrom - 1]) {
                state.players[stolenFrom - 1].resources += 1;
                state.visuals.statusMessages.push({ type: 'meat', amount: 1, player: stolenFrom, targetPlayerPanel: stolenFrom, startTime: performance.now() + 150, duration: 800, isSteal: true });
            }
            state.hitStopTimer = 4;
        }
    }
    const scoreGained = getHarvestScore(node, isSteal, status); p.servedScore += scoreGained;
    if (status === "perfect") playSound("perfect");
    else if (status === "burnt") playSound("burnt");
    else if (scoreGained > 0) playSound("score");
    if (status === "perfect") p.stats.perfect++; if (status === "burnt") p.stats.burnt++; if (isSteal && scoreGained > 0) p.stats.steal++;
    let isBonus = false; let bonusText = "";
    const order = state.todaysOrder ? state.todaysOrder.id : null;
    if (order === "strong" && node.type === "strong" && scoreGained > 0 && status !== "early") { isBonus = true;
        bonusText = "ORDER!"; }
    if (order === "steal" && isSteal && scoreGained > 0) { isBonus = true;
        bonusText = "ORDER!"; }
    if (order === "burnt" && status === "burnt") { isBonus = true;
        bonusText = "ORDER!"; }

    const laneIndex = state.lanes.indexOf(node);
    const b = getLaneBounds(laneIndex);
    const msgX = b.x + b.w / 2;
    const msgY = b.y + b.h * 0.2;
    if (scoreGained !== 0) { 
        let duration = 1000;
        if (status === "perfect") duration = 1500;
        else if (isBonus) duration = 1300;
        state.visuals.statusMessages.push({ 
            type: 'score', amount: scoreGained, player: state.currentPlayer, 
            startTime: performance.now(), duration: duration, isPerfect: status === "perfect",
            isBonus: isBonus, bonusText: bonusText, x: msgX, y: msgY
        });
    }

    if (status === "perfect") { 
        spawnPerfectHarvestEffect(laneIndex);
        state.hitStopTimer = 8;
        state.visuals.traces.push({ laneIndex: laneIndex, type: "perfect", time: performance.now() });
    } else if (status === "burnt") {
        spawnSmokeEffect(laneIndex, 2, "burnt");
        state.visuals.traces.push({ laneIndex: laneIndex, type: "burnt", time: performance.now() });
    } else if (status === "okay") {
        state.visuals.traces.push({ laneIndex: laneIndex, type: "okay", time: performance.now() });
    }
    
    state.visuals.ghosts.push({ laneIndex: laneIndex, status: status.toUpperCase(), startTime: performance.now(), cookState: node.cookState, owner: node.owner });
    node.built = false; node.owner = null; node.cookState = 0; node.justPlaced = false; consumeWorker();
}
function tryUchiwaNode(node) {
    if (node.built) { 
        node.uchiwaBoost += 1;
        playSound("uchiwa"); 
        const laneIndex = state.lanes.indexOf(node);
        const b = getLaneBounds(laneIndex);
        state.visuals.statusMessages.push({ type: 'fire', amount: 1, player: state.currentPlayer, startTime: performance.now(), duration: 800, x: b.x + b.w/2, y: b.y + b.h*0.2 });
        state.visuals.uchiwaGusts[node.id] = performance.now();
        consumeWorker();
    }
}
function isNodeValidForMode(node, mode) {
    if (!node) return false;
    if (mode === "sapling") return !node.built;
    if (mode === "harvest") { if (!node.built) return false;
        if (node.owner === state.currentPlayer) return true; return getCookLabel(node.type, node.cookState) !== "early"; }
    if (mode === "uchiwa") return node.built; return false;
}

// ==========================================
// 5. game/input.js - 入力処理
// ==========================================
function isInputLocked() {
    if (state.startRouletteActive || state.startRouletteBlinkActive || state.introSequenceActive || state.cookPreviewActive || state.roundEndPauseTimer > 0 || state.extraOrderIntroActive) return true;
    const cp = state.currentPlayer;
    return state.screen !== "game" || state.isBusy || state.isAIThinking || state.pendingPlayer !== null ||
        state.turnSplashTimer > 0 || state.aiBreathTimer > 0 || state.gameOver || state.players[cp - 1].workersRemaining <= 0 || isAIPlayer(cp);
}
function handleCanvasClick(event, canvas) {
    unlockAudio(); 
    const rect = canvas.getBoundingClientRect(), x = event.clientX - rect.left, y = event.clientY - rect.top;
    if (state.screen === "title") {
        if (state.isBusy || (state.transition && state.transition.active)) return;
        const cx = LAYOUT.CANVAS_WIDTH / 2, cy = LAYOUT.CANVAS_HEIGHT / 2, buttonOffsetY = 85;
        const btnAi = { x: cx - 120, y: cy - 30 + buttonOffsetY, w: 240, h: 60 }, btnPvp = { x: cx - 120, y: cy + 50 + buttonOffsetY, w: 240, h: 60 };
        if (x >= btnAi.x && x <= btnAi.x + btnAi.w && y >= btnAi.y && y <= btnAi.y + btnAi.h) { state.visuals.titleClick = "ai";
            state.transition = { active: true, type: "titleToGame", timer: 0, duration: 20, targetMode: "ai" };
        } 
        else if (x >= btnPvp.x && x <= btnPvp.x + btnPvp.w && y >= btnPvp.y && y <= btnPvp.y + btnPvp.h) { state.visuals.titleClick = "pvp";
            state.transition = { active: true, type: "titleToGame", timer: 0, duration: 20, targetMode: "pvp" };
        }
        return;
    } else if (state.screen === "clear") {
        if (state.resultScreenTimer < 300) return;
        initGameState(); return;
    } else if (state.screen === "gameover" || state.screen === "stage_clear") {
        if (state.resultScreenTimer < 55) return;
        const cy = LAYOUT.CANVAS_HEIGHT / 2;
        if (state.screen === "stage_clear") {
            const retryY = cy + 135 + 30;
            if (y >= retryY - 15 && y <= retryY + 15) retryStage(); else nextStage();
        } else { if (state.gameMode === "ai") retryStage(); else startGame("pvp"); }
        return;
    }
    
    if (isInputLocked()) return;
    if (state.buildMode) {
        const cb = getCancelButtonBounds();
        if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
            state.visuals.cancelClick = performance.now();
            state.isBusy = true;
            setTimeout(() => { state.buildMode = null; state.pendingBox = null; state.isBusy = false; }, 150); return;
        }
        for (let i = 0; i < state.lanes.length; i++) {
            const l = getLaneBounds(i), padding = 15, node = state.lanes[i];
            if (x >= l.x - padding && x <= l.x + l.w + padding && y >= l.y - padding && y <= l.y + l.h + padding) {
                if (isNodeValidForMode(node, state.buildMode) || (state.buildMode === "harvest" && node.built && node.owner === state.currentPlayer && getCookLabel(node.type, node.cookState) === "early")) {
                    if (state.buildMode === "sapling") tryBuildNode(node);
                    else if (state.buildMode === "harvest") tryHarvestNode(node); else if (state.buildMode === "uchiwa") tryUchiwaNode(node);
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
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer); if (boxId === 2) canUse = canUseSkewer(state.currentPlayer);
            if (boxId === 3) canUse = canUseServe(state.currentPlayer); if (boxId === 4) canUse = canUseUchiwa(state.currentPlayer);
            if (canUse) { state.visuals.buttonClicks[i] = performance.now();
                placeWorker(boxId); } 
            else if (!isInputLocked()) {
                let reason = "";
                if (boxId === 2) reason = state.players[state.currentPlayer - 1].resources < 1 ? "NO MEAT" : "FULL";
                if (boxId === 3) reason = "NO TARGET"; if (boxId === 4) reason = "NO TARGET";
                if (reason) { 
                    state.visuals.statusMessages.push({ type: "hint", text: reason, startTime: performance.now(), duration: 800, x: b.x + b.w/2, y: b.y - 15 });
                    state.visuals.buttonErrors[i] = performance.now(); 
                    playSound("error"); 
                }
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
        else { if (lbl === "early") return false;
            if (lbl !== "burnt" && p.resources < 1) return false; }
        return true;
    }
    if (action.type === "uchiwa") {
        if (!levelConf.allowUchiwa || !node || !node.built) return false;
        const isOwn = node.owner === playerIndex, cv = node.cookState, heat = getBaseHeat(node.type);
        const boosted_lbl = getCookLabel(node.type, cv + heat + 1), curr_lbl = getCookLabel(node.type, cv);
        if (isOwn) { if (boosted_lbl === "burnt") return false; if (curr_lbl === "perfect") return false;
            if (boosted_lbl === "early" && profileName !== "reader") return false;
        } else { if (boosted_lbl === "burnt" && curr_lbl !== "burnt") return true;
            if (profileName === "thief" && (boosted_lbl==="okay"||boosted_lbl==="perfect") && curr_lbl==="early") return true; return false;
        }
        return true;
    }
    return true;
}
function scoreAIAction(currentState, action, playerIndex, profileName) {
    let score = 0; const p = currentState.players[playerIndex - 1];
    const node = currentState.lanes.find(l => l.id === action.nodeId);
    const order = currentState.todaysOrder ? currentState.todaysOrder.id : null;
    if (action.type === "meat") { 
        if (p.resources === 0) score += 15;
        else if (p.resources === 1) score -= 1; else score -= 15;
    }
    else if (action.type === "put") { 
        score += 10;
        if (profileName === "gambler" && node.type === "strong") score += 40;
        if (profileName === "master" && node.type === "weak") score += 15;
        if (order === "strong" && node.type === "strong") score += 15;
    }
    else if (action.type === "serve") {
        const lbl = getCookLabel(node.type, node.cookState), isOwn = node.owner === playerIndex;
        const isSteal = !isOwn;
        
        const actualScore = getHarvestScore(node, isSteal, lbl);
        score += actualScore * 10;
        if (lbl === "burnt") { 
            score += 25;
            if (profileName === "master") score += 20;
            if (profileName === "gambler") score -= 10;
            if (order === "burnt") score += 15;
        }
        else if (!isOwn) { 
            if (lbl === "perfect") score += (profileName === "thief" ? 80 : 30);
            if (lbl === "okay") score += (profileName === "thief" ? 50 : 10);
            if (order === "steal") score += 25;
        } else { 
            if (lbl === "perfect") score += 100;
            if (lbl === "okay") { score += (profileName === "gambler" ? 45 : 15); }
        }
    } else if (action.type === "uchiwa") {
        const isOwn = node.owner === playerIndex, boosted_lbl = getCookLabel(node.type, node.cookState + getBaseHeat(node.type) + 1);
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
    if (state.screen !== "game" || state.isBusy || state.isAIThinking || state.gameOver || state.introSequenceActive) return;
    if (state.pendingPlayer !== null || state.turnSplashTimer > 0 || state.aiBreathTimer > 0 || state.cookPreviewActive || state.startRouletteActive || state.startRouletteBlinkActive) return;
    if (state.players[state.currentPlayer - 1].workersRemaining <= 0) return;
    
    state.isAIThinking = true;
    const levelConf = AI_LEVEL_CONFIG[state.aiLevel] || AI_LEVEL_CONFIG[2], profile = state.aiProfile;
    let cands = buildActionCandidates(state, state.currentPlayer).filter(a => isActionValidForAI(state, a, state.currentPlayer, profile, levelConf));
    if (cands.length === 0) cands.push({ type: "meat" });
    let scored = cands.map(a => ({ action: a, score: scoreAIAction(state, a, state.currentPlayer, profile) + (Math.random() * 2 - 1) * levelConf.scoreNoise }));
    scored.sort((a, b) => b.score - a.score); let best = scored[0].action;
    if (scored.length > 1) {
        if (Math.random() < levelConf.mistake) { let pool = scored.filter((s, i) => i >= 1 && i <= 2 && (scored[0].score - s.score) <= 15);
            if (pool.length > 0) best = pool[Math.floor(Math.random() * pool.length)].action; }
        else if (Math.random() < levelConf.rand) { let pool = scored.slice(0, levelConf.topCandRange).filter(s => (scored[0].score - s.score) <= 12);
            if (pool.length > 1) best = pool[Math.floor(Math.random() * pool.length)].action; }
        else { let second = scored[1];
            if ((scored[0].score - second.score) <= levelConf.closeThresh && Math.random() < levelConf.closeRate) best = second.action;
        }
    }

    let delay = 450;
    if (best.type === "meat") delay = 250 + Math.random() * 100;
    else if (best.type === "put") delay = 400 + Math.random() * 150;
    else if (best.type === "serve") delay = 500 + Math.random() * 200;
    else if (best.type === "uchiwa") delay = 650 + Math.random() * 250;
    if (best.nodeId) {
        state.visuals.aiTargetLane = {
            laneId: best.nodeId,
            startTime: performance.now(),
            duration: Math.min(delay, 500)
        };
    }

    setTimeout(() => {
        try {
            if (best.type === "meat") placeWorker(1);
            else if (best.type === "put") { state.buildMode="sapling"; state.buildModeStartTime=performance.now(); tryBuildNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "serve") { state.buildMode="harvest"; state.buildModeStartTime=performance.now(); tryHarvestNode(state.lanes.find(l=>l.id===best.nodeId)); }
            else if (best.type === "uchiwa") { state.buildMode="uchiwa"; state.buildModeStartTime=performance.now(); tryUchiwaNode(state.lanes.find(l=>l.id===best.nodeId)); }
      
        } finally { state.isAIThinking = false; }
    }, delay);
}

// ==========================================
// 7. render/render.js - 描画処理
// ==========================================
function getFadeAlpha(currentTimer, maxTimer, fadeFrames = 10) {
    if (currentTimer > maxTimer - fadeFrames) return Math.max(0, (maxTimer - currentTimer) / fadeFrames);
    if (currentTimer < fadeFrames) return Math.max(0, currentTimer / fadeFrames); return 1.0;
}

// 【完全ドット絵化】半透明を廃止し、ソリッドなピクセル枠を描画する
function drawBevelRect(ctx, x, y, w, h, baseColor, isPressed = false) {
    // ピクセルグリッドにスナップ(小数点座標によるアンチエイリアスを防ぐ)
    const px = Math.round(x);
    const py = Math.round(y);
    const pw = Math.round(w);
    const ph = Math.round(h);
    const scale = 4; // ドットの粗さ(仮想ピクセルサイズ)

    // ソリッドなハイライトとシャドウの色を計算(rgbaの重ねがけは禁止)
    const lightColor = brightenColor(baseColor, 0.4);
    const darkColor = mixColor(baseColor, "#000000", 0.6);
    const darkestColor = mixColor(baseColor, "#000000", 0.85);

    // 1. 背景の塗りつぶし
    ctx.fillStyle = baseColor;
    ctx.fillRect(px, py, pw, ph);

    // 2. ドット絵らしいソリッドな枠線(上が明るく、下が暗い)
    if (isPressed) {
        // 押下時:全体が沈み、上部が一番暗くなる
        ctx.fillStyle = darkestColor;
        ctx.fillRect(px, py, pw, scale * 2); // 上の深い影
        ctx.fillRect(px, py, scale * 2, ph); // 左の深い影
        
        ctx.fillStyle = darkColor;
        ctx.fillRect(px + pw - scale, py, scale, ph); // 右
        ctx.fillRect(px, py + ph - scale, pw, scale); // 下
    } else {
        // 通常時:上と左にハイライト、下と右にシャドウ
        ctx.fillStyle = lightColor;
        ctx.fillRect(px, py, pw, scale); // 上
        ctx.fillRect(px, py, scale, ph); // 左

        ctx.fillStyle = darkColor;
        ctx.fillRect(px, py + ph - scale, pw, scale); // 下
        ctx.fillRect(px + pw - scale, py, scale, ph); // 右
        
        // ピクセルアート特有の角の処理(カドを落とす)
        ctx.fillStyle = darkestColor;
        ctx.fillRect(px, py + ph - scale, scale, scale); // 左下
        ctx.fillRect(px + pw - scale, py, scale, scale); // 右上
        ctx.fillRect(px + pw - scale, py + ph - scale, scale, scale); // 右下
    }
}

function drawTitleButton(ctx, x, y, w, h, label, accentColor, isPressed = false) {
    // 完全にピクセル化されたボタンスタイルに変更
    drawBevelRect(ctx, x, y, w, h, isPressed ? "#2a2a2a" : "#3a3a40", isPressed);
    const offset = isPressed ? 2 : 0;
    // シャドウ
    ctx.fillStyle = "#000"; ctx.font = getPixelFont(14); ctx.textAlign = "center"; ctx.fillText(label, x + w / 2 + 2, y + h / 2 + 6 + offset + 2);
    // メインテキスト
    ctx.fillStyle = "#f4e6d0"; ctx.fillText(label, x + w / 2, y + h / 2 + 6 + offset);
}

function drawDeliciousYakitori(ctx, x, y, w, h, baseColor, isNegi, dangerOverlay = false, status = "RAW", laneType = "medium", now = 0, isPreBurnt = false, isPrePerfect = false) {
    let finalBaseColor = baseColor;
    if (isPreBurnt) {
        finalBaseColor = brightenColor(finalBaseColor, 0.05);
        finalBaseColor = mixColor(finalBaseColor, "#aa5533", 0.08);
    } else if (isPrePerfect) {
        finalBaseColor = brightenColor(finalBaseColor, 0.05);
    }

    ctx.fillStyle = finalBaseColor;
    if (isNegi) { 
        const nx = x + 4;
        const nw = w - 8; ctx.fillRect(nx, y, nw, h);
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(nx + 2, y + 2, nw - 4, 4);
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(nx, y + h - 6, nw, 6); ctx.fillRect(nx + nw - 4, y, 4, h);
        if (status === "PERFECT" || isPreBurnt) {
            ctx.fillStyle = isPreBurnt ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.15)";
            ctx.fillRect(nx + 2, y + h/2, 2, 2);
        }
    } else { 
        ctx.fillRect(x + 4, y, w - 8, h);
        ctx.fillRect(x, y + 4, w, h - 8); ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(x + 6, y + 4, w - 16, 4); ctx.fillRect(x + 4, y + 8, 4, 6);
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)"; ctx.fillRect(x + 4, y + h - 8, w - 8, 8);
        ctx.fillRect(x + w - 6, y + 6, 4, h - 14);
        if (status === "OKAY" || status === "PERFECT" || isPreBurnt) {
            let shineAlpha = 0;
            const flicker = Math.sin(now / 150 + x) * 0.5 + 0.5;
            if (isPreBurnt) { shineAlpha = 0.25 + flicker * 0.1;
            } 
            else if (status === "OKAY") { shineAlpha = 0.2 + flicker * 0.2;
            } 
            else if (status === "PERFECT") { shineAlpha = 0.5 + flicker * 0.4;
                if (laneType === "medium") shineAlpha += 0.2; 
            }
            if (shineAlpha > 0) {
                ctx.fillStyle = `rgba(255, 255, 220, ${Math.min(1, shineAlpha)})`;
                ctx.fillRect(x + 8, y + 8, 2, 2);
                if ((status === "PERFECT" || isPreBurnt) && flicker > 0.5) ctx.fillRect(x + w - 10, y + h/2, 1, 1);
            }
        }
    }
    if (dangerOverlay && !isPreBurnt) { 
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
        ctx.fillRect(x + 4, y + h - 6, w - 8, 6);
        ctx.fillRect(x + w - 8, y + 4, 4, h - 8);
    }
}

function drawDotIcon(ctx, iconId, cx, cy, color, scale = 4) {
    const data = ICON_DATA[iconId]; if (!data) return;
    const isDisabled = (color === "#888"); let offsetX = 0;
    if (iconId === "put_skewer" || iconId === "serve_plate" || iconId === "burnt_skewer") offsetX = 3;
    for (let i = 0; i < 64; i++) {
        const val = data[i];
        if (val !== 0) { ctx.fillStyle = isDisabled ? "#888" : (ICON_PALETTE[val] || color);
            ctx.fillRect(cx + offsetX - (4 * scale) + (i % 8) * scale, cy - (4 * scale) + Math.floor(i / 8) * scale, scale, scale);
        }
    }
}
function getBuildModeIcon(mode) { if (mode === "sapling") return "put_skewer"; if (mode === "harvest") return "serve_plate";
    if (mode === "uchiwa") return "uchiwa"; return null; }
function drawLaneHint(ctx, lane, laneIndex, mode, activePlayer, pResources) {
    if (!lane.built || !mode) return;
    const b = getLaneBounds(laneIndex); const laneCx = b.x + b.w / 2, hintY = b.y - 18;
    const status = getCookLabel(lane.type, lane.cookState), isOwn = lane.owner === activePlayer;
    const canSteal = !isOwn && status !== "early" && status !== "burnt" && pResources >= 1;
    if (mode === "harvest") {
        if (status === "early") { drawDotIcon(ctx, "cross", laneCx, hintY, "#cc7777", 1.6);
        } 
        else if (status === "burnt") { if (isOwn) drawDotIcon(ctx, "cross", laneCx, hintY, "#555", 2);
            else drawDotIcon(ctx, "trash", laneCx, hintY, "#ccc", 2); } 
        else if (isOwn) { if (status === "perfect") drawDotIcon(ctx, "diamond", laneCx, hintY, "#ff4", 2);
            else if (status === "okay") drawDotIcon(ctx, "diamond", laneCx, hintY, "#ddd", 2);
        } 
        else if (canSteal) drawDotIcon(ctx, "meat", laneCx, hintY, "#f33", 2);
        else drawDotIcon(ctx, "warning", laneCx, hintY, "#888", 2);
    }
}

// ドット絵ルール: RadialGradientを削除し、純粋な四角形で構成
function drawSparkles(ctx, cx, y, isHarvestMode, isPreview, extraAlpha = 0, scale = 1) {
    const baseAlpha = isPreview ? 0.3 : (isHarvestMode ? 0.8 : 0.65);
    ctx.globalAlpha = Math.min(1.0, baseAlpha + extraAlpha); ctx.fillStyle = "rgba(255, 255, 200, 0.9)";
    const positions = [{ dx: -32, dy: 15 }, { dx: 32, dy: 40 }, { dx: -28, dy: 70 }, { dx: 26, dy: 85 }];
    const w1 = 3 * scale, h1 = 10 * scale, w2 = 10 * scale, h2 = 3 * scale;
    positions.forEach((pos, idx) => { ctx.fillRect(cx + pos.dx - w1/2, y + pos.dy - h1/2, w1, h1); ctx.fillRect(cx + pos.dx - w2/2, y + pos.dy - h2/2, w2, h2); });
    ctx.globalAlpha = 1.0;
}

function drawEndSplash(ctx) {
    if (!state.endSplashTimer || state.endSplashTimer <= 0) return;
    const cx = LAYOUT.CANVAS_WIDTH / 2;
    const cy = LAYOUT.CANVAS_HEIGHT / 2; const t = state.endSplashTimer; const alpha = t > 40 ?
        (55 - t) / 15 : Math.min(1, t / 12);
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)"; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    ctx.font = getPixelFont(24); ctx.textAlign = "center"; 
    // ドロップシャドウ
    ctx.fillStyle = "#000"; ctx.fillText(state.endSplashText, cx + 2, cy + 2);
    ctx.fillStyle = state.endSplashColor || "#fff"; ctx.fillText(state.endSplashText, cx, cy);
    ctx.font = getPixelFont(10); ctx.fillStyle = "#aaa"; ctx.fillText("MATCH END", cx, cy + 35); ctx.restore();
}

function drawIntroOrderSlip(ctx, cx, y, orderObj) {
    const scale = 1.5;
    const titleFontSize = 10 * scale;
    const textFontSize = 14 * scale;
    const iconScale = 2.5 * scale;
    
    const cardW = Math.round(235 * scale);
    const cardH = Math.round(50 * scale);
    const cardX = Math.round(cx - cardW / 2);
    const cardY = Math.round(y);
    drawBevelRect(ctx, cardX, cardY, cardW, cardH, "#e0d6c8");
    
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(cardX, cardY, cardW, Math.round(3 * scale));
    const splitX = cardX + Math.round(cardW * 0.65);

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#4a4a4a";
    const leftCenterX = cardX + (splitX - cardX) / 2;
    ctx.font = getPixelFont(titleFontSize);
    ctx.fillText("TODAY'S ORDER", leftCenterX, cardY + 16 * scale);
    
    ctx.fillStyle = "#c85a4a";
    ctx.font = getPixelFont(textFontSize);
    ctx.fillText(orderObj.label, leftCenterX, cardY + 38 * scale);

    ctx.fillStyle = "rgba(90, 74, 58, 0.2)";
    ctx.fillRect(splitX, cardY + 5 * scale, 2, cardH - 10 * scale);
    
    if (orderObj.icon && orderObj.bonus) {
        const rewardX = splitX + (cardX + cardW - splitX) / 2;
        const centerY = cardY + cardH / 2;
        const offset = 6 * scale;
        drawDotIcon(ctx, orderObj.icon, rewardX - offset, centerY, orderObj.color || "#4a4a4a", iconScale);
        
        ctx.fillStyle = "#4a4a4a";
        ctx.font = getPixelFont(titleFontSize);
        ctx.textAlign = "left";
        ctx.fillText(orderObj.bonus, rewardX + offset, centerY);
    }
    ctx.restore();
}

function drawCompactOrderCard(ctx, cx, y, orderObj) {
    const cardW = 150;
    const cardH = 30;
    const cardX = cx - cardW / 2;
    const cardY = y;
    drawBevelRect(ctx, cardX, cardY, cardW, cardH, "#4a3c31");
    
    ctx.save();
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillStyle = "#d4c8b8"; 
    ctx.font = getPixelFont(9);
    ctx.fillText(orderObj.label, cardX + 10, cardY + cardH / 2);
    
    const splitX = cardX + cardW * 0.55;
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fillRect(splitX, cardY + 4, 1, cardH - 8);
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.fillRect(splitX + 1, cardY + 4, 1, cardH - 8);
    if (orderObj.icon && orderObj.bonus) {
        const iconScale = 2.2;
        drawDotIcon(ctx, orderObj.icon, splitX + 18, cardY + cardH / 2, orderObj.color || "#fff", iconScale);
        ctx.textAlign = "left";
        
        // テキストシャドウ
        ctx.fillStyle = "#000";
        ctx.font = getPixelFont(12);
        ctx.fillText(orderObj.bonus, splitX + 38 + 1, cardY + cardH / 2 + 1);

        ctx.fillStyle = "#ffeb3b";
        ctx.fillText(orderObj.bonus, splitX + 38, cardY + cardH / 2);
    }
    ctx.restore();
}

// --------------------------------------------------
// ドット絵ルールの背景描画(ellipse廃止)
// --------------------------------------------------
function drawBackgroundProps(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = "#181310"; // ソリッドな暗がり

    // メニュー札
    for(let i = 0; i < 6; i++) {
        ctx.fillRect(w * 0.02 + i * 45, h * 0.05, 35, 90);
    }

    // 提灯のシルエット(四角の組み合わせ)
    const lanternX = w * 0.95;
    const lanternY = h * 0.2;
    ctx.fillRect(lanternX - 40, lanternY - 75, 80, 150); // 本体
    ctx.fillRect(lanternX - 25, lanternY - 85, 50, 10); // 上枠
    ctx.fillRect(lanternX - 25, lanternY + 75, 50, 10); // 下枠

    // 焼酎ボトルや徳利
    ctx.fillRect(w * 0.05, h * 0.65, 25, 80); 
    ctx.fillRect(w * 0.12, h * 0.72, 20, 73); 
    ctx.fillRect(w * 0.22 - 15, h * 0.82, 30, 35); // 徳利本体
    ctx.fillRect(w * 0.22 - 8, h * 0.82 - 50, 16, 50); // 徳利首

    // 箸立てやジョッキ
    ctx.fillRect(w * 0.88, h * 0.75, 40, 60); 
    ctx.fillRect(w * 0.82, h * 0.78, 35, 55); 
    ctx.fillRect(w * 0.82 - 10, h * 0.80, 10, 30); 
    
    ctx.restore();
}

function drawCharcoal(ctx, lane, bounds, now, laneIndex) {
    const { x, y, w, h } = bounds;
    
    // 炉の奥行き(底の暗がり)を表現する背景
    ctx.fillStyle = "#0a0a0c";
    ctx.fillRect(x, y + h * 0.4, w, h * 0.6);

    const numCoals = 14; 
    const startY = y + h * 0.55;
    const endY = y + h * 0.95;

    let baseRed = 0.15; 
    if (lane.type === "medium") baseRed = 0.35;
    else if (lane.type === "strong") baseRed = 0.65;

    ctx.save();

    // 先に薄い灰(Ash)を底に敷き詰める(ellipse廃止)
    for (let i = 0; i < 8; i++) {
        const pr1 = Math.abs(Math.sin(laneIndex * 5 + i * 7));
        const pr2 = Math.abs(Math.cos(laneIndex * 3 + i * 11));
        
        ctx.fillStyle = `#333333`; // ソリッドな灰
        const ashX = x + pr1 * (w - 10);
        const ashY = startY + pr2 * (endY - startY);
        
        const ashW = 20 + pr1 * 16;
        const ashH = 10 + pr2 * 12;
        ctx.fillRect(ashX, ashY, ashW, ashH);
    }

    // 炭の塊を不規則に描画
    for (let i = 0; i < numCoals; i++) {
        const pr1 = Math.abs(Math.sin(laneIndex * 13 + i * 17));
        const pr2 = Math.abs(Math.cos(laneIndex * 19 + i * 23));
        const pr3 = Math.abs(Math.sin(laneIndex * 29 + i * 31));

        const cw = 10 + pr1 * 14; 
        const ch = 6 + pr2 * 8;
        const cx = x + pr3 * (w - cw);
        const cy = startY + pr1 * (endY - startY - ch);

        // 炭の外周(ブロック状)
        ctx.fillStyle = pr2 > 0.4 ? "#151515" : "#0a0a0a";
        ctx.fillRect(cx, cy, cw, ch); 

        // グラデーションを廃止し、ソリッドな四角形の重なりで熱を表現
        if (pr2 < baseRed) {
            const flickerSpeed = 800 + pr1 * 400;
            const isBright = Math.sin(now / flickerSpeed) > 0; 

            // 中間の赤
            ctx.fillStyle = isBright ? "#881100" : "#550a00";
            ctx.fillRect(cx + 2, cy + 2, cw - 4, ch - 4);

            // 中心のもっとも熱い部分
            if (isBright && pr2 < baseRed * 0.7) {
                ctx.fillStyle = "#dd4411";
                ctx.fillRect(cx + 4, cy + 4, cw - 8, ch - 8);
            }
        }
    }

    // 炉の深さを出すためのシャドウ(グラデーションではなくソリッドな重ね)
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(x, startY - 10, w, 20); // 少し上の暗がり
    ctx.fillRect(x, startY + 10, w, (y + h) - startY - 10); // 下半分の暗がり

    ctx.restore();
}

function drawGrillDirt(ctx, bounds, laneIndex) {
    const { x, y, w, h } = bounds;
    ctx.save();
    for (let k = 0; k < 6; k++) {
        const pr1 = Math.abs(Math.sin(laneIndex * 8 + k * 17));
        const pr2 = Math.abs(Math.cos(laneIndex * 12 + k * 23));
        const dirtX = x + pr1 * w;
        const dirtY = y + pr2 * h;
        const dirtSize = 4 + Math.floor(pr1 * 3) * 4; 
        
        ctx.fillStyle = pr2 > 0.5 ? "#221100" : "#111111";
        ctx.fillRect(dirtX, dirtY, dirtSize, dirtSize);
    }
    ctx.restore();
}

// ドット絵ルールの煙(ellipse廃止)
function drawAmbientSmoke(ctx, w, h) {
    const now = getTime();
    ctx.save();
    ctx.fillStyle = "#221d1b"; // 背景に近いソリッドカラー
    for(let i = 0; i < 3; i++) {
        const cx = w * 0.35 + (w * 0.15 * i);
        const cy = h * 0.6;
        const offsetX = Math.sin(now / 2500 + i) * 40;
        const offsetY = ((now / 40) + i * 400) % (h * 0.6);
        const size = 70 + Math.sin(now / 2000 + i) * 20;

        // ピクセルブロックの塊として描く
        const blockSize = 20;
        const blocks = Math.floor(size / blockSize);
        for (let bx = -blocks; bx <= blocks; bx++) {
            for (let by = -blocks; by <= blocks; by++) {
                if (Math.abs(bx) + Math.abs(by) < blocks * 1.5) {
                    ctx.fillRect(cx + offsetX + bx * blockSize, cy - offsetY + by * blockSize, blockSize, blockSize);
                }
            }
        }
    }
    ctx.restore();
}

function drawTableBackground(ctx) {
    const w = LAYOUT.CANVAS_WIDTH;
    const h = LAYOUT.CANVAS_HEIGHT;

    // ソリッドな帯で背景を描画(グラデーション廃止)
    ctx.fillStyle = "#130a08";
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = LAYOUT.COLORS.BG;
    ctx.fillRect(0, h * 0.3, w, h * 0.4);
    ctx.fillStyle = "#221510";
    ctx.fillRect(0, h * 0.7, w, h * 0.3);

    // ドット絵風の直線テーブルライン(ベクトル曲線の廃止)
    ctx.fillStyle = "#110a08";
    for (let y = 0; y < h; y += 45) {
        ctx.fillRect(0, y, w, 4);
    }

    drawBackgroundProps(ctx, w, h);
    drawAmbientSmoke(ctx, w, h);
}

function render(ctx) {
    const now = getTime();
    state.visuals.ghosts = state.visuals.ghosts.filter(g => now - g.startTime < 1000);
    
    state.visuals.statusMessages = state.visuals.statusMessages.filter(m => { 
        const life = m.duration || 1000;
        return now - m.startTime < life; 
    });
    state.visuals.traces = state.visuals.traces.filter(t => now - t.time < 2000);
    
    if (state.screen === "game") {
        drawTableBackground(ctx);
    } else {
        ctx.fillStyle = LAYOUT.COLORS.BG; 
        ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    }
    
    const cx = LAYOUT.CANVAS_WIDTH / 2, cy = LAYOUT.CANVAS_HEIGHT / 2;
    if (state.screen === "title") {
        const logoOffsetY = -205, buttonOffsetY = 85;
        if (logoImage.complete && logoImage.naturalWidth > 0) { 
            const logoMaxW = Math.min(320, LAYOUT.CANVAS_WIDTH * 0.82);
            const ratio = logoImage.naturalHeight / logoImage.naturalWidth, logoW = logoMaxW, logoH = logoW * ratio;
            ctx.drawImage(logoImage, cx - logoW / 2, cy + logoOffsetY, logoW, logoH);
        }
        const btnAi = { x: cx - 120, y: cy - 30 + buttonOffsetY, w: 240, h: 60 }, btnPvp = { x: cx - 120, y: cy + 50 + buttonOffsetY, w: 240, h: 60 };
        drawTitleButton(ctx, btnAi.x, btnAi.y, btnAi.w, btnAi.h, "VS AI", "rgba(255, 150, 60, 0.45)", state.visuals.titleClick === "ai");
        drawTitleButton(ctx, btnPvp.x, btnPvp.y, btnPvp.w, btnPvp.h, "VS PLAYER", "rgba(255, 80, 60, 0.45)", state.visuals.titleClick === "pvp");
    } else if (state.screen === "game") { 
        drawGameScreen(ctx); drawEndSplash(ctx);
    } else if (state.screen === "clear") {
        state.resultScreenTimer++; const timer = state.resultScreenTimer;
        const alphaOverlay = Math.min(0.85, timer / 90);
        ctx.fillStyle = `rgba(30, 15, 10, ${alphaOverlay})`; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
        if (timer % 6 === 0) { state.visuals.floaters.push({ x: Math.random() * LAYOUT.CANVAS_WIDTH, y: LAYOUT.CANVAS_HEIGHT + 10, vx: (Math.random() - 0.5) * 0.4, vy: -0.4 - Math.random() * 0.6, life: 0, maxLife: 200 + Math.random() * 150, size: 2 + Math.random() * 4 });
        }
        for (let i = state.visuals.floaters.length - 1; i >= 0; i--) {
            let f = state.visuals.floaters[i];
            f.life++; if (f.life >= f.maxLife) { state.visuals.floaters.splice(i, 1); continue; }
            f.x += f.vx;
            f.y += f.vy; const ratio = f.life / f.maxLife; ctx.globalAlpha = Math.max(0, 1 - ratio);
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 50}, 50, 0.8)`; ctx.fillRect(f.x, f.y, f.size, f.size);
        }
        ctx.globalAlpha = 1.0; ctx.textAlign = "center";
        if (timer > 60) { ctx.globalAlpha = Math.min(1, (timer - 60) / 45); ctx.font = getPixelFont(24); ctx.fillStyle = "#ffeb3b";
            ctx.fillText("SURVIVAL CLEAR", cx, cy - 80); }
        if (timer > 140) { ctx.globalAlpha = Math.min(1, (timer - 140) / 45);
            ctx.font = getPixelFont(12); ctx.fillStyle = "#e0e0e0"; ctx.fillText("You mastered the grill.", cx, cy - 30);
        }
        if (timer > 220) { ctx.globalAlpha = Math.min(1, (timer - 220) / 45);
            ctx.font = getPixelFont(12); ctx.fillStyle = "#fa3"; ctx.fillText("THANK YOU FOR PLAYING", cx, cy + 20);
        }
        if (timer > 300) { const pulse = 0.85 + 0.15 * Math.sin(getTime() / 600);
            ctx.globalAlpha = Math.min(1, (timer - 300) / 45) * pulse; ctx.font = getPixelFont(14); ctx.fillStyle = "#fff";
            ctx.fillText("▶ BACK TO TITLE", cx, cy + 100); }
        ctx.globalAlpha = 1.0;
    } else if (state.screen === "gameover" || state.screen === "stage_clear") {
        state.resultScreenTimer++;
        const timer = state.resultScreenTimer;
        if (timer >= 10) {
            let titleText = state.winnerText;
            let titleColor = "#fff";
            if (state.screen === "gameover") { if (titleText.includes("P1")) titleColor = LAYOUT.COLORS.P1; else if (titleText.includes("DRAW")) titleColor = "#888";
                else titleColor = LAYOUT.COLORS.P2; } else { titleColor = "#ffeb3b";
            }
            if (!state.visuals.resultComment) {
                const diff = Math.abs((state.players[0].finalScore || state.players[0].score) - (state.players[1].finalScore || state.players[1].score));
                let comment = "Good game.";
                if (state.screen === "gameover" && !state.winnerText.includes("DRAW") && diff <= 2) comment = "So close.";
                else if (state.players[0].stats.perfect >= 3 || state.players[1].stats.perfect >= 3) comment = "Nice timing.";
                else if (state.players[0].stats.burnt >= 3 || state.players[1].stats.burnt >= 3) comment = "Still counts.";
                else if (state.players[0].stats.steal >= 2 || state.players[1].stats.steal >= 2) comment = "Nice steal.";
                state.visuals.resultComment = comment;
            }
            const alpha = Math.min(1, (timer - 10) / 10);
            ctx.globalAlpha = alpha;
            if (timer === 10 || timer === 11) { ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
                ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT); }
            ctx.font = getPixelFont(28);
            ctx.textAlign = "center"; ctx.fillStyle = titleColor; ctx.fillText(titleText, cx, cy - 110);
            ctx.font = getPixelFont(12); ctx.fillStyle = "#888";
            ctx.fillText(state.visuals.resultComment, cx, cy - 80); ctx.globalAlpha = 1.0;
        }
        if (timer >= 30) {
            const alpha = Math.min(1, (timer - 30) / 10), p1Score = state.players[0].finalScore ||
                state.players[0].score, p2Score = state.players[1].finalScore || state.players[1].score;
            const p2Name = state.gameMode === "ai" ? state.enemyName : "P2";
            let p1Color = LAYOUT.COLORS.P1, p2Color = LAYOUT.COLORS.P2, p1Alpha = 1.0, p2Alpha = 1.0;
            if (p1Score > p2Score) { p2Color = "#555"; p2Alpha = 0.5;
            } 
            else if (p2Score > p1Score) { p1Color = "#555";
                p1Alpha = 0.5; } 
            
            ctx.globalAlpha = alpha * p1Alpha;
            ctx.textAlign = "left";
            ctx.fillStyle = p1Color; ctx.font = getPixelFont(16); ctx.fillText("P1", cx - 80, cy - 25);
            ctx.textAlign = "right";
            ctx.fillText(`${p1Score}`, cx + 80, cy - 25);
            
            ctx.globalAlpha = alpha * p2Alpha; ctx.textAlign = "left"; ctx.fillStyle = p2Color;
            ctx.fillText(p2Name, cx - 80, cy + 5);
            ctx.textAlign = "right"; ctx.fillText(`${p2Score}`, cx + 80, cy + 5);
        }
        if (timer >= 55) {
            const alpha = Math.min(1, (timer - 55) / 10), p1Score = state.players[0].finalScore ||
                state.players[0].score, p2Score = state.players[1].finalScore || state.players[1].score;
            let p1Color = LAYOUT.COLORS.P1, p2Color = LAYOUT.COLORS.P2, p1Alpha = 1.0, p2Alpha = 1.0;
            if (p1Score > p2Score) { p2Color = "#555"; p2Alpha = 0.5;
            } 
            else if (p2Score > p1Score) { p1Color = "#555";
                p1Alpha = 0.5; } 
            
            ctx.font = getPixelFont(10);
            const statsLabels = ["PERFECT", "BURNT", "STEAL"];
            statsLabels.forEach((label, i) => {
                const statKey = label.toLowerCase();
                const y = cy + 45 + i * 18;
                
                ctx.globalAlpha = alpha; ctx.textAlign = "left"; ctx.fillStyle = "#888";
                ctx.fillText(label, cx - 80, y);
                
                ctx.globalAlpha = alpha * p1Alpha; ctx.fillStyle = p1Color; ctx.textAlign = "right";
                ctx.fillText(state.players[0].stats[statKey], cx + 15, y);
                
                ctx.globalAlpha = alpha; ctx.fillStyle = "#555"; ctx.textAlign = "center";
                ctx.fillText("-", cx + 35, y);
                
                ctx.globalAlpha = alpha * p2Alpha; ctx.fillStyle = p2Color; ctx.textAlign = "left";
                ctx.fillText(state.players[1].stats[statKey], cx + 55, y);
            });
            const pulse = 0.88 + 0.12 * Math.sin(getTime() / 500);
            ctx.globalAlpha = alpha; const btnY = cy + 120; ctx.save();
            ctx.translate(cx, btnY);
            if (state.screen === "stage_clear") {
                ctx.globalAlpha = alpha * pulse;
                ctx.fillStyle = "#000"; ctx.font = getPixelFont(14); ctx.textAlign = "center"; ctx.fillText("▶ NEXT STAGE", 2, 2);
                ctx.fillStyle = "#fff"; ctx.fillText("▶ NEXT STAGE", 0, 0);
                ctx.globalAlpha = alpha; ctx.fillStyle = "#777";
                ctx.font = getPixelFont(12); ctx.fillText("▶ RETRY", 0, 30);
            } else {
                ctx.globalAlpha = alpha * pulse;
                ctx.font = getPixelFont(14); ctx.textAlign = "center";
                ctx.fillStyle = "#000";
                if (state.gameMode === "ai") { ctx.fillText("▶ RETRY", 2, 2); ctx.fillStyle = "#fff"; ctx.fillText("▶ RETRY", 0, 0);
                } 
                else { ctx.fillText("▶ REMATCH", 2, 2); ctx.fillStyle = "#fff"; ctx.fillText("▶ REMATCH", 0, 0);
                }
            }
            ctx.restore();
            ctx.globalAlpha = 1.0;
        }
    }
    
    if (state.transition && state.transition.active) {
        let t = state.transition.timer, d = state.transition.duration;
        let alpha = (t < d) ? (t / d) : (1 - (t - d) / d);
        alpha = Math.max(0, Math.min(1, alpha)); ctx.fillStyle = `rgba(22, 22, 32, ${alpha})`; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    }
    if (state.visuals.perfectFlash && state.visuals.perfectFlash.timer > 0) {
        const alpha = (state.visuals.perfectFlash.timer / 15) * 0.15;
        ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT); state.visuals.perfectFlash.timer--;
    }
}

function drawGameScreen(ctx) {
    const cx = LAYOUT.CANVAS_WIDTH / 2, safeTop = 15, panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25), now = getTime();
    const activePlayer = (state.startRouletteActive || state.startRouletteBlinkActive) ? (state.startRouletteBlinkActive ? state.startRouletteFinalPlayer : state.startRouletteIndex) : (state.pendingPlayer !== null ? state.pendingPlayer : state.currentPlayer);
    const pResources = state.players[activePlayer - 1].resources;
    
    const panelH = 95;
    drawPlayerPanel(ctx, state.players[0], 10, safeTop, panelW, panelH, 1, activePlayer);
    drawPlayerPanel(ctx, state.players[1], LAYOUT.CANVAS_WIDTH - panelW - 10, safeTop, panelW, panelH, 2, activePlayer);
    
    const p1Right = 10 + panelW;
    const p2Left = LAYOUT.CANVAS_WIDTH - panelW - 10;
    const centerSpace = p2Left - p1Right;
    
    ctx.font = getPixelFont(14);
    const roundText = `ROUND ${state.round}/${state.maxRounds}`;
    const tw = ctx.measureText(roundText).width;
    const hudW = Math.min(tw + 40, centerSpace - 20, 340);
    drawBevelRect(ctx, cx - hudW / 2, safeTop + 2, hudW, 36, "#1a100c");
    
    ctx.fillStyle = "#e0d6c8";
    ctx.textAlign = "center"; 
    ctx.fillText(roundText, cx, safeTop + 26);
    
    if (state.gameMode === "ai") { 
        ctx.font = getPixelFont(10);
        ctx.fillStyle = "#aaa";
        ctx.fillText(`STAGE ${state.currentStage}`, cx, safeTop + 50); 
    }

    let orderYOffset = safeTop + 70;
    if (state.todaysOrder && state.orderIntroDone) {
        drawCompactOrderCard(ctx, cx, orderYOffset, state.todaysOrder);
    }

    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i), laneCx = b.x + b.w / 2;
        const tracesForLane = state.visuals.traces.filter(t => t.laneIndex === i);
        tracesForLane.forEach(trace => {
            if (lane.built) return; 
            const elapsed = now - trace.time;
            let traceAlpha = 0;
   
            if (trace.type === "perfect") {
                traceAlpha = Math.max(0, 1 - (elapsed / 1200)) * 0.15;
                if (traceAlpha > 0) {
                    ctx.fillStyle = `rgba(255, 100, 30, ${traceAlpha})`;
                    ctx.fillRect(laneCx - 30, b.y + b.h*0.1, 60, 100);
                }
            } else if (trace.type === "burnt") {
                traceAlpha = Math.max(0, 1 - (elapsed / 2000)) * 0.2;
                if (traceAlpha > 0) {
                    ctx.fillStyle = `rgba(10, 10, 10, ${traceAlpha})`;
                    ctx.fillRect(laneCx - 15, b.y + b.h*0.1, 30, 80);
                }
            } else if (trace.type === "okay") {
                traceAlpha = Math.max(0, 1 - (elapsed / 800)) * 0.05;
                if (traceAlpha > 0) {
                    ctx.fillStyle = `rgba(200, 100, 50, ${traceAlpha})`;
                    ctx.fillRect(laneCx - 10, b.y + b.h*0.2, 20, 60);
                }
            }
        });
    });

    state.lanes.forEach((lane, i) => {
        const b = getLaneBounds(i), laneCx = b.x + b.w / 2;
        let effectiveCookState = lane.cookState, displayCookState = lane.cookState, gaugeCookState = lane.cookState;   
        let isCurrentPreviewLane = false, previewEventForThisLane = null, previewProg = 0; 

        if (state.cookPreviewActive) {
            previewEventForThisLane = state.cookPreviewEvents.find(e => e.laneIndex === i);
            
            const activeEvent = state.cookPreviewEvents[state.cookPreviewIndex];
            if (activeEvent && activeEvent.laneIndex === i) {
                isCurrentPreviewLane = true; previewProg = 1.0 - (state.cookPreviewPhaseTimer / COOK_PREVIEW_DUR);
                if (previewProg < 0.35) { displayCookState = activeEvent.prevCookState; gaugeCookState = activeEvent.prevCookState; } 
                else { displayCookState = activeEvent.newCookState; gaugeCookState = activeEvent.newCookState; }
  
                effectiveCookState = displayCookState;
            } else if (previewEventForThisLane) {
                const eventIndex = state.cookPreviewEvents.indexOf(previewEventForThisLane);
                if (eventIndex > state.cookPreviewIndex) { effectiveCookState = previewEventForThisLane.prevCookState; displayCookState = previewEventForThisLane.prevCookState; gaugeCookState = previewEventForThisLane.prevCookState;
                } else { effectiveCookState = previewEventForThisLane.newCookState;
                    displayCookState = previewEventForThisLane.newCookState; gaugeCookState = previewEventForThisLane.newCookState; }
            }
        }

        const heat = getBaseHeat(lane.type), boost = lane.uchiwaBoost ||
            0, baseEndState = effectiveCookState + heat + boost, baseEndStatus = getCookLabel(lane.type, baseEndState);
        let isFlashable = false, isPerfectTarget = false;
        let uchiwaTargetState = baseEndState; let uchiwaTargetStatus = baseEndStatus;
        if (state.buildMode) {
            isFlashable = isNodeValidForMode(lane, state.buildMode);
            if (state.buildMode === "harvest" && lane.built && lane.owner === activePlayer && getCookLabel(lane.type, effectiveCookState) === "early") isFlashable = true;
            if (state.buildMode === "harvest" && lane.built && lane.owner !== activePlayer) { if (getCookLabel(lane.type, effectiveCookState) !== "burnt" && pResources < 1) isFlashable = false;
            }
            if (state.buildMode === "harvest" && isFlashable && lane.built) { const status = getCookLabel(lane.type, effectiveCookState);
                if (status === "perfect") isPerfectTarget = true; }
            if (state.buildMode === "uchiwa" && isFlashable && lane.built) { uchiwaTargetState = baseEndState + 1;
                uchiwaTargetStatus = getCookLabel(lane.type, uchiwaTargetState); }
        }

        // --- 焼き台のドット絵化 ---
        const scale = 4; // ピクセルスケール
        const gridColor = "#4a4a55"; // 暗い鉄の色
        const gridHighlight = "#7a7a85"; // 鉄の反射

        // 1. 焼き台の外枠(太いドットの鉄枠)
        ctx.fillStyle = "#1a1a20";
        ctx.fillRect(b.x - scale, b.y - scale, b.w + scale * 2, b.h + scale * 2);
        ctx.fillStyle = "#2a2a35";
        ctx.fillRect(b.x, b.y, b.w, b.h);

        // ==== ここに炭火の追加描画 ====
        drawCharcoal(ctx, lane, b, now, i);
        // ==============================

        const currentStatus = getCookLabel(lane.type, effectiveCookState);
        const isPrePerfect = (currentStatus !== "perfect" && currentStatus !== "burnt" && baseEndStatus === "perfect");
        const isPreBurnt = (currentStatus !== "burnt" && baseEndStatus === "burnt");
        if (lane.built) {
            if (currentStatus === "perfect") { const pulse = 0.5 + 0.5 * Math.sin(now / 300);
                // ソリッドなハイライト線
                ctx.fillStyle = `rgba(255, 230, 120, ${0.2 + pulse * 0.2})`;
                ctx.fillRect(b.x - scale, b.y - scale, b.w + scale*2, scale);
                ctx.fillRect(b.x - scale, b.y - scale, scale, b.h + scale*2);
                ctx.fillRect(b.x - scale, b.y + b.h, b.w + scale*2, scale);
                ctx.fillRect(b.x + b.w, b.y - scale, scale, b.h + scale*2);
            }
        }
        
        let isDanger = false;
        if (lane.built && !lane.justPlaced) {
            if (currentStatus !== "burnt" && !isPreBurnt) {
                if (state.buildMode === "uchiwa" && isFlashable && uchiwaTargetStatus === "burnt") isDanger = true;
            }
        }
        
        // 2. 金網(ピクセル単位の四角形として描画)
        // 横線
        for (let j = 1; j <= 5; j++) { 
            const barY = Math.round(b.y + (b.h * j / 6));
            ctx.fillStyle = gridColor;
            ctx.fillRect(b.x, barY, b.w, scale);
            ctx.fillStyle = gridHighlight;
            ctx.fillRect(b.x, barY - 2, b.w, 2); // 1ピクセル風のハイライト
        }
        // 縦線
        [0.2, 0.8].forEach(ratio => { 
            const barX = Math.round(b.x + b.w * ratio);
            ctx.fillStyle = gridColor;
            ctx.fillRect(barX, b.y, scale, b.h);
            ctx.fillStyle = gridHighlight;
            ctx.fillRect(barX - 2, b.y, 2, b.h);
        });

        // ==== ここに金網の汚れの追加描画 ====
        drawGrillDirt(ctx, b, i);
        // ====================================
        
        let fireIntensity = lane.fire * 0.15; 
        const uchiwaTime = state.visuals.uchiwaGusts[lane.id];
        let gustWobble = 0; let fireSwayX = 0;
        if (uchiwaTime && now - uchiwaTime < 800) {
            const gustP = 1 - ((now - uchiwaTime) / 800);
            fireIntensity += 0.15 * gustP;
            gustWobble = Math.sin(now / 30) * 0.5 * gustP;
            fireSwayX = Math.sin(now / 40) * 2 * gustP;
        }

        let currentFireIntensity = fireIntensity;
        if (lane.type === "strong") { currentFireIntensity += (Math.sin(now / 100) * 0.05);
        } 
        else if (lane.type === "weak") { currentFireIntensity -= 0.05;
        }
        if (isPreBurnt && !lane.justPlaced) { currentFireIntensity += (Math.sin(now / 50) * 0.1);
        }

        // 熱の表現もグラデーションを廃止し、透過ブロックにする
        ctx.fillStyle = `rgba(255, 60, 10, ${Math.max(0, currentFireIntensity * 0.5)})`;
        ctx.fillRect(b.x, b.y + b.h - 50, b.w, 50);

        if (isFlashable) {
            const selectPulse = 0.5 + 0.5 * Math.sin(now / 350);
            if (state.buildMode === "harvest") {
                const harvestStatus = getCookLabel(lane.type, effectiveCookState);
                let fillAlphaBase = 0.08, fillAlphaRange = 0.10, rgb = "255, 255, 255";
                if (isPerfectTarget) rgb = "255, 230, 100";
                else if (harvestStatus === "burnt") { if (lane.owner !== activePlayer) rgb = "180, 180, 180";
                    else { rgb = "100, 100, 100"; fillAlphaBase = 0.04; fillAlphaRange = 0.04; 
                    } 
                } 
                else if (harvestStatus === "early") { rgb = "255, 80, 80";
                }
                const currentFillAlpha = fillAlphaBase + selectPulse * fillAlphaRange;
                ctx.fillStyle = `rgba(${rgb}, ${currentFillAlpha})`; ctx.fillRect(b.x, b.y, b.w, b.h); 
                // ベクター線の代わりに矩形の枠
                ctx.fillRect(b.x, b.y, b.w, 3); ctx.fillRect(b.x, b.y, 3, b.h);
                ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3); ctx.fillRect(b.x + b.w - 3, b.y, 3, b.h);
            } else if (state.buildMode === "uchiwa") {
                let fillAlphaBase = 0.08, fillAlphaRange = 0.10, rgb = "255, 255, 255";
                if (uchiwaTargetStatus === "burnt" && baseEndStatus !== "burnt") rgb = "255, 100, 100";
                else if (uchiwaTargetStatus === "perfect" && baseEndStatus !== "perfect") rgb = "255, 230, 100";
                const currentFillAlpha = fillAlphaBase + selectPulse * fillAlphaRange;
                ctx.fillStyle = `rgba(${rgb}, ${currentFillAlpha})`;
                ctx.fillRect(b.x, b.y, b.w, b.h);
                ctx.fillRect(b.x, b.y, b.w, 3); ctx.fillRect(b.x, b.y, 3, b.h);
                ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3); ctx.fillRect(b.x + b.w - 3, b.y, 3, b.h);
            } else {
                const currentFillAlpha = 0.08 + selectPulse * 0.10;
                ctx.fillStyle = `rgba(255, 255, 255, ${currentFillAlpha})`; ctx.fillRect(b.x, b.y, b.w, b.h); 
                ctx.fillRect(b.x, b.y, b.w, 3); ctx.fillRect(b.x, b.y, 3, b.h);
                ctx.fillRect(b.x, b.y + b.h - 3, b.w, 3); ctx.fillRect(b.x + b.w - 3, b.y, 3, b.h);
            }
        }

        if (lane.built) {
            const isUchiwaPreviewActive = (state.buildMode === "uchiwa" && isFlashable);
            const targetCookState = isUchiwaPreviewActive ? uchiwaTargetState : displayCookState;
            const displayStatusUpper = getCookLabel(lane.type, targetCookState).toUpperCase();
            const p = getVisualPalette(displayStatusUpper);
            let targetAlpha = lane.justPlaced ? 0.6 : 1.0; let fallYOffset = 0; let currentAlpha = targetAlpha;
            const pTime = state.visuals.placedAt[lane.id];
            if (pTime && now - pTime < 220) {
                const t = (now - pTime) / 220;
                const easeOut = 1 - Math.pow(1 - t, 3);
                fallYOffset = -18 * (1 - easeOut);
                currentAlpha = 0.1 + (targetAlpha - 0.1) * easeOut;
            }

            let breatheY = 0;
            if (displayStatusUpper === "PERFECT" && !lane.justPlaced) { breatheY = Math.sin(now / 260) * 1.5;
            }
            if (isPrePerfect && !lane.justPlaced) { breatheY = Math.sin(now / 150) * 0.5;
            }

            const stickH = b.h * 0.7, stickTop = b.y + b.h * 0.1 + fallYOffset + breatheY;
            const shakenLaneCx = laneCx + gustWobble;

            ctx.globalAlpha = currentAlpha;
            ctx.fillStyle = "#111"; ctx.fillRect(shakenLaneCx - 1, stickTop, 4, stickH);
            ctx.fillStyle = LAYOUT.COLORS.STICK;
            ctx.fillRect(shakenLaneCx - 2, stickTop, 4, stickH);
            const meatW = b.w * 0.6, meatH = stickH * 0.2, meatX = shakenLaneCx - meatW / 2;
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false, isDanger, displayStatusUpper, lane.type, now, isPreBurnt, isPrePerfect);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true, isDanger, displayStatusUpper, lane.type, now, isPreBurnt, isPrePerfect);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false, isDanger, displayStatusUpper, lane.type, now, isPreBurnt, isPrePerfect);
            
            ctx.globalAlpha = 1.0;
            const markerY = b.y - 10, markerSize = 9; ctx.fillStyle = lane.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2;
            let markerXOffset = 0;
            if (state.visuals.aiTargetLane && state.visuals.aiTargetLane.laneId === lane.id) {
                const elapsedAI = now - state.visuals.aiTargetLane.startTime;
                if (elapsedAI < state.visuals.aiTargetLane.duration) { markerXOffset = Math.sin(now / 40) * 1.5;
                }
            }
            // ドットの三角形
            ctx.fillRect(laneCx - 2 + markerXOffset, markerY - 2, 4, 4);
            ctx.fillRect(laneCx - 4 + markerXOffset, markerY - 6, 8, 4);
            ctx.fillRect(laneCx - 6 + markerXOffset, markerY - 10, 12, 4);

            const isOwn = lane.owner === activePlayer, realCanSteal = !isOwn && currentStatus !== "early" && currentStatus !== "burnt" && pResources >= 1;
            if (!lane.justPlaced) {
                const peakTime = state.visuals.peakFlashes[lane.id];
                let peakAlpha = 0, peakScale = 1;
                if (peakTime && now - peakTime < 700) { 
                    const elapsed = now - peakTime, progress = elapsed / 700;
                    if (elapsed < 300) { ctx.save(); ctx.globalAlpha = (1 - (elapsed / 300)) * 0.2;
                        ctx.fillStyle = "rgba(255, 255, 200, 1.0)"; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.restore();
                    }
                    peakAlpha = (1 - progress) * 0.4;
                    peakScale = 1 + (1 - progress) * 0.2; 
                }
                if (currentStatus === "perfect" && (isOwn || realCanSteal)) drawSparkles(ctx, laneCx, stickTop, state.buildMode === "harvest", false, peakAlpha, peakScale);
                else if (isUchiwaPreviewActive && uchiwaTargetStatus === "perfect" && baseEndStatus !== "perfect") drawSparkles(ctx, laneCx, stickTop, false, true, 0, 0.7);
            }
        }
        
        let cv = 0, uchiwaDotIndex = -1, uchiwaPreviewNextCv = 0, baseEndHeatCv = Math.min(6, baseEndState);
        if (lane.built) {
            cv = Math.min(gaugeCookState || 0, 6);
            uchiwaPreviewNextCv = baseEndHeatCv;
            if (state.buildMode === "uchiwa" && isFlashable) { uchiwaDotIndex = Math.min(5, baseEndState); uchiwaPreviewNextCv = Math.min(6, baseEndState + 1);
            }
        }

        const dotSize = 8, dotGap = 2, gridW = 6 * dotSize + 5 * dotGap, dotStartX = laneCx - gridW / 2, dotStartY = b.y + b.h + 12;
        drawBevelRect(ctx, dotStartX - 6, dotStartY - 6, gridW + 12, dotSize + 12, "#242430");
        for (let j = 0; j < 6; j++) {
            const dx = dotStartX + j * (dotSize + dotGap);
            if (j < cv) {
                if (isCurrentPreviewLane && previewProg < 0.35 && j >= previewEventForThisLane.prevCookState && j < previewEventForThisLane.newCookState) {
                    const flashAlpha = Math.sin(getTime() / 50) > 0 ? 1 : 0.5; // 点滅をソリッドに
                    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`; ctx.fillRect(dx, dotStartY, dotSize, dotSize);
                } else {
                    ctx.fillStyle = getVisualPalette(getCookLabel(lane.type, displayCookState).toUpperCase()).dot;
                    ctx.fillRect(dx, dotStartY, dotSize, dotSize); 
                    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
                    ctx.fillRect(dx + 1, dotStartY + 1, dotSize - 4, dotSize - 5);
                }
            } else if (j < uchiwaPreviewNextCv) {
                if (j === uchiwaDotIndex) {
                    let fillStyle = "rgba(255, 255, 255, 0.8)", strokeStyle = "rgba(255, 255, 255, 1.0)";
                    if (uchiwaTargetStatus === "perfect" && baseEndStatus !== "perfect") { fillStyle = "rgba(255, 230, 100, 0.8)";
                        strokeStyle = "rgba(255, 230, 100, 1.0)"; }
                    else if (uchiwaTargetStatus === "burnt" && baseEndStatus !== "burnt") { fillStyle = "rgba(255, 100, 100, 0.8)";
                        strokeStyle = "rgba(255, 100, 100, 1.0)"; }
                    ctx.fillStyle = fillStyle;
                    ctx.fillRect(dx, dotStartY, dotSize, dotSize);
                    // strokeRectの代わりにfillRect
                    ctx.fillStyle = strokeStyle;
                    ctx.fillRect(dx, dotStartY, dotSize, 1); ctx.fillRect(dx, dotStartY, 1, dotSize);
                    ctx.fillRect(dx, dotStartY + dotSize - 1, dotSize, 1); ctx.fillRect(dx + dotSize - 1, dotStartY, 1, dotSize);
                } else { ctx.fillStyle = "rgba(255, 255, 255, 0.3)"; ctx.fillRect(dx, dotStartY, dotSize, dotSize);
                }
            } else { ctx.fillStyle = "rgba(10, 10, 15, 0.9)";
                ctx.fillRect(dx, dotStartY, dotSize, dotSize); }
        }
        
        if (isCurrentPreviewLane && previewEventForThisLane && previewProg >= 0.35) {
            const textProgress = Math.min(1, (previewProg - 0.35) / 0.65);
            const textY = b.y + b.h * 0.1 - 15; ctx.textAlign = "center"; 
            ctx.globalAlpha = textProgress;
            if (previewEventForThisLane.prevStatus !== "perfect" && previewEventForThisLane.newStatus === "perfect") { 
                ctx.fillStyle = `rgba(255, 230, 100, ${0.25 * textProgress})`;
                ctx.fillRect(b.x, b.y, b.w, b.h); 
                ctx.font = getPixelFont(14);
                ctx.fillStyle = "#000"; ctx.fillText("READY!", laneCx + 2, textY + 2); // シャドウ
                ctx.fillStyle = "#e6d555"; ctx.fillText("READY!", laneCx, textY);
            } else if (previewEventForThisLane.prevStatus !== "burnt" && previewEventForThisLane.newStatus === "burnt") { 
                ctx.fillStyle = `rgba(255, 50, 50, ${0.25 * textProgress})`;
                ctx.fillRect(b.x, b.y, b.w, b.h); 
                ctx.font = getPixelFont(16);
                ctx.fillStyle = "#000"; ctx.fillText("BURNT!", laneCx + 2, textY + 2); // シャドウ
                ctx.fillStyle = "#f33"; ctx.fillText("BURNT!", laneCx, textY);
            } else { 
                ctx.fillStyle = `rgba(255, 255, 255, ${0.1 * textProgress})`;
                ctx.fillRect(b.x, b.y, b.w, b.h); 
            }
            ctx.globalAlpha = 1.0;
        }

        const fireScale = 2.5, fireSize = 8 * fireScale, totalFireW = (fireSize * lane.fire) + (4 * (lane.fire - 1)), startFireX = laneCx - totalFireW / 2 + fireSize / 2;
        for (let f = 0; f < lane.fire; f++) drawDotIcon(ctx, "fire", startFireX + f * (fireSize + 4) + fireSwayX, b.y + b.h + 40, "#fa3", fireScale);
        if (lane.uchiwaBoost > 0) { ctx.globalAlpha = 0.6; drawDotIcon(ctx, "fire", b.x + b.w - 18, b.y + b.h - 18, "#f85", 2);
            ctx.globalAlpha = 1.0; }
        
        if (state.buildMode && isFlashable) {
            const elapsedMode = now - (state.buildModeStartTime || now);
            const modeAlpha = Math.min(1, Math.max(0, elapsedMode / 200));
            const floatY = b.y - 35 - (1 - modeAlpha) * 10;
            ctx.textAlign = "center";
            if (state.buildMode === "harvest") {
                const isSteal = (lane.owner !== null && lane.owner !== activePlayer);
                const status = getCookLabel(lane.type, effectiveCookState);
                const score = getHarvestScore(lane, isSteal, status);
                let scoreText = score > 0 ?
                    `+${score}` : `${score}`; let color = score > 0 ? "#ffeb3b" : (score < 0 ? "#ff5555" : "#aaaaaa");
                if (score === 0) color = "#aaaaaa";
                ctx.globalAlpha = modeAlpha; ctx.font = getPixelFont(12); 
                ctx.fillStyle = "#000"; ctx.fillText(scoreText, laneCx + 2, floatY + 2); 
                ctx.fillStyle = color; ctx.fillText(scoreText, laneCx, floatY);
            } else if (state.buildMode === "uchiwa") {
                let statusText = uchiwaTargetStatus.toUpperCase();
                if (uchiwaTargetStatus === "burnt") statusText = "BURN"; if (uchiwaTargetStatus === "okay") statusText = "OK";
                let color = "#fff", textAlpha = modeAlpha;
                if (uchiwaTargetStatus === "perfect") { color = "#ffeb3b";
                } 
                else if (uchiwaTargetStatus === "burnt") { color = "#ff5555";
                    textAlpha = modeAlpha * (0.6 + 0.4 * Math.sin(now / 80));
                } 
                else if (uchiwaTargetStatus === "okay") { color = "#dddddd";
                } else { color = "#aaaaaa"; }
                ctx.globalAlpha = textAlpha;
                ctx.font = getPixelFont(10);
                ctx.fillStyle = "#000"; ctx.fillText("NEXT", laneCx + 2, floatY - 14 + 2); 
                ctx.fillStyle = "#aaaaaa"; ctx.fillText("NEXT", laneCx, floatY - 14); 
                
                ctx.fillStyle = "#000"; ctx.fillText(statusText, laneCx + 2, floatY + 2);
                ctx.fillStyle = color; ctx.fillText(statusText, laneCx, floatY);
            }
            ctx.globalAlpha = 1.0;
        }

        drawLaneHint(ctx, lane, i, state.buildMode, activePlayer, pResources);
        if (state.cookPreviewActive && !isCurrentPreviewLane) { ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
            ctx.fillRect(b.x - 8, b.y - 8, b.w + 16, b.h + 80); }
    });

    renderParticlesAndOverlay(ctx, now, activePlayer);
    if (state.gameOver && state.gameEndWaitTimer > 0) {
        const alpha = Math.min(1, 1 - (state.gameEndWaitTimer / 55));
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`; ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    }
}

function renderParticlesAndOverlay(ctx, now, activePlayer) {
    const cx = LAYOUT.CANVAS_WIDTH / 2, cy = LAYOUT.CANVAS_HEIGHT / 2;
    for (let i = state.visuals.particles.length - 1; i >= 0; i--) {
        let p = state.visuals.particles[i];
        p.life++; if (p.life >= p.maxLife) { state.visuals.particles.splice(i, 1); continue; }
        p.x += p.vx;
        p.y += p.vy; const ratio = p.life / p.maxLife; ctx.globalAlpha = 0.6 * (1 - ratio);
        if (p.isText) {
            ctx.globalAlpha = 1 - ratio;
            ctx.font = getPixelFont(Math.max(8, Math.floor(p.size * 0.7))); ctx.textAlign = "center";
            // ShadowBlurをドロップシャドウに置き換え
            ctx.fillStyle = "#000";
            ctx.fillText(p.text, Math.round(p.x) + 2, Math.round(p.y) + 2);
            ctx.fillStyle = p.color; 
            ctx.fillText(p.text, Math.round(p.x), Math.round(p.y));
        } else if (p.isSparkle) {
            ctx.fillStyle = p.color;
            const size = p.size * (1 - ratio * 0.5); ctx.fillRect(p.x - size/2, p.y - 1, size, 2);
            ctx.fillRect(p.x - 1, p.y - size/2, 2, size);
        } else {
            // Arcをブロック(fillRect)に置き換え
            ctx.fillStyle = p.color || "#e0e0e0"; 
            const s = Math.max(2, Math.floor((p.size * (1 + ratio)) / 2));
            ctx.fillRect(Math.floor(p.x - s/2), Math.floor(p.y - s/2), s, s);
        }
    }
    ctx.globalAlpha = 1.0;
    if (state.buildMode) {
        const cb = getCancelButtonBounds(), selectedIcon = getBuildModeIcon(state.buildMode);
        if (selectedIcon) { const iconX = cb.x + cb.w / 2, iconY = cb.y - 26; ctx.globalAlpha = 0.9;
            drawDotIcon(ctx, selectedIcon, iconX, iconY, "#fff", 3); ctx.globalAlpha = 1.0; }
        const isPressed = (now - (state.visuals.cancelClick || 0) < 150);
        drawBevelRect(ctx, cb.x, cb.y, cb.w, cb.h, "#a33", isPressed);
        const offset = isPressed ? 3 : 0; ctx.fillStyle = "#fff";
        ctx.font = getPixelFont(12); ctx.textAlign="center"; 
        ctx.fillStyle = "#000"; ctx.fillText("CANCEL", cb.x + cb.w/2 + offset + 2, cb.y + cb.h/2 + 6 + offset + 2); // シャドウ
        ctx.fillStyle = "#fff"; ctx.fillText("CANCEL", cb.x + cb.w/2 + offset, cb.y + cb.h/2 + 6 + offset);
    } else {
        LAYOUT.BUTTONS.forEach((btn, i) => {
            const b = getButtonBounds(i), boxId = i + 1; let canUse = false;
            if (boxId === 1) canUse = canUseMeat(state.currentPlayer);  if (boxId === 2) canUse = canUseSkewer(state.currentPlayer); 
            if (boxId === 3) canUse = canUseServe(state.currentPlayer); if (boxId === 4) canUse = canUseUchiwa(state.currentPlayer); 
          
            const isPressed = (now - (state.visuals.buttonClicks[i] || 0) < 150), isLocked = isInputLocked() && !isPressed;
            let baseColor = (canUse && !isLocked) ? btn.color : "#445"; let btnAlpha = 0.9; 
            const isError = (now - (state.visuals.buttonErrors[i] || 0) < 150); if (isError) baseColor = "#6a3a3a"; 
            
            let harvestBreatheAlpha = 0;
    
            if (boxId === 3 && canUse && !isLocked && state.buildMode === null) { 
                const isPerfect = hasPerfectHarvestTarget(state.currentPlayer); 
                baseColor = brightenColor(btn.color, isPerfect ? 0.3 : 0.0); 
                if (isPerfect) btnAlpha = 1.0;
                harvestBreatheAlpha = isPerfect ? 0.4 + 0.3 * Math.sin(now / 200) : 0.15 + 0.15 * Math.sin(now / 300);
            }
            
            ctx.globalAlpha = btnAlpha;
            drawBevelRect(ctx, b.x, b.y, b.w, b.h, baseColor, isPressed);
            
            if (harvestBreatheAlpha > 0 && !isPressed) {
                ctx.globalAlpha = harvestBreatheAlpha;
                ctx.fillStyle = "#fff";
                ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, 4); // 厚みのあるハイライト
            }
            
            ctx.globalAlpha = btnAlpha;
            const offset = isPressed ? 3 : 0;
            drawDotIcon(ctx, btn.icon, b.x + b.w/2 + offset, b.y + b.h/2 - 5 + offset, (canUse && !isLocked) ? "#fff" : "#888", 4);
            let textAlpha = isPressed ? 1.0 : 0.8; let textYOffset = isPressed ? -2 : 0; ctx.globalAlpha = textAlpha;
            ctx.fillStyle = (canUse && !isLocked) ? "#fff" : "#aaa"; ctx.font = getPixelFont(9); ctx.textAlign = "center";
            const textY = b.y + b.h - 8 + textYOffset; const textX = b.x + b.w/2 + offset;
            if (boxId === 1) { 
                drawDotIcon(ctx, "meat", textX - 10, textY - 4, (canUse && !isLocked) ? "#fff" : "#aaa", 1.5);
                ctx.fillText("+1", textX + 10, textY); 
            } else if (boxId === 2) { 
                drawDotIcon(ctx, "meat", textX - 10, textY - 4, (canUse && !isLocked) ? "#fff" : "#aaa", 1.5);
                ctx.fillText("-1", textX + 10, textY); 
            } else if (boxId === 3) { 
                drawDotIcon(ctx, "put_skewer", textX - 10, textY - 4, (canUse && !isLocked) ? "#fff" : "#aaa", 1.5);
                ctx.fillText("↑", textX + 10, textY); 
            } else if (boxId === 4) { 
                drawDotIcon(ctx, "fire", textX - 10, textY - 4, (canUse && !isLocked) ? "#fa3" : "#aaa", 1.5);
                ctx.fillText("+1", textX + 10, textY); 
            }
            ctx.globalAlpha = 1.0;
        });
    }

    if (state.startRouletteActive || state.startRouletteBlinkActive) {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, cy - 40, LAYOUT.CANVAS_WIDTH, 80);
        let isVisible = state.startRouletteBlinkActive ?
            state.startRouletteBlinkCount % 2 === 0 : true;
        if (isVisible) { const idx = state.startRouletteBlinkActive ? state.startRouletteFinalPlayer : state.startRouletteIndex;
            ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = getPixelFont(36); ctx.textAlign = "center"; ctx.fillText(`P${idx}`, cx, cy + 15);
        }
    } else if (state.introSequenceActive && state.introPhase !== "pause") { 
        ctx.fillStyle = "rgba(22, 22, 32, 0.85)";
        ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        if (state.introPhase === "vs") {
            const p_vs = state.introVsTimer / 60;
            ctx.fillStyle = LAYOUT.COLORS.P1; ctx.font = getPixelFont(36); ctx.fillText("P1", cx - 80 + (p_vs * 30), cy - 60);
            ctx.fillStyle = "#fff";
            ctx.font = getPixelFont(28); ctx.fillText("VS", cx, cy); const p2Name = state.gameMode === "ai" ? state.enemyName : "P2"; ctx.fillStyle = LAYOUT.COLORS.P2;
            ctx.font = getPixelFont(36); ctx.fillText(p2Name, cx + 80 - (p_vs * 30), cy + 60);
            if (state.gameMode === "ai") { ctx.fillStyle = "#aaa"; ctx.font = getPixelFont(11); ctx.fillText(`STAGE ${state.currentStage}`, cx, cy + 120);
            }
        } else if (state.introPhase === "fight") {
            const p_fight = state.fightSplashTimer / 25, elapsedP = 1 - p_fight, scale = 1.0 + elapsedP * 0.08, alpha = p_fight < 0.2 ?
                p_fight * 5 : 1.0;
            ctx.globalAlpha = alpha; ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale); ctx.font = getPixelFont(32);
            ctx.fillStyle = "#000"; ctx.fillText("FIGHT!!", 3, 3); ctx.fillStyle = "#ffeb3b"; ctx.fillText("FIGHT!!", 0, 0); ctx.restore(); ctx.globalAlpha = 1.0;
        } else if (state.introPhase === "order" && state.todaysOrder) {
            drawIntroOrderSlip(ctx, cx, cy - 30, state.todaysOrder);
        }
        ctx.textBaseline = "alphabetic";
    } else if (state.turnSplashTimer > 0 && !state.cookPreviewActive) {
        const fadeAlpha = getFadeAlpha(state.turnSplashTimer, 45, 10);
        ctx.globalAlpha = fadeAlpha; ctx.fillStyle = "rgba(0, 0, 0, 0.8)"; ctx.fillRect(0, cy - 40, LAYOUT.CANVAS_WIDTH, 80);
        ctx.fillStyle = activePlayer === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = getPixelFont(22); ctx.textAlign = "center";
        ctx.fillText(`P${activePlayer} TURN`, cx, cy + 10);
    }
    
    ctx.globalAlpha = 1.0;
    state.visuals.ghosts.forEach(g => {
        const elapsed = now - g.startTime, progress = Math.min(1, elapsed / 800);
        let moveDist = -150; let alphaProg = progress;
        
        if (g.status === "BURNT") { moveDist = -40; alphaProg = Math.min(1, elapsed / 500); }
  
        const yOffset = moveDist * (1 - Math.pow(1 - progress, 3)); ctx.globalAlpha = Math.max(0, 1 - alphaProg);
        
        const b = getLaneBounds(g.laneIndex), laneCx = b.x + b.w / 2, p = getVisualPalette(g.status), stickH = b.h * 0.7, stickTop = b.y + b.h * 0.1 + yOffset; 
        if (g.cookState !== undefined) {
            ctx.fillStyle = "#111"; ctx.fillRect(laneCx-1, stickTop, 4, stickH); ctx.fillStyle = LAYOUT.COLORS.STICK; 
            ctx.fillRect(laneCx-2, stickTop, 4, stickH);
            const meatW = b.w * 0.6, meatH = stickH * 0.2, meatX = laneCx - meatW/2;
            const ghostStatusUpper = g.status.toUpperCase();
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.1, meatW, meatH, p.meat, false, false, ghostStatusUpper, "medium", now);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.35, meatW, meatH, p.negi, true, false, ghostStatusUpper, "medium", now);
            drawDeliciousYakitori(ctx, meatX, stickTop + stickH * 0.6, meatW, meatH, p.meat, false, false, ghostStatusUpper, "medium", now);
            ctx.fillStyle = g.owner === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
            // 矢印もドット絵化
            ctx.fillRect(laneCx - 2, stickTop - 10, 4, 4);
            ctx.fillRect(laneCx - 4, stickTop - 14, 8, 4);
            ctx.fillRect(laneCx - 6, stickTop - 18, 12, 4);
        }
    });

    let p1MsgCount = 0; let p2MsgCount = 0;
    
    ctx.textBaseline = "alphabetic";
    state.visuals.statusMessages.forEach((msg, idx) => {
        const elapsed = now - msg.startTime;
        const duration = msg.duration || 1000;
        let alpha = 1; let yAnimOffset = 0; let isHint = msg.type === "hint";
        
        const fadeOutStart = duration * 0.7;
        const fadeInDuration = 100;

        if (isHint) {
            const p = Math.min(1, elapsed / duration);
            alpha = 1 - p;
            yAnimOffset = -15 * (1 - Math.pow(1 - p, 3));
        } else {
            const p = Math.min(1, Math.max(0, elapsed / duration));
            
            if (msg.type === "meat" && msg.targetPlayerPanel) {
                const ease = Math.pow(p, 0.55);
                const moveDist = 18;
                const dir = msg.amount >= 0 ? -1 : 1;
                yAnimOffset = dir * moveDist * ease;
            } else {
                yAnimOffset = -30 * Math.pow(p, 0.5);
            }

            if (elapsed < fadeInDuration) {
                alpha = elapsed / fadeInDuration;
            } else if (elapsed > fadeOutStart) {
                alpha = Math.max(0, 1 - ((elapsed - fadeOutStart) / (duration - fadeOutStart)));
            } else {
                alpha = 1;
            }
        }

        if (alpha <= 0) return;
        let fx = Math.round(msg.x || cx);
        let fy = 0;
        if (msg.targetPlayerPanel) {
            const panelW = Math.min(100, LAYOUT.CANVAS_WIDTH * 0.25);
            fx = Math.round(msg.targetPlayerPanel === 1 ? 10 + panelW / 2 : LAYOUT.CANVAS_WIDTH - panelW - 10 + panelW / 2);
            let offsetIdx = msg.targetPlayerPanel === 1 ? p1MsgCount++ : p2MsgCount++;
            
            fy = Math.round(136 + (offsetIdx * 28) + yAnimOffset);
            ctx.globalAlpha = alpha;
            ctx.textAlign = "center";
            ctx.font = getPixelFont(14);
            const text1 = `P${msg.targetPlayerPanel}`; 
            const text2 = msg.amount > 0 ?
                `+${msg.amount}` : `${msg.amount}`;
            
            const w1 = ctx.measureText(text1).width;
            const w2 = ctx.measureText(text2).width; 
            const iconW = 16; const gap = 8;
            let currentX = Math.round(fx - (w1 + gap + iconW + gap + w2)/2);
            
            ctx.textAlign = "left";
            ctx.fillStyle = msg.targetPlayerPanel === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
            ctx.fillText(text1, currentX, fy); 
            currentX += w1 + gap;
            drawDotIcon(ctx, 'meat', Math.round(currentX + iconW/2 - 4), Math.round(fy - 8), "#fff", 2); 
            currentX += iconW + gap;
            ctx.fillStyle = msg.targetPlayerPanel === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
            ctx.fillText(text2, currentX, fy);
        } else {
            if (isHint) {
                fy = Math.round(msg.y + yAnimOffset);
            } else if (msg.x !== undefined && msg.y !== undefined) {
                fy = Math.round(msg.y + yAnimOffset);
            } else {
                fy = Math.round(170 + (idx * 32) + yAnimOffset);
            }

            ctx.globalAlpha = alpha;
            ctx.textAlign = "center";
            if (isHint) {
                ctx.font = getPixelFont(10);
                const txtW = Math.round(ctx.measureText(msg.text).width + 16);
                ctx.fillStyle = "rgba(0, 0, 0, 0.7)"; 
                ctx.fillRect(Math.round(fx - txtW/2), Math.round(fy - 12), txtW, 18);
                ctx.fillStyle = "#ff5555"; 
                ctx.fillText(msg.text, fx, fy);
            } else {
                let isResult = msg.type === "result";
                let icon = isResult ? null : (msg.isBonus ? 'diamond' : null);
                let text = msg.text ||
                    (msg.amount > 0 ? `+${msg.amount}` : `${msg.amount}`); 
                let color = isResult ?
                    "#ffeb3b" : (msg.isBonus ? "#6cf" : (msg.isPerfect ? "#ffeb3b" : "#fff"));
                ctx.font = getPixelFont(msg.isPerfect ? 18 : 14);
                
                // ドロップシャドウ
                ctx.fillStyle = "#000";
                if (icon) {
                    drawDotIcon(ctx, icon, Math.round(fx - 25 - (msg.isPerfect?2:0) + 1), Math.round(fy - 8 + 1), "#000", 2.5);
                    ctx.fillText(text, Math.round(fx + 15 + 2), Math.round(fy + 2));
                } else {
                    ctx.fillText(text, Math.round(fx + 2), Math.round(fy + 2));
                }

                ctx.fillStyle = color;
                if (icon) { 
                    drawDotIcon(ctx, icon, Math.round(fx - 25 - (msg.isPerfect?2:0)), Math.round(fy - 8), "#6cf", 2.5);
                    ctx.fillText(text, Math.round(fx + 15), fy);
                } else {
                    ctx.fillText(text, fx, fy);
                }
                
                if (msg.isBonus && msg.bonusText) {
                    ctx.font = getPixelFont(10);
                    ctx.fillStyle = "#000";
                    ctx.fillText(msg.bonusText, Math.round(fx + (icon ? 15 : 0) + 2), Math.round(fy - 18 + 2));
                    ctx.fillStyle = "#ffeb3b";
                    ctx.fillText(msg.bonusText, Math.round(fx + (icon ? 15 : 0)), Math.round(fy - 18));
                } else if (msg.isPerfect && !msg.isBonus) {
                    ctx.font = getPixelFont(10);
                    ctx.fillStyle = "#000";
                    ctx.fillText("PERFECT!", Math.round(fx + 2), Math.round(fy - 18 + 2));
                    ctx.fillStyle = "#ffeb3b";
                    ctx.fillText("PERFECT!", Math.round(fx), Math.round(fy - 18));
                }
            }
        }
    });
    ctx.globalAlpha = 1.0;
}

function drawPlayerPanel(ctx, player, x, y, w, h, idx, activePlayer) {
    const active = activePlayer === idx, baseColor = active ?
        (idx === 1 ? "#2a4a6a" : "#6a2a3a") : LAYOUT.COLORS.PANEL_BG;
    
    // ピクセル枠のパネルとして描画
    drawBevelRect(ctx, x, y, w, h, baseColor);
    
    if (active) { 
        // アクティブな枠線もソリッドなドット枠にする
        const scale = 4;
        ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; 
        ctx.fillRect(x - scale, y - scale, w + scale*2, scale);
        ctx.fillRect(x - scale, y - scale, scale, h + scale*2);
        ctx.fillRect(x - scale, y + h, w + scale*2, scale);
        ctx.fillRect(x + w, y - scale, scale, h + scale*2);
    }

    ctx.fillStyle = idx === 1 ? LAYOUT.COLORS.P1 : LAYOUT.COLORS.P2; ctx.font = getPixelFont(12); ctx.textAlign = "left";
    ctx.fillText(`P${idx}`, x + 10, y + 25);
    ctx.fillStyle = "#ccc"; ctx.font = getPixelFont(10);
    if (idx === 1) { ctx.fillText("PLAYER", x + 10, y + 42);
    } 
    else if (idx === 2) { const p2Text = state.gameMode === "ai" ?
        state.enemyName : "PLAYER";
        ctx.fillText(p2Text, x + 10, y + 42); }
    const offsetY = 20;
    drawDotIcon(ctx, "diamond", x + 20, y + 45 + offsetY, "#6cf", 2); ctx.fillStyle = "#fff"; ctx.font = getPixelFont(10);
    ctx.textAlign = "right"; ctx.fillText(`${player.score}`, x + w - 10, y + 50 + offsetY);
    drawDotIcon(ctx, "meat", x + 20, y + 65 + offsetY, "#f77", 2); ctx.fillStyle = "#fff";
    ctx.fillText(`${player.resources || 0}`, x + w - 10, y + 70 + offsetY);
}

// ==========================================
// 8. main.js - セットアップとスマホ対応
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("game"); if (!canvas) return; const ctx = canvas.getContext("2d");
    document.body.style.margin = "0"; document.body.style.backgroundColor = "#111"; document.body.style.height = "100vh"; document.body.style.overflow = "hidden"; document.body.style.touchAction = "none";
    function resize() {
        const dpr = window.devicePixelRatio || 1, vw = window.visualViewport ? window.visualViewport.width : window.innerWidth, vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        LAYOUT.CANVAS_WIDTH = vw; LAYOUT.CANVAS_HEIGHT = vh; canvas.width = vw * dpr; canvas.height = vh * dpr; canvas.style.width = 
        vw + "px"; canvas.style.height = vh + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resize);
    resize();
    let lastTouchTime = 0;
    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); lastTouchTime = Date.now(); handleCanvasClick({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }, canvas); }, { passive: false });
    canvas.addEventListener("click", (e) => { if (Date.now() - lastTouchTime < 500) return; handleCanvasClick(e, canvas); });
    function loop() {
        try {
            if (state && state.hitStopTimer > 0) { state.hitStopTimer--;
            }
            else { 
                updateTransition();
                updateRoulette(); updateIntroSequence(); updateCookPreview(); 
                updateRoundEndPause();
                resolvePendingTurnFlow(); updateGameEndWait(); render(ctx); playAITurn(); 
            }
        } catch (e) { console.error("GAME LOOP ERROR:", e);
        }
        requestAnimationFrame(loop);
    }
    loop();
});
