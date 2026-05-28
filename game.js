if (typeof supabase === 'undefined') {
    var supabase = null; 
}

// Initialize the client only if the library loaded correctly
const supabaseUrl = 'https://mvmtkpwyefyccbobvjbl.supabase.co';
const supabaseKey = 'sb_publishable_z8OrgyDbemt-wgAgfpLV0A_fj0vhd5Y';

if (window.supabase && window.supabase.createClient) {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("🚀 Supabase Engine: ONLINE");
} else {
    console.error("⚠️ Supabase Library not found or blocked by browser.");
}




const gameState = {
    // Moved sectorData inside so "this.sectorData" works
    sectorData: {
        1: {
            background: "url('assets/bg-sector1.jpg')",
            bossSprite: "url('assets/boss1-idle.gif')",
            bossName: "Pluto the Pufferfish",
            message: "Sector 1 Clear! Entering Sector 2: The Milky Way. Denser HARD Trivium asteroids are now available for harvest. Warning: Interstellar Navigation requires 10 Trivium per Jump. Also, you're doing great!"
        },
        2: {
            background: "url('assets/background2.png')",
            bossSprite: "url('assets/boss2-idle.gif')",
            bossName: "Gooby the Gooberfish",
            message: "Sector 2 Clear! Entering Sector 3: The Galactic Core. The Core requires 20 Trivium per Jump, but Trivial Nirvana awaits the brave! You got this! Onward to the core!"
        },
        3: {
            background: "url('assets/background3.jpg')",
            bossSprite: "url('assets/boss3-idle.gif')",
            bossName: "Grandmaster Glare",
            message: "You did it!"
        }
    },

    // 1. DATA TRACKING
    player: {
        name: "",
        food: 0,
        trivium: 0,
        bossRerollCost: 2,
        credits: 0,
        type: "",
        modules: [null, null, null, null],
        crew: [null, null, null, null, null, null],
        usedQuestions: {}
    },
    bgMusic: new Audio('assets/space_music.mp3'),
    musicStarted: false,
    jumpAnimDuration: 5000,
    jumpAnimActive: false,
    currentStage: 1,
    currentSector: 1, 
    sectorBackgrounds: {
        1: 'assets/Pismis24.png',
        2: 'assets/background2.png',
        3: 'assets/background3.jpg'
    },
    categories: [
        "Ancient_History", "Biology", "World_Geography", "Literature",
    "Art_History", "Music", "Chemistry", "Movies", "Mythology",
    "Technology", "Sports", "Philosophy", "Food_and_Drink",
    "Politics", "Space_Exploration", "Language", "Business",
    "Geology", "Psychology", "Modern_History", "Astronomy",
    "Physics", "Mathematics", "Environmental_Science", "Medicine",
    "Architecture", "Economics", "Computer_Science", "Cultural_Studies",
    "Law", "Common_Sense", "NBA", "Video_Games", "Animals",
    "Weather", "US_History", "World_Capitals", "Inventions",
    "Board_Games", "Human_Anatomy", "Oceanography", "Mythology", "Photography"
    ],

    shopModules: [
        { id: 'accumulator', name: "Trivium Amplifier", cost: 20, desc: "Automatically increases all Trivium gained by 50% (rounded up!).", icon: "✨" },
        { id: 'laser', name: "Defense Laser", cost: 5, desc: "1-Use: Remove a wrong answer during regular question.", icon: "🔫" },
        { id: 'biosphere', name: "Biosphere", cost: 10, desc: "Produces 4 Food per Jump.", icon: "🌿" },
        { id: 'content_farm', name: "Content Farm", cost: 12, desc: "+2 Food, +6 Credits, -1 Trivium per Jump.", icon: "🚜" },
        { id: 'gatling_laser', name: "Gatling Laser", cost: 60, desc: "Automatically eliminates one wrong answer on every question.", icon: "⚡" },
        { id: 'gaming_lounge', name: "Gaming Lounge", cost: 25, desc: "Per Jump: each Buddy in Crew Quarters consumes 1 Food and produces 3 Trivium.", icon: "🎮" }
    ],

    buddies: [
        { id: 'octopus', name: "Hydroponic Octopus", desc: "+2 Food per Jump. Generates +1 Food for each adjacent Buddy.", icon: "🐙", gif: "assets/octopus_idle.gif" },
        { id: 'aardvark', name: "Arbitrage Aardvark", desc: "Generates 4 Credits for you per Jump.", icon: "🐜", gif: "assets/aardvark_idle.gif" },
        { id: 'trivia_toad', name: "Trivia Toad", desc: "Consumes 1 Food to produce 4 Trivium per Jump.", icon: "🐸", gif: "assets/toad_idle.gif" },
        { id: 'bear_bot', name: "Bear Bot", desc: "Produces 1 Food, 1 Trivium, 1 Credit per Jump.", icon: "🧸", gif: "assets/bear_idle.gif" },
        { id: 'terry', name: "Terry the Tardigrade", desc: "Eliminates one wrong answer automatically every 3rd question.", icon: "🐾", gif: "assets/terry_idle.gif" },
        { id: 'amp_anteater', name: "Amp Anteater", desc: "Doubles the effect of the buddy directly above or below it in Crew Quarters.", icon: "📢", gif: "assets/amp_anteater_idle.gif" }
    ],

    events: gameEvents,
    easyMode: false,
    noteIndex: 0,
    _audioCtx: null,
    _suppressAscend: false,
    _toneActive: false,

    // 2. ELEMENT GETTERS
    get introScreen() { return document.getElementById('intro-terminal'); },
    get menuScreen() { return document.getElementById('menu-screen'); },
    get charScreen() { return document.getElementById('char-screen'); },
    get modeScreen() { return document.getElementById('mode-screen'); },
    get gameScreen() { return document.getElementById('game-screen'); },
    get shopScreen() { return document.getElementById('shop-screen'); },

    // 3. CORE FUNCTIONS
    init: function() {
        console.log("Sequence Initiated...");
        fetch('README.md').then(r => r.text()).then(text => {
            const match = text.match(/^\.\d+/m);
            if (match) {
                const btn = document.querySelector('#debug-controls button[onclick="gameState.showChangelog()"]');
                if (btn) btn.innerText = `v0${match[0]} CHANGELOG`;
            }
        }).catch(() => {});
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3;

        document.body.addEventListener('click', () => {
            if (!this.musicStarted) {
                this.bgMusic.play();
                this.musicStarted = true;
            }
        }, { once: true });

        document.addEventListener('click', (e) => {
            if (!this._toneActive) return;
            if (!e.target.closest('button, .char-card, .shop-item, .planet-card')) return;
            if (e.target.closest('#rules-overlay') || e.target.id === 'rules-btn') return;
            if (e.target.closest('#shop-screen')) return;
            if (this._suppressAscend) { this._suppressAscend = false; return; }
            this.playTone(1);
        });

        if (sessionStorage.getItem('introSeen')) {
            this.showMenu();
            return;
        }

        this.introScreen.onclick = () => this.skipIntro();
        this.introTimer = setTimeout(() => {
            this.showMenu();
        }, 15000);
    },

    skipIntro: function() {
        if (this.introTimer) clearTimeout(this.introTimer);
        this.showMenu();
    },

    showMenu: function() {
        sessionStorage.setItem('introSeen', '1');
        this.introScreen.onclick = null;
        this.introScreen.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        this.menuScreen.classList.add('fade-in');
    },

    replayCinematic: function() {
        this.menuScreen.classList.add('hidden');
        const intro = this.introScreen;
        const p = intro.querySelector('p');
        intro.classList.remove('hidden');
        // Force CSS animation restart
        p.style.animation = 'none';
        p.offsetHeight; // trigger reflow
        p.style.animation = '';
        intro.onclick = () => this.skipCinematic();
        this.cinematicTimer = setTimeout(() => this.skipCinematic(), 25000);
    },

    skipCinematic: function() {
        if (this.cinematicTimer) clearTimeout(this.cinematicTimer);
        this.introScreen.onclick = null;
        this.introScreen.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
    },

    showChangelog: function() {
        const overlay = document.getElementById('changelog-overlay');
        const body = document.getElementById('changelog-body');
        body.innerHTML = '<p style="text-align:center;">Loading...</p>';
        overlay.classList.remove('hidden');
        fetch('README.md')
            .then(r => r.text())
            .then(text => {
                body.innerHTML = `<pre style="white-space:pre-wrap; font-size:0.8em; color:#a0f9ff; font-family:'Courier New',monospace; line-height:1.6;">${text}</pre>`;
            })
            .catch(() => {
                body.innerHTML = '<p style="color:#ff4444;">Could not load README.</p>';
            });
    },

    closeChangelog: function() {
        document.getElementById('changelog-overlay').classList.add('hidden');
    },

    showCharacterSelect: function() {
        this.menuScreen.classList.add('hidden');
        const bossGifs = ['assets/boss1-idle.gif', 'assets/boss2-idle.gif', 'assets/boss3-idle.gif'];
        const buddyGifs = ['assets/octopus_idle.gif', 'assets/aardvark_idle.gif', 'assets/toad_idle.gif', 'assets/bear_idle.gif', 'assets/terry_idle.gif', 'assets/amp_anteater_idle.gif'];
        document.getElementById('mode-hardcore-img').style.backgroundImage = `url('${bossGifs[Math.floor(Math.random() * bossGifs.length)]}')`;
        document.getElementById('mode-casual-img').style.backgroundImage = `url('${buddyGifs[Math.floor(Math.random() * buddyGifs.length)]}')`;
        this.modeScreen.classList.remove('hidden');
    },

    studyTypes: [
        { key: 'study_datascience',      label: 'STUDY: DATA SCIENCE',       shortName: 'Data Science' },
        { key: 'study_spaceandelements', label: 'STUDY: SPACE AND ELEMENTS', shortName: 'Space & Elements' },
        { key: 'study_vocabulary',       label: 'STUDY: VOCABULARY',         shortName: 'Vocabulary' },
        { key: 'study_history',          label: 'STUDY: HISTORY',            shortName: 'History' },
    ],

    getStudyBankForKey: function(key) {
        const map = {
            'study_vocabulary':       typeof studyBankVocabulary      !== 'undefined' ? studyBankVocabulary      : null,
            'study_history':          typeof studyBankHistory          !== 'undefined' ? studyBankHistory          : null,
            'study_datascience':      typeof studyBankDataScience      !== 'undefined' ? studyBankDataScience      : null,
            'study_spaceandelements': typeof studyBankSpaceAndElements !== 'undefined' ? studyBankSpaceAndElements : null,
        };
        return map[key] || null;
    },

    selectMode: function(mode) {
        const isStudy = mode.startsWith('study_');
        this.easyMode = (mode === 'casual');
        this.runType = mode;
        this.activeStudyBank = null;
        this.activeStudyLabel = null;
        if (isStudy) {
            const def = this.studyTypes.find(t => t.key === mode);
            if (def) {
                this.activeStudyLabel = def.shortName;
                this.activeStudyBank = this.getStudyBankForKey(mode);
            }
        }
        this._toneActive = true;
        this.modeScreen.classList.add('hidden');
        this.charScreen.classList.remove('hidden');
    },

    selectCharacter: function(choice) {
        this.currentSector = 1;
        document.body.style.backgroundImage = `url('${this.sectorBackgrounds[1]}')`;
        const bossIcon = document.getElementById('boss-icon');
        if (bossIcon) {
            bossIcon.style.backgroundImage = "url('assets/boss1-idle.gif')";
        }
        if (choice === 'latke') {
            const randomBuddy = { ...this.buddies[Math.floor(Math.random() * this.buddies.length)] };
            this.player = { name: "Latke", food: 20, trivium: 16, credits: 0, type: "latke", modules: [null, null, null, null], crew: [randomBuddy, null, null, null, null, null], usedQuestions: {} };
        } else {
            const bearBot = { ...this.buddies.find(b => b.id === 'bear_bot') };
            this.player = { name: "Glenn", food: 12, trivium: 10, credits: 15, type: "glenn", modules: [null, null, null, null], crew: [bearBot, null, null, null, null, null], usedQuestions: {} };
        }
        this.charScreen.classList.add('hidden');
        this.enterGame();
    },

    enterGame: function() {
        this.charScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        document.getElementById('spaceship-floor').classList.remove('hidden');
        document.getElementById('minimap').classList.remove('hidden');
        this.currentStage = 1;
        this.usedEventIds = new Set();
        this.terryQuestionCount = 0;
        if (!this.activeStudyBank) this.activeStudyBank = null;
        if (!this.activeStudyLabel) this.activeStudyLabel = null;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.correctAnswersNormal = 0;
        this.wrongAnswersNormal = 0;
        this.correctAnswersHard = 0;
        this.wrongAnswersHard = 0;
        this.categoryStats = {};
        this.categoryStatsHard = {};
        this.highestStageReached = 1;
        const sprite = document.getElementById('pilot-sprite');
        if (sprite) {
            sprite.className = "tip";
            sprite.classList.add(this.player.type + "-active");
            const pilotQuip = this.player.type === 'latke' ? 'Latke doing her best' : 'Glenn doing his best';
            sprite.setAttribute('data-tooltip', pilotQuip); 
        }
        this.updateHUD();
        this.renderModules();
        this.generatePlanets();
        this.initParticles();

        const startingBuddy = this.player.crew[0];
        if (startingBuddy) {
            const flavorLines = {
                bear_bot: "admires your ambition and has joined your crew!",
                octopus: "sensed a promising harvest ahead and has joined your crew!",
                aardvark: "spotted a profitable venture and has joined your crew!",
                trivia_toad: "recognizes a fellow scholar and has joined your crew!",
                terry: "has survived worse odds than these and has joined your crew!",
                amp_anteater: "can already hear the potential and has joined your crew!"
            };
            const flavor = flavorLines[startingBuddy.id] || "has joined your crew!";
            this.showFeedback(true, `${startingBuddy.icon} ${startingBuddy.name} ${flavor}`, "NEW CREW MEMBER");
        }
    },

    openShop: function() {
        this.gameScreen.classList.add('hidden');
        this.shopScreen.classList.remove('hidden');
        document.getElementById('spaceship-floor').classList.remove('hidden');
        document.getElementById('minimap').classList.remove('hidden');
        document.getElementById('shop-resources').innerHTML =
            `FOOD: <b>${this.player.food}</b> &nbsp;|&nbsp; TRIVIUM: <b>${this.player.trivium}</b> &nbsp;|&nbsp; CREDITS: <b>${this.player.credits}</b>`;
        
        const availableModules = this.shopModules.filter(mod => 
            !this.player.modules.some(equipped => equipped?.id === mod.id)
        );

        const shopDialogue = document.querySelector('#shop-screen .shop-dialogue');
        if (shopDialogue) {
            if (availableModules.length === 0) {
                shopDialogue.innerHTML = `"${this.player.name}, you've bought everything I have! Now get out there and survive."`;
            } else {
                shopDialogue.innerHTML = `"${this.player.name}, you must know that credits are good, but survival is better. You've currently got <span class="credit-highlight">${this.player.credits} Credits</span>. What'll it be?"`;
            }
        }
        
        const container = document.getElementById('shop-offers');
        container.innerHTML = "";
        
        const shuffled = [...availableModules];
        for (let _i = shuffled.length - 1; _i > 0; _i--) { const _j = Math.floor(Math.random() * (_i + 1)); [shuffled[_i], shuffled[_j]] = [shuffled[_j], shuffled[_i]]; }
        const selections = shuffled.slice(0, 4).sort((a, b) => a.cost - b.cost);

        selections.forEach((mod, index) => {
            const canAfford = this.player.credits >= mod.cost;
            const item = document.createElement('div');
            item.id = `shop-item-${index}`;
            item.className = 'shop-item';
            item.innerHTML = `
                <h4>${mod.name}</h4>
                <p>${mod.desc}</p>
                <div class="buy-area">
                    <button class="buy-btn" ${canAfford ? '' : 'disabled'}
                        onclick="gameState.buyModule('${mod.id}', ${index})">BUY: ${mod.cost}C</button>
                </div>
            `;
            container.appendChild(item);
        });

        if (this.currentSector === 3) {
            const gain = Math.floor(this.player.credits / 2);
            const special = document.createElement('div');
            special.id = 'shop-item-converter';
            special.className = 'shop-item';
            special.style.borderColor = '#ffd700';
            special.innerHTML = `
                <h4 style="color:#ffd700;">Credit Alchemizer</h4>
                <p>All Credits spent.</p>
                <p style="font-size:0.82em;color:#ffd700;margin-top:4px;">Convert ${this.player.credits}C → +${gain} Trivium</p>
                <div class="buy-area">
                    <button class="buy-btn" id="converter-btn" ${this.player.credits < 2 ? 'disabled' : ''}
                        onclick="gameState.convertCreditsToTrivium()">CONVERT</button>
                </div>
            `;
            container.appendChild(special);
        }

    },

    convertCreditsToTrivium: function() {
        const gain = Math.floor(this.player.credits / 2);
        if (gain < 1) return;
        this.player.trivium += gain;
        this.player.credits = 0;
        this.updateHUD();
        document.getElementById('shop-resources').innerHTML =
            `FOOD: <b>${this.player.food}</b> &nbsp;|&nbsp; TRIVIUM: <b>${this.player.trivium}</b> &nbsp;|&nbsp; CREDITS: <b>${this.player.credits}</b>`;
        const slot = document.getElementById('shop-item-converter');
        if (slot) {
            slot.innerHTML = `<div class="sold-out" style="color:#ffd700;">+${gain} Trivium acquired!</div>`;
            slot.style.opacity = '0.5';
            slot.style.borderStyle = 'dashed';
        }
        const shopDialogue = document.querySelector('#shop-screen .shop-dialogue');
        if (shopDialogue) shopDialogue.innerHTML = `"Good doing business with you, ${this.player.name}. That data is yours now."`;
    },

    buyModule: function(modId, shopIndex) {
        const mod = this.shopModules.find(m => m.id === modId);
        const emptySlot = this.player.modules.indexOf(null);
        if (emptySlot !== -1 && this.player.credits >= mod.cost) {
            this.player.credits -= mod.cost;
            
            const shopDialogue = document.querySelector('#shop-screen .shop-dialogue');
            if (shopDialogue) {
                shopDialogue.innerHTML = `"Thanks ${this.player.name}, you've got <span class="credit-highlight">${this.player.credits} Credits left</span>. Anything else?"`;
            }
            
            this.player.modules[emptySlot] = { ...mod }; 
            this.renderModules();
            this.updateHUD();
            const itemDiv = document.getElementById(`shop-item-${shopIndex}`);
            if (itemDiv) {
                itemDiv.innerHTML = `<div class="sold-out">Purchased!</div>`;
                itemDiv.style.opacity = "0.5";
                itemDiv.style.borderStyle = "dashed";
            }
        } else if (emptySlot === -1) {
            this.showFeedback(false, "All module bays are occupied.", "NO SPACE AVAILABLE");
        }
    },

    closeShop: function() {
        this.shopScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.generatePlanets();
    },

    renderModules: function() {
        const renderSlot = (item, slotId, index, arrayType) => {
            const slot = document.getElementById(slotId);
            if (!slot) return;

            // Drag state
            slot.draggable = !!item;
            slot.ondragstart = item ? (e) => {
                this._drag = { index, arrayType };
                slot.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            } : null;
            slot.ondragend = () => slot.classList.remove('dragging');
            slot.ondragover = (e) => {
                if (!this._drag) return;
                if (this._drag.arrayType !== arrayType) return; // no cross-type drops
                e.preventDefault();
                slot.classList.add('drag-over');
            };
            slot.ondragleave = () => slot.classList.remove('drag-over');
            slot.ondrop = (e) => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                if (!this._drag || this._drag.arrayType !== arrayType) return;
                if (this._drag.index === index) return;
                const arr = arrayType === 'crew' ? this.player.crew : this.player.modules;
                [arr[this._drag.index], arr[index]] = [arr[index], arr[this._drag.index]];
                this._drag = null;
                this.renderModules();
                this.updateHUD();
            };

            if (item) {
                slot.classList.add('equipped');
                if (item.gif) {
                    slot.style.backgroundImage = `url('${item.gif}')`;
                    slot.innerHTML = "";
                } else {
                    slot.style.backgroundImage = "none";
                    slot.innerHTML = `<span>${item.icon}</span>`;
                }
                const sellBtn = document.createElement('button');
                sellBtn.innerText = "SELL";
                sellBtn.className = "sell-module-btn hidden";
                sellBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.sellModule(index, arrayType);
                };
                slot.appendChild(sellBtn);
                slot.onclick = () => sellBtn.classList.toggle('hidden');
                slot.setAttribute('data-tooltip', `${item.name}: ${item.desc}`);
                const _tt = document.getElementById('slot-tooltip');
                const _ttImg = document.getElementById('slot-tooltip-img');
                const _ttTxt = document.getElementById('slot-tooltip-text');
                slot.addEventListener('mouseenter', () => {
                    _ttImg.innerHTML = item.gif
                        ? `<img src="${item.gif}" alt="${item.name}">`
                        : `<span>${item.icon || ''}</span>`;
                    _ttTxt.innerText = `${item.name}\n${item.desc}`;
                    _tt.classList.remove('hidden');
                });
                slot.addEventListener('mousemove', (e) => {
                    const pad = 14;
                    let x = e.clientX + pad, y = e.clientY + pad;
                    if (x + 190 > window.innerWidth)  x = e.clientX - 190;
                    if (y + 180 > window.innerHeight) y = e.clientY - 180;
                    _tt.style.left = x + 'px';
                    _tt.style.top  = y + 'px';
                });
                slot.addEventListener('mouseleave', () => _tt.classList.add('hidden'));
            } else {
                slot.classList.remove('equipped');
                slot.style.backgroundImage = "none";
                slot.innerHTML = "";
                slot.onclick = null;
                slot.setAttribute('data-tooltip', "Empty");
            }
        };

        this.player.crew.forEach((item, i) => renderSlot(item, `crew-slot-${i + 1}`, i, 'crew'));

        const crewGrid = document.getElementById('crew-slot-grid');
        if (crewGrid) crewGrid.classList.add('three-col');

        this.player.modules.forEach((item, i) => renderSlot(item, `mod-slot-${i + 1}`, i, 'module'));
    },

    sellModule: function(index, arrayType) {
        const arr = arrayType === 'crew' ? this.player.crew : this.player.modules;
        const item = arr[index];
        const sellPrice = 1;
        this.player.credits += sellPrice;
        arr[index] = null;
        this.updateHUD();
        this.renderModules();
    },

    showFeedback: function(isCorrect, message, title = "TRANSMISSION RECEIVED", explanation = null, statsHtml = null) {
        const overlay = document.getElementById('feedback-overlay');
        const titleEl = document.getElementById('feedback-title');
        const msgEl = document.getElementById('feedback-msg');
        titleEl.innerText = title;
        msgEl.innerText = message;
        if (explanation) {
            const expEl = document.createElement('p');
            expEl.style.cssText = 'margin-top: 15px; color: #a0f9ff; font-size: 0.9em; line-height: 1.5; text-align: left;';
            expEl.innerText = explanation;
            msgEl.appendChild(expEl);
        }
        if (statsHtml) {
            const statsEl = document.createElement('div');
            statsEl.innerHTML = statsHtml;
            msgEl.appendChild(statsEl);
        }
        titleEl.className = isCorrect ? "success-text" : "failure-text";
        const isDefeat = !this.easyMode && (this.player.food <= 0 || this.player.trivium <= 0);
        const closeBtn = document.getElementById('feedback-close-btn');
        const menuBtn  = document.getElementById('feedback-menu-btn');
        closeBtn.style.display = '';
        menuBtn.style.display  = '';
        closeBtn.classList.toggle('hidden', isDefeat);
        menuBtn.classList.toggle('hidden', !isDefeat);
        const hud = document.getElementById('hud');
        overlay.style.top = hud ? (hud.offsetTop + hud.offsetHeight) + 'px' : '0';
        overlay.classList.remove('hidden');
    },

    closeFeedback: function() {
    document.getElementById('feedback-overlay').classList.add('hidden');
    // Only hide the boss icon if we're leaving the boss screen, not during mid-boss feedback
    const bossUi = document.getElementById('boss-ui');
    const bossIcon = document.getElementById('boss-icon');
    if (bossIcon && bossUi && !bossUi.classList.contains('hidden')) {
        bossIcon.classList.add('hidden');
    }

    if (this.eventJustCompleted) {
        this.eventJustCompleted = false;
        this.generatePlanets();
        return;
    }

    if (!this.easyMode && (this.player.food <= 0 || this.player.trivium <= 0)) {
        this.returnToMenu();
        return;
    }

    if (this.currentStage === 4) {
        this.openTavern();
        return;
    } else if (this.currentStage === 6) {
        this.openEvent();
        return;
    } else if (this.currentStage === 8) {
        this.openShop();
        return;
    } else if (this.currentStage === 10) {
        this.updateHUD();
        this.updateMinimap();
        this.triggerBossEncounter();
        return;
    } else if (this.currentStage > 10) {
        // --- FIXED SECTOR TRANSITION LOGIC ---

        // 1. Get the data for the sector we JUST completed
        const completedSectorData = this.sectorData[this.currentSector];

        

        // 3. Increment to the NEW sector
        this.currentSector++;
        this.currentStage = 1;

        // 4. Get the data for the NEW sector to update visuals
        const nextSectorData = this.sectorData[this.currentSector];

        // 5. Update Background and Boss Sprite for the NEW sector
        document.body.style.backgroundImage = nextSectorData.background;
        if (bossIcon) {
            bossIcon.style.backgroundImage = nextSectorData.bossSprite;
        }

        // 6. Show the message from the COMPLETED sector
        this.noteIndex = 0;
        this.showFeedback(true, completedSectorData.message, "WARP SUCCESSFUL");
        
        this.updateHUD(); 
        return;
    } 

    this.updateHUD();
    this.generatePlanets();
},

    showVictoryScreen: function() {

    const overlay = document.getElementById('feedback-overlay');
    const msgEl = document.getElementById('feedback-msg');
    const titleEl = document.getElementById('feedback-title');
    const closeBtn = document.getElementById('feedback-close-btn');

    // 2. Setup Title
    titleEl.innerHTML = "VICTORY! <br> You have traversed the GALACTIC CORE! <br> Life now makes way more sense. <br> Thanks for playing the demo! -Kieran";
    titleEl.className = "success-text"; 
    titleEl.style.color = "#00f2ff";

    // 3. Prepare Buddy/Pilot Visuals
    const pilotImg = this.player.type === 'latke' ? 'assets/latke_idle.gif' : 'assets/glenn_idle.gif';
    const buddyHtml = this.player.crew
        .filter(m => m && m.gif)
        .map(b => `<div style="display:flex;flex-direction:column;align-items:center;margin:5px;">
            <img src="${b.gif}" style="width:50px;height:50px;border:1px solid #00f2ff;background:rgba(0,0,0,0.5);image-rendering:pixelated;">
            <span style="font-size:0.65em;color:#a0f9ff;margin-top:3px;">${b.name}</span>
        </div>`)
        .join('');
    const moduleHtml = this.player.modules
        .filter(m => m)
        .map(m => `<div style="display:flex;flex-direction:column;align-items:center;margin:5px;">
            <span style="font-size:1.8em;">${m.icon}</span>
            <span style="font-size:0.65em;color:#ffde00;margin-top:3px;">${m.name}</span>
        </div>`)
        .join('');

    // 4. Inject Content (Updated with container padding)
    msgEl.innerHTML = `
        <div style="text-align: center; font-family: 'Courier New', monospace; padding-bottom: 20px;">
            <div style="margin-bottom: 15px;">
                <p>PILOT: ${this.player.name.toUpperCase()}</p>
                <img src="${pilotImg}" style="width: 80px; height: 80px; image-rendering: pixelated;">
            </div>

            <div style="display: flex; justify-content: space-around; background: rgba(0,242,255,0.1); padding: 10px; border: 1px solid #00f2ff;">
                <span>Food: ${this.player.food}</span>
                <span>Trivium: ${this.player.trivium}</span>
                <span>Credits: ${this.player.credits}</span>
            </div>
            ${this.buildStatsHtml()}

            <div style="margin: 15px 0;">
                <p style="font-size: 0.8em; color: #888; margin-bottom: 6px;">SURVIVING CREW:</p>
                <div style="display: flex; justify-content: center; flex-wrap: wrap;">
                    ${buddyHtml || '<span style="color:#444;">NO SURVIVING BUDDIES</span>'}
                </div>
            </div>
            <div style="margin: 10px 0;">
                <p style="font-size: 0.8em; color: #888; margin-bottom: 6px;">INSTALLED MODULES:</p>
                <div style="display: flex; justify-content: center; flex-wrap: wrap;">
                    ${moduleHtml || '<span style="color:#444;">NO MODULES INSTALLED</span>'}
                </div>
            </div>

            <div style="border-top: 1px solid #444; padding-top: 15px; margin-bottom: 20px;">
                <p>Final Trivium Score: <span style="color: #00f2ff; font-size: 1.5em;">${this.player.trivium}</span></p>
                <p>${this.runType === 'hardcore' ? 'Submit your Trivium score to the Galactic Hall of Fame!' : this.runType === 'casual' ? 'Log your run to the database:' : 'Submit your score to the Study Leaderboard!'}</p>
                ${this.runType === 'casual' ? `<p style="color:#888; font-size:0.78em; font-style:italic; margin-top:-6px; margin-bottom:6px;">Casual scores are stored privately and not shown on the public leaderboard.</p>` : ''}
                <input type="text" id="player-initials" placeholder="AAA" maxlength="3"
                       style="text-transform: uppercase; width: 60px; text-align: center; background: #000; color: #00f2ff; border: 1px solid #00f2ff; padding: 5px;">
                <button onclick="gameState.submitScore()" style="background: #00f2ff; color: #000; border: none; padding: 6px 12px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace;">SUBMIT</button>
            </div>

            <button onclick="location.reload()" style="display: block; width: 100%; margin-top: 20px; background: rgba(194, 86, 86, 0.2); border: 1px solid rgb(194, 86, 86); color: rgb(194, 86, 86); cursor: pointer; font-size: 0.9em; padding: 10px;">RETURN TO TITLE SCREEN</button>
        </div>
    `;

    // 5. Show the Overlay and hide the default "Continue" button
    if (closeBtn) closeBtn.style.display = 'none';
    overlay.style.top = '0';
    overlay.classList.remove('hidden');
    overlay.style.display = "flex"; 
},

    submitScore: async function() {
    const initials = document.getElementById('player-initials').value.toUpperCase() || "AAA";
    const finalScore = this.player.trivium;

    const btn = document.querySelector('button[onclick="gameState.submitScore()"]');
    btn.innerText = "UPLOADING...";
    btn.disabled = true;

    try {
        const crewIds = JSON.stringify(this.player.crew.filter(c => c).map(c => c.id));
        const moduleIds = JSON.stringify(this.player.modules.filter(m => m).map(m => m.id));
        const { error: insertError } = await supabase
            .from('leaderboard')
            .insert([{ name: initials, score: finalScore, crew: crewIds, modules: moduleIds, RunType: this.runType }]);

        if (insertError) throw insertError;

        const { data: scores, error: fetchError } = await supabase
            .from('leaderboard')
            .select('name, score, crew, modules, RunType')
            .eq('RunType', this.runType)
            .gt('score', 0)
            .order('score', { ascending: false });

        if (fetchError) throw fetchError;

        const filtered = this.filterScores(scores);
        const msgEl = document.getElementById('feedback-msg');
        if (this.runType === 'hardcore') {
            this.showHighScores(filtered);
        } else if (this.runType === 'casual') {
            msgEl.innerHTML = `<p style="color:#6ddb6d;font-size:1em;">Run logged successfully!</p>
                <p style="color:#888;font-size:0.82em;">Your casual score of <span style="color:#00f2ff;">${finalScore}</span> has been saved.</p>
                <button onclick="location.reload()" style="display:block;width:100%;margin-top:20px;background:rgba(194,86,86,0.2);border:1px solid rgb(194,86,86);color:rgb(194,86,86);cursor:pointer;padding:10px;">Menu</button>`;
        } else {
            const studyDef = this.studyTypes.find(t => t.key === this.runType);
            const label = studyDef ? studyDef.label : 'STUDY';
            msgEl.innerHTML = this.buildStudySectionHtml(filtered, label) +
                `<button onclick="location.reload()" style="display:block;width:100%;margin-top:20px;background:rgba(194,86,86,0.2);border:1px solid rgb(194,86,86);color:rgb(194,86,86);cursor:pointer;padding:10px;">Menu</button>`;
        }
    } catch (err) {
        console.error("Supabase Error:", err.message);
        this.showFeedback(false, `Score transmission failed: ${err.message || err}`, "TRANSMISSION FAILED");
    }
},

