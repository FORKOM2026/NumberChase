// ============================================================
// NUMBER CHASE
// MULTIMEDIA PEMBELAJARAN INTERAKTIF
// MATEMATIKA KELAS II / FASE A
// ============================================================
//
// MATERI:
// 1. Penjumlahan
// 2. Pengurangan
// 3. Campuran
//
// LEVEL:
// Level 1 : Satuan - Satuan (11 Detik)
// Level 2 : Satuan - Puluhan (9 Detik)
// Level 3 : Puluhan - Puluhan (7 Detik)
//
// JUMLAH SOAL: 10 soal / level
//
// SISTEM SKOR:
// Jawaban benar = +10 poin
// Jawaban salah  = 0 poin + kehilangan 1 nyawa
//
// AUDIO:
// Klik tombol / kontrol
// Jawaban benar
// Jawaban salah
// Level selesai
// Game over
// ============================================================


// ============================================================
// RESPONSIVE / MOBILE SUPPORT
// ------------------------------------------------------------
// Di layar besar (laptop/PC/tablet) tampilan TIDAK berubah (skala 1).
// Di layar kecil (HP) kanvas dibuat sedikit lebih "luas" lalu
// diperkecil lewat CSS agar semua elemen muat dan tetap bisa
// dimainkan. Koordinat sentuhan dikonversi otomatis oleh p5.
// ============================================================

const MIN_VIEW_SIDE = 480;
let gameCanvas = null;
let touchHandling = false;
let lastTouchMs = -10000;

function getViewScale() {
    let side = Math.min(windowWidth, windowHeight);
    if (!side || side <= 0) return 1;
    return Math.max(1, MIN_VIEW_SIDE / side);
}

function fitCanvasToWindow() {
    let k = getViewScale();
    resizeCanvas(
        Math.ceil(windowWidth * k),
        Math.ceil(windowHeight * k)
    );
    if (k > 1 && gameCanvas && gameCanvas.elt) {
        gameCanvas.elt.style.width = windowWidth + "px";
        gameCanvas.elt.style.height = windowHeight + "px";
    }
}


// ============================================================
// SCENE
// ============================================================

let currentScene = "MAIN_MENU";
let aboutSlide = 0; // 0 = penjelasan awal, 1 = CP & TP

let currentCategory = 1;
// 1 = Penjumlahan
// 2 = Pengurangan
// 3 = Campuran

let selectedCategory = 1;

let currentLevel = 1;
// 1 = Kura-Kura
// 2 = Kelinci
// 3 = Kuda


// ============================================================
// GAME DATA
// ============================================================

let score = 0;
let highScores = {
    1: 0, // Penjumlahan
    2: 0, // Pengurangan
    3: 0  // Campuran
};
let highScore = 0;
let lives = 3;
let levelStars = 0;
let isNewHighScore = false;

let currentQuestionList = [];
let currentQuestion = null;
let questionIndex = 0;

let isPaused = false;
let correctStreak = 0;

// Variabel Waktu
let questionTimeMax = 11;
let questionTimeLeft = 11;


// ============================================================
// AUDIO
// ============================================================

let audioCtx = null;

// BACKGROUND MUSIC
let bgMusic = null;
let gameplayMusic = null;
let musicEnabled = true;
let musicStarted = false;


// Membuat Audio Context
function initAudio() {

    try {

        if (!audioCtx) {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (AudioContext) {
                audioCtx = new AudioContext();
            }

        }

        if (
            audioCtx &&
            audioCtx.state === "suspended"
        ) {
            audioCtx.resume();
        }

    } catch (e) {

        console.log("Audio tidak tersedia:", e);

    }
}


// ------------------------------------------------------------
// PLAY TONE
// ------------------------------------------------------------

function playTone(
    frequency,
    duration,
    type = "sine",
    volume = 0.08,
    delay = 0
) {

    if (!audioCtx) return;

    try {

        const oscillator =
            audioCtx.createOscillator();

        const gain =
            audioCtx.createGain();

        const startTime =
            audioCtx.currentTime + delay;

        oscillator.type = type;

        oscillator.frequency.setValueAtTime(
            frequency,
            startTime
        );

        gain.gain.setValueAtTime(
            0.0001,
            startTime
        );

        gain.gain.exponentialRampToValueAtTime(
            volume,
            startTime + 0.01
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            startTime + duration 
        );

        oscillator.connect(gain);
        gain.connect(audioCtx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration + 0.03);

    } catch (e) {

        console.log("Audio error:", e);

    }
}


// ============================================================
// SOUND EFFECTS
// ============================================================

// ------------------------------------------------------------
// SUARA KLIK
// ------------------------------------------------------------

function playClickSound() {

    initAudio();

    playTone(
        650,
        0.09,
        "square",
        0.19
    );
}


// ------------------------------------------------------------
// JAWABAN BENAR
// ------------------------------------------------------------

function playCorrectSound() {

    initAudio();

    playTone(
        523,
        0.10,
        "sine",
        0.07,
        0
    );

    playTone(
        659,
        0.10,
        "sine",
        0.07,
        0.09
    );

    playTone(
        784,
        0.18,
        "sine",
        0.09,
        0.18
    );
}


// ------------------------------------------------------------
// JAWABAN SALAH
// ------------------------------------------------------------

function playWrongSound() {

    initAudio();

    playTone(
        300,
        0.16,
        "sawtooth",
        0.055,
        0
    );

    playTone(
        220,
        0.22,
        "sawtooth",
        0.065,
        0.14
    );
}


// ------------------------------------------------------------
// LEVEL SELESAI
// ------------------------------------------------------------

function playWinSound() {

    initAudio();

    playTone(
        523,
        0.12,
        "sine",
        0.07,
        0
    );

    playTone(
        659,
        0.12,
        "sine",
        0.07,
        0.12
    );

    playTone(
        784,
        0.12,
        "sine",
        0.08,
        0.24
    );

    playTone(
        1046,
        0.30,
        "sine",
        0.10,
        0.36
    );
}


// ------------------------------------------------------------
// GAME OVER
// ------------------------------------------------------------

function playGameOverSound() {

    initAudio();

    playTone(
        392,
        0.15,
        "triangle",
        0.07,
        0
    );

    playTone(
        330,
        0.15,
        "triangle",
        0.07,
        0.16
    );

    playTone(
        220,
        0.35,
        "triangle",
        0.08,
        0.32
    );
}


// ============================================================
// BACKGROUND MUSIC CONTROL
// ============================================================

// BGM MENU
function playMenuMusic() {

    if (!musicEnabled || !bgMusic) return;

    try {

        if (gameplayMusic && gameplayMusic.isPlaying()) {
            gameplayMusic.stop();
        }

        bgMusic.setVolume(0.12);

        if (!bgMusic.isPlaying()) {
            bgMusic.loop();
        }

        musicStarted = true;

    } catch (e) {

        console.log("Gagal memulai BGM MENU:", e);

    }

}


// BGM GAMEPLAY
function playGameplayMusic() {

    if (
        !musicEnabled ||
        !gameplayMusic ||
        isPaused
    ) return;

    try {

        if (bgMusic && bgMusic.isPlaying()) {
            bgMusic.stop();
        }

        gameplayMusic.setVolume(0.12);

        if (!gameplayMusic.isPlaying()) {
            gameplayMusic.loop();
        }

    } catch (e) {

        console.log("Gagal memulai BGM GAMEPLAY:", e);

    }

}


// STOP SEMUA MUSIK
function stopAllMusic() {

    try {

        if (bgMusic && bgMusic.isPlaying()) {
            bgMusic.stop();
        }

        if (gameplayMusic && gameplayMusic.isPlaying()) {
            gameplayMusic.stop();
        }

        musicStarted = false;

    } catch (e) {

        console.log("Gagal menghentikan semua musik:", e);

    }

}


// PAUSE BGM GAMEPLAY
function pauseGameplayMusic() {

    if (!gameplayMusic) return;

    try {

        if (gameplayMusic.isPlaying()) {
            gameplayMusic.pause();
        }

    } catch (e) {

        console.log("Gagal pause BGM gameplay:", e);

    }

}


// BUKA BLOKIR AUDIO BROWSER
function unlockAudio() {

    try {

        if (typeof userStartAudio === "function") {

            const result = userStartAudio();

            if (
                result &&
                typeof result.then === "function"
            ) {

                result.catch(() => {
                    console.log("Audio browser belum diizinkan.");
                });

            }

        }

    } catch (e) {

        console.log("Gagal unlock audio:", e);

    }

}

// ============================================================
// PLAYER
// ============================================================

let playerLane = 1;
let playerX = 0;
let playerTargetX = 0;
let playerY = 0;

let runCycle = 0;
let jumpAnim = 0;


// ============================================================
// TRACK
// ============================================================

let roadSpeed = 4;
let roadOffset = 0;
let laneWidth = 0;

let scenery = [];
let sceneryTimer = 0;


// ============================================================
// ANSWER GATE
// ============================================================

let gatesY = -350;
let gateActive = true;
let gateHitChecked = false;


// ============================================================
// EFFECT
// ============================================================

let hitEffectTimer = 0;
let particles = [];
let scorePopups = [];
let confetti = [];


// ============================================================
// MENU
// ============================================================

let logoBounce = 0;
let fallingLeaves = [];


// ============================================================
// IMAGES
// ============================================================

let imgTurtle;
let imgRabbit;
let imgHorse;
let imgMenuBg;

// 5 logo bulat di atas judul menu utama
let logoImages = [null, null, null, null, null];

// Foto profil 3 pengembang
let devImages = [null, null, null];

// Foto dosen pembimbing
let imgPembimbing = null;

// Data profil pengembang
let developers = [
    {
        name: "Naila Hanun",
        nim: "2410130220019",
        univ: "Universitas Lambung Mangkurat"
    },
    {
        name: "Ilman Akbar",
        nim: "2410130210010",
        univ: "Universitas Lambung Mangkurat"
    },
    {
        name: "Nadia Irsalina Lahizha",
        nim: "2410130120008",
        univ: "Universitas Lambung Mangkurat"
    }
];

// Data dosen pembimbing
// TODO: Ganti dengan data dosen pembimbing yang sebenarnya
let pembimbing = {
    name: "Qomario",
    nip: "NIP. 198903262023211022",
    univ: "Universitas Lambung Mangkurat"
};


// ============================================================
// PRELOAD
// ============================================================

function preload() {

    imgTurtle = loadImage(
        "assets/Kura.png",
        img => imgTurtle = img,
        () => imgTurtle = null
    );

    imgRabbit = loadImage(
        "assets/Kelinci.png",
        img => imgRabbit = img,
        () => imgRabbit = null
    );

    imgHorse = loadImage(
        "assets/Kuda.png",
        img => imgHorse = img,
        () => imgHorse = null
    );

    imgMenuBg = loadImage(
        "assets/latar depan.png",
        img => imgMenuBg = img,
        () => imgMenuBg = null
    );


    // 5 logo bulat
    for (let i = 0; i < 5; i++) {

        loadImage(
            "assets/logo" + (i + 1) + ".png",
            img => logoImages[i] = img,
            () => logoImages[i] = null
        );

    }


    // 3 foto profil pengembang
    for (let i = 0; i < 3; i++) {

        loadImage(
            "assets/dev" + (i + 1) + ".png",
            img => devImages[i] = img,
            () => devImages[i] = null
        );

    }

    // Foto dosen pembimbing
    imgPembimbing = loadImage(
        "assets/pembimbing.png",
        img => imgPembimbing = img,
        () => imgPembimbing = null
    );

    // BACKGROUND MUSIC MENU
    bgMusic = loadSound(
        "assets/bgm1.mp3",
        () => console.log("BGM MENU berhasil dimuat"),
        () => console.log("BGM MENU gagal dimuat")
    );

    // BACKGROUND MUSIC GAMEPLAY
    gameplayMusic = loadSound(
        "assets/bgm2.mp3",
        () => console.log("BGM GAMEPLAY berhasil dimuat"),
        () => console.log("BGM GAMEPLAY gagal dimuat")
    );
}


// ============================================================
// SETUP
// ============================================================

function setup() {

    let viewK = getViewScale();

    if (viewK > 1) {
        pixelDensity(
            Math.min(2, window.devicePixelRatio || 1)
        );
    }

    let canvas =
        createCanvas(
            Math.ceil(windowWidth * viewK),
            Math.ceil(windowHeight * viewK)
        );

    gameCanvas = canvas;

    if (viewK > 1) {
        canvas.elt.style.width = windowWidth + "px";
        canvas.elt.style.height = windowHeight + "px";
    }

    if (
        document.getElementById(
            "game-container"
        )
    ) {

        canvas.parent(
            "game-container"
        );

    }

    textAlign(
        CENTER,
        CENTER
    );

    imageMode(CENTER);


    // Semua High Score mulai dari 0 setiap halaman dibuka/refresh
highScores = {
        1: 0,
        2: 0,
        3: 0
    };
    highScore = 0;


    playerY =
        height * 0.78;


    createScenery();
    createFallingLeaves();

    updatePlayerPosition();

    playerX =
        playerTargetX;

    // Musik dimulai setelah interaksi user agar tidak diblokir browser.
    stopAllMusic();
}


