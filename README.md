# Discord ChatGPT-like Bot

Bot Discord interactif utilisant l’API OpenAI (GPT-3.5-turbo ou supérieur) pour converser avec chaque utilisateur de manière personnalisée.  
Chaque utilisateur dispose de sa propre mémoire de conversation, sauvegardée localement dans un fichier JSON, pour offrir un dialogue naturel et continu.

---

## Fonctionnalités

- **Mémoire par utilisateur** : historique de conversation séparé pour chaque membre.
- **Mémoire persistante** : stockage dans `memory.json` pour garder le contexte.
- **Un seul salon dédié** : le bot répond uniquement dans le salon configuré.
- **Filtrage des commandes** : ignore les messages commençant par un préfixe (`!` par défaut).
- **Découpage automatique** des réponses longues en plusieurs messages.
- **Configuration simple** via `.env`.

---

## Installation

1. Installer les prérequis :
   - [Visual Studio Code](https://code.visualstudio.com/)
   - [Node.js](https://nodejs.org/fr)
2. Initialiser le projet :
   ```bash
   npm init -y
   npm install discord.js dotenv openai
   ```

---

## Configuration

- **Modèle OpenAI** : changer `model: 'gpt-3.5-turbo'` dans `index.js` si vous voulez utiliser un autre modèle.
- **Variables d’environnement** : dans `.env`, renseigner :
  ```
  DISCORD_TOKEN = Votre_Token_Discord
  OPENAI_API_KEY = Votre_Cle_API
  CHANNELD_ID = Votre_ID_Salon
  ```
- **Préfixe ignoré** : modifier `IGNORE_PREFIX` dans `index.js` si besoin.

---

### Tableau de configuration

| Paramètre                | Fichier        | Description |
|--------------------------|---------------|-------------|
| `model`                  | `index.js`    | Modèle OpenAI utilisé (`gpt-3.5-turbo`, `gpt-4`, etc.) |
| `DISCORD_TOKEN`          | `.env`        | Token de votre bot Discord |
| `OPENAI_API_KEY`         | `.env`        | Clé API OpenAI |
| `CHANNEL_ID`             | `.env`        | ID du salon Discord où le bot répondra uniquement |
| `IGNORE_PREFIX`          | `index.js`    | Préfixe des messages ignorés par le bot |
| `memory.json`            | `memory.json` | Stocke l’historique des conversations par utilisateur |

---

## Schéma du fonctionnement

```
     ┌────────────┐        lit           ┌──────────────┐
     │  .env      │────────────────────▶│ index.js     │
     │ (Clés API) │                     │ (Logique bot)│
     └────────────┘                      └──────┬──────┘
                                                 │
                                                 │ utilise
                                                 ▼
                                        ┌────────────────┐
                                        │ memory.json    │
                                        │ (Mémoire par   │
                                        │  utilisateur)  │
                                        └────────────────┘
```

- **`.env`** → Stocke les clés API et tokens.
- **`index.js`** → Fichier principal : reçoit les messages, appelle l’API OpenAI et gère la mémoire.
- **`memory.json`** → Sauvegarde l’historique des conversations par utilisateur.

---

## Licence
Ce projet est sous licence **Apache License 2.0**.  
Voir le fichier [LICENSE](https://github.com/GhostPunishR/BotGPT/blob/main/LICENSE) pour plus de détails.

---

## Soutenir le projet
[![Faire un don via PayPal](https://img.shields.io/badge/PayPal-Faire_un_don-00457C?style=for-the-badge&logo=paypal)](https://www.paypal.me/MrUrbain)
