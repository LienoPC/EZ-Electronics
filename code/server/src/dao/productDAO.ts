import { ProductAlreadyExistsError, ProductNotFoundError, ProductSoldError } from "../errors/productError"
import { Product } from "../components/product"
import { ProductNotInCartError } from "../errors/cartError"
import db from "../db/db"

/**
 * A class that implements the interaction with the database for all product-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ProductDAO {

    /**
     * Verify the existence of a product in the database
     * @param model The model of the product to increase.
     * @returns A Promise that resolves to a true if the product is found
     */
    exist(model: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try{
                const sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, [model], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    }
                    else if (!row) {
                        // product not found
                        return resolve(false);
                    } else {
                        // product found
                        return resolve(true)
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Insert a new model in the database
     * @param product The product object to insert
     * @returns A Promise that resolves to any or error
     */
    add(product: Product) {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "INSERT INTO products(model, category, sellingPrice, arrivalDate, details, quantity) VALUES(?,?,?,?,?,?)"
                db.run(sql, [product.model, product.category, product.sellingPrice, product.arrivalDate, product.details, product.quantity], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    } else {
                        return resolve()
                    }
                })
            } catch (error) {
                reject(error)
            }
        })
    };

    /**
     * Get a product from the database
     * @param model The model of the product to get.
     * @returns a Promise that resolves the product object found
     */
    get(model: string): Promise<Product> {
        return new Promise<Product>((resolve, reject) => {
            try {
                // Check if the model is an empty string
                if (!model) {
                    reject(new ProductNotFoundError());
                    return;
                }
                const sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, model, (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    } else if (!row) {
                        return reject(new ProductNotFoundError())
                    } else {
                        // create the object product and resolve it
                        var product = new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity)
                        return resolve(product)
                    }
                })
            } catch (error) {
                reject(error)
            }
        });
    }
    /**
     * Get all products from the database
     * @returns a Promise that resolves to an array of products
     */
    getAllProducts(): Promise<Product[]> {

        return new Promise<Product[]>((resolve, reject) => {
            try {
                let products: Product[] = []
                const sql = "SELECT * FROM products"
                db.all(sql, [], (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err)
                    }
                    if (rows != undefined) {
                        rows.forEach((row: any) => {
                            //console.log(row)
                            products.push(new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity))
                        })
                    }
                    resolve(products)
                })
            } catch (error) {
                reject(error)
            }
        });
    }

    /**
         * Returns all the available products present in the database, with optional filtering by either category or model
         * @param grouping optional filtering type: 'category' or 'model'
         * @param category if grouping == category then this field contains the category to filter
         * @param model if gouping == model then this fields contains the model to filter
         * @returns a Promise that resolves the list of available products that satisfy the filter
         */
    getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        return new Promise<Product[]>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM products WHERE quantity > 0";
                let params: any[] = [];

                if (grouping === 'category') {
                    sql += " AND category = ?";
                    params.push(category);
                } else if (grouping === 'model') {
                    sql += " AND model = ?";
                    params.push(model);
                }

                db.all(sql, params, (err: Error | null, rows: any[]) => {
                    if (err) {
                        reject(err);
                    } else {
                        const products = rows.map((row: any) => new Product(row.sellingPrice, row.model, row.category, row.arrivalDate, row.details, row.quantity));
                        resolve(products);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }


    /**
    * Change the quantity of a model in the database
    * @param model The model of the product to increase.
    * @param newQuantity The new value of quantity
    * @returns A Promise that resolves to any or error
    */
    changeQuantity(model: string, newQuantity: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM products WHERE model = ?"
                db.get(sql, model, (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err);
                    } else if (!row) {
                        return reject(new ProductNotFoundError());
                    } else {
                        const updateSql = "UPDATE products SET quantity = ? WHERE model = ?"
                        db.run(updateSql, [newQuantity, model], (updateErr: Error | null) => {
                            if (updateErr) {
                                return reject(updateErr);
                            }
                            resolve();
                        });
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Delete one model from the database
     * @param model The model of the product to increase.
     * @returns A Promise that resolves to any or error
     */
    deleteOne(model: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                const productExists = await this.exist(model)
                if (productExists) {
                    const sql = "DELETE FROM products WHERE model = ?"
                    db.run(sql, [model], (err: Error | null) => {
                        if (err) return reject(err)
                        resolve()
                    })

                } else {
                    reject(new ProductNotFoundError())
                }

            } catch (error) {
                reject(error)
            }
        })
    }



    /**
     * Delete all models from the database
     * @returns A Promise that resolves to any or error
     */
    deleteAll(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const sql = "DELETE FROM products"
                db.run(sql, [], (err: Error | null) => {
                    if (err) return reject(err)
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        })
    }



}

export default ProductDAO