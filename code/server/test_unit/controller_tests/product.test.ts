import { test, expect, jest } from "@jest/globals"
import productController from "../../src/controllers/productController";
import productDAO from "../../src/dao/productDAO";
import { Product, Category } from "../../src/components/product";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, InvalidGroupingError, InvalidCategoryGroupingError, EmptyProductStockError, LowProductStockError, InvalidModelGroupingError } from "../../src/errors/productError";
import { DateError } from "../../src/utilities";
import { error } from "console";

jest.mock("../../src/dao/productDAO")

//TEST 1.1a : registerProduct()
test("TEST 1.1a registerProduct(): I should resolve the promise and add a set of product", async () => {
    const testProduct = {
        model: "Phone",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "add").mockResolvedValueOnce();
    const controller = new productController();
    const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice,
        testProduct.arrivalDate);
    expect(productDAO.prototype.add).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.add).toHaveBeenCalledWith(expect.objectContaining({
        category: Category.SMARTPHONE
        //category: expect.any(Category) provare ad estendere a LAPTOP e APPLIANCE 
    }));

    expect(response).toBe(undefined);
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
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "add").mockResolvedValueOnce();
    const controller = new productController();
    const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice,
        testProduct.arrivalDate);
    expect(productDAO.prototype.add).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.add).toHaveBeenCalledWith(expect.objectContaining({
        category: Category.LAPTOP
        //category: expect.any(Category) provare ad estendere a LAPTOP e APPLIANCE 
    }));

    expect(response).toBe(undefined);
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
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "add").mockResolvedValueOnce();
    const controller = new productController();
    const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate);
    expect(productDAO.prototype.add).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.add).toHaveBeenCalledWith(expect.objectContaining({
        category: Category.APPLIANCE
        //category: expect.any(Category) provare ad estendere a LAPTOP e APPLIANCE 
    }));

    expect(response).toBe(undefined);
});

//TEST 1.2 
test("TEST 1.2 registerProduct(): already existing set of products (already existing model)", async () => {
    const testProduct = {
        model: "iPhone 13",
        category: Category.SMARTPHONE,
        quantity: 148,
        details: "null",
        sellingPrice: 12050.0,
        arrivalDate: "2024-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "exist").mockResolvedValueOnce(true);
    const controller = new productController();
    await expect(controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrowError(ProductAlreadyExistsError);
    expect(productDAO.prototype.exist).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.add).toHaveBeenCalledTimes(0);
});

//TEST 1.3 
test("TEST 1.3 registerProduct(): arrivalDate after the current Date", async () => {
    const testProduct = {
        model: "iPhone 13",
        category: Category.SMARTPHONE,
        quantity: 148,
        details: "null",
        sellingPrice: 12050.0,
        arrivalDate: "2025-05-28"
    }

    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "add").mockRejectedValueOnce(new DateError());
    const controller = new productController();
    await expect(controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, testProduct.arrivalDate)).rejects.toThrowError(DateError);
});

//TEST 1.4
test("TEST 1.4 registerProduct(): arrivalDate not present", async () => {
    jest.resetAllMocks();
    const testProduct = {
        model: "iPhone 13",
        category: Category.SMARTPHONE,
        quantity: 148,
        details: "null",
        sellingPrice: 12050.0,
    }

    jest.spyOn(productDAO.prototype, "exist").mockResolvedValueOnce(false);
    const controller = new productController();
    const response = await controller.registerProducts(testProduct.model, testProduct.category, testProduct.quantity, testProduct.details, testProduct.sellingPrice, null);

    await expect(response).resolves;
});

//TEST 2: changeProductQuantity()
test("TEST 2.1 changeProductQuantity(): I should change the quantity of a product", async () => {
    const testProduct = {
        model: "Phone",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    jest.spyOn(productDAO.prototype, "changeQuantity").mockResolvedValueOnce();

    const controller = new productController();
    await controller.changeProductQuantity(testProduct.model, 18, "2024-05-20");

    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity + 18);
});