// ============================================================
// RESIZE
// ============================================================

function windowResized() {

    fitCanvasToWindow();

    playerY =
        height * 0.78;

    updatePlayerPosition();

    createScenery();

    if (
        currentScene === "GAMEPLAY"
    ) {

        playerX =
            playerTargetX;

    }
}


// ============================================================
// MAIN DRAW
// ============================================================

function draw() {

    cursor(ARROW);


    if (
        currentScene === "MAIN_MENU"
    ) {

        drawMainMenu();

    } else if (
        currentScene === "HOW_TO_PLAY"
    ) {

        drawHowToPlay();

    } else if (
        currentScene === "CATEGORY_SELECT"
    ) {

        drawCategorySelect();

    } else if (
        currentScene === "LEVEL_SELECT"
    ) {

        drawLevelSelect();

    } else if (
        currentScene === "ABOUT"
    ) {

        drawAbout();

    } else if (
        currentScene === "PROFILE"
    ) {

        drawProfile();

    } else if (
        currentScene === "GAMEPLAY"
    ) {

        drawGameplay();

    } else if (
        currentScene === "LEVEL_COMPLETE"
    ) {

        drawLevelComplete();

    } else if (
        currentScene === "GAME_OVER"
    ) {

        drawGameOver();

    }
}


// ============================================================
// MENU BACKGROUND
// ============================================================

function drawMenuBackground() {

    if (imgMenuBg) {

        imageMode(CORNER);

        image(
            imgMenuBg,
            0,
            0,
            width,
            height
        );

        imageMode(CENTER);

    } else {

        drawNatureBackground();

    }


    fill(
        0,
        0,
        0,
        35
    );

    rect(
        0,
        0,
        width,
        height
    );

    updateLeaves();
}


// ============================================================
// FALLING LEAVES
// ============================================================

function createFallingLeaves() {

    fallingLeaves = [];

    for (
        let i = 0;
        i < 35;
        i++
    ) {

        fallingLeaves.push({

            x: random(width),

            y: random(
                -height,
                height
            ),

            size: random(
                8,
                16
            ),

            speedY: random(
                1,
                3
            ),

            speedX: random(
                -1,
                1
            ),

            rotation: random(
                TWO_PI
            ),

            rotationSpeed: random(
                -0.04,
                0.04
            )

        });

    }
}


function updateLeaves() {

    noStroke();

    for (
        let leaf of fallingLeaves
    ) {

        leaf.y +=
            leaf.speedY;

        leaf.x +=
            leaf.speedX +
            sin(
                frameCount * 0.02
            ) * 0.4;

        leaf.rotation +=
            leaf.rotationSpeed;


        if (
            leaf.y >
            height + 30
        ) {

            leaf.y = -30;

            leaf.x =
                random(width);

        }


        push();

        translate(
            leaf.x,
            leaf.y
        );

        rotate(
            leaf.rotation
        );

        fill(
            110,
            190,
            80,
            180
        );

        ellipse(
            0,
            0,
            leaf.size,
            leaf.size * 1.8
        );

        pop();

    }
}
// ============================================================
// MAIN MENU (FIXED CHIP TEXT SIZE)
// ============================================================

function drawMainMenu() {
    drawMenuBackground();
    logoBounce += 0.04;

    // ========================================================
    // 5 LOGO
    // ========================================================
    drawTopLogos();

    // ========================================================
    // RESPONSIVE
    // ========================================================
    let compact = height < 650;
    let veryCompact = height < 540;

    // ========================================================
    // JUDUL
    // ========================================================
    let titleY;
    if (veryCompact) {
        titleY = height * 0.17; 
    } else if (compact) {
        titleY = height * 0.21; 
    } else {
        titleY = height * 0.235; 
    }

    let titleSize = min(82, width * 0.105, height * 0.12);
    let bounce = sin(logoBounce) * 4;

    push();
    translate(width / 2, titleY + bounce);
    textAlign(CENTER, CENTER);
    textFont("Luckiest Guy");

    // TITLE
    textSize(titleSize);
    stroke(20, 10, 5);
    strokeWeight(max(5, titleSize * 0.13));
    fill(255, 205, 20);
    text("NUMBER CHASE", 0, 0);

    // SUBTITLE
    stroke(20, 10, 5, 220);
    strokeWeight(3);
    fill(255, 255, 225);
    textSize(max(17, titleSize * 0.29));
    text("MATA PELAJARAN MATEMATIKA", 0, titleSize * 0.70);

    // MATERI
    fill(205, 255, 205);
    stroke(10, 30, 10, 190);
    strokeWeight(2);
    textSize(max(16, titleSize * 0.23));
    text("FASE A • KELAS 2", 0, titleSize * 1.05);
    pop();

    // ========================================================
    // 3 HIGH SCORE - KIRI ATAS
    // ========================================================
    let hsW = min(150, max(125, width * 0.11));
    let hsH = compact ? 50 : 56;
    let hsGap = compact ? 6 : 8;
    let hsX = 20;
    let hsY = compact ? 105 : 120;

    push();
    fill(255, 215, 0);
    stroke(80, 45, 15);
    strokeWeight(3);
    textAlign(LEFT, BOTTOM);
    textFont("Luckiest Guy");
    textSize(min(18, width * 0.02));
    text("SKOR TERTINGGIMU", hsX, hsY - 8);
    pop();

    drawCategoryHighScore(hsX, hsY, hsW, hsH, "+ PENJUMLAHAN", highScores[1] || 0, "#4CAF50");
    drawCategoryHighScore(hsX, hsY + hsH + hsGap, hsW, hsH, "- PENGURANGAN", highScores[2] || 0, "#FB8C00");
    drawCategoryHighScore(hsX, hsY + (hsH + hsGap) * 2, hsW, hsH, "+/- VARIASI", highScores[3] || 0, "#1E88E5");

    // ========================================================
    // BUTTON MENU & PANEL PETUALANGAN TENGAH
    // ========================================================
    let btnW = min(310, width * 0.38);
    if (compact) {
        btnW = min(290, width * 0.55);
    }

    let btnH = compact ? 46 : 50;
    let gap = compact ? 10 : 12;
    let totalButtonsH = btnH * 4 + gap * 3;

    let startY = max(
        titleY + titleSize * 2.0,
        height * (compact ? 0.56 : 0.54)
    );

    let maxStartY = height - totalButtonsH - 18;
    if (startY > maxStartY) {
        startY = maxStartY;
    }

    let buttonX = width / 2 - btnW / 2;
    let panelW = min(470, width * 0.58);
    
    // Sesuaikan header space agar chip yang lebih besar muat
    let headerSpace = compact ? 95 : 110; 
    let panelH = totalButtonsH + headerSpace + (compact ? 25 : 30); 
    let panelX = width / 2 - panelW / 2;
    let panelY = startY - headerSpace;

    // Bayangan panel
    noStroke();
    fill(0, 0, 0, 55);
    rect(panelX + 6, panelY + 8, panelW, panelH, 28);

    // Panel utama
    fill(39, 88, 32, 150);
    rect(panelX, panelY, panelW, panelH, 28);

    // Bingkai tipis
    noFill();
    stroke(205, 232, 135, 150);
    strokeWeight(3);
    rect(panelX + 5, panelY + 5, panelW - 10, panelH - 10, 24);

    // Judul kecil panel
    noStroke();
    fill(255, 222, 95);
    textAlign(CENTER, CENTER);
    textFont("Luckiest Guy");
    textSize(compact ? 15 : 18);
    text("JELAJAHI PETUALANGAN ANGKA", width / 2, panelY + (compact ? 25 : 30));

    // ========================================================
    // TIGA INDIKATOR KATEGORI (CHIP) - DIPERBESAR
    // ========================================================
    let chipY = panelY + (compact ? 50 : 60); 
    let chipW = min(135, panelW * 0.29); // Kotak dilebarkan agar teks muat
    let chipH = compact ? 26 : 30;       // Kotak ditinggikan
    let chipGap = 10;
    let totalChipW = chipW * 3 + chipGap * 2;
    let chipStartX = width / 2 - totalChipW / 2;
    
    let chipLabels = [" PENJUMLAHAN", "PENGURANGAN", "VARIASI"];
    let chipColors = [[76, 175, 80], [251, 140, 0], [30, 136, 229]];

    for (let i = 0; i < 3; i++) {
        let cx = chipStartX + i * (chipW + chipGap);
        fill(chipColors[i][0], chipColors[i][1], chipColors[i][2], 220);
        rect(cx, chipY, chipW, chipH, 12);
        
        fill(255);
        textFont("Fredoka One");
        // Ukuran teks dinaikkan drastis dari 7/8 menjadi 11/13
        textSize(compact ? 11 : 13); 
        text(chipLabels[i], cx + chipW / 2, chipY + chipH / 2 + 1);
    }

    // Tampilkan tombol
    drawButton(buttonX, startY, btnW, btnH, "Mainkan Game", "#4CAF50");
    drawButton(buttonX, startY + btnH + gap, btnW, btnH, "Petunjuk Penggunaan", "#66BB6A");
    drawButton(buttonX, startY + (btnH + gap) * 2, btnW, btnH, "Tentang Game", "#689F38");
    drawButton(buttonX, startY + (btnH + gap) * 3, btnW, btnH, "Profil Pengembang", "#558B2F");
}
// ============================================================
// HIGH SCORE CARD PER KATEGORI
// ============================================================

function drawCategoryHighScore(
    x,
    y,
    w,
    h,
    label,
    value,
    categoryColor
) {

    push();

    // Shadow
    noStroke();
    fill(0, 0, 0, 105);
    rect(x + 4, y + 6, w, h, 13);

    // Outer card
    fill(70, 45, 18);
    rect(x, y, w, h, 13);

    // Category accent
    fill(categoryColor);
    rect(x + 3, y + 3, w - 6, 8, 8, 8, 0, 0);

    // Inner card
    fill(48, 29, 14);
    rect(x + 5, y + 10, w - 10, h - 15, 9);

    textAlign(CENTER, CENTER);
    textFont("Fredoka One");

    fill(255, 220, 90);
    textSize(min(11, w * 0.075));
    text(label, x + w / 2, y + h * 0.34);

    fill(255);
    textFont("Luckiest Guy");
    textSize(min(25, w * 0.17));
    text(value, x + w / 2, y + h * 0.70);

    pop();
}


// ============================================================
// 5 LOGO
// ============================================================

function drawTopLogos() {

    let n = 5;


    let d =
        min(
            68,
            max(
                48,
                width * 0.055
            )
        );


    let gap =
        max(
            8,
            d * 0.18
        );


    let totalW =
        n * d +
        (n - 1) * gap;


    let startX =
        width / 2 -
        totalW / 2 +
        d / 2;


    let y;


    if (height < 540) {

        y = 30;

    } else if (height < 650) {

        y = 34;

    } else {

        y = 42;

    }


    for (
        let i = 0;
        i < n;
        i++
    ) {

        let x =
            startX +
            i * (d + gap);


        push();

        translate(
            x,
            y
        );


        // Shadow

        noStroke();

        fill(
            0,
            0,
            0,
            100
        );

        ellipse(
            4,
            6,
            d + 4,
            d + 4
        );


        // Outer ring

        fill(
            255,
            215,
            0
        );

        stroke(
            80,
            45,
            10
        );

        strokeWeight(2);

        ellipse(
            0,
            0,
            d + 6,
            d + 6
        );


        // Inner white

        noStroke();

        fill(
            255,
            255,
            255,
            245
        );

        ellipse(
            0,
            0,
            d - 2,
            d - 2
        );


        // Logo

        if (logoImages[i]) {

            push();

            let clipSize =
                d - 10;

            drawingContext.save();

            drawingContext.beginPath();

            drawingContext.arc(
                0,
                0,
                clipSize / 2,
                0,
                TWO_PI
            );

            drawingContext.clip();

            imageMode(CENTER);

            image(
                logoImages[i],
                0,
                0,
                clipSize,
                clipSize
            );

            drawingContext.restore();

            pop();

        } else {

            noStroke();

            fill(
                140,
                105,
                55
            );

            textFont(
                "Fredoka One"
            );

            textSize(
                d * 0.38
            );

            text(
                i + 1,
                0,
                0
            );

        }

        pop();

    }
}


// ============================================================
// BUTTON
// ============================================================

