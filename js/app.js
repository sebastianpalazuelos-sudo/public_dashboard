const views = {
    home: document.getElementById("view-home"),
    players: document.getElementById("view-players"),
    champions: document.getElementById("view-champions"),
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
    renderRanking("home-friend-split-ranking", data.current_split.ranking);

    loadPlayersSelect();
    loadChampionsSelect();

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
        <h3>All Match Players Ranking</h3>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
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
                    <td>${player.global_avg_dmg}</td>
                    <td>${player.global_avg_kp}</td>
                    <td>${player.global_avg_util}</td>
                    <td class="secondary-stat">${player.global_avg_cc}</td>
                    <td class="secondary-stat">${player.global_avg_tank}</td>
                </tr>
            `;
        });

    html += `
            </tbody>
        </table>

        <h3>Friend Team Only Ranking</h3>
        <div id="champions-friend-table"></div>
`;

    document.getElementById("champions-player-table").innerHTML = html;
    renderChampionFriendTable(championProfile);

}

function renderChampionFriendTable(championProfile){

    let html = `
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Player</th>
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

    championProfile
        .sort((a, b) => b.avg - a.avg)
        .forEach((player, index) => {
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>
                        ${player.name}
                        <br>
                        😈${player.god ?? 0}
                        🏅${player.alpha ?? 0}
                        🍦${player.cono ?? 0}
                    </td>
                    <td>${player.games}</td>
                    <td class="score-stat">${player.avg}</td>
                    <td>${player.avg_dmg}</td>
                    <td>${player.avg_kp}</td>
                    <td>${player.avg_util}</td>
                    <td class="secondary-stat">${player.avg_cc}</td>
                    <td class="secondary-stat">${player.avg_tank}</td>
                </tr>
            `;
        });

    html += `
            </tbody>
        </table>
    `;

    document.getElementById("champions-friend-table").innerHTML = html;

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

    const friendGames =
        champions.reduce((sum, champion) => sum + champion.games, 0);

    const friendTotal =
        champions.reduce((sum, champion) => sum + champion.total, 0);

    const friendAvg =
        friendGames > 0
            ? (friendTotal / friendGames).toFixed(2)
            : "0.00";
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
                        Friend Team Only Avg
                    </div>
                    <div class="summary-value">
                        ${friendAvg}
                    </div>
                </div>

                <div class="summary-card">
                    <div class="summary-label">
                        All Match Players Avg
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
                    <th>Friend Team AVG</th>
                    <th>All Match Players AVG</th>
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
                    <strong>${champion.avg}</strong>
                    (${champion.god ?? 0}😈 ${champion.alpha ?? 0}🏅 ${champion.cono ?? 0}🍦)
                </td>

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

            <div class="summary-card">
                <div class="summary-label">
                    Friend Team Only AVG
                </div>
                <div class="summary-value">
                    ${champion.avg}
                </div>
                <div class="meta">
                    DMG ${champion.avg_dmg} · KP ${champion.avg_kp} · UTIL ${champion.avg_util}
                    <br>
                    CC ${champion.avg_cc} · TANK ${champion.avg_tank}
                    <br>
                    😈${champion.god ?? 0} 🏅${champion.alpha ?? 0} 🍦${champion.cono ?? 0}
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-label">
                    All Match Players AVG
                </div>
                <div class="summary-value">
                    ${champion.global_avg}
                </div>
                <div class="meta">
                    DMG ${champion.global_avg_dmg} · KP ${champion.global_avg_kp} · UTIL ${champion.global_avg_util}
                    <br>
                    CC ${champion.global_avg_cc} · TANK ${champion.global_avg_tank}
                    <br>
                    😈${champion.global_god ?? 0} 🏅${champion.global_alpha ?? 0} 🍦${champion.global_cono ?? 0}
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

loadDashboard();
