const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 이미지 리소스 로드
const images = {
    bg: new Image(),
    puck: new Image(),
    paddle1: new Image(),
    paddle2: new Image(),
    par1: new Image(),
    par2: new Image(),
    par3: new Image(),
    title: new Image(),
    btnStart: new Image(),
    pause: new Image(),
    pausePopup: new Image(),
    btnPlay: new Image(),
    btnRestart: new Image(),
    btnExit: new Image(),
    arrowGreen: new Image(), // 서브 조준 화살표
    textBubble: new Image(), // 말풍선 이미지 추가
    roundwin1: new Image(),  // 1P 세트 승점 표시
    roundwin2: new Image(),  // 2P 세트 승점 표시
    roundwinBg: new Image(), // 세트 승점 배경 아이콘
    card01: new Image(),      // 1번 스킬 카드 배경
    card02: new Image(),      // 2번 스킬 카드 배경
    skill01: new Image(),    // 스킬 01 아이콘 (패들 확장)
    skill02: new Image(),    // 스킬 02 아이콘 (골대 벽)
    victory: new Image(),    // 최종 승리 이미지
    scoreboard: new Image(), // 득점 팝업 배경
    numberImgs: [],          // 숫자 이미지 (00~09)
    smokeFx: [],             // 공 생성 연출용 연기 시퀀스
    hitFx: [], // 히트 이펙트 스프라이트 배열
    sideSmokeFx: [] // 벽면 연기 이펙트 스프라이트 배열
};

for (let i = 0; i <= 9; i++) {
    images.numberImgs.push(new Image());
}

for (let i = 1; i <= 9; i++) {
    images.smokeFx.push(new Image());
}
for (let i = 1; i <= 7; i++) {
    images.hitFx.push(new Image());
}
for (let i = 1; i <= 8; i++) {
    images.sideSmokeFx.push(new Image());
}

const v = Date.now();
images.bg.src = 'image/BG.png?v=' + v;
images.puck.src = 'image/Puck.png?v=' + v;
images.paddle1.src = 'image/Paddle_01.png?v=' + v;
images.paddle2.src = 'image/Paddle_02.png?v=' + v;
images.par1.src = 'image/Par_01.png?v=' + v;
images.par2.src = 'image/Par_02.png?v=' + v;
images.par3.src = 'image/Par_03.png?v=' + v;
images.title.src = 'image/TitleImage.png?v=' + v;
images.btnStart.src = 'image/btn_start.png?v=' + v;
images.pause.src = 'image/pause.png?v=' + v;
images.pausePopup.src = 'image/pause_popup.png?v=' + v;
images.btnPlay.src = 'image/btn_play.png?v=' + v;
images.btnRestart.src = 'image/btn_restart.png?v=' + v;
images.btnExit.src = 'image/btn_exit.png?v=' + v;
images.arrowGreen.src = 'image/arrow_green.png?v=' + v;
images.textBubble.src = 'image/text_bubble.png?v=' + v;
images.roundwin1.src = 'image/roundwin_1.png?v=' + v;
images.roundwin2.src = 'image/roundwin_2.png?v=' + v;
images.roundwinBg.src = 'image/roundwin_bg.png?v=' + v;
images.card01.src = 'image/card_01.png?v=' + v;
images.card02.src = 'image/card_02.png?v=' + v;
images.skill01.src = 'image/skill_01.png?v=' + v;
images.skill02.src = 'image/skill_02.png?v=' + v;
images.victory.src = 'image/victory.png?v=' + v;
images.scoreboard.src = 'image/scoreboard.png?v=' + v;

// 숫자 이미지 소스 설정 (number_img_00 ~ number_img_09)
for (let i = 0; i <= 9; i++) {
    const numStr = i.toString().padStart(2, '0');
    images.numberImgs[i].src = `number/number_img_${numStr}.png?v=${v}`;
}

// 공 생성 연기 이펙트 소스 설정
for (let i = 1; i <= 9; i++) {
    images.smokeFx[i - 1].src = `fx/smoke_fx_0${i}.png?v=${v}`;
}

// 히트 이펙트 소스 경로 설정 (hit_fx_01 ~ hit_fx_07)
for (let i = 1; i <= 7; i++) {
    images.hitFx[i - 1].src = 'fx/hit_fx_0' + i + '.png?v=' + v;
}
// 벽면 연기 이펙트 소스 경로 설정 (side_smoke_fx_01 ~ side_smoke_fx_08)
for (let i = 1; i <= 8; i++) {
    images.sideSmokeFx[i - 1].src = 'fx/side_smoke_fx_0' + i + '.png?v=' + v;
}

let assetsLoaded = 0;
const totalAssets = 59; // 48 + 1(scoreboard) + 10(numbers)
function onAssetLoad() {
    assetsLoaded++;
}

Object.values(images).forEach(img => {
    if (Array.isArray(img)) {
        img.forEach(i => i.onload = onAssetLoad);
    } else {
        img.onload = onAssetLoad;
    }
});

// 타이틀 애니메이션 변수
let titleBtnScale = 1.0;
let titleBtnTime = 0;
let bubbleScale = 1.0;
let bubbleAnimTime = 0;

// 이펙트 관련 변수
const trailHistory = [];
const TRAIL_MAX_LENGTH = 11;
const particles = [];
const hitAnimations = []; // 실행 중인 히트 애니메이션 저장용
const sideSmokeAnimations = []; // 실행 중인 벽면 연기 애니메이션 저장용
const spawnSmokeAnimations = []; // 실행 중인 공 생성 연기 애니메이션 저장용

function spawnParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
        const img = Math.random() > 0.5 ? images.par1 : images.par2;
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            size: 5 + Math.random() * 10,
            rotation: Math.random() * Math.PI * 2,
            rotVel: (Math.random() - 0.5) * 0.2,
            img: img
        });
    }
}
function triggerHitFx(x, y, isRotated = false) {
    hitAnimations.push({
        x: x,
        y: y,
        frame: 0,
        maxFrame: 7,
        isRotated: isRotated,
        fps: 30,
        lastTime: Date.now()
    });
}


function triggerSideSmokeFx(x, y, isLeft = false) {
    sideSmokeAnimations.push({
        x: x,
        y: y,
        frame: 0,
        maxFrame: 8,
        isLeft: isLeft,
        fps: 30,
        lastTime: Date.now()
    });
}

// 게임 설정 (1080x1920 논리 좌표 기준)
const PADDLE_WIDTH = 264;
const PADDLE_HEIGHT = 336;
const BALL_RADIUS = 70;
const MIN_SPEED = 18;
const MAX_SPEED = 45;
const SPEED_INCREMENT = 1.05;
const LAUNCH_FORCE_MULT = 0.15;

