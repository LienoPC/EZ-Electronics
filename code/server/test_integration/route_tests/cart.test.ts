import { describe, test, expect, beforeEach, afterAll, beforeAll, afterEach, jest } from "@jest/globals"
import { Cart, ProductInCart, } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import request from 'supertest'
import { app } from "../../index"
import db from '../../src/db/db';
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import CartController from "../../src/controllers/cartController";

const routePath = "/ezelectronics"; //Base route path for the API
const baseURL = routePath + '/carts';

const userToObject = (user: User) => {
    return { username: user.username, name: user.name, surname: user.surname, password: "password", role: user.role }
};

const login = async (user: User) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userToObject(user))
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0])
            });
    });
};

const postUser = async (user: User) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userToObject(user))
};


describe('CartRoutes Integration Tests', () => {
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
    let emptyCart: Cart;

    let productInCart1: ProductInCart;
    let productInCart2: ProductInCart;
    let productInCart3: ProductInCart;
    let productInCart4: ProductInCart;

    let userCookie: any;

    beforeAll(async () => {

        await createAllTables();
        await createAllTriggers();

        nullValue = null;

        user1 = new User("customer", "manager", "manager", Role.CUSTOMER, nullValue, nullValue);
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
        // Empty Cart
        emptyCart = new Cart("customer", false, nullValue, 0, []);

        await postUser(user1);
        await postUser(user2);
        await postUser(user3);

        db.serialize(() => {
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
    });

    beforeEach(async () => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
        /* await createAllTables();
        await createAllTriggers();
        await cleanup(); */
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

    describe('GET /carts', () => {

        beforeAll(() => {
            jest.spyOn(CartController.prototype, "getCart");
        });

        test("currentCartWithProducts - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(cart1);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);
        });

        test("noCurrentCart - return status 200", async () => {
            db.exec('DELETE FROM carts');
            userCookie = await login(user1);
            const response = await request(app).get(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(emptyCart);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);

            db.serialize(() => {
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

        test("currentCartEmpty - return status 200", async () => {
            db.exec('DELETE FROM product_cart');
            userCookie = await login(user1);
            const response = await request(app).get(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(emptyCart);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);

            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
        });

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user1);
            const response = await request(app).get(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);


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

        test("genericErrorBis - return status 503", async () => {
            db.exec('DROP TABLE product_cart');
            userCookie = await login(user1);
            const response = await request(app).get(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);


            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.exec("DELETE FROM carts");
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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.getCart).toBeCalledTimes(0);
        });
    });

    describe('POST /carts', () => {

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "addToCart");
        });

        test("productNotAlreadyPresent - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product1.model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);

            db.exec("DELETE FROM product_cart");

            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
        });

        test("productAlreadyPresent - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product2.model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product2.model);

            db.exec("DELETE FROM product_cart");

            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
        });

        test("noCurrentCart - return status 200", async () => {
            db.exec("DELETE FROM carts");
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product2.model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product2.model);

            db.serialize(() => {
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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product1.model });

            expect(response.status).toBe(401);
            expect(CartController.prototype.addToCart).toBeCalledTimes(0);
        });

        test("requestError - return status 422", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: "" });

            expect(response.status).toBe(422);
            expect(CartController.prototype.addToCart).toBeCalledTimes(0);
        });

        test("productNotFound - return status 404", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: "iPod" });

            expect(response.status).toBe(404);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, "iPod");
        });

        test("productNotAvailable - return status 409", async () => {
            db.exec('UPDATE products SET quantity = 0 WHERE id = 1');
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product1.model });

            expect(response.status).toBe(409);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);
            db.run('UPDATE products SET quantity = ? WHERE id = 1', [product1.quantity]);
        });

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE products');
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product1.model });

            expect(response.status).toBe(503);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);

            })
        });

        test("genericError bis - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product1.model });

            expect(response.status).toBe(503);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);

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

    describe('PATCH /carts', () => {

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "checkoutCart");
        });

        test("correctExecution - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.exec("DELETE FROM carts");
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

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "carts" ("id" INTEGER NOT NULL UNIQUE, "customerId" INTEGER NOT NULL, "paid" INTEGER NOT NULL DEFAULT 0, "paymentDate" TEXT, "total" REAL DEFAULT 0.0 CHECK("total" >= 0), FOREIGN KEY("customerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, PRIMARY KEY("id" AUTOINCREMENT))`);

                db.exec("DELETE FROM carts");
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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user2);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(0);
        });

        test("noCurrentCart - return status 404", async () => {
            db.exec('DELETE FROM carts WHERE id = 1');
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);

            db.serialize(() => {
                db.exec("DELETE FROM carts");
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

        test("currentCartEmpty - return status 400", async () => {
            db.exec('DELETE FROM product_cart');
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(400);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
            await db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
        });

        test("productNotAvailable - return status 409", async () => {
            db.exec('UPDATE products SET quantity = 0 WHERE id = 2');
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(409);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);

            db.run('UPDATE products SET quantity = ? WHERE id = 2', [product2.quantity]);
        });

        test("productRequestToHigh - return status 409", async () => {
            db.exec('UPDATE products SET quantity = 2 WHERE id = 2');
            db.exec('UPDATE product_cart SET quantity = 5 WHERE productId = 2');
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(409);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);

            db.run('UPDATE products SET quantity = ? WHERE id = 2', [product2.quantity]);
            db.exec('UPDATE product_cart SET quantity = 1 WHERE productId = 2');

        });
    });

    describe('GET /carts/history', () => {

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getCustomerCarts");
        });

        test("correctExecution - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + '/history').set('Cookie', userCookie);

            expect(response.status).toBe(200);
            //expect(response.body).toEqual([cart2, cart3]);
            expect(CartController.prototype.getCustomerCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getCustomerCarts).toBeCalledWith(user1);
        });

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + '/history').set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.getCustomerCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getCustomerCarts).toBeCalledWith(user1);


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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(baseURL + '/history').set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.getCustomerCarts).toBeCalledTimes(0);
        });
    });

    describe('DELETE /carts/products/:model', () => {

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "removeProductFromCart");
        });

        test("correctExecutionRemoveProduct - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);

            db.serialize(() => {
                db.exec("DELETE FROM carts");
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

        test("correctExecutionUpdateProduct - return status 200", async () => {
            db.run("UPDATE product_cart SET quantity = 2 WHERE productId = ?", [2])

            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);

            db.serialize(() => {
                db.exec("DELETE FROM carts");
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

        test("productNotInCart - return status 404", async () => {
            db.exec('DELETE FROM product_cart');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
            db.serialize(() => {
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE product_cart');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.exec("DELETE FROM carts");
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

        test("genericError bis - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user2);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(0);
        });

        test("noCurrentCart - return status 404", async () => {
            db.exec('DELETE FROM carts');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
            db.serialize(() => {
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

        test("emptyCurrentCart - return status 404", async () => {
            db.exec('DELETE FROM product_cart');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/products/' + product2.model).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
            db.serialize(() => {
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });
    });

    describe('DELETE /carts/current', () => {

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "clearCart");
        });

        test("correctExecution - return status 200", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/current').set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
            db.serialize(() => {
                db.exec("DELETE FROM carts");
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

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/current').set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
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

        test("genericError bis - return status 503", async () => {
            db.exec('DROP TABLE product_cart');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/current').set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.exec("DELETE FROM carts");
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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user2);
            const response = await request(app).delete(baseURL + '/current').set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.clearCart).toBeCalledTimes(0);
        });

        test("noCurrentCart - return status 404", async () => {
            db.exec('DELETE FROM carts');
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + '/current').set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
        });
    });

    describe('DELETE /carts', () => {

        beforeAll(() => {
            jest.spyOn(CartController.prototype, "deleteAllCarts");
        });

        test("correctExecutionAdmin - return status 200", async () => {
            userCookie = await login(user3);
            const response = await request(app).delete(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toBeCalledWith();

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

        test("correctExecutionManager - return status 200", async () => {
            userCookie = await login(user2);
            const response = await request(app).delete(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toBeCalledWith();

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

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user3);
            const response = await request(app).delete(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toBeCalledWith();

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

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(0);
        });
    });

    describe('GET /carts/all', () => {

        beforeEach(() => {
            jest.spyOn(CartController.prototype, "getAllCarts");
        });

        test("correctExecution - return status 200", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(baseURL + '/all').set('Cookie', userCookie);

            expect(response.status).toBe(200);
            //expect(response.body).toEqual([cart1, cart2, cart3]);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toBeCalledWith();
        });

        test("genericError - return status 503", async () => {
            db.exec('DROP TABLE carts');
            userCookie = await login(user2);
            const response = await request(app).get(baseURL + '/all').set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toBeCalledWith();

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

        test("genericError bis - return status 503", async () => {
            db.exec('DROP TABLE product_cart');
            userCookie = await login(user2);
            const response = await request(app).get(baseURL + '/all').set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toBeCalledWith();

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "product_cart" ("productId" INTEGER NOT NULL, "cartId" INTEGER NOT NULL, "quantity" INTEGER NOT NULL CHECK("quantity" > 0), PRIMARY KEY("productId","cartId"), FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("cartId") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 2, 5]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [1, 3, 2]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 3, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [2, 1, 1]);
                db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [3, 1, 1]);
            })
        });

        test("userNotAllowed - return status 401", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + '/all').set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(0);
        });
    });
});
