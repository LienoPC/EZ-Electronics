import CartDAO from '../../src/dao/cartDAO';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { Cart, ProductInCart } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { CartNotFoundError, ProductInCartError, EmptyCartError, ProductNotInCartError } from '../../src/errors/cartError';
import { EmptyProductStockError, ProductNotFoundError } from '../../src/errors/productError';
import db from '../../src/db/db';
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import { DEFAULT_CIPHERS } from 'tls';


describe('CartDAO Integration Tests', () => {
    let cartDAO: CartDAO;
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

        await createAllTables();
        await createAllTriggers();

        cartDAO = new CartDAO();
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
        jest.clearAllMocks();
    });

    afterEach(async () => {
        /* await createAllTables();
        await createAllTriggers();
        await cleanup(); */
    });

    describe("getCartById", () => {
        test("emptyCart", async () => {
            db.exec('DELETE FROM product_cart WHERE cartId = 3');
            const result = await cartDAO.getCartById(3);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(new Cart("customer", true, "2024-02-18", 0, []));

            db.serialize(() => {
                db.exec('DELETE FROM product_cart');
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("oneProductCart", async () => {
            db.exec('DELETE FROM product_cart WHERE cartId = 3 AND productId = 1');
            const result = await cartDAO.getCartById(3);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(new Cart("customer", true, "2024-02-18", productInCart2.price * productInCart2.quantity, [productInCart2]));

            db.serialize(() => {
                db.exec('DELETE FROM product_cart');
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("cartWithProducts", async () => {
            const result = await cartDAO.getCartById(3);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(cart3);
        });

        test("cartNotPaid", async () => {
            await expect(cartDAO.getCartById(1)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
        });

        test("cartNotExists", async () => {
            await expect(cartDAO.getCartById(99)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
        });

        test("errorSQL_get", async () => {
            await db.exec('DROP TABLE carts'); // Simulate SQL error
            await expect(cartDAO.getCartById(3)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_all", async () => {
            await db.exec('DROP TABLE product_cart'); // Simulate SQL error
            await expect(cartDAO.getCartById(3)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });
    });

    describe("getCartByUser", () => {
        test("currentCartWithProducts", async () => {
            const result = await cartDAO.getCartByUser(user1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(cart1);
        });

        test("noCurrentCart", async () => {
            await db.exec('DELETE FROM carts WHERE id = 1');
            const result = await cartDAO.getCartByUser(user1);
            const emptyCart = new Cart(user1.username, false, nullValue, 0, []);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
            expect(result).toEqual(emptyCart);

            db.serialize(() => {
                db.exec(`DELETE FROM carts`);
                db.exec('DELETE FROM product_cart');

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("noProductInCurrentCart", async () => {
            await db.exec('DELETE FROM product_cart WHERE cartId = 1');
            const result = await cartDAO.getCartByUser(user1);
            const emptyCart = new Cart(user1.username, false, nullValue, 0, []);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(emptyCart);

            db.serialize(() => {
                db.exec('DELETE FROM product_cart');

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_get", async () => {
            await db.exec('DROP TABLE carts'); // Simulate SQL error
            await expect(cartDAO.getCartByUser(user1)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_all", async () => {
            db.exec('DROP TABLE product_cart'); // Simulate SQL error
            expect(cartDAO.getCartByUser(user1)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });
    });

    describe("addToCartDAO", () => {
        test("noCurrentCart", async () => {
            await db.exec('DELETE FROM carts');
            jest.clearAllMocks();
            const result = await cartDAO.addToCartDAO(user1, product1.model);
            expect(db.get).toBeCalledTimes(4);
            expect(db.run).toBeCalledTimes(2);
            expect(result).toBe(true);

            db.serialize(() => {
                db.exec("DELETE FROM carts");
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("currentCart_productNotPresent", async () => {
            const result = await cartDAO.addToCartDAO(user1, product1.model);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("currentCart_productPresent", async () => {
            const result = await cartDAO.addToCartDAO(user1, product2.model);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("productNotFound", async () => {
            await expect(cartDAO.addToCartDAO(user1, "Sony")).rejects.toThrowError(ProductNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("productNotAvailable", async () => {
            await db.exec('UPDATE products SET quantity = 0 WHERE id = 1');
            jest.clearAllMocks();
            await expect(cartDAO.addToCartDAO(user1, product1.model)).rejects.toThrowError(EmptyProductStockError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

            await db.exec('UPDATE products SET quantity = 20 WHERE id = 1');
        });

        test("errorSQL_first_get", async () => {
            await db.exec('DROP TABLE products');
            await expect(cartDAO.addToCartDAO(user1, product1.model)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
                db.exec("DELETE FROM product_cart");
                db.exec("DELETE FROM carts");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_second_get", async () => {
            await db.exec('DROP TABLE users');
            await expect(cartDAO.addToCartDAO(user1, product1.model)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.exec("DELETE FROM carts");
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, "password", "salt", user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, "password", "salt", user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, "password", "salt", user3.address, user3.birthdate]);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("noCurrentCart_errorSQL_second_run", async () => {
            await db.exec('DROP TABLE product_cart');
            await db.run('DELETE FROM carts');
            jest.clearAllMocks();
            await expect(cartDAO.addToCartDAO(user1, product1.model)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(4);
            expect(db.run).toBeCalledTimes(2);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("currentCart_errorSQL_get", async () => {
            await db.exec('DROP TABLE product_cart');
            jest.clearAllMocks();
            await expect(cartDAO.addToCartDAO(user1, product1.model)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });
    });

    describe("doCheckoutByUsername", () => {
        test("emptyCart", async () => {
            await db.exec('DELETE FROM product_cart');
            jest.clearAllMocks();
            await expect(cartDAO.doCheckoutByUsername(user1)).rejects.toThrowError(EmptyCartError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("loop1_time", async () => {
            await db.exec('DELETE FROM product_cart WHERE productId = 2 AND cartId = 1');
            jest.clearAllMocks();
            const result = await cartDAO.doCheckoutByUsername(user1);
            expect(db.get).toBeCalledTimes(2);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toEqual(true);
            db.serialize(() => {
                db.exec("DELETE FROM product_cart")
                db.exec("DELETE FROM carts")

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("loopN_times", async () => {
            await db.exec('UPDATE product_cart SET quantity = 3 WHERE productId = 2 AND cartId = 1');
            jest.clearAllMocks();
            const result = await cartDAO.doCheckoutByUsername(user1);
            expect(db.get).toBeCalledTimes(3);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toEqual(true);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart")

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("cartNotFound", async () => {
            await db.exec('DELETE FROM carts');
            jest.clearAllMocks();
            await expect(cartDAO.doCheckoutByUsername(user1)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec('DELETE FROM product_cart');

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("productNotAvailable", async () => {
            await db.exec('UPDATE products SET quantity = 0 WHERE id = 3');
            jest.clearAllMocks();
            await expect(cartDAO.doCheckoutByUsername(user1)).rejects.toThrowError(ProductInCartError);
            expect(db.get).toBeCalledTimes(3);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            await db.exec('UPDATE products SET quantity = 100 WHERE id = 3');
        });

        test("productQuantityNotEnough", async () => {
            await db.exec('UPDATE product_cart SET quantity = 1000 WHERE productId = 3');
            jest.clearAllMocks();
            await expect(cartDAO.doCheckoutByUsername(user1)).rejects.toThrowError(ProductInCartError);
            expect(db.get).toBeCalledTimes(3);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            await db.exec('UPDATE product_cart SET quantity = 1 WHERE productId = 3');
        });

        test("errorSQL_first_get", async () => {
            db.exec('DROP TABLE users');
            await expect(cartDAO.doCheckoutByUsername(user1)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.exec("DELETE FROM carts");
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, "password", "salt", user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, "password", "salt", user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, "password", "salt", user3.address, user3.birthdate]);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("errorSQL_all", async () => {
            db.exec('DROP TABLE product_cart');
            await expect(cartDAO.doCheckoutByUsername(user1)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });
    });

    describe("getHistoryByUsername", () => {
        beforeAll(() => {
            jest.spyOn(CartDAO.prototype, "getCartById");
        });

        test("loop0_Times", async () => {
            db.exec('DELETE FROM carts');
            const result = await cartDAO.getHistoryByUsername(user1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(0);
            expect(result).toEqual([]);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        /*test("loop1_Time", async () => {
            db.exec('DELETE FROM carts WHERE id = 2');
            const result = await cartDAO.getHistoryByUsername(user1);
            expect(db.all).toBeCalledTimes(2);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledWith(3);
            expect(result).toEqual([cart3]);

            
            db.serialize(() => {
                db.exec("DELETE FROM carts");
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("loopN_Times", async () => {
            const result = await cartDAO.getHistoryByUsername(user1);
            expect(db.all).toBeCalledTimes(3);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(2);
            expect(CartDAO.prototype.getCartById).toBeCalledWith(2);
            expect(CartDAO.prototype.getCartById).toBeCalledWith(3);

            expect(result).toEqual([cart2, cart3]);
        });*/

        test("errorSQL_all", async () => {
            db.exec('DROP TABLE carts');
            await expect(cartDAO.getHistoryByUsername(user1)).rejects.toThrowError();
            expect(db.all).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);
    
                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);
    
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });
    });

    describe("removeProductFromCartDAO", () => {
        test("productQuantityGreater1", async () => {
            await db.exec('UPDATE product_cart SET quantity = 2 WHERE cartId = 1 AND productId = 2');
            const result = await cartDAO.removeProductFromCartDAO(user1, productInCart2.model);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);
            await db.exec("UPDATE product_cart SET quantity = 1 WHERE cartId = 1 AND productId = 2");
        });

        test("productQuantity1", async () => {
            const result = await cartDAO.removeProductFromCartDAO(user1, productInCart2.model);
            expect(result).toBe(true);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(1);
        });

        test("cartNotFound", async () => {
            await db.exec('DELETE FROM carts WHERE id = 1');
            await expect(cartDAO.removeProductFromCartDAO(user1, productInCart2.model)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec('DELETE FROM carts');
                db.exec('DELETE FROM product_cart');

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);
    
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });

        });

        test("emptyCart", async () => {
            await db.exec('DELETE FROM product_cart');
            await expect(cartDAO.removeProductFromCartDAO(user1, productInCart2.model)).rejects.toThrowError(ProductNotInCartError);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("productNotInCart", async () => {
            await db.exec('DELETE FROM product_cart WHERE productId = 2');
            await expect(cartDAO.removeProductFromCartDAO(user1, productInCart2.model)).rejects.toThrowError(ProductNotInCartError);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_first_get", async () => {
            await db.exec('DROP TABLE carts');
            await expect(cartDAO.removeProductFromCartDAO(user1, product2.model)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);
    
                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);
    
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });
    });

    describe("clearCartDAO", () => {
        test("correctExecution", async () => {
            const result = await cartDAO.clearCartDAO(user1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_get", async () => {
            db.exec('DROP TABLE carts');
            await expect(cartDAO.clearCartDAO(user1)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);
    
                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);
    
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorSQL_run", async () => {
            db.exec('DROP TABLE product_cart');
            await expect(cartDAO.clearCartDAO(user1)).rejects.toThrowError();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });

        test("errorCartNotFound", async () => {
            db.exec('DELETE FROM carts');
            await expect(cartDAO.clearCartDAO(user1)).rejects.toThrow(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);
    
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });
    });

    describe("deleteAllCartsDAO", () => {
        test("correctExecution", async () => {
            const result = await cartDAO.deleteAllCartsDAO();
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);

            db.serialize(() => {
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("errorSQL_run", async () => {
            await db.exec('DROP TABLE carts'); // Simulate SQL error
            await expect(cartDAO.deleteAllCartsDAO()).rejects.toThrowError();
            expect(db.run).toBeCalledTimes(1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });
    });

    describe("getAllCartsDAO", () => {
        /*test("loop0_times", async () => {
            db.exec('DELETE FROM carts');
            const result = await cartDAO.getAllCartsDAO();
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([]);

            db.serialize(() => {
                db.exec('DELETE FROM product_cart');

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("loop1_Time", async () => {
            db.exec('DELETE FROM carts WHERE id = 2 OR id = 3');
            const result = await cartDAO.getAllCartsDAO();
            expect(db.all).toBeCalledTimes(2);
            expect(result).toEqual([cart1]);

            db.serialize(() => {
                db.exec('DELETE FROM carts');
                db.exec("DELETE FROM product_cart");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("loopN_Times", async () => {
            const result = await cartDAO.getAllCartsDAO();

            expect(db.all).toBeCalledTimes(4);
            //expect(result).toEqual([cart1, cart3, cart2]);

            db.serialize(() => {
                db.exec('DELETE FROM carts');

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });*/

        test("errorSQL_firts_all", async () => {
            db.exec('DROP TABLE carts');
            await expect(cartDAO.getAllCartsDAO()).rejects.toThrowError();
            expect(db.all).toBeCalledTimes(1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("errorSQL_second_all", async () => {
            db.exec('DROP TABLE products');
            await expect(cartDAO.getAllCartsDAO()).rejects.toThrowError();
            expect(db.all).toBeCalledTimes(4);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
                db.exec("DELETE FROM product_cart");
                db.exec("DELETE FROM carts");

                db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, 1]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, 1, cart2.paid ? 1 : 0, cart2.paymentDate]);
                db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, 1, cart3.paid ? 1 : 0, cart3.paymentDate]);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);

                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            });
        });
    });
});
