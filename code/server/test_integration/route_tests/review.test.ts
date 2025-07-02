import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { ProductReview } from "../../src/components/review";
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import { Cart, ProductInCart } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { Database } from "sqlite3";
import db from '../../src/db/db';
import request from 'supertest'
import { app } from "../../index"
import dayjs from "dayjs";
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import { assert, error } from "console"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError";




const routePath = "/ezelectronics"; //Base route path for the API
const baseURL = routePath + '/reviews';


const userToObject = (user: User) => {
    return { username: user.username, name: user.name, surname: user.surname, password: "password", role: user.role }
};


const reviewToObject = (review: ProductReview, id: number, productId: number, userId: number) => {
    return { date: review.date, id: id, productId: productId, userId: userId, comment: review.comment, score: review.score }
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

let reviewController: ReviewController;
let nullValue: any;

let user1: User;
let user2: User;
let user3: User;
let user4: User;
let user5: User;



let user1Id: any;
let user2Id: any;
let user3Id: any;
let user4Id: any;
let user5Id: any;


let product1: Product;
let product2: Product;
let product3: Product;
let product1Id: any;
let product2Id: any;
let product3Id: any;

let cart1: Cart;
let cart2: Cart;
let cart3: Cart;

let productInCart1: ProductInCart;
let productInCart2: ProductInCart;
let productInCart3: ProductInCart;
let productInCart4: ProductInCart;

let review1: ProductReview;
let review2: ProductReview;
let review3: ProductReview;
let review4: ProductReview;
let review5: ProductReview;

let wrongProductReview: ProductReview;
let reviewArray: Array<ProductReview> = new Array();

let userCookie: any;

const sqlite = require("sqlite3")


describe("ReviewRoute Integration Test", () => {


    beforeAll(async () => {
        await createAllTables();
        await createAllTriggers();

        reviewController = new ReviewController();
        nullValue = null;

        user1 = new User("customer1", "customer1", "customer1", Role.CUSTOMER, nullValue, nullValue);
        user2 = new User("customer2", "customer2", "customer2", Role.CUSTOMER, nullValue, nullValue);
        user3 = new User("customer3", "customer3", "customer3", Role.CUSTOMER, nullValue, nullValue);
        user4 = new User("manager", "manager", "manager", Role.MANAGER, nullValue, nullValue);
        user5 = new User("admin", "admin", "admin", Role.ADMIN, nullValue, nullValue);

        user1Id = 1
        user2Id = 2
        user3Id = 3
        user4Id = 4
        user5Id = 5

        product1 = new Product(100.36, "iPhone 13", Category.SMARTPHONE, "2020-02-23", "Un bellissimo smartphone", 20);
        product2 = new Product(2500, "LG TV 55", Category.APPLIANCE, "2024-02-14", "Una bellissima tv", 5);
        product3 = new Product(860.35, "Thinkpad E14", Category.LAPTOP, "2015-03-24", "Un bellissimo laptop", 100);
        product1Id = 1
        product2Id = 2
        product3Id = 3

        productInCart1 = new ProductInCart(product1.model, 2, product1.category, product1.sellingPrice);
        productInCart2 = new ProductInCart(product2.model, 1, product2.category, product2.sellingPrice);
        productInCart3 = new ProductInCart(product3.model, 5, product3.category, product3.sellingPrice);
        productInCart4 = new ProductInCart(product3.model, 1, product3.category, product3.sellingPrice);

        review1 = new ProductReview(product1.model, user1.username, 4, "2024-05-03", "Recensione1")
        review2 = new ProductReview(product1.model, user2.username, 3, "2023-03-12", "Recensione2")
        review3 = new ProductReview(product1.model, user3.username, 5, "2024-01-23", "Recensione3")
        review4 = new ProductReview(product2.model, user1.username, 5, dayjs().format("YYYY-MM-DD"), "Recensione4")
        review5 = new ProductReview(product3.model, user2.username, 5, dayjs().format("YYYY-MM-DD"), "Recensione5")

        wrongProductReview = new ProductReview("Wrong model", user1.username, 5, "2022-06-18", "Recensione5")
        reviewArray.push(review1)
        reviewArray.push(review2)
        reviewArray.push(review3)


        // Current Cart
        cart1 = new Cart("customer", false, nullValue, productInCart2.price * productInCart2.quantity + productInCart4.price * productInCart4.quantity, [productInCart2, productInCart4]);
        // History
        cart2 = new Cart("customer", true, "2020-06-12", productInCart3.price * productInCart3.quantity, [productInCart3]);
        cart3 = new Cart("customer", true, "2024-02-18", productInCart1.price * productInCart1.quantity + productInCart2.price * productInCart2.quantity, [productInCart1, productInCart2]);


        await postUser(user1);
        await postUser(user2);
        await postUser(user3);
        await postUser(user4);
        await postUser(user5);

        db.serialize(() => {
            // insert products
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product1Id, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product2Id, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product3Id, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
            // insert carts
            db.run('INSERT INTO carts (id, customerId) VALUES (?, ?)', [1, user1Id]);
            db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [2, user1Id, cart2.paid ? 1 : 0, cart2.paymentDate]);
            db.run('INSERT INTO carts (id, customerId, paid, paymentDate) VALUES (?, ?, ?, ?)', [3, user1Id, cart3.paid ? 1 : 0, cart3.paymentDate]);
            // insert products in cart
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [product3Id, 2, 5]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [product1Id, 3, 2]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [product2Id, 3, 1]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [product2Id, 1, 1]);
            db.run('INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)', [product3Id, 1, 1]);
            // insert reviews
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");
    });

    afterAll(async () => {
        /* await createAllTables();
        await createAllTriggers(); */
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

    beforeEach(async () => {
        jest.clearAllMocks();
    });


    afterEach(async () => {
        /*         await createAllTables();
                await createAllTriggers(); */
        //await cleanup();

    });



    describe("POST review/:model test", () => {

        beforeAll(() => {
            jest.spyOn(ReviewController.prototype, "addReview");
        });


        test("Correct insertion case (200 status code)", async () => {
            userCookie = await login(user2);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: review4.score, comment: review4.comment }).set("Cookie", userCookie)

            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
                review4.model,
                user2,
                review4.score,
                review4.comment
            )

            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })



        test("Not existing product (404 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + wrongProductReview.model).send({ score: wrongProductReview.score, comment: wrongProductReview.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(404)

            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
                wrongProductReview.model,
                user1,
                wrongProductReview.score,
                wrongProductReview.comment
            )
        })


        test("Product already reviewed (409 status code)", async () => {
            userCookie = await login(user1);
            const response = (await request(app).post(baseURL + '/' + review1.model).send({ score: wrongProductReview.score, comment: wrongProductReview.comment }).set("Cookie", userCookie))
            expect(response.status).toBe(409)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
                review1.model,
                user1,
                wrongProductReview.score,
                wrongProductReview.comment
            )
        })

        test("User not logged in (401 status code)", async () => {
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: review4.score, comment: review4.comment })
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })


        test("User not customer (401 status code)", async () => {
            userCookie = await login(user4);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: review4.score, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })

        test("Input body score valid == 5(200 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: 5, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        test("Input body score valid == 1(200 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: 1, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        test("Input body score not valid > 5(422 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: 6, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(422)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })


        test("Input body score not valid < 1(422 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: 0, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(422)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })


        test("Input body comment null not valid (422 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: 0, comment: null }).set("Cookie", userCookie)
            expect(response.status).toBe(422)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(0)
        })

        test("Internal server error (db.run reviews) (503 status code)", async () => {
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: review4.score, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
                review4.model,
                user1,
                review4.score,
                review4.comment
            )

            await db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        /*

        test("Internal server error (db.get products) (503 status code)", async () => {
            await db.exec('DROP TABLE products'); // Simulate SQL error
            userCookie = await login(user1);
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: review4.score, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
                review4.model,
                user1,
                review4.score,
                review4.comment
            )
            db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product1Id, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product2Id, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product3Id, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
            
            db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
            
        })
            
        test("Internal server error (db.get user) (503 status code)", async () => {
            userCookie = await login(user1);
            await db.exec('DROP TABLE users'); // Simulate SQL error
            const response = await request(app).post(baseURL + '/' + review4.model).send({ score: review4.score, comment: review4.comment }).set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.addReview).toHaveBeenCalledWith(
                review4.model,
                user1,
                review4.score,
                review4.comment
            )

            db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
            await postUser(user1);
            await postUser(user2);
            await postUser(user3);
            await postUser(user4);
            await postUser(user5);
            db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product1Id, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product2Id, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product3Id, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
            
            db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
            
        })


        */

    })




    describe("GET review/:model test", () => {

        beforeAll(() => {
            jest.spyOn(ReviewController.prototype, "getProductReviews");
        });

        test("Correct resolve test (single reviews) (200 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/" + review5.model).set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual([review5])
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(
                review5.model
            )
        })

        test("Correct resolve test (multiple reviews) (200 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/" + review1.model).set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual(reviewArray)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(
                review1.model
            )
        })


        test("No reviews test (200 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/" + review4.model).set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual([])
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(
                review4.model
            )
        })

        test("User not logged in (401 status code)", async () => {
            const response = await request(app).get(baseURL + "/" + review4.model)
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(0)
        })



        test("Internal server error (503 status code)", async () => {
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/" + review1.model).set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.getProductReviews).toHaveBeenCalledWith(
                review1.model
            )

            await db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })



    })



    describe("DELETE review/:model test", () => {


        beforeAll(() => {
            jest.spyOn(ReviewController.prototype, "deleteReview");
        });

        test("Correct resolve test (200 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/" + review1.model).set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
                review1.model,
                user1,
            )
            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })



        test("No reviews test (404 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/" + review4.model).set("Cookie", userCookie)
            expect(response.status).toBe(404)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
                review4.model,
                user1,
            )
        })

        test("Product not found test(404 status code)", async () => {
            userCookie = await login(user1);

            const response = await request(app).delete(baseURL + "/" + wrongProductReview.model).set("Cookie", userCookie)
            expect(response.status).toBe(404)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
                wrongProductReview.model,
                user1,
            )
        })

        test("User not logged in (401 status code)", async () => {
            const response = await request(app).delete(baseURL + "/" + review1.model)
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(0)
        })

        test("User not customer (401 status code)", async () => {
            userCookie = await login(user4);
            const response = await request(app).delete(baseURL + "/" + review1.model).set("Cookie", userCookie)
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(0)
        })

        test("Internal server error", async () => {
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/" + review1.model).set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReview).toHaveBeenCalledWith(
                review1.model,
                user1
            )

            await db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])

        })

    })




    describe("DELETE review/:model/all test", () => {

        beforeAll(() => {
            jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct");
        });

        test("Correct resolve test (Manager) (200 status code)", async () => {

            userCookie = await login(user4);

            const response = await request(app).delete(baseURL + "/" + review1.model + "/all").set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
                review1.model,
            )
            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        test("Correct resolve test (Admin) (200 status code)", async () => {

            userCookie = await login(user5);

            const response = await request(app).delete(baseURL + "/" + review1.model + "/all").set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
                review1.model,
            )
            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        test("User not logged in (401 status code)", async () => {
            const response = await request(app).delete(baseURL + "/" + review1.model + "/all")
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)
        })

        test("User not admin or manager (401 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/" + review1.model + "/all").set("Cookie", userCookie)
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)
        })


        test("Product not found test(404 status code)", async () => {
            userCookie = await login(user4);
            const response = await request(app).delete(baseURL + "/" + wrongProductReview.model + "/all").set("Cookie", userCookie)
            expect(response.status).toBe(404)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
                wrongProductReview.model
            )
        })

        test("Internal server error", async () => {
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            userCookie = await login(user4);
            const response = await request(app).delete(baseURL + "/" + review1.model + "/all").set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
            expect(ReviewController.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
                review1.model
            )
            await db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])

        })
    })


    describe("DELETE review/", () => {


        beforeAll(() => {
            jest.spyOn(ReviewController.prototype, "deleteAllReviews");
        });

        test("Correct resolve test (200 status code)", async () => {

            userCookie = await login(user4);
            const response = await request(app).delete(baseURL + "/").set("Cookie", userCookie)
            expect(response.status).toBe(200)
            expect(response.body).toEqual({})
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)
            await db.exec("DELETE FROM reviews");
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])
        })

        test("User not logged in (401 status code)", async () => {
            const response = await request(app).delete(baseURL + "/")
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(0)
        })

        test("User not admin or manager (401 status code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/").set("Cookie", userCookie)
            expect(response.status).toBe(401)
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(0)
        })

        test("Internal server error", async () => {
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            userCookie = await login(user4);
            const response = await request(app).delete(baseURL + "/").set("Cookie", userCookie)
            expect(response.status).toBe(503)
            expect(ReviewController.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)

            await db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);

            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            await db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [4, review5.score, review5.date, review5.comment, user2Id, product3Id])

        })


    })


})