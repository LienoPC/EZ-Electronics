"use strict"

import db from "../db/db";

/**
 * Deletes all data from the database.
 * This function must be called before any integration test, to ensure a clean database state for each test run.
 */

export function cleanup() {
    db.serialize(() => {
        // Delete all data from the database.
        db.exec("DELETE FROM users")
        //Add delete statements for other tables here
        db.exec("DELETE FROM products")
        db.exec("DELETE FROM carts")
        db.exec("DELETE FROM reviews")
        db.exec("DELETE FROM product_cart")
        db.exec("DELETE FROM sqlite_sequence")
    })
}

export async function createAllTables() {
    db.serialize(() => {
        db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
        db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
        db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);
        db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
        db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
    })
    
};

export async function createAllTriggers() {
    db.exec(`CREATE TRIGGER IF NOT EXISTS update_cart_total_after_delete
            BEFORE DELETE ON products
            FOR EACH ROW
            BEGIN
                -- Per ogni carrello che contiene il prodotto eliminato, aggiorna il totale del carrello
                UPDATE carts
                SET total = total * 100 - (
                    SELECT OLD.sellingPrice* 100 * pc.quantity
                    FROM product_cart pc
                    WHERE pc.cartId = carts.id AND pc.productId = OLD.id
                ) / 100
                WHERE carts.id IN (
                    SELECT pc.cartId
                    FROM product_cart pc
                    WHERE pc.productId = OLD.id
                );
            END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS update_cart_total_after_delete_from_cart
            BEFORE DELETE ON product_cart
            FOR EACH ROW
            BEGIN
                -- Calcola la differenza del totale
                UPDATE carts
                SET total = (total * 100
                            - (SELECT sellingPrice FROM products WHERE id = OLD.productId) * 100 * OLD.quantity) / 100
                WHERE id = OLD.cartId;
            END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS update_cart_total_after_insert
            AFTER INSERT ON product_cart
            FOR EACH ROW
            BEGIN
                -- Aggiorna il totale del carrello aggiungendo il costo totale del prodotto (prezzo * quantità)
                UPDATE carts
                SET total = (total * 100 + ((SELECT sellingPrice FROM products WHERE id = NEW.productId) * 100 * NEW.quantity)) / 100
                WHERE id = NEW.cartId;
            END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS update_cart_total_after_update
            AFTER UPDATE ON product_cart
            FOR EACH ROW
            BEGIN
                -- Calcola la differenza del totale
                UPDATE carts
                SET total = (total * 100
                            - (SELECT sellingPrice FROM products WHERE id = OLD.productId) * 100 * OLD.quantity
                            + (SELECT sellingPrice FROM products WHERE id = NEW.productId) * 100 * NEW.quantity) / 100
                WHERE id = NEW.cartId;
            END`);
    db.exec(`CREATE TRIGGER IF NOT EXISTS update_product_quantity_after_checkout
            AFTER UPDATE ON carts
            FOR EACH ROW
            WHEN OLD.paid = 0 AND NEW.paid = 1
            BEGIN
                UPDATE products
                SET quantity = quantity
                            - (
                            SELECT pc.quantity
                            FROM product_cart pc
                            WHERE pc.productId = products.id AND pc.cartId = NEW.id
                            )
                WHERE id IN (
                    SELECT productId
                    FROM product_cart
                    WHERE cartId = NEW.id
                );
            END`);
};