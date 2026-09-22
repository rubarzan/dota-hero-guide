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
    const main = document.querySelector("main");

    try {
        const response = await fetch("https://api.opendota.com/api/heroStats");
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

                grid.appendChild(card);
            });

            section.appendChild(title);
            section.appendChild(grid);
            main.appendChild(section);
        });

    } catch (error) {
        console.error("Could not load heroes:", error);
    }
}

loadHeroes();