let width, height;
let scoreTop = 0;
let scoreBottom = 0;
let gameScale = 1; // 캔버스 좌표 보정용 스케일 변수

// 상태 정의
const STATE = {
    TITLE: 'title',
    READY: 'ready',
    PLAYING: 'playing',
    GOAL: 'goal',
    PAUSED: 'paused',
    SKILL_SELECT: 'skill_select',
    MATCH_OVER: 'match_over'
};
let gameState = STATE.TITLE;
let prevState = STATE.READY; // 일시정지 전 상태 기억용

// 매치 관련 변수
let matchWins1P = 0;
let matchWins2P = 0;
const TARGET_MATCH_WINS = 2; // 2선승제
const TARGET_SET_SCORE = 3;  // 한 세트당 3점 (기존 5점에서 하향)
let loserSide = null;        // 스킬 선택할 패자 ('1P' 또는 '2P')
let matchWinner = null;      // 최종 승자

// 스킬 상태 관리
const skills1P = { paddleWide: false, goalWall: false };
const skills2P = { paddleWide: false, goalWall: false };

let selectedCardIdx = -1; // -1: 미선택, 0: 왼쪽, 1: 오른쪽

// 공 생성 연출 관련 전역 변수
let ballSpawnTimer = 0;
let ballSpawnScale = 1.0;
const SPAWN_DURATION = 18; // 60fps 기준 소요 시간

// 스킬 선택 애니메이션 변수 누락 추가
let skillEnterFrames = 0;
let skillSelectedFrames = 0;

const SMOKE_TOTAL_FRAMES = 9;

// 득점 팝업 연출 변수
let goalPopupTimer = 0;
let goalPopupScaleY = 0;
let pendingWinner = null; // 득점 후 대기 중인 승자 세션용

// 객체 정의
const ball = {
    x: 0, y: 0,
    vx: 0, vy: 0,
    radius: BALL_RADIUS,
    dragStartX: 0, dragStartY: 0,
    isDragging: false,
    color: '#ffffff',
    rotation: 0,
    rotationDir: 1, // 1: 시계방향, -1: 반시계방향
    rotationSpeed: (Math.PI * 2) / (5 * 60), // 5초에 360도 (60fps 기준)
    scaleX: 1,
    scaleY: 1
};

const player2 = { // Top Player (2P)
    x: 0, y: 40,
    width: PADDLE_WIDTH, height: PADDLE_HEIGHT,
    color: '#ff2d55',
    touchId: null
};

const player1 = { // Bottom Player (1P)
    x: 0, y: 0, // 나중에 설정
    width: PADDLE_WIDTH, height: PADDLE_HEIGHT,
    color: '#007aff',
    touchId: null
};

// 논리적 게임 해상도 (최소 1080x1920 기준 9:16)
const LOGICAL_WIDTH = 1080;
const LOGICAL_HEIGHT = 1920;

function resize() {
    const container = document.getElementById('game-container');

    // 세이프 에어리어 패딩이 제외된 실제 가용 너비/높이 측정
    const sw = container.clientWidth;
    const sh = container.clientHeight;

    // 9:16 비율 계산
    let displayWidth = sw;
    let displayHeight = sw * (16 / 9);

    if (displayHeight > sh) {
        displayHeight = sh;
        displayWidth = sh * (9 / 16);
    }

    // 스타일 적용
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    // 실제 해상도 설정 (DPR 반영)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    // 논리 좌표 시스템(1080x1920) 대비 스케일 계산
    gameScale = displayWidth / LOGICAL_WIDTH;
    ctx.scale(dpr * gameScale, dpr * gameScale);

    // 내부 논리적 좌표 고정
    width = LOGICAL_WIDTH;
    height = LOGICAL_HEIGHT;

    // 객체 위치 재조정 (세이픈 에어리어 딤 영역 고려하여 여유 있게 배치)
    player2.width = skills2P.paddleWide ? 354 : PADDLE_WIDTH;
    player2.height = PADDLE_HEIGHT;
    player2.x = width / 2 - player2.width / 2;
    player2.y = 100; // 상단 영역으로 더 밀착 (기존 150)

    player1.width = skills1P.paddleWide ? 354 : PADDLE_WIDTH;
    player1.height = PADDLE_HEIGHT;
    player1.x = width / 2 - player1.width / 2;
    player1.y = height - 100 - player1.height; // 하단 영역으로 더 밀착 (기존 150)

    ball.radius = BALL_RADIUS;

    // 게임 시작 전이면 공 위치 초기화
    if (gameState === STATE.READY) {
        resetBall();
    }
}

function resetBall(winnerSide) {
    ball.vx = 0;
    ball.vy = 0;
    ball.x = width / 2;

    if (winnerSide === '1P') {
        ball.y = player2.y + player2.height + ball.radius + 20; // 2P 쪽에서 시작
    } else if (winnerSide === '2P') {
        ball.y = player1.y - ball.radius - 20; // 1P 쪽에서 시작
    } else {
        // 초기 시작 시 랜덤 (1P 또는 2P 근처)
        const isPlayer1Starting = Math.random() > 0.5;
        if (isPlayer1Starting) {
            ball.y = player1.y - ball.radius - 20;
        } else {
            ball.y = player2.y + player2.height + ball.radius + 20;
        }
    }

    // 패들 위치를 중앙으로 강제 고정
    player2.x = width / 2 - player2.width / 2;
    player1.x = width / 2 - player1.width / 2;
    player2.touchId = null;
    player1.touchId = null;

    gameState = STATE.READY;

    // 생성 연출 초기화
    ballSpawnTimer = 0;
    ballSpawnScale = 0;

    // 팝업 연출 초기화
    goalPopupTimer = 0;
    goalPopupScaleY = 0;
}