filterScores: function(scores) {
    const counts = {};
    return scores.filter(s => {
        counts[s.name] = (counts[s.name] || 0) + 1;
        return counts[s.name] <= 3;
    });
},

buildHardcoreTableHtml: function(scores) {
    if (scores.length === 0) return '<p style="color:#444;font-size:0.85em;text-align:center;">No scores yet.</p>';
    let html = `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:0.9em;margin-top:6px;">
        <tr style="border-bottom:1px solid #00f2ff;color:#888;">
            <th style="text-align:left;padding:5px;">PILOT</th>
            <th style="text-align:center;padding:5px;">CREW &amp; MODS</th>
            <th style="text-align:right;padding:5px;">TRIVIUM</th>
        </tr>`;
    scores.forEach((s, i) => {
        const color = i === 0 ? "#ffd700" : "#00f2ff";
        let crewHtml = '';
        try { crewHtml = JSON.parse(s.crew||'[]').map(id => { const b = this.buddies.find(b=>b.id===id); return b ? `<img src="${b.gif}" title="${b.name}" style="width:28px;height:28px;image-rendering:pixelated;border:1px solid #00f2ff;background:rgba(0,0,0,0.5);">` : ''; }).join(''); } catch(e) {}
        let modHtml = '';
        try { modHtml = JSON.parse(s.modules||'[]').map(id => { const m = this.shopModules.find(m=>m.id===id); return m ? `<span title="${m.name}" style="font-size:1.1em;">${m.icon}</span>` : ''; }).join(''); } catch(e) {}
        html += `<tr style="border-bottom:1px solid #222;">
            <td style="text-align:left;padding:8px 5px;">${i+1}. ${s.name}</td>
            <td style="text-align:center;padding:4px 5px;"><div style="display:flex;justify-content:center;align-items:center;gap:3px;flex-wrap:wrap;">${crewHtml}${modHtml||(!crewHtml?'<span style="color:#444;font-size:0.75em;">—</span>':'')}</div></td>
            <td style="text-align:right;color:${color};font-weight:bold;">${s.score.toLocaleString()}</td>
        </tr>`;
    });
    return html + '</table>';
},

