import CartDAO from '../../src/dao/cartDAO';
import { describe, test, expect, beforeEach, afterEach, beforeAll, jest } from "@jest/globals"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { Cart, ProductInCart, } from '../../src/components/cart';
import { Category } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { CartNotFoundError, EmptyCartError, ProductInCartError, ProductNotInCartError } from '../../src/errors/cartError';
import { EmptyProductStockError, ProductNotFoundError } from '../../src/errors/productError';

jest.mock("../../src/db/db.ts");

const DATABASE_ERROR_MESSAGE = "Database Error";

describe('CartDAO Unit Tests', () => {
    let cartDAO: CartDAO;

    let cartResult: Cart;
    let productsR: ProductInCart[];
    let total = 0;

    let products: Object[];

    let user: User;

    let nullValue: any;

    beforeAll(() => {
        cartDAO = new CartDAO();

        nullValue = null;

        user = new User("customer", "customer", "customer", Role.CUSTOMER, nullValue, nullValue);

        const productR1 = new ProductInCart("iPhone 13", 1, Category.SMARTPHONE, 1000);
        const productR2 = new ProductInCart("Laptop", 2, Category.LAPTOP, 500);
        productsR = new Array(productR1, productR2);

        productsR.forEach((p) => total = total + p.price * p.quantity);

        cartResult = new Cart(user.username, false, nullValue, total, productsR);

        const product1 = { model: "iPhone 13", quantity: 1, category: "Smartphone", sellingPrice: 1000 };
        const product2 = { model: "Laptop", quantity: 2, category: "Laptop", sellingPrice: 500 };
        products = new Array(product1, product2);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("getCartById", () => {
        test("correctExecution", async () => {
            const cart = { id: 1, paid: 0, paymentDate: nullValue, total: total, username: "customer" };
            const cartRes = new Cart(user.username, true, nullValue, total, productsR);

            
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });

            const result = await cartDAO.getCartById(1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(cartRes);
        });

        test("cartNotFound", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "all");

            await expect(cartDAO.getCartById(1)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
        });

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });

            await expect(cartDAO.getCartById(1)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
        });

        test("errorSQL_all", async () => {
            const cart = { id: 1, paid: 0, paymentDate: "2024-05-29", total: 1000, username: "customer" };
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.getCartById(1)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
        });
    });

    describe("getCartByUser", () => {
        test("currentCartWithProducts", async () => {
            const cart = { id: 1, paid: 0, paymentDate: nullValue, total: total };

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });

            const result = await cartDAO.getCartByUser(user);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(cartResult);
        });

        test("noCurrentCart", async () => {
            cartResult = new Cart(user.username, false, nullValue, 0, []);

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });

            const result = await cartDAO.getCartByUser(user);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
            expect(result).toEqual(cartResult);
        });

        test("noProductInCurrentCart", async () => {
            const cart = { id: 1, paid: 0, paymentDate: nullValue, total: total };
            cartResult = new Cart(user.username, false, nullValue, 0, []);

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });

            const result = await cartDAO.getCartByUser(user);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual(cartResult);
        });

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.getCartByUser(user)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
        });

        test("errorSQL_all", async () => {
            const cart = { id: 1, paid: 0, paymentDate: "2024-05-29", total: total };

            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.getCartByUser(user)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
        });
    });

    describe("addToCartDAO", () => {
        let product: any;
        let cart: any;

        beforeEach(() => {
            product = { id: 1, quantity: 10 };
            cart = { id: 1, customerId: 1, paid: 0, paymentDate: nullValue, total: 0 };
        });

        test("noCurrentCart", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, { id: 1 });
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, { id: 2 });
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await cartDAO.addToCartDAO(user, "Sony");
            expect(db.get).toBeCalledTimes(4);
            expect(db.run).toBeCalledTimes(2);
            expect(result).toBe(true);
        });

        test("currentCart_productNotPresent", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await cartDAO.addToCartDAO(user, "Sony");
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);
        });

        test("currentCart_productPresent_errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            
            const result = await cartDAO.addToCartDAO(user, "Sony");
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);
        });

        test("productNotFound", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(ProductNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("productNotAvailable", async () => {
            product.quantity = 0;

            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(EmptyProductStockError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_first_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_second_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(0);
        });

        test("noCurrentCart_errorSQL_first_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "run");

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(0);
        });

        test("noCurrentCart_errorSQL_first_run", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, { id: 1 });
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
        });

        test("noCurrentCart_errorSQL_second_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, { id: 1 });
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(4);
            expect(db.run).toBeCalledTimes(1);
        });

        test("noCurrentCart_errorSQL_second_run", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, { id: 1 });
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, { id: 2 });
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(4);
            expect(db.run).toBeCalledTimes(2);
        });

        test("currentCart_errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "run");

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(0);
        });

        test("currentCart_productNotPresent_errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
        });

        test("currentCart_productPresent_errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.addToCartDAO(user, "Sony")).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(3);
            expect(db.run).toBeCalledTimes(1);
        });
    });

    describe("doCheckoutByUsername", () => {
        let cart: any;
        let products: any[];
        let quantities: any[];

        beforeAll(() => {
            cart = { id: 1 };

            const prod1 = { id: 1, quantity: 1 };
            const prod2 = { id: 2, quantity: 1 };
            const prod3 = { id: 3, quantity: 2 };
            products = new Array(prod1, prod2, prod3);
            quantities = new Array({ quantity: 10 }, { quantity: 10 }, { quantity: 10 })
        });

        test("emptyCart", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrowError(EmptyCartError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("loop1_time", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, [products[0]]);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[0]);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const result = await cartDAO.doCheckoutByUsername(user);
            expect(db.get).toBeCalledTimes(2);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toEqual(true);
        });

        test("loopN_times", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[0]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[1]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[2]);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const result = await cartDAO.doCheckoutByUsername(user);
            expect(db.get).toBeCalledTimes(4);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toEqual(true);
        });

        test("cartNotFound", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "all");
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
            expect(db.run).toBeCalledTimes(0);
        });

        test("productNotAvailable", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[0]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, { quantity: 0 });
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[1]);
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrowError(ProductInCartError);
            expect(db.get).toBeCalledTimes(4);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("productQuantityNotEnough", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[0]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[1]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, { quantity: 1 });
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrowError(ProductInCartError);
            expect(db.get).toBeCalledTimes(4);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_first_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "all");
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(0);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_all", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_get_loop", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[0]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[1]);
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(4);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[0]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[1]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, quantities[2]);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            await expect(cartDAO.doCheckoutByUsername(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(4);
            expect(db.all).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        });
    });

    describe("getHistoryByUsername", () => {
        test("loop0_Times", async () => {
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });
            jest.spyOn(CartDAO.prototype, "getCartById");
            const result = await cartDAO.getHistoryByUsername(user);
            expect(db.all).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(0);
            expect(result).toEqual([]);
        });

        test("loop1_Time", async () => {
            const cartResult1 = new Cart(user.username, true, "2024-02-02", total, productsR);
            const ids = [1];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{ id: ids[0] }]);
                return {} as Database;
            });
            jest.spyOn(CartDAO.prototype, "getCartById").mockResolvedValueOnce(cartResult1);
            const result = await cartDAO.getHistoryByUsername(user);
            expect(db.all).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(ids.length);
            for (let id of ids) {
                expect(CartDAO.prototype.getCartById).toBeCalledWith(id);
            }
            expect(result).toEqual([cartResult1]);
        });

        test("loopN_Times", async () => {
            const cartResult1 = new Cart(user.username, true, "2024-02-02", total, productsR);
            const cartResult2 = new Cart(user.username, true, "2024-02-06", total, productsR);
            const cartResult3 = new Cart(user.username, true, "2024-05-29", total, productsR);
            const ids = [1, 2, 50];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{ id: ids[0] }, { id: ids[1] }, { id: ids[2] }]);
                return {} as Database;
            });
            jest.spyOn(CartDAO.prototype, "getCartById").mockResolvedValueOnce(cartResult1).mockResolvedValueOnce(cartResult2).mockResolvedValueOnce(cartResult3);
            const result = await cartDAO.getHistoryByUsername(user);
            expect(db.all).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(ids.length);
            for (let id of ids) {
                expect(CartDAO.prototype.getCartById).toBeCalledWith(id);
            }
            expect(result).toEqual([cartResult1, cartResult2, cartResult3]);
        });

        test("errorSQL_all", async () => {
            const ids = [1, 2, 50];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(CartDAO.prototype, "getCartById");
            await expect(cartDAO.getHistoryByUsername(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.all).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(0);
        });

        test("errorSQL_getCartById", async () => {
            const ids = [1, 2, 50];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{ id: ids[0] }, { id: ids[1] }, { id: ids[2] }]);
                return {} as Database;
            });
            jest.spyOn(CartDAO.prototype, "getCartById").mockRejectedValue(new Error(DATABASE_ERROR_MESSAGE));
            await expect(cartDAO.getHistoryByUsername(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.all).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledWith(ids[0]);
        });

        test("errorCartNotFound_getCartById", async () => {
            const ids = [1, 2, 50];

            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, [{ id: ids[0] }, { id: ids[1] }, { id: ids[2] }]);
                return {} as Database;
            });
            jest.spyOn(CartDAO.prototype, "getCartById").mockRejectedValue(new CartNotFoundError);
            await expect(cartDAO.getHistoryByUsername(user)).rejects.toThrow(CartNotFoundError);
            expect(CartDAO.prototype.getCartById).toBeCalledTimes(1);
            expect(CartDAO.prototype.getCartById).toBeCalledWith(ids[0]);
        });
    });

    describe("removeProductFromCartDAO", () => {
        let cartId: any;
        let product: any;
        let productModel: string;

        beforeAll(() => {
            cartId = { id: 1 };
            product = { id: 1 };
            productModel = "Motorola";
        });

        beforeEach(() => {
            product.quantity = 10;
        });

        test("productQuantityGreater1", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cartId);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const result = await cartDAO.removeProductFromCartDAO(user, productModel);
            expect(result).toBe(true);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(1);
        });

        test("productQuantity1", async () => {
            product.quantity = 1;

            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cartId);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const result = await cartDAO.removeProductFromCartDAO(user, product);
            expect(result).toBe(true);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(1);
        });

        test("cartNotFoundOrEmptyCart", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");
            await expect(cartDAO.removeProductFromCartDAO(user, product)).rejects.toThrowError(CartNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("productNotInCart", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cartId);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.removeProductFromCartDAO(user, product)).rejects.toThrowError(ProductNotInCartError);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_first_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "get");
            jest.spyOn(db, "run");
            await expect(cartDAO.removeProductFromCartDAO(user, product)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_second_get", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cartId);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.removeProductFromCartDAO(user, product)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_run_update", async () => {
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cartId);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            await expect(cartDAO.removeProductFromCartDAO(user, product)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(1);
        });

        test("errorSQL_run_delete", async () => {
            product.quantity = 1;

            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, cartId);
                return {} as Database;
            });
            jest.spyOn(db, "get").mockImplementationOnce((sql, params, callback) => {
                callback(null, product);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            await expect(cartDAO.removeProductFromCartDAO(user, product)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(2);
            expect(db.run).toBeCalledTimes(1);
        });
    });

    describe("clearCartDAO", () => {
        let cart: Object;

        beforeAll(() => {
            cart = { id: 1 };
        });

        test("correctExecution", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            const result = await cartDAO.clearCartDAO(user);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);
        });

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.clearCartDAO(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, cart);
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            await expect(cartDAO.clearCartDAO(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        });

        test("errorCartNotFound", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, undefined);
                return {} as Database;
            });
            jest.spyOn(db, "run");
            await expect(cartDAO.clearCartDAO(user)).rejects.toThrow(new CartNotFoundError());
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });
    });

    describe("deleteAllCartsDAO", () => {
        test("correctExecution", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await cartDAO.deleteAllCartsDAO();
            expect(db.run).toBeCalledTimes(1);
            expect(result).toBe(true);
        });

        test("errorSQL_run", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });

            await expect(cartDAO.deleteAllCartsDAO()).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.run).toBeCalledTimes(1);
        });
    });

    describe("getAllCartsDAO", () => {
        let cartObj1: any;
        let cartObj2: any;
        let cartObj3: any;
        let productObj1: any;
        let productObj2: any;
        let productObj3: any;

        let cart1: Cart;
        let cart2: Cart;
        let cart3: Cart;

        beforeAll(() => {
            cartObj1 = { id: 1, customerId: 101, paid: true, paymentDate: "2020-05-29", total: total, username: user.username };
            cartObj2 = { id: 2, customerId: 102, paid: false, paymentDate: nullValue, total: 200.75, username: "customer1" };
            cartObj3 = { id: 3, customerId: 103, paid: true, paymentDate: "1980-06-25", total: 300.25, username: "customer1" };
            productObj1 = { model: "iPhone 14", category: "Smartphone", sellingPrice: 999.99, quantity: 1 };
            productObj2 = { model: "Dell XPS 15", category: "Laptop", sellingPrice: 1599.99, quantity: 1 };
            productObj3 = { model: "Samsung Refrigerator", category: "Appliance", sellingPrice: 799.99, quantity: 1 };

            cart1 = new Cart(cartObj1.username, cartObj1.paid, cartObj1.paymentDate, cartObj1.total, productsR);
            cart2 = new Cart(cartObj2.username, cartObj2.paid, cartObj2.paymentDate, cartObj2.total, [new ProductInCart(productObj1.model, productObj1.quantity, Category.SMARTPHONE, productObj1.sellingPrice)]);
            cart3 = new Cart(cartObj3.username, cartObj3.paid, cartObj3.paymentDate, cartObj3.total, [new ProductInCart(productObj2.model, 1, Category.LAPTOP, productObj2.sellingPrice), new ProductInCart(productObj3.model, 1, Category.APPLIANCE, productObj3.sellingPrice)]);
        });

        test("loop0_Times", async () => {
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, []);
                return {} as Database;
            });
            jest.spyOn(db, "all");
            const result = await cartDAO.getAllCartsDAO();
            expect(db.all).toBeCalledTimes(1);
            expect(result).toEqual([]);
        });

        test("loop1_Time", async () => {
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, [cartObj1]);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            });
            const result = await cartDAO.getAllCartsDAO();
            expect(db.all).toBeCalledTimes(2);
            expect(result).toEqual([cart1]);
        });

        test("loopN_Times", async () => {
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, [cartObj1, cartObj2, cartObj3]);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, [productObj1]);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(null, [productObj2, productObj3]);
                return {} as Database;
            });
            const result = await cartDAO.getAllCartsDAO();
            expect(db.all).toBeCalledTimes(4);
            expect(result).toEqual([cart1, cart2, cart3]);
        });

        test("errorSQL_firts_all", async () => {
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            jest.spyOn(db, "all");
            await expect(cartDAO.getAllCartsDAO()).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.all).toBeCalledTimes(1);
        });

        test("errorSQL_second_all", async () => {
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, [cartObj1, cartObj2, cartObj3]);
                return {} as Database;
            });
            jest.spyOn(db, "all").mockImplementationOnce((sql, params, callback) => {
                callback(null, products);
                return {} as Database;
            }).mockImplementationOnce((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            await expect(cartDAO.getAllCartsDAO()).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.all).toBeCalledTimes(4);
        });
    });
});