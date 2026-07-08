const views = {
    home: document.getElementById("view-home"),
    players: document.getElementById("view-players"),
    champions: document.getElementById("view-champions"),
    matches: document.getElementById("view-matches"),
    splits: document.getElementById("view-splits"),
};

let dashboardData = null;

function showView(viewName){
    console.log("Cambiando vista a:", viewName);

    Object.values(views).forEach(view => {
        view.classList.remove("active-view");
    });

    views[viewName].classList.add("active-view");
}
async function loadDashboard(){
  try{
    const response=await fetch("dashboard_data.json");
    if(!response.ok) throw new Error("No se pudo cargar dashboard_data.json");
    const data=await response.json();
    dashboardData = data;
    renderGlobalRanking("home-global-split-ranking", data.current_split.global_ranking);

    loadPlayersSelect();
    loadChampionsSelect();
    loadChampionRepresentativeSelect();
    loadChampionTendenciesSelect();
    loadMatchExplorerSelect();

    document.getElementById("current-split-matches").textContent =
        `${data.current_split.match_count} Matches Played`; 
  }catch(error){
    document.body.innerHTML+=`<main><section><p class="error">${error.message}</p><p>Verificá que index.html y dashboard_data.json estén en la misma carpeta.</p></section></main>`;
  }
}

document.querySelectorAll(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
        showView(button.dataset.view);
    });
});

function loadPlayersSelect(){

    const playerSelect =
        document.getElementById("players-player-select");

    if(!playerSelect){
        return;
    }

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

    Object.keys(
        dashboardData
            .champion_engine
            .champion_performance
    ).sort().forEach(championName => {

        championSelect.innerHTML += `
            <option value="${championName}">
                ${championName}
            </option>
        `;

    });

    championSelect.addEventListener("change", () => {
        const championName = championSelect.value;

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

function renderChampionProfile(championName){

    const championProfile =
        dashboardData
            .champion_engine
            .champion_performance[championName];

    document.getElementById("champions-champion-results").innerHTML = `
        <div class="player-profile-card">
            <div class="meta">CHAMPION PROFILE</div>

            <h3>${championName}</h3>

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-label">
                        Jugadores
                    </div>
                    <div class="summary-value">
                        ${championProfile.length}
                    </div>
                </div>
            </div>

            <div id="champions-player-table"></div>
        </div>
    `;

    renderChampionPlayerTable(championProfile);

}

function renderChampionPlayerTable(championProfile){

    let html = `
        <h3>Champion Ranking</h3>

        <table>
        <thead>
            <tr>
                <th rowspan="2">#</th>
                <th rowspan="2">Player</th>
                <th rowspan="2">Games</th>
                <th rowspan="2" class="score-stat">Score</th>

                <th rowspan="2">KP</th>
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

    championProfile
        .sort((a, b) => b.global_avg - a.global_avg)
        .forEach((player, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        ${player.name}
                        <br>
                        😈${player.global_god ?? 0}
                        🏅${player.global_alpha ?? 0}
                        🍦${player.global_cono ?? 0}
                    </td>
                    <td>${player.global_games}</td>
                    <td class="score-stat">${player.global_avg}</td>
                    <td>${player.global_avg_kp}</td>

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

    document.getElementById("champions-player-table").innerHTML = html;

}

function renderPlayerProfile(playerName){

    const playerProfile =
        dashboardData
            .champion_engine
            .player_champion_profiles[playerName];

    const championCount =
        Object.keys(playerProfile).length;

    const champions =
        Object.values(playerProfile).sort(
            (a, b) => b.global_avg - a.global_avg
        );

    const allMatchGames =
        champions.reduce((sum, champion) => sum + champion.global_games, 0);

    const allMatchTotal =
        champions.reduce(
            (sum, champion) =>
                sum + (champion.global_avg * champion.global_games),
            0
        );

    const allMatchAvg =
        allMatchGames > 0
            ? (allMatchTotal / allMatchGames).toFixed(2)
            : "0.00";

    document.getElementById("players-player-results").innerHTML = `
        <div class="player-profile-card">
            <div class="meta">PLAYER CHAMPION PROFILE</div>

            <h3>${playerName}</h3>

            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-label">
                        Campeones utilizados
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
                <td>${champion.games}</td>
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

        renderPlayerChampionDetail(champion);
    });
});

}

