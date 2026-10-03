# Journal : performances du chemin NBD vers un dépôt en mode block

Branche : `perf/nbd-zero-copy` (non commitée)

Périmètre : backup incrémental (`IncrementalXapi`) via NBD vers un dépôt en mode block (VhdDirectory),
en clair (sans compression ni chiffrement au repos, hors périmètre).

## Diagnostic

Profil du client XO pendant une lecture NBD à environ 1,2 Go/s (Node 24, VM de 4 vCPU) :

- **37 GC majeurs par seconde** (238 mark-compact pour 8 Go lus), alors que le tas JS ne fait que 17 Mo.
  Ils sont déclenchés par la mémoire externe : chaque `Buffer` de 2 Mo, et chaque morceau de 64 Ko lu sur
  le socket, est un ArrayBuffer compté par V8.
  44 % des échantillons `perf` tombent dans les threads de GC de V8.
- **Deux copies de 2 Mo par bloc** :
  1. `readChunkStrict` concatène les morceaux reçus du socket dans un nouveau buffer (`fromList`) ;
  2. `DiskConsumerVhdDirectory` concatène le bitmap VHD de 512 octets et les données (`Buffer.concat`).
- **Le thread principal de Node est à 100 %.** C'est lui qui limite un processus de backup, et non le réseau
  ou le stockage.

## Changements

### 1. `@vates/nbd-client` : lecture des réponses sans concaténation