// 입력 핸들링 통합 함수
function handleInputStart(id, tx, ty) {
    // 득점 팝업 dismiss 처리
    if (gameState === STATE.GOAL) {
        if (goalPopupTimer >= 20) { // 애니메이션 완료 후 클릭 시
            let setWinner = null;
            if (scoreBottom >= TARGET_SET_SCORE) setWinner = '1P';
            else if (scoreTop >= TARGET_SET_SCORE) setWinner = '2P';

            if (setWinner) {
                // 세트 종료 로직 실행
                skills1P.paddleWide = false; skills1P.goalWall = false;
                skills2P.paddleWide = false; skills2P.goalWall = false;
                resize();

                if (setWinner === '1P') {
                    matchWins1P++;
                    loserSide = '2P';
                } else {
                    matchWins2P++;
                    loserSide = '1P';
                }

                if (matchWins1P >= TARGET_MATCH_WINS || matchWins2P >= TARGET_MATCH_WINS) {
                    matchWinner = setWinner;
                    gameState = STATE.MATCH_OVER;
                } else {
                    gameState = STATE.SKILL_SELECT;
                    selectedCardIdx = -1;
                    skillEnterFrames = 0;    // 초기화 필수
                    skillSelectedFrames = 0; // 초기화 필수
                    scoreTop = 0;
                    scoreBottom = 0;
                }
            } else {
                // 일반 득점 후 다음 서브 준비
                const nextWinner = pendingWinner;
                pendingWinner = null;
                resetBall(nextWinner);
                gameState = STATE.READY;
            }
        }
        return;
    }

    // 일시정지 메뉴에서의 입력 처리
    if (gameState === STATE.PAUSED) {
        const centerX = width / 2;
        const centerY = height / 2;

        // 버튼 판정 범위 (이미지 레이아웃 기반)
        const sideSize = 220;
        const centerSize = 280;
        const spacing = 280; // 버튼 간격

        const isInside = (tx, ty, x, y, size) => {
            return tx > x - size / 2 && tx < x + size / 2 &&
                ty > y - size / 2 && ty < y + size / 2;
        };

        if (isInside(tx, ty, centerX, centerY, centerSize)) { // 게임 재개 (중앙 녹색)
            gameState = prevState;
        } else if (isInside(tx, ty, centerX - spacing, centerY, sideSize)) { // 재시작 (왼쪽 노란색)
            scoreTop = 0;
            scoreBottom = 0;
            matchWins1P = 0;
            matchWins2P = 0;
            skills1P.paddleWide = false; skills1P.goalWall = false;
            skills2P.paddleWide = false; skills2P.goalWall = false;
            resetBall();
            gameState = STATE.READY;
        } else if (isInside(tx, ty, centerX + spacing, centerY, sideSize)) { // 나가기 (오른쪽 빨간색)
            scoreTop = 0;
            scoreBottom = 0;
            matchWins1P = 0;
            matchWins2P = 0;
            skills1P.paddleWide = false; skills1P.goalWall = false;
            skills2P.paddleWide = false; skills2P.goalWall = false;
            gameState = STATE.TITLE;
        }
        return;
    }

    // 최종 승리 화면에서의 입력 처리
    if (gameState === STATE.MATCH_OVER) {
        const btnW = 220;
        const btnX = width / 2;
        const btnY = height / 2 + 200;

        // 재시작 버튼
        if (tx > btnX - 250 && tx < btnX - 250 + btnW && ty > btnY && ty < btnY + btnW) {
            scoreTop = 0; scoreBottom = 0;
            matchWins1P = 0; matchWins2P = 0;
            skills1P.paddleWide = false; skills1P.goalWall = false;
            skills2P.paddleWide = false; skills2P.goalWall = false;
            resetBall();
            gameState = STATE.READY;
        }
        // 나가기 버튼
        if (tx > btnX + 50 && tx < btnX + 50 + btnW && ty > btnY && ty < btnY + btnW) {
            scoreTop = 0; scoreBottom = 0;
            matchWins1P = 0; matchWins2P = 0;
            gameState = STATE.TITLE;
        }
        return;
    }

    // 스킬 선택 화면에서의 입력 처리
    if (gameState === STATE.SKILL_SELECT) {
        if (selectedCardIdx !== -1) return; // 이미 선택했다면 무시

        const cardW = 380;
        const cardH = 550;
        const spacing = 420;

        // 1P/2P 모두 로컬 Y축 하단(0.7) 기준으로 판정. 2P는 이미 좌표가 회전되어 들어옴.
        const centerY = height * 0.7;

        // 터치 좌표 보정 (2P일 경우 180도 회전된 기준)
        let clickX = tx;
        let clickY = ty;
        if (loserSide === '2P') {
            clickX = width - tx;
            clickY = height - ty;
        }

        const leftCardX = width / 2 - spacing / 2 - cardW / 2;
        const rightCardX = width / 2 + spacing / 2 - cardW / 2;
        const cardY = centerY - cardH / 2;

        // 보다 직관적인 판정을 위해 개별 카드의 정확한 Rect 영역 체크 (20px 패딩 추가)
        const pad = 20;
        if (clickY >= cardY - pad && clickY <= cardY + cardH + pad) {
            if (clickX >= leftCardX - pad && clickX <= leftCardX + cardW + pad) {
                selectedCardIdx = 0; // 왼쪽 카드 선택
            } else if (clickX >= rightCardX - pad && clickX <= rightCardX + cardW + pad) {
                selectedCardIdx = 1; // 오른쪽 카드 선택
            }
        }
        return;
    }

    // 일시정지 버튼 체크 (경기 중/대기 중)
    if (gameState === STATE.PLAYING || gameState === STATE.READY) {
        const pWidth = 263;
        const pHeight = 270;
        if (tx > width / 2 - pWidth / 2 && tx < width / 2 + pWidth / 2 &&
            ty > height / 2 - pHeight / 2 && ty < height / 2 + pHeight / 2) {
            prevState = gameState; // 현재 상태 저장
            gameState = STATE.PAUSED;
            return;
        }
    }

    // 타이틀 화면에서 시작 버튼 체크
    if (gameState === STATE.TITLE) {
        const btnW = 765;
        const btnH = 335;
        const btnX = width / 2;
        const btnY = height * 0.85;

        if (tx > btnX - btnW / 2 && tx < btnX + btnW / 2 &&
            ty > btnY - btnH / 2 && ty < btnY + btnH / 2) {
            gameState = STATE.READY;
            resetBall();
            return;
        }
    }

    // 공 발사 드래그 체크
    if (gameState === STATE.READY) {
        const dist = Math.hypot(tx - ball.x, ty - ball.y);
        if (dist < 60) { // 클릭 판정 범위를 조금 넓힘
            ball.isDragging = true;
            ball.dragStartX = tx;
            ball.dragStartY = ty;
            return;
        }
    }

    // 패들 할당
    if (ty < height / 2 && player2.touchId === null) {
        // 2P 서브 차례가 아닐 때만 할당 및 이동
        const is2PTurn = gameState === STATE.READY && ball.y < height / 2;
        if (!is2PTurn) {
            player2.touchId = id;
            player2.x = tx - player2.width / 2;
        }
    } else if (ty > height / 2 && player1.touchId === null) {
        // 1P 서브 차례가 아닐 때만 할당 및 이동
        const is1PTurn = gameState === STATE.READY && ball.y > height / 2;
        if (!is1PTurn) {
            player1.touchId = id;
            player1.x = tx - player1.width / 2;
        }
    }
}

