import { describe, test, expect, beforeEach, beforeAll, jest } from "@jest/globals"
import { Cart, ProductInCart, } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { CartNotFoundError, EmptyCartError, ProductInCartError, ProductNotInCartError } from '../../src/errors/cartError';
import { EmptyProductStockError, ProductNotFoundError } from '../../src/errors/productError';
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import ErrorHandler from "../../src/helper"
import CartController from "../../src/controllers/cartController";
import express from "express";

jest.mock("../../src/controllers/cartController");
jest.mock("../../src/routers/auth");
jest.mock("../../src/helper");

function registerErrorHandler(router: express.Application) {
    router.use((err: any, req: any, res: any, next: any) => {
        return res.status(err.customCode || 503).json({
            error: err.customMessage || "Internal Server Error",
            status: err.customCode || 503
        });
    })
}
registerErrorHandler(app);

const REQUEST_ERROR_MESSAGE = "Request error";
const baseURL = "/ezelectronics/carts"

describe('CartRoutes Unit Tests', () => {
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
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('GET /carts', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { req.user = user1; return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockResolvedValueOnce(cart1);
            const response = await request(app).get(baseURL);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(cart1);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "getCart").mockRejectedValueOnce(new Error());
            const response = await request(app).get(baseURL);

            expect(response.status).toBe(503);
            expect(CartController.prototype.getCart).toBeCalledTimes(1);
            expect(CartController.prototype.getCart).toBeCalledWith(user1);
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "getCart");
            const response = await request(app).get(baseURL);

            expect(response.status).toBe(401);
            expect(CartController.prototype.getCart).toBeCalledTimes(0);
        });
    });

    describe('POST /carts', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { req.user = user1; req.body.model = product1.model; return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockResolvedValue(true);
            const response = await request(app).post(baseURL).send({ model: product1.model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new Error());
            const response = await request(app).post(baseURL).send({ model: product1.model });

            expect(response.status).toBe(503);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "addToCart");
            const response = await request(app).post(baseURL).send({ model: product1.model });

            expect(response.status).toBe(401);
            expect(CartController.prototype.addToCart).toBeCalledTimes(0);
        });

        test("requestError - return status 422", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return res.status(422).json({ error: REQUEST_ERROR_MESSAGE }); });
            const response = await request(app).post(baseURL).send({ model: product1.model });

            expect(response.status).toBe(422);
            expect(CartController.prototype.addToCart).toBeCalledTimes(0);
        });

        test("productNotFound - return status 404", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new ProductNotFoundError());
            const response = await request(app).post(baseURL).send({ model: product1.model });

            expect(response.status).toBe(404);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);
        });

        test("productNotAvailable - return status 409", async () => {
            jest.spyOn(CartController.prototype, "addToCart").mockRejectedValueOnce(new EmptyProductStockError());
            const response = await request(app).post(baseURL).send({ model: product1.model });

            expect(response.status).toBe(409);
            expect(CartController.prototype.addToCart).toBeCalledTimes(1);
            expect(CartController.prototype.addToCart).toBeCalledWith(user1, product1.model);
        });
    });

    describe('PATCH /carts', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { req.user = user1; return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockResolvedValue(true);
            const response = await request(app).patch(baseURL);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new Error());
            const response = await request(app).patch(baseURL);

            expect(response.status).toBe(503);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "checkoutCart");
            const response = await request(app).patch(baseURL);

            expect(response.status).toBe(401);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(0);
        });

        test("noCurrentCart - return status 404", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new CartNotFoundError());
            const response = await request(app).patch(baseURL);

            expect(response.status).toBe(404);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);
        });

        test("currentCartEmpty - return status 400", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new EmptyCartError());
            const response = await request(app).patch(baseURL);

            expect(response.status).toBe(400);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);
        });

        test("productNotAvailable - return status 409", async () => {
            jest.spyOn(CartController.prototype, "checkoutCart").mockRejectedValueOnce(new ProductInCartError());
            const response = await request(app).patch(baseURL);

            expect(response.status).toBe(409);
            expect(CartController.prototype.checkoutCart).toBeCalledTimes(1);
            expect(CartController.prototype.checkoutCart).toBeCalledWith(user1);
        });
    });

    describe('GET /carts/history', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { req.user = user1; return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockResolvedValue([cart2, cart3]);
            const response = await request(app).get(baseURL + '/history');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([cart2, cart3]);
            expect(CartController.prototype.getCustomerCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getCustomerCarts).toBeCalledWith(user1);
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "getCustomerCarts").mockRejectedValueOnce(new Error());
            const response = await request(app).get(baseURL + '/history');

            expect(response.status).toBe(503);
            expect(CartController.prototype.getCustomerCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getCustomerCarts).toBeCalledWith(user1);
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "getCustomerCarts");
            const response = await request(app).get(baseURL + '/history');

            expect(response.status).toBe(401);
            expect(CartController.prototype.getCustomerCarts).toBeCalledTimes(0);
        });
    });

    describe('DELETE /carts/products/:model', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { req.user = user1; req.param.model = product2.model; return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockResolvedValue(true);
            const response = await request(app).delete(baseURL + '/products/' + product2.model);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new Error());
            const response = await request(app).delete(baseURL + '/products/' + product2.model);

            expect(response.status).toBe(503);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
        });

        test("requestError - return status 422", async () => {
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return res.status(422).json({ error: REQUEST_ERROR_MESSAGE }); });
            const response = await request(app).delete(baseURL + '/products/' + product2.model);

            expect(response.status).toBe(422);
            expect(CartController.prototype.addToCart).toBeCalledTimes(0);
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "removeProductFromCart");
            const response = await request(app).delete(baseURL + '/products/' + product2.model);

            expect(response.status).toBe(401);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(0);
        });

        test("productNotInCart - return status 404", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new ProductNotInCartError());
            const response = await request(app).delete(baseURL + '/products/' + product2.model);

            expect(response.status).toBe(404);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
        });

        test("noCurrentOrEmtyCart - return status 404", async () => {
            jest.spyOn(CartController.prototype, "removeProductFromCart").mockRejectedValueOnce(new CartNotFoundError());
            const response = await request(app).delete(baseURL + '/products/' + product2.model);

            expect(response.status).toBe(404);
            expect(CartController.prototype.removeProductFromCart).toBeCalledTimes(1);
            expect(CartController.prototype.removeProductFromCart).toBeCalledWith(user1, product2.model);
        });
    });

    describe('DELETE /carts/current', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { req.user = user1; return next(); });
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockResolvedValue(true);
            const response = await request(app).delete(baseURL + '/current');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new Error());
            const response = await request(app).delete(baseURL + '/current');

            expect(response.status).toBe(503);
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isCustomer").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "clearCart");
            const response = await request(app).delete(baseURL + '/current');

            expect(response.status).toBe(401);
            expect(CartController.prototype.clearCart).toBeCalledTimes(0);
        });

        test("noCurrentCart - return status 404", async () => {
            jest.spyOn(CartController.prototype, "clearCart").mockRejectedValueOnce(new CartNotFoundError());
            const response = await request(app).delete(baseURL + '/current');

            expect(response.status).toBe(404);
            expect(CartController.prototype.clearCart).toBeCalledTimes(1);
            expect(CartController.prototype.clearCart).toBeCalledWith(user1);
        });
    });

    describe('DELETE /carts', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockResolvedValue(true);
            const response = await request(app).delete(baseURL);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({});
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toBeCalledWith();
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "deleteAllCarts").mockRejectedValueOnce(new Error());
            const response = await request(app).delete(baseURL);

            expect(response.status).toBe(503);
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.deleteAllCarts).toBeCalledWith();
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "deleteAllCarts");
            const response = await request(app).delete(baseURL);

            expect(response.status).toBe(401);
            expect(CartController.prototype.deleteAllCarts).toBeCalledTimes(0);
        });
    });

    describe('GET /carts/all', () => {

        beforeEach(() => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return next(); });
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => { return next(); });
        });

        test("correctExecution - return status 200", async () => {
            jest.spyOn(CartController.prototype, "getAllCarts").mockResolvedValue([cart1, cart2, cart3]);
            const response = await request(app).get(baseURL + '/all');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([cart1, cart2, cart3]);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toBeCalledWith();
        });

        test("genericError - return status 503", async () => {
            jest.spyOn(CartController.prototype, "getAllCarts").mockRejectedValueOnce(new Error());
            const response = await request(app).get(baseURL + '/all');

            expect(response.status).toBe(503);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(1);
            expect(CartController.prototype.getAllCarts).toBeCalledWith();
        });

        test("userNotAllowed - return status 401", async () => {
            jest.spyOn(Authenticator.prototype, "isAdminOrManager").mockImplementation((req, res, next) => { return res.status(401).json({ error: "User is not a customer", status: 401 }) });
            jest.spyOn(CartController.prototype, "getAllCarts");
            const response = await request(app).get(baseURL + '/all');

            expect(response.status).toBe(401);
            expect(CartController.prototype.getAllCarts).toBeCalledTimes(0);
        });
    });
});