- `AbstractNbdClient.mjs`
  - Nouvelle classe interne `ReplyReceiver`, **une par connexion**. Elle parse les réponses au fil des
    morceaux reçus (événements `data`, ou `setReceiver` pour les transports qui le proposent) et copie la
    charge utile **une seule fois**, directement dans le buffer final de la requête.
    Elle remplace `#readBlockResponse` et `readChunkStrict(size)` pour la phase de transmission. Le
    handshake n'a pas changé.
  - Comme le receiver est propre à chaque connexion, des données tardives d'une ancienne connexion ne peuvent
    pas atteindre les requêtes de la suivante après une reconnexion.
  - Une réponse invalide (magic, code d'erreur, identifiant inconnu), une erreur ou une fermeture du
    transport rejettent toutes les requêtes en attente, comme avant. Le receiver arrête alors de parser,
    pour ne jamais écrire dans un buffer qui a été rendu.
  - Le timeout est maintenant un **timeout d'inactivité** : il échoue si aucun octet n'arrive pendant
    `messageTimeout` alors que des requêtes attendent. Avant, il portait sur chaque lecture. L'erreur reste
    une `TimeoutError` de promise-toolbox, donc la relance et la reconnexion fonctionnent comme avant.
  - `readBlock(index, size, target?)` : nouveau paramètre optionnel `target`, le buffer où écrire les
    données. La valeur renvoyée est alors une vue sur `target` (plus courte pour le dernier bloc d'un export
    non aligné).
- `NbdTcpClient.mjs` : **sans TLS**, le socket utilise `onread`, et le noyau écrit dans un buffer de 1 Mo
  réutilisé. Il n'y a plus aucune allocation par morceau reçu. Pendant le handshake, les données passent par
  une `PassThrough`, puis `setReceiver` les donne directement au parser.
  Pièges rencontrés :
  - `onread` doit être passé au **constructeur** de `Socket`, pas à `connect()` : il y est ignoré sans
    erreur.
  - `tls.connect` ignore aussi `onread` sans erreur. Avec TLS, on garde donc les événements `data`. La copie
    unique dans `target` s'applique quand même.
- `multi.mjs` : `readBlock(index, size, target)` transmet `target`, y compris lors d'une relance sur un
  autre client.
- Tests :
  - unitaires : lecture dans `target`, réponses découpées en morceaux arbitraires (1, 7, 16, 17,
    taille + 3 octets) et dans le désordre, timeout quand le serveur cesse de répondre ;
  - faux serveur : nouvelles options `chunkSize` et `stopAnsweringAfter` ;
  - intégration : variante sans TLS (chemin `onread`) qui lit dans des buffers `target` et redémarre
    nbdkit en cours de lecture.

### 2. `@xen-orchestra/disk-transform` : pool de buffers et libération optionnelle

- `BlockBufferPool.mts` (nouveau) : pool de buffers de `blockSize` octets.
  - Le pool ne bloque et n'échoue jamais : s'il est vide, il alloue un nouveau buffer.
  - Il garde au plus `maxFree` buffers libres ; les autres sont laissés au GC.
  - Une double libération est ignorée, pour ne jamais confier la même mémoire à deux utilisateurs.
- `Disk.mts` : `DiskBlock` gagne un champ optionnel, `release()`. Il rend la mémoire au pool une fois le
  bloc consommé. **Ne jamais l'appeler est toujours sûr** : la mémoire est alors ramassée par le GC.
- `Throttled.mts` : conserve `release`. Avant, chaque bloc était reconstruit en
  `{ index, data, length }`.
- `SynchronizedDisk.mts` : le même bloc est remis à tous les forks.
  - Un compteur, égal au nombre de forks, fait que la mémoire ne retourne au pool qu'une fois que **tous**
    les forks ont libéré le bloc.
  - Un double `release()` venant du même fork n'est compté qu'une fois.
  - Un fork qui s'arrête en cours de route laisse simplement les blocs suivants au GC.
- `DiskLargerBlock.mts` : libère le bloc source dès qu'il a été copié dans le bloc agrandi.
- Tests : pool (réutilisation, double libération, `maxFree`), conservation de `release`
  par `ThrottledDisk`, libération partagée par `SynchronizedDisk` (une seule libération après les deux
  forks, et aucune tant qu'un fork détient encore le bloc).

### 3. Sources NBD de XAPI et writer VHD block : écriture sans copie

- `@xen-orchestra/xapi/disks/utils.mjs` : un pool de buffers de 2 Mo partagé par le processus, et la
  fonction `readNbdBlock()`. Elle lit le bloc directement dans un buffer du pool et renvoie
  `{ index, data, release }`.
- `XapiStreamNbd.mjs` et `XapiVhdCbt.mjs` : `readBlock()` passe par `readNbdBlock()`.
- `@xen-orchestra/fs` : `outputFile()` accepte un tableau de buffers, le fichier est leur concaténation.
  - Le handler local (et donc NFS et SMB) l'écrit avec un seul `writev`, sans concaténer.
  - Les autres (S3, Azure) reçoivent un `Buffer.concat` : ils sont distants, plus lents, et on privilégie
    la fiabilité.
  - Avec chiffrement, chaque morceau passe par `cipher.update()`, sans copie supplémentaire.
- `vhd-lib` : `VhdDirectory.writeEntireBlock()` accepte un tableau (`buffer: [bitmap, data]`). Avec
  compression, les morceaux sont concaténés avant de compresser.
- `vhd-lib/disk-consumer/DiskConsumerVhdDirectory.mjs` : écrit `[FULL_BLOCK_BITMAP, data]`, sans
  `Buffer.concat`, puis appelle `release()` une fois le fichier de bloc écrit.
- Tests : blocs écrits et libérés une fois chacun. Pour vérifier qu'aucune lecture ne se produit après la
  libération, la mémoire est brouillée au moment du `release()`. Écriture avec compression.

  Une première version mettait le bitmap en préfixe dans les buffers du pool, pour écrire bitmap et données
  d'un seul tenant. Elle a été retirée : mesurée sur la vraie stack, `writev` est aussi rapide (tmpfs,
  2 Go : 6080 Mo/s contre 5735 avec le préfixe, et 2799 avec `Buffer.concat`) pour beaucoup moins de
  code.

### Résultat des tests

| Suite | Résultat |
|---|---|
| `@vates/nbd-client`, unitaires | 27 sur 27 |
| `@vates/nbd-client`, intégration TCP (nbdkit, TLS et clair, redémarrages du serveur) | 33 sur 33 |
| `@vates/nbd-client`, intégration stdio | 41 sur 41 |
| `@xen-orchestra/disk-transform` | 43 sur 43 |
| `@xen-orchestra/xapi` | 7 sur 7 |
| `vhd-lib`, `disk-consumer` | 10 sur 10 |
| `@xen-orchestra/backups` | 103 sur 103 |

## Mesures

Environnement de test :

- **Hôte :** XCP-ng 8.3, i5-12600H, SR ext sur NVMe WD SN850X.
- **XO :** VM de 4 vCPU sur le même hôte, avec une route 10G vers le dom0.
- **Serveur NBD :** nbdkit 1.8 dans le dom0, sur le device tapdisk du VDI (VHD), une connexion, 16 requêtes
  en vol.
- **Chaîne :** chaîne XO complète (`ReadAhead` → `ThrottledDisk` → `SynchronizedDisk` → writer
  VhdDirectory), avec un dépôt nul (`REMOTE=null`) qui garde tout le travail CPU de XO mais n'écrit pas
  les fichiers de blocs. On mesure ainsi la lecture sans le bruit du disque de la VM XO, lui-même sur le
  même NVMe.

Deux scénarios :

- **en cache :** relecture des 512 premiers Mo, qui restent dans le cache du dom0. On mesure alors le
  client XO seul ;
- **réel :** 8 Go lus sur le NVMe.

| Scénario | Code d'origine | Nouveau client NBD seul | Nouveau client + pool + écriture sans copie |
|---|---|---|---|
| Clair, en cache | 1 296 à 1 302 Mo/s, 190 % CPU, ~317 GC majeurs | 1 550 à 1 617 Mo/s, 155 à 171 % | **2 820 à 2 832 Mo/s, 78 à 85 %, 2 GC** |
| Clair, réel 8 Go | 1 128 à 1 244 Mo/s, 185 % | 1 212 à 1 231 Mo/s, 160 % | **1 352 à 1 359 Mo/s, 41 à 44 %, 2 GC** |
| TLS, en cache | 895 à 963 Mo/s, 165 %, ~350 GC | 1 017 à 1 028 Mo/s | **1 091 à 1 199 Mo/s**, ~210 GC |
| TLS, réel 8 Go | 847 à 933 Mo/s, 170 % | 892 à 917 Mo/s | **1 026 à 1 041 Mo/s** |

## Gains attendus en production

- **NBD en clair** (`insecure_nbd`, réseau de backup dédié) :
  - environ **×2,2 de débit pour un processus de backup** quand le serveur suit ;
  - surtout **environ 4 fois moins de CPU par Go transféré**.

  En lecture réelle, on n'est plus limité par XO mais par le serveur : environ 1,35 Go/s ici, ce qui
  correspond à la limite de tapdisk (1,5 Go/s par VDI). Le CPU libéré profite aux VMs et aux disques
  sauvegardés en parallèle, et aux jobs simultanés.
- **NBD en TLS :** **+15 à +20 % de débit**. Le déchiffrement TLS de Node, sur le thread principal, et ses
  allocations par enregistrement restent la limite.
- **Aujourd'hui, avec `xapi-nbd` :** le gain sera masqué tant que le serveur plafonne (395 Mo/s par
  connexion, environ 690 Mo/s par hôte, voir plus bas). Ce qui reste, c'est **le CPU économisé côté XO**.
