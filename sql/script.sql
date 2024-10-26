-- SQLite does not support CREATE DATABASE, so this line is removed
-- USE statement is also not needed in SQLite

-- These settings are not applicable in SQLite
-- SET NAMES utf8;
-- SET time_zone = '+00:00';
-- SET foreign_key_checks = 0;
-- SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

CREATE TABLE IF NOT EXISTS referencia (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  Codigo INTEGER NOT NULL,
  Mes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS veiculo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  CodigoFipe TEXT NOT NULL,
  Marca TEXT NOT NULL,
  Modelo TEXT NOT NULL,
  AnoModelo INTEGER NOT NULL,
  MesReferencia TEXT NOT NULL,
  Valor TEXT NOT NULL,
  TipoVeiculo INTEGER NOT NULL,
  Combustivel TEXT  NOT NULL,
  SiglaCombustivel TEXT NOT NULL
);
