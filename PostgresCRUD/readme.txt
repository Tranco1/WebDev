This is the CRUD maintenance screens for tables 

DEALERS
    CREATE TABLE bp (
        id SERIAL PRIMARY KEY,
        legalname VARCHAR(255),
        tname VARCHAR(100),
        address TEXT, telephone VARCHAR(255)
    );

USERS
  CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      bp_id INT REFERENCES bp(id)
  );


ORDERS
      CREATE TABLE orders (
          id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id),
          product_id INT REFERENCES products(id),
          quantity INT,
          bp_id INT REFERENCES bp(id)
      );




PRODUCTS
    CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        price NUMERIC(10,2),
        bp_id INT REFERENCES bp(id),
        desc2 VARCHAR(255),
        img VARCHAR(255)
    );

