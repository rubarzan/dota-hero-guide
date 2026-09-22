const selectedHeroes = [
    "Necrophos",
    "Axe",
    "Faceless Void"
];

async function loadHeroes() {
    const heroGrid = document.getElementById("hero-grid");

    try {
        const response = await fetch("https://api.opendota.com/api/heroStats");
        const heroes = await response.json();

        selectedHeroes.forEach(heroName => {
            const hero = heroes.find(
                h => h.localized_name === heroName
            );

            if (!hero) {
                console.error("Hero not found:", heroName);
                return;
            }

            const card = document.createElement("div");
            card.className = "hero-card";

            card.innerHTML = `
                <img
                    class="hero-image"
                    src="https://cdn.cloudflare.steamstatic.com${hero.img}"
                    alt="${hero.localized_name}"
                >

                <h2>${hero.localized_name}</h2>

                <button>View Guide</button>
            `;

            heroGrid.appendChild(card);
        });

    } catch (error) {
        console.error("Could not load heroes:", error);
    }
}

loadHeroes();