buildStudySectionHtml: function(scores, label) {
    let html = `<div style="margin-top:18px;border-top:1px solid #333;padding-top:10px;">
        <h3 style="color:#a070c0;font-size:0.85em;letter-spacing:1px;margin-bottom:6px;">${label}</h3>`;
    if (scores.length === 0) {
        html += '<p style="color:#444;font-size:0.8em;">No scores yet.</p>';
    } else {
        html += `<table style="width:100%;border-collapse:collapse;font-family:'Courier New',monospace;font-size:0.85em;">
            <tr style="border-bottom:1px solid #4a2a6a;color:#888;">
                <th style="text-align:left;padding:4px;">PILOT</th>
                <th style="text-align:center;padding:4px;">CREW &amp; MODS</th>
                <th style="text-align:right;padding:4px;">TRIVIUM</th>
            </tr>`;
        scores.forEach((s, i) => {
            const color = i === 0 ? "#ffd700" : "#a070c0";
            let crewHtml = '';
            try { crewHtml = JSON.parse(s.crew||'[]').map(id => { const b = this.buddies.find(b=>b.id===id); return b ? `<img src="${b.gif}" title="${b.name}" style="width:24px;height:24px;image-rendering:pixelated;border:1px solid #a070c0;background:rgba(0,0,0,0.5);">` : ''; }).join(''); } catch(e) {}
            let modHtml = '';
            try { modHtml = JSON.parse(s.modules||'[]').map(id => { const m = this.shopModules.find(m=>m.id===id); return m ? `<span title="${m.name}" style="font-size:1em;">${m.icon}</span>` : ''; }).join(''); } catch(e) {}
            html += `<tr style="border-bottom:1px solid #1a1a2a;">
                <td style="text-align:left;padding:5px;">${i+1}. ${s.name}</td>
                <td style="text-align:center;padding:3px 4px;"><div style="display:flex;justify-content:center;align-items:center;gap:3px;flex-wrap:wrap;">${crewHtml}${modHtml||(!crewHtml?'<span style="color:#444;font-size:0.75em;">—</span>':'')}</div></td>
                <td style="text-align:right;color:${color};font-weight:bold;">${s.score.toLocaleString()}</td>
            </tr>`;
        });
        html += '</table>';
    }
    return html + '</div>';
},

