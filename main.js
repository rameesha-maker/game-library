let allGames = [];

async function loadContent() {
    try {
        const response = await fetch("/api/content");
        if (!response.ok) throw new Error("Could not load website content.");

        const content = await response.json();

        document.getElementById("hero-title").textContent =
            content.hero_title || "Welcome to the Game Library";

        document.getElementById("hero-subtitle").textContent =
            content.hero_subtitle || "Play. Explore. Discover.";

        document.getElementById("announcement").textContent =
            content.announcement || "";

        const aboutText =
            content["about-text"] ??
            content.about_text ??
            "";

        document.getElementById("about-text").textContent = aboutText;
    } catch (error) {
        console.error(error);
        document.getElementById("announcement").textContent =
            "Welcome to the Game Library";
    }
}

async function loadGames(category = "") {
    try {
        let url = "/api/games";

        if (category) {
            url += "?category=" + encodeURIComponent(category);
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error("Could not load games.");

        allGames = await response.json();
        displayGames(allGames);
        createCategories(allGames, category);
    } catch (error) {
        console.error(error);
        document.getElementById("game-grid").innerHTML =
            '<p class="empty">Unable to load games right now.</p>';
    }
}

function displayGames(games) {
    const grid = document.getElementById("game-grid");
    grid.innerHTML = "";

    if (!games.length) {
        grid.innerHTML = '<p class="empty">No games found.</p>';
        return;
    }

    games.forEach(game => {
        const card = document.createElement("article");
        card.className = "game-card";

        const image =
            game.thumbnail_url ||
            "https://placehold.co/600x400?text=Game";

        card.innerHTML = `
            <img src="${escapeHtml(image)}" alt="${escapeHtml(game.name || "Game")}">
            <div class="game-card-content">
                <h3>${escapeHtml(game.name || "Untitled Game")}</h3>
                <p class="category">${escapeHtml(game.category || "Uncategorized")}</p>
                <p class="description">${escapeHtml(game.description || "")}</p>
                <p class="plays">${Number(game.play_count || 0)} plays</p>
                <a class="play-button" href="/game?id=${encodeURIComponent(game.id)}">
                    PLAY
                </a>
            </div>
        `;

        grid.appendChild(card);
    });
}

function createCategories(games, activeCategory = "") {
    const container = document.getElementById("categories");

    const categories = [
        ...new Set(
            games
                .map(game => game.category)
                .filter(Boolean)
        )
    ];

    container.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.type = "button";
    allButton.textContent = "All";
    allButton.className = activeCategory === "" ? "active" : "";
    allButton.onclick = () => loadGames();
    container.appendChild(allButton);

    categories.forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = category;
        button.className = category === activeCategory ? "active" : "";
        button.onclick = () => loadGames(category);
        container.appendChild(button);
    });
}

document.getElementById("search").addEventListener("input", function () {
    const search = this.value.trim().toLowerCase();

    const filtered = allGames.filter(game => {
        const name = (game.name || "").toLowerCase();
        const description = (game.description || "").toLowerCase();
        const category = (game.category || "").toLowerCase();

        return (
            name.includes(search) ||
            description.includes(search) ||
            category.includes(search)
        );
    });

    displayGames(filtered);
});

document.getElementById("search-focus-button").addEventListener("click", () => {
    document.getElementById("search").focus();
    document.getElementById("games").scrollIntoView({
        behavior: "smooth"
    });
});

/* Optional teammate treasure-box interaction. It does not change API/game logic. */
const treasureOverlay = document.getElementById("treasureOverlay");
const treasureClose = document.getElementById("treasureClose");
const treasureChest = document.getElementById("treasureChest");
const treasurePlay = document.getElementById("treasurePlay");
const treasureMessage = document.getElementById("treasureMessage");

function openTreasure(playableUrl) {
    if (!treasureOverlay) return;

    treasureOverlay.classList.add("show");
    treasureOverlay.setAttribute("aria-hidden", "false");
    treasureChest.classList.remove("open");
    treasurePlay.classList.remove("show");
    treasurePlay.href = playableUrl || "#";
    treasureMessage.textContent = "Touch the lock to open it.";
}

function closeTreasure() {
    treasureOverlay.classList.remove("show");
    treasureOverlay.setAttribute("aria-hidden", "true");
}

if (treasureClose) {
    treasureClose.addEventListener("click", closeTreasure);
}

if (treasureOverlay) {
    treasureOverlay.addEventListener("click", event => {
        if (event.target === treasureOverlay) closeTreasure();
    });
}

if (treasureChest) {
    function openChest() {
        treasureChest.classList.add("open");
        treasureMessage.textContent = "Treasure unlocked!";
        treasurePlay.classList.add("show");
    }

    treasureChest.addEventListener("click", openChest);
    treasureChest.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openChest();
        }
    });
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}

loadContent();
loadGames();
