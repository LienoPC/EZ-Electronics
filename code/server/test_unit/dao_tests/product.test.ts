import { test, expect, jest } from "@jest/globals"
import productDAO from "../../src/dao/productDAO";
import { Product, Category } from "../../src/components/product";
import { ProductNotFoundError, ProductAlreadyExistsError } from "../../src/errors/productError";

import db from "../../src/db/db"
import { Database } from "sqlite3"
jest.mock("../../src/db/db.ts")

//TEST 1.1: exist()
test("TEST 1.1 exist(): It should resolve true if product exists", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, { model: model })
        return {} as Database
    });

    const result = await dao.exist(model)
    expect(result).toBe(true)

    mockDBGet.mockRestore()
})

//1.2
test("TEST 1.2 exist(): It should return false if product does not exist", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null) // simula che nessun prodotto viene restituito
        return {} as Database
    });
    const result = await dao.exist(model)

    expect(result).toBe(false)

    mockDBGet.mockRestore()
})

//1.3
test("TEST 1.3 exist(): It should throw an error if db.get fails", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error"), null) // simula un errore del database
        return {} as Database
    });

    try {
        const result = await dao.exist(model)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Database error")
    }

    mockDBGet.mockRestore()
})

//TEST 2.1 add()
test("TEST 2.1 add(): It should resolve without errors if product is added successfully", async () => {
    const dao = new productDAO()
    const product = new Product(500, "model", Category.SMARTPHONE, "2024-06-01", "dettagli", 10)

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null, null) // simula l'inserimento di un prodotto senza errori
        return {} as Database
    });

    try {
        await dao.add(product)
        // Se arriva a questo punto senza lanciare un errore, il test ha successo
        expect(true).toBe(true)
    } catch (error) {
        // Se arriva a questo punto, il test fallisce
        expect(true).toBe(false)
    }

    mockDBRun.mockRestore()
})

//TEST 2.2
test("TEST 2.2 add(): It should throw an error if db.run fails", async () => {
    const dao = new productDAO()
    const product = new Product(500, "model", Category.SMARTPHONE, "2024-06-01", "dettagli", 10)

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error"), null) // simula un errore del database
        return {} as Database
    });

    try {
        await dao.add(product)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Database error")
    }

    mockDBRun.mockRestore()
})

//2.4
test("TEST 2.4 add(): It should throw an error if an error occurs outside of db.run", async () => {
    const dao = new productDAO()
    const product = new Product(500, "model", Category.SMARTPHONE, "2024-06-01", "dettagli", 10)

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
        throw new Error("Unexpected error") // simula un errore non legato alla query SQL
    });

    try {
        await dao.add(product)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Unexpected error")
    }

    mockDBRun.mockRestore()
})

//TEST 3.1 get()
test("TEST 3.1 get(): It should resolve with product if product exists", async () => {
    const dao = new productDAO()
    const model = "model"
    const productData = { sellingPrice: 500, model: model, category: Category.SMARTPHONE, arrivalDate: "2024-06-01", details: "dettagli", quantity: 10 }

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, productData) // simula un prodotto trovato
        return {} as Database
    });

    const result = await dao.get(model)
    expect(result).toEqual(new Product(500, "model", Category.SMARTPHONE, "2024-06-01", "dettagli", 10))

    mockDBGet.mockRestore()
})

//TEST 3.2
test("TEST 3.2 get(): It should throw ProductNotFoundError if product does not exist", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, null) // simula che nessun prodotto viene restituito
        return {} as Database
    });

    try {
        await dao.get(model)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundError)
    }

    mockDBGet.mockRestore()
})

//TEST 3.3
test("TEST 3.3 get(): It should throw an error if db.get fails", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(new Error(), null) // simula un errore del database
        return {} as Database
    });

    try {
        await dao.get(model)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
    }

    mockDBGet.mockRestore()
})

//TEST 3.4
test("TEST 3.4 get(): It should throw an error if an error occurs outside of db.get", async () => {
    const dao = new productDAO()
    const model = ""

    try {
        await dao.get(model)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundError)
    }
})

