const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const instructions = document.getElementById('instructions');

// 이미지 리소스 로드
const images = {
    bg: new Image(),
    puck: new Image(),
    paddle1: new Image(),
    paddle2: new Image(),
    par1: new Image(),
    par2: new Image(),
    title: new Image(),
    btnStart: new Image(),
    pause: new Image(),
    pausePopup: new Image(),
    btnPlay: new Image(),
    btnRestart: new Image(),
    btnExit: new Image()
};

const v = Date.now();
images.bg.src = 'image/BG.png?v=' + v;
images.puck.src = 'image/Puck.png?v=' + v;
images.paddle1.src = 'image/Paddle_01.png?v=' + v;
images.paddle2.src = 'image/Paddle_02.png?v=' + v;
images.par1.src = 'image/Par_01.png?v=' + v;
images.par2.src = 'image/Par_02.png?v=' + v;
images.title.src = 'image/TitleImage.png?v=' + v;
images.btnStart.src = 'image/btn_start.png?v=' + v;
images.pause.src = 'image/pause.png?v=' + v;
images.pausePopup.src = 'image/pause_popup.png?v=' + v;
images.btnPlay.src = 'image/btn_play.png?v=' + v;
images.btnRestart.src = 'image/btn_restart.png?v=' + v;
images.btnExit.src = 'image/btn_exit.png?v=' + v;

let assetsLoaded = 0;
const totalAssets = 13;
function onAssetLoad() {
    assetsLoaded++;
}

Object.values(images).forEach(img => img.onload = onAssetLoad);

// 타이틀 애니메이션 변수
let titleBtnScale = 1.0;
let titleBtnTime = 0;

// 이펙트 관련 변수
const trailHistory = [];
const TRAIL_MAX_LENGTH = 11;
const particles = [];

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
    PAUSED: 'paused'
};
let gameState = STATE.TITLE;
let prevState = STATE.READY; // 일시정지 전 상태 기억용

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
    player2.width = PADDLE_WIDTH;
    player2.height = PADDLE_HEIGHT;
    player2.x = width / 2 - player2.width / 2;
    player2.y = 100; // 상단 영역으로 더 밀착 (기존 150)

    player1.width = PADDLE_WIDTH;
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

    gameState = STATE.READY;
    instructions.innerText = "드래그해서 슛!";
    instructions.classList.remove('hidden');
}

// 입력 핸들링 통합 함수
function handleInputStart(id, tx, ty) {
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
            resetBall();
            gameState = STATE.READY;
        } else if (isInside(tx, ty, centerX + spacing, centerY, sideSize)) { // 나가기 (오른쪽 빨간색)
            scoreTop = 0;
            scoreBottom = 0;
            gameState = STATE.TITLE;
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
        player2.touchId = id;
        player2.x = tx - player2.width / 2;
    } else if (ty > height / 2 && player1.touchId === null) {
        player1.touchId = id;
        player1.x = tx - player1.width / 2;
    }
}

function handleInputMove(id, tx, ty) {
    if (ball.isDragging) {
        ball.dragStartX = tx;
        ball.dragStartY = ty;
    }

    if (id === player2.touchId) {
        player2.x = Math.max(0, Math.min(width - player2.width, tx - player2.width / 2));
    } else if (id === player1.touchId) {
        player1.x = Math.max(0, Math.min(width - player1.width, tx - player1.width / 2));
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
            instructions.classList.add('hidden');
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
        } else if (ball.x + ball.radius > width) {
            ball.x = width - ball.radius;
            ball.vx *= -1;
            ball.rotationDir *= -1;
            ball.scaleX = 0.9;
            ball.scaleY = 1.1;
            spawnParticles(width, ball.y, 5);
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

        // 골 체크
        if (ball.y < 0) {
            scoreBottom++; // 1P 득점
            resetBall('1P');
        } else if (ball.y > height) {
            scoreTop++; // 2P 득점
            resetBall('2P');
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

    // 캔버스에 점수 그리기 (객체 레이어보다 뒤에 배치)
    ctx.save();
    ctx.font = 'bold 180px Outfit'; // 크기 수정 가능 (기존 5rem과 유사)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // 화이트 색상 및 투명도 유지

    // 상단(2P) 점수 - 180도 회전
    ctx.save();
    ctx.translate(width / 2, height * 0.25);
    ctx.rotate(Math.PI);
    ctx.fillText(scoreTop, 0, 0);
    ctx.restore();

    // 하단(1P) 점수
    ctx.fillText(scoreBottom, width / 2, height * 0.75);
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
    if (images.paddle2.complete) {
        ctx.drawImage(images.paddle2, player2.x, player2.y, player2.width, player2.height);
    } else {
        ctx.fillStyle = player2.color;
        ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
    }

    // 패들 (1P)
    if (images.paddle1.complete) {
        ctx.drawImage(images.paddle1, player1.x, player1.y, player1.width, player1.height);
    } else {
        ctx.fillStyle = player1.color;
        ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
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

    // 공 가이드 라인 (드래그 시)
    if (ball.isDragging) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        const dx = ball.x - ball.dragStartX;
        const dy = ball.y - ball.dragStartY;
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + dx, ball.y + dy);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // 공 (Puck)
    if (images.puck.complete) {
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.scale(ball.scaleX, ball.scaleY);
        ctx.rotate(ball.rotation);
        ctx.drawImage(images.puck, -ball.radius, -ball.radius, ball.radius * 2, ball.radius * 2);
        ctx.restore();
    } else {
        ctx.fillStyle = ball.color;
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }


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
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
resize();
loop();