function drawButton(
    x,
    y,
    w,
    h,
    label,
    mainColor
) {

    let hover =
        mouseX >= x &&
        mouseX <= x + w &&
        mouseY >= y &&
        mouseY <= y + h;


    push();


    if (hover) {

        cursor(HAND);

        y -= 3;

    }


    noStroke();

    fill(
        0,
        0,
        0,
        100
    );

    rect(
        x + 4,
        y + 7,
        w,
        h,
        14
    );


    fill(
        50,
        30,
        10
    );

    rect(
        x,
        y + 5,
        w,
        h,
        14
    );


    fill(mainColor);

    rect(
        x + 4,
        y,
        w - 8,
        h - 7,
        12
    );


    fill(
        255,
        255,
        255,
        hover ? 80 : 40
    );

    rect(
        x + 8,
        y + 5,
        w - 16,
        17,
        8
    );


    textFont(
        "Fredoka One",
        "sans-serif"
    );

    textSize(
        min(
            20,
            w * 0.075
        )
    );


    fill(
        0,
        0,
        0,
        130
    );

    text(
        label,
        x + w / 2 + 2,
        y + h / 2 + 3
    );


    fill(255);

    text(
        label,
        x + w / 2,
        y + h / 2
    );

    pop();
}


// ============================================================
// TEXT BLOCK
// ============================================================

function drawTextBlock(
    lines,
    x,
    yStart,
    lineHeight,
    size
) {

    push();

    textAlign(
        CENTER,
        TOP
    );

    textFont(
        "Fredoka One"
    );

    textSize(size);


    for (
        let i = 0;
        i < lines.length;
        i++
    ) {

        text(
            lines[i],
            x,
            yStart +
            i * lineHeight
        );

    }

    pop();
}


// ============================================================
// PANEL
// ============================================================

function drawPanel(
    x,
    y,
    w,
    h
) {

    noStroke();

    fill(
        0,
        0,
        0,
        100
    );

    rect(
        x + 6,
        y + 8,
        w,
        h,
        22
    );


    fill(
        30,
        25,
        15,
        245
    );

    stroke(
        130,
        90,
        40
    );

    strokeWeight(4);

    rect(
        x,
        y,
        w,
        h,
        22
    );


    noStroke();

    fill(
        255,
        255,
        255,
        20
    );

    rect(
        x + 7,
        y + 7,
        w - 14,
        35,
        15
    );
}


// ============================================================
// PETUNJUK
// ============================================================

function drawHowToPlay() {

    drawMenuBackground();


    let lines = [

        "1. Pilih kategori Penjumlahan (+), Pengurangan (-)",

        "   atau Variasi (+/-).",

        "",

        "2. Tingkat kesulitan memengaruhi batas waktu!",

        "   Kura-Kura : Satuan - Satuan (11 Detik)",

        "   Kelinci   : Satuan & Puluhan (9 Detik)",

        "   Kuda      : Puluhan - Puluhan (7 Detik)",

        "",

        "3. Pindah ke jalur dengan jawaban benar sebelum",

        "   WAKTU HABIS (saat gerbang mengenai karaktermu).",

        "",

        "4. Jawaban benar : +10 poin",

        "   Jawaban salah : 0 poin & -1 nyawa",

        "",

        "5. Setiap level berisi 10 soal, bertahanlah",

        "   sampai soal terakhir untuk mendapat bintang!"

    ];


    let fontSize =
        min(
            13,
            width * 0.026
        );

    let lineHeight =
        fontSize * 1.5;

    let titleGap = 70;

    let bottomGap = 65;

    let contentHeight =
        lines.length *
        lineHeight;


    let h =
        min(
            titleGap +
            contentHeight +
            bottomGap,
            height * 0.94
        );


    let w =
        min(
            640,
            width * 0.9
        );


    let x =
        width / 2 -
        w / 2;

    let y =
        height / 2 -
        h / 2;


    drawPanel(
        x,
        y,
        w,
        h
    );


    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(
        min(
            32,
            w * 0.06
        )
    );

    text(
        "PETUNJUK GAME",
        width / 2,
        y + 40
    );


    fill(255);

    drawTextBlock(
        lines,
        width / 2,
        y + titleGap,
        lineHeight,
        fontSize
    );


    drawButton(
        width / 2 - 105,
        y + h - 52,
        210,
        42,
        "Menu Utama",
        "#D32F2F"
    );
}


// ============================================================
// CATEGORY SELECT
// ============================================================

function drawCategorySelect() {

    drawMenuBackground();


    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(
        min(
            45,
            width * 0.08
        )
    );

    text(
        "PILIH KATEGORI",
        width / 2,
        height * 0.13
    );


    let w =
        min(
            400,
            width * 0.78
        );

    let startY =
        height * 0.25;

    let gap = 75;


    drawButton(
        width / 2 - w / 2,
        startY,
        w,
        65,
        "PENJUMLAHAN (+)",
        "#43A047"
    );


    drawButton(
        width / 2 - w / 2,
        startY + gap,
        w,
        65,
        "PENGURANGAN (-)",
        "#FB8C00"
    );


    drawButton(
        width / 2 - w / 2,
        startY + gap * 2,
        w,
        65,
        "VARIASI (+/-)",
        "#1E88E5"
    );


    drawButton(
        width / 2 - 105,
        height * 0.82,
        210,
        45,
        "Menu Utama",
        "#D32F2F"
    );
}


// ============================================================
// LEVEL SELECT
// ============================================================

function drawLevelSelect() {

    drawMenuBackground();


    let catName =
        "PENJUMLAHAN";

    if (
        selectedCategory === 2
    ) {

        catName =
            "PENGURANGAN";

    }

    if (
        selectedCategory === 3
    ) {

        catName =
            "VARIASI";

    }


    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(
        min(
            38,
            width * 0.07
        )
    );

    text(
        "KATEGORI " +
        catName,
        width / 2,
        height * 0.13
    );


    fill(255);

    textFont(
        "Fredoka One"
    );

    textSize(16);

    text(
        "Pilih tingkat kesulitan",
        width / 2,
        height * 0.20
    );


    let w =
        min(
            380,
            width * 0.76
        );

    let startY =
        height * 0.29;

    let gap = 80;


    drawButton(
        width / 2 - w / 2,
        startY,
        w,
        60,
        "LEVEL 1 - KURA-KURA",
        "#4CAF50"
    );


    drawButton(
        width / 2 - w / 2,
        startY + gap,
        w,
        60,
        "LEVEL 2 - KELINCI",
        "#FF9800"
    );


    drawButton(
        width / 2 - w / 2,
        startY + gap * 2,
        w,
        60,
        "LEVEL 3 - KUDA",
        "#F44336"
    );


    drawButton(
        width / 2 - 105,
        height * 0.82,
        210,
        45,
        "Kembali",
        "#757575"
    );
}
// ============================================================
// ABOUT (FIXED RESPONSIVE - UKURAN PAS & ANTI LUBER)
// ============================================================

function drawAbout() {
    drawMenuBackground();

    // Panel responsif
    let w = min(720, width * 0.90);
    let h = min(580, height * 0.85);
    let x = width / 2 - w / 2;
    let y = height / 2 - h / 2;

    drawPanel(x, y, w, h);

    // Judul utama panel
    fill(255, 215, 0);
    textFont("Luckiest Guy");
    textAlign(CENTER, CENTER);
    textSize(min(36, w * 0.06));
    text("TENTANG GAME", width / 2, y + 42);

    // Indikator slide
    fill(255, 255, 255, 210);
    textFont("Fredoka One");
    textSize(min(16, w * 0.026));
    text(
        aboutSlide === 0
            ? "SLIDE 1 • PENJELASAN GAME"
            : "SLIDE 2 • CAPAIAN & TUJUAN PEMBELAJARAN",
        width / 2,
        y + 76
    );

    // Area isi (Inner Card)
    let cardX = x + 35;
    let cardY = y + 104;
    let cardW = w - 70;
    let cardH = h - 184;

    fill(38, 28, 17, 235);
    stroke(218, 170, 0);
    strokeWeight(2.5);
    rect(cardX, cardY, cardW, cardH, 18);
    noStroke();

    if (aboutSlide === 0) {
        // ==========================================
        // SLIDE 1
        // ==========================================
        fill(255, 215, 0);
        textFont("Luckiest Guy");
        textSize(min(24, cardW * 0.048)); 
        text("NUMBER CHASE - NATURE MATH ADVENTURE", width / 2, cardY + 36); // Posisi judul dinaikkan sedikit

        let lines = [
            "Media Pembelajaran Interaktif (MPI) untuk mapel",
            "Matematika Kelas 2 / Fase A, dengan materi",
            "penjumlahan dan pengurangan.",
            "",
            "Dikemas sebagai game lari (running game) bertema",
            "alam: siswa berlari melintasi 3 jalur dan memilih",
            "jalur dengan jawaban yang benar.",
            "",
            "Menggunakan strategi Drill and Practice agar siswa",
            "berlatih berhitung berulang dengan cara yang seru.",
            "",
            "Fitur: 3 tingkat kesulitan, efek visual & partikel,",
            "sistem nyawa, timer per soal, dan skor tertinggi."
        ];

        fill(255);
        textFont("Fredoka One");
        
        // Ukuran teks pas: Lebih besar dari versi "kecil", tapi aman dari luber
        textSize(min(15.5, cardW * 0.030)); 
        
        // KUNCI PERBAIKAN: Jarak baris dirapatkan & posisi mulai dinaikkan
        let lineH = cardH * 0.055; 
        let startY = cardY + 75;

        for (let i = 0; i < lines.length; i++) {
            text(lines[i], width / 2, startY + i * lineH);
        }

    } else {
        // ==========================================
        // SLIDE 2: CP & TP
        // ==========================================
        fill(255, 215, 0);
        textFont("Luckiest Guy");
        textSize(min(25, cardW * 0.048)); 
        text("CAPAIAN & TUJUAN PEMBELAJARAN", width / 2, cardY + 34);

        let cpBoxY = cardY + 58;
        let cpBoxH = cardH * 0.35; 
        let tpBoxY = cpBoxY + cpBoxH + 15;
        let tpBoxH = cardH - cpBoxH - 88; 

        // Box CP
        fill(92, 150, 64, 180);
        rect(cardX + 15, cpBoxY, cardW - 30, cpBoxH, 14);
        
        fill(255, 215, 0);
        textFont("Luckiest Guy");
        textSize(min(21, cardW * 0.042)); 
        text("CAPAIAN PEMBELAJARAN (CP)", width / 2, cpBoxY + 25);

        fill(255);
        textFont("Fredoka One");
        textSize(min(16, cardW * 0.032)); 
        text("Peserta didik dapat menunjukkan pemahaman operasi\npenjumlahan dan pengurangan bilangan cacah 1 sampai 20.", width / 2, cpBoxY + cpBoxH / 2 + 12);

        // Box TP
        fill(67, 120, 170, 180);
        rect(cardX + 15, tpBoxY, cardW - 30, tpBoxH, 14);
        
        fill(255, 215, 0);
        textFont("Luckiest Guy");
        textSize(min(21, cardW * 0.042)); 
        text("TUJUAN PEMBELAJARAN (TP)", width / 2, tpBoxY + 25);

        fill(255);
        textFont("Fredoka One");
        textAlign(LEFT, CENTER);
        textSize(min(15, cardW * 0.029)); 

        let tpLines = [
            "1. Mengoperasikan konsep penjumlahan dan pengurangan bilangan satuan-satuan.",
            "2. Mengoperasikan konsep penjumlahan dan pengurangan bilangan satuan-puluhan.",
            "3. Mengoperasikan konsep penjumlahan dan pengurangan bilangan puluhan-puluhan."
        ];
        
        let tx = cardX + 28;
        let stepY = (tpBoxH - 45) / 3; 

        for (let i = 0; i < tpLines.length; i++) {
            let naturalW = textWidth(tpLines[i]);
            let maxW = cardW - 56;
            let sx = min(1, maxW / naturalW);
            
            push();
            translate(tx, tpBoxY + 45 + (i * stepY));
            scale(sx, 1); 
            text(tpLines[i], 0, 0);
            pop();
        }
        textAlign(CENTER, CENTER);
    }

    // Tombol Navigasi
    let btnH = 46;
    let btnW = min(190, w * 0.27);
    let menuW = min(200, w * 0.29);
    let bottomY = y + h - btnH - 22; 

    drawButton(x + 30, bottomY, menuW, btnH, "Menu Utama", "#D32F2F");

    if (aboutSlide === 0) {
        drawButton(x + w - btnW - 30, bottomY, btnW, btnH, "Berikutnya  ›", "#388E3C");
    } else {
        drawButton(x + w - btnW - 30, bottomY, btnW, btnH, "‹  Sebelumnya", "#388E3C");
    }
}
// ============================================================
// PROFIL PENGEMBANG
// ============================================================