//TEST 4.1: getAllProducts()
test("TEST 4.1 getAllProducts(): It should resolve with all products", async () => {
    const dao = new productDAO()
    const productsData = [
        { sellingPrice: 100, model: "modello1", category: Category.SMARTPHONE, arrivalDate: "2024-06-01", details: "dettagli1", quantity: 10 },
        { sellingPrice: 200, model: "modello2", category: Category.SMARTPHONE, arrivalDate: "2024-06-02", details: "dettagli2", quantity: 20 }
    ]

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, productsData) // simula la restituzione di tutti i prodotti
        return {} as Database
    });

    const result = await dao.getAllProducts()
    expect(result).toEqual(productsData.map(data => new Product(data.sellingPrice, data.model, Category.SMARTPHONE, data.arrivalDate, data.details, data.quantity)))

    mockDBAll.mockRestore()
})


//TEST 4.2 
test("TEST 4.2 getAllProducts(): It should throw an error if db.all fails", async () => {
    const dao = new productDAO()

    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error"), null) // simula un errore del database
        return {} as Database
    });

    try {
        await dao.getAllProducts()
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Database error")
    }

    mockDBAll.mockRestore()
})

//TEST 4.3
test("TEST 4.3 getAllProducts(): It should throw an error if an error occurs outside of db.all", async () => {
    const dao = new productDAO()

    const mockDBAll = jest.spyOn(db, "all").mockImplementation(() => {
        throw new Error("Unexpected error") // simula un errore non legato alla query SQL
    });

    try {
        await dao.getAllProducts()
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Unexpected error")
    }

    mockDBAll.mockRestore()
})

//TEST 5.1 changeQuantity()
test("TEST 5.1 changeQuantity(): It should resolve without errors if product exists and quantity is updated", async () => {
    jest.resetAllMocks();

    const dao = new productDAO()
    const model = "modelloDiProva"
    const newQuantity = 20
    const product = new Product(500, "model", Category.SMARTPHONE, "2024-06-01", "dettagli", 10)

    jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, product)
        return {} as Database
    });
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null) // simula l'aggiornamento della quantità senza errori
        return {} as Database
    });

    const mockExist = jest.spyOn(dao, "exist").mockResolvedValue(true) // simula che il prodotto esiste

    await dao.changeQuantity(model, newQuantity)

    jest.resetAllMocks();
})

//5.3
test("TEST 5.3 changeQuantity(): It should throw an error if db.run fails", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"
    const newQuantity = 20
    
    const product = new Product(500, "model", Category.SMARTPHONE, "2024-06-01", "dettagli", 10)

    jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
        callback(null, product)
        return {} as Database
    });
    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error")) // simula un errore del database
        return {} as Database
    });

    const mockExist = jest.spyOn(dao, "exist").mockResolvedValue(true) // simula che il prodotto esiste

    try {
        await dao.changeQuantity(model, newQuantity)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Database error")
    }

    mockDBRun.mockRestore()
    mockExist.mockRestore()
})

//TEST 6.1 deleteOne()
test("TEST 6.1 deleteOne(): It should resolve without errors if product exists and is deleted", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null) // simula la cancellazione del prodotto senza errori
        return {} as Database
    });

    const mockExist = jest.spyOn(dao, "exist").mockResolvedValue(true) // simula che il prodotto esiste

    await dao.deleteOne(model)

    mockDBRun.mockRestore()
    mockExist.mockRestore()
})

//6.2
test("TEST 6.2 deleteOne(): It should throw ProductNotFoundError if product does not exist", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockExist = jest.spyOn(dao, "exist").mockResolvedValue(false) // simula che il prodotto non esiste

    try {
        await dao.deleteOne(model)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(ProductNotFoundError)
    }

    mockExist.mockRestore()
})



//6.3
test("TEST 6.3 deleteOne(): It should throw an error if db.run fails", async () => {
    const dao = new productDAO()
    const model = "modelloDiProva"

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error")) // simula un errore del database
        return {} as Database
    });

    const mockExist = jest.spyOn(dao, "exist").mockResolvedValue(true) // simula che il prodotto esiste

    try {
        await dao.deleteOne(model)
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Database error")
    }

    mockDBRun.mockRestore()
    mockExist.mockRestore()
})

