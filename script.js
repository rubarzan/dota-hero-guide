
const attributeOrder = ["str", "agi", "int", "all"];

const attributeNames = {
    str: "Strength",
    agi: "Agility",
    int: "Intelligence",
    all: "Universal"
};

/* =========================
   ITEM DATA
   ========================= */

const ITEM_LIST_URL = "https://api.opendota.com/api/constants/items";
const ITEM_IMAGE_BASE_URL = "https://cdn.cloudflare.steamstatic.com";

let itemData = new Map();
let allHeroes = [];

/* =========================
   DRAFT GUIDELINES
   ========================= */

const draftGuidelines = {
    pickAlongside: [
        "Heroes that can provide bonus damage or armor reduction are good for PA.",
        "Heroes that can provide CC (Crowd Control), vision, and initiation are also good for PA."
    ],

    avoidAlongside: [
        "Heroes that rely on passives or evasion to survive or function effectively.",
        "Core heroes that are weak in the early to mid game.",
        "Heroes that deal only physical damage."
    ],

    pickAgainst: [
        "Heroes with high armor or physical immunity.",
        "Heroes with BKB (Black King Bar)-piercing stuns."
    ],

    avoidPickingAgainst: [
        "Heroes that are susceptible to being bursted down.",
        "Heroes that rely heavily on positioning to survive."
    ]
};

/* =========================
   NORMALIZE ITEM NAME
   ========================= */

function normalizeItemName(name) {
    if (!name) return "";

    return name
        .toString()
        .toLowerCase()
        .replaceAll("’", "'")
        .replaceAll("&", "and")
        .replaceAll("'", "")
        .replace(/[^a-z0-9]+/g, "")
        .trim();
}

/* =========================
   LOAD ITEM DATA
   ========================= */

async function loadItemData() {
    try {
        const response = await fetch(ITEM_LIST_URL);

        if (!response.ok) {
            throw new Error(`Item list request failed: ${response.status}`);
        }

        const data = await response.json();

        Object.entries(data).forEach(([itemKey, item]) => {
            if (!item) return;

            if (item.dname) {
                itemData.set(normalizeItemName(item.dname), item);
            }

            if (itemKey) {
                itemData.set(normalizeItemName(itemKey), item);
            }
        });

        console.log(`Loaded ${itemData.size} Dota item references.`);
    } catch (error) {
        console.error("Could not load item data:", error);
    }
}

/* =========================
   FIND ITEM
   ========================= */

function findItem(itemName) {
    if (!itemName) return null;

    return itemData.get(normalizeItemName(itemName)) || null;
}

/* =========================
   CREATE COMMON ITEMS
   ========================= */

function createCommonItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return "";
    }

    const itemElements = items.map(itemName => {
        const item = findItem(itemName);

        if (!item || !item.img) {
            console.warn(`Could not find Dota item image: ${itemName}`);
            return "";
        }

        const imageUrl = `${ITEM_IMAGE_BASE_URL}${item.img}`;

        return `
            <img
                class="common-item-image"
                src="${imageUrl}"
                alt="${item.dname || itemName}"
                title="${item.dname || itemName}"
            >
        `;
    }).filter(Boolean).join("");

    if (!itemElements) return "";

    return `
        <div class="common-items">
            ${itemElements}
        </div>
    `;
}

/* =========================
   HERO GUIDE FILES
   ========================= */

function getHeroFileName(heroName) {
    return heroName
        .toLowerCase()
        .replaceAll("'", "")
        .replaceAll(" ", "-");
}

async function loadHeroGuide(heroName) {
    const fileName = getHeroFileName(heroName);

    try {
        const response = await fetch(`guides/${fileName}.json`);

        if (!response.ok) return null;

        return await response.json();
    } catch (error) {
        console.error(`Could not load guide for ${heroName}:`, error);
        return null;
    }
}

/* =========================
   LOAD HEROES
   ========================= */

