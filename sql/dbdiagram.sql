// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table referencia {
  id INTEGER [primary key]
  Codigo INTEGER
  Mes TEXT
}

Table marca {
  id INTEGER [primary key]
  Value TEXT
  Label TEXT
}

Table modelo {
  id INTEGER [primary key]
  Codigo INTEGER
  Mes TEXT
  marca_id INTEGER [ref: - marca.id]
}

Table ano {
  id INTEGER [primary key]
  Codigo INTEGER
  Mes TEXT
}

table modelo_ano {
  id INTEGER [primary key]
  Modelos INTEGER [ref: - modelo.id]
  Anos INTEGER [ref: - ano.id]
}


Table veiculo {
  id INTEGER [primary key]
  CodigoFipe TEXT
  Marca TEXT
  Modelo TEXT
  AnoModelo INTEGER
  MesReferencia TEXT
  Valor TEXT
  TipoVeiculo INTEGER
  Combustivel TEXT
  SiglaCombustivel TEXT
}

