const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const path = require("path");

// Define the database file location
const dbPath = path.join(__dirname, "books.db");

// Initialize the database
const initializeDB = async () => {
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Create the book table
    await db.exec(`
        CREATE TABLE IF NOT EXISTS book (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            price INTEGER,
            pages INTEGER
        );
    `);

    console.log("Database connected and table created successfully!");

    return db;
};

module.exports = initializeDB;