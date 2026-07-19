const views = {
    home: document.getElementById("view-home"),
    players: document.getElementById("view-players"),
    champions: document.getElementById("view-champions"),
    matches: document.getElementById("view-matches"),
    splits: document.getElementById("view-splits"),
};

let dashboardData = null;

let activeViewName = "home";

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

function loadPlayersSelect(){

    const playerSelect =
        document.getElementById("players-player-select");

    if(!playerSelect){
        return;
    }

playerSelect.innerHTML += `
    <option value="Champion Baseline">
        Champion Baseline
    </option>
`;

Object.keys(
    dashboardData.champion_engine.player_champion_profiles
).sort().forEach(playerName => {

    playerSelect.innerHTML += `
        <option value="${playerName}">
            ${playerName}
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

    const el =
        document.getElementById("champion-representative-results");

    if(!metricName){
        el.innerHTML = "";
        return;
    }

    const representatives =
        dashboardData
            .champion_engine
            .champion_functional_representatives;

    const rows = [];

    Object.keys(representatives).forEach(championName => {

        const representative =
            representatives[championName][metricName];

        if(!representative){
            return;
        }

        rows.push({
            champion: championName,
            ...representative
        });

    });

    rows.sort(
        (a, b) => b.selected_metric - a.selected_metric
    );

    if(rows.length === 0){
        el.innerHTML = "<p>No hay datos suficientes.</p>";
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Champion</th>
                    <th>Player</th>
                    <th>Games</th>
                    <th>Score</th>
                    <th class="${metricName === "kp" ? "specialization-stat" : ""}">KP%</th>
                    <th class="${metricName === "kill" ? "specialization-stat" : ""}">Kill%</th>
                    <th class="${metricName === "dmg_share" ? "specialization-stat" : ""}">Damage</th>
                    <th class="${metricName === "cc_share" ? "specialization-stat" : ""}">Control</th>
                    <th class="${metricName === "tank_share" ? "specialization-stat" : ""}">Tank</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach((r, index) => {

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${r.champion}</td>
                <td>${r.name}</td>
                <td>${r.games}</td>
                <td>${r.score}</td>
                <td class="${metricName === "kp" ? "specialization-stat" : ""}">${r.kp.toFixed(1)}%</td>
                <td class="${metricName === "kill" ? "specialization-stat" : ""}">${r.kill.toFixed(1)}%</td>
                <td class="${metricName === "dmg_share" ? "specialization-stat" : ""}">${r.dmg_share.toFixed(1)}%</td>
                <td class="${metricName === "cc_share" ? "specialization-stat" : ""}">${r.cc_share.toFixed(1)}%</td>
                <td class="${metricName === "tank_share" ? "specialization-stat" : ""}">${r.tank_share.toFixed(1)}%</td>
            </tr>
        `;

    });

        html += `
            </tbody>
        </table>
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

    const rows = [];

    Object.keys(tendencies).forEach(championName => {

        const tendency =
            tendencies[championName];

        rows.push({
            champion: championName,
            ...tendency
        });

    });

    rows.sort(
        (a, b) => b[metricName] - a[metricName]
    );

    if(rows.length === 0){
        el.innerHTML = "<p>No hay datos suficientes.</p>";
        return;
    }

    let html = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Champion</th>
                    <th>Players</th>
                    <th>Score</th>
                    <th class="${metricName === "kp" ? "specialization-stat" : ""}">KP%</th>
                    <th class="${metricName === "kill" ? "specialization-stat" : ""}">Kill%</th>
                    <th class="${metricName === "dmg_share" ? "specialization-stat" : ""}">Damage</th>
                    <th class="${metricName === "cc_share" ? "specialization-stat" : ""}">Control</th>
                    <th class="${metricName === "tank_share" ? "specialization-stat" : ""}">Tank</th>
                </tr>
            </thead>
            <tbody>
    `;

    rows.forEach((r, index) => {

        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${r.champion}</td>
                <td>${r.players}</td>
                <td>${r.score}</td>
                <td class="${metricName === "kp" ? "specialization-stat" : ""}">${r.kp.toFixed(1)}%</td>
                <td class="${metricName === "kill" ? "specialization-stat" : ""}">${r.kill.toFixed(1)}%</td>
                <td class="${metricName === "dmg_share" ? "specialization-stat" : ""}">${r.dmg_share.toFixed(1)}%</td>
                <td class="${metricName === "cc_share" ? "specialization-stat" : ""}">${r.cc_share.toFixed(1)}%</td>
                <td class="${metricName === "tank_share" ? "specialization-stat" : ""}">${r.tank_share.toFixed(1)}%</td>
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

    if(baseline){
        championProfile.push({
            ...baseline,
            global_games: baseline.games
        });
    }

    return championProfile;
}

function buildChampionRankingTable(championProfile, selectedPlayerName = null){
    let html = `
        <h3>Champion Ranking</h3>

        <table class="champion-ranking-table">
        <thead>
            <tr>
                <th rowspan="2">#</th>
                <th rowspan="2">Player</th>
                <th rowspan="2">Games</th>
                <th rowspan="2" class="score-stat">Score</th>

                <th rowspan="2">KILL%</th>
                <th rowspan="2">KP</th>
                <th rowspan="2">KP%</th>
                <th class="metric-group" colspan="2">DMG</th>
                <th rowspan="2">UTIL</th>
                <th class="metric-group secondary-stat" colspan="2">CC</th>
                <th class="metric-group secondary-stat" colspan="2">TANK</th>
            </tr>
            <tr>
                <th class="metric-block-left">DMG</th>
                <th class="metric-block-right metric-share">Share</th>

                <th class="metric-block-left secondary-stat">CC</th>
                <th class="metric-block-right secondary-stat">Share</th>

                <th class="metric-block-left secondary-stat">TANK</th>
                <th class="metric-block-right secondary-stat">Share</th>
            </tr>
        </thead>
        <tbody>
    `;

    [...championProfile]
        .sort((a, b) => b.global_avg - a.global_avg)
        .forEach((player, index) => {
            const isSelected = selectedPlayerName && player.name === selectedPlayerName;

            html += `
                <tr class="${isSelected ? "selected-player-row" : ""}">
                    <td>${index + 1}</td>
                    <td>
                        <div class="champion-ranking-player-name">
                            ${escapeHtml(player.name)}
                            ${isSelected ? '<span class="selected-player-badge">SELECTED PLAYER</span>' : ''}
                        </div>
                        <div class="champion-ranking-titles">
                            😈${player.global_god ?? 0}
                            🏅${player.global_alpha ?? 0}
                            🍦${player.global_cono ?? 0}
                        </div>
                    </td>
                    <td>${player.global_games}</td>
                    <td class="score-stat">${player.global_avg}</td>
                    <td>${player.avg_kill_pct.toFixed(1)}%</td>
                    <td>${player.global_avg_kp}</td>
                    <td>${player.avg_kp_pct.toFixed(1)}%</td>

                    <td class="metric-block-left">${player.global_avg_dmg}</td>
                    <td class="metric-block-right">${player.avg_dmg_share.toFixed(1)}%</td>

                    <td>${player.global_avg_util}</td>

                    <td class="metric-block-left secondary-stat">${player.global_avg_cc}</td>
                    <td class="metric-block-right secondary-stat">${player.avg_cc_share.toFixed(1)}%</td>

                    <td class="metric-block-left secondary-stat">${player.global_avg_tank}</td>
                    <td class="metric-block-right secondary-stat">${player.avg_tank_share.toFixed(1)}%</td>
                </tr>
            `;
        });

    html += `
        </tbody>
        </table>
    `;

    return html;
}

function renderChampionProfile(championName){
    const championProfile = getChampionComparisonProfile(championName);

    document.getElementById("champions-champion-results").innerHTML = `
        <div class="player-profile-card">
            <div class="meta">CHAMPION PROFILE</div>
            <h3>${escapeHtml(championName)}</h3>

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-label">Perfiles</div>
                    <div class="summary-value">${championProfile.length}</div>
                </div>
            </div>

            <div id="champions-player-table"></div>
        </div>
    `;

    document.getElementById("champions-player-table").innerHTML =
        buildChampionRankingTable(championProfile);
}

function renderPlayerProfile(playerName){

    let playerProfile;

    let profileTitle =
        "PLAYER CHAMPION PROFILE";

    if(playerName === "Champion Baseline"){

        playerProfile =
            dashboardData
                .champion_engine
                .champion_baseline;

        profileTitle =
            "CHAMPION BASELINE";

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
            (a, b) => b.global_avg - a.global_avg
        );

    const getChampionGames = champion =>
        champion.global_games ?? champion.games ?? 0;

    const allMatchGames =
        champions.reduce(
            (sum, champion) =>
                sum + getChampionGames(champion),
            0
        );

    const allMatchTotal =
        champions.reduce(
            (sum, champion) =>
                sum + (
                    champion.global_avg
                    * getChampionGames(champion)
                ),
            0
        );

    const allMatchAvg =
        allMatchGames > 0
            ? (allMatchTotal / allMatchGames).toFixed(2)
            : "0.00";

    document.getElementById(
        "players-player-results"
    ).innerHTML = `
        <div class="player-profile-card">
            <div class="meta">${profileTitle}</div>

            <h3>${playerName}</h3>

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-label">
                        ${playerName === "Champion Baseline"
                            ? "Champion Baselines"
                            : "Campeones utilizados"}
                    </div>
                    <div class="summary-value">
                        ${championCount}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        ${playerName === "Champion Baseline"
                            ? "Avg Baseline"
                            : "Avg Score"}
                    </div>
                    <div class="summary-value">
                        ${allMatchAvg}
                    </div>
                </div>
            </div>
        </div>

        <div id="players-champion-table"></div>
    `;

    renderPlayerChampionTable(champions);
}

function renderPlayerChampionTable(playerProfile){

    const profileCard = document.querySelector(".player-profile-card");

    if(profileCard){
        profileCard.style.display = "block";
    }

    let html = `
        <h3>Champion History</h3>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Champion</th>
                    <th>Games</th>
                    <th>Score</th>
                </tr>
            </thead>
            <tbody>
    `;

    playerProfile.forEach((champion, index) => {
    html += `
        <tr class="champion-row" data-champion-index="${index}">
                <td>${index + 1}</td>
                <td>${champion.champion}</td>
                <td>${champion.global_games ?? champion.games ?? 0}</td>
                <td>
                    <strong>${champion.global_avg}</strong>
                    (${champion.global_god ?? 0}😈 ${champion.global_alpha ?? 0}🏅 ${champion.global_cono ?? 0}🍦)
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById("players-champion-table").innerHTML = html;
    document.querySelectorAll(".champion-row").forEach(row => {
    row.addEventListener("click", () => {
        const championIndex = row.dataset.championIndex;
        const champion = playerProfile[championIndex];

        renderPlayerChampionDetail(champion, document.getElementById("players-player-select").value);
    });
});

}

function renderPlayerChampionDetail(champion, playerName){
    const profileCard = document.querySelector(".player-profile-card");

    if(profileCard){
        profileCard.style.display = "none";
    }

    const championName = champion.champion;
    const championProfile = getChampionComparisonProfile(championName);

    document.getElementById("players-champion-table").innerHTML = `
        <button class="back-button" onclick="renderPlayerChampionTable(Object.values(dashboardData.champion_engine.player_champion_profiles[document.getElementById('players-player-select').value]))">
            ← Volver al historial de ${escapeHtml(playerName)}
        </button>

        <div class="player-champion-comparison-header">
            <div class="meta">PLAYER CHAMPION COMPARISON</div>
            <h3>${escapeHtml(championName)}</h3>
            <p>Comparación del rendimiento de <strong>${escapeHtml(playerName)}</strong> frente a los demás perfiles del campeón.</p>
        </div>

        <div class="player-champion-comparison-table">
            ${buildChampionRankingTable(championProfile, playerName)}
        </div>
    `;
}


function formatHomeMetric(value, digits = 2){
    const number = Number(value);

    if(!Number.isFinite(number)){
        return "0";
    }

    return number.toFixed(digits).replace(/\.?0+$/, "");
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

    container.innerHTML = highlights.map((player, playerIndex) => {
        const champions = Array.isArray(player.champions)
            ? player.champions
            : [];

        const championRows = champions.length > 0
            ? champions.map((champion, championIndex) => `
                <tr>
                    <td class="home-champion-rank">#${championIndex + 1}</td>
                    <td class="home-champion-name">
                        <span class="home-champion-name-line">
                            <span>${champion.champion || "-"}</span>
                            ${renderChampionTitleIcons(champion.titles)}
                        </span>
                    </td>
                    <td>${formatHomeMetric(champion.games, 0)}</td>
                    <td>${formatHomeMetric(champion.score_avg)}</td>
                    <td>${formatHomeMetric(champion.kill_pct)}%</td>
                    <td>${formatHomeMetric(champion.kp_score)}</td>
                    <td>${formatHomeMetric(champion.kp_pct)}%</td>
                    <td>${formatHomeMetric(champion.dmg_score)}</td>
                    <td>${formatHomeMetric(champion.dmg_pct)}%</td>
                    <td>${formatHomeMetric(champion.utility_score)}</td>
                    <td>${formatHomeMetric(champion.cc_score)}</td>
                    <td>${formatHomeMetric(champion.cc_pct)}%</td>
                    <td>${formatHomeMetric(champion.tank_score)}</td>
                    <td>${formatHomeMetric(champion.tank_pct)}%</td>
                </tr>
            `).join("")
            : `
                <tr>
                    <td colspan="14" class="home-no-qualified-champion">
                        No champion has reached the current minimum of 3 matches.
                    </td>
                </tr>
            `;

        return `
            <article class="home-player-card rank-${playerIndex + 1}">
                <div class="home-player-card-header">
                    <div>
                        <div class="home-player-name">
                            ${player.player || "-"}
                        </div>
                        <div class="home-player-card-label">
                            Best observed champion results
                        </div>
                    </div>

                    <div class="home-player-global-avg">
                        <span>GLOBAL AVG</span>
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
                                <th>Score</th>
                                <th>Kill%</th>
                                <th>KP</th>
                                <th>KP%</th>
                                <th>DMG</th>
                                <th>DMG%</th>
                                <th>Utility</th>
                                <th>CC</th>
                                <th>CC%</th>
                                <th>Tank</th>
                                <th>Tank%</th>
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
          <th>DMG</th>
          <th>KP</th>
          <th>UTIL</th>
          <th class="secondary-stat">CC</th>
          <th class="secondary-stat">TANK</th>
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
          ${r.name}
          <br>
          😈${r.global_god_count} (${r.global_god_count}/${r.games})
          🏅${r.global_alpha_count} (${r.global_alpha_count}/${r.games})
          🍦${r.global_cono_count} (${r.global_cono_count}/${r.games})
        </td>
        <td>${r.games}</td>
        <td class="score-stat">${r.global_avg}</td>
        <td>${r.global_avg_dmg}</td>
        <td>${r.global_avg_kp}</td>
        <td>${r.global_avg_util}</td>
        <td class="secondary-stat">${r.global_avg_cc}</td>
        <td class="secondary-stat">${r.global_avg_tank}</td>
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

        return `
            <div class="context-entity context-${type}" title="${tooltipParts.join(" — ")}">
                ${icon ? `<img class="context-icon" src="${icon}" alt="${name}" loading="lazy" onerror="this.classList.add('context-icon-missing')">` : ""}
                <span>${name}</span>
            </div>
        `;
    }).join("");
}

function renderPlayerContext(player, isRemake = false){
    const context = player.context || {};

    return `
        <div class="match-context-panel">
            <div class="match-context-identity">
                <strong>${escapeHtml(player.name)}</strong>
                <span>${escapeHtml(player.champion)}</span>
            </div>

            <div class="match-context-stats">
                <div class="context-stat-card">
                    <span class="context-stat-label">Deaths</span>
                    <strong>${formatContextNumber(context.deaths)}</strong>
                    <span>${context.deaths_pct || 0}% del equipo</span>
                </div>
                <div class="context-stat-card">
                    <span class="context-stat-label">Minions</span>
                    <strong>${formatContextNumber(context.minions)}</strong>
                    <span>${context.minions_pct || 0}% del equipo</span>
                </div>
                <div class="context-stat-card">
                    <span class="context-stat-label">Gold Spent</span>
                    <strong>${formatContextNumber(context.gold_spent)}</strong>
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

    let html = `
    <div class="match-heading ${match.is_remake ? "match-heading-remake" : ""}">
        <h3>${escapeHtml(match.match_id)}</h3>
        ${remakeHeader}
    </div>
    ${remakeNotice}
    <div class="match-table-wrap">
    <table class="match-explorer-table">
    <thead><tr>
    <th>Player</th><th>Champion</th><th>Titles</th><th>Score</th><th>Kill%</th><th>KP</th><th>KP%</th><th>DMG</th><th>DMG%</th><th>UTIL</th><th class="secondary-stat">CC</th><th class="secondary-stat">CC%</th><th class="secondary-stat">TANK</th><th class="secondary-stat">TANK%</th>
    </tr></thead><tbody>`;

    match.players.forEach((player, index) => {
        const rowId = `match-context-${match.match_id}-${index}`;
        html += `
        <tr class="match-player-row" data-context-row="${rowId}" aria-expanded="false" tabindex="0"
            onclick="toggleMatchContext('${rowId}')"
            onkeydown="if(event.key === 'Enter' || event.key === ' '){event.preventDefault();toggleMatchContext('${rowId}');}">
        <td>${escapeHtml(player.name)}</td>
        <td>${formatChampionName(player)}</td>
        <td>${player.titles.join(" ")}</td>
        <td class="score-stat">${player.score}</td>
        <td>${player.kill_pct}%</td><td>${player.kp_score}</td><td>${player.kp_pct}%</td>
        <td>${player.dmg_score}</td><td>${player.dmg_share}%</td><td>${player.utility_score}</td>
        <td class="secondary-stat">${player.cc_score}</td><td class="secondary-stat">${player.cc_share}%</td>
        <td class="secondary-stat">${player.tank_score}</td><td class="secondary-stat">${player.tank_share}%</td>
        </tr>
        <tr id="${rowId}" class="match-context-row" hidden><td colspan="14">${renderPlayerContext(player, match.is_remake)}</td></tr>`;
    });

    html += `</tbody></table></div>`;
    document.getElementById("match-results").innerHTML = html;
}


loadDashboard();
