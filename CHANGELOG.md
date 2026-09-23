# Changelog — AKE

Cronología de cambios del motor de scoring. Las partidas de referencia se citan dentro de la versión que las activó.

---

## v1.0 — Rank por categoría

Primera versión con lo que entregaba el LCU: daño recibido, daño auto-mitigado, CC, daño a campeones y kill participation.

- Se rankeaba a cada jugador del 1° al 5° dentro de su categoría.
- Puntaje por categoría: `6 - posición`.
- CC y tank se promediaron en una categoría llamada **Utility** para no dejar que los tanques con alto CC se coman todo.
- Score de partida: **3 a 15**.

---

## v2.0 — De 5 a 10 jugadores

Se pasó a mirar la partida entera, no solo un bando.

- 10 jugadores en lugar de 5.
- Techo del score: **30 puntos**.
- Tres categorías:
  - **Offense**: mejor resultado entre kills o daño.
  - **KP** (kill participation).
  - **Utility**: mejor resultado entre tank o CC.

---

## v3.0 — Peso interno 80/20

Antes el ganador de cada categoría se llevaba todo el crédito. Ahora:

- **Offense** y **Utility** otorgan **80% al mejor valor y 20% al peor** dentro de la categoría.
- Se reconoce la contribución secundaria sin dejar de premiar el rol principal.

---

## v4.0 — Referencias estadísticas y normalización por minuto

El rank relativo no siempre reflejaba la performance real.

- Cada métrica se transforma en un score de **0 a 10** usando referencias fijas globales, sin depender del orden relativo.
- Se incorporó la **duración de la partida** y se normalizaron todas las métricas **por minuto**.

---

## v5.0 — La meta por campeón

Un Sion con alto tank% y un Zed con alto DPM no pueden competir con la misma regla.

- Se creó el sistema de **meta por campeón**: cada campeón tiene su patrón histórico propio.
- **KP** dejó de medir supervivencia y se reemplazó por **KDA**.

---

## v6.0 — Atomización y P95R

Las categorías se desglosaron en cinco métricas independientes:

- **KPM, DPM, KDA, CCPM y Tank%**.
- Cada una otorga score 0–10, con un score total entre **0 y 50**.
- Nace el **P95R**: compara el Score de la partida contra el percentil 95 histórico del campeón, el techo que solo el 5% de sus mejores partidas supera.

---

## v7.0 — Match Impact (MI)

El P95R mide consistencia, pero no quién dominó una partida concreta.

- Nace el **MI**: promedio de `(11 - rank)` en las métricas que el campeón puede impactar, más aquellas donde tuvo rendimiento extraordinario.
- El rank vuelve a usarse, pero **solo dentro de una partida**. El perfil sigue basado en Score y P95R.

---

## v8.0 — Score como promedio de métricas incluidas

Comparar una suma fija de 5 métricas seguía distorsionando: un support con 2 métricas y un carry con 5 no competían en la misma escala.

- El **Score** pasa a ser el **promedio de las métricas incluidas** para ese campeón en esa partida, siempre en escala **0–10**.
- El **P95R** se recalcula contra el percentil 95 del mismo promedio.
- **Partida de referencia**: `1624253409` — Rell, Nasus y Soraka. Se redefinió el MI como promedio uniforme de `(11 - rank)` en las métricas incluidas, eliminando pesos por outlier. Rell sigue arriba de Nasus porque domina más métricas incluidas.

---

## v8.1 — Válvulas de selección

Se refuerzan las reglas sobre qué métricas pueden estar activas.

- `tank_share` solo entra si el valor típico del campeón está dentro del **60% más alto** de todos los campeones. Así Ashe y Gangplank dejan de recibir puntos de TANK.
- Se agrega la **implicación DPM → KPM**: si daño por minuto es activa, asesinatos por minuto también deben entrar.
- **Partida de referencia**: `1624241219` — Ashe, Gangplank y Morgana. Morgana bajó de MI **9.0** a **7.5** porque ya no le entra TANK de forma inflada. Gangplank pasa arriba de Ashe.

---

## v8.2 — MI por cantidad de métricas y advertencia de insuficientes

Se ajusta el cálculo del MI según cuántas métricas activas tiene el campeón.

- **2 métricas**: promedio de `11 - rank`.
- **3 métricas**: promedio de `11 - rank`.
- **4 o 5 métricas**: se filtran por baseline; solo suman las que superan el promedio histórico del campeón.
- Si KDA domina y la otra métrica tiene score < 5.0, se marca como insuficiente.
- El aviso aparece con un asterisco rojo.

---

## v8.3 — KPM con umbral P60

KPM es propia de carries; con P50 demasiados tanques y bruisers la tenían activa.

- KPM pasa a requerir **P60** del campeón para entrar como signature.
- Tank% también mantiene P60.
- **Partida de referencia**: `1625294294` — Cho'Gath vuelve a competir en KDA, CCPM y Tank, con Score **7.25** y MI **7.68**, por encima de Leona (**5.96 / 6.37**).

---

## v8.4 — Métricas signature y MI sin filtro de baseline

