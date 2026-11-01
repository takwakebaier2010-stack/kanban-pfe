<?php
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => !empty($_SERVER['HTTPS']),
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

function reponse(int $code, $contenu): void
{
    http_response_code($code);
    echo json_encode($contenu, JSON_UNESCAPED_UNICODE);
    exit;
}

function connecter(): PDO
{
    $config = require __DIR__ . '/config.php';

    try {
        return new PDO(
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
}

function corpsJson(): array
{
    $methode = $_SERVER['REQUEST_METHOD'];

    if (in_array($methode, ['POST', 'PUT'], true)) {
        $type = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($type, 'application/json') !== 0) {
            reponse(415, ['erreur' => 'Le contenu doit être en JSON.']);
        }
    }

    $donnees = json_decode(file_get_contents('php://input'), true);
    return is_array($donnees) ? $donnees : [];
}

function exigerConnexion(): int
{
    $id = $_SESSION['utilisateur_id'] ?? null;
    if (!is_int($id)) {
        reponse(401, ['erreur' => 'Connexion requise.']);
    }
    return $id;
}