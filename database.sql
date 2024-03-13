CREATE table IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    competencia VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    reset_token VARCHAR(255) DEFAULT NULL
);


CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_user INT,
    pensamento VARCHAR(255) NOT NULL,
    link VARCHAR(255),
    arquivo VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_extension VARCHAR(255);,
    FOREIGN KEY (id_user) REFERENCES users(id)
);