//test 2.2 
test("TEST 2.2 changeProductQuantity(): ProductNotFoundError", async () => {
    let nullValue: any;
    nullValue = null;

    const testProduct = {
        model: "",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValue(nullValue);
    const controller = new productController();
    await expect(controller.changeProductQuantity(testProduct.model, 18, "2024-05-20")).rejects.toThrowError(ProductNotFoundError);
    expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});;

//test 2.3
test("TEST 2.3 changeProductQuantity(): DateError", async () => {
    const testProduct = {
        model: "Iphone 13",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get");
    const controller = new productController();
    await expect(controller.changeProductQuantity(testProduct.model, 18, "2500-05-20")).rejects.toThrowError(DateError);

    expect(productDAO.prototype.get).toHaveBeenCalledTimes(0);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

//test 2.4
test("TEST 2.4 changeProductQuantity(): DateError", async () => {
    const testProduct = {
        model: "Iphone 13",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    const controller = new productController();
    await expect(controller.changeProductQuantity(testProduct.model, 18, "2005-05-20")).rejects.toThrowError(DateError);

    expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

//test 2.5
test("TEST 2.5 changeProductQuantity(): noDate", async () => {
    const testProduct = {
        model: "Phone",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    jest.spyOn(productDAO.prototype, "changeQuantity").mockResolvedValueOnce();

    const controller = new productController();
    await controller.changeProductQuantity(testProduct.model, 18, null);

    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity + 18);
});

//TEST 3: sellProduct()
test("TEST 3.1 sellProduct(): sellProduct should resolve with new quantity", async () => {
    const testProduct = {
        model: "Phone",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    jest.spyOn(productDAO.prototype, "changeQuantity").mockResolvedValueOnce();
    const controller = new productController();
    const newQuantity = await controller.sellProduct(testProduct.model, 1, "2024-05-28");

    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity - 1);
    expect(newQuantity).toBe(testProduct.quantity - 1);
});

//3.2
test("TEST 3.2 sellProduct(): ProductNotFoundError", async () => {
    let nullValue: any;
    nullValue = null;
    const testProduct = {
        model: "",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValue(nullValue);
    const controller = new productController();
    await expect(controller.sellProduct(testProduct.model, 1, "2024-05-28")).rejects.toThrowError(ProductNotFoundError);
    expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

//3.3
test("TEST 3.3 sellProduct(): LowProductStockError", async () => {
    const testProduct = {
        model: "",
        category: Category.SMARTPHONE,
        quantity: 0,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    const controller = new productController();
    await expect(controller.sellProduct(testProduct.model, 1, "2024-05-28")).rejects.toThrowError(LowProductStockError);
    expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

//3.4 
test("TEST 3.4 sellProduct(): LowProductStockError", async () => {
    const testProduct = {
        model: "",
        category: Category.SMARTPHONE,
        quantity: 2,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    const controller = new productController();
    await expect(controller.sellProduct(testProduct.model, 3, "2024-05-28")).rejects.toThrowError(LowProductStockError);
    expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

//3.5 selling before the arrival date 
test("TEST 3.5 sellProduct(): DateError (before ArrivalDate)", async () => {
    const testProduct = {
        model: "",
        category: Category.SMARTPHONE,
        quantity: 2,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    const controller = new productController();
    await expect(controller.sellProduct(testProduct.model, 3, "2004-05-28")).rejects.toThrowError(DateError);
    expect(productDAO.prototype.get).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.get).toHaveBeenCalledWith(testProduct.model);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

// TEST 3.6
test("TEST 3.6 sellProduct(): noSellingDate", async () => {
    const testProduct = {
        model: "Phone",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    jest.spyOn(productDAO.prototype, "changeQuantity").mockResolvedValueOnce();
    const controller = new productController();
    const newQuantity = await controller.sellProduct(testProduct.model, 1, null);

    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledWith(testProduct.model, testProduct.quantity - 1);
    expect(newQuantity).toBe(testProduct.quantity - 1);
});

//3.7
test("TEST 3.7 sellProduct(): DateError (after current date)", async () => {
    const testProduct = {
        model: "",
        category: Category.SMARTPHONE,
        quantity: 2,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2024-04-28"
    };
    jest.resetAllMocks()
    jest.spyOn(productDAO.prototype, "get").mockResolvedValueOnce(testProduct);
    const controller = new productController();
    await expect(controller.sellProduct(testProduct.model, 3, "2100-05-28")).rejects.toThrowError(DateError);
    expect(productDAO.prototype.get).toHaveBeenCalledTimes(0);
    expect(productDAO.prototype.changeQuantity).toHaveBeenCalledTimes(0);
});

//TEST 4: getProducts()
test("TEST 4.1 getProducts(): getProducts should resolve with an array of products, category", async () => {
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

    jest.spyOn(productDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    const products = await controller.getProducts("category", Category.SMARTPHONE, null);
    expect(products).toHaveLength(1);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
    expect(products).toEqual(expect.arrayContaining([
        expect.objectContaining({ category: Category.SMARTPHONE }),
    ]));
});

//4.2
test("TEST 4.2 getProducts(): getProducts should resolve with an array of products, model", async () => {
    const testProduct1 = {
        model: "Phone1",
        category: Category.LAPTOP,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }

    const testProduct2 = {
        model: "Phone2",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }

    const testProducts: Product[] = [
        new Product(0, testProduct1.model, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity),
        new Product(1, testProduct2.model, testProduct2.category, testProduct2.arrivalDate, testProduct2.details, testProduct2.quantity)
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    const products = await controller.getProducts("model", null, "Phone1");
    expect(products).toHaveLength(1);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
    expect(products).toEqual(expect.arrayContaining([
        expect.objectContaining({ model: "Phone1" }),
    ]));
});


//4.3 
test("TEST 4.3 getProducts(): getProducts should resolve with an array of products, no grouping", async () => {
    const testProduct1 = {
        model: "Phone1",
        category: Category.LAPTOP,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }

    const testProduct2 = {
        model: "Phone2",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }

    const testProducts: Product[] = [
        new Product(0, testProduct1.model, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity),
        new Product(1, testProduct2.model, testProduct2.category, testProduct2.arrivalDate, testProduct2.details, testProduct2.quantity)
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    const products = await controller.getProducts(null, null, null);
    expect(products).toHaveLength(2);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(1);
    expect(products).toEqual(testProducts);
});

//4.4
test("TEST 4.4 getProducts(): InvalidCategoryError", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getProducts("category", null, "Samsung")).rejects.toThrowError(InvalidGroupingError);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
});

//4.5
test("TEST 4.5 getProducts(): InvalidModelError", async () => {
    const testProduct1 = {
        model: "Phone1",
        category: Category.LAPTOP,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }

    const testProduct2 = {
        model: "Phone2",
        category: Category.SMARTPHONE,
        quantity: 10,
        details: "details",
        sellingPrice: 500,
        arrivalDate: "2020-05-28"
    }

    const testProducts: Product[] = [
        new Product(0, testProduct1.model, testProduct1.category, testProduct1.arrivalDate, testProduct1.details, testProduct1.quantity),
        new Product(1, testProduct2.model, testProduct2.category, testProduct2.arrivalDate, testProduct2.details, testProduct2.quantity)
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getProducts("model", Category.SMARTPHONE, "Samsung")).rejects.toThrowError(InvalidGroupingError);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
});


//4.6
test("TEST 4.6 getProducts():InvalidGroupingError", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.spyOn(productDAO.prototype, "getAllProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getProducts("cat", Category.SMARTPHONE, null)).rejects.toThrowError(InvalidGroupingError);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
});

//TEST 5 getAvailableProducts() 
test("TEST 5.1 getAvailableProducts() - category: getAvailableProducts should resolve with all available products when no grouping is provided", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];

    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    const response = await controller.getAvailableProducts(null, null, null);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledWith(null, null, null);
    expect(response).toEqual(testProducts);
});


//5.2
test("TEST 5.2 getAvailableProducts()- model: getAvailableProducts should resolve with all available Android products", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Phone3", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    jest.spyOn(productDAO.prototype, "exist").mockResolvedValueOnce(true)
    const controller = new productController();
    const response = await controller.getAvailableProducts("model", null, "Android");
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledWith("model", null, "Android");
    expect(response).toEqual(testProducts);
});

//5.3
test("TEST 5.3 getAvailableProducts(): getAvailableProducts should resolve with all available products when  grouping is category", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];

    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    const response = await controller.getAvailableProducts("category", Category.SMARTPHONE, null);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledWith("category", Category.SMARTPHONE, null);
    expect(response).toEqual(testProducts);
});

//5.4 
test("TEST 5.4 getAvailableProducts(): InvalidCategoryGroupingError", async () => {
    let undefinedValue: any;
    undefinedValue = undefined;
    
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getAvailableProducts("category", undefinedValue, "Samsung")).rejects.toThrowError(InvalidCategoryGroupingError);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);

});


//5.5
test("TEST 5.5 getAvailableProducts(): InvalidModelGroupingError", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getAvailableProducts("model", Category.SMARTPHONE, "Samsung")).rejects.toThrowError(InvalidModelGroupingError);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
});

//5.6
test("TEST 5.6 getAvailableProducts(): InvalidGroupingError", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getAvailableProducts("cat", Category.SMARTPHONE, null)).rejects.toThrowError(InvalidGroupingError);
    expect(productDAO.prototype.getAllProducts).toHaveBeenCalledTimes(0);
});

//5.7
test("TEST 5.7 getAvailableProducts()", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Phone3", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "exist").mockResolvedValueOnce(true);

    jest.spyOn(productDAO.prototype, "getAvailableProducts").mockResolvedValueOnce(testProducts);
    const controller = new productController();
    await expect(controller.getAvailableProducts(null, null, "Android")).rejects.toThrowError(InvalidGroupingError);
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
});

//TEST 5.8
test("TEST 5.8 getAvailableProducts()", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];

    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "exist").mockResolvedValueOnce(false);
    const controller = new productController();
    await expect(controller.getAvailableProducts("model", null, "Sony")).rejects.toThrowError(ProductNotFoundError);
    expect(productDAO.prototype.exist).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.exist).toHaveBeenCalledWith("Sony");
    expect(productDAO.prototype.getAvailableProducts).toHaveBeenCalledTimes(0);
});

//TEST 6 deleteProduct ()
test("TEST 6.1 deleteProduct (): I should resolve the promise and delete a product ", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];

    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "deleteOne").mockResolvedValueOnce();
    const controller = new productController();
    const response = await controller.deleteProduct("Phone1");
    expect(productDAO.prototype.deleteOne).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.deleteOne).toHaveBeenCalledWith("Phone1");
    expect(response).toBe(true);
});

