# IPsy — Contexte projet pour Claude Code

IPsy : plateforme web haïtienne de soutien émotionnel par IA, bilingue français / kreyòl ayisyen.
Devise : **Écouter. Comprendre. Soutenir.** — MVP pour l'Ayiti AI Hackathon 2026, **3 heures max**.
Équipe : IMPACTIS Group. Sous-domaine envisagé : `ipsy.impactisgroup.org`.

## Stack (ne pas changer sans raison forte)
- Next.js (App Router) + React + TypeScript + Tailwind CSS
- Route Handler `app/api/chat/route.ts` pour l'IA (clé côté serveur uniquement, via `process.env`)
- Aucune base de données pour le MVP ; `localStorage` seulement pour données de démo non sensibles (journal, humeurs)
- Déploiement : Vercel Hobby (gratuit) + GitHub `IMPACTIS/Ipsy`
- Budget : zéro. Vérifier les conditions réelles d'un free tier avant de l'utiliser.

## Priorités
- **P0** : accueil, sélecteur FR/HT partout, chat IA réel, avatar à états, bouton « Besoin d'aide maintenant ? » sur toutes les pages, notice limites/confidentialité, parcours de crise simulé.
- **P1** : pensée du jour, journal (CRUD local), Mon évolution (données fictives signalées), exercices respiration/ancrage.
- **P2 (interdit maintenant)** : auth, mémoire inter-sessions, avatar 3D, lip-sync, appels d'urgence réels, microservices.
- Règle : 5 fonctionnalités parfaites > 15 inachevées. Si retard → couper P1.

## Avatar officiel (`public/avatar/`)
`repos.png`, `ecoute.png`, `reflexion.png`, `parole.png`, `soutien.png`, `alerte.png`, `face.png`, `logo-cerveau.png`, `avatar-officiel.jpg` (planche complète).
Mapping chat : saisie en cours → ecoute ; requête envoyée → reflexion ; streaming → parole ; réponse empathique terminée → soutien ; niveau rouge → alerte ; inactif → repos ; erreur API → alerte + message clair.
Ne jamais remplacer l'avatar par un robot générique ou un emoji. Animations CSS légères uniquement.

## Identité visuelle
Bleu nuit `#0B1B3A`, turquoise `#22D3EE`/`#14B8C4`, blanc, bleu clair `#E6F6FB`. Dégradés subtils, motif réseau neuronal discret.
Mode clair par défaut, sombre optionnel. Mobile-first, sobre, premium, accessible (contraste, gros boutons). Navigation : Accueil, Discuter, Journal, Évolution, Profil.

## Sécurité IA (non négociable)
- Jamais de diagnostic, de prescription, de promesse de guérison ; ne prétend pas être psychologue/médecin.
- Répond dans la langue du message (FR, HT, ou mélange). Questions ouvertes. Ne pas faire raconter les détails d'un traumatisme.
- Niveaux vert / orange / rouge = indicateurs de prudence, pas diagnostics. En doute → poser une question directe et proposer une aide humaine. Ne jamais conclure seul que la personne est en sécurité.
- Rouge → écran prioritaire (lieu sûr, personne de confiance, ressources vérifiées).
- **Ne jamais inventer de numéro d'urgence ni de ressource.** Si non vérifié : message transparent. Toute ressource affichée porte sa date de vérification.
- Simulation de crise marquée : « Simulation — aucun appel réel n'est effectué ». Jamais « secours contactés ».
- Jamais de réponses préprogrammées présentées comme générées par l'IA. Si l'API tombe : message d'erreur honnête.
- Ne pas logger le contenu des conversations. Ne pas envoyer le journal à l'IA.

## État actuel (MVP livré)
Toutes les P0 et P1 sont implémentées (voir README, tableau « Fonctionnalités et limites »).
Fichiers clés : `app/api/chat/route.ts`, `lib/ai/{provider,system-prompt,safety}.ts`, `lib/i18n/dictionary.ts`, `app/discuter/ChatView.tsx`.
Variables : `AI_PROVIDER`, `GEMINI_API_KEY`, `GROQ_API_KEY` (+ `*_MODEL` optionnels). Next.js 16 avec `cacheComponents` : pas de `export const dynamic/runtime` ; lire `node_modules/next/dist/docs/` avant d'utiliser une API Next.

## Secrets
- `.env.local` jamais committé, jamais lu ni affiché par Claude. Utiliser `.env.example` pour documenter les noms de variables.

## Agents disponibles (`.claude/agents/`)
`ui-builder`, `ai-chat-engineer`, `kreyol-i18n`, `safety-reviewer`, `qa-tester`, `deploy-engineer`.
Après chaque fonctionnalité P0 : lancer `safety-reviewer` (si IA/crise touchées) puis `qa-tester`.

## Commandes
- `npm run dev` · `npm run build` · `npm run lint`
- `/verifier-demo` : checklist complète avant démonstration.
