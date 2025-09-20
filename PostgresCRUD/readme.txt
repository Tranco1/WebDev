This is the CRUD maintenance screens for tables 

DEALERS
    CREATE TABLE dealers (
        id SERIAL PRIMARY KEY,
        legalname VARCHAR(150) NOT NULL,
        tname VARCHAR(100),
        address TEXT
    );

USERS
  CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      dealer_id INT REFERENCES dealers(id);
  );


ORDERS
      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id),
          product_id INT REFERENCES products(id),
          quantity INT,
          dealer_id INT REFERENCES dealers(id)
      );




PRODUCTS
    CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        price NUMERIC(10,2),
       dealer_id INT REFERENCES dealers(id)
    );

