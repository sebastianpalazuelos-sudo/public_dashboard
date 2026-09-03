const views = {
    home: document.getElementById("view-home"),
    players: document.getElementById("view-players"),
    champions: document.getElementById("view-champions"),
    synergies: document.getElementById("view-synergies"),
    matches: document.getElementById("view-matches"),
    methodology: document.getElementById("view-methodology"),
    splits: document.getElementById("view-splits"),
};

let dashboardData = null;
let matchExplorerSort = { key: "ratio", direction: "desc" };

let activeViewName = "home";

// P95R (Meta Ratio normalizado): MR = score / META(p50), escalado por el máximo
// estadístico del campeón (p95 / p50). Debe reflejar el mismo cálculo del motor.
function getChampionMetaP95(championName){
    return Number(
        dashboardData?.champion_engine?.champion_meta?.[championName]?.score?.p95
    ) || 0;
}

function normalizeMetaRatio(score, meta, metaP95){
    const metaValue = Number(meta) || 0;

    if(metaValue <= 0){
        return 0;
    }

    const metaRatio = (Number(score) || 0) / metaValue;
    const metaRatioMaxStatistical = (Number(metaP95) || 0) / metaValue;

    return metaRatioMaxStatistical > 0
        ? metaRatio / metaRatioMaxStatistical
        : metaRatio;
}

function resetPlayersView(){
    const select = document.getElementById("players-player-select");
    const results = document.getElementById("players-player-results");

    if(select){ select.value = ""; }
    if(results){ results.innerHTML = ""; }
}

function resetChampionExplorer(){
    const select = document.getElementById("champions-champion-select");
    const search = document.getElementById("champion-search-input");
    const results = document.getElementById("champions-champion-results");

    if(select){ select.value = ""; }
    if(search){ search.value = ""; }
    if(results){ results.innerHTML = ""; }
}

function resetChampionRepresentative(){
    const select = document.getElementById("champion-representative-metric-select");
    const results = document.getElementById("champion-representative-results");

    if(select){ select.value = ""; }
    if(results){ results.innerHTML = ""; }
}

function resetChampionTendencies(){
    const select = document.getElementById("champion-tendencies-metric-select");
    const results = document.getElementById("champion-tendencies-results");

    if(select){ select.value = ""; }
    if(results){ results.innerHTML = ""; }
}

function showChampionSubview(subviewName){
    document.querySelectorAll(".champion-subview").forEach(subview => {
        subview.classList.remove("active-champion-subview");
    });

    document.querySelectorAll(".champion-subtab-button").forEach(button => {
        button.classList.remove("active");
    });

    document
        .getElementById(`champion-subview-${subviewName}`)
        ?.classList.add("active-champion-subview");

    document
        .querySelector(
            `.champion-subtab-button[data-champion-subview="${subviewName}"]`
        )
        ?.classList.add("active");
}

function resetChampionsView(){
    resetChampionExplorer();
    resetChampionRepresentative();
    resetChampionTendencies();
    showChampionSubview("explorer");
}

function resetMatchesView(){
    const select = document.getElementById("match-select");
    const search = document.getElementById("match-search-input");
    const results = document.getElementById("match-results");

    if(select){ select.value = ""; }
    if(search){ search.value = ""; }
    if(results){ results.innerHTML = ""; }
}

function resetSplitsView(){
    const select = document.getElementById("split-select");

    if(select && select.options.length > 0){
        select.selectedIndex = 0;
        renderSelectedSplit(select.value);
    }
}

function resetViewState(viewName){
    const resetters = {
        players: resetPlayersView,
        champions: resetChampionsView,
        matches: resetMatchesView,
        splits: resetSplitsView
    };

    resetters[viewName]?.();
}

function showView(viewName){
    console.log("Cambiando vista a:", viewName);

    if(activeViewName && activeViewName !== viewName){
        resetViewState(activeViewName);
    }

    Object.values(views).forEach(view => {
        view.classList.remove("active-view");
    });

    document.querySelectorAll(".tab-button").forEach(button => {
        button.classList.remove("active");
    });

    views[viewName].classList.add("active-view");

    document
        .querySelector(`.tab-button[data-view="${viewName}"]`)
        .classList.add("active");

    activeViewName = viewName;
}

async function loadDashboard(){
  try{
    const response=await fetch("dashboard_data.json");
    if(!response.ok) throw new Error("No se pudo cargar dashboard_data.json");
    const data=await response.json();
    dashboardData = data;
    renderPlayerChampionHighlights(
        "home-player-champion-highlights",
        data.player_champion_highlights
    );

    loadPlayersSelect();
    loadChampionsSelect();
    loadChampionRepresentativeSelect();
    loadChampionTendenciesSelect();
    loadMatchExplorerSelect();
    loadSplitsSelect();
    loadSynergiesSelect();
    showChampionSubview("explorer");
  }catch(error){
    document.body.innerHTML+=`<main><section><p class="error">${error.message}</p><p>Verificá que index.html y dashboard_data.json estén en la misma carpeta.</p></section></main>`;
  }
}

document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });
});

document.querySelectorAll(".champion-subtab-button").forEach(button => {
    button.addEventListener("click", () => {
        const nextSubview = button.dataset.championSubview;
        const currentSubview =
            document.querySelector(
                ".champion-subview.active-champion-subview"
            );

        const currentName = currentSubview
            ? currentSubview.id.replace("champion-subview-", "")
            : null;

        if(
            currentName === "explorer"
            && currentName !== nextSubview
        ){
            resetChampionExplorer();
        }

        showChampionSubview(nextSubview);
    });
});

function loadSynergiesSelect(){
    const playerASelect = document.getElementById("synergy-player-a");
    const playerBSelect = document.getElementById("synergy-player-b");
    const playerCSelect = document.getElementById("synergy-player-c");
    const playerDSelect = document.getElementById("synergy-player-d");
    const playerESelect = document.getElementById("synergy-player-e");

    if(!playerASelect || !playerBSelect || !playerCSelect || !playerDSelect || !playerESelect){
        return;
    }

    const playerNames = Object.keys(
        dashboardData.champion_engine.player_champion_profiles
    ).sort();

    playerASelect.innerHTML = '<option value="">Select Player A...</option>';
    playerBSelect.innerHTML = '<option value="">Select Player B...</option>';
    playerCSelect.innerHTML = '<option value="">Select Player C...</option>';
    playerDSelect.innerHTML = '<option value="">Select Player D...</option>';
    playerESelect.innerHTML = '<option value="">Select Player E...</option>';

    playerNames.forEach(playerName => {
        const optionA = document.createElement("option");
        optionA.value = playerName;
        optionA.textContent = formatPlayerName(playerName);
        playerASelect.appendChild(optionA);

        const optionB = document.createElement("option");
        optionB.value = playerName;
        optionB.textContent = formatPlayerName(playerName);
        playerBSelect.appendChild(optionB);

        const optionC = document.createElement("option");
        optionC.value = playerName;
        optionC.textContent = formatPlayerName(playerName);
        playerCSelect.appendChild(optionC);

        const optionD = document.createElement("option");
        optionD.value = playerName;
        optionD.textContent = formatPlayerName(playerName);
        playerDSelect.appendChild(optionD);

        const optionE = document.createElement("option");
        optionE.value = playerName;
        optionE.textContent = formatPlayerName(playerName);
        playerESelect.appendChild(optionE);
    });

    playerASelect.addEventListener("change", () => {
        updatePlayerStats(playerASelect.value, "a");
        calculateSynergy();
    });
    playerBSelect.addEventListener("change", () => {
        updatePlayerStats(playerBSelect.value, "b");
        calculateSynergy();
    });
    playerCSelect.addEventListener("change", () => {
        updatePlayerStats(playerCSelect.value, "c");
        calculateSynergy();
    });
    playerDSelect.addEventListener("change", () => {
        updatePlayerStats(playerDSelect.value, "d");
        calculateSynergy();
    });
    playerESelect.addEventListener("change", () => {
        updatePlayerStats(playerESelect.value, "e");
        calculateSynergy();
    });
}

function updatePlayerStats(playerName, playerType){
    const statsDiv = document.getElementById(`synergy-player-${playerType}-stats`);
    if(!statsDiv) return;

    if(!playerName){
        statsDiv.innerHTML = "";
        return;
    }

    // Get player's individual averages from ranking
    const ranking = dashboardData?.current_split?.global_ranking || [];
    const playerData = ranking.find(r => r.name === playerName);

    if(playerData){
        statsDiv.innerHTML = `
            <div class="synergy-player-stats">
                <div class="synergy-player-stat">
                    <span class="stat-label score-label">Score:</span>
                    <span class="stat-value score-value">${formatHomeMetric(playerData.global_avg)}</span>
                </div>
                <div class="synergy-player-stat">
                    <span class="stat-label meta-label">P95R:</span>
                    <span class="stat-value meta-value">${formatHomeMetric(playerData.avg_meta_ratio || 0, 3)}</span>
                </div>
            </div>
        `;
    } else {
        statsDiv.innerHTML = `<div class="synergy-player-stats">No data available</div>`;
    }
}

