# vladaweb

Osobní rozcestník projektů na GitHub Pages. `index.html` je deck, `deck-data.json` jeho data, `projects/` jednotlivé stránky.

## Deck se upravuje ze dvou míst

`deck-data.json` mění jak Claude (commity z tohoto repa), tak web samotný (při úpravě decku v prohlížeči commituje přes GitHub API zprávou „Sync deck (web)“). Proto:

- Před každou úpravou `deck-data.json` nebo přidáním projektu spusť `git pull --rebase`, ať se nepřepíšou úpravy z webu.
- `deck-data.json` upravuj cíleně (načíst JSON, změnit, uložit kompaktně bez odřádkování na konci), nikdy ho nepřepisuj starší kopií.
- Po commitu pushni až po pullu; když push selže kvůli novějšímu commitu z webu, `git pull --rebase` a push znovu.
- Nový projekt = soubor v `projects/` + záznam v příslušném tématu v `deck-data.json` (`nazev`, `popis`, `odkaz: "./projects/…"`, `tagy: []`, `stav: "live"`).

Web při načtení čte deck přímo z GitHub API (Pages mají zpoždění), neodeslané úpravy z prohlížeče slučuje s tím, co mezitím přibylo na GitHubu.
