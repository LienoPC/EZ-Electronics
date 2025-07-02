import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { ProductReview } from "../../src/components/review";
import ReviewController from "../../src/controllers/reviewController"
import ReviewDAO from "../../src/dao/reviewDAO";
import ProductDAO from "../../src/dao/productDAO";
import { Cart, ProductInCart } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import db from '../../src/db/db';
import dayjs from "dayjs";
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError";


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
let wrongProductReview: ProductReview;
let reviewArray: Array<ProductReview> = new Array();



const sqlite = require("sqlite3")


describe("ReviewController Integration Test", () => {
    

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
        review4 = new ProductReview(product2.model, user1.username, 5, "2024-02-18", "Recensione4")
        wrongProductReview = new ProductReview("Wrong model", user1.username, 5, "2022-06-18", "Recensione5")
        reviewArray.push(review1)
        reviewArray.push(review2)
        reviewArray.push(review3)


        // Current Cart
        cart1 = new Cart("customer", false, nullValue, productInCart2.price * productInCart2.quantity + productInCart4.price * productInCart4.quantity, [productInCart2, productInCart4]);
        // History
        cart2 = new Cart("customer", true, "2020-06-12", productInCart3.price * productInCart3.quantity, [productInCart3]);
        cart3 = new Cart("customer", true, "2024-02-18", productInCart1.price * productInCart1.quantity + productInCart2.price * productInCart2.quantity, [productInCart1, productInCart2]);

        await cleanup();
        db.serialize(() => {
            // insert users
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [user1Id, user1.username, user1.name, user1.surname, user1.role, "password", "salt", user1.address, user1.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [user2Id, user2.username, user2.name, user2.surname, user2.role, "password", "salt", user2.address, user2.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [user3Id, user3.username, user3.name, user3.surname, user3.role, "password", "salt", user3.address, user3.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [user4Id, user4.username, user4.name, user4.surname, user4.role, "password", "salt", user4.address, user4.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [user5Id, user5.username, user5.name, user5.surname, user5.role, "password", "salt", user5.address, user5.birthdate]);

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
            
       
        })
    
    });

    afterAll(async () => {
        /*
        await createAllTables();
        await createAllTriggers();*/
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
       
    });

    
    afterEach(async () => {
        jest.clearAllMocks();

    });
    
    
    describe("addReview tests", () => {
        
        beforeAll(() => {
            jest.spyOn(ReviewDAO.prototype, "addReview");
            jest.spyOn(ProductDAO.prototype, "exist");
        });

        test("Correct result test", async () =>{
            const response = await reviewController.addReview(review4.model, user1, review4.score, review4.comment)

            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(
                review4.model, user1.username, review4.score, review4.comment, dayjs().format("YYYY-MM-DD"))
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review4.model
            )
            expect(response).toBe(undefined)

            await db.serialize(() => {
                db.exec("DELETE FROM reviews");
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
        
        })

        test("Existing review error test", async () =>{
            const err = new ExistingReviewError()
            await expect(reviewController.addReview(review1.model, user1, review1.score, review1.comment))
            .rejects
            .toThrow(err)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(
                review1.model,
                review1.user,
                review1.score,
                review1.comment,
                dayjs().format("YYYY-MM-DD"))
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )

        })

        test("Product not exist error test", async () =>{
            const err = new ProductNotFoundError()
            await expect(reviewController.addReview(wrongProductReview.model, user1, review1.score, review1.comment))
            .rejects
            .toThrow(err)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(0)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                wrongProductReview.model
            )
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)

        })


        test("Internal server error test (AddReviewDAO)", async () =>{
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            await expect(reviewController.addReview(review4.model, user1, review4.score, review4.comment))
            .rejects
            .toThrow()
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledWith(
                review4.model,
                review4.user,
                review4.score,
                review4.comment,
                dayjs().format("YYYY-MM-DD"))
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review4.model
            )
            
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
            
        })

        test("Internal server error test (ProductDAO)", async () =>{
            await db.exec('DROP TABLE products'); // Simulate SQL error
            await expect(reviewController.addReview(review4.model, user1, review4.score, review4.comment))
            .rejects
            .toThrow()
            expect(ReviewDAO.prototype.addReview).toHaveBeenCalledTimes(0)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review4.model
            )

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product1Id, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product2Id, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product3Id, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
        })
        

    })

    

    describe("getProductReviews", () => {
        
        beforeAll(() => {
            jest.spyOn(ReviewDAO.prototype, "getProductReviews");
            jest.spyOn(ProductDAO.prototype, "exist");
        });

        test("Correct result test", async () =>{
            const response = await reviewController.getProductReviews(product1.model)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(
                product1.model)
            expect(response).toEqual(reviewArray)
        })

        test("No review test", async () =>{
            const response = await reviewController.getProductReviews(product3.model)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(
                product3.model)
            expect(response).toStrictEqual([])
        })

        test("Internal server error test", async () =>{
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            await expect(reviewController.getProductReviews(product1.model))
            .rejects
            .toThrow()
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(
                product1.model)

                
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
            
        })

        

    })

    
    describe("deleteReview test", () => {
        
        
        beforeAll(() => {
            jest.spyOn(ReviewDAO.prototype, "getProductReviews");
            jest.spyOn(ReviewDAO.prototype, "deleteReview");
            jest.spyOn(ProductDAO.prototype, "exist");
        });

        test("Correct result test", async () =>{
            const response = await reviewController.deleteReview(review1.model, user1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(
                review1.model)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledWith(
                review1.model,
                review1.user)
            expect(response).toBe(undefined)

            db.serialize(() => {
                db.exec("DELETE FROM reviews");
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            })
            
        })

        test("Product not found error test", async () =>{
            const err = new ProductNotFoundError()
            await expect(reviewController.deleteReview(wrongProductReview.model, user1))
            .rejects
            .toThrow(err)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                wrongProductReview.model
            )
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(0)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(0)
            
        })

        test("No Existing review error test", async () =>{
            const err = new NoReviewProductError()
            await expect(reviewController.deleteReview(review1.model, user4))
            .rejects
            .toThrow(err)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(review1.model)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(0)
            
        })

        test("Internal server error test of exist", async () =>{
            await db.exec('DROP TABLE products'); // Simulate SQL error
            await expect(reviewController.deleteReview(review1.model, user1))
            .rejects
            .toThrow()
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(0)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(0)

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product1Id, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product2Id, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product3Id, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
            
        })

        test("Internal server error test of getProductReviews", async () =>{
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            //call the addReview method of the controller with the resolved result of the mock
            await expect(reviewController.deleteReview(review1.model, user1))
            .rejects
            .toThrow()
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.getProductReviews).toHaveBeenCalledWith(
                review1.model)
            expect(ReviewDAO.prototype.deleteReview).toHaveBeenCalledTimes(0)
            
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
            
        })

    
        
    })


    describe("deleteReviewsOfProduct test", () => {
        

        beforeAll(() => {
            jest.spyOn(ReviewDAO.prototype, "getProductReviews");
            jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct");
            jest.spyOn(ProductDAO.prototype, "exist");
        });

        test("Correct result test", async () =>{
            const response = await reviewController.deleteReviewsOfProduct(review1.model)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
                review1.model)
            expect(response).toBe(undefined)

            db.serialize(() => {
                db.exec("DELETE FROM reviews");
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])    
            })
            
        })

        test("Product not found test", async () =>{
            const err = new ProductNotFoundError()
            await expect(reviewController.deleteReviewsOfProduct(wrongProductReview.model))
            .rejects
            .toThrow(err)    
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)   
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                wrongProductReview.model
            )
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)
        })


        test("Internal server error test of exist", async () =>{
            await db.exec('DROP TABLE products'); // Simulate SQL error
            await expect(reviewController.deleteReviewsOfProduct(review1.model))
            .rejects
            .toThrow()
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(0)

            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "products" ("id" INTEGER NOT NULL UNIQUE, "model" TEXT NOT NULL UNIQUE, "category" TEXT NOT NULL CHECK("category" = 'Laptop' OR "category" = 'Smartphone' OR "category" = 'Appliance'), "sellingPrice" REAL NOT NULL CHECK("sellingPrice" > 0.0), "arrivalDate" TEXT NOT NULL, "details" TEXT, "quantity" INTEGER NOT NULL CHECK("quantity" >= 0), PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product1Id, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product2Id, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
                db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [product3Id, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
                
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
            

        })
        

        test("Internal server error test of deleteReviewsOfProduct", async () =>{
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            await new Promise(f => setTimeout(f, 1000));
            await expect(reviewController.deleteReviewsOfProduct(review1.model))
            .rejects
            .toThrow()
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1)
            expect(ProductDAO.prototype.exist).toHaveBeenCalledWith(
                review1.model
            )
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledTimes(1)
            expect(ReviewDAO.prototype.deleteReviewsOfProduct).toHaveBeenCalledWith(
                review1.model)

        
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
                
            })
            
        })

        
    
        
    })


    describe("deleteAllReviews test", () => {
        
        
        beforeAll(() => {
            jest.spyOn(ReviewDAO.prototype, "deleteAllReviews");
        });

        test("Correct result test", async () =>{
            const response = await reviewController.deleteAllReviews()
            expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)
            expect(response).toBe(undefined)
            db.serialize(() => {
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])
            })
            
        })


        /*test("Internal server error test", async () =>{
            await db.exec('DROP TABLE reviews'); // Simulate SQL error
            await expect(reviewController.deleteAllReviews())
            .rejects
            .toThrow()
            expect(ReviewDAO.prototype.deleteAllReviews).toHaveBeenCalledTimes(1)

            await db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "reviews" ("id" INTEGER NOT NULL UNIQUE, "score" INTEGER NOT NULL CHECK("score" >= 1 AND "score" <= 5), "date" TEXT NOT NULL, "comment" TEXT NOT NULL, "userId" INTEGER NOT NULL, "productId" INTEGER NOT NULL, PRIMARY KEY("id" AUTOINCREMENT), UNIQUE("userId","productId"), FOREIGN KEY("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE, FOREIGN KEY("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [1, review1.score, review1.date, review1.comment, user1Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [2, review2.score, review2.date, review2.comment, user2Id, product1Id])
                db.run('INSERT INTO reviews (id, score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?, ?)', [3, review3.score, review3.date, review3.comment, user3Id, product1Id])

            })
            
        })*/
        
    })




})
