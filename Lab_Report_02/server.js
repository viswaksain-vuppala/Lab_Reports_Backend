const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "bookStore.db");

let db = null;

// Initialize database and start server
const initializeDBAndServer = async () => {
    try {
        db = await open({
            filename: dbPath,
            driver: sqlite3.Database,
        });

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    }
};

initializeDBAndServer();


// GET: Retrieve all books
app.get("/books/", async (req, res) => {
    const query = `SELECT * FROM book;`;

    const books = await db.all(query);

    res.send(books);
});


// GET: Retrieve a specific book
app.get("/books/:bookId/", async (req, res) => {
    const { bookId } = req.params;

    const query = `SELECT * FROM book WHERE id = ?;`;

    const book = await db.get(query, [bookId]);

    if (book === undefined) {
        res.status(404).send("Book Not Found");
    } else {
        res.send(book);
    }
});


// POST: Add a new book
app.post("/books/", async (req, res) => {
    const { title, author, price, pages } = req.body;

    const query = `
        INSERT INTO book (title, author, price, pages)
        VALUES (?, ?, ?, ?);
    `;

    await db.run(query, [title, author, price, pages]);

    res.status(201).send("Book Added Successfully");
});


// PUT: Update an existing book
app.put("/books/:bookId/", async (req, res) => {
    const { bookId } = req.params;
    const { title, author, price, pages } = req.body;

    const query = `
        UPDATE book
        SET title = ?, author = ?, price = ?, pages = ?
        WHERE id = ?;
    `;

    const result = await db.run(query, [
        title,
        author,
        price,
        pages,
        bookId,
    ]);

    if (result.changes === 0) {
        res.status(404).send("Book Not Found");
    } else {
        res.send("Book Updated Successfully");
    }
});


// DELETE: Remove a book
app.delete("/books/:bookId/", async (req, res) => {
    const { bookId } = req.params;

    const query = `DELETE FROM book WHERE id = ?;`;

    const result = await db.run(query, [bookId]);

    if (result.changes === 0) {
        res.status(404).send("Book Not Found");
    } else {
        res.send("Book Deleted Successfully");
    }
});

module.exports = app;