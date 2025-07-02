import db from "../db/db"
import { User } from "../components/user"
import { Cart, ProductInCart } from "../components/cart"
import ProductDAO from "./productDAO"
import crypto from "crypto"
import { CartNotFoundError, ProductInCartError, ProductNotInCartError, WrongUserCartError, EmptyCartError } from "../errors/cartError";
import { EmptyProductStockError, ProductNotFoundError } from "../errors/productError"
import dayjs from "dayjs"
/**
 * A class that implements the interaction with the database for all cart-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class CartDAO {

    getCartById(id: number): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                const sql = "SELECT c.id, c.paid, c.paymentDate, c.total, u.username FROM carts c, users u WHERE c.customerId = u.id AND c.id = ? AND paid = 1"
                db.get(sql, [id], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    } else if (!row) {
                        return reject(new CartNotFoundError);
                    } else {
                        const sql1 = "SELECT p.model, pc.quantity, p.category, p.sellingPrice FROM product_cart pc, products p WHERE p.id = pc.productId AND pc.cartId = ?"
                        db.all(sql1, [id], (err: Error | null, rows: any[]) => {
                            if (err) {
                                return reject(err)
                            } else {
                                const products: ProductInCart[] = []
                                rows.forEach((product) => {
                                    const product_in_cart: ProductInCart = new ProductInCart(product.model, product.quantity, product.category, product.sellingPrice)
                                    products.push(product_in_cart)
                                })
                                resolve(new Cart(row.username, true, row.paymentDate, row.total, products))
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Returns a cart object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getCartByUser(user: User): Promise<Cart> {
        return new Promise<Cart>((resolve, reject) => {
            try {
                const sql = "SELECT c.* FROM carts c, users u WHERE c.customerId = u.id AND u.username = ? AND c.paid = 0"
                db.get(sql, [user.username], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    }
                    if (!row) {
                        return resolve(new Cart(user.username, false, null, 0, []))
                    }
                    const products: ProductInCart[] = [];
                    let total = 0
                    const sql2 = "SELECT p.model, p.category, p.sellingPrice, pc.quantity FROM product_cart pc, products p WHERE pc.productId = p.id AND pc.cartId = ?"
                    db.all(sql2, [row.id], (err: Error | null, rows: any[]) => {
                        if (err) {
                            return reject(err)
                        } else if (rows.length === 0) {
                            return resolve(new Cart(user.username, false, row.paymentDate, 0, []));
                        }
                        rows.forEach((element) => {
                            const product: ProductInCart = new ProductInCart(element.model, element.quantity, element.category, element.sellingPrice)
                            products.push(product)
                            total += element.sellingPrice * element.quantity
                        })
                        resolve(new Cart(user.username, false, row.paymentDate, total, products))
                    })
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /*Adds a product instance, identified by the model, to the current cart of the logged in user. 
    In case there is no information about the current unpaid cart of the user, the information should be inserted in the database, 
    together with the information about the product. In case there is information about the cart, then two scenarios can happen, 
    depending on the product to add: if there is already at least one instance of the product in the cart, its amount is increased by one; 
    if there are no instances of the product in the cart, its information is added. The total cost of the cart should be updated with the cost 
    of the product instance.*/

    addToCartDAO(user: User, product: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                let total = 0
                // Seleziono il prodotto da aggiungere
                const sql1 = "SELECT id, quantity FROM products WHERE model = ?"
                db.get(sql1, [product], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    } else if (!row) {
                        return reject(new ProductNotFoundError())
                    } else if (row.quantity <= 0) {
                        return reject(new EmptyProductStockError())
                    } else { // Qui il prodotto esiste, vado quindi a vedere se il carrello dello user esiste e non è ancora stato pagato
                        const sql2 = "SELECT c.id, c.customerId, c.paid, c.paymentDate, c.total FROM carts c, users u WHERE c.customerId = u.id AND u.username = ? AND c.paid = 0"
                        db.get(sql2, [user.username], (err: Error | null, row_cart: any) => {
                            if (err) {
                                return reject(err)
                            } else if (!row_cart) {// Creo nuovo cart e aggiunto il prodotto al cart vuoto
                                total = row.sellingPrice
                                const sql3 = "SELECT id FROM users WHERE username = ?"
                                db.get(sql3, [user.username], (err: Error | null, u: any) => {
                                    if (err) {
                                        return reject(err)
                                    } else {
                                        const sql4 = "INSERT INTO carts (customerId, paid, paymentDate) VALUES (?, ?, ?)"
                                        db.run(sql4, [u.id, 0, null], (err: Error | null) => {
                                            if (err) {
                                                return reject(err)
                                            } else {
                                                const sql = "SELECT id FROM carts WHERE customerId = ? AND paid = 0"
                                                db.get(sql, [u.id], (err: Error | null, cart: any) => {
                                                    if (err) {
                                                        return reject(err)
                                                    } else {
                                                        const sql5 = "INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)"
                                                        db.run(sql5, [row.id, cart.id, 1], (err: Error | null) => {
                                                            if (err) {
                                                                return reject(err)
                                                            } else {
                                                                resolve(true)
                                                            }
                                                        })
                                                    }
                                                })

                                            }
                                        })
                                    }
                                })
                            } else { // Carrello già esistente
                                const sql6 = "SELECT p.productId, p.quantity FROM product_cart p, carts c WHERE p.cartId = c.id AND p.productId = ? AND c.paid = 0"
                                db.get(sql6, [row.id], (err: Error | null, row_prod: any) => {
                                    if (err) {
                                        return reject(err)
                                    } else if (!row_prod) { // Prodotto esistente ma non presente nel cart
                                        const sql7 = "INSERT INTO product_cart (productId, cartId, quantity) VALUES (?, ?, ?)"
                                        db.run(sql7, [row.id, row_cart.id, 1], (err: Error | null) => {
                                            if (err) {
                                                return reject(err)
                                            } else {
                                                resolve(true)
                                            }
                                        })
                                    } else { // Prodotto esistente e già esistente nel carrello
                                        let quantity = row_prod.quantity + 1
                                        const sql9 = "UPDATE product_cart SET quantity = ? WHERE productId = ?"
                                        db.run(sql9, [quantity, row_prod.productId], (err: Error | null) => {
                                            if (err) {
                                                return reject(err)
                                            } else {
                                                resolve(true)
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    doCheckoutByUsername(user: User): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const currentDate = dayjs().format('YYYY-MM-DD');
                const sql = "SELECT c.id FROM carts c, users u WHERE c.customerId = u.id AND u.username = ? AND c.paid = 0"
                db.get(sql, [user.username], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    } else if (!row) {
                        return reject(new CartNotFoundError)
                    } else {
                        const sql1 = "SELECT productId, quantity FROM product_cart WHERE cartId = ?"
                        db.all(sql1, [row.id], (err: Error | null, rows: any[]) => {
                            if (err) {
                                return reject(err)
                            } else if (rows.length === 0) {
                                return reject(new EmptyCartError)
                            } else {
                                const promises: Promise<boolean>[] = rows.map((element) => {
                                    return new Promise((resolve, reject) => {
                                        const sql2 = "SELECT quantity FROM products WHERE id = ?"
                                        db.get(sql2, [element.productId], (err: Error | null, product: any) => {
                                            if (err) {
                                                reject(err)
                                            } else if (product.quantity <= 0 || element.quantity > product.quantity) {
                                                reject(new ProductInCartError)
                                            } else {
                                                resolve(product)
                                            }
                                        })
                                    })
                                })
                                Promise.all(promises).then(() => {
                                    const sql3 = "UPDATE carts SET paid = ?, paymentDate = ? WHERE id = ?"
                                    db.run(sql3, [1, currentDate, row.id], (err: Error | null) => {
                                        if (err) {
                                            return reject(err)
                                        } else {
                                            resolve(true)
                                        }
                                    })
                                })
                                    .catch((error) => {
                                        reject(error)
                                    })
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Returns a carts object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getHistoryByUsername(user: User): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const carts: Cart[] = []
                const sql = "SELECT c.id FROM carts c, users u WHERE c.customerId = u.id AND u.username = ? AND c.paid = 1"
                db.all(sql, [user.username], async (err: Error | null, rows: any) => {
                    if (err) {
                        return reject(err)
                    } else {
                        for (let row of rows) {
                            try {
                                const cart = await this.getCartById(row.id)
                                carts.push(cart)
                            } catch (error) {
                                return reject(error)
                            }
                        }
                        resolve(carts)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    removeProductFromCartDAO(user: User, product: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            const sql = "SELECT c.id FROM carts c, users u WHERE c.customerId = u.id AND u.username = ? AND c.paid = 0"
            db.get(sql, [user.username], (err: Error | null, row: any) => {
                if (err) {
                    return reject(err)
                } else if (!row) {
                    return reject(new CartNotFoundError)
                } else {
                    const sql1 = "SELECT p.id, pc.quantity FROM products p, product_cart pc WHERE p.id = pc.productId AND p.model = ? AND pc.cartId = ?"
                    db.get(sql1, [product, row.id], (err: Error | null, prod: any) => {
                        if (err) {
                            return reject(err)
                        } else if (!prod) {
                            return reject(new ProductNotInCartError)
                        } else {
                            if (prod.quantity <= 1) {
                                const sql2 = "DELETE FROM product_cart WHERE productId = ? AND cartId = ?"
                                db.run(sql2, [prod.id, row.id], (err: Error | null) => {
                                    if (err) {

                                        return reject(err)
                                    } else {
                                        return resolve(true)
                                    }
                                })
                            } else {
                                const sql2 = "UPDATE product_cart SET quantity = ? WHERE productId = ? AND cartId = ?"
                                db.run(sql2, [prod.quantity - 1, prod.id, row.id], (err: Error | null) => {
                                    if (err) {
                                        return reject(err)
                                    } else {
                                        resolve(true)
                                    }
                                })
                            }
                        }
                    })
                }
            })
        })
    }

    clearCartDAO(user: User): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "SELECT c.id FROM carts c, users u WHERE u.id = c.customerId AND u.username = ? AND paid = 0"
                db.get(sql, [user.username], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    } else if (!row) {
                        return reject(new CartNotFoundError)
                    } else {
                        const sql2 = "DELETE FROM product_cart WHERE cartId = ?"
                        db.run(sql2, [row.id], (err: Error | null) => {
                            if (err) {
                                reject(err)
                                return
                            } else {
                                resolve(true)
                            }
                        })
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    deleteAllCartsDAO(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM carts"
                db.run(sql, [], (err: Error | null) => {
                    if (err) {
                        return reject(err)
                    } else {
                        resolve(true)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    getAllCartsDAO(): Promise<Cart[]> {
        return new Promise<Cart[]>((resolve, reject) => {
            try {
                const carts: Cart[] = []
                const sql1 = "SELECT c.*, u.username FROM carts c, users u WHERE c.customerId = u.id"
                db.all(sql1, [], (err: Error | null, rows: any[]) => {
                    if (err) {
                        return reject(err)
                    } else {
                        // Creiamo un array di promesse per le query secondarie
                        const productPromises = rows.map((row) => {
                            return new Promise<void>((resolveProduct, rejectProduct) => {
                                const products: ProductInCart[] = [];
                                const sql2 = "SELECT p.model, p.category, p.sellingPrice, pc.quantity FROM product_cart pc, products p WHERE pc.productId = p.id AND pc.cartId = ?";
                                db.all(sql2, [row.id], (err: Error | null, elements: any[]) => {
                                    if (err) {
                                        return rejectProduct(err);
                                    } else {
                                        elements.forEach((element) => {
                                            const product = new ProductInCart(element.model, element.quantity, element.category, element.sellingPrice);
                                            products.push(product);
                                        });
                                        carts.push(new Cart(row.username, row.paid ? true : false, row.paymentDate, row.total, products));
                                        resolveProduct();
                                    }
                                });
                            });
                        });

                        // Aspettiamo che tutte le promesse delle query secondarie siano risolte
                        Promise.all(productPromises)
                            .then(() => resolve(carts))
                            .catch(e => reject(e));
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }
}

export default CartDAO