function drawProfile() {

    drawMenuBackground();


    let w = min(940, width * 0.94);
    let h = min(700, height * 0.95);

    let x = width / 2 - w / 2;
    let y = height / 2 - h / 2;

    drawPanel(x, y, w, h);


    // ========================================================
    // JUDUL
    // ========================================================

    fill(255, 215, 0);
    textFont("Luckiest Guy");
    textAlign(CENTER, CENTER);
    textSize(min(34, w * 0.05));

    text("PROFIL PENGEMBANG", width / 2, y + 38);


    // ========================================================
    // SUBJUDUL
    // ========================================================

    fill(255, 255, 255, 225);
    textFont("Fredoka One");
    textSize(min(13, w * 0.02));

    text("NUMBER CHASE - Multimedia Pembelajaran Interaktif", width / 2, y + 64);
    text("Matematika Kelas II / Fase A", width / 2, y + 81);


    // ========================================================
    // SECTION LABEL - TIM PENGEMBANG
    // ========================================================

    let sec1LabelY = y + 104;

    drawSectionLabel("TIM PENGEMBANG", width / 2, sec1LabelY, w);


    // ========================================================
    // CARD PENGEMBANG (besar)
    // ========================================================

    let cardGap = 24;

    let cardW = min(260, (w - 80 - cardGap * 2) / 3);
    let cardH = min(300, h * 0.44);

    let totalCardsW = cardW * 3 + cardGap * 2;
    let startX = width / 2 - totalCardsW / 2 + cardW / 2;

    let cardY = sec1LabelY + 22 + cardH / 2;


    for (let i = 0; i < 3; i++) {

        let cx = startX + i * (cardW + cardGap);

        push();
        translate(cx, cardY);


        // CARD SHADOW
        noStroke();
        fill(0, 0, 0, 90);
        rect(-cardW / 2 + 5, -cardH / 2 + 7, cardW, cardH, 18);


        // CARD
        fill(45, 38, 25, 235);
        rect(-cardW / 2, -cardH / 2, cardW, cardH, 18);


        // HIGHLIGHT
        fill(255, 255, 255, 18);
        rect(-cardW / 2 + 3, -cardH / 2 + 3, cardW - 6, 40, 15, 15, 5, 5);


        // FOTO
        let photoD = min(160, cardW * 0.66, cardH * 0.52);

        let photoY = -cardH / 2 + photoD / 2 + 20;

        noStroke();
        fill(0, 0, 0, 100);
        ellipse(4, photoY + 5, photoD + 8, photoD + 8);

        fill(255, 215, 0);
        stroke(70, 45, 15);
        strokeWeight(3);
        ellipse(0, photoY, photoD + 7, photoD + 7);

        fill(255);
        noStroke();
        ellipse(0, photoY, photoD - 1, photoD - 1);


        if (devImages[i]) {

            let clipD = photoD - 9;

            push();
            drawingContext.save();
            drawingContext.beginPath();
            drawingContext.arc(0, photoY, clipD / 2, 0, TWO_PI);
            drawingContext.clip();

            imageMode(CENTER);

            let img = devImages[i];
            let imgRatio = img.width / img.height;
            let targetSize = clipD;
            let drawW = targetSize;
            let drawH = targetSize;

            if (imgRatio > 1) {
                drawW = targetSize * imgRatio;
            } else {
                drawH = targetSize / imgRatio;
            }

            image(img, 0, photoY, drawW, drawH);

            drawingContext.restore();
            pop();

        } else {

            fill(70, 55, 35);
            noStroke();
            ellipse(0, photoY, photoD - 9, photoD - 9);

            fill(255, 225, 130);
            textFont("Fredoka One");
            textSize(min(20, photoD * 0.16));

            text("FOTO", 0, photoY - 10);
            text(i + 1, 0, photoY + 18);

        }


        // NAMA
        let textStartY = photoY + photoD / 2 + 26;

        fill(255, 225, 135);
        textFont("Fredoka One");
        textSize(min(16, cardW * 0.082));

        text(developers[i].name, 0, textStartY);


        // GARIS
        stroke(255, 255, 255, 45);
        strokeWeight(2);
        line(-cardW * 0.35, textStartY + 17, cardW * 0.35, textStartY + 17);
        noStroke();


        // NIM
        fill(255, 255, 255, 225);
        textFont("Fredoka One");
        textSize(min(12, cardW * 0.062));

        text(developers[i].nim, 0, textStartY + 34);


        // UNIVERSITAS
        fill(255, 255, 255, 190);
        textFont("Fredoka One");
        textSize(min(11, cardW * 0.056));

        let university = developers[i].univ;
        let line1 = "";
        let line2 = "";

        if (university === "Universitas Lambung Mangkurat") {

            line1 = "Universitas Lambung";
            line2 = "Mangkurat";

        } else {

            let words = university.split(" ");

            for (let j = 0; j < words.length; j++) {

                let test = line1 === "" ? words[j] : line1 + " " + words[j];

                if (textWidth(test) < cardW - 20) {
                    line1 = test;
                } else {
                    line2 = line2 === "" ? words[j] : line2 + " " + words[j];
                }

            }

        }

        text(line1, 0, textStartY + 53);

        if (line2 !== "") {
            text(line2, 0, textStartY + 68);
        }


        pop();

    }


    // ========================================================
    // SECTION LABEL - DOSEN PEMBIMBING
    // ========================================================

    let cardsBottom = cardY + cardH / 2;

    let sec2LabelY = cardsBottom + 26;

    drawSectionLabel("DOSEN PEMBIMBING", width / 2, sec2LabelY, w);


    // ========================================================
    // KARTU DOSEN PEMBIMBING (besar)
    // ========================================================

    let pembCardW = min(560, w * 0.72);
    let pembCardH = min(118, h * 0.175);

    let pembCardTop = sec2LabelY + 16;
    let pembCardCY = pembCardTop + pembCardH / 2;

    push();
    translate(width / 2, pembCardCY);

    // SHADOW
    noStroke();
    fill(0, 0, 0, 90);
    rect(-pembCardW / 2 + 5, -pembCardH / 2 + 6, pembCardW, pembCardH, 18);

    // CARD BASE
    fill(55, 42, 20, 240);
    rect(-pembCardW / 2, -pembCardH / 2, pembCardW, pembCardH, 18);

    // GOLD BORDER (menandai kartu ini istimewa / pembimbing)
    noFill();
    stroke(255, 215, 0, 200);
    strokeWeight(2.5);
    rect(-pembCardW / 2, -pembCardH / 2, pembCardW, pembCardH, 18);
    noStroke();

    // HIGHLIGHT ATAS
    fill(255, 255, 255, 18);
    rect(-pembCardW / 2 + 3, -pembCardH / 2 + 3, pembCardW - 6, pembCardH * 0.34, 15, 15, 5, 5);


    // FOTO PEMBIMBING
    let pPhotoD = min(94, pembCardH - 18);
    let pPhotoX = -pembCardW / 2 + 22 + pPhotoD / 2;

    noStroke();
    fill(0, 0, 0, 100);
    ellipse(pPhotoX + 3, 4, pPhotoD + 8, pPhotoD + 8);

    fill(255, 215, 0);
    stroke(70, 45, 15);
    strokeWeight(3);
    ellipse(pPhotoX, 0, pPhotoD + 7, pPhotoD + 7);

    fill(255);
    noStroke();
    ellipse(pPhotoX, 0, pPhotoD - 1, pPhotoD - 1);

    if (imgPembimbing) {

        let clipD = pPhotoD - 9;

        push();
        drawingContext.save();
        drawingContext.beginPath();
        drawingContext.arc(pPhotoX, 0, clipD / 2, 0, TWO_PI);
        drawingContext.clip();

        imageMode(CENTER);

        let img = imgPembimbing;
        let imgRatio = img.width / img.height;
        let targetSize = clipD;
        let drawW = targetSize;
        let drawH = targetSize;

        if (imgRatio > 1) {
            drawW = targetSize * imgRatio;
        } else {
            drawH = targetSize / imgRatio;
        }

        image(img, pPhotoX, 0, drawW, drawH);

        drawingContext.restore();
        pop();

    } else {

        fill(70, 55, 35);
        noStroke();
        ellipse(pPhotoX, 0, pPhotoD - 9, pPhotoD - 9);

        fill(255, 225, 130);
        textFont("Fredoka One");
        textAlign(CENTER, CENTER);
        textSize(min(16, pPhotoD * 0.18));

        text("FOTO", pPhotoX, 0);

    }


    // TEKS PEMBIMBING (rata kiri di sebelah foto)

    let pTextX = pPhotoX + pPhotoD / 2 + 22;

    textAlign(LEFT, CENTER);

    fill(255, 225, 135);
    textFont("Fredoka One");
    textSize(min(20, pembCardW * 0.042));
    text(pembimbing.name, pTextX, -pembCardH * 0.26);

    fill(255, 215, 0, 220);
    textFont("Fredoka One");
    textSize(min(13, pembCardW * 0.028));
    text("Dosen Pembimbing", pTextX, -pembCardH * 0.26 + 23);

    fill(255, 255, 255, 210);
    textFont("Fredoka One");
    textSize(min(12.5, pembCardW * 0.026));
    text(pembimbing.nip, pTextX, -pembCardH * 0.26 + 44);

    if (pembCardH > 95) {
        text(pembimbing.univ, pTextX, -pembCardH * 0.26 + 64);
    }

    textAlign(CENTER, CENTER);

    pop();


    // ========================================================
    // BUTTON MENU
    // ========================================================

    drawButton(
        width / 2 - 115,
        y + h - 46,
        230,
        44,
        "Menu Utama",
        "#D32F2F"
    );
}


// ------------------------------------------------------------
// LABEL SEKSI (dengan garis dekoratif di kiri/kanan)
// ------------------------------------------------------------

function drawSectionLabel(label, cx, cy, panelW) {

    push();

    textFont("Fredoka One");
    textAlign(CENTER, CENTER);

    let ts = min(13, panelW * 0.022);
    textSize(ts);

    let labelW = textWidth(label);

    fill(255, 215, 0, 235);
    noStroke();
    text(label, cx, cy);

    let lineGap = 14;
    let lineLen = min(90, panelW * 0.14);

    stroke(255, 215, 0, 130);
    strokeWeight(1.5);

    line(cx - labelW / 2 - lineGap - lineLen, cy, cx - labelW / 2 - lineGap, cy);
    line(cx + labelW / 2 + lineGap, cy, cx + labelW / 2 + lineGap + lineLen, cy);

    noStroke();

    pop();
}



// ------------------------------------------------------------
// LABEL SEKSI (dengan garis dekoratif di kiri/kanan)
// ------------------------------------------------------------

function drawSectionLabel(label, cx, cy, panelW) {

    push();

    textFont("Fredoka One");
    textAlign(CENTER, CENTER);

    let ts = min(13, panelW * 0.022);
    textSize(ts);

    let labelW = textWidth(label);

    fill(255, 215, 0, 235);
    noStroke();
    text(label, cx, cy);

    let lineGap = 14;
    let lineLen = min(90, panelW * 0.14);

    stroke(255, 215, 0, 130);
    strokeWeight(1.5);

    line(cx - labelW / 2 - lineGap - lineLen, cy, cx - labelW / 2 - lineGap, cy);
    line(cx + labelW / 2 + lineGap, cy, cx + labelW / 2 + lineGap + lineLen, cy);

    noStroke();

    pop();
}



// ============================================================
// SOAL MATEMATIKA
// ============================================================

function generateOptions(
    correctAnswer
) {

    let options = [
        correctAnswer
    ];

    let candidates = [];


    let minVal =
        max(
            1,
            correctAnswer - 15
        );

    let maxVal =
        correctAnswer + 15;


    for (
        let n = minVal;
        n <= maxVal;
        n++
    ) {

        if (
            n !== correctAnswer &&
            n > 0
        ) {

            candidates.push(n);

        }

    }


    let near =
        candidates.filter(
            n =>
                abs(
                    n -
                    correctAnswer
                ) <= 5
        );


    if (
        near.length < 2
    ) {

        near =
            candidates;

    }


    while (
        options.length < 3 &&
        near.length > 0
    ) {

        let index =
            floor(
                random(
                    near.length
                )
            );


        let value =
            near.splice(
                index,
                1
            )[0];


        if (
            !options.includes(value)
        ) {

            options.push(value);

        }

    }


    for (
        let i =
            options.length - 1;
        i > 0;
        i--
    ) {

        let j =
            floor(
                random(
                    i + 1
                )
            );


        let temp =
            options[i];

        options[i] =
            options[j];

        options[j] =
            temp;

    }


    return options;
}


function makeQuestion(
    a,
    b,
    operator
) {

    let answer;


    if (
        operator === "+"
    ) {

        answer =
            a + b;

    } else {

        answer =
            a - b;

    }


    return {

        text:
            a +
            " " +
            operator +
            " " +
            b +
            " = ?",

        answer:
            answer,

        options:
            generateOptions(answer)

    };
}


