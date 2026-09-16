# Changelog — AKE

## Historia de versiones

### v1.0 — El punto de partida

La primera versión arrancó con lo que el LCU podía entregar de forma simple: **daño recibido, daño auto-mitigado, CC, daño a campeones y kill participation**.

El cálculo era directo: se rankeaba a cada jugador dentro de su categoría del 1° al 5° y se le daba `6 - posición` puntos. Para no dejar que los tanques con alto CC se coman todo, **CC y tank** se promediaron en una categoría llamada **Utility**.

El score de una partida iba de **3 a 15**. Era un puntaje crudo, pero ya marcaba la idea: un número que resuma una partida.

### v2.0 — De 5 a 10 jugadores

El paso natural fue mirar la partida entera, no solo un bando. Se pasó de 5 a **10 jugadores**, subiendo el techo del score a **30 puntos**.

Se agregó **kills** y se agrupó todo en tres categorías amplias:

- **Offense**: el mejor resultado entre **kills** o **daño**.
- **KP** (kill participation)
- **Utility**: el mejor resultado entre **tank** o **CC**

Ahora el ranking ya no era por equipo: era contra los otros nueve participantes.

### v3.0 — Peso interno 80/20

El ganador de cada categoría se llevaba todo el crédito. Si un jugador hacía mucho daño pero pocos kills, la categoría Offense lo ignoraba. Si un tank tenía mucho CC pero poco tank, la categoría Utility lo castigaba.

Se ajustó el cálculo de **Offense** y **Utility** para otorgar el **80% al mejor valor y el 20% al peor** dentro de cada categoría. Así se reconocía la contribución secundaria sin dejar de premiar el rol principal.

### v4.0 — Referencias estadísticas y normalización por minuto

La rankeada por posición tenía un problema: un jugador podía ser cuarto en una métrica con un valor muy bueno, o segundo con un valor malo, según la partida. El orden no reflejaba siempre la performance real.

Se introdujo un **sistema de referencias estadísticas** para dar puntos del **1 al 10** en cada métrica de forma independiente, sin depender de la posición relativa. Así dos jugadores podían llevarse la misma nota si tenían números similares.

También se incorporó la **duración de la partida** y se **normalizaron todas las métricas por minuto**, para que una partida corta no mintiera frente a una larga.

### v5.0 — La meta por campeón

Pronto quedó claro que un Sion con alto tank% y un Zed con alto DPM no deberían competir con la misma regla. Cada campeón tiene un patrón natural distinto.

Se creó el **sistema de meta por campeón**: para cada uno se calcula estadísticamente su patrón histórico y el resultado de una partida se compara contra ese patrón propio.

Además, **KP** dejó de ser suficiente para medir supervivencia y efectividad. Se reemplazó por **KDA**.

### v6.0 — Atomización y P95R

Hasta acá las categorías seguían siendo agrupaciones. Se decidió **desglosar todo**: en lugar de Offense, KP y Utility, se trabajaron las cinco métricas por separado:

**KPM, DPM, KDA, CCPM y Tank%**

Cada una otorga un score del 0 al 10, así el GLOBAL TOTAL pasa a oscilar entre **0 y 50**.

Comparar un score de 0-50 directamente entre campeones distintos sigue siendo injusto, así que nació el **P95R** (Percentil 95 Relativo): compara el score de la partida contra el **percentil 95 histórico del campeón**, el valor que solo el 5% de sus mejores partidas supera. Así se obtiene una medida estable y comparable para rankear la consistencia del jugador en el tiempo.

### v7.0 — Match Impact, el protagonista de la partida

El P95R mide consistencia, pero no responde quién dominó una partida concreta. Nació el **MI (Match Impact)**, que compara al jugador contra los otros nueve usando ranks por métrica.

El MI promedia **(11 - rank)** en las métricas que el campeón puede impactar, más aquellas donde tuvo un rendimiento extraordinario.

> **¿No es lo mismo que la v1.0?** No. En v1.0 el rank se usaba directamente para construir el score del perfil. En v7.0 el rank solo sirve dentro de una partida concreta para medir quién la dominó. El perfil del jugador sigue descansando en el **GLOBAL TOTAL** y el **P95R**, que son medidas absolutas y por campeón. El MI es un dato de contexto de la partida, no el puntaje del jugador.

### v8.0 — GLOBAL TOTAL como promedio de métricas incluidas

Se detectó que comparar una suma fija de cinco métricas entre campeones con distintas cantidades de métricas activas seguía generando distorsiones. Un support con KDA y CCPM podía llegar fácilmente a un GLOBAL TOTAL bajo simplemente por tener menos métricas, mientras que un carry con cinco métricas activas sumaba más por construcción.

Se redefinió el **GLOBAL TOTAL** como el **promedio de las métricas incluidas en el MI** para ese campeón en esa partida. El score ahora oscila entre 0 y 10, con la misma escala para todos.

- Si un campeón tiene 5 métricas, se promedian las 5.
- Si tiene 2, se promedian esas 2.
- Si una métrica extra entra por un rendimiento extraordinario, se suma y se divide por la cantidad total. Como la métrica extra solo entra si el jugador superó su P90/P95 histórico, es alta y raramente baja el promedio.

Con este cambio el **P95R** también se recalcula: ahora compara el promedio de la partida contra el percentil 95 histórico de ese promedio. Así el P95R es directamente comparable entre campeones distintos.

## Sistema base (estado actual)

El motor puntúa partidas ARAM en tres capas:

1. **GLOBAL TOTAL**: promedio de los scores (0–10) de las métricas incluidas en el MI para ese campeón en esa partida. Cada métrica individual se mide en su escala global, pero el total es el promedio de las que realmente cuentan para ese campeón. Si una métrica extra entra por un rendimiento extraordinario, se suma y se divide por la cantidad total de métricas activas. El resultado oscila entre 0 y 10, con la misma escala para todos los campeones.
2. **MI**: impacto intra-partida, calculado como el promedio de `(11 - rank)` sobre las métricas seleccionadas para ese campeón en esa partida. La selección parte del kit natural del campeón y permite incluir métricas no habituales cuando el jugador alcanza un rendimiento extraordinario (por ejemplo, una Rell que por Augments o circunstancias puntuales destaca en DPM y supera su P95 histórico).
3. **P95R**: relación entre el GLOBAL TOTAL del jugador en la partida y el percentil 95 (P95) del campeón en ese mismo promedio. El P95 es el valor que solo el 5% de las mejores partidas de ese campeón logra superar. Si el jugador hizo más que ese valor, su P95R es mayor a 1; si hizo menos, es menor a 1.

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

### 1623995400 — Determinación del ganador en surrenders

Antes, cuando una partida terminaba en surrender, no siempre quedaba claro cuál equipo había ganado realmente. El EWR aplicaba un descuento empírico superior al 20% sobre `SurrW` y `SurrL` para reflejar esa incertidumbre.

Se agregó el cálculo de **daño a estructuras** (torretas e inhibidores) como tie-breaker: si un equipo se rinde pero su daño a estructuras supera al enemigo por al menos 50%, se le considera ganador. Con esto el resultado corregido es confiable, y `SurrW` / `SurrL` se tratan como victoria y derrota reales. El EWR ya no aplica margen de error.
