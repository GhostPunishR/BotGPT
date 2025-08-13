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

## Tableau de configuration

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

## Conditions d'utilisation

Merci d'utiliser ce projet avec respect et responsabilité. En utilisant ce code, vous acceptez les conditions suivantes :

- Vous ne devez pas utiliser ce logiciel pour créer, distribuer ou faciliter des contenus illégaux, offensants, ou nuisibles.
- Vous devez respecter les conditions d’utilisation des API tierces utilisées, notamment OpenAI.
- Vous utilisez ce logiciel à vos propres risques. L’auteur ne peut être tenu responsable des dommages directs ou indirects liés à son utilisation.
- Toute contribution ou modification doit respecter la licence Apache 2.0 associée à ce projet.
- En cas de doute, contactez l’auteur avant toute utilisation à des fins commerciales ou sensibles.

Merci de votre compréhension et bonne utilisation !

---

## Licence
Ce projet est sous licence **Apache License 2.0**.  
Voir le fichier [LICENSE](https://github.com/GhostPunishR/BotGPT/blob/main/LICENSE) pour plus de détails.

---

## Soutenir le projet
[![Faire un don via PayPal](https://img.shields.io/badge/PayPal-Faire_un_don-00457C?style=for-the-badge&logo=paypal)](https://www.paypal.me/MrUrbain)
