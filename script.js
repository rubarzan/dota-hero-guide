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

async function loadHeroes() {
    const heroSelection = document.getElementById("hero-selection");

    try {
        const response = await fetch("https://api.opendota.com/api/heroStats");
        const heroes = await response.json();

        attributeOrder.forEach(attribute => {
            const attributeHeroes = heroes
                .filter(hero => hero.primary_attr === attribute)
                .sort((a, b) =>
                    a.localized_name.localeCompare(b.localized_name)
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
        console.error("Could not load heroes:", error);
    }
}


function showHeroGuide(hero) {
    const guide = document.getElementById("hero-guide");
    const content = document.getElementById("guide-content");

    const imageUrl =
        `https://cdn.cloudflare.steamstatic.com${hero.img}`;

    content.innerHTML = `
        <div class="guide-header">
            <img
                src="${imageUrl}"
                alt="${hero.localized_name}"
            >

            <h2>${hero.localized_name}</h2>
        </div>

        <div class="guide-section">
            <h3>About This Hero</h3>
            <p>
                Guide content for ${hero.localized_name} will be added here.
            </p>
        </div>

        <div class="guide-section">
            <h3>How to Play Against This Hero</h3>
            <p>
                Guide content will be added here.
            </p>
        </div>

        <div class="guide-section">
            <h3>How to Play Alongside This Hero</h3>
            <p>
                Guide content will be added here.
            </p>
        </div>

        <div class="guide-section">
            <h3>What to Pick Against This Hero</h3>
            <p>
                Guide content will be added here.
            </p>
        </div>

        <div class="guide-section">
            <h3>What to Pick Alongside This Hero</h3>
            <p>
                Guide content will be added here.
            </p>
        </div>
    `;

    guide.style.display = "block";

    guide.scrollIntoView({
        behavior: "smooth"
    });
}


loadHeroes();
