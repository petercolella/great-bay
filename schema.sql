DROP DATABASE IF EXISTS great_bay;

CREATE DATABASE great_bay;

USE great_bay;

CREATE TABLE items (
    id INT NOT NULL AUTO_INCREMENT,
    item_description VARCHAR(45) NOT NULL,
    highest_bid DECIMAL(10, 2) NOT NULL,
    user_id INT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(45) NOT NULL,
    user_password VARCHAR(45) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    PRIMARY KEY (id)
);