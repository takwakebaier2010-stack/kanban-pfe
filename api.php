<?php
require __DIR__ . '/commun.php';

const STATUTS = ['a-envoyer', 'envoyee', 'relancee', 'entretien', 'acceptee', 'refusee'];
const COLONNES_SQL = 'id, entreprise, poste, date_action AS date, lien, notes, statut';

function formater(array $ligne): array
{
    $ligne['id'] = (int) $ligne['id'];
    return $ligne;
}

function texte(array $donnees, string $cle): string
{
    $valeur = $donnees[$cle] ?? '';
    return is_string($valeur) ? trim($valeur) : '';
}

function valider(array $donnees): ?array
{
    $entreprise = texte($donnees, 'entreprise');
    $poste = texte($donnees, 'poste');
    $date = texte($donnees, 'date');
    $lien = texte($donnees, 'lien');
    $notes = texte($donnees, 'notes');
    $statut = texte($donnees, 'statut');

    $objetDate = DateTime::createFromFormat('Y-m-d', $date);
    $dateValide = $objetDate !== false && $objetDate->format('Y-m-d') === $date;

    if ($entreprise === '' || $poste === '' || !$dateValide) {
        return null;
    }
    if (!in_array($statut, STATUTS, true)) {
        return null;
    }
    if (mb_strlen($entreprise) > 150 || mb_strlen($poste) > 150 || mb_strlen($lien) > 500) {
        return null;
    }
    if ($lien !== '' && !preg_match('#^https?://#i', $lien)) {
        return null;
    }

    return [
        'entreprise' => $entreprise,
        'poste'      => $poste,
        'date'       => $date,
        'lien'       => $lien,
        'notes'      => $notes,
        'statut'     => $statut,
    ];
}

function lireLigne(PDO $pdo, int $id, int $utilisateurId): ?array
{
    $requete = $pdo->prepare(
        'SELECT ' . COLONNES_SQL . ' FROM candidatures
         WHERE id = :id AND utilisateur_id = :utilisateur_id'
    );
    $requete->execute(['id' => $id, 'utilisateur_id' => $utilisateurId]);
    $ligne = $requete->fetch();
    return $ligne ? formater($ligne) : null;
}

$utilisateurId = exigerConnexion();
$pdo = connecter();

$methode = $_SERVER['REQUEST_METHOD'];
$id = (int) ($_GET['id'] ?? 0);
$corps = corpsJson();

switch ($methode) {
    case 'GET':
        $requete = $pdo->prepare(
            'SELECT ' . COLONNES_SQL . ' FROM candidatures
             WHERE utilisateur_id = :utilisateur_id ORDER BY id'
        );
        $requete->execute(['utilisateur_id' => $utilisateurId]);
        reponse(200, array_map('formater', $requete->fetchAll()));

    case 'POST':
        $donnees = valider($corps);
        if ($donnees === null) {
            reponse(400, ['erreur' => 'Données invalides.']);
        }
        $donnees['utilisateur_id'] = $utilisateurId;
        $requete = $pdo->prepare(
            'INSERT INTO candidatures (utilisateur_id, entreprise, poste, date_action, lien, notes, statut)
             VALUES (:utilisateur_id, :entreprise, :poste, :date, :lien, :notes, :statut)'
        );
        $requete->execute($donnees);
        reponse(201, lireLigne($pdo, (int) $pdo->lastInsertId(), $utilisateurId));

    case 'PUT':
        if ($id <= 0 || lireLigne($pdo, $id, $utilisateurId) === null) {
            reponse(404, ['erreur' => 'Candidature introuvable.']);
        }
        $donnees = valider($corps);
        if ($donnees === null) {
            reponse(400, ['erreur' => 'Données invalides.']);
        }
        $donnees['id'] = $id;
        $donnees['utilisateur_id'] = $utilisateurId;
        $requete = $pdo->prepare(
            'UPDATE candidatures
             SET entreprise = :entreprise, poste = :poste, date_action = :date,
                 lien = :lien, notes = :notes, statut = :statut
             WHERE id = :id AND utilisateur_id = :utilisateur_id'
        );
        $requete->execute($donnees);
        reponse(200, lireLigne($pdo, $id, $utilisateurId));

    case 'DELETE':
        if ($id <= 0) {
            reponse(404, ['erreur' => 'Candidature introuvable.']);
        }
        $requete = $pdo->prepare(
            'DELETE FROM candidatures WHERE id = :id AND utilisateur_id = :utilisateur_id'
        );
        $requete->execute(['id' => $id, 'utilisateur_id' => $utilisateurId]);
        if ($requete->rowCount() === 0) {
            reponse(404, ['erreur' => 'Candidature introuvable.']);
        }
        reponse(200, ['ok' => true]);

    default:
        reponse(405, ['erreur' => 'Méthode non autorisée.']);
}