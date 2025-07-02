import CartDAO from '../../src/dao/cartDAO';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { EmptyProductStockError, LowProductStockError, ProductNotFoundError, ProductAlreadyExistsError, InvalidGroupingError, InvalidCategoryGroupingError, InvalidModelGroupingError } from '../../src/errors/productError';
import request from 'supertest'
import { app } from "../../index"
import db from '../../src/db/db';
import { Database } from "sqlite3";
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import ProductController from "../../src/controllers/productController";
import ProductDAO from '../../src/dao/productDAO';
import { DateError } from '../../src/utilities';
import productDAO from '../../src/dao/productDAO';

const routePath = "/ezelectronics"; //Base route path for the API
const baseURL = routePath + '/products';





describe('ProductController Integration Tests', () => {
    let controller: ProductController;
    let nullValue: any;
    let userCookie: any;

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


    beforeAll(async () => {
        controller = new ProductController();
        nullValue = null;


        await createAllTables();
        await createAllTriggers();

        user1 = new User("customer", "customer", "customer", Role.CUSTOMER, nullValue, nullValue);
        user2 = new User("manager", "manager", "manager", Role.MANAGER, nullValue, nullValue);
        user3 = new User("admin", "admin", "admin", Role.ADMIN, nullValue, nullValue);

        product1 = new Product(100.36, "iPhone 13", Category.SMARTPHONE, "2020-02-23", "Descrizione", 20);
        product2 = new Product(2500, "LG TV 55", Category.APPLIANCE, "2024-02-14", "Descrizione", 5);
        product3 = new Product(860.35, "Thinkpad E14", Category.LAPTOP, "2015-03-24", "Descrizione", 100);
        product4 = new Product(60.35, "Motorola", Category.SMARTPHONE, "2010-02-05", "Descrizione", 10);
        product5 = new Product(60.35, " ", Category.SMARTPHONE, "2010-02-05", "Descrizione", 10); //modello vuoto
        product6 = new Product(600.35, "Samsung", Category.SMARTPHONE, "2010-02-05", "Descrizione", 10); //prodotto non trovato
        product7 = new Product(100.36, "iPhone 6", Category.SMARTPHONE, "2018-02-23", "Descrizione", 0); //non disponibile 

        db.serialize(() => {
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)', [7, product7.model, product7.category, product7.sellingPrice, product7.arrivalDate, product7.details, product7.quantity]);
        })

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

    beforeEach(async () => {
        jest.clearAllMocks();
    });

    describe("registerProducts", () => {
        beforeAll(() => {
            jest.spyOn(ProductDAO.prototype, "exist");
            jest.spyOn(ProductDAO.prototype, "add");

        });

        test("TEST 1.1a registerProduct(): I should resolve the promise and add a set of product", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-05-28"
            }
            const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
            expect(ProductDAO.prototype.add).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.add).toHaveBeenCalledWith(expect.objectContaining({
                category: Category.SMARTPHONE
            }));

            expect(response).toBe(undefined);

            db.exec("DELETE FROM products WHERE model = 'Phone'");
        });


        //TEST 1.1b : registerProduct()
        test("TEST 1.1b registerProduct(): I should resolve the promise and add a set of product", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.LAPTOP,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-05-28"
            }
            const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice,
                testProduct.arrivalDate);
            expect(ProductDAO.prototype.add).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.add).toHaveBeenCalledWith(expect.objectContaining({
                category: Category.LAPTOP
                //category: expect.any(Category) provare ad estendere a LAPTOP e APPLIANCE 
            }));

            expect(response).toBe(undefined);

            db.exec("DELETE FROM products WHERE model = 'Phone'");

        });

        //TEST 1.1c : registerProduct()
        test("TEST 1.1c registerProduct(): I should resolve the promise and add a set of product", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.APPLIANCE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-05-28"
            }
            const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
            expect(ProductDAO.prototype.add).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.add).toHaveBeenCalledWith(expect.objectContaining({
                category: Category.APPLIANCE
                //category: expect.any(Category) provare ad estendere a LAPTOP e APPLIANCE 
            }));

            expect(response).toBe(undefined);

            db.exec("DELETE FROM products WHERE model = 'Phone'");
        });


        test("TEST 1.2 registerProduct(): already existing set of products (already existing model)", async () => {
            await expect(controller.registerProducts(product1.model, product1.category, product1.quantity, product1.details, product1.sellingPrice, product1.arrivalDate)).rejects.toThrowError(ProductAlreadyExistsError);
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.add).toHaveBeenCalledTimes(0);
        });

        test("TEST 1.3 registerProduct(): arrivalDate after the current Date", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 148,
                details: "null",
                sellingPrice: 12050.0,
                arrivalDate: "2100-05-28"
            }
            await expect(controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrowError(DateError);
            expect(ProductDAO.prototype.exist).toHaveBeenCalledTimes(1);
            expect(ProductDAO.prototype.add).toHaveBeenCalledTimes(0);
        });

        test("TEST 1.4 registerProduct(): arrivalDate not present", async () => {
            jest.resetAllMocks();
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 148,
                details: "null",
                sellingPrice: 12050.0,
            }
            const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, null);
            expect(response).toBe(undefined);

            db.exec("DELETE FROM products WHERE model = 'Phone'");
        });
    });


    describe('ChangeProductQuantity test', () => {
        beforeEach(() => {
            jest.spyOn(ProductDAO.prototype, "get");
            jest.spyOn(ProductDAO.prototype, "exist");
            jest.spyOn(ProductDAO.prototype, "changeQuantity");
        });

        test("correctExecution", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2020-05-28"
            }
            jest.clearAllMocks()

            db.run('INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)', [testProduct.model, testProduct.category, testProduct.sellingPrice, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            await controller.changeProductQuantity(testProduct.model, 18, "2024-05-20");

            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(1);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity + 18);

            db.exec("DELETE FROM products WHERE model = 'Phone'");

        });
        test("productNotAvailable", async () => {

            const testProduct = {
                model: "",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2020-05-28"
            }
            jest.clearAllMocks()
            await expect(controller.changeProductQuantity(testProduct.model, 18, "2024-05-20")).rejects.toThrowError(ProductNotFoundError);
            expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
            expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
        });

        test("invalidArrivalDate", async () => {
            const testProduct = {
                model: "Iphone 13",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-05-28"
            }
            jest.clearAllMocks()
            await expect(controller.changeProductQuantity(testProduct.model, 18, "2500-05-20")).rejects.toThrowError(DateError);

            expect(productDAO.prototype.get).toHaveBeenCalledTimes(0);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
        });
    });

    describe('sellProduct', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "sellProduct");
        });

        test("correctExecution", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-04-28"
            };
            db.run('INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)', [testProduct.model, testProduct.category, testProduct.sellingPrice, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            jest.clearAllMocks()
            jest.spyOn(productDAO.prototype, "get");
            jest.spyOn(productDAO.prototype, "changeQuantity");
            const newQuantity = await controller.sellProduct(testProduct.model, 1, "2024-05-28");

            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(1);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity - 1);
            expect(newQuantity).toBe(testProduct.quantity - 1);
            db.exec("DELETE FROM products WHERE model = 'Phone'");

        });

        test("productNotAvailable", async () => {

            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-04-28"
            };
            jest.clearAllMocks()
            jest.spyOn(productDAO.prototype, "get");
            await expect(controller.sellProduct(testProduct.model, 1, "2024-05-28")).rejects.toThrowError(ProductNotFoundError);
            expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
            expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
        });

        test("invalidSellingDate", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 2,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-04-28"
            };
            db.run('INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)', [testProduct.model, testProduct.category, testProduct.sellingPrice, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            jest.clearAllMocks()
            jest.spyOn(productDAO.prototype, "get");
            await expect(controller.sellProduct(testProduct.model, 3, "2004-05-28")).rejects.toThrowError(DateError);
            expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
            expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
            db.exec("DELETE FROM products WHERE model = 'Phone'");

        });

        test("lowProductStock", async () => {
            const testProduct = {
                model: "Phone",
                category: Category.SMARTPHONE,
                quantity: 2,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-04-28"
            };
            db.run('INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)', [testProduct.model, testProduct.category, testProduct.sellingPrice, testProduct.arrivalDate, testProduct.details, testProduct.quantity]);

            jest.clearAllMocks()
            jest.spyOn(productDAO.prototype, "get");
            await expect(controller.sellProduct(testProduct.model, 3, "2024-05-28")).rejects.toThrowError(LowProductStockError);
            expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
            expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
            expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
            db.exec("DELETE FROM products WHERE model = 'Phone'");

        });
    });

    describe('getAllProducts', () => {
        beforeEach(() => {
            jest.spyOn(ProductController.prototype, "getProducts");
        });

        test("getProductsByCategory", async () => {
            const testProduct1 = {
                model: "Phone1",
                category: Category.LAPTOP,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-05-28"
            }

            const testProduct2 = {
                model: "Phone2",
                category: Category.SMARTPHONE,
                quantity: 10,
                details: "details",
                sellingPrice: 500,
                arrivalDate: "2024-05-28"
            }

            const testProducts: Product[] = [
                new Product(0, testProduct1.model, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity),
                new Product(1, testProduct2.model, testProduct2.category, testProduct2.arrivalDate, testProduct2.details, testProduct2.quantity)
            ];
            jest.clearAllMocks()
            db.run('INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)', [testProduct1.model, testProduct1.category, testProduct1.sellingPrice, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity]);
            db.run('INSERT INTO products (model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?, ?, ?, ?, ?, ?)', [testProduct2.model, testProduct2.category, testProduct2.sellingPrice, testProduct2.arrivalDate, testProduct2.details, testProduct2.quantity]);

            jest.spyOn(productDAO.prototype, "getAllProducts");
            const products = await controller.getProducts("category", Category.SMARTPHONE, null);
            expect(products).toHaveLength(3);
            expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
            expect(products).toEqual(expect.arrayContaining([
                expect.objectContaining({ category: Category.SMARTPHONE }),
            ]));

            db.exec("DELETE FROM products WHERE model = 'Phone1' OR model = 'Phone2'");

        });

        test("invalidGrouping", async () => {
            const testProducts: Product[] = [
                new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
                new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
                new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
                new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
            ];
            jest.spyOn(productDAO.prototype, "getAllProducts");
            await expect(controller.getProducts("cat", Category.SMARTPHONE, null)).rejects.toThrowError(InvalidGroupingError);
            expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
        });

        test("invalidCategory", async () => {
            const testProducts: Product[] = [
                new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
                new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
                new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
                new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
            ];
            jest.clearAllMocks()
            jest.spyOn(productDAO.prototype, "getAllProducts");
            await expect(controller.getProducts("category", null, "Samsung")).rejects.toThrowError(InvalidGroupingError);
            expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
        });

        test("invalidModel", async () => {
            jest.spyOn(productDAO.prototype, "getAllProducts");
            await expect(controller.getProducts("model", Category.SMARTPHONE, "Samsung")).rejects.toThrowError(InvalidGroupingError);
            expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
        });
    });
});
