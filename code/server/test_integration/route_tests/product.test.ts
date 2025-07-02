import { describe, test, expect, beforeEach, afterAll, beforeAll, afterEach, jest } from "@jest/globals"
import { Product, Category } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import ProductDAO from "../../src/dao/productDAO";
import request from 'supertest'
import { app } from "../../index"
import db from '../../src/db/db';
import { Database } from "sqlite3";
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import ProductController from "../../src/controllers/productController";
import { ProductNotFoundError } from "../../src/errors/productError";

const routePath = "/ezelectronics"; //Base route path for the API
const baseURL = routePath + '/products';

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


describe('ProductRoutes Integration Tests', () => {
    let nullValue: any;

    let user1: User;
    let user2: User;
    let user3: User;

    let product1: Product;
    let product2: Product;
    let product3: Product;
    let product4: Product;
    let product5: Product;
    let product6: Product;
    let product7: Product;

    let userCookie: any;

    beforeAll(async () => {
        nullValue = null;

        await createAllTables();
        await createAllTriggers();

        user1 = new User("customer", "manager", "manager", Role.CUSTOMER, nullValue, nullValue);
        user2 = new User("manager", "manager", "manager", Role.MANAGER, nullValue, nullValue);
        user3 = new User("admin", "admin", "admin", Role.ADMIN, nullValue, nullValue);

        product1 = new Product(100.36, "iPhone 13", Category.SMARTPHONE, "2020-02-23", "Descrizione", 20);
        product2 = new Product(2500, "LG TV 55", Category.APPLIANCE, "2024-02-14", "Descrizione", 5);
        product3 = new Product(860.35, "Thinkpad E14", Category.LAPTOP, "2015-03-24", "Descrizione", 100);
        product4 = new Product(60.35, "Motorola", Category.SMARTPHONE, "2010-02-05", "Descrizione", 10);
        product5 = new Product(60.35, " ", Category.SMARTPHONE, "2010-02-05", "Descrizione", 10); //modello vuoto
        product6 = new Product(600.35, "Samsung", Category.SMARTPHONE, "2010-02-05", "Descrizione", 10); //prodotto non trovato
        product7 = new Product(100.36, "iPhone 6", Category.SMARTPHONE, "2018-02-23", "Descrizione", 0); //non disponibile 

        await postUser(user1);
        await postUser(user2);
        await postUser(user3);

        db.serialize(() => {
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);
        })
    });

    beforeEach(async () => {
        jest.clearAllMocks();
    });

    afterEach(async () => {
/*         await createAllTables();
        await createAllTriggers();
        await cleanup();
        jest.clearAllMocks(); */
        jest.clearAllMocks();

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

    describe('POST /', () => {
        beforeAll(() => {
            jest.spyOn(ProductController.prototype, "registerProducts");
        });

        test("Corretto inserimento Smartphone", async () => {
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product4);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product4.model, product4.category, product4.quantity, product4.details, product4.sellingPrice, product4.arrivalDate);
            db.run("DELETE FROM products WHERE model = ?", [product4.model]);
        });

        test("Corretto inserimento Laptop", async () => {
            db.exec("DELETE FROM products WHERE model = 'Thinkpad E14'")
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product3);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product3.model, product3.category, product3.quantity, product3.details, product3.sellingPrice, product3.arrivalDate);
        });

        test("Corretto inserimento Appliance", async () => {
            db.exec("DELETE FROM products WHERE model = 'LG TV 55'")
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product2);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product2.model, product2.category, product2.quantity, product2.details, product2.sellingPrice, product2.arrivalDate);
            //db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
        });

        test("parametri non validi", async () => {
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: null, category: product1.category, quantity: product1.quantity, details: product1.details, sellingPrice: product1.sellingPrice, arrivalDate: product1.arrivalDate });

            expect(response.status).toBe(422);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0);
            expect(ProductController.prototype.registerProducts);
        });

        test("prodotto già inserito", async () => {
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product1);

            expect(response.status).toBe(409);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate);
        });

        
        test("dateNotPresent", async () => {

            let productP = product4;
            productP.arrivalDate = null;
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(productP);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product4.model, product4.category, product4.quantity, product4.details, product4.sellingPrice, null);
        });

        test("genericError ", async () => {
            db.exec('DROP TABLE products');
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product1);

            expect(response.status).toBe(503);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate);
        
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            })
        });

        test("userNotAllowed", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product1);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0);
        });

        test("requestError", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send(product5);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(0);
        });

        test("dateError", async () => {
            userCookie = await login(user2);
            const response = await request(app).post(baseURL).set('Cookie', userCookie).send({ model: product4.model, category: product4.category, quantity: product4.quantity, details: product4.details, sellingPrice: product4.sellingPrice, arrivalDate: "2100-06-25" });

            expect(response.status).toBe(400);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledTimes(1);
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(product4.model, product4.category, product4.quantity, product4.details, product4.sellingPrice, "2100-06-25");
        })
    });

    describe('PATCH /:model', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "changeProductQuantity");
        });

        test("correctExecution", async () => {

            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product1.model}`).set('Cookie', userCookie).send({ quantity: 10, changeDate: "2024-06-13" });

            expect(response.status).toBe(200);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledWith(product1.model, 10, "2024-06-13");
            expect(response.body.quantity).toBe(30);

            db.serialize(() => {
                db.exec("DELETE FROM products");
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            });
        });

        test("correctExecutionDateNotPresent", async () => {

            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product1.model}`).set('Cookie', userCookie).send({ quantity: 10, changeDate: null });

            expect(response.status).toBe(200);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledWith(product1.model, 10, null);
            expect(response.body.quantity).toBe(30);

            db.serialize(() => {
                db.exec("DELETE FROM products");
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            });
        });

        test("genericError", async () => {
            db.exec('DROP TABLE products');
            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product1.model}`).set('Cookie', userCookie).send({ quantity: 10, changeDate: "2024-06-13" });

            expect(response.status).toBe(503);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledWith(product1.model, 10, "2024-06-13");

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            })
        });

        test("userNotAllowed ", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(0);
        });

        test("productNotAvailable", async () => {
            userCookie = await login(user2);
            const model = "sci";
            const newQuantity = 10;
            const changeDate = "2024-06-13";

            const response = await request(app)
                .patch(`${baseURL}/${model}`)
                .set('Cookie', userCookie)
                .send({ quantity: newQuantity, changeDate: changeDate });

            expect(response.status).toBe(404);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledWith(model, 10, "2024-06-13");
        });

        test("wrongDate - before arrivalDate", async () => {
            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product1.model}`).set('Cookie', userCookie).send({ quantity: 10, changeDate: "2000-06-13" });

            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledWith(product1.model, 10, "2000-06-13");
        });

        test("wrongDate - after current date", async () => {
            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product1.model}`).set('Cookie', userCookie).send({ quantity: 10, changeDate: "2100-06-13" });

            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledTimes(1);
            expect(ProductController.prototype.changeProductQuantity).toBeCalledWith(product1.model, 10, "2100-06-13");
        });
    });

    describe('PATCH /:model/sell', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "sellProduct");
        });

        test("correctExecution", async () => {
            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product1.model}/sell`).set('Cookie', userCookie).send({ quantity: 10, sellingDate: "2024-06-13" });

            expect(response.status).toBe(200);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toBeCalledWith(product1.model, 10, "2024-06-13");
            expect(response.body.quantity).toBe(10);
            db.run("UPDATE products SET quantity = quantity + ? WHERE model = ?", [10, product1.model]);
        });

        test("productNotAvailable", async () => {

            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product7.model}/sell`).set('Cookie', userCookie).send({ quantity: 10, sellingDate: "2024-06-13" });

            expect(response.status).toBe(409);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toBeCalledWith(product7.model, 10, "2024-06-13");
        });

        test("invalidQuantity", async () => {
            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product7.model}/sell`).set('Cookie', userCookie).send({ quantity: -5, sellingDate: "2024-06-13" });

            expect(response.status).toBe(422);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(0);
        });

        test("userNotAllowed ", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(`${baseURL}/${product7.model}/sell`).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(0);
        });

        test("wrongDate - date before arrivalDate", async () => {
            userCookie = await login(user2);
            const model = " ";
            const newQuantity = 10;
            const sellingDate = "2000-06-13";

            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product7.model}/sell`).set('Cookie', userCookie).send({ quantity: newQuantity, sellingDate: sellingDate });

            expect(response.status).toBe(400);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toBeCalledWith(product7.model, newQuantity, sellingDate);
        });

        test("wrongDate - date after current date", async () => {
            userCookie = await login(user2);
            const newQuantity = 10;
            const sellingDate = "2100-06-13";

            userCookie = await login(user2);
            const response = await request(app).patch(`${baseURL}/${product7.model}/sell`).set('Cookie', userCookie).send({ quantity: newQuantity, sellingDate: sellingDate });

            expect(response.status).toBe(400);
            expect(ProductController.prototype.sellProduct).toBeCalledTimes(1);
            expect(ProductController.prototype.sellProduct).toBeCalledWith(product7.model, newQuantity, sellingDate);
        });
    });

    describe('GET /', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "getProducts");
        });

        test("getAllProducts", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}`).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual([product1, product2, product3, product7]);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1);
        });

        test("getProductsByCategory", async () => {
            const category = "Smartphone";

            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}?grouping=category&category=${category}`).set('Cookie', userCookie);


            expect(response.status).toBe(200);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getProducts).toBeCalledWith("category", category, undefined);
        });

        test("getProductsByModel", async () => {
            const model = "iPhone 13";

            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}?grouping=model&model=${model}`).set('Cookie', userCookie);


            expect(response.status).toBe(200);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getProducts).toBeCalledWith("model", undefined, model);
        });

        test("notLoggedIn", async () => {
            const response = await request(app).get(`${baseURL}`);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.getProducts).not.toBeCalled();
        });

        test("notAdminOrManager", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(`${baseURL}`).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.getProducts).not.toBeCalled();
        });

        test("invalidGrouping", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}?grouping=invalid`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).not.toBeCalled();
        });

        test("invalidCategory", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}?grouping=category&category=null`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).not.toBeCalled();
        });

        test("invalidModel", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}?grouping=model`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getProducts).toBeCalledWith("model", undefined, undefined);
        });

        test("Product not exists", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}?grouping=model&model=ASDFR`).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(ProductController.prototype.getProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getProducts).toBeCalledWith("model", undefined, "ASDFR");
        });
    });

    describe('GET /available', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "getAvailableProducts");
        });

        test("getAllAvailableProducts", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available`).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledWith(undefined, undefined, undefined);
        });

        test("getAvailableProductsByCategory", async () => {
            const category = "Smartphone";

            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=category&category=${category}`).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledWith("category", category, undefined);
        });

        test("getAvailableProductsByModel", async () => {

            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=model&model=${product1.model}`).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledWith("model", undefined, product1.model);
        });

        test("notLoggedIn", async () => {
            const response = await request(app).get(`${baseURL}/available`);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.getAvailableProducts).not.toBeCalled();
        });

        test("invalidGrouping", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=invalid`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(0);
        });

        test("invalidCategory", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=category&category=null`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(0);
        });

        test("invalidModel", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=model`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
        });

        test("invalidGroupingCategory", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=model&category=Laptop`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
        });

        test("invalidNotGroupingCategory", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?&category=Laptop`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
        });

        test("invalidNotGroupingModel", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?&category=Laptop`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
        });

        test("invalidGroupingModel", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?&grouping=category&category=Laptop&model=Sony`).set('Cookie', userCookie);

            expect(response.status).toBe(422);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
        });

        test("genericError", async () => {
            db.exec('DROP TABLE products');
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available`).set('Cookie', userCookie);

            expect(response.status).toBe(503);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledWith(undefined, undefined, undefined);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            })
        });

        test("Product not exists", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(`${baseURL}/available?grouping=model&model=ASDFR`).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledTimes(1);
            expect(ProductController.prototype.getAvailableProducts).toBeCalledWith("model", undefined, "ASDFR");
        });
    });


    describe('DELETE /', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "deleteAllProducts");
            jest.clearAllMocks();
        });

        test("correctExecution", async () => {
            userCookie = await login(user2);
            const response = await request(app).delete(`${baseURL}`).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteAllProducts).toBeCalledTimes(1);
            db.serialize(() => {
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            })
        });

        test("notLoggedIn", async () => {
            const response = await request(app).delete(`${baseURL}`);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.deleteAllProducts).not.toBeCalled();
        });

        test("notAdminOrManager", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(`${baseURL}`).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.deleteAllProducts).not.toBeCalled();
        });
    });


    describe('DELETE /:model', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "deleteProduct");
            jest.clearAllMocks();
        });

        test("correctExecution", async () => {
            userCookie = await login(user2);
            const response = await request(app).delete(`${baseURL}/${product1.model}`).set('Cookie', userCookie);

            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteProduct).toBeCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toBeCalledWith(product1.model);

            db.serialize(() => {
                db.exec(`DELETE FROM products`);

                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);     
            })
        });

        test("notLoggedIn", async () => {
            const response = await request(app).delete(`${baseURL}`);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.deleteProduct).not.toBeCalled();
        });

        test("notAdminOrManager", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(`${baseURL}/${product1.model}`).set('Cookie', userCookie);

            expect(response.status).toBe(401);
            expect(ProductController.prototype.deleteProduct).not.toBeCalled();
        });

        test("productNotAvailable", async () => {
            jest.spyOn(ProductController.prototype, "deleteProduct").mockImplementation(() => Promise.reject(new ProductNotFoundError()));

            userCookie = await login(user2);
            const response = await request(app).delete(`${baseURL}/${product7.model}`).set('Cookie', userCookie);

            expect(response.status).toBe(404);
            expect(ProductController.prototype.deleteProduct).toBeCalledTimes(1);
            expect(ProductController.prototype.deleteProduct).toBeCalledWith(product7.model);
        });
    });

});



