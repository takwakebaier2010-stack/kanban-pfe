<?php
header('Content-Type: application/json; charset=utf-8');

const STATUTS = ['a-envoyer', 'envoyee', 'relancee', 'entretien', 'acceptee', 'refusee'];
const COLONNES_SQL = 'id, entreprise, poste, date_action AS date, lien, notes, statut';

function reponse(int $code, $contenu): void
{
    http_response_code($code);
    echo json_encode($contenu, JSON_UNESCAPED_UNICODE);
    exit;
}

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

function lireLigne(PDO $pdo, int $id): ?array
{
    $requete = $pdo->prepare('SELECT ' . COLONNES_SQL . ' FROM candidatures WHERE id = :id');
    $requete->execute(['id' => $id]);
    $ligne = $requete->fetch();
    return $ligne ? formater($ligne) : null;
}

$config = require __DIR__ . '/config.php';

try {
    $pdo = new PDO(
        "mysql:host={$config['host']};dbname={$config['dbname']};charset=utf8mb4",
        $config['user'],
        $config['password'],
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]
    );
} catch (PDOException $e) {
    reponse(500, ['erreur' => 'Connexion à la base de données impossible.']);
}

$methode = $_SERVER['REQUEST_METHOD'];
$id = (int) ($_GET['id'] ?? 0);
$corps = json_decode(file_get_contents('php://input'), true);
if (!is_array($corps)) {
    $corps = [];
}

switch ($methode) {
    case 'GET':
        $lignes = $pdo->query('SELECT ' . COLONNES_SQL . ' FROM candidatures ORDER BY id')->fetchAll();
        reponse(200, array_map('formater', $lignes));

    case 'POST':
        $donnees = valider($corps);
        if ($donnees === null) {
            reponse(400, ['erreur' => 'Données invalides.']);
        }
        $requete = $pdo->prepare(
            'INSERT INTO candidatures (entreprise, poste, date_action, lien, notes, statut)
             VALUES (:entreprise, :poste, :date, :lien, :notes, :statut)'
        );
        $requete->execute($donnees);
        reponse(201, lireLigne($pdo, (int) $pdo->lastInsertId()));

    case 'PUT':
        if ($id <= 0 || lireLigne($pdo, $id) === null) {
            reponse(404, ['erreur' => 'Candidature introuvable.']);
        }
        $donnees = valider($corps);
        if ($donnees === null) {
            reponse(400, ['erreur' => 'Données invalides.']);
        }
        $donnees['id'] = $id;
        $requete = $pdo->prepare(
            'UPDATE candidatures
             SET entreprise = :entreprise, poste = :poste, date_action = :date,
                 lien = :lien, notes = :notes, statut = :statut
             WHERE id = :id'
        );
        $requete->execute($donnees);
        reponse(200, lireLigne($pdo, $id));

    case 'DELETE':
        if ($id <= 0) {
            reponse(404, ['erreur' => 'Candidature introuvable.']);
        }
        $requete = $pdo->prepare('DELETE FROM candidatures WHERE id = :id');
        $requete->execute(['id' => $id]);
        if ($requete->rowCount() === 0) {
            reponse(404, ['erreur' => 'Candidature introuvable.']);
        }
        reponse(200, ['ok' => true]);

    default:
        reponse(405, ['erreur' => 'Méthode non autorisée.']);
}