showHighScores: function(scores) {
    const titleEl = document.getElementById('feedback-title');
    if (titleEl) {
        titleEl.innerHTML = '⭐ GALACTIC HALL OF FAME';
        titleEl.className = 'success-text';
    }
    const msgEl = document.getElementById('feedback-msg');
    msgEl.innerHTML = this.buildHardcoreTableHtml(scores) +
        `<div style="margin-top:20px;"><button onclick="location.reload()" style="background:#00f2ff;color:#000;border:none;padding:12px;cursor:pointer;font-weight:bold;font-family:inherit;width:100%;">BACK TO MENU</button></div>`;
},
viewLeaderboard: async function() {
    const overlay = document.getElementById('feedback-overlay');
    const msgEl = document.getElementById('feedback-msg');
    const titleEl = document.getElementById('feedback-title');
    const closeBtn = document.getElementById('feedback-close-btn');
    const menuBtn  = document.getElementById('feedback-menu-btn');

    closeBtn.classList.add('hidden');
    menuBtn.classList.add('hidden');
    titleEl.innerText = "Galactic Hall of Fame";
    msgEl.innerHTML = "<p style='text-align:center;'>Accessing Galactic Archives...</p>";
    overlay.style.top = '0';
    overlay.classList.remove('hidden');
    overlay.style.display = "flex";

    const closeLeaderboard = () => {
        overlay.classList.add('hidden');
        overlay.style.display = "";
        closeBtn.classList.remove('hidden');
    };

    if (!supabase) {
        msgEl.innerHTML = "<p style='color:#ff4444;'>Connection Error: Database blocked by browser tracking prevention.</p><br><button onclick=\"gameState.viewLeaderboard.__close()\">CLOSE</button>";
        return;
    }

    try {
        let { data: allScores, error } = await supabase
            .from('leaderboard')
            .select('name, score, crew, modules, RunType')
            .order('score', { ascending: false });

        if (error) throw error;

        // Normalize: map RunType → run_type for all downstream filtering
        allScores = (allScores || []).map(s => ({ ...s, run_type: s.RunType || '' }));

        const hardcoreScores = this.filterScores(
            (allScores || []).filter(s => {
                const rt = (s.run_type || '').toLowerCase();
                return (rt === 'hardcore' || rt === '') && s.score > 50;
            })
        );

        let html = `<h3 style="color:#00f2ff;text-shadow:0 0 10px #00f2ff;margin-bottom:6px;">⭐ HARDCORE HALL OF FAME</h3>`;
        html += this.buildHardcoreTableHtml(hardcoreScores);

        this.studyTypes.forEach(type => {
            const typeScores = this.filterScores((allScores || []).filter(s => s.run_type === type.key));
            html += this.buildStudySectionHtml(typeScores, type.label);
        });

        html += `<div style="margin-top:20px;"><button style="background:#00f2ff;color:#000;border:none;padding:12px;cursor:pointer;font-weight:bold;font-family:inherit;width:100%;">CLOSE</button></div>`;
        msgEl.innerHTML = html;
        msgEl.querySelector('div:last-child button').onclick = closeLeaderboard;
    } catch (err) {
        console.error("Fetch Error:", err);
        msgEl.innerHTML = `<p style='color:#ff4444;'>Failed to sync with Hall of Fame.</p><p style='color:#888;font-size:0.8em;'>${err.message || err}</p><br><button onclick="document.getElementById('feedback-overlay').classList.add('hidden')" style="margin-top:8px;">CLOSE</button>`;
    }
},

    generatePlanets: function() {
        this.updateHUD();
        document.getElementById('current-stage').innerText = this.currentStage;
        document.getElementById('choice-container').classList.remove('hidden');
        document.getElementById('trivia-box').classList.add('hidden');
        const container = document.getElementById('planet-options');
        container.innerHTML = "";
        const resources = ["Food", "Trivium", "Credits"];
        if (typeof questionBank === 'undefined' || Object.keys(questionBank).length === 0) {
            container.innerHTML = '<p style="color:red">ERROR: questionBank not loaded! Keys=' + (typeof questionBank) + '</p>';
            return;
        }
        const makeNode = (cat, resType) => {
            const amount = Math.floor(Math.random() * (14 - 9 + 1) + 9);
            const nodeName = amount === 14 ? "Planet" : amount === 13 ? "Dwarf Planet" : amount === 12 ? "Moon" : amount === 11 ? "Asteroid" : amount === 10 ? "O'neill Cylinder" : "Research Habitat";
            this.createNodeCard(container, cat, resType, amount, nodeName, false);
        };

        if (this.activeStudyBank) {
            makeNode(this.activeStudyLabel, "Food");
            makeNode(this.activeStudyLabel, "Trivium");
            makeNode(this.activeStudyLabel, "Credits");
        } else {
            const _cats = Object.keys(questionBank);
            for (let _i = _cats.length - 1; _i > 0; _i--) { const _j = Math.floor(Math.random() * (_i + 1)); [_cats[_i], _cats[_j]] = [_cats[_j], _cats[_i]]; }
            makeNode(_cats[0], "Food");
            makeNode(_cats[1], "Trivium");
            if (this.currentSector >= 2) {
                const hardCats = Object.keys(questionBankHard);
                const eliteCat = hardCats[Math.floor(Math.random() * hardCats.length)];
                const eliteAmount = Math.floor(Math.random() * (28 - 18 + 1) + 18);
                this.createNodeCard(container, eliteCat, "Trivium", eliteAmount, "-HARD NODE-", true);
            }
            makeNode(_cats[2], "Credits");
        }
    },

    createNodeCard: function(container, cat, resType, amount, nodeName, isHard) {
        const nodeAssetBase = {
            'Planet':           'assets/location_planet',
            'Dwarf Planet':     'assets/location_dwarf_planet',
            'Moon':             'assets/location_moon',
            'Asteroid':         'assets/location_asteroid',
            "O'neill Cylinder":  'assets/location_oneill_cylinder',
            'Research Habitat': 'assets/location_research_habitat',
            '-HARD NODE-':      'assets/location_hard_node',
        };
        const base = nodeAssetBase[nodeName] || 'assets/latke_idle';
        // Try PNG first, fall back to GIF, then to default
        const imgSrc = `${base}.png`;
        const imgFallback = `${base}.gif`;

        const card = document.createElement('div');
        card.className = isHard ? 'planet-card elite-node' : 'planet-card';
        const tooltip = `${cat.replace(/_/g, ' ')} ${nodeName}`;
        card.innerHTML = `
  <h3>${cat.replace(/_/g, ' ')}</h3>
  <span class="reward-tag">+${amount} ${resType}</span>
  <div style="margin-top:8px;">
    <img src="${imgSrc}"
         onerror="this.onerror=null;this.src='${imgFallback}'"
         title="${tooltip}"
         style="width:83px;height:83px;image-rendering:pixelated;display:block;margin:0 auto;">
  </div>`;
        card.onclick = () => this.startTrivia(cat, {type: resType, val: amount}, isHard);
        container.appendChild(card);
    },

    triggerBossEncounter: function() {
        const bossIcon = document.getElementById('boss-icon');
        if (bossIcon) {
            bossIcon.classList.remove('hidden');
            const data = this.sectorData[this.currentSector];
            if (data) bossIcon.style.backgroundImage = data.bossSprite;
        }
        document.getElementById('choice-container').classList.add('hidden');
        document.getElementById('trivia-box').classList.add('hidden');
        const bossUI = document.getElementById('boss-ui');
        bossUI.classList.remove('hidden');
        const bossTitle = document.getElementById('boss-title');
        if (bossTitle && this.sectorData[this.currentSector]) {
            bossTitle.innerText = `GREAT FILTER DETECTED — ${this.sectorData[this.currentSector].bossName}`;
        }
        this.bossRerollCost = 2;
        this.renderBossCategories();
    },

    renderBossCategories: function() {
        const grid = document.getElementById('boss-category-grid');
        grid.innerHTML = "";
        if (this.activeStudyBank) {
            const btn = document.createElement('button');
            btn.className = "category-btn";
            btn.innerText = this.activeStudyLabel;
            btn.onclick = () => this.startSuddenDeath(this.activeStudyLabel);
            grid.appendChild(btn);
            document.getElementById('reroll-container').innerHTML = "";
        } else {
            const hardCats = Object.keys(questionBankHard);
            for (let _i = hardCats.length - 1; _i > 0; _i--) { const _j = Math.floor(Math.random() * (_i + 1)); [hardCats[_i], hardCats[_j]] = [hardCats[_j], hardCats[_i]]; }
            hardCats.slice(0, 4).forEach(cat => {
                const btn = document.createElement('button');
                btn.className = "category-btn";
                btn.innerText = cat.replace(/_/g, ' ');
                btn.onclick = () => this.startSuddenDeath(cat);
                grid.appendChild(btn);
            });
            this.updateRerollButton();
        }
    },

    updateRerollButton: function() {
        const container = document.getElementById('reroll-container');
        if (!container) return;
        const canAfford = this.player.credits >= this.bossRerollCost;
        container.innerHTML = `<button id="reroll-btn" ${canAfford ? '' : 'disabled'} onclick="gameState.rerollBossCategories()">RE-ROLL for new Categories [${this.bossRerollCost} Credits]</button>`;
    },

    rerollBossCategories: function() {
        if (this.player.credits >= this.bossRerollCost) {
            this.player.credits -= this.bossRerollCost;
            this.bossRerollCost *= 2;
            this.updateHUD();
            this.renderBossCategories();
        }
    },

    pickQuestion: function(bank, category) {
        const questions = bank[category];
        if (!questions || questions.length === 0) {
            console.warn(`pickQuestion: no questions found for category "${category}"`);
            return { q: "???", a: ["A", "B", "C", "D"], correct: "A" };
        }
        const key = (bank === questionBankHard ? 'hard:' : 'normal:') + category;
        if (!this.player.usedQuestions[key]) this.player.usedQuestions[key] = new Set();
        const used = this.player.usedQuestions[key];
        // Reset if all questions in this category have been seen
        if (used.size >= questions.length) used.clear();
        const available = questions.map((_, i) => i).filter(i => !used.has(i));
        const idx = available[Math.floor(Math.random() * available.length)];
        used.add(idx);
        const q = { ...questions[idx] };
        q.a = [...q.a].sort(() => Math.random() - 0.5);
        return q;
    },

    startSuddenDeath: function(category) {
        const bossIcon = document.getElementById('boss-icon');
        const transferContainer = document.getElementById('boss-sprite-transfer');
        const bossUI = document.getElementById('boss-ui');
        const triviaBox = document.getElementById('trivia-box');
        
        // Move the icon into the trivia box for the fight
        transferContainer.appendChild(bossIcon);
        bossUI.classList.add('hidden');
        triviaBox.classList.remove('hidden');

        const bossBank = this.activeStudyBank
            ? { [this.activeStudyLabel]: this.activeStudyBank }
            : questionBankHard;
        const qData = this.pickQuestion(bossBank, category);

        document.getElementById('category-label').innerText = `CRITICAL: ${category.replace(/_/g, ' ')}`;
        document.getElementById('question-text').innerText = qData.q;
        const grid = document.getElementById('answer-grid');
        grid.innerHTML = "";

        const laserIdx = this.player.modules.findIndex(m => m?.id === 'laser');
        if (laserIdx !== -1) {
            const lBtn = document.createElement('button');
            lBtn.id = "laser-action-btn";
            lBtn.innerText = "ACTIVATE DEFENSE LASER (1-USE)";
            lBtn.onclick = () => {
                const wrong = Array.from(grid.querySelectorAll('button')).filter(b => b.innerText !== qData.correct && b.style.visibility !== "hidden");
                if (wrong.length > 0) wrong[Math.floor(Math.random()*wrong.length)].style.visibility = "hidden";
                this.player.modules[laserIdx] = null;
                this.renderModules();
                lBtn.remove();
            };
            triviaBox.prepend(lBtn);
        }

        qData.a.forEach((opt) => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.onclick = () => {
                if (document.getElementById('laser-action-btn')) document.getElementById('laser-action-btn').remove();
                if (opt === qData.correct) {
                    this.correctAnswers++;
                    this.correctAnswersHard++;
                    if (!this.categoryStatsHard[category]) this.categoryStatsHard[category] = { correct: 0, wrong: 0 };
                    this.categoryStatsHard[category].correct++;
                    this._suppressAscend = true;
                    this.playAscend();
                    if (this.currentSector === 3) {
                        // CLEANUP before victory to prevent blank screen overlap
                        triviaBox.classList.add('hidden');
                        this.showVictoryScreen();
                    } else {
                        // Normal transition for Sectors 1 and 2
                        this.currentStage++;
                        this.highestStageReached = Math.max(this.highestStageReached, (this.currentSector - 1) * 10 + this.currentStage);
                        const rewardAmount = Math.floor(Math.random() * (30 - 20 + 1) + 20);
                        this.player.trivium += rewardAmount;
                        this.updateHUD();
                        // Move boss back to its home
                        document.getElementById('boss-sprite-container').appendChild(bossIcon);
                        this.showFeedback(true, `Threat Neutralized! +${rewardAmount} Trivium recovered. Preparing for warp to next sector...`, "CORRECT!", qData.explanation);
                    }
                } else {
                    this.wrongAnswers++;
                    this.wrongAnswersHard++;
                    if (!this.categoryStatsHard[category]) this.categoryStatsHard[category] = { correct: 0, wrong: 0 };
                    this.categoryStatsHard[category].wrong++;
                    this._suppressAscend = true;
                    this.playDescend();
                    if (this.currentSector === 3) {
                        this.player.trivium = Math.max(0, this.player.trivium - 30);
                        this.updateHUD();
                        triviaBox.classList.add('hidden');
                        document.getElementById('boss-sprite-container').appendChild(bossIcon);
                        if (!this.easyMode && this.player.trivium <= 0) {
                            this.showFeedback(false, `${this.sectorData[3].bossName} has drained your last Trivium reserves.\n\nThe correct answer was: ${qData.correct}`, "SYSTEMS FAILURE", qData.explanation, this.buildStatsHtml());
                        } else {
                            this.showFeedback(false, `-30 Trivium. ${this.sectorData[3].bossName} is not finished. Regroup and face them again...\n\nThe correct answer was: ${qData.correct}`, "REPELLED — RETRY", qData.explanation);
                        }
                    } else {
                        this.currentStage++;
                        this.highestStageReached = Math.max(this.highestStageReached, (this.currentSector - 1) * 10 + this.currentStage);
                        this.updateHUD();
                        document.getElementById('boss-sprite-container').appendChild(bossIcon);
                        this.showFeedback(false, `The boss repelled your assault — no Trivium recovered. Limping into the next sector...\n\nThe correct answer was: ${qData.correct}`, "BOSS REPELLED YOU", qData.explanation);
                    }
                }
            };
            grid.appendChild(btn);
        });

        this.terryQuestionCount++;
        const removeOneWrong = () => {
            const wrong = Array.from(grid.querySelectorAll('button')).filter(b => b.innerText !== qData.correct && b.style.visibility !== "hidden");
            if (wrong.length > 0) wrong[Math.floor(Math.random() * wrong.length)].style.visibility = "hidden";
        };
        if (this.player.modules.some(m => m?.id === 'gatling_laser')) removeOneWrong();
        const _vertAdj = [[3],[4],[5],[0],[1],[2]];
        this.player.crew.forEach((m, idx) => {
            if (!m || m.id !== 'terry') return;
            const amped = _vertAdj[idx].some(i => this.player.crew[i]?.id === 'amp_anteater');
            const fires = amped ? (this.terryQuestionCount % 3 !== 0) : (this.terryQuestionCount % 3 === 0);
            if (fires) removeOneWrong();
        });
    },

    startTrivia: function(category, reward, isHard = false) {
        document.getElementById('choice-container').classList.add('hidden');
        const tBox = document.getElementById('trivia-box');
        tBox.classList.remove('hidden');
        const sourceBank = this.activeStudyBank
            ? { [this.activeStudyLabel]: this.activeStudyBank }
            : (isHard ? questionBankHard : questionBank);
        let qData;
        try {
            qData = this.pickQuestion(sourceBank, category);
        } catch(e) {
            console.error('pickQuestion error:', e);
            this.showFeedback(false, 'JS Error in pickQuestion: ' + e.message + ' | cat=' + category, 'DEBUG ERROR');
            return;
        }
        if (!qData || !qData.a) {
            console.error('pickQuestion returned bad data:', qData, 'for category:', category);
            this.showFeedback(false, 'Bad question data for: ' + category + ' | bank keys: ' + Object.keys(sourceBank).slice(0,3).join(','), 'DEBUG ERROR');
            return;
        }
        document.getElementById('category-label').innerText = category.replace(/_/g, ' ');
        document.getElementById('question-text').innerText = qData.q;
        const grid = document.getElementById('answer-grid');
        grid.innerHTML = "";

        const laserIdx = this.player.modules.findIndex(m => m?.id === 'laser');
        if (laserIdx !== -1) {
            const lBtn = document.createElement('button');
            lBtn.id = "laser-action-btn";
            lBtn.innerText = "ACTIVATE DEFENSE LASER (1-USE)";
            lBtn.onclick = () => {
                const wrong = Array.from(grid.querySelectorAll('button')).filter(b => b.innerText !== qData.correct && b.style.visibility !== "hidden");
                if (wrong.length > 0) wrong[Math.floor(Math.random()*wrong.length)].style.visibility = "hidden";
                this.player.modules[laserIdx] = null;
                this.renderModules();
                lBtn.remove();
            };
            tBox.prepend(lBtn);
        }

        qData.a.forEach((opt) => {
            const btn = document.createElement('button');
            btn.innerText = opt;
            btn.onclick = () => {
                if (document.getElementById('laser-action-btn')) document.getElementById('laser-action-btn').remove();
                let isCorrect = (opt === qData.correct);
                let bonusText = "";
                let finalVal = reward.val;

                if (isCorrect && reward.type === 'Trivium' && this.player.modules.some(m => m?.id === 'accumulator')) {
                    finalVal = Math.ceil(finalVal * 1.5);
                    bonusText = " (+50% Amplifier!)";
                }

                // disable all answer buttons immediately to prevent double-click
                grid.querySelectorAll('button').forEach(b => b.disabled = true);

                // snapshot resource values BEFORE any changes
                const oldFood    = this.player.food;
                const oldTrivium = this.player.trivium;
                const oldCredits = this.player.credits;

                const resKey = reward.type.toLowerCase();

                if (isCorrect) {
                    this.correctAnswers++;
                    if (isHard) { this.correctAnswersHard++; } else { this.correctAnswersNormal++; }
                    const catBucket = isHard ? this.categoryStatsHard : this.categoryStats;
                    if (!catBucket[category]) catBucket[category] = { correct: 0, wrong: 0 };
                    catBucket[category].correct++;
                    this.player[resKey] += finalVal;
                } else {
                    this.wrongAnswers++;
                    if (isHard) { this.wrongAnswersHard++; } else { this.wrongAnswersNormal++; }
                    const catBucket = isHard ? this.categoryStatsHard : this.categoryStats;
                    if (!catBucket[category]) catBucket[category] = { correct: 0, wrong: 0 };
                    catBucket[category].wrong++;
                    this._suppressAscend = true;
                    this.playDescend();
                }

                const { foodNet, triviumNet, creditNet } = this.getJumpCosts();
                this.player.food    += foodNet;
                this.player.trivium += triviumNet;
                this.player.credits += creditNet;
                this.updateHUD();

                // show feedback popup immediately
                if (!this.easyMode && (this.player.food <= 0 || this.player.trivium <= 0)) {
                    const outOf = this.player.food <= 0 && this.player.trivium <= 0 ? "FOOD and TRIVIUM" : this.player.food <= 0 ? "FOOD" : "TRIVIUM";
                    const jumpNote = isCorrect
                        ? `You answered correctly, but the jump cost of ${outOf} drained your last reserves. The ship has no power to continue.`
                        : `You answered incorrectly. The jump cost then consumed your remaining ${outOf}, leaving nothing to continue.`;
                    this.showFeedback(false, `${jumpNote}\n\nThe correct answer was: ${qData.correct}`, `SYSTEMS FAILURE: OUT OF ${outOf}`, qData.explanation, this.buildStatsHtml());
                } else {
                    this.currentStage++;
                    this.highestStageReached = Math.max(this.highestStageReached, (this.currentSector - 1) * 10 + this.currentStage);
                    const msg   = isCorrect ? "" : `Incorrect. The correct answer was ${qData.correct}.`;
                    const title = isCorrect ? `CORRECT! +${finalVal} ${reward.type}${bonusText}` : "Incorrect";
                    this.showFeedback(isCorrect, msg, title, qData.explanation);
                }

                // animate all resource stats from old → new over the jump animation period
                const DURATION = this.jumpAnimDuration;
                this.jumpAnimActive = true;
                const enginesEl = document.getElementById('ship-engines');
                if (enginesEl) enginesEl.classList.add('jump-active');
                setTimeout(() => {
                    this.jumpAnimActive = false;
                    if (enginesEl) enginesEl.classList.remove('jump-active');
                }, DURATION);
                const pairs = [
                    ['food-stat',    oldFood,    this.player.food],
                    ['trivium-stat', oldTrivium, this.player.trivium],
                    ['credits-stat', oldCredits, this.player.credits],
                ].filter(([, s, e]) => s !== e);

                if (pairs.length) {
                    const catLabel = document.getElementById('category-label');
                    if (isCorrect && catLabel) {
                        catLabel.style.color      = '#00ff88';
                        catLabel.style.textShadow = '0 0 12px #00ff88';
                        setTimeout(() => { catLabel.style.color = ''; catLabel.style.textShadow = ''; }, DURATION);
                    }
                    // colour each stat and its label green/red based on direction
                    pairs.forEach(([id, start, end]) => {
                        const color = end > start ? '#00ff88' : '#ff4444';
                        const statEl  = document.getElementById(id);
                        const labelEl = document.getElementById(id.replace('-stat', '-label'));
                        if (statEl)  statEl.style.color  = color;
                        if (labelEl) labelEl.style.color = color;
                    });
                    setTimeout(() => {
                        pairs.forEach(([id]) => {
                            const statEl  = document.getElementById(id);
                            const labelEl = document.getElementById(id.replace('-stat', '-label'));
                            if (statEl)  statEl.style.color  = '';
                            if (labelEl) labelEl.style.color = '';
                        });
                    }, DURATION);
                    const t0 = performance.now();
                    const tick = (now) => {
                        const p     = Math.min((now - t0) / DURATION, 1);
                        const eased = 1 - Math.pow(1 - p, 2);
                        pairs.forEach(([id, start, end]) => {
                            const el = document.getElementById(id);
                            if (el) el.innerText = Math.round(start + (end - start) * eased);
                        });
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            };
            grid.appendChild(btn);
        });

        this.terryQuestionCount++;
        const removeOneWrong = () => {
            const wrong = Array.from(grid.querySelectorAll('button')).filter(b => b.innerText !== qData.correct && b.style.visibility !== "hidden");
            if (wrong.length > 0) wrong[Math.floor(Math.random() * wrong.length)].style.visibility = "hidden";
        };
        if (this.player.modules.some(m => m?.id === 'gatling_laser')) removeOneWrong();
        const _vertAdj = [[3],[4],[5],[0],[1],[2]];
        this.player.crew.forEach((m, idx) => {
            if (!m || m.id !== 'terry') return;
            const amped = _vertAdj[idx].some(i => this.player.crew[i]?.id === 'amp_anteater');
            const fires = amped ? (this.terryQuestionCount % 3 !== 0) : (this.terryQuestionCount % 3 === 0);
            if (fires) removeOneWrong();
        });
    },

    openTavern: function() {
        this.gameScreen.classList.add('hidden');
        document.getElementById('spaceship-floor').classList.add('hidden');
        document.getElementById('minimap').classList.add('hidden');
        document.getElementById('tavern-screen').classList.remove('hidden');
        const container = document.getElementById('buddy-offers');
        container.innerHTML = "";
        const available = this.buddies.filter(b => !this.player.crew.some(m => m?.id === b.id));
        const _avail = [...available];
        for (let _i = _avail.length - 1; _i > 0; _i--) { const _j = Math.floor(Math.random() * (_i + 1)); [_avail[_i], _avail[_j]] = [_avail[_j], _avail[_i]]; }
        const selections = _avail.slice(0, 2);
        selections.forEach(buddy => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `<div style="background-image: url('${buddy.gif}'); width: 50px; height: 50px; margin: 0 auto; background-size: contain; background-repeat: no-repeat;"></div><h4>${buddy.name}</h4><p>${buddy.desc}</p><button class="buy-btn" onclick="gameState.recruitBuddy('${buddy.id}')">RECRUIT</button>`;
            container.appendChild(div);
        });
    },

    recruitBuddy: function(buddyId) {
        const buddy = this.buddies.find(b => b.id === buddyId);
        const emptySlot = this.player.crew.indexOf(null);
        if (emptySlot !== -1) {
            this.player.crew[emptySlot] = { ...buddy };
            this.renderModules();
            this.updateHUD();
            this.closeTavern();
        } else {
            this.showFeedback(false, "All crew quarters are occupied.", "NO SPACE AVAILABLE");
        }
    },

    closeTavern: function() {
        document.getElementById('tavern-screen').classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        document.getElementById('spaceship-floor').classList.remove('hidden');
        document.getElementById('minimap').classList.remove('hidden');
        this.generatePlanets();
    },

    openEvent: function() {
        const available = this.events.filter(e => !this.usedEventIds.has(e.id));
        if (available.length === 0) { this.generatePlanets(); return; }
        const event = available[Math.floor(Math.random() * available.length)];
        this.usedEventIds.add(event.id);

        this.gameScreen.classList.add('hidden');
        document.getElementById('spaceship-floor').classList.add('hidden');
        document.getElementById('minimap').classList.add('hidden');
        const screen = document.getElementById('event-screen');
        screen.classList.remove('hidden');

        document.getElementById('event-resources').innerHTML =
            `FOOD: <b>${this.player.food}</b> &nbsp;|&nbsp; TRIVIUM: <b>${this.player.trivium}</b> &nbsp;|&nbsp; CREDITS: <b>${this.player.credits}</b>`;
        document.getElementById('event-title').innerText = `EVENT: ${event.title}`;
        document.getElementById('event-story').innerText = event.story;
        const img = document.getElementById('event-image');
        img.style.backgroundImage = event.image ? `url('${event.image}')` : 'none';

        const optContainer = document.getElementById('event-options');
        optContainer.innerHTML = '';
        event.options.forEach((opt, i) => {
            const canAfford = !opt.cost || Object.entries(opt.cost).every(([res, amt]) => this.player[res] >= amt);
            const rewardText = Object.entries(opt.reward).map(([r, v]) => `+${v} ${r.charAt(0).toUpperCase() + r.slice(1)}`).join(', ');

            const div = document.createElement('div');
            div.className = 'event-option' + (canAfford ? '' : ' unaffordable');
            div.innerHTML = `
                <h4>${opt.label}</h4>
                <p>${opt.desc}</p>
                ${opt.cost ? `<span class="event-cost">${opt.costLabel}</span>` : ''}
                <span class="event-reward">${rewardText}</span>
                <button ${canAfford ? `onclick="gameState.applyEventOption(${i}, '${event.id}')"` : 'disabled'}>
                    ${canAfford ? 'CHOOSE' : 'CANNOT AFFORD'}
                </button>
            `;
            optContainer.appendChild(div);
        });
    },

    applyEventOption: function(optionIndex, eventId) {
        const event = this.events.find(e => e.id === eventId);
        const opt = event.options[optionIndex];
        if (opt.cost) {
            Object.entries(opt.cost).forEach(([res, amt]) => { this.player[res] -= amt; });
        }
        this.updateHUD();

        if (opt.specialAction === 'clone_buddy') {
            this.showBuddyClonePicker();
            return;
        }

        if (opt.specialAction === 'add_one_buddy') {
            const added = [];
            const emptySlot = this.player.crew.indexOf(null);
            if (emptySlot !== -1) {
                const buddy = this.buddies[Math.floor(Math.random() * this.buddies.length)];
                this.player.crew[emptySlot] = { ...buddy };
                added.push(buddy.name);
            }
            this.renderModules();
            document.getElementById('event-screen').classList.add('hidden');
            this.gameScreen.classList.remove('hidden');
            document.getElementById('spaceship-floor').classList.remove('hidden');
            document.getElementById('minimap').classList.remove('hidden');
            this.eventJustCompleted = true;
            const msg = added.length === 0
                ? 'A figure emerged from the darkness, but your crew quarters were already full. They slipped back into the void.'
                : `A visitor emerged from the darkness: ${added[0]}.`;
            this.showFeedback(true, msg, 'FROM THE WHALE');
            return;
        }

        Object.entries(opt.reward).forEach(([res, amt]) => { this.player[res] += amt; });
        this.updateHUD();

        const rewardText = Object.entries(opt.reward).map(([r, v]) => `+${v} ${r.charAt(0).toUpperCase() + r.slice(1)}`).join(', ');
        const costText = opt.cost ? ` (${opt.costLabel})` : '';
        document.getElementById('event-screen').classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        document.getElementById('spaceship-floor').classList.remove('hidden');
        document.getElementById('minimap').classList.remove('hidden');
        this.eventJustCompleted = true;
        this.showFeedback(true, `${rewardText}${costText}`, opt.label.toUpperCase());
    },

    showBuddyClonePicker: function() {
        const crew = this.player.crew.filter(m => m !== null);
        const emptySlot = this.player.crew.indexOf(null);
        const optContainer = document.getElementById('event-options');
        const titleEl = document.getElementById('event-title');
        const storyEl = document.getElementById('event-story');

        titleEl.innerText = 'CLONE A CREW MEMBER';

        if (crew.length === 0) {
            storyEl.innerText = 'The Janitor looks at your empty quarters. "Come back when you have someone worth duplicating," he says.';
            optContainer.innerHTML = `<button onclick="gameState.finishCloneEvent(null)">LEAVE</button>`;
            return;
        }
        if (emptySlot === -1) {
            storyEl.innerText = 'Your crew quarters are full — there is no room to house a clone. The Janitor shrugs apologetically.';
            optContainer.innerHTML = `<button onclick="gameState.finishCloneEvent(null)">LEAVE</button>`;
            return;
        }

        storyEl.innerText = 'The Janitor gestures toward a humming cloning pod. "Choose who you wish to duplicate."';
        optContainer.innerHTML = '';
        crew.forEach(buddy => {
            const div = document.createElement('div');
            div.className = 'event-option';
            div.innerHTML = `
                <div style="background-image:url('${buddy.gif}'); width:50px; height:50px; margin:0 auto; background-size:contain; background-repeat:no-repeat;"></div>
                <h4>${buddy.name}</h4>
                <p>${buddy.desc}</p>
                <button onclick="gameState.finishCloneEvent('${buddy.id}')">CLONE</button>
            `;
            optContainer.appendChild(div);
        });
    },

    finishCloneEvent: function(buddyId) {
        if (buddyId) {
            const original = this.buddies.find(b => b.id === buddyId);
            const emptySlot = this.player.crew.indexOf(null);
            if (original && emptySlot !== -1) {
                this.player.crew[emptySlot] = { ...original };
                this.renderModules();
            }
        }
        document.getElementById('event-screen').classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        document.getElementById('spaceship-floor').classList.remove('hidden');
        document.getElementById('minimap').classList.remove('hidden');
        this.eventJustCompleted = true;
        const msg = buddyId
            ? `A perfect copy steps out of the pod, ready to serve. Your crew quarters now hold two ${this.buddies.find(b => b.id === buddyId)?.name || 'crew members'}.`
            : 'You leave without a clone.';
        this.showFeedback(true, msg, 'CLONING COMPLETE');
    },

    debugJumpToBoss: function() {
        if (!this.player) {
            this.player = { name: "Debug", food: 10, trivium: 10, credits: 0, type: "latke", modules: [null, null, null, null], crew: [null, null, null, null, null, null], usedQuestions: {} };
        }
        if (this.easyMode === undefined) this.easyMode = false;
        if (!this.runType) this.runType = 'hardcore';
        if (this.activeStudyBank === undefined) this.activeStudyBank = null;
        if (this.activeStudyLabel === undefined) this.activeStudyLabel = null;
        if (!this.categoryStats)     this.categoryStats = {};
        if (!this.categoryStatsHard) this.categoryStatsHard = {};
        if (!this.correctAnswersNormal) this.correctAnswersNormal = 0;
        if (!this.wrongAnswersNormal)   this.wrongAnswersNormal = 0;
        if (!this.correctAnswersHard)   this.correctAnswersHard = 0;
        if (!this.wrongAnswersHard)     this.wrongAnswersHard = 0;
        if (!this.correctAnswers) this.correctAnswers = 0;
        if (!this.wrongAnswers)   this.wrongAnswers = 0;
        if (!this.usedEventIds)   this.usedEventIds = new Set();

        this.currentSector = 3;
        this.currentStage = 10;
        this.bossRerollCost = 2;
        this.player.food = 10;
        this.player.trivium = 10;

        const data = this.sectorData[3];
        document.body.style.backgroundImage = data.background;

        document.getElementById('menu-screen').classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        document.getElementById('spaceship-floor').classList.remove('hidden');
        document.getElementById('minimap').classList.remove('hidden');

        this.updateHUD();
        this.triggerBossEncounter();
        console.log("Debug: Warped to Sector 3 Boss.");
    },

    getJumpCosts: function() {
        let foodNet = -5;
        let triviumNet = -({ 1: 5, 2: 10, 3: 20 }[this.currentSector] || 5);
        let creditNet = 0;

        this.player.modules.forEach(m => {
            if (!m) return;
            if (m.id === 'biosphere') foodNet += 4;
            if (m.id === 'content_farm') { foodNet += 2; creditNet += 6; triviumNet -= 1; }
        });

        const vertAdjMap = [[3],[4],[5],[0],[1],[2]];
        const crewAdjMap = [[1,3],[0,2,4],[1,5],[0,4],[1,3,5],[2,4]];
        const isAmped = (idx) => vertAdjMap[idx].some(i => this.player.crew[i]?.id === 'amp_anteater');

        this.player.crew.forEach((m, idx) => {
            if (!m) return;
            const mult = isAmped(idx) ? 2 : 1;
            if (m.id === 'octopus') {
                const adjCount = crewAdjMap[idx].filter(i => this.player.crew[i] !== null).length;
                foodNet += (2 + adjCount * 1) * mult;
            }
            if (m.id === 'aardvark') creditNet += 4 * mult;
            if (m.id === 'trivia_toad') { foodNet -= 1 * mult; triviumNet += 4 * mult; }
            if (m.id === 'bear_bot') { foodNet += 1 * mult; triviumNet += 1 * mult; creditNet += 1 * mult; }
        });

        if (this.player.modules.some(m => m?.id === 'gaming_lounge')) {
            const crewCount = this.player.crew.filter(m => m !== null).length;
            foodNet -= crewCount;
            triviumNet += crewCount * 3;
        }
        return { foodNet, triviumNet, creditNet };
    },

    getJumpCostBreakdown: function() {
        const baseTrivium = -({ 1: 5, 2: 10, 3: 20 }[this.currentSector] || 5);
        const food = [`Base Jump Cost: -5`];
        const trivium = [`Sector ${this.currentSector} Jump Cost: ${baseTrivium}`];
        const credits = [`Base: 0`];
        this.player.modules.forEach(m => {
            if (!m) return;
            if (m.id === 'biosphere')    food.push('Biosphere: +4');
            if (m.id === 'content_farm') { food.push('Content Farm: +2'); credits.push('Content Farm: +6'); trivium.push('Content Farm: -1'); }
        });

        const vertAdjMap = [[3],[4],[5],[0],[1],[2]];
        const crewAdjMap = [[1,3],[0,2,4],[1,5],[0,4],[1,3,5],[2,4]];
        const isAmped = (idx) => vertAdjMap[idx].some(i => this.player.crew[i]?.id === 'amp_anteater');

        this.player.crew.forEach((m, idx) => {
            if (!m) return;
            const mult = isAmped(idx) ? 2 : 1;
            const amp = mult === 2 ? ' (2x Amp)' : '';
            if (m.id === 'octopus') {
                const adjCount = crewAdjMap[idx].filter(i => this.player.crew[i] !== null).length;
                food.push(`Hydroponic Octopus: +${(2 + adjCount * 1) * mult}${amp} (${adjCount} adjacent)`);
            }
            if (m.id === 'aardvark')    credits.push(`Arbitrage Aardvark: +${4 * mult}${amp}`);
            if (m.id === 'trivia_toad') { food.push(`Trivia Toad: -${mult}${amp}`); trivium.push(`Trivia Toad: +${4 * mult}${amp}`); }
            if (m.id === 'bear_bot')    { food.push(`Bear Bot: +${mult}${amp}`); trivium.push(`Bear Bot: +${mult}${amp}`); credits.push(`Bear Bot: +${mult}${amp}`); }
        });
        if (this.player.modules.some(m => m?.id === 'gaming_lounge')) {
            const crewCount = this.player.crew.filter(m => m !== null).length;
            food.push(`Gaming Lounge: -${crewCount} (${crewCount} crew)`);
            trivium.push(`Gaming Lounge: +${crewCount * 3} (${crewCount} crew)`);
        }
        return { food, trivium, credits };
    },

    updateHUD: function() {
        this.player.food = Math.min(999, Math.max(0, this.player.food));
        this.player.trivium = Math.min(999, Math.max(0, this.player.trivium));
        this.player.credits = Math.min(999, Math.max(0, this.player.credits));

        document.getElementById('food-stat').innerText = this.player.food;
        document.getElementById('trivium-stat').innerText = this.player.trivium;
        document.getElementById('credits-stat').innerText = this.player.credits;

        const sectorSpan = document.getElementById('current-sector');
        if (sectorSpan) {
            sectorSpan.innerText = this.currentSector === 1 ? "SOL SYSTEM" : this.currentSector === 2 ? "MILKY WAY" : "GALACTIC CORE";
        }
        document.getElementById('current-stage').innerText = this.currentStage;

        const { foodNet, triviumNet, creditNet } = this.getJumpCosts();
        const foodDanger = this.player.food + foodNet * 2 <= 0;
        const triviumDanger = this.player.trivium + triviumNet * 2 <= 0;
        const eitherDanger = foodDanger || triviumDanger;
        document.getElementById('stockpiled-label').classList.toggle('low-resource', eitherDanger);
        document.getElementById('food-stat').classList.toggle('low-resource', foodDanger);
        document.getElementById('food-label').classList.toggle('low-resource', foodDanger);
        document.getElementById('trivium-stat').classList.toggle('low-resource', triviumDanger);
        document.getElementById('trivium-label').classList.toggle('low-resource', triviumDanger);

        const fCostEl = document.getElementById('food-cost');
        const tCostEl = document.getElementById('trivium-cost');
        const cGainEl = document.getElementById('credit-gain');
        const formatNet = (val) => (val >= 0 ? `+${val}` : `${val}`);

        if (fCostEl) { fCostEl.innerText = `${formatNet(foodNet)} FOOD`; fCostEl.style.color = foodNet >= 0 ? "#00ff88" : "#ff4444"; }
        if (tCostEl) { tCostEl.innerText = `${formatNet(triviumNet)} TRIVIUM`; tCostEl.style.color = triviumNet >= 0 ? "#00ff88" : "#ff4444"; }
        if (cGainEl) { cGainEl.innerText = `${formatNet(creditNet)} CREDITS`; cGainEl.style.color = creditNet > 0 ? "#00f2ff" : "#888"; }

        const bd = this.getJumpCostBreakdown();
        const foodTip = bd.food.join('\n');
        const triviumTip = bd.trivium.join('\n');
        const creditTip = bd.credits.join('\n');
        ['food-label', 'food-cost'].forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute('data-tooltip', foodTip); });
        ['trivium-label', 'trivium-cost'].forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute('data-tooltip', triviumTip); });
        ['credits-label', 'credit-gain'].forEach(id => { const el = document.getElementById(id); if (el) el.setAttribute('data-tooltip', creditTip); });
        this.updateMinimap();
    },

    updateMinimap: function() {
        const minimap = document.getElementById('minimap');
        if (!minimap) return;
        const hidden = id => document.getElementById(id)?.classList.contains('hidden') ?? true;
        // Stages 4, 6, 8 each serve double duty: the special screen AND the following
        // trivia. Once the special screen is gone, advance past its node.
        let activeIdx;
        if      (this.currentStage === 4 && hidden('tavern-screen')) activeIdx = 4;  // "4"
        else if (this.currentStage === 6 && hidden('event-screen'))  activeIdx = 7;  // "6"
        else if (this.currentStage === 8 && hidden('shop-screen'))   activeIdx = 10; // "8"
        else {
            // Full mapping: nodes 0-12, with phantom nodes 5,8,11 for stages 5,7,9
            const stageNodeIdx = { 1:0, 2:1, 3:2, 4:3, 5:5, 6:6, 7:8, 8:9, 9:11, 10:12 };
            activeIdx = stageNodeIdx[this.currentStage] ?? 0;
        }
        const stops = minimap.querySelectorAll('.minimap-stop');
        const connectors = minimap.querySelectorAll('.minimap-connector');
        stops.forEach((stop, idx) => {
            stop.classList.toggle('active',   idx === activeIdx);
            stop.classList.toggle('visited',  idx < activeIdx);
        });
        connectors.forEach((conn, idx) => {
            conn.classList.toggle('visited', idx < activeIdx);
        });
    },

    initParticles: function() {
        const canvas = document.getElementById('particle-canvas');
        if (!canvas) return;

        const MARGIN_PX   = Math.round(0.25 * 96); // 0.25 inches
        const COUNT       = 27;
        const BASE_MIN    = 0.8;
        const BASE_MAX    = 2.2;

        const mkParticle = (w, h) => ({
            x:       Math.random() * w,
            y:       Math.random() * h,
            r:       0.8 + Math.random() * 1.4,
            speed:   BASE_MIN + Math.random() * (BASE_MAX - BASE_MIN),
            opacity: 0.2 + Math.random() * 0.5,
        });

        let particles = [];
        let lastW = 0, lastH = 0;

        const syncCanvas = () => {
            const ship = document.getElementById('spaceship-floor');
            if (!ship || ship.classList.contains('hidden')) {
                canvas.style.display = 'none';
                return false;
            }
            const rect = ship.getBoundingClientRect();
            const w = window.innerWidth;
            const h = Math.round(rect.height + MARGIN_PX * 2);
            canvas.style.top = (rect.top - MARGIN_PX) + 'px';
            canvas.style.display = 'block';
            if (w !== lastW || h !== lastH) {
                canvas.width  = w;
                canvas.height = h;
                lastW = w; lastH = h;
                particles = Array.from({ length: COUNT }, () => mkParticle(w, h));
            }
            return true;
        };

        window.addEventListener('resize', () => { lastW = 0; });

        const ctx = canvas.getContext('2d');

        const tick = () => {
            if (!syncCanvas()) { requestAnimationFrame(tick); return; }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const speedMult = this.jumpAnimActive ? 5 : 1;

            particles.forEach(p => {
                p.x -= p.speed * speedMult;
                if (p.x + p.r < 0) {
                    p.x       = canvas.width + p.r;
                    p.y       = Math.random() * canvas.height;
                    p.opacity = 0.2 + Math.random() * 0.5;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
    },

    getRunStats: function() {
        const totalStages = (this.currentSector - 1) * 10 + this.currentStage;
        return `Reached Stage ${totalStages}/30 (Sector ${this.currentSector}) — ${this.correctAnswers} correct, ${this.wrongAnswers} incorrect.`;
    },

    buildStatsHtml: function() {
        const isStudy = !!this.activeStudyBank;
        const cn = this.correctAnswersNormal;
        const ch = this.correctAnswersHard;
        const wn = this.wrongAnswersNormal;
        const wh = this.wrongAnswersHard;
        const totalCorrect = cn + ch;
        const totalWrong   = wn + wh;
        const total = totalCorrect + totalWrong;
        const totalStages = (this.currentSector - 1) * 10 + this.currentStage;

        const canvasId = 'run-stats-pie-' + Date.now();

        let legendHtml, slices;
        if (isStudy) {
            legendHtml = `
                <div><span style="display:inline-block;width:12px;height:12px;background:#6ddb6d;margin-right:6px;vertical-align:middle;"></span>Correct: ${totalCorrect}</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#ff7a7a;margin-right:6px;vertical-align:middle;"></span>Wrong: ${totalWrong}</div>`;
            slices = [
                { val: totalCorrect, color: '#6ddb6d' },
                { val: totalWrong,   color: '#ff7a7a' },
            ];
        } else {
            const _bestNormal = Object.entries(this.categoryStats).filter(([,v]) => v.correct > 1).sort((a,b) => b[1].correct - a[1].correct)[0];
            const _bestHard   = Object.entries(this.categoryStatsHard).filter(([,v]) => v.correct > 1).sort((a,b) => b[1].correct - a[1].correct)[0];
            const topNormal = _bestNormal ? `${_bestNormal[0].replace(/_/g,' ')} (${_bestNormal[1].correct}/${_bestNormal[1].correct + _bestNormal[1].wrong})` : null;
            const topHard   = _bestHard   ? `${_bestHard[0].replace(/_/g,' ')} (${_bestHard[1].correct}/${_bestHard[1].correct + _bestHard[1].wrong})` : null;
            legendHtml = `
                <div><span style="display:inline-block;width:12px;height:12px;background:#6ddb6d;margin-right:6px;vertical-align:middle;"></span>Correct Normal: ${cn}</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#1a7a1a;margin-right:6px;vertical-align:middle;"></span>Correct Hard: ${ch}</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#ff7a7a;margin-right:6px;vertical-align:middle;"></span>Wrong Normal: ${wn}</div>
                <div><span style="display:inline-block;width:12px;height:12px;background:#7a1a1a;margin-right:6px;vertical-align:middle;"></span>Wrong Hard: ${wh}</div>
                ${(topNormal || topHard) ? `<div style="margin-top:6px;">
                    ${topNormal ? `<div><span style="color:#6ddb6d;">Top Normal:</span> ${topNormal}</div>` : ''}
                    ${topHard   ? `<div><span style="color:#1aaa1a;">Top Hard:</span> ${topHard}</div>` : ''}
                </div>` : ''}`;
            slices = [
                { val: cn, color: '#6ddb6d' },
                { val: ch, color: '#1a7a1a' },
                { val: wn, color: '#ff7a7a' },
                { val: wh, color: '#7a1a1a' },
            ];
        }

        const html = `
        <div style="margin-top:10px;padding:8px;border:1px solid rgba(0,242,255,0.3);font-size:0.85em;color:#a0f9ff;">
            Reached Stage ${totalStages}/30 (Sector ${this.currentSector})
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-top:12px;flex-wrap:wrap;">
            <canvas id="${canvasId}" width="130" height="130"></canvas>
            <div style="font-size:0.78em;color:#ccc;text-align:left;line-height:1.8em;">${legendHtml}</div>
        </div>`;

        setTimeout(() => {
            const canvas = document.getElementById(canvasId);
            if (!canvas || total === 0) return;
            const ctx = canvas.getContext('2d');
            const cx = 65, cy = 65, r = 60;
            const activeSlices = slices.filter(s => s.val > 0);
            let angle = -Math.PI / 2;
            activeSlices.forEach(s => {
                const sweep = (s.val / total) * 2 * Math.PI;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, r, angle, angle + sweep);
                ctx.closePath();
                ctx.fillStyle = s.color;
                ctx.fill();
                angle += sweep;
            });
        }, 50);

        return html;
    },

    showRules: function() {
        document.getElementById('rules-overlay').classList.remove('hidden');
    },

    closeRules: function() {
        document.getElementById('rules-overlay').classList.add('hidden');
    },

    getAudioCtx: function() {
        if (!this._audioCtx) this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        return this._audioCtx;
    },

    playTone: function(direction) {
        if (!this._toneActive) return;
        try {
            const ctx = this.getAudioCtx();
            const freq = 65.41 * Math.pow(2, this.noteIndex / 12);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const t = ctx.currentTime;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.081, t + 0.045);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2.1);
            osc.start(t);
            osc.stop(t + 2.1);
            this.noteIndex = Math.min(this.noteIndex + 1, 36);
        } catch(e) {}
    },

    playDescend: function() {
        if (!this._toneActive) return;
        try {
            const ctx = this.getAudioCtx();
            const t = ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const idx = Math.max(0, this.noteIndex - i * 2);
                const freq = 65.41 * Math.pow(2, idx / 12);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const start = t + i * 0.18;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.081, start + 0.045);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 2.1);
                osc.start(start);
                osc.stop(start + 2.1);
            }
            this.noteIndex = Math.max(0, this.noteIndex - 6);
        } catch(e) {}
    },

    playAscend: function() {
        if (!this._toneActive) return;
        try {
            const ctx = this.getAudioCtx();
            const t = ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const idx = Math.min(36, this.noteIndex + i * 2);
                const freq = 65.41 * Math.pow(2, idx / 12);
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const start = t + i * 0.18;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.081, start + 0.045);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 2.1);
                osc.start(start);
                osc.stop(start + 2.1);
            }
            this.noteIndex = Math.min(36, this.noteIndex + 6);
        } catch(e) {}
    },

    confirmAbandon: function() {
        this._suppressAscend = true;
        this.playDescend();
        document.getElementById('abandon-overlay').classList.remove('hidden');
    },

    closeAbandon: function() {
        document.getElementById('abandon-overlay').classList.add('hidden');
    },

    returnToMenu: function() {
        this._toneActive = false;
        location.reload();
    }
};

window.onload = () => gameState.init();