function generateQuestions(
    category,
    level
) {

    let list = [];


    for (
        let i = 0;
        i < 10;
        i++
    ) {

        let a;
        let b;
        let operator;


        if (
            category === 1
        ) {

            operator = "+";

        } else if (
            category === 2
        ) {

            operator = "-";

        } else {

            operator =
                random() < 0.5
                    ? "+"
                    : "-";

        }


        if (
            operator === "+"
        ) {

            if (
                level === 1
            ) {

                a =
                    floor(
                        random(
                            1,
                            10
                        )
                    );

                b =
                    floor(
                        random(
                            1,
                            10
                        )
                    );


                while (
                    a + b > 20
                ) {

                    a =
                        floor(
                            random(
                                1,
                                10
                            )
                        );

                    b =
                        floor(
                            random(
                                1,
                                10
                            )
                        );

                }

            } else if (
                level === 2
            ) {

                a =
                    floor(
                        random(
                            1,
                            10
                        )
                    );

                b =
                    floor(
                        random(
                            10,
                            20
                        )
                    );


                while (
                    a + b > 20
                ) {

                    a =
                        floor(
                            random(
                                1,
                                10
                            )
                        );

                    b =
                        floor(
                            random(
                                10,
                                20
                            )
                        );

                }

            } else {

                a =
                    floor(
                        random(
                            10,
                            50
                        )
                    );

                b =
                    floor(
                        random(
                            10,
                            50
                        )
                    );

            }

        } else {

            if (
                level === 1
            ) {

                a =
                    floor(
                        random(
                            2,
                            10
                        )
                    );

                b =
                    floor(
                        random(
                            1,
                            a
                        )
                    );

            } else if (
                level === 2
            ) {

                a =
                    floor(
                        random(
                            10,
                            21
                        )
                    );

                b =
                    floor(
                        random(
                            1,
                            10
                        )
                    );


                while (
                    a - b < 1
                ) {

                    a =
                        floor(
                            random(
                                10,
                                21
                            )
                        );

                    b =
                        floor(
                            random(
                                1,
                                10
                            )
                        );

                }

            } else {

                a =
                    floor(
                        random(
                            20,
                            100
                        )
                    );

                b =
                    floor(
                        random(
                            10,
                            a
                        )
                    );

            }

        }


        list.push(
            makeQuestion(
                a,
                b,
                operator
            )
        );

    }


    return list;
}


// ============================================================
// START LEVEL
// ============================================================

function startLevel(
    category,
    level
) {

    initAudio();

    currentCategory =
        category;

    // Gunakan High Score khusus kategori yang dipilih.
    highScore =
        highScores[currentCategory] || 0;

    currentLevel =
        level;


    if (
        currentLevel === 1
    ) {

        questionTimeMax =
            11;

    } else if (
        currentLevel === 2
    ) {

        questionTimeMax =
            9;

    } else {

        questionTimeMax =
            7;

    }


    score = 0;

    lives = 3;

    isNewHighScore = false;

    questionIndex = 0;

    correctStreak = 0;

    particles = [];

    scorePopups = [];

    confetti = [];

    isPaused = false;

    playerLane = 1;

    roadOffset = 0;


    currentQuestionList =
        generateQuestions(
            currentCategory,
            currentLevel
        );


    currentQuestion =
        currentQuestionList[0];


    playerY =
        height * 0.78;

    updatePlayerPosition();

    playerX =
        playerTargetX;


    resetGates();

    // Pastikan BGM MENU berhenti sebelum masuk gameplay.
    stopAllMusic();

    currentScene =
        "GAMEPLAY";

    // Mulai BGM khusus gameplay.
    playGameplayMusic();
}


// ============================================================
// TRACK
// ============================================================

function getTrackWidth() {

    return min(
        720,
        width * 0.72
    );

}


function getTrackX() {

    let trackW =
        getTrackWidth();

    return (
        width / 2 -
        trackW / 2
    );

}


// ============================================================
// GAMEPLAY
// ============================================================

function drawGameplay() {

    push();


    if (
        hitEffectTimer > 0
    ) {

        translate(
            random(-4, 4),
            random(-4, 4)
        );


        if (!isPaused) {

            hitEffectTimer--;

        }

    }


    if (!isPaused) {

        updateGameMovement();

    }


    draw2DTrack();

    drawAnswerGates();

    drawPlayer();

    drawParticles();

    drawScorePopups();

    drawGameplayHUD();

    pop();


    if (
        !isPaused &&
        gateActive &&
        questionTimeLeft <= 0 &&
        !gateHitChecked
    ) {

        gateHitChecked = true;

        checkAnswer();

    }
}


// ============================================================
// MOVEMENT
// ============================================================

function updateGameMovement() {

    let dt =
        min(
            deltaTime,
            50
        ) / 1000;


    questionTimeLeft -= dt;


    if (
        questionTimeLeft <= 0
    ) {

        questionTimeLeft = 0;

    }


    if (
        currentLevel === 1
    ) {

        roadSpeed = 4;

    } else if (
        currentLevel === 2
    ) {

        roadSpeed = 5.5;

    } else {

        roadSpeed = 7;

    }


    roadOffset +=
        roadSpeed;


    roadOffset %=
        70;


    gatesY =
        map(
            questionTimeLeft,
            questionTimeMax,
            0,
            -350,
            playerY - 30
        );
}


// ============================================================
// TRACK DRAWING
// ============================================================

function draw2DTrack() {

    background(
        126,
        201,
        82
    );

    noStroke();


    for (
        let i = 0;
        i < 35;
        i++
    ) {

        let gx =
            (i * 173) %
            width;

        let gy =
            (
                i * 97 +
                roadOffset * 0.5
            ) % height;


        fill(
            105,
            180,
            70,
            100
        );

        ellipse(
            gx,
            gy,
            5,
            3
        );

    }


    let trackW =
        getTrackWidth();

    let trackX =
        getTrackX();


    fill(
        0,
        0,
        0,
        35
    );

    rect(
        trackX - 12,
        0,
        trackW + 24,
        height
    );


    fill(
        218,
        189,
        132
    );

    rect(
        trackX,
        0,
        trackW,
        height
    );


    fill(
        91,
        166,
        62
    );

    rect(
        trackX - 13,
        0,
        13,
        height
    );

    rect(
        trackX + trackW,
        0,
        13,
        height
    );


    laneWidth =
        trackW / 3;


    for (
        let i = 1;
        i < 3;
        i++
    ) {

        let x =
            trackX +
            laneWidth * i;


        stroke(
            255,
            246,
            195
        );

        strokeWeight(5);


        for (
            let y =
                -100 + roadOffset;
            y < height + 100;
            y += 70
        ) {

            line(
                x,
                y,
                x,
                y + 32
            );

        }

    }


    noStroke();

    drawMovingScenery();


    fill(
        255,
        255,
        255,
        100
    );

    rect(
        trackX,
        height * 0.91,
        trackW,
        5
    );
}


// ============================================================
// SCENERY
// ============================================================
function createScenery() {
    scenery = [];
    
    // ySpacing diperbesar dari 65 menjadi 150 agar pohon lebih renggang
    let ySpacing = 150; 
    let sides = [-1, 1];

    for (let s = 0; s < sides.length; s++) {
        let side = sides[s];
        
        for (let baseY = -200; baseY < height + 250; baseY += ySpacing) {
            
            // LAPISAN 1: Pinggir Jalan (Agak dijauhkan dari trek)
            scenery.push({
                side: side,
                y: baseY + random(-30, 30),
                type: floor(random(6)), 
                size: random(0.6, 0.9), // Ukuran sedikit dikecilkan
                offset: random(40, 75), // Jarak ke tengah dijauhkan
                phase: random(TWO_PI),
                swaySpeed: random(0.02, 0.045)
            });

            // LAPISAN 2: Tengah
            scenery.push({
                side: side,
                y: baseY + ySpacing / 2 + random(-30, 30),
                type: floor(random(5)), 
                size: random(0.9, 1.2),
                offset: random(90, 140),
                phase: random(TWO_PI),
                swaySpeed: random(0.02, 0.04)
            });

            // LAPISAN 3: Dinding Hutan Paling Belakang
            scenery.push({
                side: side,
                y: baseY + random(-50, 50),
                type: floor(random(2)), 
                size: random(1.2, 1.6),
                offset: random(170, 260),
                phase: random(TWO_PI),
                swaySpeed: random(0.01, 0.025)
            });
        }
    }
}
function drawMovingScenery() {
    let trackW = getTrackWidth();
    let trackX = getTrackX();

    if (!isPaused) {
        sceneryTimer++;
    }

    for (let s of scenery) {
        if (!isPaused) {
            s.y += roadSpeed;
            if (s.y > height + 250) {
                s.y = -200;
            }
        }

        let x = s.side === -1
            ? trackX - s.offset
            : trackX + trackW + s.offset;

        // Batu (3) dan Jamur (5) tidak goyang ditiup angin
        let swayAngle = (s.type === 3 || s.type === 5)
            ? 0
            : sin(sceneryTimer * s.swaySpeed + s.phase) * radians(3.5);

        push();
        translate(x, s.y);
        rotate(swayAngle);
        scale(s.size);

        // Render sesuai tipe tanaman
        if (s.type === 0) {
            drawTree2D();
        } else if (s.type === 1) {
            drawBush2D();
        } else if (s.type === 2) {
            drawFlowers2D();
        } else if (s.type === 3) {
            drawRock2D();
        } else if (s.type === 4) {
            drawFern2D();
        } else {
            drawMushroom2D();
        }

        pop();
    }
}

function drawTree2D() {
    noStroke();
    fill(0, 0, 0, 30);
    ellipse(0, 35, 70, 22);
    fill(120, 75, 40);
    rect(-9, -12, 18, 50, 5);
    fill(45, 142, 63);
    ellipse(0, -45, 75, 70);
    ellipse(-27, -20, 55, 50);
    ellipse(27, -20, 55, 50);
    fill(105, 190, 75);
    ellipse(-14, -58, 25, 22);
}

function drawBush2D() {
    noStroke();
    fill(0, 0, 0, 30);
    ellipse(0, 20, 70, 22);
    fill(38, 135, 65);
    ellipse(-25, 0, 50, 45);
    ellipse(0, -10, 60, 55);
    ellipse(27, 0, 50, 45);
}

function drawFlowers2D() {
    stroke(40, 140, 60);
    strokeWeight(4);
    line(0, 0, 0, 30);
    noStroke();
    fill(255, 100, 120);
    for (let i = 0; i < 5; i++) {
        let a = (TWO_PI / 5) * i;
        ellipse(cos(a) * 10, sin(a) * 10, 10, 10);
    }
    fill(255, 190, 30);
    ellipse(0, 0, 9, 9);
}

function drawRock2D() {
    noStroke();
    fill(0, 0, 0, 35);
    ellipse(0, 12, 55, 20);
    fill(120, 130, 120);
    ellipse(0, 0, 55, 35);
    fill(180, 185, 175, 130);
    ellipse(-10, -7, 18, 10);
}

function drawFern2D() {
    noStroke();
    fill(0, 0, 0, 30);
    ellipse(0, 15, 60, 20);
    fill(28, 105, 55); 
    ellipse(-15, -10, 45, 25);
    ellipse(15, -5, 40, 20);
    fill(40, 140, 70); 
    ellipse(0, -20, 35, 45);
    ellipse(-20, 5, 30, 20);
    ellipse(20, 5, 30, 15);
    stroke(60, 170, 90);
    strokeWeight(2);
    noFill();
    arc(0, -5, 20, 30, PI, TWO_PI);
    arc(-10, -5, 15, 15, HALF_PI, PI);
    noStroke();
}

function drawMushroom2D() {
    noStroke();
    fill(0, 0, 0, 30);
    ellipse(0, 5, 30, 12);
    fill(230, 220, 200);
    rect(-5, -10, 10, 15, 4);
    fill(210, 45, 55);
    arc(0, -8, 35, 30, PI, TWO_PI); 
    fill(255, 255, 255, 210);
    ellipse(-8, -15, 6, 6);
    ellipse(7, -13, 8, 8);
    ellipse(0, -20, 5, 5);
    ellipse(-12, -9, 4, 4);
}
// ============================================================
// ANSWER GATES
// ============================================================

function drawAnswerGates() {

    if (
        !gateActive ||
        !currentQuestion
    ) {

        return;

    }


    let trackW =
        getTrackWidth();

    let trackX =
        getTrackX();


    laneWidth =
        trackW / 3;


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        let x =
            trackX +
            laneWidth * i +
            laneWidth / 2;


        drawAnswerCard(
            x,
            gatesY,
            laneWidth - 28,
            currentQuestion.options[i],
            i
        );

    }
}


