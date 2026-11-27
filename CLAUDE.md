# vladaweb

Osobní rozcestník projektů na GitHub Pages, běží na vlastní doméně `vladacech.cz` (soubor `CNAME`; DNS je u Wedosu – záznamy A na GitHub Pages a `www` jako CNAME na `vladaczech.github.io`). Stará adresa `vladaczech.github.io/vladaweb` na doménu přesměruje. Odkazy v repu drž relativní. `index.html` je hlavní stránka (krátký popis webu + dlaždice sekcí), `aplikace.html` je deck za heslem, `deck-data.json` jeho data, `projects/` jednotlivé stránky.

## Hlavní stránka a zámek sekce Aplikace

Dlaždice „Aplikace“ na `index.html` se ptá na heslo; po správném zadání uloží otisk do `localStorage` (nebo `sessionStorage`, když se nemá pamatovat) pod klíčem `vw:apps` a pustí na `aplikace.html`. Ta má hned na začátku `<head>` zámek, který bez otisku vrátí na `./#aplikace` (hlavní stránka pak rovnou otevře okno s heslem).

- Heslo v repu není čitelně, jen jeho otisk (PBKDF2-SHA256, sůl `vladacech.cz:aplikace:v1`, 310000 kol) – konstanta `APPS_HASH` v `index.html` a `H` v zámku v `aplikace.html`. Heslo nikdy nepiš do kódu, commitů ani sem. Při změně hesla přepiš obě konstanty:
  `python3 -c "import hashlib,getpass;print(hashlib.pbkdf2_hmac('sha256',getpass.getpass().encode(),b'vladacech.cz:aplikace:v1',310000).hex())"`
- Je to jen zámek proti náhodným návštěvníkům: repo je veřejné a stránky v `projects/` se dají otevřít přímým odkazem. Záměrně – Posilovnu používají i další lidé a aplikace přidané na plochu telefonu mají vlastní úložiště, takže zámek na jednotlivých projektech by je rozbil. Citlivá data chrání přihlášení (Firebase), ne tenhle zámek.
- Další sekce = další `<a class="tile">` v `.tiles` na `index.html`.
- Odkazy „zpět na rozcestník“ v projektech vedou na `../aplikace.html`.

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

Motivace (ikona blesku při tréninku a v pauze): fotky sportovců jsou z Wikimedia Commons jen s volnou licencí (public domain / CC) a u každé je uvedený autor, licence a odkaz – konstanta `MOT_PEOPLE`. Nové fotky přidávej jen se stejným ověřením licence; motivační texty (`MOT_TEXTS`) jsou vlastní, nepřisuzuj je skutečným lidem.

Hlášení (zatřesení telefonem / Nastavení → Zpětná vazba) se ukládají do `reports/{id}` (text, náhledy) a `reportPhotos/{id}_{i}` (plné fotky); číst je smí jen správce (Přehled → Hlášení). Hlášení zůstávají jen v aplikaci, nikam se neposílají (žádný e-mail ani jiná služba).

## Daily (`projects/daily.html`)

Osobní deník dne (voda, škály, návyky, priority, poznámka; spánek ani váha tu nejsou – váha se zadává v Posilovně) + auto (tankování, tachometr, výdaje, připomínky). Data jsou místně v `localStorage` (`daily:v1`); synchronizace je volitelná a používá účet z Posilovny (stejný Firebase projekt, `users/{uid}/daily/{koš}`) – stávající pravidla Firestore to pokrývají, správce tahle data nečte.

Koše: `cfg` (metriky `m:…`, auta `car:…`, připomínky `rem:…`), `car` (záznamy aut) a `RRRR-MM` (dny). Dokument má pole `r = { id: záznam }`; každý záznam nese `u` (čas změny, vyhrává novější) a smazání je `{ x: 1 }`. Výchozí metriky jsou v konstantě `DEF`, uživatelské úpravy je jen překrývají.

Offline režim: `projects/daily-sw.js` (scope `./daily`), ikony a manifest v `projects/daily-icons/`. Při změně seznamu souborů nebo knihoven zvyš `VERSION`. Ukázková data (`demoDB`) žijí jen v paměti, nikdy se neukládají ani neodesílají.

## Engram (`projects/engram.html`)

Kartičky s opakováním (FSRS). Karty, balíčky i průběh učení jsou jen v zařízení (IndexedDB `engram`, záloha do .json), synchronizace mezi zařízeními není.

**Knihovna balíčků** (`openLibrary`, tlačítko na hlavní stránce i v Nastavení → Data): obsah karet leží v repu v `projects/engram-decks/` – `index.json` (seznam: `id`, `file`, `name`, `group`, `desc`, `color`, `count`, `updated`) a jeden soubor na balíček (`{id, name, group, desc, color, updated, cards: [{id, t: basic|reverse|cloze, f, b, x, g: [štítky]}]}`, formátování jako v editoru: `**tučně**`, `==zvýraznění==`, řádky `- `, mezery `{{c1::…}}`). Čte se z raw.githubusercontent.com (hned po pushi na `main`), záložně z Pages.
- Přidaný balíček má `d.lib`, jeho poznámky `n.lib` (id karty) a `n.libH` (otisk obsahu). `libApply` při synchronizaci přidá nové karty, přepíše ty změněné v knihovně (stav učení zůstává), smaže odebrané z knihovny; kartu, kterou si uživatel smazal sám, znovu nepřidá.
- Při spuštění se odebírané balíčky doplní samy, ale jen když se změnilo `updated` v `index.json` – **při každé úpravě balíčku ho zvyš** (a přepočítej `count`).
- `id` karet se nesmí měnit (jinak se karta smaže a vznikne nová bez historie). Nová karta = nové unikátní `id` (`<balíček>-<8 hex>`).
- Kartičky z prezentací: jen látka (ne informace o předmětu), česky, jedna věc na kartu, do `x` číslo slidu. Repo je veřejné – žádné osobní údaje ani kontakty z prezentací. Pracovní soubory patří do `karticky/` (v `.gitignore`).

