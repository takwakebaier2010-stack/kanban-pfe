CREATE DATABASE IF NOT EXISTS kanban_pfe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kanban_pfe;

CREATE TABLE IF NOT EXISTS utilisateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS candidatures (
  id INT AUTO_INCREMENT PRIMARY KEY,
  utilisateur_id INT NOT NULL,
  entreprise VARCHAR(150) NOT NULL,
  poste VARCHAR(150) NOT NULL,
  date_action DATE NOT NULL,
  lien VARCHAR(500) NOT NULL DEFAULT '',
  notes TEXT,
  statut ENUM('a-envoyer', 'envoyee', 'relancee', 'entretien', 'acceptee', 'refusee')
    NOT NULL DEFAULT 'a-envoyer',
  cree_le TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE CASCADE
);