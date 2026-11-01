# Kanban PFE

Application web pour suivre mes candidatures de stage PFE sous forme de tableau kanban.

**[Voir la démo en ligne](https://takwakebaier2010-stack.github.io/kanban-pfe/?demo)** (données fictives)

![Tableau kanban](screenshots/tableau.png)

## Pourquoi ce projet

Pendant ma recherche de stage PFE, je candidate à plusieurs entreprises en même temps. J'ai créé cet outil pour voir en un coup d'œil où en est chaque candidature et savoir quand relancer. Je l'utilise réellement.

## Fonctionnalités

- 6 colonnes : à envoyer, envoyée, relancée, entretien, acceptée, refusée
- Glisser-déposer des cartes d'une colonne à l'autre
- Une carte contient : entreprise, poste, date de dernière action, lien de l'offre, notes
- Badge « il y a X jours » qui passe en orange après 7 jours, pour penser à relancer
- Bande de couleur par colonne
- Ajout, modification et suppression d'une candidature
- Compteur de cartes par colonne
- Sauvegarde automatique dans le navigateur (localStorage)
- Export et import d'une sauvegarde au format JSON
- Mode démo avec des données fictives (`?demo`)

![Formulaire d'ajout](screenshots/formulaire.png)

## Technologies

- HTML5 (dont l'élément `<dialog>`)
- CSS3 (flexbox)
- JavaScript, sans bibliothèque ni framework

## Lancer le projet en local

1. Télécharger ou cloner le dépôt :
   ```bash
   git clone https://github.com/takwakebaier2010-stack/kanban-pfe.git
   ```
2. Ouvrir le fichier `index.html` dans un navigateur.

Aucune installation n'est nécessaire.

## Structure du projet

```
kanban-pfe/
├── index.html      structure de la page et formulaire
├── style.css       apparence
├── script.js       logique : cartes, déplacement, sauvegarde
└── screenshots/    captures d'écran pour ce README
```

## À propos des données

Les candidatures sont enregistrées **uniquement dans le navigateur** de la personne qui utilise l'application. Rien n'est envoyé à un serveur. Vider les données du navigateur efface les candidatures : le bouton **Exporter** permet de faire une sauvegarde.

## Améliorations prévues

- [ ] Version avec PHP et MySQL pour stocker les données sur un serveur
- [ ] Recherche et filtres
- [ ] Rappels de relance

## Auteure

Takwa Kebaier, étudiante en 3e année de Licence Business Information Systems, ISG Tunis.
[www.linkedin.com/in/takwa-kebaier]