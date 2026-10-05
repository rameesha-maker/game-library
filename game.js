const params = new URLSearchParams(window.location.search);
const gameId = params.get("id");

async function loadGame() {
    const container = document.getElementById("game-details");

    if (!gameId) {
        container.innerHTML = '<p class="empty">Game ID missing.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/games/${encodeURIComponent(gameId)}`);

        if (!response.ok) {
            container.innerHTML = '<p class="empty">Game not found.</p>';
            return;
        }

        const game = await response.json();

        const image =
            game.thumbnail_url ||
            "https://placehold.co/800x500?text=Game";

        container.innerHTML = `
            <article class="game-details-wrap">
                <img src="${escapeHtml(image)}" alt="${escapeHtml(game.name || "Game")}">

                <h1>${escapeHtml(game.name || "Untitled Game")}</h1>

                <p class="category">
                    ${escapeHtml(game.category || "Uncategorized")}
                </p>

                <p class="description">
                    ${escapeHtml(game.description || "")}
                </p>

                <p class="plays">
                    Creator: ${escapeHtml(game.creator || "Unknown")}
                    · ${Number(game.play_count || 0)} plays
                </p>

                <button class="primary-button" type="button" onclick="playGame()">
                    PLAY NOW
                </button>

                ${
                    game.github_url
                        ? `
                            <p style="margin-top:20px">
                                <a class="back-link"
                                   href="${escapeHtml(game.github_url)}"
                                   target="_blank"
                                   rel="noopener">
                                    View GitHub
                                </a>
                            </p>
                          `
                        : ""
                }
            </article>
        `;
    } catch (error) {
        console.error(error);
        container.innerHTML =
            '<p class="empty">Unable to load this game.</p>';
    }
}

async function playGame() {
    if (!gameId) return;

    try {
        const playResponse = await fetch(
            `/api/games/${encodeURIComponent(gameId)}/play`,
            { method: "POST" }
        );

        if (!playResponse.ok) {
            throw new Error("Could not register play.");
        }

        const response = await fetch(
            `/api/games/${encodeURIComponent(gameId)}`
        );

        if (!response.ok) {
            throw new Error("Could not reload game.");
        }

        const game = await response.json();

        if (!game.playable_url) {
            alert("This game does not have a playable URL yet.");
            return;
        }

        window.location.href = game.playable_url;
    } catch (error) {
        console.error(error);
        alert("Unable to start the game.");
    }
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}

loadGame();
