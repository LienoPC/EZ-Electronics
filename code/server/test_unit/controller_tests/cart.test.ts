import CartController from '../../src/controllers/cartController';
import { describe, test, expect, beforeEach, afterEach, beforeAll, jest } from "@jest/globals"
import { Cart, ProductInCart, } from '../../src/components/cart';
import { Category, Product } from '../../src/components/product';
import { Role, User } from '../../src/components/user';
import { CartNotFoundError, EmptyCartError, ProductInCartError } from '../../src/errors/cartError';
import { EmptyProductStockError, ProductNotFoundError } from '../../src/errors/productError';
import CartDAO from '../../src/dao/cartDAO';

jest.mock("../../src/dao/cartDAO.ts");

const DATABASE_ERROR_MESSAGE = "Database Error";

describe('CartController Unit Tests', () => {
    let cartController: CartController;
    
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
        cartController = new CartController();

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

    describe("addToCart", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "addToCartDAO").mockResolvedValueOnce(true);
            const result = await cartController.addToCart(user1, product1.model);

            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "addToCartDAO").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.addToCart(user1, product1.model)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
        });

        test("ProductNotFound", async () => {
            jest.spyOn(CartDAO.prototype, "addToCartDAO").mockRejectedValueOnce(new ProductNotFoundError);
            
            await expect(cartController.addToCart(user1, product1.model)).rejects.toThrowError(ProductNotFoundError);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
        });

        test("emptyStock", async () => {
            jest.spyOn(CartDAO.prototype, "addToCartDAO").mockRejectedValueOnce(new EmptyProductStockError);
            
            await expect(cartController.addToCart(user1, product1.model)).rejects.toThrowError(EmptyProductStockError);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.addToCartDAO).toHaveBeenCalledWith(user1, product1.model);
        });
    });

    describe("getCart", () => {
        test("currentCartWithProducts", async () => {
            jest.spyOn(CartDAO.prototype, "getCartByUser").mockResolvedValueOnce(cart1);
            const result = await cartController.getCart(user1);

            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledWith(user1);
            expect(result).toEqual(cart1);
        });

        test("emptyOrAbsentCurrentCart", async () => {
            jest.spyOn(CartDAO.prototype, "getCartByUser").mockResolvedValueOnce(new Cart(user1.username, false, nullValue, 0, []));
            const result = await cartController.getCart(user1);

            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledWith(user1);
            expect(result).toEqual(new Cart(user1.username, false, nullValue, 0, []));
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "getCartByUser").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.getCart(user1)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getCartByUser).toHaveBeenCalledWith(user1);
        });
    });

    describe("checkoutCart", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "doCheckoutByUsername").mockResolvedValueOnce(true);
            const result = await cartController.checkoutCart(user1);

            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "doCheckoutByUsername").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });

        test("cartNotFound", async () => {
            jest.spyOn(CartDAO.prototype, "doCheckoutByUsername").mockRejectedValueOnce(new CartNotFoundError());
            
            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(CartNotFoundError);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });

        test("emptyCart", async () => {
            jest.spyOn(CartDAO.prototype, "doCheckoutByUsername").mockRejectedValueOnce(new EmptyCartError());
            
            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(EmptyCartError);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });

        test("productNotAvailable",async () => {
            jest.spyOn(CartDAO.prototype, "doCheckoutByUsername").mockRejectedValueOnce(new ProductInCartError());
            
            await expect(cartController.checkoutCart(user1)).rejects.toThrowError(ProductInCartError);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.doCheckoutByUsername).toHaveBeenCalledWith(user1);
        });
    });

    describe("getCustomerCarts", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "getHistoryByUsername").mockResolvedValueOnce([cart2, cart3]);
            const result = await cartController.getCustomerCarts(user1);

            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledWith(user1);
            expect(result).toEqual([cart2, cart3]);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "getHistoryByUsername").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.getCustomerCarts(user1)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getHistoryByUsername).toHaveBeenCalledWith(user1);
        });
    });

    describe("removeProductFromCart", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "removeProductFromCartDAO").mockResolvedValueOnce(true);
            const result = await cartController.removeProductFromCart(user1, product2.model);

            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "removeProductFromCartDAO").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.removeProductFromCart(user1, product2.model)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
        });

        test("noCurrentCart", async () => {
            jest.spyOn(CartDAO.prototype, "removeProductFromCartDAO").mockRejectedValueOnce(new CartNotFoundError());
            
            await expect(cartController.removeProductFromCart(user1, product2.model)).rejects.toThrowError(CartNotFoundError);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
        });

        test("productNotInCart", async () => {
            jest.spyOn(CartDAO.prototype, "removeProductFromCartDAO").mockRejectedValueOnce(new ProductInCartError());
            
            await expect(cartController.removeProductFromCart(user1, product2.model)).rejects.toThrowError(ProductInCartError);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.removeProductFromCartDAO).toHaveBeenCalledWith(user1, product2.model);
        });
    });

    describe("clearCart", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "clearCartDAO").mockResolvedValueOnce(true);
            const result = await cartController.clearCart(user1);

            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledWith(user1);
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "clearCartDAO").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.clearCart(user1)).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledWith(user1);
        });

        test("cartNotFound", async () => {
            jest.spyOn(CartDAO.prototype, "clearCartDAO").mockRejectedValueOnce(new CartNotFoundError());
            
            await expect(cartController.clearCart(user1)).rejects.toThrowError(CartNotFoundError);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.clearCartDAO).toHaveBeenCalledWith(user1);
        });
    });

    describe("deleteAllCarts", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "deleteAllCartsDAO").mockResolvedValueOnce(true);
            const result = await cartController.deleteAllCarts();

            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledWith();
            expect(result).toEqual(true);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "deleteAllCartsDAO").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.deleteAllCarts()).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.deleteAllCartsDAO).toHaveBeenCalledWith();
        });
    });

    describe("getAllCarts", () => {
        test("correctExecution", async () => {
            jest.spyOn(CartDAO.prototype, "getAllCartsDAO").mockResolvedValueOnce([cart1, cart2, cart3]);
            const result = await cartController.getAllCarts();

            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledWith();
            expect(result).toEqual([cart1, cart2, cart3]);
        });

        test("databaseError", async () => {
            jest.spyOn(CartDAO.prototype, "getAllCartsDAO").mockRejectedValueOnce(new Error(DATABASE_ERROR_MESSAGE));
            
            await expect(cartController.getAllCarts()).rejects.toThrowError(DATABASE_ERROR_MESSAGE);
            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledTimes(1);
            expect(CartDAO.prototype.getAllCartsDAO).toHaveBeenCalledWith();
        });
    });
});