function drawAnswerCard(
    x,
    y,
    w,
    answer,
    index
) {

    let h = 105;


    push();


    let distance =
        abs(
            y -
            playerY
        );


    if (
        distance < 180
    ) {

        fill(
            255,
            240,
            100,
            map(
                distance,
                0,
                180,
                80,
                0
            )
        );

        noStroke();

        rect(
            x - w / 2 - 6,
            y - 6,
            w + 12,
            h + 12,
            22
        );

    }


    noStroke();

    fill(
        0,
        0,
        0,
        70
    );

    rect(
        x - w / 2 + 6,
        y + 8,
        w,
        h,
        18
    );


    fill(
        70,
        42,
        20
    );

    rect(
        x - w / 2,
        y,
        w,
        h,
        18
    );


    let colors = [
        "#43A047",
        "#FFB300",
        "#E53935"
    ];


    fill(
        colors[index]
    );

    rect(
        x - w / 2 + 5,
        y + 5,
        w - 10,
        h - 10,
        14
    );


    fill(
        255,
        255,
        255,
        60
    );

    rect(
        x - w / 2 + 10,
        y + 10,
        w - 20,
        25,
        10
    );


    fill(255);

    textFont(
        "Luckiest Guy"
    );

    textSize(
        min(
            48,
            w * 0.30
        )
    );


    stroke(
        0,
        0,
        0,
        110
    );

    strokeWeight(4);


    text(
        answer,
        x,
        y + 58
    );


    pop();
}


// ============================================================
// PLAYER
// ============================================================

function updatePlayerPosition() {

    let trackW =
        getTrackWidth();

    let trackX =
        getTrackX();


    laneWidth =
        trackW / 3;


    playerTargetX =
        trackX +
        laneWidth *
        playerLane +
        laneWidth / 2;
}


function drawPlayer() {

    updatePlayerPosition();


    playerX =
        lerp(
            playerX,
            playerTargetX,
            0.25
        );


    if (!isPaused) {

        runCycle += 0.20;

    }


    let bounce =
        abs(
            sin(runCycle)
        ) * 5;


    let jumpOffset = 0;


    if (
        jumpAnim > 0
    ) {

        let progress =
            (10 - jumpAnim) /
            10;


        jumpOffset =
            sin(
                progress * PI
            ) * 55;


        if (!isPaused) {

            jumpAnim--;

        }

    }


    noStroke();

    fill(
        0,
        0,
        0,
        65
    );

    ellipse(
        playerX,
        playerY + 42,
        70,
        22
    );


    let drawY =
        playerY -
        bounce -
        jumpOffset;


    if (
        currentLevel === 1
    ) {

        drawTurtle(
            playerX,
            drawY
        );

    } else if (
        currentLevel === 2
    ) {

        drawRabbit(
            playerX,
            drawY
        );

    } else {

        drawHorse(
            playerX,
            drawY
        );

    }
}


function drawTurtle(
    x,
    y
) {

    push();

    translate(
        x,
        y
    );


    if (imgTurtle) {

        image(
            imgTurtle,
            0,
            0,
            90,
            90
        );

    } else {

        drawFallbackTurtle();

    }


    pop();
}


function drawFallbackTurtle() {

    noStroke();

    fill(
        55,
        145,
        70
    );

    ellipse(
        0,
        0,
        70,
        48
    );


    fill(
        95,
        180,
        85
    );

    ellipse(
        35,
        -5,
        28,
        28
    );


    fill(30);

    ellipse(
        42,
        -10,
        4,
        4
    );


    fill(
        65,
        155,
        70
    );

    ellipse(
        -25,
        -20,
        18,
        18
    );

    ellipse(
        -25,
        20,
        18,
        18
    );

    ellipse(
        15,
        -22,
        18,
        18
    );

    ellipse(
        15,
        22,
        18,
        18
    );
}


function drawRabbit(
    x,
    y
) {

    push();

    translate(
        x,
        y
    );


    if (imgRabbit) {

        image(
            imgRabbit,
            0,
            0,
            90,
            90
        );

    } else {

        drawFallbackRabbit();

    }


    pop();
}


function drawFallbackRabbit() {

    noStroke();

    fill(
        240,
        240,
        235
    );

    ellipse(
        0,
        5,
        52,
        60
    );

    ellipse(
        0,
        -35,
        48,
        45
    );


    ellipse(
        -15,
        -70,
        15,
        45
    );

    ellipse(
        15,
        -70,
        15,
        45
    );


    fill(30);

    ellipse(
        -9,
        -38,
        5,
        5
    );

    ellipse(
        9,
        -38,
        5,
        5
    );


    fill(
        250,
        140,
        160
    );

    ellipse(
        0,
        -27,
        8,
        6
    );
}


function drawHorse(
    x,
    y
) {

    push();

    translate(
        x,
        y
    );


    if (imgHorse) {

        image(
            imgHorse,
            0,
            0,
            100,
            100
        );

    } else {

        drawFallbackHorse();

    }


    pop();
}


function drawFallbackHorse() {

    noStroke();

    fill(
        130,
        75,
        40
    );

    ellipse(
        0,
        5,
        65,
        65
    );

    ellipse(
        0,
        -45,
        45,
        55
    );


    fill(
        80,
        45,
        30
    );

    ellipse(
        0,
        -75,
        35,
        30
    );


    fill(30);

    ellipse(
        -9,
        -48,
        5,
        5
    );

    ellipse(
        9,
        -48,
        5,
        5
    );


    fill(
        90,
        45,
        25
    );

    triangle(
        -18,
        -70,
        -10,
        -100,
        -3,
        -70
    );

    triangle(
        18,
        -70,
        10,
        -100,
        3,
        -70
    );
}


// ============================================================
// GAMEPLAY HUD
// ============================================================

function drawGameplayHUD() {

    if (!currentQuestion) {

        return;

    }


    let qW =
        min(
            360,
            width * 0.55
        );

    let qX =
        width / 2 -
        qW / 2;


    fill(
        35,
        25,
        15,
        235
    );

    stroke(
        130,
        85,
        40
    );

    strokeWeight(4);


    rect(
        qX,
        15,
        qW,
        95,
        16
    );


    noStroke();

    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(
        min(
            34,
            qW * 0.095
        )
    );


    text(
        currentQuestion.text,
        width / 2,
        45
    );


    // TIMER

    let barW =
        qW * 0.85;

    let barH = 16;

    let barX =
        width / 2 -
        barW / 2;

    let barY = 75;


    fill(
        0,
        0,
        0,
        80
    );

    rect(
        barX,
        barY,
        barW,
        barH,
        8
    );


    let pct =
        max(
            0,
            questionTimeLeft /
            questionTimeMax
        );


    let fillW =
        barW * pct;


    let barCol =
        color(
            76,
            175,
            80
        );


    if (
        pct <= 0.5
    ) {

        barCol =
            color(
                255,
                152,
                0
            );

    }


    if (
        pct <= 0.25
    ) {

        barCol =
            color(
                244,
                67,
                54
            );

    }


    fill(barCol);

    rect(
        barX,
        barY,
        fillW,
        barH,
        8
    );


    


    // NYAWA

    drawHUDBox(
        18,
        15,
        145,
        45
    );


    fill(255);

    textFont(
        "Fredoka One"
    );

    textSize(20);


    let hearts =
        "♥".repeat(lives) +
        "♡".repeat(
            max(
                0,
                3 - lives
            )
        );


    text(
        hearts,
        90,
        38
    );


    // SCORE

    drawHUDBox(
        width - 163,
        15,
        145,
        45
    );


    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(21);


    text(
        "★ " + score,
        width - 90,
        38
    );


    // INFO LEVEL

    fill(
        255,
        255,
        255,
        220
    );

    textFont(
        "Fredoka One"
    );

    textSize(14);


    let catName =
        "PENJUMLAHAN";


    if (
        currentCategory === 2
    ) {

        catName =
            "PENGURANGAN";

    }


    if (
        currentCategory === 3
    ) {

        catName =
            "VARIASI";

    }


    text(
        catName +
        " • LEVEL " +
        currentLevel +
        " • SOAL " +
        (questionIndex + 1) +
        "/10",
        width / 2,
        125
    );


    // PAUSE BUTTON

    let pauseX = 20;

    let pauseY = 78;

    let pauseW = 175;

    let pauseH = 52;


    push();


    let hover =
        mouseX >= pauseX &&
        mouseX <= pauseX + pauseW &&
        mouseY >= pauseY &&
        mouseY <= pauseY + pauseH;


    if (hover) {

        cursor(HAND);

    }


    fill(
        0,
        0,
        0,
        70
    );

    noStroke();


    rect(
        pauseX + 4,
        pauseY + 5,
        pauseW,
        pauseH,
        14
    );


    fill("#FF9800");


    rect(
        pauseX,
        pauseY,
        pauseW,
        pauseH,
        14
    );


    fill(255);

    textFont(
        "Fredoka One"
    );

    textSize(20);


    text(
        isPaused
            ? "▶  LANJUT"
            : "Ⅱ  PAUSE",
        pauseX +
        pauseW / 2,
        pauseY +
        pauseH / 2
    );


    pop();


    // CONTROL

    drawControlButton(
        25,
        height - 80,
        75,
        55,
        "◀"
    );


    drawControlButton(
        width - 100,
        height - 80,
        75,
        55,
        "▶"
    );


    if (isPaused) {

        drawPauseOverlay();

    }
}


function drawHUDBox(
    x,
    y,
    w,
    h
) {

    noStroke();

    fill(
        0,
        0,
        0,
        80
    );

    rect(
        x + 3,
        y + 4,
        w,
        h,
        13
    );


    fill(
        40,
        25,
        10,
        235
    );

    rect(
        x,
        y,
        w,
        h,
        13
    );
}


function drawControlButton(
    x,
    y,
    w,
    h,
    label
) {

    push();


    let hover =
        mouseX >= x &&
        mouseX <= x + w &&
        mouseY >= y &&
        mouseY <= y + h;


    if (hover) {

        cursor(HAND);

    }


    fill(
        55,
        40,
        20,
        230
    );

    stroke(
        255,
        220,
        100
    );

    strokeWeight(3);


    rect(
        x,
        y,
        w,
        h,
        15
    );


    noStroke();

    fill(255);

    textFont(
        "Luckiest Guy"
    );

    textSize(30);


    text(
        label,
        x + w / 2,
        y + h / 2
    );


    pop();
}


// ============================================================
// PAUSE
// ============================================================

function drawPauseOverlay() {

    fill(
        0,
        0,
        0,
        165
    );

    rect(
        0,
        0,
        width,
        height
    );


    let w =
        min(
            400,
            width * 0.82
        );

    let h = 270;


    let x =
        width / 2 -
        w / 2;

    let y =
        height / 2 -
        h / 2;


    drawPanel(
        x,
        y,
        w,
        h
    );


    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(38);


    text(
        "GAME DIJEDA",
        width / 2,
        y + 50
    );


    drawButton(
        width / 2 - 120,
        y + 100,
        240,
        45,
        "Lanjutkan",
        "#2E7D32"
    );


    drawButton(
        width / 2 - 120,
        y + 165,
        240,
        45,
        "Ke Menu",
        "#D32F2F"
    );
}


// ============================================================
// CHECK ANSWER
// ============================================================

function checkAnswer() {

    if (!currentQuestion) {

        return;

    }


    let chosen =
        currentQuestion.options[
            playerLane
        ];


    // ========================================================
    // JAWABAN BENAR
    // +10
    // ========================================================

    if (
        chosen ===
        currentQuestion.answer
    ) {

        correctStreak++;


        // ================================================
        // TAMBAH 10 POIN
        // ================================================

        score += 10;


        // ================================================
        // SUARA BENAR
        // ================================================

        playCorrectSound();


        jumpAnim = 10;


        createParticles(
            playerX,
            playerY - 40
        );


        scorePopups.push(
            new ScorePopup(
                playerX,
                playerY - 70,
                "+10",
                color(
                    255,
                    215,
                    0
                )
            )
        );


        nextQuestion();

    }


    // ========================================================
    // JAWABAN SALAH
    // ========================================================

    else {

        correctStreak = 0;


        // ================================================
        // KURANGI NYAWA
        // ================================================

        lives--;


        // ================================================
        // PENTING:
        // TIDAK ADA score -= 10
        //
        // SCORE TETAP
        // ================================================


        // ================================================
        // SUARA SALAH
        // ================================================

        playWrongSound();


        hitEffectTimer = 15;


        scorePopups.push(
            new ScorePopup(
                playerX,
                playerY - 70,
                "SALAH",
                color(
                    255,
                    70,
                    70
                )
            )
        );


        // ==================================================
        // GAME OVER
        // ==================================================

        if (
            lives <= 0
        ) {

            isNewHighScore =
                score > highScore;

            saveHighScore();

            currentScene =
                "GAME_OVER";

            // Semua BGM berhenti saat Game Over.
            stopAllMusic();

            // ==============================================
            // SUARA GAME OVER
            // ==============================================

            playGameOverSound();

        } else {

            nextQuestion();

        }

    }
}


