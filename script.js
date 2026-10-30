const DEMO = new URLSearchParams(location.search).has("demo");
const CLE_STOCKAGE = DEMO ? "kanban-pfe-demo" : "kanban-pfe-candidatures";
const colonnes = ["a-envoyer", "envoyee", "relancee", "entretien", "acceptee", "refusee"];

const fenetre = document.getElementById("fenetre-ajout");
const formulaire = document.getElementById("formulaire");
const titreFormulaire = document.getElementById("titre-formulaire");

let candidatures = chargerCandidatures();
let idEnEdition = null;

/* ---------- Données ---------- */

function dateAujourdhui() {
  return new Date().toLocaleDateString("sv-SE");
}

function dateIlYA(nombreDeJours) {
  const d = new Date();
  d.setDate(d.getDate() - nombreDeJours);
  return d.toLocaleDateString("sv-SE");
}

function donneesDemo() {
  return [
    { id: 1, entreprise: "TechNova", poste: "Stage PFE Data Analyst", date: dateIlYA(1), lien: "https://example.com", notes: "Lettre de motivation prête, à envoyer demain.", statut: "a-envoyer" },
    { id: 2, entreprise: "DataSud", poste: "Stage PFE Business Intelligence", date: dateIlYA(4), lien: "https://example.com", notes: "Envoyée par email au service RH.", statut: "envoyee" },
    { id: 3, entreprise: "WebLab", poste: "Stage PFE Développeur Web", date: dateIlYA(9), lien: "https://example.com", notes: "Pas de réponse : relancer par email.", statut: "relancee" },
    { id: 4, entreprise: "InnoSoft", poste: "Stage PFE Full Stack", date: dateIlYA(2), lien: "https://example.com", notes: "Entretien jeudi à 10h.", statut: "entretien" },
    { id: 5, entreprise: "CloudMed", poste: "Stage PFE Ingénieur BI", date: dateIlYA(3), lien: "", notes: "Offre acceptée.", statut: "acceptee" },
    { id: 6, entreprise: "AlphaData", poste: "Stage PFE Data Engineer", date: dateIlYA(12), lien: "https://example.com", notes: "Profil non retenu.", statut: "refusee" }
  ];
}

function chargerCandidatures() {
  const texte = localStorage.getItem(CLE_STOCKAGE);
  if (texte) {
    try {
      return JSON.parse(texte);
    } catch (erreur) {
      console.error("Données illisibles :", erreur);
    }
  }
  return DEMO ? donneesDemo() : [];
}

function sauvegarder() {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(candidatures));
}

function lienValide(lien) {
  return /^https?:\/\//i.test(lien);
}

/* ---------- Badge ---------- */

function joursDepuis(dateTexte) {
  const aujourdhui = new Date();
  const dateAction = new Date(dateTexte);
  const difference = aujourdhui - dateAction;
  return Math.floor(difference / (1000 * 60 * 60 * 24));
}

function texteBadge(jours) {
  if (jours <= 0) return "Aujourd'hui";
  if (jours === 1) return "Il y a 1 jour";
  return "Il y a " + jours + " jours";
}

/* ---------- Carte ---------- */

function creerCarte(candidature) {
  const carte = document.createElement("article");
  carte.className = "card";
  carte.draggable = true;

  carte.addEventListener("dragstart", function (event) {
    event.dataTransfer.setData("text/plain", String(candidature.id));
    carte.classList.add("en-deplacement");
  });

  carte.addEventListener("dragend", function () {
    carte.classList.remove("en-deplacement");
  });

  const entreprise = document.createElement("h3");
  entreprise.textContent = candidature.entreprise;

  const poste = document.createElement("p");
  poste.textContent = candidature.poste;

  const date = document.createElement("p");
  date.textContent = candidature.date;

  const jours = joursDepuis(candidature.date);
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = texteBadge(jours);
  if (jours >= 7) {
    badge.classList.add("badge-relance");
  }

  const notes = document.createElement("p");
  notes.className = "notes";
  notes.textContent = candidature.notes || "Aucune note.";
  notes.hidden = true;

  const modifier = document.createElement("button");
  modifier.className = "btn-modifier";
  modifier.textContent = "✎";
  modifier.title = "Modifier";
  modifier.addEventListener("click", function () {
    ouvrirFormulaire(candidature);
  });

  const supprimer = document.createElement("button");
  supprimer.className = "btn-supprimer";
  supprimer.textContent = "×";
  supprimer.title = "Supprimer";
  supprimer.addEventListener("click", function () {
    if (confirm("Supprimer cette candidature ?")) {
      candidatures = candidatures.filter(function (c) {
        return c.id !== candidature.id;
      });
      sauvegarder();
      afficherCandidatures();
    }
  });

  carte.addEventListener("click", function (event) {
    if (event.target.closest("a, button")) return;
    notes.hidden = !notes.hidden;
  });

  carte.append(entreprise, poste, date, badge);

  if (candidature.lien && lienValide(candidature.lien)) {
    const lien = document.createElement("a");
    lien.href = candidature.lien;
    lien.textContent = "Voir l'offre";
    lien.target = "_blank";
    lien.rel = "noopener";
    carte.append(lien);
  }

  carte.append(notes, modifier, supprimer);
  return carte;
}