Se formaliza el concepto de métricas propias del campeón.

- El umbral para considerar una métrica activa pasa del P25 global al **P50**.
- Se definen las métricas **signature** del campeón; las extraordinarias solo entran si superan el **P90 del campeón**.
- Se elimina el filtro de baseline del MI para 4–5 métricas: ahora el MI usa promedio puro de `11 - rank` en todas las activas.
- **Partida de referencia**: `1624766563` — Rell vuelve a competir en KDA, CCPM y Tank; MI coherente: Rell **6.72** vs Swain **6.80**.

---

## v8.5 — Extras filtrados por Match Impact

Las métricas extraordinarias ya no entran automáticamente: deben mejorar el MI.

- Se separan métricas **signature** de **candidatos extra**.
- Cada candidato se prueba de a uno y solo entra si aumenta el MI.
- **Partida de referencia**: `1623077095` — Diana deja de arrastrar una CCPM extraordinaria pero irrelevante; compite en KPM/DPM con MI **7.74**. Veigar mantiene DPM/KDA/CCPM con MI **7.68**.

---

## v9.0 — EWR y Score

Se agrega el EWR como anclaje externo para medir el resultado colectivo de las partidas.

- El **EWR** se calcula con la lógica del dashboard: partidas con al menos un amigo más, ganador corregido por impacto general y daño a estructuras en surrenders. SurrW y SurrL se contabilizan como victoria/derrota real.
- El **P95R** pasa a comparar el Score de la partida contra el P95 del campeón en ese mismo promedio.
- `GLOBAL TOTAL` se renombra a **Score**.

---

## v9.1 — Mínimo 2 signatures y multiplicador de métricas excluidas

Se fortalece la selección de métricas con dos reglas nuevas.

- **Mínimo 2 métricas signature**: si un campeón tiene solo 1 métrica natural, se agrega la segunda por `central_del_campeon / central_global`.
- **Multiplicador de métricas excluidas**: si quedan al menos 2 métricas afuera, se promedia `observado / central` (truncado `[0.5, 2.0]`) y se aplica `1 + 0.20 * (promedio - 1)`, con tope 1.0.
- Score y MI truncados a 10.
- Límite de **4 métricas activas**: si un campeón llega a 5, se descarta la de peor rank.
- **Partida de referencia**: `1624253409` — Nasus y Rell quedan empatados en Score base **8.82**; con el límite de 4, Rell pasa a **Score 9.34** y **MI 8.73**, mientras Nasus se mantiene en **Score 8.82** y **MI 8.97**.

---

## v9.2 — KDA universal, insuficiencia y utility support

Se redefine quién es medible y quién no.

- **KDA obligatorio** para todos los campeones no enchanter, acompañado de las 2 métricas más naturales.
- Se simplifica la regla de **métricas insuficientes**: solo se marca cuando hay **menos de 2 métricas activas**.
- Se limpia la lista de **utility supports**: Braum, Taric y Lux salen; quedan los enchanters puros.
- **Partida de referencia**: `1625874702` — Xerath ya no recibe asterisco rojo por jugar mal; Braum se evalúa con KDA, CCPM y Tank.

---

## v9.3 — Límite 3 métricas activas y techo MI 10

Se cierra la selección para evitar que una cuarta métrica diluya o dispare el puntaje.

- **Máximo 3 métricas activas**. Si un campeón llega a 4 o 5 candidatas, se conservan las 3 mejores por rank; el resto pasa al multiplicador de métricas excluidas.
- El `diversity_factor` para 3 métricas pasa a **1.0**, porque 3 es ahora el set completo. El techo del MI vuelve a ser **10**.
- **Partida de referencia**: `1625874702` — Elise y Xerath pasan de 4 a 3 métricas activas; el MI se ajusta y el multiplicador de excluidas castiga lo que sobra.

---

## Sistema actual (v9.3)

El motor puntúa partidas ARAM con las siguientes reglas:

1. **Score** — promedio de los scores (0–10) de las métricas activas, multiplicado por el factor de métricas excluidas (nunca > 1.0). Gold es contexto.
2. **MI** — promedio de `11 - rank` en las métricas activas, ajustado por `diversity_factor` (`1=0.88, 2=0.91, 3=1.0`) y por `0.95` adicional para enchanters con ≤2 métricas. Luego el mismo factor de excluidas.
3. **Métricas activas** — no enchanter: KDA + 2 naturales. Extras si superan P90 del campeón y mejoran MI. Máximo 3. Enchanters puros: KDA sola.
4. **Métricas excluidas** — multiplicador con al menos 2 afuera. `ratio = observado / central`, truncado `[0.5, 2.0]`; `1 + 0.20 * (promedio - 1)`, tope 1.0, piso 0.5.
5. **P95R** — `Score / P95 histórico del campeón`, promediado partida por partida.
6. **EWR** — win rate corregido por impacto general y daño a estructuras en surrenders.
7. **Métricas insuficientes** — `< 2 métricas activas` → `*` y se excluyen de los promedios de Score/MI del perfil, pero siguen en P95R y win rate.
