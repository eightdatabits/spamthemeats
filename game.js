/**
 * SPAM THE MEATS // AMALGAMATED MEATWORKS CO.
 * Core Clicker Game Engine, Economy Math, Worker & Conveyor Visuals, Audio Synth
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'spam_the_meats_save_v1';

  const BELT_SPEED_PX_PER_SEC = 320; // Matches the tread animation in styles.css
  const MAX_PACKAGES_PER_BELT = 24;
  const LEVER_PULL_MS = 70;
  const LEVER_RETURN_MS = 200;

  // Packing bot: an autoclicker every factory starts with at Level 1
  const BOT_MAX_LEVEL = 20;
  const BOT_EAT_CHANCE = 0.01; // Chance per bot press of eating one random package
  const BOT_TICK_MS = 200;
  const BOT_ACCENT = '#94A3B8';
  const BOT_ICON_SVG = `
    <svg class="bot-icon" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="30" y="7" width="4" height="10" fill="currentColor" />
      <circle cx="32" cy="7" r="4" fill="#F59E0B" />
      <rect x="6" y="26" width="6" height="12" rx="2" fill="currentColor" />
      <rect x="52" y="26" width="6" height="12" rx="2" fill="currentColor" />
      <rect x="12" y="16" width="40" height="32" rx="8" fill="currentColor" />
      <rect x="18" y="23" width="28" height="13" rx="4" fill="#0F0D0C" />
      <circle cx="25" cy="29.5" r="3" fill="#34D399" />
      <circle cx="39" cy="29.5" r="3" fill="#34D399" />
      <rect x="24" y="40" width="16" height="3" rx="1.5" fill="#0F0D0C" />
      <rect x="20" y="50" width="24" height="8" rx="2" fill="currentColor" />
    </svg>`;

  // Worker rig, in worker-scene SVG coordinates. Hands are solved to stay on the lever grip.
  const LEVER_RIG = { pivotX: 168, pivotY: 262, gripLength: 150, restDeg: 12, pulledDeg: -20 };
  const WORKER_RIG = {
    hipX: 74,
    hipY: 190,
    leanDeg: -10,
    armSegment: 60,
    nearShoulder: { x: 84, y: 114 },
    farShoulder: { x: 94, y: 116 }
  };

  /**
   * Specification of the 6 processed meat tiers.
   *
   * 1. Spam        - Base sale: $1,        +$5/lvl,       Base upgrade: $100,         Additional: 100 clicks @ current price
   * 2. Hotdogs     - Base sale: $10,       +$20/lvl,      Base upgrade: $10,000,      Additional: 100 clicks @ current price
   * 3. Sausage     - Base sale: $100,      +$300/lvl,     Base upgrade: $100,000,     Additional: 100 clicks @ current price
   * 4. Salami      - Base sale: $1,000,    +$4,000/lvl,   Base upgrade: $1,000,000,   Additional: 1,000 clicks @ current price
   * 5. Ground Beef - Base sale: $10,000,   +$50,000/lvl,  Base upgrade: $10,000,000,  Additional: 1,000 clicks @ current price
   * 6. Wagyu       - Base sale: $1,000,000,+$10,000,000/lvl, Base upgrade: $10,000,000,000, Additional: 10,000 clicks @ current price
   */

  /**
   * Container tiers, bought in order per meat. Index 0 (Basic) is the free starter tier.
   * Each meat lists its own multiplier and cost per tier in `containerTiers`; the sale price
   * is multiplied by the current tier's multiplier (tiers replace each other, they do not stack).
   * Copper costs the meat's `copperCost`, and every later tier costs twice the previous one.
   */
  const CONTAINER_TIER_NAMES = ['Basic', 'Copper', 'Bronze', 'Silver', 'Gold', 'Diamond', 'Platinum'];

  function makeContainerTiers(multipliers, copperCost) {
    return CONTAINER_TIER_NAMES.map((name, idx) => ({
      name,
      multiplier: multipliers[idx],
      cost: idx === 0 ? 0 : copperCost * 2 ** (idx - 1)
    }));
  }

  const STANDARD_CONTAINER_MULTIPLIERS = [1, 5, 10, 15, 20, 25, 30];

  const MEAT_CATALOG = [
    {
      id: 'spam',
      order: 1,
      name: 'Spam',
      subtitle: 'Canned Spiced Luncheon Loaf',
      baseSalePrice: 1,
      levelPriceIncrease: 5,
      baseUpgradeCost: 100,
      upgradeClicksEquivalent: 100,
      recipeUnlockCost: 0, // Starter recipe unlocked by default
      startsUnlocked: true,
      image: 'assets/spam.png',
      accentColor: '#3B82F6',
      containerTiers: makeContainerTiers(STANDARD_CONTAINER_MULTIPLIERS, 8000),
      qualityNames: [
        'Grade I • Standard Tin',
        'Grade II • Honey-Glazed Loaf',
        'Grade III • Hickory Smoked',
        'Grade IV • Brass-Key Reserve',
        'Grade V • Heritage Cured',
        'Grade VI • Imperial Gold Tin'
      ]
    },
    {
      id: 'hotdogs',
      order: 2,
      name: 'Hotdogs',
      subtitle: 'Vacuum-Sealed Smokehouse Franks',
      baseSalePrice: 10,
      levelPriceIncrease: 20,
      baseUpgradeCost: 10000,
      upgradeClicksEquivalent: 100,
      recipeUnlockCost: 1000,
      startsUnlocked: false,
      image: 'assets/hotdogs.png',
      accentColor: '#F97316',
      containerTiers: makeContainerTiers(STANDARD_CONTAINER_MULTIPLIERS, 30000),
      qualityNames: [
        'Grade I • Ballpark Frank',
        'Grade II • Natural Casing',
        'Grade III • Applewood Smoked',
        'Grade IV • All-Beef Kosher',
        'Grade V • Butcher Prime Link',
        'Grade VI • Grand Pitmaster'
      ]
    },
    {
      id: 'sausage',
      order: 3,
      name: 'Sausage',
      subtitle: 'Butcher-Twine Smoked Kielbasa',
      baseSalePrice: 100,
      levelPriceIncrease: 300,
      baseUpgradeCost: 100000,
      upgradeClicksEquivalent: 100,
      recipeUnlockCost: 10000,
      startsUnlocked: false,
      image: 'assets/sausage.png',
      accentColor: '#EA580C',
      containerTiers: makeContainerTiers(STANDARD_CONTAINER_MULTIPLIERS, 400000),
      qualityNames: [
        'Grade I • Country Link',
        'Grade II • Cracked Peppercorn',
        'Grade III • Roasted Garlic Herb',
        'Grade IV • Oak-Barrel Kielbasa',
        'Grade V • Old-World Guild',
        'Grade VI • Master Charcutier'
      ]
    },
    {
      id: 'salami',
      order: 4,
      name: 'Salami',
      subtitle: 'Dry-Cured Marbled Genoa Chubs',
      baseSalePrice: 1000,
      levelPriceIncrease: 4000,
      baseUpgradeCost: 1000000,
      upgradeClicksEquivalent: 1000,
      recipeUnlockCost: 100000,
      startsUnlocked: false,
      image: 'assets/salami.png',
      accentColor: '#E11D48',
      containerTiers: makeContainerTiers(STANDARD_CONTAINER_MULTIPLIERS, 51000000),
      qualityNames: [
        'Grade I • Cellar Dry-Cured',
        'Grade II • Black Truffle Studded',
        'Grade III • Chianti Aged Chub',
        'Grade IV • Riserva Antica',
        'Grade V • Artisanal Soppressata',
        'Grade VI • Sovereign Vintage'
      ]
    },
    {
      id: 'ground_beef',
      order: 5,
      name: 'Ground Beef',
      subtitle: 'Freshly Milled Prime Chuck Ribbons',
      baseSalePrice: 10000,
      levelPriceIncrease: 50000,
      baseUpgradeCost: 10000000,
      upgradeClicksEquivalent: 1000,
      recipeUnlockCost: 1000000,
      startsUnlocked: false,
      image: 'assets/ground_beef.png',
      accentColor: '#DC2626',
      containerTiers: makeContainerTiers(STANDARD_CONTAINER_MULTIPLIERS, 600000000),
      qualityNames: [
        'Grade I • 80/20 Chuck Grind',
        'Grade II • Prime Sirloin Blend',
        'Grade III • Dry-Aged Brisket Cut',
        'Grade IV • Grass-Fed Reserve',
        'Grade V • Butcher Gold Label',
        'Grade VI • Supreme Marbled Mince'
      ]
    },
    {
      id: 'wagyu',
      order: 6,
      name: 'Wagyu',
      subtitle: 'A5 Miyazaki Snowflake-Marbled Cut',
      baseSalePrice: 1000000,
      levelPriceIncrease: 10000000,
      baseUpgradeCost: 10000000000,
      upgradeClicksEquivalent: 10000,
      recipeUnlockCost: 100000000,
      startsUnlocked: false,
      image: 'assets/wagyu.png',
      accentColor: '#EAB308',
      containerTiers: makeContainerTiers(STANDARD_CONTAINER_MULTIPLIERS, 1200000000000),
      qualityNames: [
        'Grade I • Tajima Select',
        'Grade II • BMS-10 Shimofuri',
        'Grade III • A5 Miyazaki Reserve',
        'Grade IV • Olive-Fed Sanuki',
        'Grade V • Imperial Snow-Marbled',
        'Grade VI • 24K Gold-Leaf Crown'
      ]
    }
  ];

  // =========================================================================
  // SOUND EFFECTS SYNTHESIZER (Web Audio API)
  // =========================================================================
  class FactoryAudio {
    constructor() {
      this.enabled = true;
      this.ctx = null;
    }

    initContext() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    playPressStamp() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Low mechanical thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(135, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);

        // Crisp cash/stamp metallic click
        const ping = this.ctx.createOscillator();
        const pingGain = this.ctx.createGain();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(980, now + 0.02);
        ping.frequency.exponentialRampToValueAtTime(1480, now + 0.08);

        pingGain.gain.setValueAtTime(0.08, now + 0.02);
        pingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        ping.connect(pingGain);
        pingGain.connect(this.ctx.destination);
        ping.start(now + 0.02);
        ping.stop(now + 0.09);
      } catch (_) {
        // Ignore audio errors on restricted autoplay contexts
      }
    }

    playUpgrade() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [440, 554.37, 659.25];
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + idx * 0.045);

          gain.gain.setValueAtTime(0.14, now + idx * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.16);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.045);
          osc.stop(now + idx * 0.045 + 0.16);
        });
      } catch (_) {}
    }

    playRecipeUnlock() {
      if (!this.enabled) return;
      try {
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.5];
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.055);

          gain.gain.setValueAtTime(0.16, now + idx * 0.055);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.055 + 0.24);

          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.055);
          osc.stop(now + idx * 0.055 + 0.24);
        });
      } catch (_) {}
    }
  }

  const audio = new FactoryAudio();

  // =========================================================================
  // DEFAULT STATE & PERSISTENCE
  // =========================================================================
  function createDefaultState() {
    const meats = {};
    MEAT_CATALOG.forEach((item) => {
      meats[item.id] = {
        unlocked: item.startsUnlocked,
        level: 1, // Level 1 = Base sale price (0 upgrades purchased yet)
        containerTier: 0, // Index into config.containerTiers (0 = Basic)
        packagesSold: 0,
        totalRevenue: 0
      };
    });

    return {
      cash: 0,
      totalEarned: 0,
      totalClicks: 0,
      totalPackages: 0,
      costMode: 'direct', // 'direct' | 'additive' | 'cumulative'
      soundEnabled: true,
      sidebarOpen: true,
      beltOrder: MEAT_CATALOG.filter((item) => item.startsUnlocked).map((item) => item.id), // Top to bottom
      bot: {
        level: 1,
        clicks: 0, // Presses made by the bot
        packagesEaten: 0
      },
      meats
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      const base = createDefaultState();

      base.cash = Number.isFinite(parsed.cash) ? parsed.cash : 0;
      base.totalEarned = Number.isFinite(parsed.totalEarned) ? parsed.totalEarned : 0;
      base.totalClicks = Number.isFinite(parsed.totalClicks) ? parsed.totalClicks : 0;
      base.totalPackages = Number.isFinite(parsed.totalPackages) ? parsed.totalPackages : 0;
      base.costMode = ['direct', 'additive', 'cumulative'].includes(parsed.costMode)
        ? parsed.costMode
        : 'direct';
      base.soundEnabled = typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true;
      base.sidebarOpen = typeof parsed.sidebarOpen === 'boolean' ? parsed.sidebarOpen : true;

      if (parsed.meats && typeof parsed.meats === 'object') {
        MEAT_CATALOG.forEach((item) => {
          const savedMeat = parsed.meats[item.id];
          if (savedMeat) {
            base.meats[item.id] = {
              unlocked: item.startsUnlocked ? true : Boolean(savedMeat.unlocked),
              level: Math.max(1, Math.floor(Number(savedMeat.level) || 1)),
              containerTier: Math.min(
                item.containerTiers.length - 1,
                Math.max(0, Math.floor(Number(savedMeat.containerTier) || 0))
              ),
              packagesSold: Math.max(0, Math.floor(Number(savedMeat.packagesSold) || 0)),
              totalRevenue: Math.max(0, Number(savedMeat.totalRevenue) || 0)
            };
          }
        });
      }

      if (parsed.bot && typeof parsed.bot === 'object') {
        base.bot = {
          level: Math.min(BOT_MAX_LEVEL, Math.max(1, Math.floor(Number(parsed.bot.level) || 1))),
          clicks: Math.max(0, Math.floor(Number(parsed.bot.clicks) || 0)),
          packagesEaten: Math.max(0, Math.floor(Number(parsed.bot.packagesEaten) || 0))
        };
      }

      // Saved belt order first, then any unlocked meat it is missing (older saves have no order)
      const savedOrder = Array.isArray(parsed.beltOrder) ? parsed.beltOrder : [];
      base.beltOrder = [...savedOrder, ...MEAT_CATALOG.map((item) => item.id)].filter(
        (id, idx, ids) => base.meats[id] && base.meats[id].unlocked && ids.indexOf(id) === idx
      );

      audio.enabled = base.soundEnabled;
      return base;
    } catch (_) {
      return createDefaultState();
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  // =========================================================================
  // ECONOMY & PRICING FORMULAS
  // =========================================================================

  /**
   * Quality price of 1 package of a meat at a level, before the container multiplier.
   * Level 1 = baseSalePrice
   * Each level up (+1) increases the price by levelPriceIncrease.
   */
  function getMeatQualityPrice(config, level) {
    const upgradesCount = Math.max(0, level - 1);
    return config.baseSalePrice + upgradesCount * config.levelPriceIncrease;
  }

  function getContainerMultiplier(config, meatState) {
    return config.containerTiers[meatState.containerTier].multiplier;
  }

  /**
   * Sale price of 1 package of a meat: quality price × current container multiplier.
   */
  function getMeatSalePrice(config, meatState) {
    return getMeatQualityPrice(config, meatState.level) * getContainerMultiplier(config, meatState);
  }

  /**
   * Next container tier for a meat, or null when the top tier is already owned.
   */
  function getNextContainerTier(config, meatState) {
    return config.containerTiers[meatState.containerTier + 1] || null;
  }

  /**
   * Cost to upgrade a meat from its current level to (level + 1).
   * - First upgrade (Level 1 -> Level 2, i.e., upgradesCount === 0):
   *   Always costs `config.baseUpgradeCost`.
   * - Each additional upgrade (Level 2+, i.e., upgradesCount >= 1):
   *   Requires the equivalent of `upgradeClicksEquivalent` clicks at the current quality price.
   *   The container multiplier is deliberately excluded, so buying containers never makes
   *   quality upgrades more expensive.
   */
  function getMeatUpgradeCost(config, meatState, mode = state.costMode) {
    const upgradesCount = Math.max(0, meatState.level - 1);
    if (upgradesCount === 0) {
      return config.baseUpgradeCost;
    }

    const currentPrice = getMeatQualityPrice(config, meatState.level);
    const clicksEquivalent = config.upgradeClicksEquivalent * currentPrice;

    if (mode === 'additive') {
      return config.baseUpgradeCost + clicksEquivalent;
    }

    if (mode === 'cumulative') {
      // Base cost + sum of N * price at each upgraded level from 1..upgradesCount
      let total = config.baseUpgradeCost;
      for (let lvl = 2; lvl <= meatState.level; lvl++) {
        total += config.upgradeClicksEquivalent * getMeatQualityPrice(config, lvl);
      }
      return total;
    }

    // Default 'direct': First upgrade is Base Upgrade Cost; each additional upgrade is N clicks at current price
    return clicksEquivalent;
  }

  /**
   * Returns total revenue generated by a single click (sum of all unlocked meats' sale prices)
   * and count of unlocked meats.
   */
  function getBatchSummary() {
    let totalYield = 0;
    let unlockedCount = 0;
    let totalUpgrades = 0;
    const activeItems = [];

    MEAT_CATALOG.forEach((config) => {
      const mState = state.meats[config.id];
      if (mState.unlocked) {
        const price = getMeatSalePrice(config, mState);
        totalYield += price;
        unlockedCount += 1;
        totalUpgrades += mState.level - 1;
        activeItems.push({ config, mState, price });
      }
    });

    return { totalYield, unlockedCount, totalUpgrades, activeItems };
  }

  /**
   * Bot presses per minute at a level: R(L) = 0.7 × L^1.5 + L, rounded to the nearest whole number.
   */
  function getBotClicksPerMinute(level) {
    return Math.round(0.7 * level ** 1.5 + level);
  }

  /**
   * Cost to buy bot Level L: C(L) = 1000 × R(L)^2. Level 1 is free (every factory starts with it).
   */
  function getBotLevelCost(level) {
    return 1000 * getBotClicksPerMinute(level) ** 2;
  }

  /**
   * Returns quality grade title for a meat based on its level.
   */
  function getQualityGradeName(config, level) {
    const idx = Math.min(config.qualityNames.length - 1, Math.floor((level - 1) / 2));
    return config.qualityNames[idx];
  }

  // =========================================================================
  // NUMBER FORMATTING UTILITIES
  // =========================================================================
  const fullCurrencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  const fullNumberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0
  });

  function formatMoney(amount, compactAfter = 1e12) {
    if (!Number.isFinite(amount)) return '$0';
    if (Math.abs(amount) < compactAfter) {
      return fullCurrencyFormatter.format(Math.round(amount));
    }
    const tiers = [
      { value: 1e18, symbol: 'Qi' },
      { value: 1e15, symbol: 'Qa' },
      { value: 1e12, symbol: 'T' },
      { value: 1e9, symbol: 'B' },
      { value: 1e6, symbol: 'M' },
      { value: 1e3, symbol: 'K' }
    ];
    for (const tier of tiers) {
      if (Math.abs(amount) >= tier.value) {
        return '$' + (amount / tier.value).toFixed(2).replace(/\.00$/, '') + tier.symbol;
      }
    }
    return fullCurrencyFormatter.format(Math.round(amount));
  }

  function formatCompactMoney(amount) {
    return formatMoney(amount, 1e7);
  }

  function formatCount(n) {
    return fullNumberFormatter.format(Math.round(n));
  }

  // =========================================================================
  // DOM REFERENCES & INITIAL RENDER
  // =========================================================================
  const elCashBalance = document.getElementById('cash-balance');
  const elYieldPerClick = document.getElementById('yield-per-click');
  const elTotalPackages = document.getElementById('total-packages');
  const elTotalClicks = document.getElementById('total-clicks');

  const elBatchSizeBadge = document.getElementById('batch-size-badge');
  const elPressBtn = document.getElementById('btn-package-press');
  const elPressYieldBadge = document.getElementById('press-yield-badge');
  const elFloatingPopups = document.getElementById('floating-popups');

  const elLastSaleReadout = document.getElementById('last-sale-readout');

  const elBeltLines = document.getElementById('belt-lines');
  const elPackerMachine = document.getElementById('packer-machine');

  const elWorkerLever = document.getElementById('worker-lever');
  const elWorkerBody = document.getElementById('worker-body');
  const elWorkerArmNear = document.getElementById('worker-arm-near');
  const elWorkerArmFar = document.getElementById('worker-arm-far');
  const elWorkerGloveNear = document.getElementById('worker-glove-near');
  const elWorkerGloveFar = document.getElementById('worker-glove-far');
  const elConsoleLed = document.getElementById('console-led');

  const elWorkspace = document.getElementById('factory-workspace');
  const elBtnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const elBtnCloseSidebar = document.getElementById('btn-close-sidebar');
  const elMeatRail = document.getElementById('meat-rail');

  const elUnlockedCount = document.getElementById('unlocked-count');
  const elTotalLevels = document.getElementById('total-levels');
  const elMeatLinesGrid = document.getElementById('meat-lines-grid');

  const elBotStripLabel = document.getElementById('bot-strip-label');
  const elBotStripFill = document.getElementById('bot-strip-fill');

  const elBtnToggleSound = document.getElementById('btn-toggle-sound');
  const elSoundIconLabel = document.getElementById('sound-icon-label');
  const elBtnOpenBlueprint = document.getElementById('btn-open-blueprint');
  const elBtnCloseBlueprint = document.getElementById('btn-close-blueprint');
  const elBlueprintModal = document.getElementById('blueprint-modal');
  const elSelectCostMode = document.getElementById('select-cost-mode');
  const elBtnResetFactory = document.getElementById('btn-reset-factory');

  let beltTimeout = null;
  let leverFrame = null;
  let leverPull = 0; // 0 = at rest, 1 = fully pulled
  let leverPullFrom = 0;
  let leverPullStart = 0;

  /**
   * Adds a meat's conveyor belt below the existing belts.
   */
  function addBeltRow(config, isNew = false) {
    const row = document.createElement('div');
    row.className = isNew ? 'belt-row is-new' : 'belt-row';
    row.id = `belt-row-${config.id}`;
    row.style.setProperty('--meat-accent', config.accentColor);

    row.innerHTML = `
      <div class="belt-plate">
        <span class="belt-plate-dot"></span>
        <span class="belt-plate-name">${config.name}</span>
        <span id="belt-level-${config.id}">L1</span>
        <span class="belt-plate-price" id="belt-price-${config.id}">$0</span>
      </div>
      <div class="belt-hole-back"></div>
      <div class="belt-track"></div>
      <div class="belt-stage" id="belt-stage-${config.id}"></div>
      <div class="belt-hole-front"></div>
      <span class="shipping-sign">To Shipping</span>
    `;

    elBeltLines.appendChild(row);
  }

  function rebuildBeltRows() {
    elBeltLines.innerHTML = '';
    state.beltOrder.forEach((id) => {
      addBeltRow(MEAT_CATALOG.find((m) => m.id === id));
    });
  }

  /**
   * Builds the minimized sidebar's meat icons once. Clicking one expands the sidebar to that meat.
   */
  function buildMeatRailDOM() {
    elMeatRail.innerHTML = '';

    const botBtn = document.createElement('button');
    botBtn.type = 'button';
    botBtn.className = 'meat-rail-btn bot-rail-btn';
    botBtn.id = 'rail-btn-bot';
    botBtn.title = 'Packing Bot';
    botBtn.innerHTML = `
      ${BOT_ICON_SVG}
      <span class="meat-rail-level" id="rail-level-bot">1</span>
    `;
    botBtn.addEventListener('click', () => {
      state.sidebarOpen = true;
      saveState();
      renderUI();
      document.getElementById('bot-card').scrollIntoView({ block: 'nearest' });
    });
    elMeatRail.appendChild(botBtn);

    MEAT_CATALOG.forEach((config) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'meat-rail-btn';
      btn.id = `rail-btn-${config.id}`;
      btn.title = config.name;
      btn.innerHTML = `
        <img src="${config.image}" alt="" />
        <span class="meat-rail-level" id="rail-level-${config.id}">1</span>
      `;

      btn.addEventListener('click', () => {
        state.sidebarOpen = true;
        saveState();
        renderUI();
        document.getElementById(`meat-card-${config.id}`).scrollIntoView({ block: 'nearest' });
      });

      elMeatRail.appendChild(btn);
    });
  }

  /**
   * Builds the packing bot's card, shown above the meat cards.
   */
  function buildBotCard() {
    const card = document.createElement('article');
    card.className = 'meat-card bot-card';
    card.id = 'bot-card';
    card.style.setProperty('--meat-accent', BOT_ACCENT);

    card.innerHTML = `
      <div class="meat-card-top">
        <div class="meat-thumb-frame bot-thumb">${BOT_ICON_SVG}</div>
        <div class="meat-info">
          <div class="meat-title-row">
            <h3 class="meat-name">Packing Bot</h3>
            <span class="meat-level-badge" id="bot-level-badge">LVL 1</span>
          </div>
          <span class="meat-grade-tag">Pulls the lever on its own. ${BOT_EAT_CHANCE * 100}% chance per pull to eat a package.</span>
        </div>
      </div>

      <div class="meat-metrics-grid">
        <div class="metric-cell">
          <span class="metric-label">Clicks / Min</span>
          <span class="metric-val price-val" id="bot-rate">0</span>
        </div>
        <div class="metric-cell">
          <span class="metric-label">Bot Presses</span>
          <span class="metric-val" id="bot-clicks">0</span>
        </div>
        <div class="metric-cell">
          <span class="metric-label">Pkgs Eaten</span>
          <span class="metric-val eaten-val" id="bot-eaten">0</span>
        </div>
      </div>

      <div class="meat-card-actions">
        <div class="Affordability-bar-track" aria-hidden="true">
          <div class="affordability-bar-fill" id="afford-bar-bot"></div>
        </div>
        <button type="button" class="meat-action-btn" id="btn-bot-upgrade">
          <div class="btn-action-left">
            <span class="btn-action-title" id="btn-bot-title">Upgrade Bot</span>
            <span class="btn-action-sub" id="btn-bot-sub"></span>
          </div>
          <span class="btn-action-cost" id="btn-bot-cost">$0</span>
        </button>
      </div>
    `;

    card.querySelector('#btn-bot-upgrade').addEventListener('click', handleBotUpgrade);
    return card;
  }

  /**
   * Builds the 6 meat production line cards once, then updates them reactively.
   */
  function buildMeatCardsDOM() {
    elMeatLinesGrid.innerHTML = '';
    elMeatLinesGrid.appendChild(buildBotCard());

    MEAT_CATALOG.forEach((config) => {
      const card = document.createElement('article');
      card.className = 'meat-card';
      card.id = `meat-card-${config.id}`;
      card.style.setProperty('--meat-accent', config.accentColor);

      card.innerHTML = `
        <div class="meat-card-top">
          <div class="meat-thumb-frame">
            <img
              src="${config.image}"
              alt="${config.name} package illustration"
              loading="lazy"
            />
            <div class="locked-overlay-badge" id="locked-badge-${config.id}">LOCKED</div>
          </div>
          <div class="meat-info">
            <div class="meat-title-row">
              <h3 class="meat-name">${config.order}. ${config.name}</h3>
              <span class="meat-level-badge" id="level-badge-${config.id}">LVL 1</span>
            </div>
            <span class="meat-grade-tag" id="grade-tag-${config.id}">${config.subtitle}</span>
          </div>
        </div>

        <div class="meat-metrics-grid">
          <div class="metric-cell">
            <span class="metric-label">Sale Price</span>
            <span class="metric-val price-val" id="sale-price-${config.id}">$0</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">Level Bonus</span>
            <span class="metric-val delta-val" id="level-delta-${config.id}">+$0</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">Pkgs Sold</span>
            <span class="metric-val" id="pkgs-sold-${config.id}">0</span>
          </div>
        </div>

        <div class="meat-card-actions">
          <div class="Affordability-bar-track" aria-hidden="true">
            <div class="affordability-bar-fill" id="afford-bar-${config.id}"></div>
          </div>
          <div class="meat-action-row">
            <button
              type="button"
              class="meat-action-btn"
              id="btn-action-${config.id}"
              data-meat-id="${config.id}"
            >
              <div class="btn-action-left">
                <span class="btn-action-title" id="btn-title-${config.id}">Upgrade Quality</span>
                <span class="btn-action-sub" id="btn-sub-${config.id}">100 clicks equiv.</span>
              </div>
              <span class="btn-action-cost" id="btn-cost-${config.id}">$100</span>
            </button>
            <button
              type="button"
              class="meat-action-btn container-btn"
              id="btn-container-${config.id}"
              data-meat-id="${config.id}"
              hidden
            >
              <span class="btn-action-title" id="btn-container-title-${config.id}">Copper</span>
              <span class="btn-action-sub" id="btn-container-sub-${config.id}">×5 value</span>
              <span class="btn-action-cost" id="btn-container-cost-${config.id}">$8,000</span>
            </button>
          </div>
        </div>
      `;

      const actionBtn = card.querySelector(`#btn-action-${config.id}`);
      actionBtn.addEventListener('click', () => handleMeatAction(config.id));
      const containerBtn = card.querySelector(`#btn-container-${config.id}`);
      containerBtn.addEventListener('click', () => handleContainerPurchase(config.id));

      elMeatLinesGrid.appendChild(card);
    });
  }

  /**
   * Synchronizes all UI readouts, cards, affordability states, and belt plates.
   */
  function renderUI() {
    const { totalYield, unlockedCount, totalUpgrades, activeItems } = getBatchSummary();

    // Top bar readouts
    elCashBalance.textContent = formatMoney(state.cash);
    elYieldPerClick.textContent = formatMoney(totalYield);
    elTotalPackages.textContent = formatCount(state.totalPackages);
    elTotalClicks.textContent = formatCount(state.totalClicks);

    // Hydraulic Press indicators
    elBatchSizeBadge.textContent = `${unlockedCount} ${unlockedCount === 1 ? 'Pkg' : 'Pkgs'} / Click`;
    elPressYieldBadge.textContent = `+${formatCompactMoney(totalYield)}`;

    // Deck header summary
    elUnlockedCount.textContent = `${unlockedCount} / ${MEAT_CATALOG.length}`;
    elTotalLevels.textContent = formatCount(totalUpgrades);

    // Conveyor belt plates
    activeItems.forEach(({ config, mState, price }) => {
      document.getElementById(`belt-level-${config.id}`).textContent = `L${mState.level}`;
      document.getElementById(`belt-price-${config.id}`).textContent = formatCompactMoney(price);
    });

    // Sidebar state
    elWorkspace.classList.toggle('sidebar-minimized', !state.sidebarOpen);
    elBtnToggleSidebar.setAttribute('aria-expanded', String(state.sidebarOpen));

    // Sound button state
    elBtnToggleSound.setAttribute('aria-pressed', String(state.soundEnabled));
    elSoundIconLabel.textContent = state.soundEnabled ? 'SFX: ON' : 'SFX: OFF';
    elSelectCostMode.value = state.costMode;

    renderBotCard();

    // Update each of the 6 meat cards
    MEAT_CATALOG.forEach((config) => {
      const mState = state.meats[config.id];
      const card = document.getElementById(`meat-card-${config.id}`);
      const railBtn = document.getElementById(`rail-btn-${config.id}`);
      const railLevel = document.getElementById(`rail-level-${config.id}`);
      const lockedBadge = document.getElementById(`locked-badge-${config.id}`);
      const levelBadge = document.getElementById(`level-badge-${config.id}`);
      const gradeTag = document.getElementById(`grade-tag-${config.id}`);
      const salePriceEl = document.getElementById(`sale-price-${config.id}`);
      const levelDeltaEl = document.getElementById(`level-delta-${config.id}`);
      const pkgsSoldEl = document.getElementById(`pkgs-sold-${config.id}`);
      const affordBarEl = document.getElementById(`afford-bar-${config.id}`);
      const actionBtn = document.getElementById(`btn-action-${config.id}`);
      const btnTitle = document.getElementById(`btn-title-${config.id}`);
      const btnSub = document.getElementById(`btn-sub-${config.id}`);
      const btnCost = document.getElementById(`btn-cost-${config.id}`);
      const containerBtn = document.getElementById(`btn-container-${config.id}`);

      const multiplier = getContainerMultiplier(config, mState);
      const currentPrice = getMeatSalePrice(config, mState);
      salePriceEl.textContent = formatCompactMoney(currentPrice);
      levelDeltaEl.textContent = `+${formatCompactMoney(config.levelPriceIncrease * multiplier)}/lvl`;
      pkgsSoldEl.textContent = formatCount(mState.packagesSold);

      containerBtn.hidden = !mState.unlocked;

      if (!mState.unlocked) {
        // Locked Recipe state
        const unlockCost = config.recipeUnlockCost;
        const canAfford = state.cash >= unlockCost;
        const progressPct = Math.min(100, Math.max(0, (state.cash / unlockCost) * 100));

        card.classList.add('is-locked');
        card.classList.toggle('can-afford', canAfford);
        lockedBadge.style.display = 'grid';
        levelBadge.textContent = 'RECIPE LOCKED';
        gradeTag.textContent = config.subtitle;

        affordBarEl.style.width = `${progressPct}%`;
        actionBtn.disabled = !canAfford;
        actionBtn.classList.add('recipe-unlock-btn');
        actionBtn.classList.toggle('is-affordable', canAfford);

        btnTitle.textContent = `Unlock ${config.name} Recipe`;
        btnSub.textContent = `Adds +${formatCompactMoney(config.baseSalePrice)}/click base package`;
        btnCost.textContent = formatCompactMoney(unlockCost);

        railBtn.classList.add('is-locked');
        railBtn.classList.toggle('can-afford', canAfford);
        railBtn.setAttribute(
          'aria-label',
          `${config.name}, recipe locked${canAfford ? ', can be unlocked' : ''}`
        );
      } else {
        // Unlocked Production Line state
        const upgradeCost = getMeatUpgradeCost(config, mState);
        const canAfford = state.cash >= upgradeCost;
        const progressPct = Math.min(100, Math.max(0, (state.cash / upgradeCost) * 100));

        const currentTier = config.containerTiers[mState.containerTier];
        const nextTier = getNextContainerTier(config, mState);
        const canAffordContainer = Boolean(nextTier) && state.cash >= nextTier.cost;
        const canAffordAny = canAfford || canAffordContainer;

        containerBtn.disabled = !canAffordContainer;
        containerBtn.classList.toggle('is-affordable', canAffordContainer);
        containerBtn.classList.toggle('is-maxed', !nextTier);
        if (nextTier) {
          document.getElementById(`btn-container-title-${config.id}`).textContent = `${nextTier.name} Container`;
          document.getElementById(`btn-container-sub-${config.id}`).textContent = `×${nextTier.multiplier} value`;
          document.getElementById(`btn-container-cost-${config.id}`).textContent = formatCompactMoney(nextTier.cost);
          containerBtn.setAttribute(
            'aria-label',
            `Buy ${nextTier.name} container for ${config.name}: ${nextTier.multiplier} times value, costs ${formatCompactMoney(nextTier.cost)}`
          );
        } else {
          document.getElementById(`btn-container-title-${config.id}`).textContent = `${currentTier.name} Container`;
          document.getElementById(`btn-container-sub-${config.id}`).textContent = `×${currentTier.multiplier} value`;
          document.getElementById(`btn-container-cost-${config.id}`).textContent = 'MAX';
          containerBtn.setAttribute('aria-label', `${config.name} has the top container tier, ${currentTier.name}`);
        }

        card.classList.remove('is-locked');
        card.classList.toggle('can-afford', canAffordAny);
        lockedBadge.style.display = 'none';
        levelBadge.textContent = `LVL ${mState.level}`;
        gradeTag.textContent = getQualityGradeName(config, mState.level);

        affordBarEl.style.width = `${progressPct}%`;
        actionBtn.disabled = !canAfford;
        actionBtn.classList.remove('recipe-unlock-btn');
        actionBtn.classList.toggle('is-affordable', canAfford);

        const qualityPrice = getMeatQualityPrice(config, mState.level);
        const nextPrice = getMeatQualityPrice(config, mState.level + 1) * multiplier;
        btnTitle.textContent = `Upgrade Quality → Lvl ${mState.level + 1}`;
        if (mState.level === 1) {
          btnSub.textContent = `Base upgrade • Next price: ${formatCompactMoney(nextPrice)}/pkg`;
        } else {
          btnSub.textContent = `${formatCount(config.upgradeClicksEquivalent)} clicks @ ${formatCompactMoney(qualityPrice)} • Next: ${formatCompactMoney(nextPrice)}`;
        }
        btnCost.textContent = formatCompactMoney(upgradeCost);

        railLevel.textContent = formatCount(mState.level);
        railBtn.classList.remove('is-locked');
        railBtn.classList.toggle('can-afford', canAffordAny);
        railBtn.setAttribute(
          'aria-label',
          `${config.name}, level ${mState.level}, ${currentTier.name} container${canAffordAny ? ', can be upgraded' : ''}`
        );
      }
    });
  }

  /**
   * Refreshes the bot card, its rail icon, and the bot strip under the press.
   */
  function renderBotCard() {
    const bot = state.bot;
    const rate = getBotClicksPerMinute(bot.level);
    const isMaxed = bot.level >= BOT_MAX_LEVEL;
    const cost = isMaxed ? 0 : getBotLevelCost(bot.level + 1);
    const canAfford = !isMaxed && state.cash >= cost;

    document.getElementById('bot-level-badge').textContent = isMaxed ? `LVL ${bot.level} • MAX` : `LVL ${bot.level}`;
    document.getElementById('bot-rate').textContent = formatCount(rate);
    document.getElementById('bot-clicks').textContent = formatCount(bot.clicks);
    document.getElementById('bot-eaten').textContent = formatCount(bot.packagesEaten);
    document.getElementById('bot-card').classList.toggle('can-afford', canAfford);

    const btn = document.getElementById('btn-bot-upgrade');
    btn.disabled = !canAfford;
    btn.classList.toggle('is-affordable', canAfford);
    if (isMaxed) {
      document.getElementById('btn-bot-title').textContent = 'Bot Fully Upgraded';
      document.getElementById('btn-bot-sub').textContent = `${rate} clicks/min (max level)`;
      document.getElementById('btn-bot-cost').textContent = 'MAX';
      document.getElementById('afford-bar-bot').style.width = '100%';
    } else {
      document.getElementById('btn-bot-title').textContent = `Upgrade Bot → Lvl ${bot.level + 1}`;
      document.getElementById('btn-bot-sub').textContent =
        `${rate} → ${getBotClicksPerMinute(bot.level + 1)} clicks/min`;
      document.getElementById('btn-bot-cost').textContent = formatCompactMoney(cost);
      document.getElementById('afford-bar-bot').style.width =
        `${Math.min(100, Math.max(0, (state.cash / cost) * 100))}%`;
    }

    const railBtn = document.getElementById('rail-btn-bot');
    document.getElementById('rail-level-bot').textContent = formatCount(bot.level);
    railBtn.classList.toggle('can-afford', canAfford);
    railBtn.setAttribute(
      'aria-label',
      `Packing Bot, level ${bot.level}, ${rate} clicks per minute${canAfford ? ', can be upgraded' : ''}`
    );

    elBotStripLabel.textContent = `Bot L${bot.level} • ${rate} clicks/min`;
  }

  // =========================================================================
  // GAMEPLAY INTERACTIONS: PACKAGING PRESS & UPGRADES
  // =========================================================================

  /**
   * Sells one press cycle's packages and updates the counters. `shippedItems` is the batch
   * minus any package the bot ate. Returns the cash earned.
   */
  function sellBatch(shippedItems) {
    let batchYield = 0;
    shippedItems.forEach(({ mState, price }) => {
      mState.packagesSold += 1;
      mState.totalRevenue += price;
      batchYield += price;
    });

    state.totalClicks += 1;
    state.totalPackages += shippedItems.length;
    state.cash += batchYield;
    state.totalEarned += batchYield;
    return batchYield;
  }

  /**
   * Executes 1 factory press cycle from the player:
   * Creates 1 package of each unlocked meat and sells the batch immediately.
   */
  function handlePackageClick(clientX, clientY) {
    const { unlockedCount, activeItems } = getBatchSummary();
    if (unlockedCount === 0) return;

    const totalYield = sellBatch(activeItems);

    // Audio & visual feedback
    audio.playPressStamp();
    pullLever();
    triggerTreasuryPulse();
    spawnFloatingPayout(`+${formatCompactMoney(totalYield)} (${unlockedCount} pkg${unlockedCount > 1 ? 's' : ''})`, clientX, clientY);
    spawnConveyorPackages(activeItems, totalYield);

    saveState();
    renderUI();
  }

  /**
   * Runs `count` bot press cycles. Each one has a BOT_EAT_CHANCE chance of the bot eating one
   * random package from the batch, which is then neither sold nor counted. Usually `count` is 1;
   * it is larger only when a background tab's timers were throttled. Feedback shows the last press.
   */
  function runBotPresses(count) {
    const { unlockedCount, activeItems } = getBatchSummary();
    if (unlockedCount === 0 || count <= 0) return;

    let lastShipped = activeItems;
    let lastYield = 0;
    let lastEaten = null;

    for (let i = 0; i < count; i++) {
      let shipped = activeItems;
      lastEaten = null;
      if (Math.random() < BOT_EAT_CHANCE) {
        const eatenIdx = Math.floor(Math.random() * activeItems.length);
        lastEaten = activeItems[eatenIdx].config;
        shipped = activeItems.filter((_, idx) => idx !== eatenIdx);
        state.bot.packagesEaten += 1;
      }
      lastYield = sellBatch(shipped);
      lastShipped = shipped;
      state.bot.clicks += 1;
    }

    pullLever();
    if (lastShipped.length > 0) {
      spawnFloatingPayout(`BOT +${formatCompactMoney(lastYield)}`);
    }
    if (lastEaten) {
      spawnFloatingPayout(`BOT ATE 1 ${lastEaten.name.toUpperCase()}`, undefined, undefined, 'is-eaten');
    }
    spawnConveyorPackages(
      lastShipped,
      lastYield,
      lastEaten ? `Bot ate a ${lastEaten.name} package! No sale.` : `Bot shipped ${lastShipped.length} pkg${lastShipped.length === 1 ? '' : 's'} → +${formatCompactMoney(lastYield)}`
    );

    saveState();
    renderUI();
  }

  // Bot timing: progress toward the next press accumulates from real elapsed time, so a level-up
  // takes effect immediately and throttled background timers catch up instead of losing presses.
  let botProgress = 0;
  let botLastTick = performance.now();

  function botTick() {
    const now = performance.now();
    const rate = getBotClicksPerMinute(state.bot.level);
    botProgress += ((now - botLastTick) * rate) / 60000;
    botLastTick = now;

    const due = Math.floor(botProgress);
    if (due > 0) {
      botProgress -= due;
      runBotPresses(due);
    }

    elBotStripFill.style.width = `${Math.min(100, botProgress * 100)}%`;
  }

  function handleBotUpgrade() {
    if (state.bot.level >= BOT_MAX_LEVEL) return;
    const cost = getBotLevelCost(state.bot.level + 1);
    if (state.cash < cost) return;

    state.cash -= cost;
    state.bot.level += 1;

    audio.playUpgrade();
    flashCard('bot-card');
    elLastSaleReadout.textContent = `Bot upgraded to Lvl ${state.bot.level} (${getBotClicksPerMinute(state.bot.level)} clicks/min)`;

    saveState();
    renderUI();
  }

  /**
   * Handles clicking a meat card's action button (either Unlock Recipe or Upgrade Quality).
   */
  function handleMeatAction(meatId) {
    const config = MEAT_CATALOG.find((m) => m.id === meatId);
    if (!config) return;
    const mState = state.meats[meatId];

    if (!mState.unlocked) {
      // Unlock Recipe
      const cost = config.recipeUnlockCost;
      if (state.cash < cost) return;

      state.cash -= cost;
      mState.unlocked = true;
      mState.level = 1;
      state.beltOrder.push(meatId);
      addBeltRow(config, true);

      audio.playRecipeUnlock();
      flashCard(`meat-card-${meatId}`);
      elLastSaleReadout.textContent = `Unlocked ${config.name} Recipe!`;
    } else {
      // Upgrade Meat Quality Level
      const cost = getMeatUpgradeCost(config, mState);
      if (state.cash < cost) return;

      state.cash -= cost;
      mState.level += 1;

      audio.playUpgrade();
      flashCard(`meat-card-${meatId}`);
      const newPrice = getMeatSalePrice(config, mState);
      elLastSaleReadout.textContent = `${config.name} upgraded to Lvl ${mState.level} (${formatCompactMoney(newPrice)}/pkg)`;
    }

    saveState();
    renderUI();
  }

  /**
   * Buys the next container tier for an unlocked meat.
   */
  function handleContainerPurchase(meatId) {
    const config = MEAT_CATALOG.find((m) => m.id === meatId);
    if (!config) return;
    const mState = state.meats[meatId];
    if (!mState.unlocked) return;

    const nextTier = getNextContainerTier(config, mState);
    if (!nextTier || state.cash < nextTier.cost) return;

    state.cash -= nextTier.cost;
    mState.containerTier += 1;

    audio.playUpgrade();
    flashCard(`meat-card-${meatId}`);
    const newPrice = getMeatSalePrice(config, mState);
    elLastSaleReadout.textContent = `${config.name} now ships in ${nextTier.name} containers (×${nextTier.multiplier}, ${formatCompactMoney(newPrice)}/pkg)`;

    saveState();
    renderUI();
  }

  function flashCard(cardId) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.remove('just-upgraded');
    void card.offsetWidth;
    card.classList.add('just-upgraded');
  }

  function triggerTreasuryPulse() {
    elCashBalance.classList.remove('pulse-bump');
    void elCashBalance.offsetWidth;
    elCashBalance.classList.add('pulse-bump');
    setTimeout(() => {
      elCashBalance.classList.remove('pulse-bump');
    }, 130);
  }

  /**
   * Spawns a floating popup (e.g. "+$X") inside the hydraulic press housing, at the pointer if given.
   */
  function spawnFloatingPayout(text, clientX, clientY, variantClass = '') {
    const housingRect = document.getElementById('press-housing').getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = variantClass ? `floating-payout ${variantClass}` : 'floating-payout';

    let x = housingRect.width / 2 + (Math.random() * 70 - 35);
    let y = housingRect.height / 2 - 20 + (Math.random() * 30 - 15);

    if (typeof clientX === 'number' && typeof clientY === 'number' && clientX > 0 && clientY > 0) {
      x = clientX - housingRect.left + (Math.random() * 36 - 18);
      y = clientY - housingRect.top - 12;
    }

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.textContent = text;

    elFloatingPopups.appendChild(popup);
    setTimeout(() => {
      popup.remove();
    }, 900);
  }

  /**
   * Spawns one package per unlocked meat, each on its own belt, as the lever bottoms out.
   */
  function spawnConveyorPackages(activeItems, totalYield, readoutText) {
    elLastSaleReadout.textContent =
      readoutText || `Shipped ${activeItems.length} pkg${activeItems.length > 1 ? 's' : ''} → +${formatCompactMoney(totalYield)}`;

    setTimeout(() => {
      elPackerMachine.classList.remove('is-stamping');
      void elPackerMachine.offsetWidth;
      elPackerMachine.classList.add('is-stamping');

      const runMs = (elBeltLines.clientWidth / BELT_SPEED_PX_PER_SEC) * 1000;

      elBeltLines.classList.add('belt-moving');
      clearTimeout(beltTimeout);
      beltTimeout = setTimeout(() => {
        elBeltLines.classList.remove('belt-moving');
      }, runMs);

      activeItems.forEach(({ config, price }) => {
        const stage = document.getElementById(`belt-stage-${config.id}`);
        if (!stage) return; // Belt removed by a factory reset during the lever pull

        // Cap simultaneous DOM elements on ultra-fast clicking to keep 60fps
        if (stage.childElementCount >= MAX_PACKAGES_PER_BELT) {
          stage.firstElementChild.remove();
        }

        const runner = document.createElement('div');
        runner.className = 'pkg-runner';
        runner.style.animationDuration = `${runMs}ms`;
        runner.innerHTML = `
          <div class="conveyor-pkg">
            <img src="${config.image}" alt="${config.name}" />
            <span class="conveyor-pkg-price">${formatMoney(price, 1e5)}</span>
          </div>
        `;
        runner.addEventListener('animationend', () => runner.remove());
        stage.appendChild(runner);
      });
    }, LEVER_PULL_MS);
  }

  // =========================================================================
  // WORKER & LEVER ANIMATION
  // =========================================================================

  function rotatePoint(point, originX, originY, degrees) {
    const rad = (degrees * Math.PI) / 180;
    const dx = point.x - originX;
    const dy = point.y - originY;
    return {
      x: originX + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: originY + dx * Math.sin(rad) + dy * Math.cos(rad)
    };
  }

  /**
   * Draws an arm from shoulder to hand as two equal segments, with the elbow bending downward.
   */
  function drawArm(elArm, elGlove, shoulder, hand) {
    const seg = WORKER_RIG.armSegment;
    const dx = hand.x - shoulder.x;
    const dy = hand.y - shoulder.y;
    const dist = Math.hypot(dx, dy);
    const bend = Math.sqrt(Math.max(0, seg * seg - (dist * dist) / 4));
    const elbowX = shoulder.x + dx / 2 - (dy / dist) * bend;
    const elbowY = shoulder.y + dy / 2 + (dx / dist) * bend;

    elArm.setAttribute('d', `M${shoulder.x} ${shoulder.y} L${elbowX} ${elbowY} L${hand.x} ${hand.y}`);
    elGlove.setAttribute('cx', hand.x);
    elGlove.setAttribute('cy', hand.y);
  }

  /**
   * Poses the lever and worker for a pull amount from 0 (rest) to 1 (fully pulled).
   */
  function setLeverPose(pull) {
    const { pivotX, pivotY, gripLength, restDeg, pulledDeg } = LEVER_RIG;
    const { hipX, hipY, leanDeg, nearShoulder, farShoulder } = WORKER_RIG;

    const leverDeg = restDeg + (pulledDeg - restDeg) * pull;
    const lean = leanDeg * pull;
    const hand = rotatePoint({ x: pivotX, y: pivotY - gripLength }, pivotX, pivotY, leverDeg);

    elWorkerLever.setAttribute('transform', `rotate(${leverDeg} ${pivotX} ${pivotY})`);
    elWorkerBody.setAttribute('transform', `rotate(${lean} ${hipX} ${hipY})`);
    drawArm(elWorkerArmFar, elWorkerGloveFar, rotatePoint(farShoulder, hipX, hipY, lean), hand);
    drawArm(elWorkerArmNear, elWorkerGloveNear, rotatePoint(nearShoulder, hipX, hipY, lean), hand);
    elConsoleLed.classList.toggle('is-lit', pull > 0.1);
  }

  function animateLever(now) {
    const elapsed = now - leverPullStart;

    if (elapsed < LEVER_PULL_MS) {
      leverPull = leverPullFrom + (1 - leverPullFrom) * (elapsed / LEVER_PULL_MS);
    } else {
      leverPull = Math.max(0, 1 - (elapsed - LEVER_PULL_MS) / LEVER_RETURN_MS);
    }

    setLeverPose(leverPull);
    leverFrame = leverPull > 0 ? requestAnimationFrame(animateLever) : null;
  }

  /**
   * Starts a lever pull. A click during a pull restarts it from the lever's current position.
   */
  function pullLever() {
    leverPullFrom = leverPull;
    leverPullStart = performance.now();
    if (leverFrame === null) {
      leverFrame = requestAnimationFrame(animateLever);
    }
  }

  // =========================================================================
  // EVENT LISTENERS & KEYBOARD CONTROLS
  // =========================================================================
  function bindEvents() {
    elPressBtn.addEventListener('click', (e) => {
      handlePackageClick(e.clientX, e.clientY);
    });

    // Global Spacebar / Enter support for comfortable clicker play
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && !elBlueprintModal.hidden) {
        elBlueprintModal.hidden = true;
        return;
      }

      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag === 'SELECT' || activeTag === 'INPUT' || activeTag === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && elBlueprintModal.hidden) {
        // Avoid double-triggering if the button itself is focused (browser fires click on Space)
        if (document.activeElement === elPressBtn) return;
        e.preventDefault();
        elPressBtn.classList.add('is-pressed');
        handlePackageClick();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        elPressBtn.classList.remove('is-pressed');
      }
    });

    // Sound toggle
    elBtnToggleSound.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      audio.enabled = state.soundEnabled;
      saveState();
      renderUI();
    });

    // Upgrades sidebar
    function toggleSidebar() {
      state.sidebarOpen = !state.sidebarOpen;
      saveState();
      renderUI();
    }

    elBtnToggleSidebar.addEventListener('click', toggleSidebar);
    elBtnCloseSidebar.addEventListener('click', toggleSidebar);

    // Blueprint modal controls
    elBtnOpenBlueprint.addEventListener('click', () => {
      elBlueprintModal.hidden = false;
    });

    elBtnCloseBlueprint.addEventListener('click', () => {
      elBlueprintModal.hidden = true;
    });

    elBlueprintModal.addEventListener('click', (e) => {
      if (e.target === elBlueprintModal) {
        elBlueprintModal.hidden = true;
      }
    });

    // Cost Mode selector
    elSelectCostMode.addEventListener('change', (e) => {
      state.costMode = e.target.value;
      saveState();
      renderUI();
    });

    // Factory reset
    elBtnResetFactory.addEventListener('click', () => {
      if (window.confirm('Reset all factory treasury, recipes, and meat quality upgrades?')) {
        state = createDefaultState();
        botProgress = 0;
        botLastTick = performance.now(); // Don't credit the new factory for time spent in the dialog
        saveState();
        rebuildBeltRows();
        renderUI();
        elBlueprintModal.hidden = true;
        elLastSaleReadout.textContent = 'Factory reset to initial state';
      }
    });
  }

  // Initialize Factory Floor
  // The expanded sidebar covers the game on narrow screens, so start with it minimized there
  if (window.matchMedia('(max-width: 900px)').matches) {
    state.sidebarOpen = false;
  }

  buildMeatCardsDOM();
  buildMeatRailDOM();
  rebuildBeltRows();
  setLeverPose(0);
  bindEvents();
  renderUI();
  setInterval(botTick, BOT_TICK_MS);
})();
