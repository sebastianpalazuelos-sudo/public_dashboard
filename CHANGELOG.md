# Changelog — AKE

## Sistema base (estado actual)

El motor puntúa partidas ARAM en tres capas:

1. **GLOBAL TOTAL**: suma de los cinco scores (0–10) de KPM, DPM, KDA, CCPM y Tank%. El motor mide las cinco métricas para todos los campeones, sin importar su rol. No es comparable entre campeones distintos porque cada uno tiene valores naturales distintos en cada métrica (por ejemplo, Sivir no aporta CC en su kit, así que su CCPM suele ser bajo, mientras que un tank suma más en Tank%).
2. **MI**: impacto intra-partida, calculado como el promedio de `(11 - rank)` sobre las métricas seleccionadas para ese campeón en esa partida. La selección parte del kit natural del campeón y permite incluir métricas no habituales cuando el jugador alcanza un rendimiento extraordinario (por ejemplo, una Rell que por Augments o circunstancias puntuales destaca en DPM y supera su P95 histórico).
3. **P95R**: relación entre el GLOBAL TOTAL del jugador en la partida y el score que marca el percentil 95 (P95) de ese campeón. El P95 es el score que solo el 5% de las mejores partidas de ese campeón logra superar. Si el jugador hizo más que ese valor, su P95R es mayor a 1; si hizo menos, es menor a 1.

## Patches recientes

### 1624253409 — Rell / Nasus / Soraka

Se redefine el MI y el sistema de pesos:

- El **MI** pasa a ser un promedio uniforme de `(11 - rank)` en las métricas incluidas.
- Se eliminan los pesos por outlier; la señal es **incluir o no** una métrica.
- El `diversity factor` baja los MI de campeones con muy pocas métricas. Por ejemplo, Soraka pasó de un MI artificial de ~9 a **7.37**, más realista para un support con KDA y CCPM.
- Rell sigue arriba de Nasus porque domina más métricas incluidas.

### 1624241219 — Ashe / Gangplank / Morgana

Se corrige la selección de métricas:

- `tank_share` solo se considera activa para campeones cuyo valor típico en esa métrica está dentro del **60% más alto** de todos los campeones. Esto evita que carries y bruisers sin rol de tanque sumen TANK. Ashe y Gangplank dejan de recibir puntos de TANK.
- Se agrega la **implicación DPM → KPM**: si el daño por minuto es una métrica activa del campeón, obligatoriamente entra también KPM. Esto impide que un campeón con DPM elevado pero KPM bajo (como Morgana) obtenga un MI inflado. Morgana bajó de MI **9.0** a **7.5**.
- Gangplank pasa arriba de Ashe en MI porque no se le suma TANK y sus ranks de KPM/DPM son mejores.
- Se solucionó un bug derivado del ajuste de selección: en la partida **1623995299**, el Ornn de Einherjar había quedado último porque no se le contaban correctamente sus métricas propias. Con el fix, trepó al tercer puesto como correspondía.
