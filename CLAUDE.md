# vladaweb

Osobní rozcestník projektů na GitHub Pages. `index.html` je deck, `deck-data.json` jeho data, `projects/` jednotlivé stránky.

## Deck se upravuje ze dvou míst

`deck-data.json` mění jak Claude (commity z tohoto repa), tak web samotný (při úpravě decku v prohlížeči commituje přes GitHub API zprávou „Sync deck (web)“). Proto:

- Před každou úpravou `deck-data.json` nebo přidáním projektu spusť `git pull --rebase`, ať se nepřepíšou úpravy z webu.
- `deck-data.json` upravuj cíleně (načíst JSON, změnit, uložit kompaktně bez odřádkování na konci), nikdy ho nepřepisuj starší kopií.
- Po commitu pushni až po pullu; když push selže kvůli novějšímu commitu z webu, `git pull --rebase` a push znovu.
- Nový projekt = soubor v `projects/` + záznam v příslušném tématu v `deck-data.json` (`nazev`, `popis`, `odkaz: "./projects/…"`, `tagy: []`, `stav: "live"`).

Web při načtení čte deck přímo z GitHub API (Pages mají zpoždění), neodeslané úpravy z prohlížeče slučuje s tím, co mezitím přibylo na GitHubu.

## Posilovna (`projects/posilovna.html`)

Přihlášení (jméno + heslo, obnova hesla e-mailem) a data tréninků běží přes Firebase (Auth + Firestore), ne přes GitHub. Konfigurace webové aplikace (projekt `posilovna-59716`) je v konstantě `FIREBASE_CONFIG` – není tajná, data chrání pravidla Firestore. Pravidla Firestore jsou v konstantě `RULES` – při jejich změně je potřeba je znovu publikovat ve Firebase konzoli.

Správce (přehled uživatelů, ikona vedle nastavení) = účet, který má dokument `admins/{uid}` založený ručně ve Firebase konzoli. Pravidla mu dovolí číst jen `users/{uid}`, `workouts` a `cx` ostatních – fotky, poznámky a tělesnou váhu ne.

Offline režim: `projects/posilovna-sw.js` (scope `./posilovna`, jiné stránky v `projects/` neovlivní). Stránka jde přes síť s 3,5s limitem a pak z mezipaměti, takže změny v `posilovna.html` se projeví bez zásahu do SW. Při přidání/změně ikon, manifestů nebo knihoven z CDN uprav seznam v SW a zvyš `VERSION`. Manifesty a ikony (180/192/512) pro každou barevnou variantu jsou v `projects/posilovna-icons/`.

Hlášení (zatřesení telefonem / Nastavení → Zpětná vazba) se ukládají do `reports/{id}` (text, náhledy) a `reportPhotos/{id}_{i}` (plné fotky); číst je smí jen správce (Přehled → Hlášení). Hlášení zůstávají jen v aplikaci, nikam se neposílají (žádný e-mail ani jiná služba).

## Daily (`projects/daily.html`)

Osobní deník dne (voda, spánek, škály, návyky, priority) + auto (tankování, tachometr, výdaje, připomínky). Data jsou místně v `localStorage` (`daily:v1`); synchronizace je volitelná a používá účet z Posilovny (stejný Firebase projekt, `users/{uid}/daily/{koš}`) – stávající pravidla Firestore to pokrývají, správce tahle data nečte.

Koše: `cfg` (metriky `m:…`, auta `car:…`, připomínky `rem:…`), `car` (záznamy aut) a `RRRR-MM` (dny). Dokument má pole `r = { id: záznam }`; každý záznam nese `u` (čas změny, vyhrává novější) a smazání je `{ x: 1 }`. Výchozí metriky jsou v konstantě `DEF`, uživatelské úpravy je jen překrývají.

Offline režim: `projects/daily-sw.js` (scope `./daily`), ikony a manifest v `projects/daily-icons/`. Při změně seznamu souborů nebo knihoven zvyš `VERSION`. Ukázková data (`demoDB`) žijí jen v paměti, nikdy se neukládají ani neodesílají.