// ============================================================
// NEXT QUESTION
// ============================================================

function nextQuestion() {

    gateActive = false;

    questionIndex++;


    // ========================================================
    // SEMUA SOAL SELESAI
    // ========================================================

    if (
        questionIndex >=
        currentQuestionList.length
    ) {

        levelStars =
            lives;


        saveHighScore();

        spawnConfetti();


        currentScene =
            "LEVEL_COMPLETE";

        // Semua BGM berhenti agar suara kemenangan lebih jelas.
        stopAllMusic();

        // ================================================
        // SUARA LEVEL SELESAI
        // ================================================

        playWinSound();


        return;

    }


    // ========================================================
    // SOAL BERIKUTNYA
    // ========================================================

    currentQuestion =
        currentQuestionList[
            questionIndex
        ];


    resetGates();
}


// ============================================================
// RESET GATES
// ============================================================

function resetGates() {

    questionTimeLeft =
        questionTimeMax;

    gatesY = -350;

    gateHitChecked = false;

    gateActive = true;
}


// ============================================================
// HIGH SCORE
// ============================================================

function saveHighScore() {

    if (score > highScore) {

        highScore = score;
        highScores[currentCategory] = score;

    }
}


// ============================================================
// PARTICLES
// ============================================================

function createParticles(
    x,
    y
) {

    for (
        let i = 0;
        i < 20;
        i++
    ) {

        particles.push(
            new Particle(
                x,
                y
            )
        );

    }
}


function drawParticles() {

    for (
        let i =
            particles.length - 1;
        i >= 0;
        i--
    ) {

        if (!isPaused) {

            particles[i].update();

        }


        particles[i].show();


        if (
            particles[i].finished()
        ) {

            particles.splice(
                i,
                1
            );

        }

    }
}


class Particle {

    constructor(
        x,
        y
    ) {

        this.x = x;

        this.y = y;

        this.vx =
            random(
                -4,
                4
            );

        this.vy =
            random(
                -6,
                -2
            );

        this.gravity =
            0.25;

        this.alpha =
            255;

        this.size =
            random(
                5,
                10
            );


        this.col =
            random([

                color(
                    255,
                    215,
                    0
                ),

                color(
                    255,
                    140,
                    60
                ),

                color(
                    100,
                    220,
                    120
                ),

                color(
                    100,
                    190,
                    255
                )

            ]);

    }


    update() {

        this.x +=
            this.vx;

        this.y +=
            this.vy;

        this.vy +=
            this.gravity;

        this.alpha -=
            8;

    }


    show() {

        noStroke();

        fill(
            red(this.col),
            green(this.col),
            blue(this.col),
            this.alpha
        );


        ellipse(
            this.x,
            this.y,
            this.size
        );

    }


    finished() {

        return (
            this.alpha < 0
        );

    }

}


// ============================================================
// SCORE POPUP
// ============================================================

function drawScorePopups() {

    for (
        let i =
            scorePopups.length - 1;
        i >= 0;
        i--
    ) {

        if (!isPaused) {

            scorePopups[i].update();

        }


        scorePopups[i].show();


        if (
            scorePopups[i].finished()
        ) {

            scorePopups.splice(
                i,
                1
            );

        }

    }
}


class ScorePopup {

    constructor(
        x,
        y,
        txt,
        col
    ) {

        this.x = x;

        this.y = y;

        this.txt = txt;

        this.col = col;

        this.alpha = 255;

        this.vy = -1.2;

    }


    update() {

        this.y +=
            this.vy;

        this.alpha -=
            4;

    }


    show() {

        push();


        textFont(
            "Fredoka One"
        );

        textSize(22);


        stroke(
            0,
            this.alpha
        );

        strokeWeight(3);


        fill(
            red(this.col),
            green(this.col),
            blue(this.col),
            this.alpha
        );


        text(
            this.txt,
            this.x,
            this.y
        );


        pop();

    }


    finished() {

        return (
            this.alpha < 0
        );

    }

}


// ============================================================
// CONFETTI
// ============================================================

function spawnConfetti() {

    confetti = [];


    for (
        let i = 0;
        i < 70;
        i++
    ) {

        confetti.push(
            new Confetto()
        );

    }
}


class Confetto {

    constructor() {

        this.x =
            random(width);

        this.y =
            random(
                -height,
                0
            );

        this.vy =
            random(
                2,
                5
            );

        this.vx =
            random(
                -1,
                1
            );

        this.size =
            random(
                6,
                12
            );

        this.rot =
            random(
                TWO_PI
            );

        this.rotSpeed =
            random(
                -0.1,
                0.1
            );


        this.col =
            random([

                color(
                    255,
                    215,
                    0
                ),

                color(
                    255,
                    100,
                    150
                ),

                color(
                    100,
                    200,
                    255
                ),

                color(
                    150,
                    255,
                    120
                )

            ]);

    }


    update() {

        this.y +=
            this.vy;

        this.x +=
            this.vx;

        this.rot +=
            this.rotSpeed;

    }


    show() {

        push();


        translate(
            this.x,
            this.y
        );

        rotate(
            this.rot
        );


        noStroke();

        fill(this.col);


        rect(
            -this.size / 2,
            -this.size / 4,
            this.size,
            this.size / 2
        );


        pop();

    }

}


// ============================================================
// LEVEL COMPLETE
// ============================================================

function drawLevelComplete() {

    drawMenuBackground();


    for (
        let c of confetti
    ) {

        c.update();

        c.show();


        if (
            c.y >
            height + 20
        ) {

            c.y =
                random(
                    -100,
                    0
                );

            c.x =
                random(width);

        }

    }


    let w =
        min(
            500,
            width * 0.86
        );

    let h =
        min(
            400,
            height * 0.78
        );


    let x =
        width / 2 -
        w / 2;

    let y =
        height / 2 -
        h / 2;


    drawPanel(
        x,
        y,
        w,
        h
    );


    fill(
        255,
        215,
        0
    );

    textFont(
        "Luckiest Guy"
    );

    textSize(36);


    text(
        "LEVEL SELESAI!",
        width / 2,
        y + 50
    );


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        if (
            i < levelStars
        ) {

            fill(
                255,
                215,
                0
            );

        } else {

            fill(
                80,
                80,
                70
            );

        }


        textSize(48);


        text(
            "★",
            width / 2 -
            65 +
            i * 65,
            y + 120
        );

    }


    fill(255);

    textFont(
        "Fredoka One"
    );

    textSize(22);


    text(
        "Skor: " +
        score,
        width / 2,
        y + 180
    );

    // PESAN HASIL AKHIR - TAMBAHAN SAJA
    let resultMessage = "";

    if (score < 70) {
        resultMessage = "Semangat! Yuk coba lagi dan terus berlatih!";
    } else if (score >= 70 && score <= 80) {
        resultMessage = "Bagus! Terus pertahankan dan tingkatkan lagi!";
    } else if (score >= 90 && score <= 100) {
        resultMessage = "Selamat! Hebat sekali, kamu berhasil!";
    }

    fill(255, 215, 0);
    textFont("Fredoka One");
    textSize(min(18, w * 0.035));
    textAlign(CENTER, CENTER);
    text(resultMessage, width / 2, y + 220);


    let bw =
        min(
            290,
            w - 50
        );


    drawButton(
        width / 2 -
        bw / 2,
        y + h - 120,
        bw,
        45,
        "Main Lagi",
        "#2E7D32"
    );


    drawButton(
        width / 2 -
        bw / 2,
        y + h - 65,
        bw,
        45,
        "Menu Utama",
        "#D32F2F"
    );
}


// ============================================================
// GAME OVER
// ============================================================

function drawGameOver() {

    drawMenuBackground();


    let w = min(460, width * 0.88);
    let h = min(440, height * 0.86);

    let x = width / 2 - w / 2;
    let y = height / 2 - h / 2;

    drawPanel(x, y, w, h);


    // ========================================================
    // JUDUL
    // ========================================================

    fill(255, 150, 60);
    textFont("Luckiest Guy");
    textAlign(CENTER, CENTER);
    textSize(min(32, w * 0.086));

    text("PERMAINAN SELESAI!", width / 2, y + 46);


    // ========================================================
    // HATI (menandakan nyawa habis)
    // ========================================================

    textFont("Fredoka One");
    textSize(26);

    for (let i = 0; i < 3; i++) {

        fill(90, 85, 80);
        text("♥", width / 2 - 36 + i * 36, y + 88);

    }


    // ========================================================
    // BADGE SKOR AKHIR
    // ========================================================

    let badgeW = min(230, w * 0.6);
    let badgeH = 66;
    let badgeCY = y + 148;

    push();
    translate(width / 2, badgeCY);

    noStroke();
    fill(0, 0, 0, 90);
    rect(-badgeW / 2 + 4, -badgeH / 2 + 5, badgeW, badgeH, 16);

    fill(55, 42, 20, 240);
    rect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 16);

    noFill();
    stroke(255, 215, 0, 210);
    strokeWeight(2.5);
    rect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 16);
    noStroke();

    fill(255, 255, 255, 210);
    textFont("Fredoka One");
    textSize(min(12, badgeW * 0.06));
    text("SKOR AKHIR", 0, -badgeH * 0.22);

    fill(255, 215, 0);
    textFont("Luckiest Guy");
    textSize(min(30, badgeW * 0.16));
    text(score, 0, badgeH * 0.16);

    pop();


    // ========================================================
    // PITA REKOR BARU (jika skor > rekor sebelumnya)
    // ========================================================

    let afterBadgeY = badgeCY + badgeH / 2 + 16;

    if (isNewHighScore) {

        push();
        translate(width / 2, afterBadgeY + 10);

        let ribbonW = min(190, w * 0.5);
        let ribbonH = 26;

        noStroke();
        fill(255, 215, 0);
        rect(-ribbonW / 2, -ribbonH / 2, ribbonW, ribbonH, 13);

        fill(70, 45, 15);
        textFont("Fredoka One");
        textSize(min(13, ribbonW * 0.075));
        text("★ REKOR BARU! ★", 0, 1);

        pop();

        afterBadgeY += ribbonH + 14;

    }


    // ========================================================
    // SKOR TERTINGGI
    // ========================================================

    fill(255, 255, 255, 215);
    textFont("Fredoka One");
    textSize(min(15, w * 0.04));

    text(
        "Skor Tertinggi: " + highScore,
        width / 2,
        afterBadgeY
    );


    // ========================================================
    // PESAN SEMANGAT
    // ========================================================

    fill(255, 255, 255, 160);
    textFont("Fredoka One");
    textSize(min(12, w * 0.032));

    text("Ayo coba lagi, kamu pasti bisa lebih baik!", width / 2, afterBadgeY + 24);


    // ========================================================
    // TOMBOL
    // ========================================================

    let bw = min(290, w - 50);

    drawButton(
        width / 2 - bw / 2,
        y + h - 120,
        bw,
        45,
        "Coba Lagi",
        "#2E7D32"
    );

    drawButton(
        width / 2 - bw / 2,
        y + h - 65,
        bw,
        45,
        "Menu Utama",
        "#D32F2F"
    );
}



// ============================================================
// KEYBOARD & CONTROLS
// ============================================================

function touchStarted(event) {

    // Sentuhan layar diperlakukan sama seperti klik mouse.
    // (Sebelumnya return false membuat mousePressed() tidak
    //  pernah terpanggil di HP, sehingga tombol tidak bisa ditekan.)
    try {

        let t =
            event && event.touches && event.touches[0]
                ? event.touches[0]
                : (touches && touches[0] ? touches[0] : null);

        if (t && gameCanvas && gameCanvas.elt) {

            let r = gameCanvas.elt.getBoundingClientRect();

            if (t.clientX !== undefined && r.width > 0 && r.height > 0) {
                mouseX = (t.clientX - r.left) * (width / r.width);
                mouseY = (t.clientY - r.top) * (height / r.height);
            } else if (t.x !== undefined) {
                mouseX = t.x;
                mouseY = t.y;
            }

        }

    } catch (e) {
        console.log("Sentuhan gagal dibaca:", e);
    }

    touchHandling = true;

    try {
        mousePressed();
    } catch (e) {
        console.log("Error saat sentuhan:", e);
    }

    touchHandling = false;
    lastTouchMs = millis();

    return false;
}


// Cegah layar HP ikut bergeser / zoom saat bermain.
function touchMoved() {
    return false;
}

function touchEnded() {
    return false;
}


