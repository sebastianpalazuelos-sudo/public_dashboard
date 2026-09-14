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
let matchExplorerSort = { key: "match_impact", direction: "desc" };
let splitRankingSort = { key: "p95r", direction: "desc" };
let winRateSort = { key: "p95r", direction: "desc" };
let profileNavStack = [{ view: "ranking" }];
let matchFromNav = false;
let currentSplitRanking = null;
let currentSplitRankingId = null;

let activeViewName = "home";

// Campeones cuya contribución principal (curación, utilidad, escudos)
// no es observable directamente. Se muestran al final de su equipo en Match
// Explorer con un indicador especial.
const UTILITY_SUPPORT_CHAMPIONS = [
    "Yuumi", "Sona", "Lulu", "Renata Glasc", "Milio", "Janna",
    "Ivern", "Soraka", "Nami", "Taric",
    "Seraphine", "Braum"
];

function isUtilitySupport(championName){
    return UTILITY_SUPPORT_CHAMPIONS.includes(championName);
}

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
    showPlayersRanking();
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

    if(viewName === "players"){
        renderPlayersRanking();
        showPlayersRanking();
        resetProfileNav();
    }

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

    const backButton = document.getElementById("players-back-button");
    if(backButton){
        backButton.addEventListener("click", navigateBack);
    }
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
            playerData[playerName] = players.find(p => (p.identity || p.name) === playerName);
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
            const playerScores = sharedMatches.map(m => m[playerName].score);
            const avgScore = playerScores.reduce((sum, score) => sum + score, 0) / playerScores.length;

            const playerMetaRatios = sharedMatches.map(m => normalizeMetaRatio(
                m[playerName].score,
                m[playerName].champion_meta,
                m[playerName].champion_meta_p95 || getChampionMetaP95(m[playerName].champion)
            ));
            const avgMetaRatio = playerMetaRatios.reduce((sum, ratio) => sum + ratio, 0) / playerMetaRatios.length;

            playerStats[playerName] = { avgScore, avgMetaRatio };

            // Debug logs
            const ranking = dashboardData?.current_split?.global_ranking || [];
            const playerData = ranking.find(r => r.name === playerName);
            console.log(`${playerName}: Avg with team=${avgScore.toFixed(2)}, Global avg=${playerData?.global_avg?.toFixed(2)}, Diff=${(avgScore - playerData?.global_avg).toFixed(2)}`);
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

function getPlayerChampionProfile(playerName, fullFriend=false){
    const key = fullFriend
        ? "player_champion_profiles_full_friend"
        : "player_champion_profiles";
    const profiles = dashboardData?.champion_engine?.[key] || {};
    if(!playerName) return null;
    if(profiles[playerName]) return profiles[playerName];

    const aliases = dashboardData?.player_identities || {};
    for(const [canonicalName, accountNames] of Object.entries(aliases)){
        const names = Array.isArray(accountNames) ? accountNames : [];
        if(canonicalName === playerName || names.includes(playerName)){
            if(profiles[canonicalName]) return profiles[canonicalName];
            for(const accountName of names){
                if(profiles[accountName]) return profiles[accountName];
            }
        }
    }

    const normalized = String(playerName).trim().toLowerCase();
    const matchedKey = Object.keys(profiles).find(
        key => String(key).trim().toLowerCase() === normalized
    );
    return matchedKey ? profiles[matchedKey] : null;
}

function getChampionPerformance(championName, fullFriend=false){
    const key = fullFriend ? "champion_performance_full_friend" : "champion_performance";
    const performance = dashboardData?.champion_engine?.[key] || {};
    if(!championName) return [];
    if(Array.isArray(performance[championName])) return performance[championName];

    const normalized = String(championName).trim().toLowerCase();
    const matchedKey = Object.keys(performance).find(
        name => String(name).trim().toLowerCase() === normalized
    );
    return matchedKey && Array.isArray(performance[matchedKey]) ? performance[matchedKey] : [];
}

function getChampionComparisonProfile(championName, fullFriend=false){
    const friendProfiles = getChampionPerformance(championName, fullFriend);

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
                            <span class="profile-match-score">${Number(match.score || 0)}</span>
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
            navigateToMatch(button.dataset.matchId);
        });
    });
}

