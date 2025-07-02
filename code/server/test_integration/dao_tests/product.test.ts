import ProductDAO from '../../src/dao/productDAO';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { Product } from '../../src/components/product';
import { Category } from '../../src/components/product';
import { ProductNotFoundError, EmptyProductStockError } from '../../src/errors/productError';
import db from '../../src/db/db';
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';

describe('ProductDAO Integration Tests', () => {
    let productDAO: ProductDAO;

    let product1: Product;
    let product2: Product;
    let product3: Product;
    let product4: Product;
    let product5: Product;
 
    

    beforeAll(async () => {
        productDAO = new ProductDAO();

        product1 = new Product(1250.0, "iPhone 13", Category.SMARTPHONE, "2024-05-24", "descrizione", 148); //smartphone corretto 
        product2 = new Product(1250.0, "Macbook", Category.LAPTOP, "2024-05-24", "descrizione", 148); //Laptop corretto 
        product3 = new Product(980.0, "Samsung S23", Category.SMARTPHONE, "2023-05-15", "descrizione", 0); //non disponibile
        product4 = new Product(700.0, " ", Category.LAPTOP, "2020-02-24", "descrizione", 55); //model sbagliato
        product5 = new Product(700.0, " Acer", Category.LAPTOP, "2020-02-24", "descrizione", 55); //prodotto da aggiungere

        await cleanup();

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");
    });

    afterAll(async () => {
        await createAllTables();
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
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?,?,?,?,?,?,?)', [1, product1.model, product1.category, product1.sellingPrice, product1.arrivalDate, product1.details, product1.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?,?,?,?,?,?,?)', [2, product2.model, product2.category, product2.sellingPrice, product2.arrivalDate, product2.details, product2.quantity]);
            db.run('INSERT INTO products (id, model, category, sellingPrice, arrivalDate, details, quantity) VALUES (?,?,?,?,?,?,?)', [3, product3.model, product3.category, product3.sellingPrice, product3.arrivalDate, product3.details, product3.quantity]);
            })
        jest.clearAllMocks();
    });

    afterEach(async () => {
        await createAllTables();
        await cleanup();
    });

    describe("exist", () =>{
        test("productExists", async () => {
            const result = await productDAO.exist("Samsung S23");
            expect(db.get).toBeCalledTimes(1);
            expect(result).toBe(true);
        });

        test("productDoesNotExist", async () => {
            const result = await productDAO.exist("Philips");
            expect(db.get).toBeCalledTimes(1);
            expect(result).toBe(false);
        });

        test("databaseError", async () => {
            const model = 'Bad Model';
            db.run('DROP TABLE products');         
            await expect(productDAO.exist(model)).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
        });
    });

    describe ("add", () =>{
        test("productAddedSuccessfully", async () => {
            const result = await productDAO.add(product5);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(undefined); 
        });
        
        test("databaseErrorWhenAddingProduct", async () => {
            db.run('DROP TABLE products'); 
            await expect(productDAO.add(product4)).rejects.toThrow();
            expect(db.run).toBeCalledTimes(2);
        });

    });

    describe ("get", () =>{
        test("productFound", async () => {
            const result = await productDAO.get("Macbook");
            expect(db.get).toBeCalledTimes(1);
            expect(result).toEqual(product2);
        });
        
        test("productNotFound", async () => {
            const model = "huaweii"
            await expect(productDAO.get(model)).rejects.toThrow(ProductNotFoundError);
            expect(db.get).toBeCalledTimes(1);
        });
        
        test("databaseError", async () => {
            const model = ' ';
            db.run('DROP TABLE products');
            await expect(productDAO.get(model)).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
        });

    });

    describe ("getAllProducts", () => {
        test("allProductsFound", async () => {
            const result = await productDAO.getAllProducts();
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([product1, product2, product3]);
        });
    
        test("databaseError", async () => {
            db.run('DROP TABLE products'); 
            await expect(productDAO.getAllProducts()).rejects.toThrow();
            expect(db.all).toBeCalledTimes(1);
        });

    });

    describe ("getAvailableProducts", () =>{
        test("allAvailableProductsFound", async () => {
            const result = await productDAO.getAvailableProducts(null, null, null);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([product1, product2]);
        });
    
        test("availableProductsByCategoryFound", async () => {    
            const result = await productDAO.getAvailableProducts('category', Category.SMARTPHONE, null);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([product1]);
        });
    
        test("availableProductsByModelFound", async () => {  
            const result = await productDAO.getAvailableProducts('model', null, "iPhone 13");
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([product1]);
        });
    
        test("databaseError", async () => {
            db.run('DROP TABLE products'); 
            await expect(productDAO.getAvailableProducts(null, null, null)).rejects.toThrow();
            expect(db.all).toBeCalledTimes(1);
        });

    });

    describe ("changeQuantity",() =>{
        test("quantityChangedSuccessfully", async () => {
            const newQuantity = 200;
            await productDAO.changeQuantity(product1.model, newQuantity);
            expect(db.run).toBeCalledTimes(1);
            const result = await productDAO.get(product1.model);
            expect(db.get).toBeCalledTimes(2);
            expect(result.quantity).toEqual(newQuantity);
        });
    
        test("productNotFound", async () => {
            await expect(productDAO.changeQuantity("2", 200)).rejects.toThrow(ProductNotFoundError);
            expect(db.run).toBeCalledTimes(0);
        });
    
        test("databaseError", async () => {
            db.run('DROP TABLE products'); 
            await expect(productDAO.changeQuantity(product1.model, 200)).rejects.toThrow();
            expect(db.run).toBeCalledTimes(1);
        });
    })

    describe ("deleteOne", () =>{
        
        test("productDeletedSuccessfully", async () => {
            await productDAO.deleteOne(product1.model);
            expect(db.run).toBeCalledTimes(1);

            await expect(productDAO.get(product1.model)).rejects.toThrow(ProductNotFoundError);
            expect(db.get).toBeCalledTimes(2);
        });

        test("productNotFound", async () => {
            const model = 'Nonexistent Model';
            await expect(productDAO.deleteOne(model)).rejects.toThrow(ProductNotFoundError);
            expect(db.run).toBeCalledTimes(0);
        });

        test("databaseError", async () => {
            db.run('DROP TABLE products'); 
            await expect(productDAO.deleteOne(product4.model)).rejects.toThrow();
            expect(db.run).toBeCalledTimes(1);
        });

    });


    describe ("deleteAll", () =>{
        test("allProductsDeletedSuccessfully", async () => {
            await productDAO.deleteAll();
            expect(db.run).toBeCalledTimes(1);
    
            const result = await productDAO.getAllProducts();
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([]);
        });
    
        test("databaseError", async () => {
            db.run('DROP TABLE products'); 
            await expect(productDAO.deleteAll()).rejects.toThrow();
            expect(db.run).toBeCalledTimes(2);
        });
        
    });

})





