const API = "api.php";
const AUTH = "auth.php";
const colonnes = ["a-envoyer", "envoyee", "relancee", "entretien", "acceptee", "refusee"];

const fenetre = document.getElementById("fenetre-ajout");
const formulaire = document.getElementById("formulaire");
const titreFormulaire = document.getElementById("titre-formulaire");

const tableau = document.getElementById("tableau");
const barreActions = document.getElementById("barre-actions");
const barreUtilisateur = document.getElementById("barre-utilisateur");
const ecranConnexion = document.getElementById("ecran-connexion");
const formulaireAuth = document.getElementById("formulaire-auth");
const titreAuth = document.getElementById("titre-auth");
const champEmail = document.getElementById("auth-email");
const champMdp = document.getElementById("auth-mdp");
const messageAuth = document.getElementById("message-auth");
const boutonValiderAuth = document.getElementById("btn-valider-auth");
const boutonBasculerAuth = document.getElementById("btn-basculer-auth");

let candidatures = [];
let idEnEdition = null;
let modeInscription = false;

/* ---------- Outils ---------- */

function dateAujourdhui() {
  return new Date().toLocaleDateString("sv-SE");
}

function lienValide(lien) {
  return /^https?:\/\//i.test(lien);
}

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

/* ---------- Communication avec le serveur ---------- */

async function appeler(adresse, options) {
  const reponse = await fetch(adresse, options);
  let corps = null;

  try {
    corps = await reponse.json();
  } catch (erreur) {
    corps = null;
  }

  if (!reponse.ok) {
    if (reponse.status === 401 && adresse.startsWith(API)) {
      afficherConnexion();
    }
    const message = corps && corps.erreur ? corps.erreur : "Erreur du serveur";
    const erreur = new Error(message);
    erreur.statut = reponse.status;
    throw erreur;
  }
  return corps;
}

function enJson(methode, donnees) {
  return {
    method: methode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(donnees)
  };
}

function signaler(debut, erreur) {
  if (erreur.statut === 401) return;
  alert(debut + erreur.message);
}

async function chargerCandidatures() {
  try {
    candidatures = await appeler(API);
    afficherCandidatures();
  } catch (erreur) {
    signaler("Impossible de charger les candidatures : ", erreur);
  }
}

/* ---------- Connexion, inscription, déconnexion ---------- */

function afficherConnexion() {
  candidatures = [];
  afficherCandidatures();
  if (fenetre.open) fenetre.close();

  tableau.hidden = true;
  barreActions.hidden = true;
  barreUtilisateur.hidden = true;
  ecranConnexion.hidden = false;
}

function afficherApplication(email) {
  document.getElementById("email-utilisateur").textContent = email;

  ecranConnexion.hidden = true;
  tableau.hidden = false;
  barreActions.hidden = false;
  barreUtilisateur.hidden = false;

  chargerCandidatures();
}

function changerMode(inscription) {
  modeInscription = inscription;
  messageAuth.hidden = true;

  titreAuth.textContent = inscription ? "Créer un compte" : "Connexion";
  boutonValiderAuth.textContent = inscription ? "Créer mon compte" : "Se connecter";
  boutonBasculerAuth.textContent = inscription
    ? "Déjà un compte ? Se connecter"
    : "Pas de compte ? Créer un compte";
  champMdp.autocomplete = inscription ? "new-password" : "current-password";
}

boutonBasculerAuth.addEventListener("click", function () {
  changerMode(!modeInscription);
});

formulaireAuth.addEventListener("submit", async function (event) {
  event.preventDefault();
  messageAuth.hidden = true;

  const action = modeInscription ? "inscription" : "connexion";
  const donnees = { email: champEmail.value.trim(), mot_de_passe: champMdp.value };

  try {
    const reponse = await appeler(AUTH + "?action=" + action, enJson("POST", donnees));
    formulaireAuth.reset();
    changerMode(false);
    afficherApplication(reponse.email);
  } catch (erreur) {
    messageAuth.textContent = erreur.message;
    messageAuth.hidden = false;
  }
});

document.getElementById("btn-deconnexion").addEventListener("click", async function () {
  try {
    await appeler(AUTH + "?action=deconnexion", enJson("POST", {}));
  } catch (erreur) {
    console.error(erreur);
  }
  afficherConnexion();
});

async function verifierSession() {
  try {
    const etat = await appeler(AUTH + "?action=moi");
    if (etat.connecte) {
      afficherApplication(etat.email);
    } else {
      afficherConnexion();
    }
  } catch (erreur) {
    afficherConnexion();
    messageAuth.textContent = "Le serveur ne répond pas : " + erreur.message;
    messageAuth.hidden = false;
  }
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
  supprimer.addEventListener("click", async function () {
    if (!confirm("Supprimer cette candidature ?")) return;
    try {
      await appeler(API + "?id=" + candidature.id, { method: "DELETE" });
      candidatures = candidatures.filter(function (c) {
        return c.id !== candidature.id;
      });
      afficherCandidatures();
    } catch (erreur) {
      signaler("Suppression impossible : ", erreur);
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

  colonne.addEventListener("drop", async function (event) {
    event.preventDefault();
    colonne.classList.remove("survol");

    const id = event.dataTransfer.getData("text/plain");
    const candidature = candidatures.find(function (c) {
      return String(c.id) === id;
    });

    if (!candidature || candidature.statut === idColonne) return;

    try {
      const miseAJour = await appeler(
        API + "?id=" + candidature.id,
        enJson("PUT", { ...candidature, statut: idColonne, date: dateAujourdhui() })
      );
      candidatures = candidatures.map(function (c) {
        return c.id === miseAJour.id ? miseAJour : c;
      });
      afficherCandidatures();
    } catch (erreur) {
      signaler("Déplacement impossible : ", erreur);
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

formulaire.addEventListener("submit", async function (event) {
  event.preventDefault();

  const donnees = {
    entreprise: document.getElementById("champ-entreprise").value.trim(),
    poste: document.getElementById("champ-poste").value.trim(),
    date: document.getElementById("champ-date").value,
    lien: document.getElementById("champ-lien").value.trim(),
    notes: document.getElementById("champ-notes").value.trim(),
    statut: document.getElementById("champ-statut").value
  };

  try {
    if (idEnEdition !== null) {
      const miseAJour = await appeler(API + "?id=" + idEnEdition, enJson("PUT", donnees));
      candidatures = candidatures.map(function (c) {
        return c.id === miseAJour.id ? miseAJour : c;
      });
    } else {
      const nouvelle = await appeler(API, enJson("POST", donnees));
      candidatures.push(nouvelle);
    }
    afficherCandidatures();
    fenetre.close();
  } catch (erreur) {
    signaler("Enregistrement impossible : ", erreur);
  }
});

/* ---------- Export ---------- */

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

/* ---------- Démarrage ---------- */

verifierSession();