function handleInputMove(id, tx, ty) {
    if (ball.isDragging) {
        ball.dragStartX = tx;
        ball.dragStartY = ty;
    }

    if (id === player2.touchId) {
        // READY 상태일 때 2P가 공을 가지고 있다면 이동 제한
        const is2PTurn = gameState === STATE.READY && ball.y < height / 2;
        if (!is2PTurn) {
            player2.x = Math.max(0, Math.min(width - player2.width, tx - player2.width / 2));
        }
    } else if (id === player1.touchId) {
        // READY 상태일 때 1P가 공을 가지고 있다면 이동 제한
        const is1PTurn = gameState === STATE.READY && ball.y > height / 2;
        if (!is1PTurn) {
            player1.x = Math.max(0, Math.min(width - player1.width, tx - player1.width / 2));
        }
    }
}

function handleInputEnd(id, tx, ty) {
    if (ball.isDragging) {
        const dx = ball.x - tx;
        const dy = ball.y - ty;

        // 최소 드래그 거리가 있어야 발사
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
            // 거리에 상관없이 MIN_SPEED로 시작, 방향만 dx, dy로 결정
            const angle = Math.atan2(dy, dx);
            ball.vx = Math.cos(angle) * MIN_SPEED;
            ball.vy = Math.sin(angle) * MIN_SPEED;

            gameState = STATE.PLAYING;
        }
        ball.isDragging = false;
    }

    if (id === player2.touchId) player2.touchId = null;
    if (id === player1.touchId) player1.touchId = null;
}

// 터치 이벤트
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.changedTouches) {
        const tx = (touch.clientX - rect.left) / gameScale;
        const ty = (touch.clientY - rect.top) / gameScale;
        handleInputStart(touch.identifier, tx, ty);
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.changedTouches) {
        const tx = (touch.clientX - rect.left) / gameScale;
        const ty = (touch.clientY - rect.top) / gameScale;
        handleInputMove(touch.identifier, tx, ty);
    }
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    for (const touch of e.changedTouches) {
        const tx = (touch.clientX - rect.left) / gameScale;
        const ty = (touch.clientY - rect.top) / gameScale;
        handleInputEnd(touch.identifier, tx, ty);
    }
}, { passive: false });

// 마우스 이벤트 (PC 테스트용)
let isMouseDown = false;
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    isMouseDown = true;
    const tx = (e.clientX - rect.left) / gameScale;
    const ty = (e.clientY - rect.top) / gameScale;
    handleInputStart('mouse', tx, ty);
});

window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const tx = (e.clientX - rect.left) / gameScale;
    const ty = (e.clientY - rect.top) / gameScale;
    handleInputMove('mouse', tx, ty);
});

window.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    const rect = canvas.getBoundingClientRect();
    const tx = (e.clientX - rect.left) / gameScale;
    const ty = (e.clientY - rect.top) / gameScale;
    isMouseDown = false;
    handleInputEnd('mouse', tx, ty);
});