function calculateSynergy(){
    console.log("Calculando sinergia...");
    const playerA = document.getElementById("synergy-player-a").value;
    const playerB = document.getElementById("synergy-player-b").value;
    const playerC = document.getElementById("synergy-player-c").value;
    const playerD = document.getElementById("synergy-player-d").value;
    const playerE = document.getElementById("synergy-player-e").value;
    const resultsDiv = document.getElementById("synergy-results");

    console.log("Player A:", playerA, "Player B:", playerB, "Player C:", playerC, "Player D:", playerD, "Player E:", playerE);

    // Verificar que al menos 2 jugadores estén seleccionados
    const selectedPlayers = [playerA, playerB, playerC, playerD, playerE].filter(p => p);
    if(selectedPlayers.length < 2){
        resultsDiv.innerHTML = `<p class="synergy-empty">Select at least 2 players to analyze synergy</p>`;
        return;
    }

    // Verificar que no haya duplicados
    const uniquePlayers = [...new Set(selectedPlayers)];
    if(uniquePlayers.length !== selectedPlayers.length){
        resultsDiv.innerHTML = `<p class="synergy-empty">Select different players</p>`;
        return;
    }

    // Find matches where all selected players played together on the same team
    const matches = dashboardData.match_explorer || [];
    console.log("Total matches:", matches.length);
    const sharedMatches = [];

    matches.forEach(match => {
        const players = match.players || [];
        const playerData = {};

        selectedPlayers.forEach(playerName => {
            playerData[playerName] = players.find(p => p.name === playerName);
        });

        // Verificar que todos los jugadores seleccionados estén en la partida
        const allPresent = selectedPlayers.every(playerName => playerData[playerName]);
        if(!allPresent) return;

        // Verificar que todos estén en el mismo equipo
        const teamIds = selectedPlayers.map(playerName => playerData[playerName].teamId);
        const sameTeam = teamIds.every(teamId => teamId === teamIds[0]);

        if(sameTeam){
            sharedMatches.push({
                match_id: match.match_id,
                ...playerData
            });
        }
    });

    console.log("Shared matches:", sharedMatches.length);

    if(sharedMatches.length === 0){
        resultsDiv.innerHTML = `<p class="synergy-empty">No matches found where all selected players played together</p>`;
        return;
    }

    if(sharedMatches.length < 3){
        resultsDiv.innerHTML = `<p class="synergy-empty">Only ${sharedMatches.length} match(es) together (minimum 3 for reliable data)</p>`;
        return;
    }

    console.log("Calculating averages for selected players...");

    // Calculate averages for each selected player
    const playerStats = {};
    selectedPlayers.forEach(playerName => {
        try {
            // Apply bottom 15% trim like the backend does
            const playerScores = sharedMatches.map(m => m[playerName].score);
            playerScores.sort((a, b) => b - a); // Sort descending
            const trimCount = Math.floor(playerScores.length * 0.15);
            const trimmedScores = playerScores.slice(0, -trimCount || playerScores.length);
            
            const avgScore = trimmedScores.reduce((sum, score) => sum + score, 0) / trimmedScores.length;
            
            // For meta ratio normalized, we need to calculate it the same way
            const playerMetaRatios = sharedMatches.map(m => normalizeMetaRatio(
                m[playerName].score,
                m[playerName].champion_meta,
                m[playerName].champion_meta_p95 || getChampionMetaP95(m[playerName].champion)
            ));
            playerMetaRatios.sort((a, b) => b - a); // Sort descending
            const trimCountMeta = Math.floor(playerMetaRatios.length * 0.15);
            const trimmedMetaRatios = playerMetaRatios.slice(0, -trimCountMeta || playerMetaRatios.length);
            const avgMetaRatio = trimmedMetaRatios.reduce((sum, ratio) => sum + ratio, 0) / trimmedMetaRatios.length;
            
            playerStats[playerName] = { avgScore, avgMetaRatio };

            // Debug logs
            const ranking = dashboardData?.current_split?.global_ranking || [];
            const playerData = ranking.find(r => r.name === playerName);
            console.log(`${playerName}: Avg with team (trimmed)=${avgScore.toFixed(2)}, Global avg=${playerData?.global_avg?.toFixed(2)}, Diff=${(avgScore - playerData?.global_avg).toFixed(2)}`);
        } catch (error) {
            console.error(`Error calculating stats for ${playerName}:`, error);
        }
    });

    // Build results HTML
    let columnsHtml = '';
    selectedPlayers.forEach((playerName, index) => {
        const playerClasses = ['player-a', 'player-b', 'player-c', 'player-d', 'player-e'];
        const playerClass = playerClasses[index] || 'player-a';
        const stats = playerStats[playerName];

        // Get player's individual averages from ranking
        const ranking = dashboardData?.current_split?.global_ranking || [];
        const playerData = ranking.find(r => r.name === playerName);
        const baseAvg = playerData?.global_avg || 0;
        const baseMeta = playerData?.avg_meta_ratio || 0;

        const scoreDiff = stats.avgScore - baseAvg;
        const metaDiff = stats.avgMetaRatio - baseMeta;

        columnsHtml += `
            <div class="synergy-stats-col ${playerClass}">
                <h4>${escapeHtml(formatPlayerName(playerName))}</h4>
                <div class="synergy-stat">
                    <div class="synergy-stat-label score-label">Score</div>
                    <div class="synergy-stat-value score-value">
                        ${formatHomeMetric(stats.avgScore)}
                        <span class="synergy-diff ${scoreDiff > 0 ? "diff-positive" : "diff-negative"}">
                            ${scoreDiff > 0 ? `+${formatHomeMetric(scoreDiff)}` : formatHomeMetric(scoreDiff)}
                        </span>
                    </div>
                </div>
                <div class="synergy-stat">
                    <div class="synergy-stat-label meta-label">P95R</div>
                    <div class="synergy-stat-value meta-value">
                        ${formatHomeMetric(stats.avgMetaRatio, 3)}
                        <span class="synergy-diff ${metaDiff > 0 ? "diff-positive" : "diff-negative"}">
                            ${metaDiff > 0 ? `+${formatHomeMetric(metaDiff, 3)}` : formatHomeMetric(metaDiff, 3)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = `
        <div class="synergy-results-card">
            <div class="synergy-players">
                ${selectedPlayers.map((p, i) => {
                    const playerClasses = ['synergy-player-a', 'synergy-player-b', 'synergy-player-c', 'synergy-player-d', 'synergy-player-e'];
                    const playerClass = playerClasses[i] || 'synergy-player-a';
                    return `<span class="${playerClass}">${escapeHtml(formatPlayerName(p))}</span>`;
                }).join(' <span>+</span> ')}
            </div>
            <h3>${sharedMatches.length} matches together</h3>
            <div class="synergy-stats">
                ${columnsHtml}
            </div>
        </div>
    `;
}

function loadPlayersSelect(){

    const playerSelect =
        document.getElementById("players-player-select");

    if(!playerSelect){
        return;
    }

playerSelect.innerHTML += `
    <option value="Champion Reference">
        ‹ Champion Reference ›
    </option>
`;

Object.keys(
    dashboardData.champion_engine.player_champion_profiles
).sort().forEach(playerName => {

    playerSelect.innerHTML += `
        <option value="${playerName}">
            ${escapeHtml(formatPlayerName(playerName))}
        </option>
    `;
});

    playerSelect.addEventListener("change", () => {
        const playerName = playerSelect.value;

        renderPlayerProfile(playerName);
    });

}

function loadChampionsSelect(){

    const championSelect =
        document.getElementById("champions-champion-select");

    if(!championSelect){
        return;
    }

    const championNames =
        Object.keys(
            dashboardData
                .champion_engine
                .champion_performance
        ).sort();

    const championSearchOptions =
        document.getElementById("champion-search-options");

    championNames.forEach(championName => {

        championSelect.innerHTML += `
            <option value="${championName}">
                ${championName}
            </option>
        `;

        if(championSearchOptions){
            championSearchOptions.innerHTML += `
                <option value="${championName}">
            `;
        }

    });

    championSelect.addEventListener("change", () => {
        const championName = championSelect.value;

        renderChampionProfile(championName);
    });

    const championSearchInput =
        document.getElementById("champion-search-input");

    if(!championSearchInput){
        return;
    }

    championSearchInput.addEventListener("input", () => {

        const query =
            championSearchInput.value.trim().toLowerCase();

        if(!query){
            championSelect.value = "";
            document.getElementById("champions-champion-results").innerHTML = "";
            return;
        }

        const championName =
            championNames.find(
                name => name.toLowerCase() === query
            );

        if(!championName){
            return;
        }

        championSelect.value = championName;

        renderChampionProfile(championName);

    });

}

function loadChampionRepresentativeSelect(){

    const metricSelect =
        document.getElementById("champion-representative-metric-select");

    if(!metricSelect){
        return;
    }

    metricSelect.addEventListener("change", () => {
        const metricName = metricSelect.value;

        renderChampionRepresentatives(metricName);
    });

}


function renderChampionRepresentatives(metricName){

    const el = document.getElementById("champion-representative-results");

    if(!metricName){
        el.innerHTML = "";
        return;
    }

    const representatives =
        dashboardData?.champion_engine?.champion_functional_representatives || {};

    const rows = [];

    Object.keys(representatives).forEach(championName => {
        const representative = representatives[championName]?.[metricName];
        if(!representative){ return; }
        rows.push({ champion: championName, ...representative });
    });

    rows.sort((a, b) => Number(b.selected_metric || 0) - Number(a.selected_metric || 0));

    if(rows.length === 0){
        el.innerHTML = "<p>No hay datos suficientes.</p>";
        return;
    }

    const activeClass = key => key === metricName ? "specialization-stat" : "";

    let html = `
        <div class="champion-representative-table-wrap">
        <table class="champion-representative-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Champion</th>
                    <th>Profile</th>
                    <th>Games</th>
                    <th class="${activeClass("kda")}">KDA</th>
                    <th class="${activeClass("dpm")}">DPM</th>
                    <th class="${activeClass("kpm")}">KPM</th>
                    <th class="${activeClass("ccpm")}">CCPM</th>
                    <th class="${activeClass("tank_pct")}">Tank%</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach((r, index) => {
        const profileName = r.name === "Champion Baseline"
            ? "‹ Champion Reference ›"
            : formatPlayerName(r.name);

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(r.champion)}</td>
                <td>${escapeHtml(profileName)}</td>
                <td>${Number(r.games || 0)}</td>
                <td class="${activeClass("kda")}">${formatHomeMetric(r.kda, 2)}</td>
                <td class="${activeClass("dpm")}">${Math.round(Number(r.dpm || 0))}</td>
                <td class="${activeClass("kpm")}">${formatHomeMetric(r.kpm, 2)}</td>
                <td class="${activeClass("ccpm")}">${formatHomeMetric(r.ccpm, 2)}</td>
                <td class="${activeClass("tank_pct")}">${formatHomeMetric(r.tank_pct, 2)}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        </div>
    `;

    el.innerHTML = html;
}

function loadChampionTendenciesSelect(){

    const metricSelect =
        document.getElementById("champion-tendencies-metric-select");

    if(!metricSelect){
        return;
    }

    metricSelect.addEventListener("change", () => {
        const metricName = metricSelect.value;

        renderChampionTendencies(metricName);
    });

}


function renderChampionTendencies(metricName){

    const el =
        document.getElementById("champion-tendencies-results");

    if(!metricName){
        el.innerHTML = "";
        return;
    }

    const tendencies =
        dashboardData
            .champion_engine
            .champion_tendencies;

    const rows = Object.keys(tendencies).map(championName => ({
        champion: championName,
        ...tendencies[championName]
    }));

    rows.sort((a, b) => Number(b[metricName] || 0) - Number(a[metricName] || 0));

    if(rows.length === 0){
        el.innerHTML = "<p>No hay datos suficientes.</p>";
        return;
    }

    const metricClass = key =>
        metricName === key ? "specialization-stat" : "";

    let html = `
        <table class="champion-tendencies-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Champion</th>
                    <th>Profiles</th>
                    <th>Games</th>
                    <th class="${metricClass("kda")}">KDA</th>
                    <th class="${metricClass("dpm")}">DPM</th>
                    <th class="${metricClass("kpm")}">KPM</th>
                    <th class="${metricClass("ccpm")}">CCPM</th>
                    <th class="${metricClass("tank_pct")}">Tank%</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach((r, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${escapeHtml(r.champion)}</td>
                <td>${Number(r.profiles || 0)}</td>
                <td>${Number(r.games || 0)}</td>
                <td class="${metricClass("kda")}">${formatHomeMetric(r.kda)}</td>
                <td class="${metricClass("dpm")}">${Math.round(Number(r.dpm || 0))}</td>
                <td class="${metricClass("kpm")}">${formatHomeMetric(r.kpm)}</td>
                <td class="${metricClass("ccpm")}">${formatHomeMetric(r.ccpm)}</td>
                <td class="${metricClass("tank_pct")}">${formatHomeMetric(r.tank_pct)}%</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    el.innerHTML = html;
}

function getChampionComparisonProfile(championName){
    const friendProfiles =
        dashboardData
            .champion_engine
            .champion_performance[championName] ?? [];

    const baseline =
        dashboardData
            .champion_engine
            .champion_baseline?.[championName];

    const championProfile = friendProfiles.map(player => ({...player}));

    // Solo agregar Champion Baseline si hay perfiles de amigos (para comparación)
    // Si no hay perfiles de amigos, solo mostramos Champion Baseline (como única referencia)
    if(baseline && friendProfiles.length > 0){
        championProfile.push({
            ...baseline,
            global_games: baseline.games
        });
    } else if(baseline && friendProfiles.length === 0){
        // Si no hay perfiles de amigos, mostramos solo Champion Baseline
        championProfile.push({
            ...baseline,
            global_games: baseline.games
        });
    }

    return championProfile;
}

function formatChampionContextValue(value, digits = 2){
    const number = Number(value);

    if(!Number.isFinite(number)){
        return "0";
    }

    return number.toFixed(digits).replace(/\.0+$/, "");
}

function renderSignatureEntities(entities, entityType){
    const safeEntities = Array.isArray(entities) ? entities : [];

    if(safeEntities.length === 0){
        return `<span class="champion-history-empty">No current split data available.</span>`;
    }

    return safeEntities.map(entity => {
        const icon = entity.icon
            ? `<img class="champion-signature-icon" src="${escapeHtml(entity.icon)}" alt="" loading="lazy">`
            : "";
        const rarity = entityType === "augment" && entity.rarity
            ? `<span class="champion-signature-rarity">${escapeHtml(entity.rarity)}</span>`
            : "";
        const games = Number(entity.games) || 0;
        const usage = formatChampionContextValue(entity.usage_pct, 1);

        return `
            <div class="champion-signature-entity" title="${escapeHtml(entity.description || entity.name || "")}">
                ${icon}
                <div class="champion-signature-copy">
                    <strong>${escapeHtml(entity.name || "Unknown")}</strong>
                    <span>${games} game${games === 1 ? "" : "s"} · ${usage}% usage</span>
                    ${rarity}
                </div>
            </div>
        `;
    }).join("");
}

function buildChampionHistoryPanel(player){
    const games = Number(player.global_games) || 0;

    return `
        <div class="champion-history-panel">
            <div class="champion-history-heading">
                <div>
                    <div class="meta">CURRENT SPLIT PROFILE</div>
                    <strong>${escapeHtml(
                        player.name === "Champion Baseline"
                            ? "‹ Champion Reference ›"
                            : formatPlayerName(player.name)
                    )}</strong>
                    <span class="champion-history-match-count">
                        Based on ${games} match${games === 1 ? "" : "es"}
                    </span>
                </div>
            </div>

            <div class="champion-history-stats">
                <div class="champion-history-stat">
                    <span>Avg Death Share</span>
                    <strong>
                        ${formatChampionContextValue(
                            player.avg_deaths_share,
                            1
                        )}%
                    </strong>
                    <small>
                        ${formatChampionContextValue(player.avg_deaths)}
                        average deaths
                    </small>
                </div>

                <div class="champion-history-stat">
                    <span>Avg Minion Share</span>
                    <strong>
                        ${formatChampionContextValue(
                            player.avg_minions_share,
                            1
                        )}%
                    </strong>
                    <small>
                        ${formatChampionContextValue(player.avg_minions)}
                        average minions
                    </small>
                </div>

                <div class="champion-history-stat">
                    <span>Avg Gold Share</span>
                    <strong>
                        ${formatChampionContextValue(
                            player.avg_gold_spent_share,
                            1
                        )}%
                    </strong>
                    <small>
                        ${Math.round(
                            Number(player.avg_gold_spent) || 0
                        ).toLocaleString("es-AR")}
                        average gold spent
                    </small>
                </div>
            </div>

            <div class="champion-history-groups">
                <section class="champion-history-group">
                    <h4>Signature Items</h4>
                    <div class="champion-signature-list">
                        ${renderSignatureEntities(player.signature_items, "item")}
                    </div>
                </section>

                <section class="champion-history-group">
                    <h4>Signature Augments</h4>
                    <div class="champion-signature-list">
                        ${renderSignatureEntities(player.signature_augments, "augment")}
                    </div>
                </section>
            </div>
        </div>
    `;
}


function formatProfileMatchDate(timestamp){
    const value = Number(timestamp);
    if(!Number.isFinite(value) || value <= 0){ return ""; }

    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(new Date(value));
}

function buildProfileMatchesPanel(profile, options = {}){
    const matches = Array.isArray(profile?.matches) ? profile.matches : [];
    const showPlayer = Boolean(options.showPlayer);

    if(matches.length === 0){
        return `<div class="profile-matches-empty">No hay partidas enlazadas para este perfil.</div>`;
    }

    return `
        <div class="profile-matches-panel">
            <div class="profile-matches-heading">
                <strong>Partidas que forman este perfil</strong>
                <span>${matches.length} partida${matches.length === 1 ? "" : "s"}</span>
            </div>
            <div class="profile-match-list">
                ${matches.map(match => {
                    const titleIcons = renderMatchTitleIcons(match.titles);
                    const playerText = showPlayer && match.player
                        ? `<span class="profile-match-player">${escapeHtml(formatMatchPlayerName(match.player))}</span>`
                        : "";
                    const dateText = formatProfileMatchDate(match.timestamp);

                    return `
                        <button
                            class="profile-match-link"
                            type="button"
                            data-match-id="${escapeHtml(match.match_id)}"
                            title="Abrir partida ${escapeHtml(match.match_id)} en Match Explorer"
                        >
                            <span class="profile-match-id">${escapeHtml(match.match_id)}</span>
                            ${playerText}
                            <span class="profile-match-score">${titleIcons ? `${titleIcons} ` : ""}${Number(match.score || 0)}</span>
                            ${dateText ? `<span class="profile-match-date">${dateText}</span>` : ""}
                            <span class="profile-match-open">Ver partida →</span>
                        </button>
                    `;
                }).join("")}
            </div>
        </div>
    `;
}

function navigateToMatchExplorer(matchId){
    const normalizedId = String(matchId || "");
    const match = dashboardData?.match_explorer?.find(
        row => String(row.match_id) === normalizedId
    );

    if(!match){ return; }

    showView("matches");

    const select = document.getElementById("match-select");
    const search = document.getElementById("match-search-input");

    if(select){ select.value = normalizedId; }
    if(search){ search.value = normalizedId; }

    renderMatchExplorer(normalizedId);
    document.getElementById("match-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function attachProfileMatchInteractions(container){
    if(!container){ return; }

    container.querySelectorAll(".profile-matches-toggle").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();

            const targetId = button.dataset.matchesTarget;
            const detailRow = targetId
                ? container.querySelector(`#${targetId}`)
                : null;

            if(!detailRow){ return; }

            const willOpen = detailRow.hidden;
            detailRow.hidden = !willOpen;
            button.classList.toggle("matches-open", willOpen);
            button.setAttribute("aria-expanded", String(willOpen));
        });
    });

    container.querySelectorAll(".profile-match-link").forEach(button => {
        button.addEventListener("click", event => {
            event.preventDefault();
            event.stopPropagation();
            navigateToMatchExplorer(button.dataset.matchId);
        });
    });
}

function getScoreMetric(item, key){
    const direct = item?.[`${key}_score`];
    let score;
    if(Number.isFinite(Number(direct))){
        score = Number(direct);
    } else {
        const aggregateKeyByMetric = {
            kpm: "global_avg_kpm_score",
            dpm: "global_avg_dpm_score",
            kda: "global_avg_kda_score",
            ccpm: "global_avg_ccpm_score",
            tank: "global_avg_tank_score",
            goldpm: "global_avg_gold_score"
        };
        const aggregateValue = aggregateKeyByMetric[key] ? item?.[aggregateKeyByMetric[key]] : undefined;
        if(Number.isFinite(Number(aggregateValue))){
            score = Number(aggregateValue);
        } else {
            const globalKeyByMetric = {
                kpm: "GLOBAL_KPM PTS",
                dpm: "GLOBAL_DPM PTS",
                kda: "GLOBAL_KDA PTS",
                ccpm: "GLOBAL_CCPM PTS",
                tank: "GLOBAL_TANK PTS",
                goldpm: "GLOBAL_GOLD PTS"
            };
            const globalKey = globalKeyByMetric[key];
            const globalValue = globalKey ? item?.[globalKey] : undefined;
            score = Number.isFinite(Number(globalValue)) ? Number(globalValue) : 0;
        }
    }
    // Canonical invariant: every independent category score is strictly 0-10.
    return Math.max(0, Math.min(10, score));
}

function getRawMatchMetric(player, key){
    const values = {
        kpm: player?.kpm,
        dpm: player?.dpm,
        kda: player?.kda,
        ccpm: player?.ccpm,
        tank: player?.tank_share,
        goldpm: player?.gold_spm
    };
    const value = Number(values[key]);
    return Number.isFinite(value) ? value : 0;
}

function getGoldPerMinute(item, durationSeconds = 0){
    const direct = item?.gold_spm ?? item?.gold_pm ?? item?.goldpm;
    if(Number.isFinite(Number(direct))){
        return Number(direct);
    }

    const contextGold = Number(item?.context?.gold_spent ?? item?.CONTEXT?.gold_spent);
    const minutes = Number(durationSeconds) / 60;
    if(Number.isFinite(contextGold) && minutes > 0){
        return contextGold / minutes;
    }

    return 0;
}

function buildChampionRankingTable(
    championProfile,
    selectedProfileName = null
){
    let html = `
        <h3>Champion Ranking</h3>

        <div class="champion-ranking-wrap">
        <table class="champion-ranking-table champion-ranking-table-g4">
        <thead>
            <tr>
                <th>#</th>
                <th>Player</th>
                <th>Games</th>
                <th class="score-stat">Score</th>
                <th>KPM</th>
                <th>DPM</th>
                <th>KDA</th>
                <th>CCPM</th>
                <th>Tank</th>
                <th>GoldPM</th>
            </tr>
        </thead>
        <tbody>
    `;

    [...championProfile]
        .sort((a, b) => Number(b.global_avg || 0) - Number(a.global_avg || 0))
        .forEach((profile, index) => {

            const isReference = profile.name === "Champion Baseline";
            const displayName = isReference
                ? "‹ Champion Reference ›"
                : formatPlayerName(profile.name);

            const isSelected = Boolean(
                selectedProfileName
                && (
                    isReference
                        ? selectedProfileName === "Champion Reference"
                        : profile.name === selectedProfileName
                )
            );

            const rowKey = `champion-profile-${index}`;
            const rowClasses = [
                "champion-ranking-row",
                isSelected ? "selected-player-row" : "",
                isReference ? "champion-reference-row" : "",
                "champion-history-toggle"
            ].filter(Boolean).join(" ");

            html += `
                <tr
                    class="${rowClasses}"
                    data-history-target="${rowKey}"
                    tabindex="0"
                    role="button"
                    aria-expanded="false"
                >
                    <td class="champion-rank-cell">
                        <span class="champion-expand-arrow">▸</span>
                        ${index + 1}
                    </td>

                    <td class="champion-player-cell">
                        <div class="champion-ranking-player-name">
                            ${escapeHtml(displayName)}

                            ${isSelected ? `
                                <span class="selected-player-badge">SELECTED PROFILE</span>
                            ` : ""}

                            ${isReference ? `
                                <span class="champion-reference-badge">CHAMPION REFERENCE</span>
                            ` : ""}
                        </div>

                        <div class="champion-ranking-titles">
                            😈${profile.global_god ?? 0}
                            🏅${profile.global_alpha ?? 0}
                            🍦${profile.global_cono ?? 0}
                        </div>
                    </td>

                    <td>
                        <div class="profile-games-cell">
                            <span>${profile.global_games ?? profile.games ?? 0}</span>
                            <button
                                class="profile-matches-toggle"
                                type="button"
                                data-matches-target="${rowKey}-matches"
                                aria-expanded="false"
                                title="Ver las partidas de este perfil"
                            >▸</button>
                        </div>
                    </td>

                    <td class="score-stat">${formatHomeMetric(profile.global_avg)}</td>
                    <td>${formatHomeMetric(getScoreMetric(profile, "kpm"))}</td>
                    <td>${formatHomeMetric(getScoreMetric(profile, "dpm"))}</td>
                    <td>${formatHomeMetric(getScoreMetric(profile, "kda"))}</td>
                    <td>${formatHomeMetric(getScoreMetric(profile, "ccpm"))}</td>
                    <td>${formatHomeMetric(getScoreMetric(profile, "tank"))}</td>
                    <td>${formatHomeMetric(getScoreMetric(profile, "goldpm"))}</td>
                </tr>

                <tr id="${rowKey}-matches" class="profile-matches-row" hidden>
                    <td colspan="14">
                        ${buildProfileMatchesPanel(profile, {showPlayer: isReference})}
                    </td>
                </tr>

                <tr id="${rowKey}" class="champion-history-row" hidden>
                    <td colspan="15">
                        ${buildChampionHistoryPanel(profile)}
                    </td>
                </tr>
            `;
        });

    html += `
        </tbody>
        </table>
        </div>
    `;

    return html;
}

function attachChampionRankingInteractions(container){
    if(!container){
        return;
    }

    attachProfileMatchInteractions(container);

    container.querySelectorAll(".champion-history-toggle").forEach(row => {
        const toggle = () => {
            const targetId = row.dataset.historyTarget;
            const detailRow = targetId ? container.querySelector(`#${targetId}`) : null;

            if(!detailRow){
                return;
            }

            const willOpen = detailRow.hidden;
            detailRow.hidden = !willOpen;
            row.classList.toggle("history-open", willOpen);
            row.setAttribute("aria-expanded", String(willOpen));
        };

        row.addEventListener("click", toggle);
        row.addEventListener("keydown", event => {
            if(event.key === "Enter" || event.key === " "){
                event.preventDefault();
                toggle();
            }
        });
    });
}

function renderChampionProfile(championName){
    const championProfile = getChampionComparisonProfile(championName);

    document.getElementById("champions-champion-results").innerHTML = `
        <div class="player-profile-card">
            <div class="meta">CHAMPION PROFILE</div>
            <h3>${escapeHtml(championName)}</h3>
            ${(() => {
                const championMeta = dashboardData?.champion_engine?.champion_meta?.[championName];
                const metaScore = championMeta?.score?.p50 || 0;
                return `
                    <div class="champion-meta-badge">
                        <span class="meta-label">META:</span>
                        <span class="meta-value">${formatHomeMetric(metaScore)}</span>
                    </div>
                `;
            })()}

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-label">Perfiles</div>
                    <div class="summary-value">${championProfile.length}</div>
                </div>
            </div>

            <div id="champions-player-table"></div>
        </div>
    `;

    const tableContainer = document.getElementById("champions-player-table");
    tableContainer.innerHTML = buildChampionRankingTable(championProfile);
    attachChampionRankingInteractions(tableContainer);
}

function renderPlayerProfile(playerName){

    let playerProfile;

    let profileTitle =
        "PLAYER CHAMPION PROFILE";

    const isChampionReference =
        playerName === "Champion Reference";

    if(isChampionReference){

        playerProfile =
            dashboardData
                .champion_engine
                .champion_baseline;

        profileTitle =
            "CHAMPION REFERENCE";

    }else{

        playerProfile =
            dashboardData
                .champion_engine
                .player_champion_profiles[playerName];

    }

    const championCount =
        Object.keys(playerProfile).length;

    const champions =
        Object.values(playerProfile).sort(
            (a, b) => {
                const ratioA = normalizeMetaRatio(
                    a.global_avg,
                    a.champion_meta,
                    a.champion_meta_p95 || getChampionMetaP95(a.champion)
                );
                const ratioB = normalizeMetaRatio(
                    b.global_avg,
                    b.champion_meta,
                    b.champion_meta_p95 || getChampionMetaP95(b.champion)
                );
                return ratioB - ratioA;
            }
        );

    // Calcular Avg Score: ordenar por score → eliminar 30% → promedio simple
    const sortedByScore = [...champions].sort((a, b) => b.global_avg - a.global_avg);
    const trimCountScore = Math.floor(sortedByScore.length * 0.3);
    const scoredChampions = sortedByScore.slice(trimCountScore);
    
    const avgScore = scoredChampions.length > 0
        ? scoredChampions.reduce((sum, c) => sum + c.global_avg, 0) / scoredChampions.length
        : 0;

    // Calcular Avg Meta Ratio: ordenar por meta_ratio → eliminar 30% → promedio simple
    const metaRatiosWithChampions = champions.map(champion => {
        const meta = dashboardData?.champion_engine?.champion_meta?.[champion.champion]?.score?.p50 || 0;
        const ratio = normalizeMetaRatio(
            champion.global_avg,
            meta,
            getChampionMetaP95(champion.champion)
        );
        return { ratio, champion };
    });
    
    const sortedByMetaRatio = [...metaRatiosWithChampions].sort((a, b) => b.ratio - a.ratio);
    const trimCountMeta = Math.floor(sortedByMetaRatio.length * 0.3);
    const scoredMetaRatios = trimCountMeta > 0
        ? sortedByMetaRatio.slice(0, -trimCountMeta)
        : sortedByMetaRatio;
    
    const avgMetaRatio = scoredMetaRatios.length > 0
        ? scoredMetaRatios.reduce((sum, x) => sum + x.ratio, 0) / scoredMetaRatios.length
        : 0;

    const officialRankingRow = isChampionReference
        ? null
        : (dashboardData?.current_split?.global_ranking || []).find(
            row => row.name === playerName
        );

    // The player summary must use the same official score shown on Home and
    // in the split ranking. Champion History remains a per-champion view.
    const allMatchAvg = isChampionReference
        ? formatHomeMetric(avgScore)
        : formatHomeMetric(officialRankingRow?.global_avg ?? avgScore);

    document.getElementById(
        "players-player-results"
    ).innerHTML = `
        <div class="player-profile-card">
            <div class="meta">${profileTitle}</div>

            ${isChampionReference
                ? `
                    <p class="champion-reference-description">
                        Average performance of all observed opposing players for each champion.
                        Used as the reference baseline.
                    </p>
                `
                : `<h3>${escapeHtml(formatPlayerName(playerName))}</h3>`}

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-label">
                        ${isChampionReference
                            ? "Champions Indexed"
                            : "Champions Used"}
                    </div>
                    <div class="summary-value">
                        ${championCount}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        Avg Score
                    </div>
                    <div class="summary-value">
                        ${allMatchAvg}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        Avg P95R
                    </div>
                    <div class="summary-value">
                        ${formatHomeMetric(avgMetaRatio, 3)}
                    </div>
                </div>
            </div>
        </div>

        <div id="players-champion-table"></div>
    `;

    renderPlayerChampionTable(champions);
}

function renderPlayerChampionTable(
    playerProfile,
    activeSortKey = null,
    activeSortDirection = "desc"
){

    const profileCard = document.querySelector(".player-profile-card");

    if(profileCard){
        profileCard.style.display = "block";
    }

        const sortedPlayerProfile = [...playerProfile].sort((a, b) => {
            if(activeSortKey === "score"){
                const scoreA = Number(a.global_avg) || 0;
                const scoreB = Number(b.global_avg) || 0;

                return activeSortDirection === "asc"
                    ? scoreA - scoreB
                    : scoreB - scoreA;
            }

            if(activeSortKey === "ratio"){
                const ratioA = normalizeMetaRatio(
                    a.global_avg,
                    a.champion_meta,
                    a.champion_meta_p95 || getChampionMetaP95(a.champion)
                );

                const ratioB = normalizeMetaRatio(
                    b.global_avg,
                    b.champion_meta,
                    b.champion_meta_p95 || getChampionMetaP95(b.champion)
                );

                return activeSortDirection === "asc"
                    ? ratioA - ratioB
                    : ratioB - ratioA;
            }

            if(activeSortKey === "games"){
                const gamesA = Number(a.global_games) || 0;
                const gamesB = Number(b.global_games) || 0;

                return activeSortDirection === "asc"
                    ? gamesA - gamesB
                    : gamesB - gamesA;
            }

            return 0;
        });

    let html = `
        <h3>Champion History</h3>

        <table class="player-champion-history-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Champion</th>
                    <th
                        class="sortable ${activeSortKey === "games" ? `sort-${activeSortDirection}` : ""}"
                        data-sort="games"
                    >
                        Games${activeSortKey === "games"
                            ? (activeSortDirection === "asc" ? " ▲" : " ▼")
                            : " ↕"}
                    </th>
                    <th
                        class="sortable ${activeSortKey === "score" ? `sort-${activeSortDirection}` : ""}"
                        data-sort="score"
                    >
                        Score${activeSortKey === "score"
                            ? (activeSortDirection === "asc" ? " ▲" : " ▼")
                            : " ↕"}
                    </th>

                    <th>KPM</th>
                    <th>DPM</th>
                    <th>KDA</th>
                    <th>CCPM</th>
                    <th>Tank</th>
                    <th>GoldPM</th>
                    <th class="meta-stat">META</th>

                    <th
                        class="ratio-stat sortable ${activeSortKey === "ratio" ? `sort-${activeSortDirection}` : ""}"
                        data-sort="ratio"
                    >
                        P95R${activeSortKey === "ratio"
                            ? (activeSortDirection === "asc" ? " ▲" : " ▼")
                            : " ↕"}
                    </th>
                </tr>
            </thead>
            <tbody>
    `;

    sortedPlayerProfile.forEach((champion, index) => {
        const matchesRowId = `player-champion-matches-${index}`;

        html += `
            <tr class="champion-row" data-champion-index="${index}">
                <td>${index + 1}</td>
                <td>${escapeHtml(champion.champion)}</td>
                <td>
                    <div class="profile-games-cell">
                        <span>${champion.global_games ?? champion.games ?? 0}</span>
                        <button
                            class="profile-matches-toggle"
                            type="button"
                            data-matches-target="${matchesRowId}"
                            aria-expanded="false"
                            title="Ver las partidas jugadas con ${escapeHtml(champion.champion)}"
                        >▸</button>
                    </div>
                </td>
                <td>
                    <strong>${formatHomeMetric(champion.global_avg)}</strong>
                </td>
                <td>${formatHomeMetric(getScoreMetric(champion, "kpm"))}</td>
                <td>${formatHomeMetric(getScoreMetric(champion, "dpm"))}</td>
                <td>${formatHomeMetric(getScoreMetric(champion, "kda"))}</td>
                <td>${formatHomeMetric(getScoreMetric(champion, "ccpm"))}</td>
                <td>${formatHomeMetric(getScoreMetric(champion, "tank"))}</td>
                <td>${formatHomeMetric(getScoreMetric(champion, "goldpm"))}</td>
                <td class="meta-stat">${formatHomeMetric(champion.champion_meta || 0)}</td>
                <td class="ratio-stat">${formatHomeMetric(normalizeMetaRatio(champion.global_avg, champion.champion_meta, champion.champion_meta_p95 || getChampionMetaP95(champion.champion)), 3)}</td>
            </tr>
            <tr id="${matchesRowId}" class="profile-matches-row" hidden>
                <td colspan="12">${buildProfileMatchesPanel(champion)}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    const container = document.getElementById("players-champion-table");
    container.innerHTML = html;

    attachProfileMatchInteractions(container);

    // Agregar funcionalidad de ordenamiento
    container.querySelectorAll(".sortable").forEach(header => {
        header.addEventListener("click", () => {
            const sortKey = header.dataset.sort;
            const hasDirection = header.classList.contains("sort-asc") || header.classList.contains("sort-desc");
            const currentDirection = header.classList.contains("sort-asc") ? "asc" : "desc";
            const newDirection = hasDirection ? (currentDirection === "asc" ? "desc" : "asc") : "desc";

            renderPlayerChampionTable(
                playerProfile,
                sortKey,
                newDirection
            );
        });
    });

    container.querySelectorAll(".champion-row").forEach(row => {
        row.addEventListener("click", () => {
            const championIndex = row.dataset.championIndex;
            const champion = sortedPlayerProfile[championIndex];

            renderPlayerChampionDetail(
                champion,
                document.getElementById("players-player-select").value
            );
        });
    });
}

function renderPlayerChampionDetail(champion, playerName){
    const profileCard =
        document.querySelector(".player-profile-card");

    if(profileCard){
        profileCard.style.display = "none";
    }

    const championName =
        champion.champion;

    const championProfile =
        getChampionComparisonProfile(championName);

    const detailContainer =
        document.getElementById("players-champion-table");

    const isChampionReference =
        playerName === "Champion Reference";

    detailContainer.innerHTML = `
        <button
            class="back-button"
            id="player-champion-back-button"
            type="button"
        >
            ← Back to ${escapeHtml(formatPlayerName(playerName))} history
        </button>

        <div class="player-champion-comparison-header">
            <div class="meta">CHAMPION PROFILE COMPARISON</div>
            <h3>${escapeHtml(championName)}</h3>
            ${(() => {
                const championMeta = dashboardData?.champion_engine?.champion_meta?.[championName];
                const metaScore = championMeta?.score?.p50 || 0;
                return `
                    <div class="champion-meta-badge">
                        <span class="meta-label">META:</span>
                        <span class="meta-value">${formatHomeMetric(metaScore)}</span>
                    </div>
                `;
            })()}
            <p>
                Comparing
                <strong>${escapeHtml(formatPlayerName(playerName))}</strong>
                with the other observed profiles for this champion.
            </p>
        </div>

        <div class="player-champion-comparison-table">
            ${buildChampionRankingTable(
                championProfile,
                playerName
            )}
        </div>
    `;

    document
        .getElementById("player-champion-back-button")
        ?.addEventListener("click", () => {

            const sourceProfile =
                isChampionReference
                    ? dashboardData
                        .champion_engine
                        .champion_baseline
                    : dashboardData
                        .champion_engine
                        .player_champion_profiles[playerName];

            const champions =
                Object
                    .values(sourceProfile || {})
                    .sort(
                        (a, b) =>
                            b.global_avg - a.global_avg
                    );

            renderPlayerChampionTable(champions);
        });

    attachChampionRankingInteractions(detailContainer);
}

function formatHomeMetric(value, digits = 2){
    const number = Number(value);

    if(!Number.isFinite(number)){
        return "0";
    }

    return number.toFixed(digits).replace(/\.0+$/, "");
}

function renderChampionTitleIcons(titles){
    const safeTitles = titles || {};
    const titleParts = [];

    const godCount = Number(safeTitles.god) || 0;
    const alphaCount = Number(safeTitles.alpha) || 0;
    const conoCount = Number(safeTitles.cono) || 0;

    if(godCount > 0){
        titleParts.push(
            `<span class="home-title-icon home-title-god" title="GOD ×${godCount}">😈<small>×${godCount}</small></span>`
        );
    }

    if(alphaCount > 0){
        titleParts.push(
            `<span class="home-title-icon home-title-alpha" title="ALPHA ×${alphaCount}">🏅<small>×${alphaCount}</small></span>`
        );
    }

    if(conoCount > 0){
        titleParts.push(
            `<span class="home-title-icon home-title-cono" title="CONO ×${conoCount}">🍦<small>×${conoCount}</small></span>`
        );
    }

    return titleParts.length > 0
        ? `<span class="home-champion-titles">${titleParts.join("")}</span>`
        : "";
}


function renderPlayerChampionHighlights(elementId, highlights){
    const container = document.getElementById(elementId);

    if(!container){
        return;
    }

    if(!Array.isArray(highlights) || highlights.length === 0){
        container.innerHTML = `
            <p class="home-highlights-empty">
                No highlight data available.
            </p>
        `;
        return;
    }

        const orderedHighlights = [...highlights].sort((a, b) => {
            const ratioA = Number(a.avg_meta_ratio) || 0;
            const ratioB = Number(b.avg_meta_ratio) || 0;

            if(ratioA !== ratioB){
                return ratioB - ratioA;
            }

            const scoreA = Number(a.global_avg) || 0;
            const scoreB = Number(b.global_avg) || 0;

            if(scoreA !== scoreB){
                return scoreB - scoreA;
            }

            return String(a.player || "").localeCompare(
                String(b.player || ""),
                "es"
            );
        });

        container.innerHTML = orderedHighlights.map((player, playerIndex) => {
            const champions = Array.isArray(player.champions)
                ? player.champions
                : [];

        const championRows = champions.length > 0
            ? champions.map((champion, championIndex) => {
                return `
                    <tr>
                        <td class="home-champion-rank">#${championIndex + 1}</td>
                        <td class="home-champion-name">
                            <span class="home-champion-name-line">
                                <span>${escapeHtml(champion.champion || "-")}</span>
                                ${renderChampionTitleIcons(champion.titles)}
                            </span>
                        </td>
                        <td>${formatHomeMetric(champion.games, 0)}</td>
                        <td class="ratio-stat">${formatHomeMetric(champion.meta_ratio_normalized ?? champion.meta_ratio ?? 0, 3)}</td>
                        <td class="score-stat">${formatHomeMetric(champion.score_avg)}</td>
                        <td class="meta-stat">${formatHomeMetric(champion.champion_meta || 0)}</td>
                        <td>${formatHomeMetric(getScoreMetric(champion, "kpm"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(champion, "dpm"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(champion, "kda"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(champion, "ccpm"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(champion, "tank"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(champion, "goldpm"))}</td>
                    </tr>
                `;
            }).join("")
            : `
                <tr>
                    <td colspan="16" class="home-no-qualified-champion">
                        No champion has reached the current minimum of 3 matches.
                    </td>
                </tr>
            `;

        return `
            <article class="home-player-card rank-${playerIndex + 1}">
                <div class="home-player-card-header">
                    <div>
                        <div class="home-player-name">
                            ${escapeHtml(formatPlayerName(player.player || "-"))}
                        </div>
                        <div class="home-player-card-label">
                            Best observed champion results
                        </div>
                    </div>

                    <div class="home-player-global-avg home-meta-ratio-avg">
                        <span>AVG P95R</span>
                        <strong>${formatHomeMetric(player.avg_meta_ratio || 0, 3)}</strong>
                    </div>
                    <div class="home-player-global-avg home-score-avg">
                        <span>AVG SCORE</span>
                        <strong>${formatHomeMetric(player.global_avg)}</strong>
                    </div>
                </div>

                <div class="home-player-table-wrap">
                    <table class="home-champion-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Champion</th>
                                <th>Games</th>
                                <th class="ratio-stat">P95R</th>
                                <th class="score-stat">Score</th>
                                <th class="meta-stat">META</th>
                                <th>KPM</th>
                                <th>DPM</th>
                                <th>KDA</th>
                                <th>CCPM</th>
                                <th>Tank</th>
                                <th>GoldPM</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${championRows}
                        </tbody>
                    </table>
                </div>
            </article>
        `;
    }).join("");
}

function renderGlobalRanking(elementId, ranking){
  const el = document.getElementById(elementId);

  if(!ranking || ranking.length === 0){
    el.innerHTML = "<p>No hay datos.</p>";
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          <th>Games</th>
          <th class="score-stat">Score</th>
          <th>KPM</th>
          <th>DPM</th>
          <th>KDA</th>
          <th>CCPM</th>
          <th>Tank</th>
          <th>GoldPM</th>
        </tr>
      </thead>
      <tbody>
  `;

  ranking.forEach((r, i) => {
    const rankClass = i < 3 ? `rank-${i + 1}` : "";

    html += `
      <tr class="${rankClass}">
        <td>${i + 1}</td>
        <td>
          ${escapeHtml(formatPlayerName(r.name))}
          <br>
          😈${r.global_god_count} (${r.global_god_count}/${r.games})
          🏅${r.global_alpha_count} (${r.global_alpha_count}/${r.games})
          🍦${r.global_cono_count} (${r.global_cono_count}/${r.games})
        </td>
        <td>${r.games}</td>
        <td class="score-stat">${formatHomeMetric(r.global_avg)}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "kpm"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "dpm"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "kda"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "ccpm"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "tank"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "goldpm"))}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  el.innerHTML = html;
}

function formatSplitDate(dateValue){
    if(!dateValue){
        return "Date unavailable";
    }

    const parsed = new Date(`${dateValue}T00:00:00`);

    if(Number.isNaN(parsed.getTime())){
        return String(dateValue);
    }

    return parsed.toLocaleDateString(
        "es-AR",
        {day:"2-digit", month:"short", year:"numeric"}
    );
}

function getAvailableSplits(){
    const splits = [];
    const current = dashboardData?.current_split;

    if(current){
        splits.push({
            id:"current",
            label:`Split #${current.number} — Current`,
            name:`Split #${current.number}`,
            start:current.start_date,
            end:current.end_date,
            matches:current.match_count,
            ranking:current.global_ranking || [],
            isCurrent:true
        });
    }

    const archived = dashboardData?.archived_splits?.splits || {};

    Object.entries(archived).forEach(([key, data]) => {
        splits.push({
            id:`archive:${key}`,
            label:key,
            name:key,
            start:data.start,
            end:data.end,
            matches:data.matches,
            ranking:data.global_ranking || [],
            isCurrent:false
        });
    });

    const currentSplits = splits.filter(split => split.isCurrent);
    const archivedSplits = splits
        .filter(split => !split.isCurrent)
        .sort((a,b) => new Date(b.start || 0) - new Date(a.start || 0));

    return [...currentSplits, ...archivedSplits];
}

function loadSplitsSelect(){
    const select = document.getElementById("split-select");
    if(!select){ return; }

    const splits = getAvailableSplits();
    select.innerHTML = "";

    splits.forEach(split => {
        const option = document.createElement("option");
        option.value = split.id;
        option.textContent = split.label;
        select.appendChild(option);
    });

    select.addEventListener("change", () => {
        renderSelectedSplit(select.value);
    });

    if(splits.length > 0){
        select.value = splits[0].id;
        renderSelectedSplit(splits[0].id);
    }
}

function renderSelectedSplit(splitId){
    const split = getAvailableSplits().find(
        candidate => candidate.id === splitId
    );
    const container = document.getElementById("split-results");

    if(!container){ return; }

    if(!split){
        container.innerHTML =
            '<p class="error">Selected split could not be found.</p>';
        return;
    }

    container.innerHTML = `
        <article class="split-profile-card">
            <div class="split-profile-header">
                <div>
                    <div class="meta">
                        ${split.isCurrent ? "CURRENT SPLIT" : "ARCHIVED SPLIT"}
                    </div>
                    <h3>${escapeHtml(split.name)}</h3>
                </div>
                <div class="split-match-count">
                    <span>Matches</span>
                    <strong>${Number(split.matches || 0)}</strong>
                </div>
            </div>
            <div class="split-date-range">
                ${formatSplitDate(split.start)}
                <span>—</span>
                ${formatSplitDate(split.end)}
            </div>
            <div id="selected-split-ranking"></div>
        </article>
    `;

    renderGlobalRanking("selected-split-ranking", split.ranking);
}

function loadMatchExplorerSelect(){

    const select =
    document.getElementById("match-select");

    dashboardData.match_explorer.forEach(match => {

        select.innerHTML += `
            <option value="${match.match_id}">
                ${match.match_id}
            </option>
        `;

    });

    select.addEventListener("change", () => {

        renderMatchExplorer(select.value);

    });

    const searchInput =
        document.getElementById("match-search-input");

    if(!searchInput){
        return;
    }

    searchInput.addEventListener("input", () => {

        const matchId =
            searchInput.value.trim();

        renderMatchExplorer(matchId);

    });

}


function escapeHtml(value){
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatChampionName(player){
    const champion = String(player?.champion ?? "").trim();

    // Nunca mostrar un championId como si fuera el nombre del campeón.
    // El motor intenta resolverlo; si no puede, la interfaz omite el dato.
    if(!champion || /^\d+$/.test(champion) || /^unknown(?: champion)?/i.test(champion)){
        return `<span class="champion-unavailable" title="Nombre de campeón no disponible">—</span>`;
    }

    return escapeHtml(champion);
}

function formatContextNumber(value){
    return Number(value || 0).toLocaleString("es-AR");
}

function renderContextEntities(entities, type){
    if(!Array.isArray(entities) || entities.length === 0){
        return `<span class="context-empty">No data</span>`;
    }

    return entities.map(entity => {
        const name = escapeHtml(entity.name || `Unknown ${type}`);
        const icon = escapeHtml(entity.icon || "");
        const description = escapeHtml(entity.description || "");
        const rarity = escapeHtml(entity.rarity || "");
        const tooltipParts = [name];

        if(rarity){ tooltipParts.push(rarity); }
        if(description){ tooltipParts.push(description); }

        // Para augments, intentar obtener descripción del archivo de descripciones
        if(type === "augment" && !description && dashboardData?.augment_descriptions?.descriptions) {
            const augmentId = entity.id?.toString();
            if(augmentId && dashboardData.augment_descriptions.descriptions[augmentId]) {
                const augmentDescription = dashboardData.augment_descriptions.descriptions[augmentId];
                if(augmentDescription && !tooltipParts.includes(augmentDescription)) {
                    tooltipParts.push(augmentDescription);
                }
            }
        }

        return `
            <div class="context-entity context-${type}" title="${tooltipParts.join(" — ")}">
                ${icon ? `<img class="context-icon" src="${icon}" alt="${name}" loading="lazy" onerror="this.classList.add('context-icon-missing')">` : ""}
                <span>${name}</span>
            </div>
        `;
    }).join("");
}

// Posición de la métrica dentro de la partida. Los ranks vienen del motor
// (GLOBAL_ROLE_DATA), que es el mismo insumo que decide God/Alpha/Cono.
function renderMetricRank(rank){
    const position = Number(rank) || 0;

    if(position <= 0){
        return "";
    }

    return `<span class="context-stat-rank">#${position} de 10</span>`;
}

function renderMetricBreakdown(player){
    const context = player.context || {};
    const ranks = player.ranks || {};

    const metrics = [
        {
            label: "Kills / min",
            value: formatMatchRate(player.kpm, 3),
            rank: ranks.kpm,
            detail: `${formatContextNumber(player.kills)} kills`
        },
        {
            label: "Damage / min",
            value: formatMatchRate(player.dpm, 0),
            rank: ranks.dpm,
            detail: `${formatContextNumber(player.damage_raw)} de daño total`
        },
        {
            label: "KDA",
            value: formatMatchRate(player.kda, 2),
            rank: ranks.kda,
            detail: `${formatContextNumber(player.kills)} / ${formatContextNumber(context.deaths)} / ${formatContextNumber(player.assists)}`
        },
        {
            label: "CC / min",
            value: formatMatchRate(player.ccpm, 3),
            rank: ranks.ccpm,
            detail: `${formatMatchPercent(player.cc_share)} del CC del equipo`
        },
        {
            label: "Tank %",
            value: formatMatchPercent(player.tank_share),
            rank: ranks.tank,
            detail: `${formatContextNumber(player.tank_raw)} absorbidos`
        }
    ];

    return metrics.map(metric => `
        <div class="context-stat-card">
            <span class="context-stat-label">${metric.label}</span>
            <strong>${metric.value}</strong>
            ${renderMetricRank(metric.rank)}
            <small>${metric.detail}</small>
        </div>
    `).join("");
}

function renderPlayerContext(player, isRemake = false){
    const context = player.context || {};

    return `
        <div class="match-context-panel">
            <div class="match-context-header">
                <div class="match-context-identity">
                    <strong>${escapeHtml(formatPlayerName(player.name))}</strong>
                    <span>${escapeHtml(player.champion)}</span>
                </div>
            </div>


            <div class="match-context-group">
                <h4>Share del equipo</h4>
                <div class="match-context-stats match-context-shares">
                    <div class="context-stat-card">
                        <span class="context-stat-label">Kill Share</span>
                        <strong>${formatMatchPercent(player.kill_pct)}</strong>
                        <small>${formatContextNumber(player.kills)} kills</small>
                    </div>

                    <div class="context-stat-card">
                        <span class="context-stat-label">Damage Share</span>
                        <strong>${formatMatchPercent(player.dmg_share)}</strong>
                        <small>${formatContextNumber(player.damage_raw)} de daño</small>
                    </div>

                    <div class="context-stat-card">
                        <span class="context-stat-label">Death Share</span>
                        <strong>${context.deaths_pct || 0}%</strong>
                        <small>${formatContextNumber(context.deaths)} deaths</small>
                    </div>
                </div>
            </div>

            ${isRemake ? "" : `
            <div class="match-context-group">
                <h4>Items</h4>
                <div class="context-entities">${renderContextEntities(context.items, "item")}</div>
            </div>

            <div class="match-context-group">
                <h4>Augments</h4>
                <div class="context-entities">${renderContextEntities(context.augments, "augment")}</div>
            </div>
            `}
        </div>
    `;
}

function toggleMatchContext(rowId){
    const detailRow = document.getElementById(rowId);
    if(!detailRow){ return; }

    const isOpen = detailRow.hidden === false;

    document.querySelectorAll(".match-context-row").forEach(row => { row.hidden = true; });
    document.querySelectorAll(".match-player-row").forEach(row => {
        row.classList.remove("context-open");
        row.setAttribute("aria-expanded", "false");
    });

    if(!isOpen){
        detailRow.hidden = false;
        const sourceRow = document.querySelector(`[data-context-row="${rowId}"]`);
        if(sourceRow){
            sourceRow.classList.add("context-open");
            sourceRow.setAttribute("aria-expanded", "true");
        }
    }
}

function formatCompactNumber(value){
    const number = Number(value);
    if(!Number.isFinite(number)){ return "0"; }

    const absolute = Math.abs(number);
    const compact = (divisor, suffix, digits) =>
        `${(number / divisor).toFixed(digits).replace(/\.0+$/, "")}${suffix}`;

    if(absolute >= 1000000){ return compact(1000000, "M", absolute >= 10000000 ? 1 : 2); }
    if(absolute >= 1000){ return compact(1000, "k", absolute >= 100000 ? 0 : 1); }
    return Math.round(number).toLocaleString("es-AR");
}

function formatMatchPercent(value){
    const number = Number(value);
    return `${Number.isFinite(number) ? number.toFixed(2).replace(/\.0+$/, "") : "0"}%`;
}

function getTeamLabel(teamId){
    const numericId = Number(teamId);
    if(numericId === 100){ return { label: "", title: "Blue team", className: "team-blue" }; }
    if(numericId === 200){ return { label: "", title: "Red team", className: "team-red" }; }
    return { label: "", title: "Unknown team", className: "team-unknown" };
}

function formatPlayerName(playerName){
    return String(playerName || "").split("#", 1)[0];
}

// Alias de compatibilidad para enlaces de partidas existentes.
function formatMatchPlayerName(playerName){
    return formatPlayerName(playerName);
}

function getMatchSortValue(player, key){
    if(key === "teamId"){ return Number(player.teamId) || 999; }
    if(key === "name" || key === "champion"){
        return String(player[key] || "").toLocaleLowerCase("es");
    }
    if(key === "ratio"){
        return normalizeMetaRatio(
            player.score,
            player.champion_meta,
            player.champion_meta_p95 || getChampionMetaP95(player.champion)
        );
    }

    const scoreKeyBySortKey = {
        kpm_score: "kpm",
        dpm_score: "dpm",
        kda_score: "kda",
        ccpm_score: "ccpm",
        tank_score: "tank",
        gold_score: "goldpm"
    };

    if(scoreKeyBySortKey[key]){
        return getScoreMetric(player, scoreKeyBySortKey[key]);
    }

    return Number(player[key]) || 0;
}

function sortMatchPlayers(players){
    const { key, direction } = matchExplorerSort;
    const multiplier = direction === "asc" ? 1 : -1;

    return [...players].sort((a, b) => {
        const left = getMatchSortValue(a, key);
        const right = getMatchSortValue(b, key);
        if(typeof left === "string"){
            return left.localeCompare(right, "es") * multiplier;
        }
        return (left - right) * multiplier;
    });
}

function matchSortHeader(label, key){

    const sortable = !["teamId", "name", "champion"].includes(key);

    const active = sortable && matchExplorerSort.key === key;

    const arrow = !sortable
        ? ""
        : (active
            ? (matchExplorerSort.direction === "asc" ? " ▲" : " ▼")
            : " ↕");

    const cls = sortable
        ? "match-sort-header"
        : "";

    const data = sortable
        ? `data-sort-key="${key}"`
        : "";

    return `<th class="${cls} ${active ? "active-sort" : ""}" ${data}>${label}${arrow}</th>`;
}

function attachMatchExplorerSorting(matchId){
    document.querySelectorAll(".match-sort-header").forEach(header => {
        header.addEventListener("click", () => {
            const key = header.dataset.sortKey;
            if(matchExplorerSort.key === key){
                matchExplorerSort.direction = matchExplorerSort.direction === "asc" ? "desc" : "asc";
            }else{
                matchExplorerSort = {
                    key,
                    direction: ["name", "champion", "teamId"].includes(key) ? "asc" : "desc"
                };
            }
            renderMatchExplorer(matchId);
        });
    });
}

function renderMatchTitleIcons(titles){
    const iconByTitle = {
        GOD: "😈",
        ALPHA: "🏅",
        CONO: "🍦"
    };

    return (Array.isArray(titles) ? titles : [])
        .map(title => iconByTitle[String(title).toUpperCase()] || "")
        .filter(Boolean)
        .join("");
}

function formatMatchRate(value, digits = 3){
    const number = Number(value);
    if(!Number.isFinite(number)){ return "0"; }
    return number.toFixed(digits).replace(/\.0+$/, "");
}

function formatMatchScore(value){
    const number = Number(value);
    if(!Number.isFinite(number)){ return "0"; }
    return number.toFixed(2).replace(/\.0+$/, "");
}

function formatMatchDuration(seconds){
    const total = Number(seconds) || 0;

    if(total <= 0){
        return "";
    }

    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function renderMatchExplorer(matchId){
    const match = dashboardData.match_explorer.find(m => m.match_id == matchId);

    if(!match){
        document.getElementById("match-results").innerHTML = "";
        return;
    }

    const remakeHeader = match.is_remake
        ? `<span class="match-remake-badge">REMAKE</span>`
        : "";

    const remakeNotice = match.is_remake
        ? `<div class="match-remake-notice">Esta partida fue anulada oficialmente por Riot y no participa en estadísticas, rankings ni análisis.</div>`
        : "";

    const duration = formatMatchDuration(match.duration_seconds);

    const durationHeader = duration
        ? `<span class="match-duration" title="Duración de la partida">${duration}</span>`
        : "";

    let html = `
    <div class="match-heading ${match.is_remake ? "match-heading-remake" : ""}">
        <h3>${escapeHtml(match.match_id)}</h3>
        ${remakeHeader}
        ${durationHeader}
    </div>
    ${remakeNotice}
    <div class="match-table-wrap">
    <table class="match-explorer-table match-score-v2-table">
    <thead><tr>
        ${matchSortHeader("Team", "teamId")}
        ${matchSortHeader("Player", "name")}
        ${matchSortHeader("Champion", "champion")}
        ${matchSortHeader("P95R", "ratio")}
        ${matchSortHeader("META", "champion_meta")}
        ${matchSortHeader("Score", "score")}
        ${matchSortHeader("KPM", "kpm_score")}
        ${matchSortHeader("DPM", "dpm_score")}
        ${matchSortHeader("KDA", "kda_score")}
        ${matchSortHeader("CCPM", "ccpm_score")}
        ${matchSortHeader("Tank", "tank_score")}
        ${matchSortHeader("GoldPM", "goldpm")}
    </tr></thead><tbody>`;

    const matchPlayers = (match.players || []).map(player => ({
        ...player,
        goldpm: getGoldPerMinute(player, match.duration_seconds)
    }));

    sortMatchPlayers(matchPlayers).forEach((player, index) => {
        const rowId = `match-context-${match.match_id}-${index}`;
        const team = getTeamLabel(player.teamId);
        const titleIcons = renderMatchTitleIcons(player.titles);
        html += `
        <tr class="match-player-row" data-context-row="${rowId}" aria-expanded="false" tabindex="0"
            onclick="toggleMatchContext('${rowId}')"
            onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();toggleMatchContext('${rowId}');}">
        <td><span class="match-team-badge ${team.className}" title="${escapeHtml(team.title)}" aria-label="${escapeHtml(team.title)}">${team.label}</span></td>
        <td title="${escapeHtml(formatPlayerName(player.name))}">${escapeHtml(formatPlayerName(player.name))}</td>
        <td><span class="match-champion-cell"><span class="match-title-icons" aria-label="${escapeHtml((player.titles || []).join(", "))}">${titleIcons}</span><span>${formatChampionName(player)}</span></span></td>
        <td class="ratio-stat">${formatMatchRate(normalizeMetaRatio(player.score, player.champion_meta, player.champion_meta_p95 || getChampionMetaP95(player.champion)), 3)}</td>
        <td class="meta-stat">${formatMatchScore(player.champion_meta || 0)}</td>
        <td class="score-stat">${formatMatchScore(player.score)}</td>
        <td>${formatMatchScore(getRawMatchMetric(player, "kpm"))}</td>
        <td>${formatMatchScore(getRawMatchMetric(player, "dpm"))}</td>
        <td>${formatMatchScore(getRawMatchMetric(player, "kda"))}</td>
        <td>${formatMatchScore(getRawMatchMetric(player, "ccpm"))}</td>
        <td>${formatMatchPercent(getRawMatchMetric(player, "tank"))}</td>
        <td>${formatMatchScore(getRawMatchMetric(player, "goldpm"))}</td>
        </tr>
        <tr id="${rowId}" class="match-context-row" hidden><td colspan="12">${renderPlayerContext(player, match.is_remake)}</td></tr>`;
    });

    html += `</tbody></table></div>`;
    document.getElementById("match-results").innerHTML = html;
    attachMatchExplorerSorting(match.match_id);
}


loadDashboard();
