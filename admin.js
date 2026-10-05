async function checkLogin() {
    try {
        const response = await fetch("/api/admin/status");

        if (!response.ok) return;

        const data = await response.json();

        if (data.logged_in) {
            showDashboard();
        }
    } catch (error) {
        console.error(error);
    }
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const message = document.getElementById("login-message");

    const form = new FormData();
    form.append("username", username);
    form.append("password", password);

    try {
        const response = await fetch("/api/admin/login", {
            method: "POST",
            body: form
        });

        const data = await response.json();

        if (!response.ok) {
            message.textContent = data.detail || "Login failed.";
            return;
        }

        message.textContent = "";
        showDashboard();
    } catch (error) {
        console.error(error);
        message.textContent = "Could not connect to the backend.";
    }
}

function showDashboard() {
    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    loadAdminGames();
    loadWebsiteContent();
}

async function logout() {
    try {
        await fetch("/api/admin/logout", {
            method: "POST"
        });
    } finally {
        window.location.reload();
    }
}

async function loadAdminGames() {
    const response = await fetch("/api/admin/games");

    if (!response.ok) {
        alert("You are not authorized.");
        return;
    }

    const games = await response.json();
    const container = document.getElementById("admin-games");

    container.innerHTML = "";

    if (!games.length) {
        container.innerHTML = '<p class="empty">No games yet.</p>';
        return;
    }

    games.forEach(game => {
        const item = document.createElement("div");
        item.className = "admin-game";

        item.innerHTML = `
            <h3>${escapeHtml(game.name || "Untitled Game")}</h3>
            <p>Category: ${escapeHtml(game.category || "Uncategorized")}</p>
            <p>Plays: ${Number(game.play_count || 0)}</p>
            <p>Status: ${game.published ? "Published" : "Unpublished"}</p>

            <div class="admin-actions" style="margin-top:12px">
                <button
                    class="admin-button"
                    type="button"
                    onclick="togglePublish(${game.id}, ${!game.published})"
                >
                    ${game.published ? "Unpublish" : "Publish"}
                </button>

                <button
                    class="admin-button secondary"
                    type="button"
                    onclick="deleteGame(${game.id})"
                >
                    Delete
                </button>
            </div>
        `;

        container.appendChild(item);
    });
}

async function togglePublish(id, published) {
    const response = await fetch(
        `/api/admin/games/${encodeURIComponent(id)}/publish?published=${published}`,
        { method: "PATCH" }
    );

    if (response.ok) {
        loadAdminGames();
    } else {
        alert("Unable to change status.");
    }
}

async function deleteGame(id) {
    const confirmed = confirm("Delete this game permanently?");

    if (!confirmed) return;

    const response = await fetch(
        `/api/admin/games/${encodeURIComponent(id)}`,
        { method: "DELETE" }
    );

    if (response.ok) {
        loadAdminGames();
    } else {
        alert("Could not delete game.");
    }
}

function showAddGame() {
    document.getElementById("game-form").style.display = "block";
    document.getElementById("game-form").scrollIntoView({
        behavior: "smooth"
    });
}

function hideAddGame() {
    document.getElementById("game-form").style.display = "none";
}

document.getElementById("login-form").addEventListener("submit", login);

document.getElementById("add-game-form").addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();

        const form = new FormData(this);

        try {
            const response = await fetch("/api/admin/games", {
                method: "POST",
                body: form
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || "Could not add game.");
                return;
            }

            alert("Game added successfully!");
            this.reset();
            hideAddGame();
            loadAdminGames();
        } catch (error) {
            console.error(error);
            alert("Could not connect to the backend.");
        }
    }
);

async function loadWebsiteContent() {
    const response = await fetch("/api/content");

    if (!response.ok) return;

    const data = await response.json();

    document.getElementById("hero-title").value =
        data.hero_title || "";

    document.getElementById("hero-subtitle").value =
        data.hero_subtitle || "";

    document.getElementById("announcement").value =
        data.announcement || "";

    document.getElementById("about-text").value =
        data["about-text"] ?? data.about_text ?? "";
}

document.getElementById("content-form").addEventListener(
    "submit",
    async function (event) {
        event.preventDefault();
        await saveContent();
    }
);

async function saveSingleContent(key, value) {
    const form = new FormData();
    form.append("content_value", value);

    return fetch(
        `/api/admin/content/${encodeURIComponent(key)}`,
        {
            method: "PUT",
            body: form
        }
    );
}

async function saveContent() {
    const updates = [
        ["hero_title", document.getElementById("hero-title").value],
        ["hero_subtitle", document.getElementById("hero-subtitle").value],
        ["announcement", document.getElementById("announcement").value],
        ["about-text", document.getElementById("about-text").value]
    ];

    for (const [key, value] of updates) {
        const response = await saveSingleContent(key, value);

        if (!response.ok) {
            alert(`Could not update ${key}.`);
            return;
        }
    }

    alert("Website text updated!");
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
}

checkLogin();