//TEST 7.1 deleteAll
test("TEST 7.1 deleteAll(): It should resolve without errors if all products are deleted", async () => {
    const dao = new productDAO()

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(null) // simula la cancellazione di tutti i prodotti senza errori
        return {} as Database
    });

    await dao.deleteAll()

    mockDBRun.mockRestore()
})

//7.2
test("TEST 7.2 deleteAll(): It should throw an error if db.run fails", async () => {
    const dao = new productDAO()

    const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
        callback(new Error("Database error")) // simula un errore del database
        return {} as Database
    });

    try {
        await dao.deleteAll()
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Database error")
    }

    mockDBRun.mockRestore()
})

//7.3
test("TEST 7.3 deleteAll(): It should throw an error if an error occurs outside of db.run", async () => {
    const dao = new productDAO()

    const mockDBRun = jest.spyOn(db, "run").mockImplementation(() => {
        throw new Error("Unexpected error") // simula un errore non legato alla query SQL
    });

    try {
        await dao.deleteAll()
        // Se arriva a questo punto senza lanciare un errore, il test fallisce
        expect(true).toBe(false)
    } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toBe("Unexpected error")
    }

    mockDBRun.mockRestore()
})

test("It should return an array of available products when grouping is undefined", async () => {
    const testGrouping: string | null = null;
    const testCategory: string | null = null;
    const testModel: string | null = null;

    // Mock data
    const mockProduct = new Product(
        999,
        "Test Model",
        Category.SMARTPHONE,
        "2024-06-04",
        "Test Details",
        10
    );

    // Mock the database response
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{
            sellingPrice: mockProduct.sellingPrice,
            model: mockProduct.model,
            category: mockProduct.category,
            arrivalDate: mockProduct.arrivalDate,
            details: mockProduct.details,
            quantity: mockProduct.quantity
        }]);
        return {} as Database;
    });

    // Call the method
    const response = await productDAO.prototype.getAvailableProducts(testGrouping, testCategory, testModel);

    // Assertions
    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), expect.any(Array), expect.any(Function));
    expect(response).toEqual([mockProduct]);

    jest.resetAllMocks();
});

test("It should return an array of available products when grouping is 'category'", async () => {
    const testGrouping: string | null = 'category';
    const testCategory: string | null = 'Smartphone';
    const testModel: string | null = null;

    // Mock data
    const mockProduct = new Product(
        999,
        "Test Model",
        Category.SMARTPHONE,
        "2024-06-04",
        "Test Details",
        10
    );

    // Mock the database response
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{
            sellingPrice: mockProduct.sellingPrice,
            model: mockProduct.model,
            category: mockProduct.category,
            arrivalDate: mockProduct.arrivalDate,
            details: mockProduct.details,
            quantity: mockProduct.quantity
        }]);
        return {} as Database;
    });

    // Call the method
    const response = await productDAO.prototype.getAvailableProducts(testGrouping, testCategory, testModel);

    // Assertions
    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [testCategory], expect.any(Function));
    expect(response).toEqual([mockProduct]);

    jest.resetAllMocks();
});

test("It should return an array of available products when grouping is 'model'", async () => {
    const testGrouping: string | null = 'model';
    const testCategory: string | null = null;
    const testModel: string | null = 'Test Model';

    // Mock data
    const mockProduct = new Product(
        999,
        "Test Model",
        Category.SMARTPHONE,
        "2024-06-04",
        "Test Details",
        10
    );

    // Mock the database response
    const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
        callback(null, [{
            sellingPrice: mockProduct.sellingPrice,
            model: mockProduct.model,
            category: mockProduct.category,
            arrivalDate: mockProduct.arrivalDate,
            details: mockProduct.details,
            quantity: mockProduct.quantity
        }]);
        return {} as Database;
    });

    // Call the method
    const response = await productDAO.prototype.getAvailableProducts(testGrouping, testCategory, testModel);

    // Assertions
    expect(mockDBAll).toHaveBeenCalledTimes(1);
    expect(mockDBAll).toHaveBeenCalledWith(expect.any(String), [testModel], expect.any(Function));
    expect(response).toEqual([mockProduct]);

    jest.resetAllMocks();
});