- **Mémoire :** au plus 32 buffers libres retenus par processus (64 Mo). Les buffers en vol sont, eux,
  ceux qui étaient déjà alloués avant ce changement.
- **Configurations sans gain sur les blocs eux-mêmes** (comportement inchangé, aucune régression) :
  - les consommateurs qui ne libèrent pas les blocs : réplication (`IncrementalXapiWriter`), dépôts VHD
    en flux (non block), qcow2 ;
  - avec `SynchronizedDisk`, le cas 1 backup block + 1 réplication : la réplication ne libère pas, donc le
    compteur n'atteint jamais 0. Avec 2 backups block, le gain est entier.

  Dans tous ces cas, on garde le gain du client NBD : une copie unique, sans concaténation.

## Pistes suivantes (non implémentées)

1. **Libération dans les writers en flux** (réplication, VHD en flux, qcow2) : appeler `release()` une
   fois les octets du bloc écrits dans le stream. Ça étendrait le gain à 1 backup + 1 réplication.
2. **TLS hors du thread principal** : une connexion NBD par disque dans un `worker_thread`, avec des
   buffers du pool sur `SharedArrayBuffer` transférés sans copie. Ça permettrait de dépasser environ
   1,1 Go/s en TLS par processus.
3. **`SynchronizedDisk` fait avancer les forks en lockstep.** Le `ReadAhead` en amont masque la latence de
   la source, mais pas les écarts entre writers : un dépôt lent, ou un pic de latence d'une réplication,
   freine les autres bloc par bloc. Une file bornée par fork (quelques blocs) absorberait ces écarts. À
   mesurer avec 2 dépôts de latences différentes.