async function loadHeroes() {
    const heroSelection = document.getElementById("hero-selection");

    try {
        const response = await fetch(
            "https://api.opendota.com/api/heroStats"
        );

        if (!response.ok) {
            throw new Error(`Hero list request failed: ${response.status}`);
        }

        const heroes = await response.json();

        allHeroes = heroes;

        attributeOrder.forEach(attribute => {
            const attributeHeroes = heroes
                .filter(hero => hero.primary_attr === attribute)
                .sort((a, b) =>
                    a.localized_name.localeCompare(b.localized_name)
                );

            if (attributeHeroes.length === 0) return;

            const section = document.createElement("section");
            section.className = "attribute-section";

            const title = document.createElement("h2");
            title.className = "attribute-title";
            title.textContent = attributeNames[attribute];

            const grid = document.createElement("div");
            grid.className = "hero-grid";

            attributeHeroes.forEach(hero => {
                const card = document.createElement("div");
                card.className = "hero-card";

                card.innerHTML = `
                    <img
                        class="hero-image"
                        src="https://cdn.cloudflare.steamstatic.com${hero.img}"
                        alt="${hero.localized_name}"
                    >
                    <div class="hero-name">${hero.localized_name}</div>
                `;

                card.addEventListener("click", () => {
                    showHeroGuide(hero);
                });

                grid.appendChild(card);
            });

            section.appendChild(title);
            section.appendChild(grid);
            heroSelection.appendChild(section);
        });
    } catch (error) {
        console.error("Could not load heroes:", error);
    }
}

/* =========================
   CREATE BULLET LIST
   ========================= */

function createBulletList(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return "<li>Guide content will be added here.</li>";
    }

    return items.map(item => `<li>${item}</li>`).join("");
}

/* =========================
   CREATE HERO PROFILE PHASE
   ========================= */

function createPhaseSection(title, phaseData) {
    if (!phaseData) return "";

    const strengths = phaseData.strengths || [];
    const weaknesses = phaseData.weaknesses || [];

    return `
        <div class="guide-section">
            <h3>${title}</h3>

            ${phaseData.description ? `<p>${phaseData.description}</p>` : ""}

            <div class="pros-cons">
                <div class="pros-cons-column">
                    <h4>Strengths &amp; Mechanics</h4>
                    <ul>${createBulletList(strengths)}</ul>
                </div>

                <div class="pros-cons-column">
                    <h4>Weaknesses &amp; Limitations</h4>
                    <ul>${createBulletList(weaknesses)}</ul>
                </div>
            </div>
        </div>
    `;
}

/* =========================
   CREATE GAMEPLAY SECTION
   ========================= */

function createGameplaySection(title, gameplayData) {
    if (!gameplayData) return "";

    let sections = "";

    const gameplayPhases = [
        { key: "general", title: "General Tips" },
        { key: "laningPhase", title: "Laning Phase" },
        { key: "preBKB", title: "Early-Mid Game (Before BKB)" },
        { key: "postBKB", title: "Late Game (Post-BKB)" }
    ];

    gameplayPhases.forEach(phase => {
        const items = gameplayData[phase.key];

        if (Array.isArray(items) && items.length > 0) {
            sections += `
                <div class="gameplay-subsection">
                    <h4>${phase.title}</h4>
                    <ul>${createBulletList(items)}</ul>
                </div>
            `;
        }
    });

    if (!sections) return "";

    return `
        <div class="guide-section">
            <h3>${title}</h3>
            ${sections}
        </div>
    `;
}

/* =========================
   CREATE DRAFT HERO IMAGES
   ========================= */

function createDraftHeroImages(heroNames) {
    if (!Array.isArray(heroNames) || heroNames.length === 0) {
        return '<p class="draft-empty">Hero images will be added here.</p>';
    }

    const images = heroNames.map(name => {
        const hero = allHeroes.find(item =>
            item.localized_name.toLowerCase() === name.toLowerCase()
        );

        if (!hero) {
            console.warn(`Could not find draft hero: ${name}`);
            return "";
        }

        return `
            <img
                class="draft-hero-image"
                src="https://cdn.cloudflare.steamstatic.com${hero.img}"
                alt="${hero.localized_name}"
                title="${hero.localized_name}"
                loading="lazy"
            >
        `;
    }).filter(Boolean).join("");

    return images || '<p class="draft-empty">No matching hero images found.</p>';
}

/* =========================
   CREATE DRAFT CARD
   ========================= */

