DROP DATABASE IF EXISTS great_bay;

CREATE DATABASE great_bay;

USE great_bay;

CREATE TABLE auctions (
    id INT NOT NULL AUTO_INCREMENT,
    item_description VARCHAR(45) NOT NULL,
    starting_bid DECIMAL(10, 2) NOT NULL,
    highest_bid DECIMAL(10, 2) NOT NULL,
    is_auction_open BOOLEAN DEFAULT true,
    created_by_id INT NOT NULL,
    highest_bidder_id INT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(45) NOT NULL,
    user_password VARCHAR(45) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    PRIMARY KEY (id)
);

INSERT INTO users (username, user_password, is_admin)
VALUES ('admin', 'admin', true);