function keyPressed() {

    if (
        currentScene !==
        "GAMEPLAY"
    ) {

        return;

    }


    // Unlock audio saat keyboard digunakan
    initAudio();


    if (
        keyCode === LEFT_ARROW ||
        key === "a" ||
        key === "A"
    ) {

        if (!isPaused) {

            movePlayerLeft();

            playClickSound();

        }

        return false;

    }


    if (
        keyCode === RIGHT_ARROW ||
        key === "d" ||
        key === "D"
    ) {

        if (!isPaused) {

            movePlayerRight();

            playClickSound();

        }

        return false;

    }


    if (
        key === "p" ||
        key === "P" ||
        keyCode === ESCAPE
    ) {

        isPaused =
            !isPaused;

        if (isPaused) {
            pauseGameplayMusic();
        } else {
            playGameplayMusic();
        }

        playClickSound();

        return false;

    }

}


function movePlayerLeft() {

    if (
        playerLane > 0
    ) {

        playerLane--;

        updatePlayerPosition();

    }

}


function movePlayerRight() {

    if (
        playerLane < 2
    ) {

        playerLane++;

        updatePlayerPosition();

    }

}


function movePlayerToLane(
    lane
) {

    if (
        isPaused ||
        lane < 0 ||
        lane > 2
    ) {

        return;

    }


    if (
        lane !== playerLane
    ) {

        playerLane =
            lane;

        updatePlayerPosition();

        playClickSound();

    }

}


// ============================================================
// BUTTON CLICK & MOUSE
// ============================================================

function isButtonClicked(
    x,
    y,
    w,
    h
) {

    return (
        mouseX >= x &&
        mouseX <= x + w &&
        mouseY >= y &&
        mouseY <= y + h
    );

}


function mousePressed() {

    // Abaikan klik tiruan yang muncul tepat setelah sentuhan.
    if (!touchHandling && millis() - lastTouchMs < 700) {
        return;
    }

    // Unlock audio dari interaksi pertama.
    initAudio();
    unlockAudio();

    // Aktifkan musik sesuai scene saat ini.
    if (currentScene === "GAMEPLAY") {
        if (!isPaused) {
            playGameplayMusic();
        }
    } else {
        playMenuMusic();
    }


    // ========================================================
    // MAIN MENU
    // ========================================================

    if (
        currentScene ===
        "MAIN_MENU"
    ) {

        // Gunakan posisi tombol yang SAMA PERSIS dengan drawMainMenu().
        // Sebelumnya hitbox mouse memakai perhitungan lama (scoreY),
        // sehingga tombol terlihat tetapi tidak bisa ditekan.
        let compact =
            height < 650;

        let veryCompact =
            height < 540;

        let titleY;

        if (veryCompact) {
            titleY = height * 0.17;
        } else if (compact) {
            titleY = height * 0.21;
        } else {
            titleY = height * 0.235;
        }

        let titleSize =
            min(82, width * 0.105, height * 0.12);

        let btnW =
            min(310, width * 0.38);

        if (compact) {
            btnW =
                min(290, width * 0.55);
        }

        let btnH =
            compact ? 46 : 50;

        let gap =
            compact ? 10 : 12;

        let totalButtonsH =
            btnH * 4 + gap * 3;

        let startY =
            max(
                titleY + titleSize * 2.0,
                height * (compact ? 0.56 : 0.54)
            );

        let maxStartY =
            height - totalButtonsH - 18;

        if (startY > maxStartY) {
            startY = maxStartY;
        }

        let x =
            width / 2 -
            btnW / 2;


        // MAIN

        if (
            isButtonClicked(
                x,
                startY,
                btnW,
                btnH
            )
        ) {

            playClickSound();

            currentScene =
                "CATEGORY_SELECT";

        }


        // PETUNJUK

        else if (
            isButtonClicked(
                x,
                startY +
                btnH +
                gap,
                btnW,
                btnH
            )
        ) {

            playClickSound();

            currentScene =
                "HOW_TO_PLAY";

        }


        // TENTANG

        else if (
            isButtonClicked(
                x,
                startY +
                (btnH + gap) * 2,
                btnW,
                btnH
            )
        ) {

            playClickSound();

            aboutSlide = 0;

            currentScene =
                "ABOUT";

        }


        // PROFIL

        else if (
            isButtonClicked(
                x,
                startY +
                (btnH + gap) * 3,
                btnW,
                btnH
            )
        ) {

            playClickSound();

            currentScene =
                "PROFILE";

        }


        return;

    }


    // ========================================================
    // PROFILE (dimensi harus sama persis dengan drawProfile())
    // ========================================================

    if (
        currentScene ===
        "PROFILE"
    ) {

        let h =
            min(
                700,
                height * 0.95
            );

        let y =
            height / 2 -
            h / 2;


        if (
            isButtonClicked(
                width / 2 - 115,
                y + h - 46,
                230,
                44
            )
        ) {

            playClickSound();

            stopAllMusic();

            currentScene =
                "MAIN_MENU";

            playMenuMusic();

        }


        return;

    }


    // ========================================================
    // ========================================================
    // HOW TO PLAY / ABOUT
    // ========================================================

    if (
        [
            "HOW_TO_PLAY",
            "ABOUT"
        ].includes(
            currentScene
        )
    ) {

        // HOW TO PLAY: tombol Menu Utama
        if (currentScene === "HOW_TO_PLAY") {

            let h = min(70 + 15 * min(13, width * 0.026) * 1.5 + 65, height * 0.94);
            let y = height / 2 - h / 2;

            if (isButtonClicked(width / 2 - 115, y + h - 52, 230, 44)) {
                playClickSound();
                stopAllMusic();
                currentScene = "MAIN_MENU";
                playMenuMusic();
            }

            return;
        }

        // ABOUT: layout harus sama dengan drawAbout()
        let w = min(720, width * 0.90);
        let h = min(570, height * 0.82);
        let x = width / 2 - w / 2;
        let y = height / 2 - h / 2;
        let btnH = 50;
        let btnW = min(190, w * 0.27);
        let menuW = min(200, w * 0.29);
        let bottomY = y + h - 62;

        // Menu Utama
        if (isButtonClicked(x + 28, bottomY, menuW, btnH)) {
            playClickSound();
            stopAllMusic();
            currentScene = "MAIN_MENU";
            playMenuMusic();
            return;
        }

        // Slide berikutnya / sebelumnya
        if (aboutSlide === 0) {
            if (isButtonClicked(x + w - btnW - 28, bottomY, btnW, btnH)) {
                playClickSound();
                aboutSlide = 1;
                return;
            }
        } else {
            if (isButtonClicked(x + w - btnW - 28, bottomY, btnW, btnH)) {
                playClickSound();
                aboutSlide = 0;
                return;
            }
        }

        return;
    }


    // ========================================================
    // CATEGORY SELECT
    // ========================================================

    if (
        currentScene ===
        "CATEGORY_SELECT"
    ) {

        let w =
            min(
                400,
                width * 0.78
            );

        let startY =
            height * 0.25;

        let gap = 75;


        if (
            isButtonClicked(
                width / 2 - w / 2,
                startY,
                w,
                65
            )
        ) {

            playClickSound();

            selectedCategory =
                1;

            currentScene =
                "LEVEL_SELECT";

        }


        else if (
            isButtonClicked(
                width / 2 - w / 2,
                startY + gap,
                w,
                65
            )
        ) {

            playClickSound();

            selectedCategory =
                2;

            currentScene =
                "LEVEL_SELECT";

        }


        else if (
            isButtonClicked(
                width / 2 - w / 2,
                startY + gap * 2,
                w,
                65
            )
        ) {

            playClickSound();

            selectedCategory =
                3;

            currentScene =
                "LEVEL_SELECT";

        }


        else if (
            isButtonClicked(
                width / 2 - 105,
                height * 0.82,
                210,
                45
            )
        ) {

            playClickSound();

            stopAllMusic();

            currentScene =
                "MAIN_MENU";

            playMenuMusic();

        }


        return;

    }


    // ========================================================
    // LEVEL SELECT
    // ========================================================

    if (
        currentScene ===
        "LEVEL_SELECT"
    ) {

        let w =
            min(
                380,
                width * 0.76
            );

        let startY =
            height * 0.29;

        let gap = 80;


        if (
            isButtonClicked(
                width / 2 - w / 2,
                startY,
                w,
                60
            )
        ) {

            playClickSound();

            startLevel(
                selectedCategory,
                1
            );

        }


        else if (
            isButtonClicked(
                width / 2 - w / 2,
                startY + gap,
                w,
                60
            )
        ) {

            playClickSound();

            startLevel(
                selectedCategory,
                2
            );

        }


        else if (
            isButtonClicked(
                width / 2 - w / 2,
                startY + gap * 2,
                w,
                60
            )
        ) {

            playClickSound();

            startLevel(
                selectedCategory,
                3
            );

        }


        else if (
            isButtonClicked(
                width / 2 - 105,
                height * 0.82,
                210,
                45
            )
        ) {

            playClickSound();

            currentScene =
                "CATEGORY_SELECT";

        }


        return;

    }


    // ========================================================
    // GAMEPLAY
    // ========================================================

    if (
        currentScene ===
        "GAMEPLAY"
    ) {


        // PAUSE

        if (
            isButtonClicked(
                20,
                78,
                220,
                70
            )
        ) {

            isPaused =
                !isPaused;

            if (isPaused) {
                pauseGameplayMusic();
            } else {
                playGameplayMusic();
            }

            playClickSound();

            return;

        }


        // PAUSE MENU

        if (isPaused) {

            let y =
                height / 2 -
                135;


            if (
                isButtonClicked(
                    width / 2 - 120,
                    y + 100,
                    240,
                    45
                )
            ) {

                isPaused = false;

                playGameplayMusic();

                playClickSound();

            }


            else if (
                isButtonClicked(
                    width / 2 - 120,
                    y + 165,
                    240,
                    45
                )
            ) {

                isPaused = false;

                stopAllMusic();

                currentScene =
                    "MAIN_MENU";

                playMenuMusic();

                playClickSound();

            }


            return;

        }


        // LEFT

        if (
            isButtonClicked(
                25,
                height - 80,
                75,
                55
            )
        ) {

            movePlayerLeft();

            playClickSound();

            return;

        }


        // RIGHT

        if (
            isButtonClicked(
                width - 100,
                height - 80,
                75,
                55
            )
        ) {

            movePlayerRight();

            playClickSound();

            return;

        }


        // KLIK JALUR

        let trackW =
            getTrackWidth();

        let trackX =
            getTrackX();


        if (
            mouseX >= trackX &&
            mouseX <=
                trackX + trackW &&
            mouseY > 130 &&
            mouseY < height
        ) {

            let clickedLane =
                constrain(
                    floor(
                        (
                            mouseX -
                            trackX
                        ) /
                        (trackW / 3)
                    ),
                    0,
                    2
                );


            movePlayerToLane(
                clickedLane
            );


            return;

        }


        return;

    }


    // ========================================================
    // LEVEL COMPLETE
    // ========================================================

    if (
        currentScene ===
        "LEVEL_COMPLETE"
    ) {

        let h =
            min(
                400,
                height * 0.78
            );


        let y =
            height / 2 -
            h / 2;


        let bw =
            min(
                290,
                min(
                    500,
                    width * 0.86
                ) - 50
            );


        if (
            isButtonClicked(
                width / 2 -
                bw / 2,
                y + h - 120,
                bw,
                45
            )
        ) {

            playClickSound();

            startLevel(
                currentCategory,
                currentLevel
            );

        }


        else if (
            isButtonClicked(
                width / 2 -
                bw / 2,
                y + h - 65,
                bw,
                45
            )
        ) {

            playClickSound();

            stopAllMusic();

            currentScene =
                "MAIN_MENU";

            playMenuMusic();

        }


        return;

    }


    // ========================================================
    // GAME OVER
    // ========================================================

    if (
        currentScene ===
        "GAME_OVER"
    ) {

        let w =
            min(
                460,
                width * 0.88
            );

        let h =
            min(
                440,
                height * 0.86
            );

        let y =
            height / 2 -
            h / 2;

        let bw =
            min(
                290,
                w - 50
            );


        if (
            isButtonClicked(
                width / 2 - bw / 2,
                y + h - 120,
                bw,
                45
            )
        ) {

            playClickSound();

            startLevel(
                currentCategory,
                currentLevel
            );

        }


        else if (
            isButtonClicked(
                width / 2 - bw / 2,
                y + h - 65,
                bw,
                45
            )
        ) {

            playClickSound();

            stopAllMusic();

            currentScene =
                "MAIN_MENU";

            playMenuMusic();

        }


        return;

    }

}


// ============================================================
// NATURE BACKGROUND
// ============================================================

function drawNatureBackground() {

    background(
        145,
        215,
        115
    );


    for (
        let i = 0;
        i < 12;
        i++
    ) {

        push();


        translate(
            (
                i * 170 + 80
            ) % width,

            100 +
            (
                i * 130
            ) % height
        );


        scale(
            0.6 +
            (i % 3) * 0.2
        );


        drawTree2D();


        pop();

    }
}

