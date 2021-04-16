DROP DATABASE IF EXISTS great_bay;

CREATE DATABASE great_bay;

USE great_bay;

CREATE TABLE items (
  id INT NOT NULL AUTO_INCREMENT,
  item_description VARCHAR(45) NULL,
  highest_bid DECIMAL(10,2) NULL,
  PRIMARY KEY (id)
);