//6.2
test("TEST 6.2 deleteProduct (): ProductNotFoundError", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    const error = new ProductNotFoundError();
    jest.spyOn(productDAO.prototype, "deleteOne").mockRejectedValueOnce(error);
    const controller = new productController();
    await expect(controller.deleteProduct("NonExistingProduct")).rejects.toThrowError(ProductNotFoundError);
    expect(productDAO.prototype.deleteOne).toHaveBeenCalledTimes(1);
});

//6.2
test("TEST 6.2 deleteProduct (): ProductNotFoundError", async () => {
    let nullValue: any;
    nullValue = null;

    jest.resetAllMocks();
    const testProducts: Product[] = [
        new Product(500, "Phone", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Sony", Category.LAPTOP, "2024-05-28", "details", 10),
        new Product(500, "Android", Category.SMARTPHONE, "2024-05-28", "details", 10),
        new Product(500, "Motorola", Category.SMARTPHONE, "2024-05-28", "details", 0),
    ];
    jest.clearAllMocks()
    const error = new ProductNotFoundError();
    jest.spyOn(productDAO.prototype, "deleteOne").mockRejectedValueOnce(error);
    const controller = new productController();
    await expect(controller.deleteProduct(nullValue)).rejects.toThrowError(ProductNotFoundError);
    expect(productDAO.prototype.deleteOne).toHaveBeenCalledTimes(0);
});

//TEST 7 deleteAllProducts()
test("TEST 7.1  deleteAllProducts(): I should resolve the promise and delete a product ", async () => {
    const testProduct1 = {
        model: "Phone1",
        category: Category.SMARTPHONE,
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
    jest.clearAllMocks()
    jest.spyOn(productDAO.prototype, "deleteAll").mockResolvedValueOnce();
    const controller = new productController();
    const response = await controller.deleteAllProducts();
    expect(productDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
    expect(productDAO.prototype.deleteAll).toHaveBeenCalledWith();
    expect(response).toBe(true);
});

//7.2
test("TEST 7.2 deleteAllProducts (): ProductNotFoundError", async () => {
    jest.resetAllMocks();
    const testProducts: Product[] = [];
    jest.clearAllMocks()
    const error = new ProductNotFoundError();
    jest.spyOn(productDAO.prototype, "deleteAll").mockRejectedValueOnce(error);
    const controller = new productController();
    await expect(controller.deleteAllProducts()).rejects.toThrowError(ProductNotFoundError);
    expect(productDAO.prototype.deleteAll).toHaveBeenCalledTimes(1);
});