/* ---------- Affichage ---------- */

function afficherCandidatures() {
  colonnes.forEach(function (idColonne) {
    document.querySelector("#" + idColonne + " .cards").innerHTML = "";

    const nombre = candidatures.filter(function (c) {
      return c.statut === idColonne;
    }).length;
    document.querySelector("#" + idColonne + " .compteur").textContent = nombre;
  });

  candidatures.forEach(function (candidature) {
    const zone = document.querySelector("#" + candidature.statut + " .cards");
    zone.appendChild(creerCarte(candidature));
  });
}

/* ---------- Colonnes : compteur et glisser-déposer ---------- */

colonnes.forEach(function (idColonne) {
  const colonne = document.getElementById(idColonne);

  const compteur = document.createElement("span");
  compteur.className = "compteur";
  colonne.querySelector("h2").append(compteur);

  colonne.addEventListener("dragover", function (event) {
    event.preventDefault();
    colonne.classList.add("survol");
  });

  colonne.addEventListener("dragleave", function () {
    colonne.classList.remove("survol");
  });

  colonne.addEventListener("drop", function (event) {
    event.preventDefault();
    colonne.classList.remove("survol");

    const id = event.dataTransfer.getData("text/plain");
    const candidature = candidatures.find(function (c) {
      return String(c.id) === id;
    });

    if (candidature && candidature.statut !== idColonne) {
      candidature.statut = idColonne;
      candidature.date = dateAujourdhui();
      sauvegarder();
      afficherCandidatures();
    }
  });
});

/* ---------- Formulaire : ajouter et modifier ---------- */

function ouvrirFormulaire(candidature) {
  formulaire.reset();
  idEnEdition = candidature ? candidature.id : null;
  titreFormulaire.textContent = candidature ? "Modifier la candidature" : "Nouvelle candidature";

  document.getElementById("champ-entreprise").value = candidature ? candidature.entreprise : "";
  document.getElementById("champ-poste").value = candidature ? candidature.poste : "";
  document.getElementById("champ-date").value = candidature ? candidature.date : dateAujourdhui();
  document.getElementById("champ-statut").value = candidature ? candidature.statut : "a-envoyer";
  document.getElementById("champ-lien").value = candidature ? candidature.lien : "";
  document.getElementById("champ-notes").value = candidature ? candidature.notes : "";

  fenetre.showModal();
}

document.getElementById("btn-ajouter").addEventListener("click", function () {
  ouvrirFormulaire(null);
});

document.getElementById("btn-annuler").addEventListener("click", function () {
  fenetre.close();
});

formulaire.addEventListener("submit", function (event) {
  event.preventDefault();

  const donnees = {
    entreprise: document.getElementById("champ-entreprise").value.trim(),
    poste: document.getElementById("champ-poste").value.trim(),
    date: document.getElementById("champ-date").value,
    lien: document.getElementById("champ-lien").value.trim(),
    notes: document.getElementById("champ-notes").value.trim(),
    statut: document.getElementById("champ-statut").value
  };

  if (idEnEdition !== null) {
    const existante = candidatures.find(function (c) {
      return c.id === idEnEdition;
    });
    Object.assign(existante, donnees);
  } else {
    candidatures.push({ id: Date.now(), ...donnees });
  }

  sauvegarder();
  afficherCandidatures();
  fenetre.close();
});

/* ---------- Export / import ---------- */

document.getElementById("btn-exporter").addEventListener("click", function () {
  const contenu = JSON.stringify(candidatures, null, 2);
  const fichier = new Blob([contenu], { type: "application/json" });
  const adresse = URL.createObjectURL(fichier);

  const lien = document.createElement("a");
  lien.href = adresse;
  lien.download = "candidatures-pfe-" + dateAujourdhui() + ".json";
  lien.click();

  URL.revokeObjectURL(adresse);
});

const champFichier = document.getElementById("fichier-import");

document.getElementById("btn-importer").addEventListener("click", function () {
  champFichier.click();
});

champFichier.addEventListener("change", function () {
  const fichier = champFichier.files[0];
  if (!fichier) return;

  const lecteur = new FileReader();

  lecteur.onload = function () {
    try {
      const donnees = JSON.parse(lecteur.result);
      if (!Array.isArray(donnees)) {
        throw new Error("le fichier ne contient pas une liste");
      }

      const valides = donnees.filter(function (c) {
        return c && c.id && c.entreprise && c.date && colonnes.includes(c.statut);
      });

      if (confirm("Remplacer tes candidatures actuelles par " + valides.length + " candidature(s) importée(s) ?")) {
        candidatures = valides;
        sauvegarder();
        afficherCandidatures();
      }
    } catch (erreur) {
      alert("Fichier invalide : " + erreur.message);
    }
    champFichier.value = "";
  };

  lecteur.readAsText(fichier);
});

/* ---------- Démarrage ---------- */

if (DEMO) {
  const note = document.createElement("p");
  note.className = "mode-demo";
  note.textContent = "Mode démo : données fictives, enregistrées uniquement dans votre navigateur.";
  document.querySelector("header").append(note);
}

afficherCandidatures();