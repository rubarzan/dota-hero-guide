const attributeOrder = [
    "str",
    "agi",
    "int",
    "all"
];

const attributeNames = {
    str: "Strength",
    agi: "Agility",
    int: "Intelligence",
    all: "Universal"
};


/* =========================
   ITEM DATA
   ========================= */

const ITEM_LIST_URL =
    "https://api.opendota.com/api/constants/items";

const ITEM_IMAGE_BASE_URL =
    "https://cdn.cloudflare.steamstatic.com";

let itemData = new Map();


/* =========================
   NORMALIZE ITEM NAME
   ========================= */

function normalizeItemName(name) {

    if (!name) {
        return "";
    }

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

        const response =
            await fetch(ITEM_LIST_URL);

        if (!response.ok) {
            throw new Error(
                `Item list request failed: ${response.status}`
            );
        }

        const data =
            await response.json();


        Object.entries(data).forEach(
            ([itemKey, item]) => {

                if (!item) {
                    return;
                }


                if (item.dname) {

                    itemData.set(
                        normalizeItemName(item.dname),
                        item
                    );
                }


                if (itemKey) {

                    itemData.set(
                        normalizeItemName(itemKey),
                        item
                    );
                }

            }
        );


        console.log(
            `Loaded ${itemData.size} Dota item references.`
        );

    } catch (error) {

        console.error(
            "Could not load item data:",
            error
        );
    }
}


/* =========================
   FIND ITEM
   ========================= */

function findItem(itemName) {

    if (!itemName) {
        return null;
    }

    const normalizedName =
        normalizeItemName(itemName);

    return (
        itemData.get(normalizedName) ||
        null
    );
}


/* =========================
   CREATE COMMON ITEMS
   ========================= */

function createCommonItems(items) {

    if (!Array.isArray(items) || items.length === 0) {
        return "";
    }

    const itemElements =
        items
            .map(itemName => {

                const item =
                    findItem(itemName);

                if (!item) {
                    console.warn(
                        `Could not find Dota item: ${itemName}`
                    );
                    return "";
                }

                if (!item.img) {
                    console.warn(
                        `No image path found for item: ${itemName}`
                    );
                    return "";
                }

                const imageUrl =
                    `${ITEM_IMAGE_BASE_URL}${item.img}`;

                return `
                    <img
                        class="common-item-image"
                        src="${imageUrl}"
                        alt="${item.dname || itemName}"
                        title="${item.dname || itemName}"
                    >
                `;

            })
            .filter(Boolean)
            .join("");

    if (!itemElements) {
        return "";
    }

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

    const fileName =
        getHeroFileName(heroName);

    try {

        const response =
            await fetch(
                `guides/${fileName}.json`
            );

        if (!response.ok) {
            return null;
        }

        return await response.json();

    } catch (error) {

        console.error(
            `Could not load guide for ${heroName}:`,
            error
        );

        return null;
    }
}


/* =========================
   LOAD HEROES
   ========================= */

async function loadHeroes() {

    const heroSelection =
        document.getElementById("hero-selection");

    try {

        const response =
            await fetch(
                "https://api.opendota.com/api/heroStats"
            );

        if (!response.ok) {
            throw new Error(
                `Hero list request failed: ${response.status}`
            );
        }

        const heroes =
            await response.json();

        attributeOrder.forEach(attribute => {

            const attributeHeroes =
                heroes
                    .filter(
                        hero =>
                            hero.primary_attr === attribute
                    )
                    .sort(
                        (a, b) =>
                            a.localized_name.localeCompare(
                                b.localized_name
                            )
                    );

            if (attributeHeroes.length === 0) {
                return;
            }

            const section =
                document.createElement("section");

            section.className =
                "attribute-section";

            const title =
                document.createElement("h2");

            title.className =
                "attribute-title";

            title.textContent =
                attributeNames[attribute];

            const grid =
                document.createElement("div");

            grid.className =
                "hero-grid";

            attributeHeroes.forEach(hero => {

                const card =
                    document.createElement("div");

                card.className =
                    "hero-card";

                card.innerHTML = `
                    <img
                        class="hero-image"
                        src="https://cdn.cloudflare.steamstatic.com${hero.img}"
                        alt="${hero.localized_name}"
                    >

                    <div class="hero-name">
                        ${hero.localized_name}
                    </div>
                `;

                card.addEventListener(
                    "click",
                    () => {
                        showHeroGuide(hero);
                    }
                );

                grid.appendChild(card);
            });

            section.appendChild(title);
            section.appendChild(grid);

            heroSelection.appendChild(section);
        });

    } catch (error) {

        console.error(
            "Could not load heroes:",
            error
        );
    }
}


/* =========================
   CREATE BULLET LIST
   ========================= */

function createBulletList(items) {

    if (!Array.isArray(items) || items.length === 0) {

        return `
            <li>
                Guide content will be added here.
            </li>
        `;
    }

    return items
        .map(
            item =>
                `<li>${item}</li>`
        )
        .join("");
}


/* =========================
   CREATE HERO PROFILE PHASE
   ========================= */

