This is the CRUD maintenance screens for tables 

DEALERS
    CREATE TABLE dealers (
        id SERIAL PRIMARY KEY,
        legalname VARCHAR(255),
        tname VARCHAR(100),
        address TEXT, telephone VARCHAR(255)
    );

CREATE TABLE category (
    id SERIAL PRIMARY KEY, 
    sortcode VARCHAR(2),
    cname VARCHAR(100),
    dealer_id INT REFERENCES dealers(id)
);

USERS
  CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100),
      email VARCHAR(100),
      dealer_id INT REFERENCES dealer(id)
  );


ORDERS
      CREATE TABLE orders (
          order_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES users(id),
          customer_name TEXT NOT NULL,
          order_date TIMESTAMP DEFAULT NOW(),
          total NUMERIC(10,2),
          dealer_id INT REFERENCES dealers(id)
      );


      CREATE TABLE orders_items (
          id SERIAL PRIMARY KEY,
          order_id INT REFERENCES orders(order_id),
          product_id INT REFERENCES products(id),
          quantity INT,
          price NUMERIC(10,2) NOT NULL
      );




PRODUCTS
    CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        price NUMERIC(10,2),
        dealer_id INT REFERENCES dealer(id),
        desc2 VARCHAR(255),
        img VARCHAR(255),
        category INT REFERENCES category(id)
    );