4. **Côté serveur** (mesuré sur britney, voir le diagnostic de la session) :
   - `xapi-nbd` plafonne à 395 Mo/s par connexion et environ 690 Mo/s par hôte : un seul thread Lwt, et un
     `write()` par enregistrement TLS de 16 Ko ;
   - il accepte au plus 16 connexions par hôte, et sa file `listen` ne fait que 5 places, ce qui provoque
     des blocages de 60 s en cas de rafale de connexions ;
   - nbdkit 1.8 fait 963 Mo/s en TLS et 1 272 Mo/s en clair sur une seule connexion, et traite en
     parallèle les requêtes en vol ;
   - kTLS fonctionne dans le dom0 (OpenSSL 3.0.9 et noyau 4.19, en TLS 1.2 avec AES-128-GCM uniquement),
     et monte à 1,15 Go/s avec `sendfile`.
5. **Côté XO :**
   - un budget de connexions NBD par hôte, plutôt que `nbdConcurrency` par disque, puisque disques et VMs
     sont traités en parallèle ;
   - un `ReadAhead` dimensionné sur le nombre de requêtes en vol, et non sur un pourcentage de blocs : les
     petits deltas CBT n'ont aujourd'hui qu'une seule requête en vol.

## Reproduire les mesures

Le banc de test est dans `@xen-orchestra/backups/_bench/` (non suivi par git) :

- `bench.mjs` : chaîne XO complète. Variables d'environnement :
  - `MODE=read|full|write` ;
  - `NBD_HOST`, `NBD_PORT`, `TLS`, `NBD_CONC`, `READAHEAD` ;
  - `POOL=1` : lecture par `readNbdBlock` ;
  - `REMOTE=null` : dépôt nul ;
  - `SRC=mem` : source en mémoire (avec `MODE=write`) ;
  - `CYCLE_MB` : relecture d'une même plage ;
  - `COMP`, `ENC`.
- `nbdfast.mjs` et `nbdfast2.mjs` : prototypes de client minimal (`onread` et pool).
- `/data/bench/matrix.sh` : la matrice ci-dessus.

---

# Chaînes de disques, et chemins VHD et qcow2 côté hyperviseur

Banc de test sur britney (XCP-ng 8.3, xapi 26.1.16, blktap 3.55.5, SR ext sur NVMe) :

- **VDIs de test :** de 16 Go, avec 8 Go de données aléatoires, en VHD et en qcow2.
- **Chaînes :** à chaque niveau, un snapshot suivi de la réécriture de 10 % des blocs de 2 Mo. Mesures aux
  profondeurs 0, 1, 3 et 10.
- **Lecture côté XO :** chaîne complète avec le pool, vers le dépôt nul, sur 8 Go.

Scripts : `/root/xo-bench/chain.sh` sur l'hôte, `/data/bench/chainmeasure.sh` et `/data/bench/tapnbd.sh`
côté XO.

## Mesures (Mo/s)

