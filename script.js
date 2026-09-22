async function loadHeroes() {
    const heroGrid = document.getElementById("hero-grid");

    try {
        const response = await fetch("https://api.opendota.com/api/heroStats");
        const heroes = await response.json();

        heroes.forEach(hero => {
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