function createDraftCard(title, key, draft) {
    const tips = draftGuidelines[key] || [];
    const heroNames = Array.isArray(draft[key]) ? draft[key] : [];

    return `
        <div class="draft-card">
            <h4>${title}</h4>

            <ul class="draft-guidelines">
                ${createBulletList(tips)}
            </ul>

            <div class="draft-hero-grid">
                ${createDraftHeroImages(heroNames)}
            </div>
        </div>
    `;
}

/* =========================
   CREATE DRAFT SECTION
   ========================= */

function createDraftSectionGroup(guideData) {
    const draft = guideData.draft || {};

    return `
        <div class="guide-section draft-section">
            <h3>Draft</h3>

            <div class="draft-layout">
                ${createDraftCard("Pick Alongside", "pickAlongside", draft)}

                ${createDraftCard("Avoid Alongside", "avoidAlongside", draft)}

                ${createDraftCard("Pick Against", "pickAgainst", draft)}

                ${createDraftCard("Avoid Picking Against", "avoidPickingAgainst", draft)}
            </div>
        </div>
    `;
}

/* =========================
   SHOW HERO GUIDE
   ========================= */

async function showHeroGuide(hero) {
    const guide = document.getElementById("hero-guide");
    const content = document.getElementById("guide-content");

    const imageUrl = `https://cdn.cloudflare.steamstatic.com${hero.img}`;
    const guideData = await loadHeroGuide(hero.localized_name);

    if (!guideData) {
        content.innerHTML = `
            <div class="guide-header">
                <img src="${imageUrl}" alt="${hero.localized_name}">
                <h2>${hero.localized_name}</h2>
            </div>
            <p>Guide not available yet.</p>
        `;

        guide.style.display = "block";
        guide.scrollIntoView({ behavior: "smooth" });
        return;
    }

    const heroProfile = guideData.heroProfile || {};

    const commonItems = createCommonItems(guideData.commonItems);

    const gameplay = guideData.gameplay || {};
    const playingAlongside = gameplay.playingAlongside || {};
    const playingAgainst = gameplay.playingAgainst || {};

    content.innerHTML = `
        <div class="guide-header">
            <img src="${imageUrl}" alt="${hero.localized_name}">

            <div class="guide-title-area">
                <div class="guide-title-row">
                    <h2>${hero.localized_name}</h2>
                    ${commonItems}
                </div>
            </div>
        </div>

        <div class="guide-section">
            <h3>Hero Profile</h3>
        </div>

        ${createPhaseSection("Laning Phase", heroProfile.laningPhase)}

        ${createPhaseSection("Early-Mid Game", heroProfile.preBKB)}

        ${createPhaseSection("Late Game: Post-BKB", heroProfile.postBKB)}

        ${createGameplaySection("How to Play Alongside PA", playingAlongside)}

        ${createGameplaySection("How to Play Against PA", playingAgainst)}

        ${createDraftSectionGroup(guideData)}
    `;

    guide.style.display = "block";
    guide.scrollIntoView({ behavior: "smooth" });
}

/* =========================
   START
   ========================= */

async function start() {
    await loadItemData();
    await loadHeroes();
}

start();

/* DRAFT SECTION */

.draft-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.draft-card {
    min-width: 0;
    padding: 18px;
    background: rgba(255, 255, 255, 0.035);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 10px;
    transition: background 0.2s ease, border-color 0.2s ease;
}

.draft-card:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
}

.draft-card h4 {
    margin: 0 0 14px;
    font-size: 18px;
}

.draft-guidelines {
    padding-left: 20px;
    margin: 0 0 16px;
}

.draft-guidelines li {
    margin-bottom: 8px;
    line-height: 1.55;
}

.draft-hero-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.draft-hero-image {
    display: block;
    width: 68px;
    height: 68px;
    object-fit: cover;
    border-radius: 5px;
    background: rgba(0, 0, 0, 0.2);
    transition: transform 0.18s ease;
}

.draft-hero-image:hover {
    transform: scale(1.07);
}

.draft-empty {
    margin: 0;
    color: #888;
    font-size: 13px;
}

@media (max-width: 700px) {
    .draft-layout {
        grid-template-columns: 1fr;
    }

    .draft-card {
        padding: 15px;
    }

    .draft-hero-image {
        width: 58px;
        height: 58px;
    }
}
