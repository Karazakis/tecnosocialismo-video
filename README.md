# Tecnosocialismo Video

Prima versione funzionante della piattaforma video indipendente della suite Tecnosocialismo.

## Funzioni

- accesso tramite l'account unico della suite;
- caricamento diretto di MP4, WebM e MOV fino a 2 GB;
- generazione automatica del poster nel browser;
- catalogo pubblico, categorie e ricerca;
- pagine video con streaming, richieste parziali e avanzamento;
- reazioni, commenti e visualizzazioni;
- API pubblica del catalogo, pensata per il futuro social network;
- visibilità pubblica, non in elenco o privata.

La versione alfa conserva video e metadati nello storage a oggetti della suite. L'API separa il prodotto dal motore interno, così lo storage dei metadati e la transcodifica potranno evolvere senza modificare il futuro social.

## Sviluppo

```bash
pnpm install
pnpm dev
```

Variabili richieste:

```text
BLOB_READ_WRITE_TOKEN=
AUTH_ORIGIN=https://login.tecnosocialismo.com
```

`VIDEO_INTERFACE_PREVIEW=true` abilita esclusivamente in locale un'identità dimostrativa per il collaudo dell'interfaccia.