function getScoreMetric(item, key){
    // Home champion-highlight rows can contain a legacy `${key}_score` value
    // that is not the canonical global average for that player/champion.
    // When canonical champion-performance data exists, it is the source of truth.
    const canonicalKeyByMetric = {
        kpm: "global_avg_kpm_score",
        dpm: "global_avg_dpm_score",
        kda: "global_avg_kda_score",
        ccpm: "global_avg_ccpm_score",
        tank: "global_avg_tank_score"
    };
    const canonicalKey = canonicalKeyByMetric[key];
    const canonicalValue = canonicalKey ? item?.[canonicalKey] : undefined;
    if(Number.isFinite(Number(canonicalValue))){
        return Math.max(0, Math.min(10, Number(canonicalValue)));
    }

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
            tank: "global_avg_tank_score"
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
                tank: "GLOBAL_TANK PTS"
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
        tank: player?.tank_share
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
                </tr>

                <tr id="${rowKey}-matches" class="profile-matches-row" hidden>
                    <td colspan="9">
                        ${buildProfileMatchesPanel(profile, {showPlayer: isReference})}
                    </td>
                </tr>

                <tr id="${rowKey}" class="champion-history-row" hidden>
                    <td colspan="9">
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
                const metaScore = championMeta?.score?.central || 0;
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

function renderPlayerProfile(playerName, context="all"){

    const fullFriend = context === "full" || context === true;
    const contextTitle = fullFriend ? "Full-Friend" : "All-Matches";

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

        playerProfile = getPlayerChampionProfile(playerName, fullFriend);

    }

    // Activar la vista de perfil y ocultar el ranking.
    const ranking = document.getElementById("players-ranking");
    const profileView = document.getElementById("players-profile-view");
    const profileTitleEl = document.getElementById("players-profile-title");
    if(ranking) ranking.classList.add("hidden");
    if(profileView) profileView.classList.remove("hidden");
    if(profileTitleEl){
        profileTitleEl.textContent = isChampionReference
            ? profileTitle
            : `${contextTitle} · ${formatPlayerName(playerName)} profile`;
    }

    if(!playerProfile){
        const results = document.getElementById("players-player-results");
        if(results){
            results.innerHTML = `
                <div class="player-profile-card">
                    <div class="meta">${profileTitle}</div>
                    <p>No hay datos de perfil disponibles para ${escapeHtml(formatPlayerName(playerName))}.</p>
                </div>
            `;
        }
        if(profileView){
            profileView.scrollIntoView({behavior: "smooth", block: "start"});
        }
        return;
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

    // Calcular Avg Score y Avg P95R con promedio simple de todos los campeones.
    const avgScore = champions.length > 0
        ? champions.reduce((sum, c) => sum + c.global_avg, 0) / champions.length
        : 0;

    const metaRatiosWithChampions = champions.map(champion => {
        const ratio = normalizeMetaRatio(
            champion.global_avg,
            champion.champion_meta,
            champion.champion_meta_p95 || getChampionMetaP95(champion.champion)
        );
        return { ratio, champion };
    });

    const avgMetaRatio = metaRatiosWithChampions.length > 0
        ? metaRatiosWithChampions.reduce((sum, x) => sum + x.ratio, 0) / metaRatiosWithChampions.length
        : 0;

    const officialRankingRow = isChampionReference
        ? null
        : getCurrentSplitRanking(playerName, fullFriend);

    // The player summary uses the official split values when available,
    // falling back to the per-champion simple mean for Champion Reference.
    const allMatchAvg = isChampionReference
        ? formatHomeMetric(avgScore)
        : formatHomeMetric(officialRankingRow?.global_avg ?? avgScore);

    const avgP95R = isChampionReference
        ? avgMetaRatio
        : (officialRankingRow?.avg_meta_ratio ?? avgMetaRatio);

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
                : `<h3>${contextTitle} · ${escapeHtml(formatPlayerName(playerName))} profile</h3>`}

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
                        NWR
                    </div>
                    <div class="summary-value">
                        ${formatHomeMetric(getPlayerWinRateStats(playerName, fullFriend).nwr, 1)}%
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        EWR
                    </div>
                    <div class="summary-value">
                        ${formatHomeMetric(getPlayerWinRateStats(playerName, fullFriend).ewr, 1)}%
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        P95R
                    </div>
                    <div class="summary-value">
                        ${formatHomeMetric(getPlayerWinRateStats(playerName, fullFriend).p95r, 3)}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        Avg MI
                    </div>
                    <div class="summary-value">
                        ${formatHomeMetric(getPlayerWinRateStats(playerName, fullFriend).mi, 2)}
                    </div>
                </div>
            </div>
        </div>

        <div id="players-champion-table"></div>
    `;

    renderPlayerChampionTable(champions, playerName, fullFriend);

    if(profileView){
        profileView.scrollIntoView({behavior: "smooth", block: "start"});
    }
}

function renderPlayerChampionTable(
    playerProfile,
    playerName = "",
    fullFriend = false,
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
                const gamesA = Number(a.global_games ?? a.games ?? 0);
                const gamesB = Number(b.global_games ?? b.games ?? 0);

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
                <td class="meta-stat">${formatHomeMetric(champion.champion_meta || 0)}</td>
                <td class="ratio-stat">${formatHomeMetric(normalizeMetaRatio(champion.global_avg, champion.champion_meta, champion.champion_meta_p95 || getChampionMetaP95(champion.champion)), 3)}</td>
            </tr>
            <tr id="${matchesRowId}" class="profile-matches-row" hidden>
                <td colspan="11">${buildProfileMatchesPanel(champion)}</td>
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
                playerName,
                fullFriend,
                sortKey,
                newDirection
            );
        });
    });

    container.querySelectorAll(".champion-row").forEach(row => {
        row.addEventListener("click", () => {
            const championIndex = row.dataset.championIndex;
            const champion = sortedPlayerProfile[championIndex];

            navigateToPlayerChampion(
                champion,
                playerName,
                fullFriend
            );
        });
    });
}

function renderPlayerChampionDetail(champion, playerName, fullFriend=false){
    const profileCard =
        document.querySelector(".player-profile-card");

    if(profileCard){
        profileCard.style.display = "none";
    }

    const championName =
        champion.champion;

    const contextTitle = fullFriend ? "Full-Friend" : "All-Matches";

    const championProfile =
        getChampionComparisonProfile(championName, fullFriend);

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
            <div class="meta">${contextTitle} · CHAMPION PROFILE COMPARISON</div>
            <h3>${escapeHtml(championName)}</h3>
            ${(() => {
                const championMeta = dashboardData?.champion_engine?.champion_meta?.[championName];
                const metaScore = championMeta?.score?.central || 0;
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
            navigateBack();
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
                // Prefer the canonical champion-performance record for this player/champion.
                // The home highlight payload may carry stale/legacy per-metric scores.
                const canonicalChampion = (dashboardData?.champion_engine?.champion_performance?.[champion.champion] || [])
                    .find(entry => entry?.name === player.player);
                const displayChampion = canonicalChampion
                    ? { ...champion, ...canonicalChampion }
                    : champion;
                return `
                    <tr>
                        <td class="home-champion-rank">#${championIndex + 1}</td>
                        <td class="home-champion-name">
                            <span class="home-champion-name-line">
                                <span>${escapeHtml(champion.champion || "-")}</span>
                            </span>
                        </td>
                        <td>${formatHomeMetric(champion.games, 0)}</td>
                        <td class="ratio-stat">${formatHomeMetric(champion.meta_ratio_normalized ?? champion.meta_ratio ?? 0, 3)}</td>
                        <td class="score-stat">${formatHomeMetric(champion.score_avg)}</td>
                        <td class="meta-stat">${formatHomeMetric(champion.champion_meta || 0)}</td>
                        <td>${formatHomeMetric(getScoreMetric(displayChampion, "kpm"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(displayChampion, "dpm"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(displayChampion, "kda"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(displayChampion, "ccpm"))}</td>
                        <td>${formatHomeMetric(getScoreMetric(displayChampion, "tank"))}</td>
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
                            ${(() => {
                                const s = getPlayerWinRateStats(player.player);
                                return (s.resolved || 0) >= 50
                                    ? `<span class="home-player-win-rate">${formatHomeMetric(s.ewr, 1)}% EWR</span>`
                                    : `<span class="home-player-win-rate no-wr" title="Menos de 50 partidas con ganador asignado y al menos un amigo más. Actual: ${(s.NW || 0) + (s.SurrW || 0)}/${s.resolved || 0} - ${formatHomeMetric(s.ewr, 1)}%">*</span>`;
                            })()}
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
                        <span>AVG MI</span>
                        <strong>${formatHomeMetric(getCurrentSplitRanking(player.player).global_avg_match_impact || 0, 2)}</strong>
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

function getSplitSortValue(row, key){
    if(key === "p95r"){ return Number(row.avg_meta_ratio) || 0; }
    if(key === "mi"){ return Number(row.global_avg_match_impact) || 0; }
    if(key === "games"){ return Number(row.games) || 0; }
    if(key === "ewr"){ return Number(getPlayerWinRateStats(row.name).ewr) || 0; }
    return Number(row[key]) || 0;
}

function sortSplitRanking(key){
    if(splitRankingSort.key === key){
        splitRankingSort.direction = splitRankingSort.direction === "desc" ? "asc" : "desc";
    } else {
        splitRankingSort.key = key;
        splitRankingSort.direction = "desc";
    }
    if(currentSplitRanking && currentSplitRankingId){
        renderGlobalRanking(currentSplitRankingId, currentSplitRanking);
    }
}

function splitRankHeader(label, key, extraClass=""){
    const active = splitRankingSort.key === key;
    const arrow = active
        ? (splitRankingSort.direction === "desc" ? " ▼" : " ▲")
        : " ↕";
    const cls = [
        "split-sort-header",
        active ? "active-sort" : "",
        extraClass
    ].filter(Boolean).join(" ");
    return `<th class="${cls}" data-split-sort="${key}">${label}${arrow}</th>`;
}

function attachSplitRankingSorting(){
    document.querySelectorAll("[data-split-sort]").forEach(th => {
        th.addEventListener("click", () => {
            sortSplitRanking(th.dataset.splitSort);
        });
    });
}

function renderGlobalRanking(elementId, ranking){
  currentSplitRanking = ranking;
  currentSplitRankingId = elementId;
  const el = document.getElementById(elementId);

  if(!ranking || ranking.length === 0){
    el.innerHTML = "<p>No hay datos.</p>";
    return;
  }

  const multiplier = splitRankingSort.direction === "asc" ? 1 : -1;
  ranking = ranking.slice().sort((a, b) => (
      getSplitSortValue(a, splitRankingSort.key) - getSplitSortValue(b, splitRankingSort.key)
  ) * multiplier);

  let html = `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Jugador</th>
          ${splitRankHeader("Games", "games")}
          ${splitRankHeader("EWR", "ewr")}
          ${splitRankHeader("P95R", "p95r", "ratio-stat")}
          ${splitRankHeader("MI", "mi", "impact-stat")}
          <th>KPM</th>
          <th>DPM</th>
          <th>KDA</th>
          <th>CCPM</th>
          <th>Tank</th>
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
          ${escapeHtml(formatPlayerName(r.name))}${renderPentaBadge(r.total_pentakills)}
        </td>
        <td>${r.games}</td>
        <td>${(() => {
            const s = getPlayerWinRateStats(r.name);
            return (s.resolved || 0) >= 50 ? formatHomeMetric(s.ewr, 1) + "%" : `<span title="Menos de 50 partidas con ganador asignado y al menos un amigo más. Actual: ${(s.NW || 0) + (s.SurrW || 0)}/${s.resolved || 0} - ${formatHomeMetric(s.ewr, 1)}%">*</span>`;
        })()}</td>
        <td class="ratio-stat">${formatHomeMetric(r.avg_meta_ratio, 3)}</td>
        <td class="impact-stat">${formatHomeMetric(r.global_avg_match_impact || 0, 2)}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "kpm"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "dpm"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "kda"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "ccpm"))}</td>
        <td>${formatHomeMetric(getScoreMetric(r, "tank"))}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  el.innerHTML = html;
  attachSplitRankingSorting();
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
        matchFromNav = false;
        renderMatchExplorer(select.value);
    });

    const searchInput =
        document.getElementById("match-search-input");

    if(!searchInput){
        return;
    }

    searchInput.addEventListener("input", () => {
        matchFromNav = false;
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

// Rank de la métrica dentro de los diez jugadores de ESTA partida.
// Se calcula sobre el valor crudo; como el score es monotónico respecto del raw,
// la posición coincide con la categoría de score. Se fuerza una posición única 1-10.
function getMatchMetricRank(players, player, key){
    const sorted = [...players].sort((a, b) => {
        const left = getRawMatchMetric(a, key);
        const right = getRawMatchMetric(b, key);
        return right - left;
    });
    const index = sorted.indexOf(player);
    return index >= 0 ? index + 1 : 0;
}

function renderMetricRank(rank){
    const position = Number(rank) || 0;
    if(position <= 0){ return ""; }

    const rankClass = position === 1
        ? " metric-rank-top1"
        : position === 2
            ? " metric-rank-top2"
            : position === 10
                ? " metric-rank-bottom"
                : "";

    return `<span class="context-stat-rank${rankClass}">#${position} de 10</span>`;
}

function renderMetricBreakdown(player, matchPlayers){
    const context = player.context || {};
    const metrics = [
        { label: "KPM", key: "kpm", digits: 3 },
        { label: "DPM", key: "dpm", digits: 0 },
        { label: "KDA", key: "kda", digits: 2 },
        { label: "CCPM", key: "ccpm", digits: 3 },
        { label: "Tank %", key: "tank", percent: true }
    ];

    return metrics.map(metric => {
        const raw = getRawMatchMetric(player, metric.key);
        const value = metric.percent
            ? formatMatchPercent(raw)
            : formatMatchRate(raw, metric.digits);
        const rank = getMatchMetricRank(matchPlayers, player, metric.key);

        return `
            <div class="context-stat-card score-metric-card">
                <span class="context-stat-label">${metric.label}</span>
                <strong>${value}</strong>
                ${renderMetricRank(rank)}
            </div>
        `;
    }).join("");
}

function renderPlayerContext(player, isRemake = false, matchPlayers = []){
    const context = player.context || {};

    return `
        <div class="match-context-panel">
            <div class="match-context-header">
                <div class="match-context-identity">
                    <strong>${escapeHtml(formatPlayerName(player.name))}</strong>
                    <span>${escapeHtml(player.champion)}</span>
                    <span class="match-context-meta" title="Meta histórico del campeón">Meta ${formatMatchScore(player.champion_meta || 0)}</span>
                    <span class="match-context-score" title="Score global absoluto de la partida">Score ${formatMatchScore(player.score)}</span>
                    <span class="match-context-impact" title="P95R: score relativo al potencial del campeón">P95R ${formatMatchRate(player.p95r, 3)}</span>
                </div>
            </div>


            <div class="match-context-group match-context-breakdown">
                <h4>Score Metrics</h4>
                <div class="match-context-stats score-metrics-grid">
                    ${renderMetricBreakdown(player, matchPlayers)}
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

                    <div class="context-stat-card">
                        <span class="context-stat-label">Minion Share</span>
                        <strong>${context.minions_pct || 0}%</strong>
                        <small>${formatContextNumber(context.minions)} minions</small>
                    </div>

                    <div class="context-stat-card">
                        <span class="context-stat-label">Gold Share</span>
                        <strong>${context.gold_spent_pct || 0}%</strong>
                        <small>${formatContextNumber(player.gold_spm)} gold/min</small>
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

function renderPentaBadge(count, inline=false){
    const n = Number(count) || 0;
    if(n <= 0) return "";
    const cls = inline ? "penta-badge penta-badge-inline" : "penta-badge";
    const countHtml = n > 1 ? `<span class="penta-count">${n}</span>` : "";
    return `<span class="${cls}" title="Pentakill${n > 1 ? 's' : ''}"><span class="penta-star">★</span>${countHtml}</span>`;
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
    if(key === "match_impact"){
        return Number(player.match_impact) || 0;
    }

    const scoreKeyBySortKey = {
        kpm_score: "kpm",
        dpm_score: "dpm",
        kda_score: "kda",
        ccpm_score: "ccpm",
        tank_score: "tank"
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
        const aUtility = isUtilitySupport(a.champion) ? 1 : 0;
        const bUtility = isUtilitySupport(b.champion) ? 1 : 0;
        if(aUtility !== bUtility){
            return aUtility - bUtility;
        }

        const left = getMatchSortValue(a, key);
        const right = getMatchSortValue(b, key);
        if(typeof left === "string"){
            return left.localeCompare(right, "es") * multiplier;
        }
        return (left - right) * multiplier;
    });
}

function matchSortHeader(label, key){

    // Team is intentionally not sortable: Blue must always be above Red.
    const sortable = key !== "teamId";

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
                    // Numeric metrics default to descending; text columns to ascending.
                    direction: ["name", "champion"].includes(key) ? "asc" : "desc"
                };
            }
            renderMatchExplorer(matchId);
        });
    });
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
    const winningTeam = match.winning_team ?? null;
    const matchBackButton = matchFromNav
        ? `<button id="match-back-button" class="match-back-button" type="button">← Volver</button>`
        : "";

    let html = `
    ${matchBackButton}
    <div class="match-heading ${match.is_remake ? "match-heading-remake" : ""}">
        <h3>${escapeHtml(match.match_id)}</h3>
        ${remakeHeader}
        ${winningTeam ? `<span class="match-win-heading" title="Ganador: ${getTeamLabel(winningTeam).title}">WIN ${getTeamLabel(winningTeam).title}</span>` : ""}
        ${durationHeader}
    </div>
    ${remakeNotice}
    <div class="match-table-wrap">
    <table class="match-explorer-table match-score-v2-table">
    <thead><tr>
        ${matchSortHeader("Team", "teamId")}
        ${matchSortHeader("Player", "name")}
        ${matchSortHeader("Champion", "champion")}
        ${matchSortHeader("MI", "match_impact")}
        ${matchSortHeader("KPM", "kpm_score")}
        ${matchSortHeader("DPM", "dpm_score")}
        ${matchSortHeader("KDA", "kda_score")}
        ${matchSortHeader("CCPM", "ccpm_score")}
        ${matchSortHeader("Tank", "tank_score")}
    </tr></thead><tbody>`;

    const matchPlayers = (match.players || []).map(player => ({
        ...player,
        match_impact: Number(player.match_impact) || 0,
        p95r: normalizeMetaRatio(player.score, player.champion_meta, player.champion_meta_p95 || getChampionMetaP95(player.champion))
    }));

    const teamGroups = new Map();
    matchPlayers.forEach(player => {
        const teamId = Number(player.teamId);
        if(!teamGroups.has(teamId)){ teamGroups.set(teamId, []); }
        teamGroups.get(teamId).push(player);
    });

    // Team order is fixed: Blue first, Red second.
    // The selected column is then applied independently inside each team,
    // so players from Blue can never be interleaved with players from Red.
    const teamOrder = [100, 200];
    const orderedTeams = [
        ...teamOrder.filter(teamId => teamGroups.has(teamId)).map(teamId => [teamId, teamGroups.get(teamId)]),
        ...[...teamGroups.entries()].filter(([teamId]) => !teamOrder.includes(teamId))
    ];

    orderedTeams.forEach(([teamId, players]) => {
        const team = getTeamLabel(teamId);
        const isWinningTeam = teamId === winningTeam;
        const winLabel = isWinningTeam ? `<span class="match-win-badge">WIN</span>` : "";
        html += `<tr class="match-team-divider ${team.className}"><td colspan="9"><span class="match-team-badge ${team.className}" title="${escapeHtml(team.title)}"></span>${winLabel}</td></tr>`;

        // IMPORTANT: sort a copy for this team only. Never sort the full match.
        const sortedTeamPlayers = sortMatchPlayers(players);
        sortedTeamPlayers.forEach((player, index) => {
            const rowId = `match-context-${match.match_id}-${teamId}-${index}`;
            html += `
            <tr class="match-player-row" data-context-row="${rowId}" aria-expanded="false" tabindex="0"
                onclick="toggleMatchContext('${rowId}')"
                onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();toggleMatchContext('${rowId}');}">
            <td><span class="match-team-badge ${team.className}" title="${escapeHtml(team.title)}" aria-label="${escapeHtml(team.title)}"></span></td>
            <td title="${escapeHtml(formatPlayerName(player.name))}">${escapeHtml(formatPlayerName(player.name))}${renderPentaBadge(player.penta_kills, true)}</td>
            <td><span class="match-champion-cell"><span>${formatChampionName(player)}${isUtilitySupport(player.champion) ? ' <span class="utility-support-asterisk" title="Campeón con influencia principal no detectable por el sistema">*</span>' : ''}</span></span></td>
            <td class="impact-stat">${formatMatchScore(player.match_impact)}</td>
            <td>${formatMatchScore(getScoreMetric(player, "kpm"))}</td>
            <td>${formatMatchScore(getScoreMetric(player, "dpm"))}</td>
            <td>${formatMatchScore(getScoreMetric(player, "kda"))}</td>
            <td>${formatMatchScore(getScoreMetric(player, "ccpm"))}</td>
            <td>${formatMatchScore(getScoreMetric(player, "tank"))}</td>
            </tr>
            <tr id="${rowId}" class="match-context-row" hidden><td colspan="9">${renderPlayerContext(player, match.is_remake, matchPlayers)}</td></tr>`;
        });
    });

    html += `</tbody></table></div>`;
    document.getElementById("match-results").innerHTML = html;
    attachMatchExplorerSorting(match.match_id);

    const matchBackButtonEl = document.getElementById("match-back-button");
    if(matchBackButtonEl){
        matchBackButtonEl.addEventListener("click", navigateBackFromMatch);
    }
}


function getPlayerIdentityMap(){
    const map = {};
    if(!dashboardData?.player_identities) return map;
    for(const [canonical, aliases] of Object.entries(dashboardData.player_identities)){
        map[canonical] = canonical;
        for(const alias of aliases){
            map[alias] = canonical;
        }
    }
    return map;
}

function canonicalPlayerName(name){
    return getPlayerIdentityMap()[name] || name;
}

function getCurrentSplitRanking(name, fullFriend=false){
    const ranking = fullFriend
        ? (dashboardData?.current_split?.full_friend_ranking || [])
        : (dashboardData?.current_split?.global_ranking || []);
    return ranking.find(r => r.name === name) || {};
}

function computeWinRateStats({fullFriend=false}={}){
    const stats = {};
    const matches = dashboardData?.match_explorer || [];
    for(const match of matches){
        if(match.is_remake || match.winning_team == null) continue;
        const friendPlayers = (match.players || []).filter(p => p.is_friend);
        if(friendPlayers.length < 2) continue;
        if(fullFriend && friendPlayers.length !== 5) continue;
        const friendTeam = friendPlayers[0]?.teamId;
        const hasFriendPartner = friendPlayers.length >= 2;
        for(const p of friendPlayers){
            const name = canonicalPlayerName(p.identity || p.name);
            if(!stats[name]){
                stats[name] = { NW:0, NL:0, SurrW:0, SurrL:0, resolved:0 };
            }
            if(hasFriendPartner) stats[name].resolved++;
        }
        let category;
        if(!match.ended_in_surrender){
            category = match.winning_team === friendTeam ? "NW" : "NL";
        } else if(match.winning_team === friendTeam){
            // Si ganaron pero el LCU dice que perdimos, es Surrender Win por MI/estructuras.
            // Si el LCU tambien dice que ganamos, se rindio el enemigo: Natural Win.
            if(match.actual_winning_team != null && match.actual_winning_team !== friendTeam){
                category = "SurrW";
            } else {
                category = "NW";
            }
        } else {
            // Si perdimos y el LCU tambien dice que perdimos, es Surrender Lose.
            // Si el LCU dice que ganamos, es NL (error o caso raro).
            if(match.actual_winning_team != null && match.actual_winning_team !== friendTeam){
                category = "SurrL";
            } else {
                category = "NL";
            }
        }
        for(const p of friendPlayers){
            const name = canonicalPlayerName(p.identity || p.name);
            stats[name][category]++;
        }
    }
    for(const s of Object.values(stats)){
        s.total = s.NW + s.NL + s.SurrW + s.SurrL;
        s.nwr = s.NW + s.NL > 0 ? (s.NW / (s.NW + s.NL)) * 100 : 0;
        const surrError = 0.22;
        s.ewr = s.total > 0
            ? ((s.NW + s.SurrW * (1 - surrError) + s.SurrL * surrError) / s.total) * 100
            : 0;
    }
    return stats;
}

function getPlayerWinRateStats(playerName, fullFriend=false){
    const s = computeWinRateStats({fullFriend})[playerName] || { NW:0, NL:0, SurrW:0, SurrL:0, total:0, resolved:0, nwr:0, ewr:0 };
    const row = getCurrentSplitRanking(playerName, fullFriend);
    s.p95r = row.avg_meta_ratio ?? 0;
    s.mi = row.global_avg_match_impact ?? 0;
    return s;
}

function sortWinRateRows(rows, minResolved=50){
    const qualified = rows.filter(r => r.resolved >= minResolved);
    const unqualified = rows.filter(r => r.resolved < minResolved);
    const dir = winRateSort.direction === "asc" ? 1 : -1;
    qualified.sort((a, b) => (a[winRateSort.key] - b[winRateSort.key]) * dir);
    return [...qualified, ...unqualified];
}

function renderPlayersRanking(){
    const container = document.getElementById("players-ranking");
    if(!container || !dashboardData) return;
    const allRanking = (dashboardData.current_split?.global_ranking || []);
    const fullFriendRanking = (dashboardData.current_split?.full_friend_ranking || []);
    const statsAll = computeWinRateStats();
    const statsFull = computeWinRateStats({fullFriend: true});
    const makeRows = (ranking, stats) => ranking.map(r => {
        const s = stats[r.name] || { NW:0, NL:0, SurrW:0, SurrL:0, total:0, resolved:0, nwr:0, ewr:0 };
        return {
            ...r,
            ...s,
            p95r: r.avg_meta_ratio ?? 0,
            mi: r.global_avg_match_impact ?? 0
        };
    });
    const allRows = sortWinRateRows(makeRows(allRanking, statsAll), 50);
    const fullRows = sortWinRateRows(makeRows(fullFriendRanking, statsFull), 30);

    const header = (key, label, title, cls = "") => {
        const isSort = winRateSort.key === key;
        const arrow = isSort ? (winRateSort.direction === "asc" ? " ▲" : " ▼") : "";
        return `<th class="sortable ${cls}${isSort ? " sorted" : ""}" data-sort="${key}" title="${title}">${label}${arrow}</th>`;
    };

    const tableHTML = (rows, title, minResolved=50, tableKey="all") => {
        let h = `
            <h3 class="players-section-title">${title}</h3>
            <table class="winrate-table">
                <thead>
                    <tr>
                        <th title="Perfil canónico del jugador">Profile</th>
                        ${header("NW", "NW", "Victoria natural, destruimos el nexo contrario o el equipo oponente se rindió", "winrate-win")}
                        ${header("NL", "NL", "Derrota natural, el equipo contrario destruyó nuestro nexo", "winrate-loss")}
                        ${header("nwr", "NWR", "Natural Win Rate = NW / (NW + NL)", "nwr-stat")}
                        ${header("SurrW", "SurrW", "Surrender Win, nos rendimos ganando (Calculado por impacto y daño a objetivos)", "winrate-win")}
                        ${header("SurrL", "SurrL", "Surrender Lose, nos rendimos perdiendo (Calculado por impacto y daño a objetivos)", "winrate-loss")}
                        ${header("total", "Total", "Partidas resueltas con al menos un amigo más")}
                        ${header("ewr", "EWR", "Estimated Win Rate, porcentaje ajustado contemplando margen de error", "ewr-stat")}
                        ${header("p95r", "P95R", "Meta Ratio normalizado respecto al percentil 95 del campeón", "p95r-stat")}
                        ${header("mi", "MI", "Match Impact promedio del jugador", "mi-stat")}
                    </tr>
                </thead>
                <tbody>
        `;
        for(const r of rows){
            const qualified = r.resolved >= minResolved;
            const nwrText = qualified ? ((r.NW + r.NL) > 0 ? formatHomeMetric(r.nwr, 1) + "%" : "0.00%") : "*";
            const ewrText = qualified ? formatHomeMetric(r.ewr, 1) + "%" : "*";
            const title = qualified ? "" : `title="Mínimo ${minResolved} partidas con al menos un amigo más. Actual: ${r.resolved}"`;
            h += `
                <tr class="players-ranking-row${qualified ? "" : " no-wr"}" data-player="${escapeHtml(r.name)}" data-table="${tableKey}" ${title}>
                    <td>${escapeHtml(formatPlayerName(r.name))}${renderPentaBadge(r.total_pentakills)}</td>
                    <td class="winrate-win">${r.NW}</td>
                    <td class="winrate-loss">${r.NL}</td>
                    <td class="nwr-stat">${nwrText}</td>
                    <td class="winrate-win">${r.SurrW}</td>
                    <td class="winrate-loss">${r.SurrL}</td>
                    <td>${r.total}</td>
                    <td class="ewr-stat">${ewrText}</td>
                    <td class="p95r-stat">${formatHomeMetric(r.p95r, 3)}</td>
                    <td class="mi-stat">${formatHomeMetric(r.mi, 2)}</td>
                </tr>
            `;
        }
        h += `</tbody></table>`;
        return h;
    };

    container.innerHTML = tableHTML(allRows, "All-Matches Ranking", 50, "all") + tableHTML(fullRows, "Full-Friend Team", 30, "full");

    container.querySelectorAll(".players-ranking-row").forEach(row => {
        row.addEventListener("click", () => {
            const fullFriend = row.dataset.table === "full";
            navigateToProfile(row.dataset.player, fullFriend);
        });
    });
    container.querySelectorAll("th.sortable").forEach(th => {
        th.addEventListener("click", () => {
            const key = th.dataset.sort;
            if(!key) return;
            if(winRateSort.key === key){
                winRateSort.direction = winRateSort.direction === "asc" ? "desc" : "asc";
            }else{
                winRateSort.key = key;
                winRateSort.direction = "desc";
            }
            renderPlayersRanking();
        });
    });
    filterPlayerRows();
}

function filterPlayerRows(){
    const input = document.getElementById("players-search-input");
    const query = (input?.value || "").toLowerCase().trim();
    document.querySelectorAll(".players-ranking-row").forEach(row => {
        const name = (formatPlayerName(row.dataset.player) || "").toLowerCase();
        const display = row.style.display;
        if(query && !name.includes(query)){
            row.style.display = "none";
        } else if(display === "none"){
            row.style.display = "";
        }
    });
}

function showPlayersRanking(){
    const ranking = document.getElementById("players-ranking");
    const profileView = document.getElementById("players-profile-view");
    if(ranking) ranking.classList.remove("hidden");
    if(profileView) profileView.classList.add("hidden");
    window.scrollTo({ top: document.getElementById("view-players").offsetTop, behavior: "smooth" });
}

function navigateToProfile(player, fullFriend=false){
    profileNavStack.push({ view: "profile", player, fullFriend });
    renderPlayerProfile(player, fullFriend);
}

function navigateToPlayerChampion(champion, player, fullFriend=false){
    profileNavStack.push({ view: "champion", champion, player, fullFriend });
    renderPlayerChampionDetail(champion, player, fullFriend);
}

function navigateBack(){
    if(profileNavStack.length <= 1) return;
    profileNavStack.pop();
    const prev = profileNavStack[profileNavStack.length - 1];
    if(prev.view === "ranking"){
        showPlayersRanking();
    } else if(prev.view === "profile"){
        renderPlayerProfile(prev.player, prev.fullFriend);
    } else if(prev.view === "champion"){
        renderPlayerChampionDetail(prev.champion, prev.player, prev.fullFriend);
    }
}

function resetProfileNav(){
    profileNavStack = [{ view: "ranking" }];
}

function switchToPlayersTabWithoutReset(showProfileView=true){
    Object.values(views).forEach(v => v.classList.remove("active-view"));
    views.players.classList.add("active-view");
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.querySelector('.tab-button[data-view="players"]')?.classList.add("active");
    activeViewName = "players";

    const ranking = document.getElementById("players-ranking");
    const profileView = document.getElementById("players-profile-view");
    if(ranking) ranking.classList.add("hidden");
    if(profileView) profileView.classList.remove("hidden");
}

function navigateToMatch(matchId){
    if(activeViewName === "players"){
        matchFromNav = true;
        profileNavStack.push({ view: "match", matchId });
    } else {
        matchFromNav = false;
    }
    navigateToMatchExplorer(matchId);
}

function navigateBackFromMatch(){
    if(profileNavStack.length <= 1) return;
    matchFromNav = false;
    profileNavStack.pop();
    const prev = profileNavStack[profileNavStack.length - 1];
    switchToPlayersTabWithoutReset();
    if(prev.view === "ranking"){
        showPlayersRanking();
    } else if(prev.view === "profile"){
        renderPlayerProfile(prev.player, prev.fullFriend);
    } else if(prev.view === "champion"){
        renderPlayerChampionDetail(prev.champion, prev.player, prev.fullFriend);
    }
}

loadDashboard();
