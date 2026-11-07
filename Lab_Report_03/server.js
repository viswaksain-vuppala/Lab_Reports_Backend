const express = require("express");
const initializeDB = require("./db");

const app = express();

app.use(express.json());

let db;

// Initialize database and start server
const initializeDBAndServer = async () => {
    try {
        db = await initializeDB();

        app.listen(3000, () => {
            console.log("Server Running at http://localhost:3000/");
        });
    } catch (error) {
        console.log(`Database Error: ${error.message}`);
        process.exit(1);
    }
};

// API 1: Get all books with search, sorting, pagination and price filtering
app.get("/books/", async (request, response) => {
    const {
        search_q = "",
        order_by = "id",
        order = "ASC",
        limit = "10",
        offset = "0",
        min_price,
        max_price
    } = request.query;

    // Validate sorting column
    const allowedColumns = ["id", "title", "author", "price", "pages"];

    if (!allowedColumns.includes(order_by)) {
        return response.status(400).json({
            message: "Invalid order_by value"
        });
    }

    // Validate sorting order
    const sortOrder = order.toUpperCase();

    if (!["ASC", "DESC"].includes(sortOrder)) {
        return response.status(400).json({
            message: "Order must be ASC or DESC"
        });
    }

    // Validate limit and offset
    const pageLimit = Number(limit);
    const pageOffset = Number(offset);

    if (
        !Number.isInteger(pageLimit) ||
        pageLimit <= 0 ||
        !Number.isInteger(pageOffset) ||
        pageOffset < 0
    ) {
        return response.status(400).json({
            message: "Invalid limit or offset"
        });
    }

    // Build query conditions
    let conditions = [];
    let parameters = [];

    // Search books by title
    if (search_q.trim() !== "") {
        conditions.push("title LIKE ?");
        parameters.push(`%${search_q}%`);
    }

    // Minimum price filter
    if (min_price !== undefined) {
        if (min_price.trim() === "" || !Number.isFinite(Number(min_price))) {
            return response.status(400).json({
                message: "Invalid min_price value"
            });
        }

        conditions.push("price >= ?");
        parameters.push(Number(min_price));
    }

    // Maximum price filter
    if (max_price !== undefined) {
        if (max_price.trim() === "" || !Number.isFinite(Number(max_price))) {
            return response.status(400).json({
                message: "Invalid max_price value"
            });
        }

        conditions.push("price <= ?");
        parameters.push(Number(max_price));
    }

    // Check price range
    if (
        min_price !== undefined &&
        max_price !== undefined &&
        Number(min_price) > Number(max_price)
    ) {
        return response.status(400).json({
            message: "min_price cannot be greater than max_price"
        });
    }

    // Construct SQL query
    let query = "SELECT * FROM book";

    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }

    query += ` ORDER BY ${order_by} ${sortOrder} LIMIT ? OFFSET ?`;

    parameters.push(pageLimit, pageOffset);

    const books = await db.all(query, parameters);

    response.status(200).json(books);
});

// API 2: Get book by ID
app.get("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;

    const book = await db.get(
        "SELECT * FROM book WHERE id = ?",
        [bookId]
    );

    if (book === undefined) {
        return response.status(404).json({
            message: "Book not found"
        });
    }

    response.status(200).json(book);
});

// API 3: Add a new book
app.post("/books/", async (request, response) => {
    const { title, author, price, pages } = request.body;

    // Validate title
    if (typeof title !== "string" || title.trim() === "") {
        return response.status(400).json({
            message: "Title is required"
        });
    }

    // Validate author
    if (typeof author !== "string" || author.trim() === "") {
        return response.status(400).json({
            message: "Author is required"
        });
    }

    // Validate price
    if (
        price === undefined ||
        price === null ||
        price === "" ||
        !Number.isFinite(Number(price))
    ) {
        return response.status(400).json({
            message: "Price must be a valid number"
        });
    }

    const query = `
        INSERT INTO book (title, author, price, pages)
        VALUES (?, ?, ?, ?);
    `;

    await db.run(query, [
        title.trim(),
        author.trim(),
        Number(price),
        pages
    ]);

    response.status(201).json({
        message: "Book Added Successfully"
    });
});

// API 4: Update a book
app.put("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;
    const { title, author, price, pages } = request.body;

    // Validate title
    if (typeof title !== "string" || title.trim() === "") {
        return response.status(400).json({
            message: "Title is required"
        });
    }

    // Validate author
    if (typeof author !== "string" || author.trim() === "") {
        return response.status(400).json({
            message: "Author is required"
        });
    }

    // Validate price
    if (
        price === undefined ||
        price === null ||
        price === "" ||
        !Number.isFinite(Number(price))
    ) {
        return response.status(400).json({
            message: "Price must be a valid number"
        });
    }

    const query = `
        UPDATE book
        SET title = ?, author = ?, price = ?, pages = ?
        WHERE id = ?;
    `;

    const result = await db.run(query, [
        title.trim(),
        author.trim(),
        Number(price),
        pages,
        bookId
    ]);

    if (result.changes === 0) {
        return response.status(404).json({
            message: "Book not found"
        });
    }

    response.status(200).json({
        message: "Book Updated Successfully"
    });
});

// API 5: Delete a book
app.delete("/books/:bookId/", async (request, response) => {
    const { bookId } = request.params;

    const result = await db.run(
        "DELETE FROM book WHERE id = ?",
        [bookId]
    );

    if (result.changes === 0) {
        return response.status(404).json({
            message: "Book not found"
        });
    }

    response.status(200).json({
        message: "Book Deleted Successfully"
    });
});

// Handle unexpected errors
app.use((error, request, response, next) => {
    console.error(error.message);

    response.status(500).json({
        message: "Internal Server Error"
    });
});

// Start the application
initializeDBAndServer();