| Chemin | VHD d0 | VHD d1 | VHD d3 | VHD d10 | qcow2 d0 | qcow2 d1 | qcow2 d3 | qcow2 d10 |
|---|---|---|---|---|---|---|---|---|
| Device dom0, `dd` 2 Mo O_DIRECT, 1 lecture | 1 316 | 918 | 853 | 813 | 980 | 962 | 946 | 913 |
| Device dom0, 4 lectures | 1 507 | 883 | 827 | 801 | 1 113 | 1 050 | 1 024 | 996 |
| CPU de tapdisk | 88-99 % | 73 % | 71 % | 67 % | 127-148 % | 219-235 % | 220-230 % | 214-226 % |
| `xapi-nbd` TLS, 1 connexion | 585 | 465 | 445 | 414 | 537 | 409 | 402 | 396 |
| `xapi-nbd` TLS, 4 connexions | 959 | 579 | 576 | 558 | 802 | 667 | 660 | 636 |
| nbdkit en clair sur le device, 1 connexion | 1 321 | 654 | 643 | 614 | 1 046 | 846 | 852 | 816 |
| `export_raw_vdi` (flux complet) | 573 | 472 | 467 | 442 | 666 | 632 | 613 | 604 |
| **Serveur NBD de tapdisk**, 1 connexion, en clair, via `socat -b 1M` | **3 159** | | | **1 230** | **2 878** | | | **1 651** (1 809 avec 4 connexions) |

Le délai jusqu'au premier octet de `export_raw_vdi` est inférieur à 15 ms dans tous les cas : 8 Go et
10 niveaux, c'est trop petit pour que `qemu-img map` pèse. Il faut le remesurer sur de gros disques très
alloués.

## Différences entre VHD et qcow2 côté hyperviseur

1. **Driver tapdisk.**
   - VHD : `drivers/block-vhd.c`, natif tapdisk. Chaque niveau de la chaîne est une image tapdisk séparée.
     Chaque lecture consulte la BAT et le bitmap de secteurs du bloc dans la couche courante, et passe à
     la couche suivante si le bloc n'y est pas (`td_forward_request`). Le cache ne garde que 32 bitmaps
     par image (`VHD_CACHE_SIZE`), et un bitmap absent du cache doit être lu sur disque, sous verrou,
     avant les données. L'I/O se fait par libaio en O_DIRECT, dans une boucle d'événements à un seul
     thread.
   - qcow2 : `drivers/block-qcow2.c` (branche `v3.55.5-qcow2`, livré dans `libqcow2.so`). Il **embarque
     la couche bloc de QEMU** (`blk_aio_preadv`, coroutines, contexte AIO, 3 threads), avec `cache=none`,
     `aio=native` et `l2-cache-size=256M`. C'est le code qcow2 de QEMU qui résout la chaîne de backing.
   - Conséquence : le VHD perd 30 % dès le premier niveau puis environ 38 % à 10 niveaux, et lire en
     parallèle ne sert plus à rien, avec moins d'un cœur. Le qcow2 ne perd que 2 à 7 % à 10 niveaux, mais
     tapdisk consomme 2,2 cœurs. Sur disque plat, le VHD est plus rapide (1 316 contre 980 Mo/s).
2. **Chemin du device dom0**, commun aux deux formats, utilisé par `xapi-nbd` et par les exports XAPI. La
   lecture passe par la file blktap : 32 requêtes × 11 segments de 4 Ko, soit environ 1,4 Mo en vol. Même
   sur disque plat, on plafonne vers 1,3 à 1,5 Go/s. Avec une chaîne VHD, chaque requête est plus lente à
   cause des renvois de couche en couche, et comme la file est pleine, le débit baisse d'autant.
3. **Export stream (`export_raw_vdi`).**
   - VHD : `vhd-tool`, en OCaml.
   - qcow2 : `qemu-img map --output=json` et `qemu-img info` sur toute la chaîne (et sur la base pour un
     delta), puis `qcow2-to-stdout.py` en Python, qui lit le device et produit le flux.
   - Mesuré : le qcow2 est un peu plus rapide (604 à 666 contre 442 à 573 Mo/s).
