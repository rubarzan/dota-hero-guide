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
    const heroSelection = document.getElementById("hero-selection");

    try {
        const response = await fetch(
            "https://api.opendota.com/api/heroStats"
        );

        const heroes = await response.json();

        attributeOrder.forEach(attribute => {

            const attributeHeroes = heroes
                .filter(hero => hero.primary_attr === attribute)
                .sort((a, b) =>
                    a.localized_name.localeCompare(
                        b.localized_name
                    )
                );

            if (attributeHeroes.length === 0) {
                return;
            }

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

                    <div class="hero-name">
                        ${hero.localized_name}
                    </div>
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
        console.error(
            "Could not load heroes:",
            error
        );
    }
}


/* =========================
   SHOW HERO GUIDE
   ========================= */

async function showHeroGuide(hero) {

    const guide = document.getElementById("hero-guide");
    const content = document.getElementById("guide-content");

    const imageUrl =
        `https://cdn.cloudflare.steamstatic.com${hero.img}`;

    /*
       Load the guide from:
       guides/hero-name.json
    */

    const guideData =
        await loadHeroGuide(hero.localized_name);


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

                <h2>${hero.localized_name}</h2>
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
       GUIDE DATA
       ========================= */

    const strengths =
        guideData.about?.strengths || [];

    const weaknesses =
        guideData.about?.weaknesses || [];


    /* =========================
       GUIDE HTML
       ========================= */

    content.innerHTML = `

        <div class="guide-header">

            <img
                src="${imageUrl}"
                alt="${hero.localized_name}"
            >

            <h2>${hero.localized_name}</h2>

        </div>


        <!-- ABOUT -->

        <div class="guide-section">

            <h3>About This Hero</h3>

            <div class="pros-cons">


                <!-- STRENGTHS -->

                <div class="pros-cons-column">

                    <h4>
                        Strengths & Mechanics
                    </h4>

                    <ul>

                        ${
                            strengths.length > 0

                                ? strengths
                                    .map(
                                        item =>
                                            `<li>${item}</li>`
                                    )
                                    .join("")

                                : `
                                    <li>
                                        Guide content
                                        will be added here.
                                    </li>
                                `
                        }

                    </ul>

                </div>


                <!-- WEAKNESSES -->

                <div class="pros-cons-column">

                    <h4>
                        Weaknesses & Limitations
                    </h4>

                    <ul>

                        ${
                            weaknesses.length > 0

                                ? weaknesses
                                    .map(
                                        item =>
                                            `<li>${item}</li>`
                                    )
                                    .join("")

                                : `
                                    <li>
                                        Guide content
                                        will be added here.
                                    </li>
                                `
                        }

                    </ul>

                </div>

            </div>

        </div>


        <!-- AGAINST -->

        <div class="guide-section">

            <h3>
                How to Play Against This Hero
            </h3>

            <p>
                ${
                    guideData.against
                    || "Guide content will be added here."
                }
            </p>

        </div>


        <!-- ALONGSIDE -->

        <div class="guide-section">

            <h3>
                How to Play Alongside This Hero
            </h3>

            <p>
                ${
                    guideData.alongside
                    || "Guide content will be added here."
                }
            </p>

        </div>


        <!-- COUNTER PICKS -->

        <div class="guide-section">

            <h3>
                What to Pick Against This Hero
            </h3>

            <p>
                ${
                    guideData.counterPicks
                    || "Guide content will be added here."
                }
            </p>

        </div>


        <!-- SYNERGY PICKS -->

        <div class="guide-section">

            <h3>
                What to Pick Alongside This Hero
            </h3>

            <p>
                ${
                    guideData.synergyPicks
                    || "Guide content will be added here."
                }
            </p>

        </div>

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