function update() {
    if (gameState === STATE.PAUSED) return; // 일시정지 시 물리 업데이트 중단

    if (gameState === STATE.TITLE) {
        // 시작 버튼 펄스 애니메이션 (95% ~ 100%)
        titleBtnTime += 0.05;
        titleBtnScale = 0.975 + Math.sin(titleBtnTime) * 0.025;
        return;
    }

    if (gameState === STATE.READY) {
        // 공 생성 애니메이션 업데이트
        if (ballSpawnTimer < SPAWN_DURATION) {
            ballSpawnTimer++;
            const t = ballSpawnTimer / SPAWN_DURATION;
            // Bezier 유사 곡선 0 -> 1.5 -> 1 (f(t) = -4*t^2 + 5t)
            ballSpawnScale = -4 * (t * t) + 5 * t;

            // 공 스케일 완료 시점에 연기 시작
            if (ballSpawnTimer === SPAWN_DURATION) {
                ballSpawnScale = 1;
                // 공이 안착한 현재 위치에 독립적인 연기 오브젝트 생성
                spawnSmokeAnimations.push({
                    x: ball.x,
                    y: ball.y,
                    frame: 0,
                    fps: 30,
                    lastUpdate: Date.now()
                });
            }
        }

        // 공 생성 연기 시퀀스 독립 업데이트
        const nowTime = Date.now();
        for (let i = spawnSmokeAnimations.length - 1; i >= 0; i--) {
            const anim = spawnSmokeAnimations[i];
            if (nowTime - anim.lastUpdate >= 1000 / anim.fps) {
                anim.frame++;
                anim.lastUpdate = nowTime;
                if (anim.frame >= SMOKE_TOTAL_FRAMES) {
                    spawnSmokeAnimations.splice(i, 1);
                }
            }
        }

        // 말풍선 아이들 애니메이션 (100% ~ 110%)
        bubbleAnimTime += 0.05;
        bubbleScale = 1.05 + Math.sin(bubbleAnimTime) * 0.05;
    }

    if (gameState === STATE.GOAL) {
        // 득점 팝업 Y축 스케일 애니메이션 (0.3초)
        if (goalPopupTimer < 20) {
            goalPopupTimer++;
            const t = goalPopupTimer / 20;
            // Bezier 0 -> 1.5 -> 1
            goalPopupScaleY = -4 * (t * t) + 5 * t;
        } else {
            goalPopupScaleY = 1;
        }
        return;
    }

    if (gameState === STATE.PLAYING) {
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.rotation += ball.rotationSpeed * ball.rotationDir;

        // 스케일 복구 (Lerp) - 복구 속도를 소폭 늦춤 (0.15 -> 0.1)
        ball.scaleX += (1 - ball.scaleX) * 0.1;
        ball.scaleY += (1 - ball.scaleY) * 0.1;

        // 궤적 기록
        trailHistory.push({ x: ball.x, y: ball.y });
        if (trailHistory.length > TRAIL_MAX_LENGTH) {
            trailHistory.shift();
        }

        // 벽 충돌 (마찰/감속 제거)
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx *= -1;
            ball.rotationDir *= -1;
            ball.scaleX = 0.9; // X축 Squash (10%)
            ball.scaleY = 1.1; // Y축 Stretch (10%)
            spawnParticles(0, ball.y, 5);
            triggerSideSmokeFx(0, ball.y, true); // 왼쪽 벽 충돌 (반전)
        } else if (ball.x + ball.radius > width) {
            ball.x = width - ball.radius;
            ball.vx *= -1;
            ball.rotationDir *= -1;
            ball.scaleX = 0.9;
            ball.scaleY = 1.1;
            spawnParticles(width, ball.y, 5);
            triggerSideSmokeFx(width, ball.y, false); // 오른쪽 벽 충돌
        }

        // 패들 충돌 (2P)
        if (ball.y - ball.radius < player2.y + player2.height &&
            ball.y + ball.radius > player2.y &&
            ball.x > player2.x && ball.x < player2.x + player2.width) {

            ball.y = player2.y + player2.height + ball.radius;
            ball.vy = Math.abs(ball.vy) * SPEED_INCREMENT;
            ball.rotationDir *= -1;
            ball.scaleX = 1.1; // X축 Stretch (10%)
            ball.scaleY = 0.9; // Y축 Squash (10%)

            const hitPos = (ball.x - (player2.x + player2.width / 2)) / (player2.width / 2);
            ball.vx += hitPos * 7;
            spawnParticles(ball.x, player2.y + player2.height, 10);
            triggerHitFx(ball.x, player2.y + player2.height, true); // 2P 히트 이펙트 (회전)
        }

        // 패들 충돌 (1P)
        if (ball.y + ball.radius > player1.y &&
            ball.y - ball.radius < player1.y + player1.height &&
            ball.x > player1.x && ball.x < player1.x + player1.width) {

            ball.y = player1.y - ball.radius;
            ball.vy = -Math.abs(ball.vy) * SPEED_INCREMENT;
            ball.rotationDir *= -1;
            ball.scaleX = 1.1;
            ball.scaleY = 0.9;

            const hitPos = (ball.x - (player1.x + player1.width / 2)) / (player1.width / 2);
            ball.vx += hitPos * 7;
            spawnParticles(ball.x, player1.y, 10);
            triggerHitFx(ball.x, player1.y, false); // 1P 히트 이펙트
        }

        // 최소/최대 속도 상시 유지
        let speed = Math.hypot(ball.vx, ball.vy);
        if (speed > 0 && speed < MIN_SPEED) { // speed가 0일 때(READY) 발생하는 NaN 방지
            const ratio = MIN_SPEED / speed;
            ball.vx *= ratio;
            ball.vy *= ratio;
        } else if (speed > MAX_SPEED) {
            const ratio = MAX_SPEED / speed;
            ball.vx *= ratio;
            ball.vy *= ratio;
        }

        // 골 체크 및 세트 정산 로직
        let goalScored = false;
        let setWinner = null;

        if (ball.y < 0) {
            // 1P 득점 시도
            const wallWidth = width * 0.2;
            if (skills2P.goalWall && (ball.x < wallWidth || ball.x > width - wallWidth)) {
                ball.y = ball.radius;
                ball.vy *= -1;
                spawnParticles(ball.x, 0, 5);
            } else {
                scoreBottom++;
                pendingWinner = '1P';
                gameState = STATE.GOAL;
                goalPopupTimer = 0;
                goalPopupScaleY = 0;
                ball.vx = 0; ball.vy = 0; // 공 멈춤
            }
        } else if (ball.y > height) {
            // 2P 득점 시도
            const wallWidth = width * 0.2;
            if (skills1P.goalWall && (ball.x < wallWidth || ball.x > width - wallWidth)) {
                ball.y = height - ball.radius;
                ball.vy *= -1;
                spawnParticles(ball.x, height, 5);
            } else {
                scoreTop++;
                pendingWinner = '2P';
                gameState = STATE.GOAL;
                goalPopupTimer = 0;
                goalPopupScaleY = 0;
                ball.vx = 0; ball.vy = 0;
            }
        }

        // 세트 종료 판치 여부를 GOAL 상태 진입 시점에 미리 계산하지 않고 dismissed 시점에 수행
    }

    // 스킬 선택 애니메이션 업데이트
    if (gameState === STATE.SKILL_SELECT) {
        if (selectedCardIdx === -1) {
            skillEnterFrames = Math.min(30, skillEnterFrames + 1);
        } else {
            skillSelectedFrames++;
            if (skillSelectedFrames > 20) {
                // 선택 확정 및 반영
                const currentSkills = (loserSide === '1P') ? skills1P : skills2P;
                if (selectedCardIdx === 0) currentSkills.paddleWide = true;
                else currentSkills.goalWall = true;

                if (currentSkills.paddleWide) resize();

                gameState = STATE.READY;
                resetBall();
                selectedCardIdx = -1;
                skillEnterFrames = 0;
                skillSelectedFrames = 0;
            }
        }
    }

    // 파티클 업데이트
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.rotation += p.rotVel;
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }

    // 히트 애니메이션 프레임 업데이트
    const now = Date.now();
    for (let i = hitAnimations.length - 1; i >= 0; i--) {
        const anim = hitAnimations[i];
        if (now - anim.lastTime > 1000 / anim.fps) {
            anim.frame++;
            anim.lastTime = now;
            if (anim.frame >= anim.maxFrame) {
                hitAnimations.splice(i, 1);
            }
        }
    }

    // 벽면 연기 애니메이션 프레임 업데이트
    for (let i = sideSmokeAnimations.length - 1; i >= 0; i--) {
        const anim = sideSmokeAnimations[i];
        if (now - anim.lastTime > 1000 / anim.fps) {
            anim.frame++;
            anim.lastTime = now;
            if (anim.frame >= anim.maxFrame) {
                sideSmokeAnimations.splice(i, 1);
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // 배경 이미지
    if (images.bg.complete) {
        ctx.drawImage(images.bg, 0, 0, width, height);
    } else {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
    }

    // 공 생성 Smoke FX (배경과 공/패들 사이 레이어 - 독립 좌표 기반)
    spawnSmokeAnimations.forEach(anim => {
        const img = images.smokeFx[anim.frame];
        if (img && img.complete) {
            ctx.save();
            const fxSize = 400;
            ctx.translate(anim.x, anim.y);
            ctx.drawImage(img, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
            ctx.restore();
        }
    });

    if (gameState === STATE.TITLE) {
        // 타이틀 일러스트
        if (images.title.complete) {
            const tw = width;
            const th = (images.title.height / images.title.width) * tw;
            ctx.drawImage(images.title, 0, (height - th) / 2, tw, th);
        }

        if (images.btnStart.complete) {
            const btnW = 765 * titleBtnScale;
            const btnH = 335 * titleBtnScale;
            const btnX = width / 2 - btnW / 2;
            const btnY = height * 0.85 - btnH / 2;
            ctx.drawImage(images.btnStart, btnX, btnY, btnW, btnH);
        }
        return;
    }

    ctx.save();
    ctx.globalAlpha = 0.5;

    // 왼쪽 사이드 여백 설정
    const scoreX = 150;
    const scoreY = height / 2;

    // 매치 승수 아이콘 (roundwin_1, roundwin_2)
    const iconSize = 60; // 배경(슬롯) 크기
    const winSize = 38;  // 불빛(승리 아이콘) 크기
    const offset = (iconSize - winSize) / 2; // 중앙 배치를 위한 오프셋
    const iconX = scoreX - 140;

    // 2P 승수 (상단) - 위에서부터 채우는 것이 아니라 중앙에서부터 거꾸로
    for (let i = 0; i < TARGET_MATCH_WINS; i++) {
        const iy = scoreY - 150 - (i * 70); // 중앙 기준 위로 쌓임
        // 배경 먼저 그리기
        if (images.roundwinBg.complete) {
            ctx.drawImage(images.roundwinBg, iconX, iy, iconSize, iconSize);
        }
        // 승리 시 불 켜기
        if (i < matchWins2P) {
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.drawImage(images.roundwin2, iconX + offset, iy + offset, winSize, winSize);
            ctx.restore();
        }
    }

    // 1P 승수 (하단) - 아래에서부터 채우는 것이 아니라 중앙에서부터 순차적으로
    for (let i = 0; i < TARGET_MATCH_WINS; i++) {
        const iy = scoreY + 90 + (i * 70); // 중앙 기준 아래로 쌓임
        // 배경 먼저 그리기
        if (images.roundwinBg.complete) {
            ctx.drawImage(images.roundwinBg, iconX, iy, iconSize, iconSize);
        }
        // 승리 시 불 켜기
        if (i < matchWins1P) {
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.drawImage(images.roundwin1, iconX + offset, iy + offset, winSize, winSize);
            ctx.restore();
        }
    }

    ctx.font = 'italic 900 130px Outfit'; // 이탤릭 및 두꺼운 폰트
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.lineJoin = 'round';

    // 상단(2P) 점수 - Red (#dd3a3c), 시계 반대 방향 90도 회전
    ctx.save();
    ctx.translate(scoreX, scoreY - 85);
    ctx.rotate(-Math.PI / 2); // 90도 회전
    ctx.strokeStyle = '#c9f7ff';
    ctx.fillStyle = '#dd3a3c';
    ctx.strokeText(scoreTop, 0, 0);
    ctx.fillText(scoreTop, 0, 0);
    ctx.restore();

    // 하단(1P) 점수 - Blue (#155ae4), 시계 반대 방향 90도 회전
    ctx.save();
    ctx.translate(scoreX, scoreY + 100);
    ctx.rotate(-Math.PI / 2); // 90도 회전
    ctx.strokeStyle = '#c9f7ff';
    ctx.fillStyle = '#155ae4';
    ctx.strokeText(scoreBottom, 0, 0);
    ctx.fillText(scoreBottom, 0, 0);
    ctx.restore();

    ctx.restore();

    // 일시정지 버튼 (경기장 중앙 - 레이어 하단 배치)
    if (gameState === STATE.PLAYING || gameState === STATE.READY) {
        if (images.pause.complete) {
            const pWidth = 263;
            const pHeight = 270;
            ctx.save();
            ctx.globalAlpha = 0.5; // 배경 요소 느낌을 위해 투명도 소폭 조정
            ctx.drawImage(images.pause, width / 2 - pWidth / 2, height / 2 - pHeight / 2, pWidth, pHeight);
            ctx.restore();
        }
    }

    // 경기장 선
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // 패들 (2P)
    ctx.save();
    if (images.paddle2.complete) {
        // 기존 패들은 늘리지 않고 중앙에 고정 크기로 렌더링
        const px = player2.x + (player2.width - PADDLE_WIDTH) / 2;
        ctx.drawImage(images.paddle2, px, player2.y, PADDLE_WIDTH, player2.height);

        // 스킬 01: 패들 확장 이미지 덧댐 (354, 70)
        if (skills2P.paddleWide && images.skill01.complete) {
            const sw = 354;
            const sh = 70;
            // 2P는 하단부에 덧댐 (공과 마주보는 쪽)
            ctx.drawImage(images.skill01, player2.x + player2.width / 2 - sw / 2, player2.y + player2.height - sh / 2, sw, sh);
        }
    } else {
        ctx.fillStyle = player2.color;
        ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    }
    ctx.restore();

    // 패들 (1P)
    ctx.save();
    if (images.paddle1.complete) {
        // 기존 패들은 늘리지 않고 중앙에 고정 크기로 렌더링
        const px = player1.x + (player1.width - PADDLE_WIDTH) / 2;
        ctx.drawImage(images.paddle1, px, player1.y, PADDLE_WIDTH, player1.height);

        // 스킬 01: 패들 확장 이미지 덧댐 (354, 70)
        if (skills1P.paddleWide && images.skill01.complete) {
            const sw = 354;
            const sh = 70;
            // 1P는 상단부에 덧댐 (공과 마주보는 쪽)
            ctx.drawImage(images.skill01, player1.x + player1.width / 2 - sw / 2, player1.y - sh / 2, sw, sh);
        }
    } else {
        ctx.fillStyle = player1.color;
        ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    }
    ctx.restore();

    // 골대 벽 (Skill 02) 시각화
    const wallWidth = width * 0.2;
    const wallHeight = 120; // 이미지 가독성을 위해 높이 조정

    if (images.skill02.complete) {
        // 2P (상단) 골대 벽
        if (skills2P.goalWall) {
            // 상단 왼쪽
            ctx.save();
            ctx.translate(0, wallHeight);
            ctx.scale(1, -1); // 수직 반전
            ctx.drawImage(images.skill02, 0, 0, wallWidth, wallHeight);
            ctx.restore();

            // 상단 오른쪽
            ctx.save();
            ctx.translate(width, wallHeight);
            ctx.scale(-1, -1); // 수평 & 수직 반전
            ctx.drawImage(images.skill02, 0, 0, wallWidth, wallHeight);
            ctx.restore();
        }

        // 1P (하단) 골대 벽
        if (skills1P.goalWall) {
            // 하단 왼쪽 (기준 이미지)
            ctx.save();
            ctx.drawImage(images.skill02, 0, height - wallHeight, wallWidth, wallHeight);
            ctx.restore();

            // 하단 오른쪽
            ctx.save();
            ctx.translate(width, height - wallHeight);
            ctx.scale(-1, 1); // 수평 반전
            ctx.drawImage(images.skill02, 0, 0, wallWidth, wallHeight);
            ctx.restore();
        }
    } else {
        // 이미지 로드 전 더미
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        if (skills2P.goalWall) {
            ctx.fillRect(0, 0, wallWidth, 40);
            ctx.fillRect(width - wallWidth, 0, wallWidth, 40);
        }
        if (skills1P.goalWall) {
            ctx.fillRect(0, height - 40, wallWidth, 40);
            ctx.fillRect(width - wallWidth, height - 40, wallWidth, 40);
        }
    }

    // "드래그해서 슛" 말풍선 안내 (READY 상태일 때)
    if (gameState === STATE.READY && images.textBubble.complete) {
        ctx.save();
        const baseW = 366; // 말풍선 기본 너비
        const baseH = 224; // 말풍선 기본 높이
        const bw = baseW * bubbleScale;
        const bh = baseH * bubbleScale;

        if (ball.y < height / 2) {
            // 2P 서브 (상단 플레이어)
            ctx.translate(player2.x + player2.width / 2 + 230, player2.y + player2.height / 2 + 100);
            ctx.rotate(Math.PI);
            ctx.drawImage(images.textBubble, -bw / 2, -bh / 2, bw, bh);
        } else {
            // 1P 서브 (하단 플레이어)
            ctx.translate(player1.x + player1.width / 2 - 230, player1.y + player1.height / 2 - 100);
            ctx.drawImage(images.textBubble, -bw / 2, -bh / 2, bw, bh);
        }
        ctx.restore();
    }

    // 궤적 (Trail)
    if (gameState === STATE.PLAYING) {
        for (let i = 0; i < trailHistory.length; i++) {
            const pos = trailHistory[i];
            const ratio = (i + 1) / trailHistory.length;
            ctx.globalAlpha = 0.1;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, ball.radius * ratio, 0, Math.PI * 2); // 뒤로 갈수록 점차 작아짐
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    // 파티클 렌더링
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        if (p.img.complete) {
            ctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
    });
    ctx.globalAlpha = 1.0;

    // 공 가이드 라인 (드래그 시 화살표 이미지 사용)
    if (ball.isDragging && images.arrowGreen.complete) {
        ctx.save();
        const dx = ball.x - ball.dragStartX;
        const dy = ball.y - ball.dragStartY;
        const dist = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx);

        ctx.translate(ball.x, ball.y);
        ctx.rotate(angle + Math.PI / 2); // 하단 중앙 앵커

        const arrowW = 120;
        // 이미지 원본 비율 기준 최대 2.5배로 길이 제한
        const ratio = images.arrowGreen.height / images.arrowGreen.width;
        const baseH = arrowW * ratio;
        const maxH = baseH * 2.5;
        const arrowH = Math.min(maxH, dist * 1.5);

        ctx.globalAlpha = 0.7;
        // 하단 중앙 앵커: 이미지를 중앙 가로축은 맞추고 세로축은 위로 뻗게 그림
        ctx.drawImage(images.arrowGreen, -arrowW / 2, -arrowH, arrowW, arrowH);
        ctx.restore();
    }

    // 3. 공 (Puck)
    if (images.puck.complete) {
        ctx.save();
        ctx.translate(ball.x, ball.y);
        // 생성 연출 스케일 적용
        ctx.scale(ball.scaleX * ballSpawnScale, ball.scaleY * ballSpawnScale);
        ctx.rotate(ball.rotation);
        ctx.drawImage(images.puck, -ball.radius, -ball.radius, ball.radius * 2, ball.radius * 2);
        ctx.restore();
    } else {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        // 생성 연출 스케일 적용
        ctx.arc(ball.x, ball.y, ball.radius * ballSpawnScale, 0, Math.PI * 2);
        ctx.fill();
    }

    // 히트 애니메이션 렌더링
    hitAnimations.forEach(anim => {
        const img = images.hitFx[anim.frame];
        if (img && img.complete) {
            ctx.save();
            ctx.translate(anim.x, anim.y);
            if (anim.isRotated) {
                ctx.rotate(Math.PI);
            }
            // 이펙트 크기를 적절히 조절 (예: 300x300)
            const fxSize = 400;
            ctx.drawImage(img, -fxSize / 2, -fxSize / 2, fxSize, fxSize);
            ctx.restore();
        }
    });

    // 벽면 연기 애니메이션 렌더링
    sideSmokeAnimations.forEach(anim => {
        const img = images.sideSmokeFx[anim.frame];
        if (img && img.complete) {
            ctx.save();
            ctx.translate(anim.x, anim.y);
            if (anim.isLeft) {
                ctx.scale(-1, 1); // 왼쪽 벽 충돌 시 수평 반전
            }
            // 이펙트 크기를 적절히 조절 (예: 가로 200, 세로 400)
            const smokeW = 200;
            const smokeH = 400;
            // 기준점이 벽면에 붙도록 보정
            ctx.drawImage(img, -smokeW, -smokeH / 2, smokeW, smokeH);
            ctx.restore();
        }
    });


    // 일시정지 팝업
    if (gameState === STATE.PAUSED) {
        // 배경 딤 처리
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;

        // 1. 팝업 배경 이미지 (가로형)
        if (images.pausePopup.complete) {
            const popupW = 1080;
            const popupH = 350;
            ctx.drawImage(images.pausePopup, centerX - popupW / 2, centerY - popupH / 2, popupW, popupH);
        }

        // 2. 버튼 이미지 렌더링 (가로 배치)
        const sideSize = 220;   // 사이드 버튼 크기
        const centerSize = 280; // 중앙 재생 버튼 크기 (더 크게)
        const spacing = 280;    // 간격

        // 재생 (중앙)
        if (images.btnPlay.complete) {
            ctx.drawImage(images.btnPlay, centerX - centerSize / 2, centerY - centerSize / 2, centerSize, centerSize);
        }
        // 재시작 (왼쪽)
        if (images.btnRestart.complete) {
            ctx.drawImage(images.btnRestart, (centerX - spacing) - sideSize / 2, centerY - sideSize / 2, sideSize, sideSize);
        }
        // 나가기 (오른쪽)
        if (images.btnExit.complete) {
            ctx.drawImage(images.btnExit, (centerX + spacing) - sideSize / 2, centerY - sideSize / 2, sideSize, sideSize);
        }
    }

    // 스킬 선택 화면
    if (gameState === STATE.SKILL_SELECT) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        if (loserSide === '2P') {
            ctx.translate(width / 2, height / 2);
            ctx.rotate(Math.PI);
            ctx.translate(-width / 2, -height / 2);
        }

        // 1P/2P 모두 로컬 Y는 하단에 배치. 2P의 경우 컨텍스트 회전에 의해 상단으로 올라감.
        const centerY = height * 0.7;

        ctx.font = 'bold 80px Outfit';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('Select a Card!', width / 2, centerY - 400);

        const cardW = 380;
        const cardH = 550;
        const spacing = 420;

        // 등장 애니메이션 스케일 계산 (0 -> 1.2 -> 1)
        let enterScale = 0;
        if (skillEnterFrames < 15) {
            enterScale = (skillEnterFrames / 15) * 1.2;
        } else {
            enterScale = 1.2 - ((skillEnterFrames - 15) / 15) * 0.2;
        }

        const drawCard = (idx, img, x, y) => {
            const isSelected = (selectedCardIdx === idx);
            const isAnySelected = (selectedCardIdx !== -1);

            if (isAnySelected && !isSelected) return; // 선택되지 않은 카드는 숨김

            let scale = enterScale;
            let opacity = 1;

            if (isSelected) {
                // 선택된 카드 애니메이션: 1 -> 1.5 확대 및 페이드 아웃
                const progress = skillSelectedFrames / 20;
                scale = 1 + progress * 0.5;
                opacity = 1 - progress;

                // 잔상 효과 (속도에 맞춰 간격 조정)
                for (let i = 1; i <= 3; i++) {
                    const ghostProgress = Math.max(0, progress - i * 0.05);
                    if (ghostProgress <= 0) continue;
                    ctx.save();
                    ctx.globalAlpha = (1 - ghostProgress) * 0.3;
                    const ghostScale = 1 + ghostProgress * 0.8;
                    ctx.translate(x + cardW / 2, y + cardH / 2);
                    ctx.scale(ghostScale, ghostScale);
                    ctx.drawImage(img, -cardW / 2, -cardH / 2, cardW, cardH);
                    ctx.restore();
                }
            }

            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.translate(x + cardW / 2, y + cardH / 2);
            ctx.scale(scale, scale);

            // 외곽 빛 흐름 이펙트 (Glow Flow - Par_03 이미지 활용)
            if (!isAnySelected && images.par3.complete) {
                const glowTime = Date.now() / 1000;
                const pathPadding = -10;
                const rectW = cardW + pathPadding * 2;
                const rectH = cardH + pathPadding * 2;
                const perimeter = (rectW + rectH) * 2;
                const speed = 0.2;

                // 두 개의 빛 줄기 (0번: 1P쪽 시작, 1번: 2P쪽 시작)
                for (let trail = 0; trail < 2; trail++) {
                    const baseProgress = (glowTime * speed + trail * 0.5) % 1;

                    // 각 줄기당 10개의 잔상 입자
                    for (let i = 0; i < 10; i++) {
                        ctx.save();
                        // 잔상 간격을 매우 좁게 하여 겹쳐 보이게 함
                        const delay = i * 0.005;
                        let progress = (baseProgress - delay);
                        if (progress < 0) progress += 1;

                        const posInPerimeter = progress * perimeter;

                        let gx, gy;
                        if (posInPerimeter < rectW) {
                            gx = -rectW / 2 + posInPerimeter;
                            gy = -rectH / 2;
                        } else if (posInPerimeter < rectW + rectH) {
                            gx = rectW / 2;
                            gy = -rectH / 2 + (posInPerimeter - rectW);
                        } else if (posInPerimeter < rectW * 2 + rectH) {
                            gx = rectW / 2 - (posInPerimeter - (rectW + rectH));
                            gy = rectH / 2;
                        } else {
                            gx = -rectW / 2;
                            gy = rectH / 2 - (posInPerimeter - (rectW * 2 + rectH));
                        }

                        // 꼬리로 갈수록 부드럽게 투명해지고 작아짐
                        ctx.globalAlpha = Math.max(0, 1.0 - (i / 10));
                        const pSize = 40 - (i * 2);

                        ctx.translate(gx, gy);
                        ctx.drawImage(images.par3, -pSize / 2, -pSize / 2, pSize, pSize);
                        ctx.restore();
                    }
                }
            }

            ctx.drawImage(img, -cardW / 2, -cardH / 2, cardW, cardH);
            ctx.restore();
        };

        // 카드 1 (Skill 01)
        if (images.card01.complete) {
            drawCard(0, images.card01, width / 2 - spacing / 2 - cardW / 2, centerY - cardH / 2);
        }

        // 카드 2 (Skill 02)
        if (images.card02.complete) {
            drawCard(1, images.card02, width / 2 + spacing / 2 - cardW / 2, centerY - cardH / 2);
        }

        ctx.restore();
    }

    // 최종 승리 화면
    if (gameState === STATE.MATCH_OVER) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, width, height);

        if (images.victory.complete) {
            const vw = 800;
            const vh = 800;
            ctx.drawImage(images.victory, width / 2 - vw / 2, height / 2 - 500, vw, vh);
        }

        // 재시작 / 나가기 버튼
        const btnW = 220;
        const btnX = width / 2;
        const btnY = height / 2 + 200;

        ctx.drawImage(images.btnRestart, btnX - 250, btnY, btnW, btnW);
        ctx.drawImage(images.btnExit, btnX + 50, btnY, btnW, btnW);
    }

    // 득점 팝업 렌더링 (최상단)
    if (gameState === STATE.GOAL) {
        const boardW = 1080;
        const boardH = 510;
        const centerX = width / 2;
        const centerY = height / 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(1, goalPopupScaleY); // Y축으로만 베지어 스케일 적용

        if (images.scoreboard.complete) {
            ctx.drawImage(images.scoreboard, -boardW / 2, -boardH / 2, boardW, boardH);
        }

        // 숫자 이미지 그리기 (항상 왼쪽: 1P / 오른쪽: 2P 고정)
        const numW = 200;
        const numH = 250;
        const offsetX = 200; // 중앙으로부터의 거리

        // Bottom (1P) 점수 (왼쪽)
        const img1 = images.numberImgs[scoreBottom % 10];
        if (img1 && img1.complete) {
            ctx.drawImage(img1, -offsetX - numW / 2, -numH / 2, numW, numH);
        }

        // Top (2P) 점수 (오른쪽)
        const img2 = images.numberImgs[scoreTop % 10];
        if (img2 && img2.complete) {
            ctx.drawImage(img2, offsetX - numW / 2, -numH / 2, numW, numH);
        }

        ctx.restore();
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();
