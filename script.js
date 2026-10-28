from pathlib import Path

script = r'''const attributeOrder = ["str", "agi", "int", "all"];

const attributeNames = {
    str: "Strength",
    agi: "Agility",
    int: "Intelligence",
    all: "Universal"
};

const ITEM_LIST_URL = "https://api.opendota.com/api/constants/items";
const ITEM_IMAGE_BASE_URL = "https://cdn.cloudflare.steamstatic.com";

let itemData = new Map();
let allHeroes = [];

/* =========================
   GENERAL HELPERS
   ========================= */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

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

function formatKeyAsTitle(key) {
    if (!key) return "";

    const knownLabels = {
        general: "General Tips",
        laningPhase: "Laning Phase",
        preBKB: "Early-Mid Game (Before BKB)",
        postBKB: "Late Game (Post-BKB)",
        preScepter: "Before Aghanim's Scepter",
        postScepter: "After Aghanim's Scepter"
    };

    if (knownLabels[key]) return knownLabels[key];

    return String(key)
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, character => character.toUpperCase());
}

/* =========================
   ITEM DATA
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

function findItem(itemName) {
    if (!itemName) return null;
    return itemData.get(normalizeItemName(itemName)) || null;
}

function createCommonItems(items) {
    if (!Array.isArray(items) || items.length === 0) return "";

    const itemElements = items.map(itemName => {
        const item = findItem(itemName);

        if (!item || !item.img) {
            console.warn(`Could not find Dota item image: ${itemName}`);
            return "";
        }

        const itemTitle = item.dname || itemName;
        const imageUrl = `${ITEM_IMAGE_BASE_URL}${item.img}`;

        return `
            <img
                class="common-item-image"
                src="${imageUrl}"
                alt="${escapeHTML(itemTitle)}"
                title="${escapeHTML(itemTitle)}"
                loading="lazy"
            >
        `;
    }).filter(Boolean).join("");

    if (!itemElements) return "";

    return `<div class="common-items">${itemElements}</div>`;
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

    if (!heroSelection) {
        console.error('Element "hero-selection" was not found.');
        return;
    }

    try {
        const response = await fetch("https://api.opendota.com/api/heroStats");

        if (!response.ok) {
            throw new Error(`Hero list request failed: ${response.status}`);
        }

        allHeroes = await response.json();
        heroSelection.innerHTML = "";

        attributeOrder.forEach(attribute => {
            const attributeHeroes = allHeroes
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
                        src="${ITEM_IMAGE_BASE_URL}${hero.img}"
                        alt="${escapeHTML(hero.localized_name)}"
                        loading="lazy"
                    >
                    <div class="hero-name">${escapeHTML(hero.localized_name)}</div>
                `;

                card.addEventListener("click", () => showHeroGuide(hero));
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
   BULLET LIST
   ========================= */

function createBulletList(items) {
    if (!Array.isArray(items) || items.length === 0) return "";

    return items
        .map(item => `<li>${escapeHTML(item)}</li>`)
        .join("");
}

/* =========================
   HERO PROFILE PHASES

   Preferred format:
   heroProfile: {
     phases: [
       {
         title: "Any title you want",
         description: "...",
         strengths: [],
         weaknesses: []
       }
     ]
   }

   Legacy format is also supported:
   heroProfile: {
     laningPhase: {...},
     preBKB: {...},
     postBKB: {...}
   }
   ========================= */

function getHeroProfilePhases(heroProfile) {
    if (Array.isArray(heroProfile.phases)) {
        return heroProfile.phases
            .filter(phase => phase && typeof phase === "object")
            .map((phase, index) => ({
                ...phase,
                title: phase.title || `Phase ${index + 1}`
            }));
    }

    // Backward compatibility for existing guide files.
    const reservedKeys = new Set(["phases"]);
    return Object.entries(heroProfile)
        .filter(([key, value]) =>
            !reservedKeys.has(key) &&
            value &&
            typeof value === "object" &&
            !Array.isArray(value)
        )
        .map(([key, value]) => ({
            ...value,
            title: value.title || formatKeyAsTitle(key)
        }));
}

function createPhaseSection(phaseData) {
    if (!phaseData) return "";

    const title = phaseData.title || "Untitled Phase";
    const description = phaseData.description || "";
    const strengths = Array.isArray(phaseData.strengths)
        ? phaseData.strengths
        : [];
    const weaknesses = Array.isArray(phaseData.weaknesses)
        ? phaseData.weaknesses
        : [];

    const hasProsCons = strengths.length > 0 || weaknesses.length > 0;

    return `
        <div class="guide-section">
            <h3>${escapeHTML(title)}</h3>
            ${description ? `<p>${escapeHTML(description)}</p>` : ""}
            ${hasProsCons ? `
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
            ` : ""}
        </div>
    `;
}

function createHeroProfileSection(heroProfile) {
    if (!heroProfile || typeof heroProfile !== "object") return "";

    const phases = getHeroProfilePhases(heroProfile);
    if (phases.length === 0) return "";

    return `
        <div class="guide-section">
            <h3>Hero Profile</h3>
        </div>
        ${phases.map(createPhaseSection).join("")}
    `;
}

/* =========================
   GAMEPLAY PHASES

   Preferred format:
   playingAlongside: {
     phases: [
       { title: "Any title", tips: ["..."] }
     ]
   }

   "items" can be used instead of "tips".
   Legacy format is also supported:
   general: [], laningPhase: [], preBKB: [], etc.
   Any array-valued key is displayed, with its key converted
   to a readable title unless an explicit title is provided.
   ========================= */

function getGameplayPhases(gameplayData) {
    if (Array.isArray(gameplayData.phases)) {
        return gameplayData.phases
            .filter(phase => phase && typeof phase === "object")
            .map((phase, index) => ({
                title: phase.title || `Phase ${index + 1}`,
                tips: Array.isArray(phase.tips)
                    ? phase.tips
                    : Array.isArray(phase.items)
                        ? phase.items
                        : Array.isArray(phase.guidelines)
                            ? phase.guidelines
                            : []
            }));
    }

    // Backward compatibility: every array-valued property is a section.
    return Object.entries(gameplayData)
        .filter(([, value]) => Array.isArray(value))
        .map(([key, value]) => ({
            title: formatKeyAsTitle(key),
            tips: value
        }));
}

function createGameplaySection(title, gameplayData) {
    if (!gameplayData || typeof gameplayData !== "object") return "";

    const phases = getGameplayPhases(gameplayData);

    const sections = phases
        .filter(phase => phase.tips.length > 0)
        .map(phase => `
            <div class="gameplay-subsection">
                <h4>${escapeHTML(phase.title)}</h4>
                <ul>${createBulletList(phase.tips)}</ul>
            </div>
        `)
        .join("");

    if (!sections) return "";

    return `
        <div class="guide-section">
            <h3>${escapeHTML(title)}</h3>
            ${sections}
        </div>
    `;
}

/* =========================
   DRAFT HERO IMAGES
   ========================= */

function createDraftHeroImages(heroNames) {
    if (!Array.isArray(heroNames) || heroNames.length === 0) {
        return '<p class="draft-empty">Hero images will be added here.</p>';
    }

    const images = heroNames.map(name => {
        const hero = allHeroes.find(item =>
            item.localized_name.toLowerCase() === String(name).toLowerCase()
        );

        if (!hero) {
            console.warn(`Could not find draft hero: ${name}`);
            return "";
        }

        return `
            <img
                class="draft-hero-image"
                src="${ITEM_IMAGE_BASE_URL}${hero.img}"
                alt="${escapeHTML(hero.localized_name)}"
                title="${escapeHTML(hero.localized_name)}"
                loading="lazy"
            >
        `;
    }).filter(Boolean).join("");

    return images ||
        '<p class="draft-empty">No matching hero images found.</p>';
}

/* =========================
   DRAFT CARDS
   ========================= */

function createDraftCard(title, key, draft) {
    const cardData = draft[key] || {};

    const guidelines = Array.isArray(cardData.guidelines)
        ? cardData.guidelines
        : [];

    const heroNames = Array.isArray(cardData.heroes)
        ? cardData.heroes
        : [];

    return `
        <div class="draft-card">
            <h4>${escapeHTML(title)}</h4>
            <ul class="draft-guidelines">${createBulletList(guidelines)}</ul>
            <div class="draft-hero-grid">
                ${createDraftHeroImages(heroNames)}
            </div>
        </div>
    `;
}

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

    if (!guide || !content) {
        console.error("Hero guide elements were not found.");
        return;
    }

    const imageUrl = `${ITEM_IMAGE_BASE_URL}${hero.img}`;
    const guideData = await loadHeroGuide(hero.localized_name);

    if (!guideData) {
        content.innerHTML = `
            <div class="guide-header">
                <img src="${imageUrl}" alt="${escapeHTML(hero.localized_name)}">
                <h2>${escapeHTML(hero.localized_name)}</h2>
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
            <img src="${imageUrl}" alt="${escapeHTML(hero.localized_name)}">
            <div class="guide-title-area">
                <div class="guide-title-row">
                    <h2>${escapeHTML(hero.localized_name)}</h2>
                    ${commonItems}
                </div>
            </div>
        </div>

        ${createHeroProfileSection(heroProfile)}

        ${createGameplaySection(
            `How to Play Alongside ${hero.localized_name}`,
            playingAlongside
        )}

        ${createGameplaySection(
            `How to Play Against ${hero.localized_name}`,
            playingAgainst
        )}

        ${createDraftSectionGroup(guideData)}
    `;

    guide.style.display = "block";
    guide.scrollIntoView({ behavior: "smooth" });
}

/* =========================
   START
   ========================= */

async function start() {
    await Promise.all([
        loadItemData(),
        loadHeroes()
    ]);
}

start();
'''
path = Path("/mnt/data/script.js")
path.write_text(script, encoding="utf-8")
print(f"Created {path} ({len(script.splitlines())} lines).")