function renderPlayerChampionDetail(champion){

    const profileCard = document.querySelector(".player-profile-card");

    if(profileCard){
        profileCard.style.display = "none";
    }
    document.getElementById("players-champion-table").innerHTML = `
        <button class="back-button" onclick="renderPlayerChampionTable(Object.values(dashboardData.champion_engine.player_champion_profiles[document.getElementById('players-player-select').value]))">
            ← Volver a Champion History
        </button>

        <h3>${champion.champion}</h3>

        <div class="summary-cards">
            <div class="summary-card player-champion-score-card">
                <div class="summary-label">
                    Score
                </div>
                <div class="summary-value">
                    ${champion.global_avg}
                </div>
                <div class="meta">
                    😈${champion.global_god ?? 0} 🏅${champion.global_alpha ?? 0} 🍦${champion.global_cono ?? 0}
                </div>
                       </div>

                        <div class="summary-card contribution-table-card">
                                <div class="summary-label">
                                    Breakdown
                                </div>

                                <table class="contribution-mini-table">
                                    <thead>
                                        <tr>
                                            <th rowspan="2">KP</th>
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
                                        <tr>
                                            <td>${champion.global_avg_kp}</td>

                                            <td class="metric-block-left">${champion.global_avg_dmg}</td>
                                            <td class="metric-block-right">${champion.avg_dmg_share.toFixed(1)}%</td>

                                            <td>${champion.global_avg_util}</td>

                                            <td class="metric-block-left secondary-stat">${champion.global_avg_cc}</td>
                                            <td class="metric-block-right secondary-stat">${champion.avg_cc_share.toFixed(1)}%</td>

                                            <td class="metric-block-left secondary-stat">${champion.global_avg_tank}</td>
                                            <td class="metric-block-right secondary-stat">${champion.avg_tank_share.toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                    </table>
                            </div>
                            </div>
                        
                        </div>

                    </div>
                `;

}

function renderRanking(elementId,ranking){
  const el=document.getElementById(elementId);
  if(!ranking||ranking.length===0){el.innerHTML="<p>No hay datos.</p>";return;}
  let html=`<table><thead><tr><th>#</th><th>Jugador</th><th>Games</th><th class="score-stat">Score</th><th>DMG</th><th>KP</th><th>UTIL</th><th class="secondary-stat">CC</th><th class="secondary-stat">TANK</th></tr></thead><tbody>`;
  ranking.forEach((r,i)=>{
const rankClass = i < 3 ? `rank-${i+1}` : "";
html+=`<tr class="${rankClass}">
<td>${i+1}</td>
<td>
${r.name}
<br>
😈${r.god_count} (${r.god_count}/${r.games})
🏅${r.alpha_count} (${r.alpha_count}/${r.games})
🍦${r.cono_count} (${r.cono_count}/${r.games})
</td>
<td>${r.games}</td>
<td class="score-stat">${r.avg}</td>
<td>${r.avg_dmg}</td>
<td>${r.avg_kp}</td>
<td>${r.avg_util}</td>
<td class="secondary-stat">${r.avg_cc}</td>
<td class="secondary-stat">${r.avg_tank}</td>
</tr>`;
  });
  html+=`</tbody></table>`;
  el.innerHTML=html;
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


function renderMatchExplorer(matchId){

    const match =
        dashboardData
            .match_explorer
            .find(m => m.match_id == matchId);

    if(!match){

        document.getElementById("match-results").innerHTML = "";

        return;

    }

    let html = `

    <h3>${match.match_id}</h3>

    <table>

    <thead>

    <tr>

    <th>Player</th>
    <th>Champion</th>
    <th>Titles</th>

    <th>Score</th>

    <th>Kill%</th>

    <th>KP</th>

    <th>KP%</th>

    <th>DMG</th>
    <th>DMG%</th>

    <th>UTIL</th>

    <th class="secondary-stat">CC</th>
    <th class="secondary-stat">CC%</th>

    <th class="secondary-stat">TANK</th>
    <th class="secondary-stat">TANK%</th>

    </tr>

    </thead>

    <tbody>

    `;

    match.players.forEach(player => {

        html += `

        <tr>

        <td>${player.name}</td>

        <td>${player.champion}</td>

        <td>${player.titles.join(" ")}</td>

        <td class="score-stat">${player.score}</td>

        <td>${player.kill_pct}%</td>

        <td>${player.kp_score}</td>

        <td>${player.kp_pct}%</td>

        <td>${player.dmg_score}</td>

        <td>${player.dmg_share}%</td>

        <td>${player.utility_score}</td>

        <td class="secondary-stat">${player.cc_score}</td>

        <td class="secondary-stat">${player.cc_share}%</td>

        <td class="secondary-stat">${player.tank_score}</td>

        <td class="secondary-stat">${player.tank_share}%</td>

        </tr>

        `;

    });

    html += `

    </tbody>

    </table>

    `;

    document.getElementById("match-results").innerHTML =
        html;

}

loadDashboard();
