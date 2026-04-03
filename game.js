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
            message: "Sector 1 Clear! Entering Sector 2: The Milky Way. Denser HARD Trivium asteroids are now availible for harvest. Warning: Interstellar Navigation requires 15 Trivium per Jump. Also, you're doing great!"
        },
        2: {
            background: "url('assets/background2.png')",
            bossSprite: "url('assets/boss2-idle.gif')",
            message: "Sector 2 Clear! Entering the Sector 3: The Galactic Core. The Core is treacherous requires 30 Trivium per Jump, but Trivial Nirvana awaits the brave! You got this! Onward to the core!"
        },
        3: {
            background: "url('assets/background3.jpg')",
            bossSprite: "url('assets/boss3-idle.gif')",
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
        crew: [null, null, null, null],
        usedQuestions: {}
    },
    bgMusic: new Audio('assets/space_music.mp3'),
    musicStarted: false,
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
        { id: 'accumulator', name: "Trivium Amplifier", cost: 20, desc: "Doubles all Trivium rewards from questions automatically.", icon: "✨" },
        { id: 'laser', name: "Defense Laser", cost: 5, desc: "1-Use: Remove a wrong answer during regular question.", icon: "🔫" },
        { id: 'biosphere', name: "Biosphere", cost: 10, desc: "Produces 4 Food per Jump.", icon: "🌿" },
        { id: 'content_farm', name: "Content Farm", cost: 12, desc: "+2 Food, +6 Credits, -1 Trivium per Jump.", icon: "🚜" },
        { id: 'gatling_laser', name: "Gatling Laser", cost: 60, desc: "Automatically eliminates one wrong answer on every question.", icon: "⚡" }
    ],

    buddies: [
        { id: 'octopus', name: "Hydroponic Octopus", desc: "Grows 2 Food per Jump, +1 Food per filled Module Bay.", icon: "🐙", gif: "assets/octopus_idle.gif" },
        { id: 'aardvark', name: "Arbitrage Aardvark", desc: "Generates 4 Credits for you per Jump.", icon: "🐜", gif: "assets/aardvark_idle.gif" },
        { id: 'trivia_toad', name: "Trivia Toad", desc: "Consumes 1 Food to produce 4 Trivium per Jump.", icon: "🐸", gif: "assets/toad_idle.gif" },
        { id: 'bear_bot', name: "Bear Bot", desc: "Produces 1 Food, 1 Trivium, 1 Credit per Jump.", icon: "🧸", gif: "assets/bear_idle.gif" },
        { id: 'terry', name: "Terry the Tardigrade", desc: "Eliminates one wrong answer automatically every 3rd question.", icon: "🐾", gif: "assets/terry_idle.gif" }
    ],

    events: gameEvents,

    // 2. ELEMENT GETTERS
    get introScreen() { return document.getElementById('intro-terminal'); },
    get menuScreen() { return document.getElementById('menu-screen'); },
    get charScreen() { return document.getElementById('char-screen'); },
    get gameScreen() { return document.getElementById('game-screen'); },
    get shopScreen() { return document.getElementById('shop-screen'); },

    // 3. CORE FUNCTIONS
    init: function() {
        console.log("Sequence Initiated...");
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.3;

        document.body.addEventListener('click', () => {
            if (!this.musicStarted) {
                this.bgMusic.play();
                this.musicStarted = true;
            }
        }, { once: true });

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
        this.introScreen.onclick = null; 
        this.introScreen.classList.add('hidden');
        this.menuScreen.classList.remove('hidden');
        this.menuScreen.classList.add('fade-in');
    },

    showCharacterSelect: function() {
        this.menuScreen.classList.add('hidden');
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
            this.player = { name: "Latke", food: 20, trivium: 16, credits: 0, type: "latke", modules: [null, null, null, null], crew: [null, null, null, null], usedQuestions: {} };
        } else {
            this.player = { name: "Glenn", food: 12, trivium: 10, credits: 15, type: "glenn", modules: [null, null, null, null], crew: [null, null, null, null], usedQuestions: {} };
        }
        this.enterGame();
    },

    enterGame: function() {
        this.charScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.currentStage = 1;
        this.usedEventIds = new Set();
        this.terryQuestionCount = 0;
        this.correctAnswers = 0;
        this.wrongAnswers = 0;
        this.highestStageReached = 1;
        const sprite = document.getElementById('pilot-sprite');
        if (sprite) {
            sprite.className = "";
            sprite.classList.add(this.player.type + "-active"); 
        }
        this.updateHUD();
        this.renderModules();
        this.generatePlanets();
    },

    openShop: function() {
        this.gameScreen.classList.add('hidden');
        this.shopScreen.classList.remove('hidden');
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
        
        const shuffled = [...availableModules].sort(() => 0.5 - Math.random());
        const selections = shuffled.slice(0, 3);

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
            } else {
                slot.classList.remove('equipped');
                slot.style.backgroundImage = "none";
                slot.innerHTML = "";
                slot.onclick = null;
                slot.setAttribute('data-tooltip', "Empty");
            }
        };

        this.player.crew.forEach((item, i) => renderSlot(item, `crew-slot-${i + 1}`, i, 'crew'));
        this.player.modules.forEach((item, i) => renderSlot(item, `mod-slot-${i + 1}`, i, 'module'));
    },

    sellModule: function(index, arrayType) {
        const arr = arrayType === 'crew' ? this.player.crew : this.player.modules;
        const item = arr[index];
        const sellPrice = 1;
        if (confirm(`Dismiss ${item.name} for ${sellPrice} Credit?`)) {
            this.player.credits += sellPrice;
            arr[index] = null;
            this.updateHUD();
            this.renderModules();
        }
    },

    showFeedback: function(isCorrect, message, title = "TRANSMISSION RECEIVED", explanation = null) {
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
        titleEl.className = isCorrect ? "success-text" : "failure-text";
        const isDefeat = this.player.food <= 0 || this.player.trivium <= 0;
        document.getElementById('feedback-close-btn').classList.toggle('hidden', isDefeat);
        document.getElementById('feedback-menu-btn').classList.toggle('hidden', !isDefeat);
        overlay.classList.remove('hidden');
    },

    closeFeedback: function() {
    document.getElementById('feedback-overlay').classList.add('hidden');
    const bossIcon = document.getElementById('boss-icon');
    if (bossIcon) bossIcon.classList.add('hidden');

    if (this.eventJustCompleted) {
        this.eventJustCompleted = false;
        this.generatePlanets();
        return;
    }

    if (this.player.food <= 0 || this.player.trivium <= 0) {
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
        document.getElementById('current-stage').innerText = "10";
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
        this.showFeedback(true, completedSectorData.message, "WARP SUCCESSFUL");
        
        this.updateHUD(); 
        return;
    } 

    this.updateHUD();
    this.generatePlanets();
},

    showVictoryScreen: function() {
    // 1. Hide the gameplay layers
    this.gameScreen.classList.add('hidden');
    
    // Hide all other potential UI elements
    const uiElements = ['boss-ui', 'trivia-box', 'shop-screen', 'tavern-screen'];
    uiElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

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
        .map(b => `<img src="${b.gif}" style="width:50px; height:50px; border:1px solid #00f2ff; margin:5px; background: rgba(0,0,0,0.5);" title="${b.name}">`)
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
            <div style="margin-top: 10px; padding: 8px; border: 1px solid rgba(0,242,255,0.3); font-size: 0.85em; color: #a0f9ff;">
                ${this.getRunStats()}
            </div>

            <div style="margin: 15px 0;">
                <p style="font-size: 0.8em; color: #888;">Surviving Crew:</p>
                <div style="display: flex; justify-content: center; flex-wrap: wrap;">
                    ${buddyHtml || "NO SURVIVING BUDDIES"}
                </div>
            </div>

            <div style="border-top: 1px solid #444; padding-top: 15px; margin-bottom: 20px;">
                <p>Final Trivium Score: <span style="color: #00f2ff; font-size: 1.5em;">${this.player.trivium}</span></p>
                <p>A Prize to the Highest Trivium Score at end of Demo</p>
                <input type="text" id="player-initials" placeholder="AAA" maxlength="3" 
                       style="text-transform: uppercase; width: 60px; text-align: center; background: #000; color: #00f2ff; border: 1px solid #00f2ff; padding: 5px;">
                <button onclick="gameState.submitScore()" style="background: #00f2ff; color: #000; border: none; padding: 6px 12px; font-weight: bold; cursor: pointer; font-family: 'Courier New', monospace;">SUBMIT</button>
            </div>

            <button onclick="location.reload()" style="display: block; width: 100%; margin-top: 20px; background: rgba(194, 86, 86, 0.2); border: 1px solid rgb(194, 86, 86); color: rgb(194, 86, 86); cursor: pointer; font-size: 0.9em; padding: 10px;">RETURN TO TITLE SCREEN</button>
        </div>
    `;

    // 5. Show the Overlay and hide the default "Continue" button
    if (closeBtn) closeBtn.style.display = 'none'; 
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
        // 1. Insert the new score
        const { error: insertError } = await supabase
            .from('leaderboard')
            .insert([{ name: initials, score: finalScore }]);

        if (insertError) throw insertError;

        // 2. Fetch the top 10 scores
        const { data: scores, error: fetchError } = await supabase
            .from('leaderboard')
            .select('name, score')
            .order('score', { ascending: false })
            .limit(10);

        if (fetchError) throw fetchError;

        // 3. Show the high score table
        this.showHighScores(scores);
    } catch (err) {
        console.error("Supabase Error:", err.message);
        alert("Transmission failed. Using local emergency backup.");
    }
},

showHighScores: function(scores) {
    const msgEl = document.getElementById('feedback-msg');
    let tableHtml = `
        <h3 style="color:#00f2ff; text-shadow: 0 0 10px #00f2ff;"></h3>
        <table style="width:100%; border-collapse: collapse; font-family: 'Courier New', monospace; font-size: 0.9em; margin-top:10px;">
            <tr style="border-bottom: 1px solid #00f2ff; color: #888;">
                <th style="text-align:left; padding: 5px;">PILOT</th>
                <th style="text-align:right; padding: 5px;">TRIVIUM</th>
            </tr>
    `;


    scores.forEach((s, index) => {
        const color = index === 0 ? "#ffd700" : "#00f2ff"; // Gold for #1
        tableHtml += `
            <tr style="border-bottom: 1px solid #222;">
                <td style="text-align:left; padding: 8px 5px;">${index + 1}. ${s.name}</td>
                <td style="text-align:right; color: ${color}; font-weight:bold;">${s.score.toLocaleString()}</td>
            </tr>
        `;
    });
    // ADD THE BUTTONS HERE
    tableHtml += `
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
            <button onclick="location.reload()" 
                style="background:#00f2ff; color:#000; border:none; padding:12px; cursor:pointer; font-weight:bold; font-family: inherit;">
                START NEW MISSION
            </button>
            
            
    `;

    
    
    msgEl.innerHTML = tableHtml;
},
viewLeaderboard: async function() {
    // 1. Show the overlay immediately so the user knows something is happening
    const overlay = document.getElementById('feedback-overlay');
    const msgEl = document.getElementById('feedback-msg');
    const titleEl = document.getElementById('feedback-title');

    titleEl.innerText = "Galactic Hall of Fame";
    msgEl.innerHTML = "<p style='text-align:center;'>Accessing Galactic Archives...</p>";
    overlay.classList.remove('hidden');
    overlay.style.display = "flex";

    if (!supabase) {
        msgEl.innerHTML = "<p style='color:#ff4444;'>Connection Error: Database blocked by browser tracking prevention.</p>";
        return;
    }

    try {
        // 2. Fetch top 10 from Supabase
        const { data: scores, error } = await supabase
            .from('leaderboard')
            .select('name, score')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        // 3. Reuse your existing table display logic
        this.showHighScores(scores);
        
        // 4. Update the button to say "BACK TO MENU" instead of "NEW MISSION"
        // This ensures they don't accidentally reload the page if they just wanted to peek
        const menuBtn = msgEl.querySelector('button');
        if (menuBtn) {
            
            menuBtn.onclick = () => {
                overlay.classList.add('hidden');
                overlay.style.display = "none";
            };
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        msgEl.innerHTML = "<p style='color:#ff4444;'>Failed to sync with Hall of Fame.</p>";
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
        const shuffledCats = Object.keys(questionBank).sort(() => 0.5 - Math.random());

        const makeNormal = (i) => {
            const cat = shuffledCats[i];
            const resType = resources[i];
            const amount = Math.floor(Math.random() * (14 - 9 + 1) + 9);
            const nodeName = amount === 14 ? "Planet" : amount === 13 ? "Dwarf Planet" : amount === 12 ? "Moon" : amount === 11 ? "Asteroid" : amount === 10 ? "Trading Beacon" : "Research Habitat";
            this.createNodeCard(container, cat, resType, amount, nodeName, false);
        };

        makeNormal(0); // Food
        makeNormal(1); // Trivium

        if (this.currentSector >= 2) {
            const hardCats = Object.keys(questionBankHard);
            const eliteCat = hardCats[Math.floor(Math.random() * hardCats.length)];
            const eliteAmount = Math.floor(Math.random() * (28 - 18 + 1) + 18);
            this.createNodeCard(container, eliteCat, "Trivium", eliteAmount, "-HARD NODE-", true);
        }

        makeNormal(2); // Credits
    },

    createNodeCard: function(container, cat, resType, amount, nodeName, isHard) {
        const card = document.createElement('div');
        card.className = isHard ? 'planet-card elite-node' : 'planet-card';
        card.innerHTML = `
  <h3>
    ${cat.replace(/_/g, ' ')} <br> 
    ${nodeName} <br>
  
  <span class="reward-tag">+${amount} ${resType}</span>
`; 
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
        this.bossRerollCost = 2;
        this.renderBossCategories();
    },

    renderBossCategories: function() {
        const grid = document.getElementById('boss-category-grid');
        grid.innerHTML = "";
        const hardCats = Object.keys(questionBankHard);
        const shuffled = hardCats.sort(() => 0.5 - Math.random()).slice(0, 4);
        shuffled.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = "category-btn";
            btn.innerText = cat.replace(/_/g, ' ');
            btn.onclick = () => this.startSuddenDeath(cat);
            grid.appendChild(btn);
        });
        this.updateRerollButton();
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
        const key = category;
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

        const qData = this.pickQuestion(questionBankHard, category);

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
                    this.player.food = 0;
                    this.player.trivium = 0;
                    this.updateHUD();
                    this.showFeedback(false, `You answered the boss question incorrectly — all resources were lost as a consequence.\n\nThe correct answer was: ${qData.correct}\n\n${this.getRunStats()}`, "BOSS DEFEATED YOU", qData.explanation);
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
        if (this.terryQuestionCount % 3 === 0) {
            const terryCount = this.player.crew.filter(m => m?.id === 'terry').length;
            for (let i = 0; i < terryCount; i++) removeOneWrong();
        }
    },

    startTrivia: function(category, reward, isHard = false) {
        document.getElementById('choice-container').classList.add('hidden');
        const tBox = document.getElementById('trivia-box');
        tBox.classList.remove('hidden');
        const sourceBank = isHard ? questionBankHard : questionBank;
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
                    finalVal *= 2;
                    bonusText = " (Doubled by Accumulator!)";
                }

                if (isCorrect) {
                    this.correctAnswers++;
                    this.player[reward.type.toLowerCase()] += finalVal;
                } else {
                    this.wrongAnswers++;
                }

                const { foodNet, triviumNet, creditNet } = this.getJumpCosts();

                this.player.food += foodNet;
                this.player.trivium += triviumNet;
                this.player.credits += creditNet;
                this.updateHUD();

                if (this.player.food <= 0 || this.player.trivium <= 0) {
                    const outOf = this.player.food <= 0 && this.player.trivium <= 0 ? "FOOD and TRIVIUM" : this.player.food <= 0 ? "FOOD" : "TRIVIUM";
                    const jumpNote = isCorrect
                        ? `You answered correctly, but the jump cost of ${outOf} drained your last reserves. The ship has no power to continue.`
                        : `You answered incorrectly. The jump cost then consumed your remaining ${outOf}, leaving nothing to continue.`;
                    const deathMsg = `${jumpNote}\n\nThe correct answer was: ${qData.correct}\n\n${this.getRunStats()}`;
                    this.showFeedback(false, deathMsg, `SYSTEMS FAILURE: OUT OF ${outOf}`, qData.explanation);
                } else {
                    this.currentStage++;
                    this.highestStageReached = Math.max(this.highestStageReached, (this.currentSector - 1) * 10 + this.currentStage);
                    let msg = isCorrect ? "" : `Incorrect. The correct answer was ${qData.correct}.`;
                    const title = isCorrect ? `CORRECT! +${finalVal} ${reward.type}${bonusText}` : "Incorrect";
                    this.showFeedback(isCorrect, msg, title, qData.explanation);
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
        if (this.terryQuestionCount % 3 === 0) {
            const terryCount = this.player.crew.filter(m => m?.id === 'terry').length;
            for (let i = 0; i < terryCount; i++) removeOneWrong();
        }
    },

    openTavern: function() {
        this.gameScreen.classList.add('hidden');
        document.getElementById('tavern-screen').classList.remove('hidden');
        const container = document.getElementById('buddy-offers');
        container.innerHTML = "";
        const available = this.buddies.filter(b => !this.player.crew.some(m => m?.id === b.id));
        const selections = available.sort(() => 0.5 - Math.random()).slice(0, 2);
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
        this.generatePlanets();
    },

    openEvent: function() {
        const available = this.events.filter(e => !this.usedEventIds.has(e.id));
        if (available.length === 0) { this.generatePlanets(); return; }
        const event = available[Math.floor(Math.random() * available.length)];
        this.usedEventIds.add(event.id);

        this.gameScreen.classList.add('hidden');
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

        Object.entries(opt.reward).forEach(([res, amt]) => { this.player[res] += amt; });
        this.updateHUD();

        const rewardText = Object.entries(opt.reward).map(([r, v]) => `+${v} ${r.charAt(0).toUpperCase() + r.slice(1)}`).join(', ');
        const costText = opt.cost ? ` (${opt.costLabel})` : '';
        document.getElementById('event-screen').classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
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
        this.eventJustCompleted = true;
        const msg = buddyId
            ? `A perfect copy steps out of the pod, ready to serve. Your crew quarters now hold two ${this.buddies.find(b => b.id === buddyId)?.name || 'crew members'}.`
            : 'You leave without a clone.';
        this.showFeedback(true, msg, 'CLONING COMPLETE');
    },

    debugJumpToBoss: function() {
        // Corrected to jump to Sector 3 Boss
        this.currentSector = 3;
        this.currentStage = 10;
        this.player.food = 10;
        this.player.trivium = 10;

        const data = this.sectorData[3];
        document.body.style.backgroundImage = data.background;
        
        document.getElementById('menu-screen').classList.add('hidden');
        this.gameScreen.classList.remove('hidden');

        this.updateHUD();
        this.triggerBossEncounter();
        console.log("Debug: Warped to Sector 3 Boss.");
    },

    getJumpCosts: function() {
        let foodNet = -5;
        let triviumNet = -(5 * (this.currentSector * (this.currentSector + 1)) / 2);
        let creditNet = 0;
        [...this.player.modules, ...this.player.crew].forEach(m => {
            if (!m) return;
            if (m.id === 'biosphere') foodNet += 4;
            if (m.id === 'content_farm') { foodNet += 2; creditNet += 6; triviumNet -= 1; }
            if (m.id === 'octopus') foodNet += 2 + this.player.modules.filter(m => m !== null).length;
            if (m.id === 'aardvark') creditNet += 4;
            if (m.id === 'trivia_toad') { foodNet -= 1; triviumNet += 4; }
            if (m.id === 'bear_bot') { foodNet += 1; triviumNet += 1; creditNet += 1; }
        });
        return { foodNet, triviumNet, creditNet };
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
    },

    getRunStats: function() {
        const totalStages = (this.currentSector - 1) * 10 + this.currentStage;
        return `Reached Stage ${totalStages}/30 (Sector ${this.currentSector}) — ${this.correctAnswers} correct, ${this.wrongAnswers} incorrect.`;
    },

    showRules: function() {
        document.getElementById('rules-overlay').classList.remove('hidden');
    },

    closeRules: function() {
        document.getElementById('rules-overlay').classList.add('hidden');
    },

    returnToMenu: function() {
        location.reload();
    }
};

window.onload = () => gameState.init();