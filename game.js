/**
 * SPAM THE MEATS // AMALGAMATED MEATWORKS CO.
 * Core Clicker Game Engine, Economy Math, Conveyor Visualizer & Audio Synth
 */

(() => {
  'use strict';

  const STORAGE_KEY = 'spam_the_meats_save_v1';

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

      if (parsed.meats && typeof parsed.meats === 'object') {
        MEAT_CATALOG.forEach((item) => {
          const savedMeat = parsed.meats[item.id];
          if (savedMeat) {
            base.meats[item.id] = {
              unlocked: item.startsUnlocked ? true : Boolean(savedMeat.unlocked),
              level: Math.max(1, Math.floor(Number(savedMeat.level) || 1)),
              packagesSold: Math.max(0, Math.floor(Number(savedMeat.packagesSold) || 0)),
              totalRevenue: Math.max(0, Number(savedMeat.totalRevenue) || 0)
            };
          }
        });
      }

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
   * Sale price of 1 package of a meat at its current level.
   * Level 1 = baseSalePrice
   * Each level up (+1) increases sale price by levelPriceIncrease.
   */
  function getMeatSalePrice(config, meatState) {
    const upgradesCount = Math.max(0, meatState.level - 1);
    return config.baseSalePrice + upgradesCount * config.levelPriceIncrease;
  }

  /**
   * Cost to upgrade a meat from its current level to (level + 1).
   * - First upgrade (Level 1 -> Level 2, i.e., upgradesCount === 0):
   *   Always costs `config.baseUpgradeCost`.
   * - Each additional upgrade (Level 2+, i.e., upgradesCount >= 1):
   *   Requires the equivalent of `upgradeClicksEquivalent` clicks at the current price.
   */
  function getMeatUpgradeCost(config, meatState, mode = state.costMode) {
    const upgradesCount = Math.max(0, meatState.level - 1);
    if (upgradesCount === 0) {
      return config.baseUpgradeCost;
    }

    const currentPrice = getMeatSalePrice(config, meatState);
    const clicksEquivalent = config.upgradeClicksEquivalent * currentPrice;

    if (mode === 'additive') {
      return config.baseUpgradeCost + clicksEquivalent;
    }

    if (mode === 'cumulative') {
      // Base cost + sum of N * price at each upgraded level from 1..upgradesCount
      let total = config.baseUpgradeCost;
      for (let u = 1; u <= upgradesCount; u++) {
        const priceAtLevel = config.baseSalePrice + u * config.levelPriceIncrease;
        total += config.upgradeClicksEquivalent * priceAtLevel;
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

  const elConveyorStage = document.getElementById('conveyor-stage');
  const elConveyorTrack = document.getElementById('conveyor-track');
  const elLastSaleReadout = document.getElementById('last-sale-readout');

  const elManifestTotalLabel = document.getElementById('manifest-total-label');
  const elBatchManifestList = document.getElementById('batch-manifest-list');

  const elUnlockedCount = document.getElementById('unlocked-count');
  const elTotalLevels = document.getElementById('total-levels');
  const elMeatLinesGrid = document.getElementById('meat-lines-grid');

  const elBtnToggleSound = document.getElementById('btn-toggle-sound');
  const elSoundIconLabel = document.getElementById('sound-icon-label');
  const elBtnOpenBlueprint = document.getElementById('btn-open-blueprint');
  const elBtnCloseBlueprint = document.getElementById('btn-close-blueprint');
  const elBlueprintModal = document.getElementById('blueprint-modal');
  const elSelectCostMode = document.getElementById('select-cost-mode');
  const elBtnResetFactory = document.getElementById('btn-reset-factory');

  let beltTimeout = null;

  /**
   * Builds the 6 meat production line cards once, then updates them reactively.
   */
  function buildMeatCardsDOM() {
    elMeatLinesGrid.innerHTML = '';

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
        </div>
      `;

      const actionBtn = card.querySelector(`#btn-action-${config.id}`);
      actionBtn.addEventListener('click', () => handleMeatAction(config.id));

      elMeatLinesGrid.appendChild(card);
    });
  }

  /**
   * Synchronizes all UI readouts, cards, affordability states, and manifest chips.
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
    elPressYieldBadge.textContent = `+${formatCompactMoney(totalYield)} / click`;

    // Deck header summary
    elUnlockedCount.textContent = `${unlockedCount} / ${MEAT_CATALOG.length}`;
    elTotalLevels.textContent = formatCount(totalUpgrades);

    // Active Batch Manifest pills
    elManifestTotalLabel.textContent = `${formatMoney(totalYield)} / Click`;
    elBatchManifestList.innerHTML = '';
    activeItems.forEach(({ config, mState, price }) => {
      const chip = document.createElement('div');
      chip.className = 'manifest-chip';
      chip.innerHTML = `
        <span class="manifest-chip-dot" style="background: ${config.accentColor};"></span>
        <span>1× ${config.name} <small style="color: var(--text-muted);">(L${mState.level})</small></span>
        <span class="manifest-chip-price">${formatCompactMoney(price)}</span>
      `;
      elBatchManifestList.appendChild(chip);
    });

    // Sound button state
    elBtnToggleSound.setAttribute('aria-pressed', String(state.soundEnabled));
    elSoundIconLabel.textContent = state.soundEnabled ? 'SFX: ON' : 'SFX: OFF';
    elSelectCostMode.value = state.costMode;

    // Update each of the 6 meat cards
    MEAT_CATALOG.forEach((config) => {
      const mState = state.meats[config.id];
      const card = document.getElementById(`meat-card-${config.id}`);
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

      const currentPrice = getMeatSalePrice(config, mState);
      salePriceEl.textContent = formatCompactMoney(currentPrice);
      levelDeltaEl.textContent = `+${formatCompactMoney(config.levelPriceIncrease)}/lvl`;
      pkgsSoldEl.textContent = formatCount(mState.packagesSold);

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
      } else {
        // Unlocked Production Line state
        const upgradeCost = getMeatUpgradeCost(config, mState);
        const canAfford = state.cash >= upgradeCost;
        const progressPct = Math.min(100, Math.max(0, (state.cash / upgradeCost) * 100));

        card.classList.remove('is-locked');
        card.classList.toggle('can-afford', canAfford);
        lockedBadge.style.display = 'none';
        levelBadge.textContent = `LVL ${mState.level}`;
        gradeTag.textContent = getQualityGradeName(config, mState.level);

        affordBarEl.style.width = `${progressPct}%`;
        actionBtn.disabled = !canAfford;
        actionBtn.classList.remove('recipe-unlock-btn');
        actionBtn.classList.toggle('is-affordable', canAfford);

        const nextPrice = currentPrice + config.levelPriceIncrease;
        btnTitle.textContent = `Upgrade Quality → Lvl ${mState.level + 1}`;
        if (mState.level === 1) {
          btnSub.textContent = `Base upgrade • Next price: ${formatCompactMoney(nextPrice)}/pkg`;
        } else {
          btnSub.textContent = `${formatCount(config.upgradeClicksEquivalent)} clicks @ ${formatCompactMoney(currentPrice)} • Next: ${formatCompactMoney(nextPrice)}`;
        }
        btnCost.textContent = formatCompactMoney(upgradeCost);
      }
    });
  }

  // =========================================================================
  // GAMEPLAY INTERACTIONS: PACKAGING PRESS & UPGRADES
  // =========================================================================

  /**
   * Executes 1 factory press cycle:
   * Creates 1 package of each unlocked meat and sells the batch immediately.
   */
  function handlePackageClick(clientX, clientY) {
    const { totalYield, unlockedCount, activeItems } = getBatchSummary();
    if (unlockedCount === 0) return;

    state.totalClicks += 1;
    state.totalPackages += unlockedCount;
    state.cash += totalYield;
    state.totalEarned += totalYield;

    activeItems.forEach(({ config, mState, price }) => {
      mState.packagesSold += 1;
      mState.totalRevenue += price;
    });

    // Audio & visual feedback
    audio.playPressStamp();
    triggerTreasuryPulse();
    spawnFloatingPayout(totalYield, unlockedCount, clientX, clientY);
    spawnConveyorPackages(activeItems, totalYield);

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

      audio.playRecipeUnlock();
      flashCard(meatId);
      elLastSaleReadout.textContent = `Unlocked ${config.name} Recipe!`;
    } else {
      // Upgrade Meat Quality Level
      const cost = getMeatUpgradeCost(config, mState);
      if (state.cash < cost) return;

      state.cash -= cost;
      mState.level += 1;

      audio.playUpgrade();
      flashCard(meatId);
      const newPrice = getMeatSalePrice(config, mState);
      elLastSaleReadout.textContent = `${config.name} upgraded to Lvl ${mState.level} (${formatCompactMoney(newPrice)}/pkg)`;
    }

    saveState();
    renderUI();
  }

  function flashCard(meatId) {
    const card = document.getElementById(`meat-card-${meatId}`);
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
   * Spawns a floating "+$X" revenue popup inside the hydraulic press housing.
   */
  function spawnFloatingPayout(totalYield, pkgCount, clientX, clientY) {
    const housingRect = document.getElementById('press-housing').getBoundingClientRect();
    const popup = document.createElement('div');
    popup.className = 'floating-payout';

    let x = housingRect.width / 2 + (Math.random() * 70 - 35);
    let y = housingRect.height / 2 - 20 + (Math.random() * 30 - 15);

    if (typeof clientX === 'number' && typeof clientY === 'number' && clientX > 0 && clientY > 0) {
      x = clientX - housingRect.left + (Math.random() * 36 - 18);
      y = clientY - housingRect.top - 12;
    }

    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.textContent = `+${formatCompactMoney(totalYield)} (${pkgCount} pkg${pkgCount > 1 ? 's' : ''})`;

    elFloatingPopups.appendChild(popup);
    setTimeout(() => {
      popup.remove();
    }, 900);
  }

  /**
   * Spawns visual packages for each unlocked meat onto the conveyor belt.
   */
  function spawnConveyorPackages(activeItems, totalYield) {
    elConveyorTrack.classList.add('belt-moving');
    clearTimeout(beltTimeout);
    beltTimeout = setTimeout(() => {
      elConveyorTrack.classList.remove('belt-moving');
    }, 900);

    elLastSaleReadout.textContent = `Shipped ${activeItems.length} pkg${activeItems.length > 1 ? 's' : ''} → +${formatCompactMoney(totalYield)}`;

    // Cap simultaneous DOM elements on ultra-fast clicking to keep 60fps
    if (elConveyorStage.childElementCount > 24) {
      const oldest = elConveyorStage.firstElementChild;
      if (oldest) oldest.remove();
    }

    activeItems.forEach(({ config, price }, idx) => {
      setTimeout(() => {
        const pkg = document.createElement('div');
        pkg.className = 'conveyor-pkg';
        pkg.style.setProperty('--pkg-color', config.accentColor);
        pkg.innerHTML = `
          <img src="${config.image}" alt="${config.name}" />
          <span class="conveyor-pkg-price">${formatCompactMoney(price)}</span>
        `;
        elConveyorStage.appendChild(pkg);
        setTimeout(() => {
          pkg.remove();
        }, 850);
      }, idx * 75);
    });
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
        saveState();
        renderUI();
        elBlueprintModal.hidden = true;
        elLastSaleReadout.textContent = 'Factory reset to initial state';
      }
    });
  }

  // Initialize Factory Floor
  buildMeatCardsDOM();
  bindEvents();
  renderUI();
})();
