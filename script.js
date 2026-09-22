const heroes = [
    "Necrophos",
    "Axe",
    "Faceless Void"
];

async function loadHeroes() {
    try {
        const response = await fetch("https://api.opendota.com/api/heroStats");
        const data = await response.json();

        heroes.forEach(heroName => {
            const hero = data.find(
                h => h.localized_name === heroName
            );

            if (!hero) {
                console.log("Hero not found:", heroName);
                return;
            }

            console.log(heroName, hero);
        });

    } catch (error) {
        console.error("Error loading heroes:", error);
    }
}

loadHeroes();
