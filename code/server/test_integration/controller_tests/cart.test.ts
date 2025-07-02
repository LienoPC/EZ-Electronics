import CartDAO from '../../src/dao/cartDAO';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { Cart, ProductInCart } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { CartNotFoundError, ProductInCartError, EmptyCartError, ProductNotInCartError } from '../../src/errors/cartError';
import { EmptyProductStockError, ProductNotFoundError } from '../../src/errors/productError';
import db from '../../src/db/db';
import { cleanup } from '../../src/db/cleanup';
import CartController from '../../src/controllers/cartController';


async function createAllTables() {
    await db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
    await db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
    await db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);
    await db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
    await db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
};

async function createAllTriggers() {
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

describe('CartController Integration Tests', () => {
    let cartController: CartController;
    let nullValue: any;

    let user1: User;
    let user2: User;
    let user3: User;

    let product1: Product;
    let product2: Product;
    let product3: Product;

    let cart1: Cart;
    let cart2: Cart;
    let cart3: Cart;

    let productInCart1: ProductInCart;
    let productInCart2: ProductInCart;
    let productInCart3: ProductInCart;
    let productInCart4: ProductInCart;

    beforeAll(async () => {
        cartController = new CartController();
        nullValue = null;

        user1 = new User("customer", "customer", "customer", Role.CUSTOMER, nullValue, nullValue);
        user2 = new User("manager", "manager", "manager", Role.MANAGER, nullValue, nullValue);
        user3 = new User("admin", "admin", "admin", Role.ADMIN, nullValue, nullValue);

        product1 = new Product(100.36, "iPhone 13", Category.SMARTPHONE, "2020-02-23", "Un bellissimo smartphone", 20);
        product2 = new Product(2500, "LG TV 55", Category.APPLIANCE, "2024-02-14", "Una bellissima tv", 5);
        product3 = new Product(860.35, "Thinkpad E14", Category.LAPTOP, "2015-03-24", "Un bellissimo laptop", 100);

        productInCart1 = new ProductInCart(product1.model, 2, product1.category, product1.sellingPrice);
        productInCart2 = new ProductInCart(product2.model, 1, product2.category, product2.sellingPrice);
        productInCart3 = new ProductInCart(product3.model, 5, product3.category, product3.sellingPrice);
        productInCart4 = new ProductInCart(product3.model, 1, product3.category, product3.sellingPrice);

        // Current Cart
        cart1 = new Cart("customer", false, nullValue, productInCart2.price * productInCart2.quantity + productInCart4.price * productInCart4.quantity, [productInCart2, productInCart4]);
        // History
        cart2 = new Cart("customer", true, "2020-06-12", productInCart3.price * productInCart3.quantity, [productInCart3]);
        cart3 = new Cart("customer", true, "2024-02-18", productInCart1.price * productInCart1.quantity + productInCart2.price * productInCart2.quantity, [productInCart1, productInCart2]);

        await createAllTables();
        await createAllTriggers();
        await cleanup();

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");
    });

    afterAll(async () => {
        await createAllTables();
        await createAllTriggers();
        await cleanup();
        await new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        });
    });

    beforeEach(() => {
        db.serialize(() => {
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, "password", "salt", user1.address, user1.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, "password", "salt", user2.address, user2.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, "password", "salt", user3.address, user3.birthdate]);

            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);

            db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
            db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
            db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
        })
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await createAllTables();
        await createAllTriggers();
        await cleanup();
    });

    describe("addToCart", () => {
        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "addToCartDAO");
        });

        test("correctExecution", async () => {
            const result = await cartController.addToCart(user1, product1.model);

            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE products');

            await expect(cartController.addToCart(user1, product1.model)).rejects.toThrowError();
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
        });

        test("ProductNotFound", async () => {
            db.exec('DELETE FROM products');

            await expect(cartController.addToCart(user1, product1.model)).rejects.toThrowError(ProductNotFoundError);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
        });

        test("emptyStock", async () => {
            db.exec('UPDATE products SET quantity = 0 WHERE id = 1');

            await expect(cartController.addToCart(user1, product1.model)).rejects.toThrowError(EmptyProductStockError);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
        });
    });

    describe("getCart", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "getCartByUser");
        });

        test("currentCartWithProducts", async () => {
            const result = await cartController.getCart(user1);

            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledWith(user1);
            expect(result).toEqual(cart1);
        });

        test("emptyOrAbsentCurrentCart", async () => {
            db.exec('DELETE FROM carts');
            const result = await cartController.getCart(user1);

            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledWith(user1);
            expect(result).toEqual(new Cart(user1.username, false, nullValue, 0, []));
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE carts');

            await expect(cartController.getCart(user1)).rejects.toThrowError();
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledWith(user1);
        });
    });

    describe("checkoutCart", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "doCheckoutByUsername");
        });

        test("correctExecution", async () => {
            const result = await cartController.checkoutCart(user1);

            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE carts');

            await expect(cartController.checkoutCart(user1)).rejects.toThrowError();
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });

        test("cartNotFound", async () => {
            db.exec('DELETE FROM carts');
            
            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(CartNotFoundError);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });

        test("emptyCart", async () => {
            db.exec('DELETE FROM product_cart');

            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(EmptyCartError);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });

        test("productNotAvailable",async () => {
            db.exec('UPDATE products SET quantity = 0 WHERE id = 2');
            
            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(ProductInCartError);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });
    });

    describe("getCustomerCarts", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "getHistoryByUsername");
        });

        test("correctExecution", async () => {
            const result = await cartController.getCustomerCarts(user1);

            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledWith(user1);
            expect(result).toEqual([cart2, cart3]);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE products');
            
            await expect(cartController.getCustomerCarts(user1)).rejects.toThrowError();
            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledWith(user1);
        });
    });

    describe("removeProductFromCart", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "removeProductFromCartDAO");
        });

        test("correctExecution", async () => {
            const result = await cartController.removeProductFromCart(user1, product2.model);

            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE carts');

            await expect(cartController.removeProductFromCart(user1, product2.model)).rejects.toThrowError();
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
        });

        test("noCurrentCartOrEmptyCart", async () => {
            db.exec('DELETE FROM carts');
            
            await expect(cartController.removeProductFromCart(user1, product2.model)).rejects.toThrowError(CartNotFoundError);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
        });

        test("productNotInCart", async () => {
            db.exec('DELETE FROM product_cart WHERE productId = 2');

            await expect(cartController.removeProductFromCart(user1, product2.model)).rejects.toThrowError(ProductNotInCartError);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
        });
    });

    describe("clearCart", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "clearCartDAO");
        });

        test("correctExecution", async () => {
            const result = await cartController.clearCart(user1);

            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledWith(user1);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE carts');
            
            await expect(cartController.clearCart(user1)).rejects.toThrowError();
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledWith(user1);
        });

        test("cartNotFound", async () => {
            db.exec('DELETE FROM carts');
            
            await expect(cartController.clearCart(user1)).rejects.toThrowError(CartNotFoundError);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledWith(user1);
        });
    });

    describe("deleteAllCarts", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "deleteAllCartsDAO");
        });

        test("correctExecution", async () => {
            const result = await cartController.deleteAllCarts();

            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledWith();
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE carts');
            
            await expect(cartController.deleteAllCarts()).rejects.toThrowError();
            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledWith();
        });
    });

    describe("getAllCarts", () => {

        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "getAllCartsDAO");
        });

        test("correctExecution", async () => {
            db.exec('DELETE FROM carts WHERE id = 3');
            const result = await cartController.getAllCarts();

            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledWith();
            expect(result).toEqual([cart1, cart2]);
        });

        test("databaseError", async () => {
            db.exec('DROP TABLE carts');
            
            await expect(cartController.getAllCarts()).rejects.toThrowError();
            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledWith();
        });
    });
});
