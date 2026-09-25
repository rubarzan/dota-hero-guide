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
        const response = await fetch(
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
        const response = await fetch(
            "https://api.opendota.com/api/heroStats"
        );

        const heroes = await response.json();

        attributeOrder.forEach(attribute => {

            const attributeHeroes = heroes
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
   SHOW HERO GUIDE
   ========================= */

async function showHeroGuide(hero) {

    const guide =
        document.getElementById("hero-guide");

    const content =
        document.getElementById("guide-content");

    const imageUrl =
        `https://cdn.cloudflare.steamstatic.com${hero.img}`;


    /* =========================
       LOAD GUIDE
       ========================= */

    const guideData =
        await loadHeroGuide(
            hero.localized_name
        );


    /* =========================
       GUIDE NOT AVAILABLE
       ========================= */

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


    /* =========================
       HERO PROFILE
       ========================= */

    const heroProfile =
        guideData.heroProfile || {};

    const laningPhase =
        heroProfile.laningPhase;

    const preBKB =
        heroProfile.preBKB;

    const postBKB =
        heroProfile.postBKB;


    /* =========================
       GUIDE HTML
       ========================= */

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


        <!-- HERO PROFILE -->

        <div class="guide-section">

            <h3>
                Hero Profile
            </h3>

        </div>


        <!-- LANING PHASE -->

        ${createPhaseSection(
            "Laning Phase",
            laningPhase
        )}


        <!-- EARLY-MID GAME -->

        ${createPhaseSection(
            "Early-Mid Game",
            preBKB
        )}


        <!-- LATE GAME -->

        ${createPhaseSection(
            "Late Game: Post-BKB",
            postBKB
        )}

    `;


    /* =========================
       SHOW GUIDE
       ========================= */

    guide.style.display = "block";

    guide.scrollIntoView({
        behavior: "smooth"
    });
}


/* =========================
   START
   ========================= */

loadHeroes();
