
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
                loading="lazy"
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

    if (!heroSelection) {
        console.error('Element "hero-selection" was not found.');
        return;
    }

    try {
        const response = await fetch(
            "https://api.opendota.com/api/heroStats"
        );

        if (!response.ok) {
            throw new Error(`Hero list request failed: ${response.status}`);
        }

        const heroes = await response.json();

        allHeroes = heroes;
        heroSelection.innerHTML = "";

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
                        src="${ITEM_IMAGE_BASE_URL}${hero.img}"
                        alt="${hero.localized_name}"
                        loading="lazy"
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
        return "";
    }

    return items
        .map(item => `<li>${item}</li>`)
        .join("");
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

            ${phaseData.description
                ? `<p>${phaseData.description}</p>`
                : ""}

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
   GET HERO PROFILE PHASES

   Supports:
   - laningPhase / preBKB / postBKB
   - laningPhase / preScepter / postScepter
   ========================= */

function getHeroProfilePhases(heroProfile) {
    const phases = [
        {
            key: "laningPhase",
            title: "Laning Phase"
        }
    ];

    if (heroProfile.preScepter || heroProfile.postScepter) {
        phases.push(
            {
                key: "preScepter",
                title: "Early-Mid Game: Before Aghanim's Scepter"
            },
            {
                key: "postScepter",
                title: "Late Game: Post-Aghanim's Scepter"
            }
        );
    } else {
        phases.push(
            {
                key: "preBKB",
                title: "Early-Mid Game: Before BKB"
            },
            {
                key: "postBKB",
                title: "Late Game: Post-BKB"
            }
        );
    }

    return phases;
}

/* =========================
   CREATE HERO PROFILE
   ========================= */

function createHeroProfileSection(heroProfile) {
    if (!heroProfile) return "";

    const phases = getHeroProfilePhases(heroProfile);

    return `
        <div class="guide-section">
            <h3>Hero Profile</h3>
        </div>

        ${phases.map(phase =>
            createPhaseSection(
                phase.title,
                heroProfile[phase.key]
            )
        ).join("")}
    `;
}

/* =========================
   GET GAMEPLAY PHASES

   Supports:
   - general / laningPhase / preBKB / postBKB
   - general / laningPhase / preScepter / postScepter
   ========================= */

function getGameplayPhases(gameplayData) {
    const phases = [
        {
            key: "general",
            title: "General Tips"
        },
        {
            key: "laningPhase",
            title: "Laning Phase"
        }
    ];

    if (gameplayData.preScepter || gameplayData.postScepter) {
        phases.push(
            {
                key: "preScepter",
                title: "Early-Mid Game: Before Aghanim's Scepter"
            },
            {
                key: "postScepter",
                title: "Late Game: Post-Aghanim's Scepter"
            }
        );
    } else {
        phases.push(
            {
                key: "preBKB",
                title: "Early-Mid Game: Before BKB"
            },
            {
                key: "postBKB",
                title: "Late Game: Post-BKB"
            }
        );
    }

    return phases;
}

/* =========================
   CREATE GAMEPLAY SECTION
   ========================= */

function createGameplaySection(title, gameplayData) {
    if (!gameplayData) return "";

    const phases = getGameplayPhases(gameplayData);

    let sections = "";

    phases.forEach(phase => {
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
                src="${ITEM_IMAGE_BASE_URL}${hero.img}"
                alt="${hero.localized_name}"
                title="${hero.localized_name}"
                loading="lazy"
            >
        `;
    }).filter(Boolean).join("");

    return images ||
        '<p class="draft-empty">No matching hero images found.</p>';
}

/* =========================
   CREATE DRAFT CARD
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
            <h4>${title}</h4>

            <ul class="draft-guidelines">
                ${createBulletList(guidelines)}
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

                ${createDraftCard(
                    "Avoid Picking Against",
                    "avoidPickingAgainst",
                    draft
                )}
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
