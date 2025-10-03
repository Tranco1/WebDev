const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
const port = 3000;

// Database connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "myerp",
  password: "aass",
  port: 5432,
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: false,
  })
);

// Middleware to protect routes
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

/* ================= AUTH ================= */
app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);

  if (result.rows.length === 0) {
    return res.send("Invalid email or password. <a href='/login'>Try again</a>");
  }

  const user = result.rows[0];
  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.send("Invalid email or password. <a href='/login'>Try again</a>");
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.redirect("/");
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});


app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  // Optional: force all self-registered users to have no dealer
  await pool.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
    [name, email, hashed]
  );

  res.redirect("/login");
});


/* ================= MAIN DASHBOARD ================= */
app.get("/", requireLogin, async (req, res) => {
  const users = await pool.query(
    `SELECT users.*, dealers.legalname as dealer_name 
     FROM users LEFT JOIN dealers ON users.dealer_id = dealers.id
     ORDER BY users.id ASC`
  );

  const products = await pool.query(
    `SELECT products.*, dealers.legalname as dealer_name 
     FROM products LEFT JOIN dealers ON products.dealer_id = dealers.id
     ORDER BY products.id ASC`
  );

  const orders = await pool.query(
    `SELECT orders.*, u.name as user_name, p.name as product_name, d.legalname as dealer_name
     FROM orders
     JOIN users u ON orders.user_id = u.id
     JOIN products p ON orders.product_id = p.id
     LEFT JOIN dealers d ON orders.dealer_id = d.id
     ORDER BY orders.id ASC`
  );

  const dealers = await pool.query("SELECT * FROM dealers ORDER BY id ASC");

  res.render("index", {
    users: users.rows,
    products: products.rows,
    orders: orders.rows,
    dealers: dealers.rows,
  });
});

/* ================= USERS ================= */
app.post("/users/add", requireLogin, async (req, res) => {
  const { name, email, password, dealer_id } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  await pool.query(
    "INSERT INTO users (name, email, password, dealer_id) VALUES ($1, $2, $3, $4)",
    [name, email, hashed, dealer_id || null]
  );
  res.redirect("/");
});

app.get("/users/edit/:id", requireLogin, async (req, res) => {
  const user = (await pool.query("SELECT * FROM users WHERE id=$1", [req.params.id])).rows[0];
  const dealers = (await pool.query("SELECT * FROM dealers ORDER BY id ASC")).rows;
  res.render("edit-user", { user, dealers });
});

app.post("/users/update/:id", requireLogin, async (req, res) => {
  const { name, email, password, dealer_id } = req.body;
  if (password && password.trim() !== "") {
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET name=$1, email=$2, password=$3, dealer_id=$4 WHERE id=$5",
      [name, email, hashed, dealer_id || null, req.params.id]
    );
  } else {
    await pool.query(
      "UPDATE users SET name=$1, email=$2, dealer_id=$3 WHERE id=$4",
      [name, email, dealer_id || null, req.params.id]
    );
  }
  res.redirect("/");
});

app.get("/users/delete/:id", requireLogin, async (req, res) => {
  await pool.query("DELETE FROM users WHERE id=$1", [req.params.id]);
  res.redirect("/");
});

/* ================= PRODUCTS ================= */
app.post("/products/add", requireLogin, async (req, res) => {
  const { name, price, dealer_id, desc2, img, category } = req.body;
  await pool.query(
    "INSERT INTO products (name, price, dealer_id, desc2, img, category) VALUES ($1, $2, $3, $4, $5, $6)",
    [name, price, dealer_id, desc2, img, category || null]
  );
  res.redirect("/");
});

app.get("/products/edit/:id", requireLogin, async (req, res) => {
  const product = (await pool.query("SELECT * FROM products WHERE id=$1", [req.params.id])).rows[0];
  const dealers = (await pool.query("SELECT * FROM dealers ORDER BY id ASC")).rows;
  res.render("edit-product", { product, dealers });
});

app.post("/products/update/:id", requireLogin, async (req, res) => {
  const { name, price, dealer_id, desc2, img, category } = req.body;
  await pool.query(
    "UPDATE products SET name=$1, price=$2, dealer_id=$3, desc2=$4, img=$5, category=$6 WHERE id=$7",
    [name, price, dealer_id || null, desc2, img, category, req.params.id]
  );
  res.redirect("/");
});

app.get("/products/delete/:id", requireLogin, async (req, res) => {
  await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  res.redirect("/");
});

/* ================= ORDERS ================= */
app.post("/orders/add", requireLogin, async (req, res) => {
  const { user_id, product_id, quantity, dealer_id } = req.body;
  await pool.query(
    "INSERT INTO orders (user_id, product_id, quantity, dealer_id) VALUES ($1, $2, $3, $4)",
    [user_id, product_id, quantity, dealer_id || null]
  );
  res.redirect("/");
});

app.get("/orders/edit/:id", requireLogin, async (req, res) => {
  const order = (await pool.query("SELECT * FROM orders WHERE id=$1", [req.params.id])).rows[0];
  const users = (await pool.query("SELECT * FROM users ORDER BY id ASC")).rows;
  const products = (await pool.query("SELECT * FROM products ORDER BY id ASC")).rows;
  const dealers = (await pool.query("SELECT * FROM dealers ORDER BY id ASC")).rows;
  res.render("edit-order", { order, users, products, dealers });
});

app.post("/orders/update/:id", requireLogin, async (req, res) => {
  const { user_id, product_id, quantity, dealer_id } = req.body;
  await pool.query(
    "UPDATE orders SET user_id=$1, product_id=$2, quantity=$3, dealer_id=$4 WHERE id=$5",
    [user_id, product_id, quantity, dealer_id || null, req.params.id]
  );
  res.redirect("/");
});

app.get("/orders/delete/:id", requireLogin, async (req, res) => {
  await pool.query("DELETE FROM orders WHERE id=$1", [req.params.id]);
  res.redirect("/");
});

/* ================= DEALERS ================= */
app.post("/dealers/add", requireLogin, async (req, res) => {
  const { legalname, tname, address } = req.body;
  await pool.query(
    "INSERT INTO dealers (legalname, tname, address) VALUES ($1, $2, $3)",
    [legalname, tname, address]
  );
  res.redirect("/");
});

app.get("/dealers/edit/:id", requireLogin, async (req, res) => {
  const dealer = (await pool.query("SELECT * FROM dealers WHERE id=$1", [req.params.id])).rows[0];
  res.render("edit-dealer", { dealer });
});

app.post("/dealers/update/:id", requireLogin, async (req, res) => {
  const { legalname, tname, address } = req.body;
  await pool.query(
    "UPDATE dealers SET legalname=$1, tname=$2, address=$3 WHERE id=$4",
    [legalname, tname, address, req.params.id]
  );
  res.redirect("/");
});

app.get("/dealers/delete/:id", requireLogin, async (req, res) => {
  await pool.query("DELETE FROM dealers WHERE id=$1", [req.params.id]);
  res.redirect("/");
});

/* ================= START ================= */
app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