## Zpěvník (`projects/zpevnik.html`)

Kytarový zpěvník: sekce podle autorů, hledání, složky, poznámka k písni, transpozice (české značení, B = hes, H = h) a velikost písma.

Písně jsou dvojího druhu:
- `LIB` – hotové písně s textem a akordy přímo v kódu. **Jen volná díla** (lidové písně, koledy); akordy jsou základní harmonizace.
- `CAT` – katalog jen s názvy a autory. Texty chráněných písní do repa ani do žádné databáze nepřidávej a nestahuj je hromadně z webů (repo je veřejné, weby to zakazují) – uživatel si je doplňuje sám.

Import (pořadí podle přesnosti):
1. **Zkopírovaná stránka** (`htmlToSong`) – ze schránky se čte HTML, ne prostý text. Weby vkládají akordy jako prvky nulové šířky nad řádek (akordy.kytary.cz `.scs-chord`, kytaristka.cz `span.chord`), takže v prostém textu splývají se slovy; z HTML se převezmou přesně. Funguje i na celou zkopírovanou stránku (vybere se blok s akordy).
   Totéž dělá **tlačítko do záložek** (`bmHref`, Nastavení → Import z webu): na stránce s písní otevře zpěvník v novém okně (`#import`), pošle mu kód stránky přes `postMessage` a `importPage` píseň uloží – píseň z katalogu doplní jen při shodě názvu i autora, existující text nepřepisuje. Zprávy se berou jen od okna, které zpěvník otevřelo. Skript v záložce je záměrně hloupý (jen pošle stránku), veškerý převod je v aplikaci, takže se při úpravách nemusí přeinstalovávat.
2. **Z fotky** (`readPhoto`, Tesseract.js z CDN, čte se v prohlížeči) – obraz se rozdělí na vrstvu akordů (barevné písmo) a textu; text čte český model, vyříznuté akordy anglický (křížky, lomítka); akord se vloží před znak, nad kterým začíná. Bez barevného odlišení se hledají řádky složené jen z akordů.
3. Ručně – akordy v hranatých závorkách (`[Ami]`), nebo na řádku nad textem; obojí zvládá `parseSong`.

Když import (kterýkoli z prvních dvou i tlačítko do záložek) najde zmínku o kapodastru – „Capo 2“, „kapodastr na 3. pražci“, „Kapo: III“, i mimo blok písně v liště stránky – `capoOf` vrátí pražec a do poznámky písně se doplní řádek „Kapodastr: N. pražec“ (`withCapo`; poznámka, která kapodastr už zmiňuje, se nemění).

Odkazy „Najít na webu“ (akordy.kytary.cz, pisnicky-akordy.cz, kytaristka.cz) jsou až pod písní; weby nemají veřejné API ani CORS.

**Posun podle poslechu** (ikona mikrofonu u písně, objekt `FOL`): mikrofon → spektrum (Web Audio `AnalyserNode`, vše v zařízení, nic se neodesílá) → síla dvanácti tónů (`chromaOf`) → porovnání s akordem, který je na řadě, a třemi dalšími (`folTick`); když zní další, posune se ukazatel a text. Posun tóniny (kapodastr) a ladění se odhadují samy. `followPlan` staví posloupnost akordů z textu: sloky bez akordů přebírají akordy z předchozí sloky stejného druhu, samotné „R:“ znamená celý refrén, řádky bez akordů jdou naučeným tempem, v tichu se čeká. Klepnutí na řádek ukazatel přesune. `folProcess(db, sr, rms, dt)` jde volat i bez mikrofonu s umělým spektrem (`followStart(id, true)`) – tak se to testuje.

**Ladička** (`#ladicka`, ikona ladičky na hlavní stránce Zpěvníku, u písně v nabídce ⋯ → Naladit kytaru; objekt `TUN`): mikrofon → časový průběh (`AnalyserNode`, vše v zařízení) → výška tónu metodou YIN (`pitchOf`) → medián posledních odhadů → nejbližší struna zvoleného ladění (`TUNINGS`, volba v `UI.tun`), nebo struna zamčená klepnutím → odchylka v centech. Na plátně se kreslí „signál“ odchylky (pod/nad, nejnovější nahoře); když vydrží v ±`TOK` ¢ po dobu `THOLD` ms, struna se potvrdí zelenou ikonou. Mikrofon se vypne při odchodu ze stránky i při skrytí okna. `tunProcess(buf, sr, dt)` jde volat bez mikrofonu (`tunerStart(true)`), nebo `tunerStart(stream)` s oscilátorem – tak se to testuje.

Data jsou v `localStorage` (`zpevnik:v1`), synchronizace je volitelná přes účet z Posilovny (`users/{uid}/zpevnik/{koš}`, stejný vzor jako Daily – pole `r`, `u` = čas změny, smazání `{ x: 1 }`). Koše: `cfg` (složky `f:…`) a `s0`–`sf` (písně podle otisku id). Vestavěné písně (`BASE` = `CAT` + `LIB`) mají id `k:autor--nazev`, vlastní `u:…`; záznam uživatele vestavěnou píseň překrývá a `{ x: 1 }` u ní znamená „skrytá“.

Offline režim: `projects/zpevnik-sw.js` (scope `./zpevnik`), ikony a manifest v `projects/zpevnik-icons/`. Při změně seznamu souborů nebo knihoven zvyš `VERSION`.