function createPhaseSection(
    title,
    phaseData
) {

    if (!phaseData) {
        return "";
    }

    const strengths =
        phaseData.strengths || [];

    const weaknesses =
        phaseData.weaknesses || [];

    return `

        <div class="guide-section">

            <h3>
                ${title}
            </h3>

            ${
                phaseData.description
                    ? `
                        <p>
                            ${phaseData.description}
                        </p>
                    `
                    : ""
            }

            <div class="pros-cons">

                <div class="pros-cons-column">

                    <h4>
                        Strengths & Mechanics
                    </h4>

                    <ul>
                        ${createBulletList(strengths)}
                    </ul>

                </div>

                <div class="pros-cons-column">

                    <h4>
                        Weaknesses & Limitations
                    </h4>

                    <ul>
                        ${createBulletList(weaknesses)}
                    </ul>

                </div>

            </div>

        </div>
    `;
}


/* =========================
   CREATE GAMEPLAY SECTION
   ========================= */

function createGameplaySection(
    title,
    gameplayData
) {

    if (!gameplayData) {
        return "";
    }

    let sections = "";


    /* =========================
       GENERAL
       ========================= */

    if (
        Array.isArray(gameplayData.general) &&
        gameplayData.general.length > 0
    ) {

        sections += `

            <div class="gameplay-subsection">

                <h4>
                    General Tips
                </h4>

                <ul>
                    ${createBulletList(
                        gameplayData.general
                    )}
                </ul>

            </div>
        `;
    }


    /* =========================
       LANING PHASE
       ========================= */

    if (
        Array.isArray(gameplayData.laningPhase) &&
        gameplayData.laningPhase.length > 0
    ) {

        sections += `

            <div class="gameplay-subsection">

                <h4>
                    Laning Phase
                </h4>

                <ul>
                    ${createBulletList(
                        gameplayData.laningPhase
                    )}
                </ul>

            </div>
        `;
    }


    /* =========================
       PRE-BKB
       ========================= */

    if (
        Array.isArray(gameplayData.preBKB) &&
        gameplayData.preBKB.length > 0
    ) {

        sections += `

            <div class="gameplay-subsection">

                <h4>
                    Early-Mid Game (Before BKB)
                </h4>

                <ul>
                    ${createBulletList(
                        gameplayData.preBKB
                    )}
                </ul>

            </div>
        `;
    }


    /* =========================
       POST-BKB
       ========================= */

    if (
        Array.isArray(gameplayData.postBKB) &&
        gameplayData.postBKB.length > 0
    ) {

        sections += `

            <div class="gameplay-subsection">

                <h4>
                    Late Game (Post-BKB)
                </h4>

                <ul>
                    ${createBulletList(
                        gameplayData.postBKB
                    )}
                </ul>

            </div>
        `;
    }


    if (!sections) {
        return "";
    }


    return `

        <div class="guide-section">

            <h3>
                ${title}
            </h3>

            ${sections}

        </div>
    `;
}


/* =========================
   SHOW HERO GUIDE
   ========================= */

async function showHeroGuide(hero) {

    const guide =
        document.getElementById("hero-guide");

    const content =
        document.getElementById("guide-content");

    const imageUrl =
        `https://cdn.cloudflare.steamstatic.com${hero.img}`;

    const guideData =
        await loadHeroGuide(
            hero.localized_name
        );


    if (!guideData) {

        content.innerHTML = `

            <div class="guide-header">

                <img
                    src="${imageUrl}"
                    alt="${hero.localized_name}"
                >

                <h2>
                    ${hero.localized_name}
                </h2>

            </div>

            <p>
                Guide not available yet.
            </p>

        `;

        guide.style.display = "block";

        guide.scrollIntoView({
            behavior: "smooth"
        });

        return;
    }


    const heroProfile =
        guideData.heroProfile || {};

    const laningPhase =
        heroProfile.laningPhase;

    const preBKB =
        heroProfile.preBKB;

    const postBKB =
        heroProfile.postBKB;


    const commonItems =
        createCommonItems(
            guideData.commonItems
        );


    /* =========================
       GAMEPLAY DATA
       ========================= */

    const gameplay =
        guideData.gameplay || {};

    const playingAlongside =
        gameplay.playingAlongside || {};

    const playingAgainst =
        gameplay.playingAgainst || {};


    content.innerHTML = `

        <div class="guide-header">

            <img
                src="${imageUrl}"
                alt="${hero.localized_name}"
            >

            <div class="guide-title-area">

                <div class="guide-title-row">

                    <h2>
                        ${hero.localized_name}
                    </h2>

                    ${commonItems}

                </div>

            </div>

        </div>


        <!-- HERO PROFILE -->

        <div class="guide-section">

            <h3>
                Hero Profile
            </h3>

        </div>


        <!-- HERO PROFILE PHASES -->

        ${createPhaseSection(
            "Laning Phase",
            laningPhase
        )}

        ${createPhaseSection(
            "Early-Mid Game",
            preBKB
        )}

        ${createPhaseSection(
            "Late Game: Post-BKB",
            postBKB
        )}


        <!-- PLAYING ALONGSIDE -->

        ${createGameplaySection(
            "How to Play Alongside PA",
            playingAlongside
        )}


        <!-- PLAYING AGAINST -->

        ${createGameplaySection(
            "How to Play Against PA",
            playingAgainst
        )}

    `;


    guide.style.display = "block";

    guide.scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================
   START
   ========================= */

async function start() {

    await loadItemData();

    await loadHeroes();
}

start();