4. **Serveur NBD intégré à tapdisk (`drivers/tapdisk-nbdserver.c`).**
   - Chaque tapdisk l'expose sur `/var/run/blktap-control/nbd<pid>.<minor>`. Le socket
     `nbdserver-new<pid>.<minor>` sert, lui, à recevoir un descripteur client par fd-passing.
   - Il ne passe ni par la file blktap, ni par le device, ni par `xapi-nbd`. Il crée une requête interne
     pour toute la lecture demandée (jusqu'à 64 Mo), répond de façon asynchrone et gère les réponses
     structurées ainsi que **`NBD_CMD_BLOCK_STATUS`** (`base:allocation`). Il ne gère pas TLS.
   - Résultat : **5,4 fois `xapi-nbd`** sur disque plat (3,2 Go/s en VHD, 2,9 Go/s en qcow2) et 3 à 4,5
     fois à 10 niveaux.

## Bug trouvé dans le serveur NBD de tapdisk

Symptôme :

- un tapdisk part dans une boucle infinie `scheduler_wait_for_events: select failed: Bad file descriptor`
  (plus de 2 300 lignes de log, une CPU occupée) ;
- son socket de contrôle ne répond plus, donc `tap-ctl list` bloque, ainsi que **toutes les opérations VBD
  du dom0** (un `VBD.unplug` est resté plus de 20 minutes en attente).

Il a fallu tuer ce tapdisk. Ses descripteurs ouverts et ses logs sont conservés dans
`/root/xo-bench/tapdisk-spin-1618556/` sur britney.

Déclencheur observé : plusieurs connexions se sont ouvertes et refermées en rafale, puis un client a fermé
sa connexion avant d'envoyer ses flags (`Zero return from recv`, puis `Could not receive client flags`).

Causes dans `tapdisk-nbdserver.c` (branche `3.55.5-8.3`) :

- **`server->handshake_fd` est un champ unique pour tout le serveur.**
  `tapdisk_nbdserver_new_protocol_handshake()` l'écrase à chaque nouveau client, et
  `tapdisk_nbdserver_handshake_cb()` lit puis **ferme** `server->handshake_fd`, et non le descripteur de son
  propre client. Si deux handshakes se chevauchent, l'erreur de l'un ferme le descripteur de l'autre, dont
  l'événement reste enregistré dans `select()`, d'où l'EBADF en boucle.
- **Chemin d'erreur de `receive_newstyle_options()`** : le descripteur est fermé, puis la fonction continue
  et active quand même le client (`tapdisk_nbdserver_enable_client`) sur ce descripteur fermé. Il manque
  un `goto out`, et la libération du client.

## Ce que ça implique

1. **Le levier principal côté hyperviseur est de remplacer le chemin VBD et device de `xapi-nbd` par le
   serveur NBD de tapdisk.**
   - Pour `insecure_nbd`, `xapi-nbd` n'aurait plus qu'à authentifier, puis à transmettre la connexion au
     tapdisk du VDI par fd-passing via `nbdserver-new`. Il ne serait plus du tout sur le chemin des
     données.
   - Pour TLS, il terminerait TLS et relaierait vers le socket Unix, avec de gros buffers et du kTLS si
     possible.
   - On gagnerait aussi **`BLOCK_STATUS`** : XO n'aurait plus besoin de l'export stream pour obtenir la
     liste des blocs d'un backup complet, et pourrait sauter les zones non allouées de toute la chaîne.
   - **Prérequis : corriger le bug de handshake ci-dessus.**
2. **Chaînes VHD** : agrandir `VHD_CACHE_SIZE` (32 bitmaps par image), et préférer qcow2, ou coalescer,
   pour les chaînes longues.
3. **Côté XO, avec un serveur NBD de tapdisk exposé** : une seule connexion par disque suffit (le serveur
   traite les requêtes en vol), et on peut demander des blocs plus gros que 2 Mo (jusqu'à 64 Mo).

---

# Intégration du plugin `xo-nbd` dans XO

Le plugin et le démon sont décrits dans `/data/xapi-nbd-rs/JOURNAL.md`. Côté XO, une seule fonction change :
`connectNbdClientIfPossible()`, dans `@xen-orchestra/xapi/disks/utils.mjs`. Elle est utilisée par
`XapiStreamNbdSource` (backups complets) et `XapiVhdCbtSource` (deltas CBT).

## Logique

1. **Désactivation :** si le pool porte `other_config['xo:nbdPlugin'] = 'false'`, le plugin n'est pas
   essayé.
2. **Détection :** `host.call_plugin(master, 'xo-nbd', 'get_nbd_infos', { vdi_uuid })`. Une erreur
   `XENAPI_MISSING_PLUGIN` est mémorisée pour ce pool pendant 10 minutes, et on passe directement à
   `xapi-nbd` sans redemander.
3. **Choix du candidat :** on garde les candidats qui ont au moins une adresse sur le réseau de backup
   (`xo:backupNetwork`) s'il est défini, avec le même filtre que pour `xapi-nbd`, désormais en commun. Ils
   sont ensuite essayés dans un ordre aléatoire, pour répartir les exports d'une SR partagée.
4. **Pour chaque candidat :**
   - `open` sur son hôte ;
   - `MultiNbdClient` sur ses adresses, avec le jeton comme nom d'export, le certificat seulement si
     `tls` est vrai (sinon le chemin `onread`, sans allocation), et un délai de connexion de 10 s au lieu
     de 60 ;
   - si `open` ou la connexion échoue, l'export est refermé (`close`) et on passe au candidat suivant.
5. **Repli :** si aucun candidat n'a fonctionné, ou si le plugin a levé une erreur inattendue, on utilise
   le chemin actuel, `VDI.get_nbd_info` et `xapi-nbd`.
6. **Fin de vie :** `PluginNbdClient` hérite de `MultiNbdClient`, et son `disconnect()` appelle `close` une
   seule fois, ce qui débranche le VBD. C'est le `close()` des sources qui déclenche ce `disconnect()`. Si
   XO plante, l'export expire dans le démon, puis le VBD est débranché par le timer de nettoyage ou le
   prochain `open`.

## Tests sur britney

Lecture complète d'un VDI de 8 Go par `XapiDiskSource` en NBD, avec un `Xapi` réel. Script :
`@xen-orchestra/backups/_bench/xapidisk.mjs`.

| Scénario | Chemin utilisé | Débit | Exports ou VBD restants |
|---|---|---|---|
| A. Plugin installé | plugin (1 export pendant le transfert), TLS | 969 à 1 053 Mo/s | aucun |
| B. Plugin absent (renommé) | `XENAPI_MISSING_PLUGIN`, puis `xapi-nbd` | 611 Mo/s | aucun |
| C1. Port 10810 bloqué vers `.5` | plugin, via la seconde adresse du candidat (`.6`) | 1 135 Mo/s | aucun |
| C2. Port 10810 bloqué vers toutes les adresses | plugin `open`, connexion refusée, `close`, puis `xapi-nbd` | 628 Mo/s | aucun : export retiré dans la même seconde |

Tests de non-régression : `@xen-orchestra/xapi` 7 sur 7, `@xen-orchestra/backups` 103 sur 103. ESLint et
Prettier passent.

## Limites et suites

- **Pas de test unitaire de la logique de repli.** `MultiNbdClient` est importé directement : il faudrait
  injecter la dépendance, ou utiliser `mock.module`, que le script de test de `@xen-orchestra/xapi`
  n'active pas.
- **Un paquet perdu au lieu d'un refus** coûte jusqu'à 10 s par adresse avant le repli. La connexion
  refusée a été testée, la perte de paquets non.
- **La connexion se fait encore au moment de `init()`.** Avec un backup de plusieurs disques, chaque disque
  appelle `open` et `close` séparément : environ 0,7 s chacun, dont l'essentiel est le `VBD.plug`.
