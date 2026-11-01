<?php
require __DIR__ . '/commun.php';

function ouvrirSession(int $id): void
{
    session_regenerate_id(true);
    $_SESSION['utilisateur_id'] = $id;
}

$action = $_GET['action'] ?? '';
$methode = $_SERVER['REQUEST_METHOD'];

if ($action === 'moi') {
    if ($methode !== 'GET') {
        reponse(405, ['erreur' => 'Méthode non autorisée.']);
    }
    $id = $_SESSION['utilisateur_id'] ?? null;
    if (!is_int($id)) {
        reponse(200, ['connecte' => false]);
    }
    $requete = connecter()->prepare('SELECT email FROM utilisateurs WHERE id = :id');
    $requete->execute(['id' => $id]);
    $ligne = $requete->fetch();
    if (!$ligne) {
        $_SESSION = [];
        reponse(200, ['connecte' => false]);
    }
    reponse(200, ['connecte' => true, 'email' => $ligne['email']]);
}

if (!in_array($action, ['inscription', 'connexion', 'deconnexion'], true)) {
    reponse(404, ['erreur' => 'Action inconnue.']);
}
if ($methode !== 'POST') {
    reponse(405, ['erreur' => 'Méthode non autorisée.']);
}

$corps = corpsJson();

if ($action === 'deconnexion') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 3600, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
    reponse(200, ['ok' => true]);
}

$email = is_string($corps['email'] ?? null) ? mb_strtolower(trim($corps['email'])) : '';
$motDePasse = is_string($corps['mot_de_passe'] ?? null) ? $corps['mot_de_passe'] : '';
$pdo = connecter();

if ($action === 'inscription') {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 190) {
        reponse(400, ['erreur' => 'Adresse email invalide.']);
    }
    if (strlen($motDePasse) < 8 || strlen($motDePasse) > 72) {
        reponse(400, ['erreur' => 'Le mot de passe doit contenir entre 8 et 72 caractères.']);
    }

    $requete = $pdo->prepare('INSERT INTO utilisateurs (email, mot_de_passe) VALUES (:email, :hash)');
    try {
        $requete->execute([
            'email' => $email,
            'hash'  => password_hash($motDePasse, PASSWORD_DEFAULT),
        ]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            reponse(409, ['erreur' => 'Un compte existe déjà avec cet email.']);
        }
        reponse(500, ['erreur' => 'Erreur du serveur.']);
    }

    ouvrirSession((int) $pdo->lastInsertId());
    reponse(201, ['connecte' => true, 'email' => $email]);
}

$requete = $pdo->prepare('SELECT id, mot_de_passe FROM utilisateurs WHERE email = :email');
$requete->execute(['email' => $email]);
$ligne = $requete->fetch();

$hash = $ligne ? $ligne['mot_de_passe'] : password_hash('mot de passe factice', PASSWORD_DEFAULT);
$motDePasseCorrect = password_verify($motDePasse, $hash);

if (!$ligne || !$motDePasseCorrect) {
    reponse(401, ['erreur' => 'Email ou mot de passe incorrect.']);
}

ouvrirSession((int) $ligne['id']);
reponse(200, ['connecte' => true, 'email' => $email]);