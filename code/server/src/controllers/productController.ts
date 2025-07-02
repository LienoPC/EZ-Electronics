import ProductDAO from "../dao/productDAO";
import { Product, Category } from "../components/product";
import { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, InvalidCategoryGroupingError, InvalidModelGroupingError, InvalidGroupingError } from "../errors/productError";
import { error } from "console";
import { LowProductStockError } from "../errors/productError";
import { EmptyProductStockError } from "../errors/productError";
import { KeyObject } from "crypto";
import { DateError, GroupingError } from "../utilities";
import dayjs from "dayjs";
import db from "../../src/db/db";
import { rejects } from "assert";

/**
 * Represents a controller for managing products.
 * All methods of this class must interact with the corresponding DAO class to retrieve or store data.
 */
class ProductController {
    private dao: ProductDAO

    constructor() {
        this.dao = new ProductDAO
    }

    /**
     * Registers a new product concept (model, with quantity defining the number of units available) in the database.
     * @param model The unique model of the product.
     * @param category The category of the product.
     * @param quantity The number of units of the new product.
     * @param details The optional details of the product.
     * @param sellingPrice The price at which one unit of the product is sold.
     * @param arrivalDate The optional date in which the product arrived.
     * @returns A Promise that resolves to nothing.
     */
    async registerProducts(model: string, category: string, quantity: number, details: string | null, sellingPrice: number, arrivalDate: string | null): Promise<void> {
        var newModel: Product
        var cat: Category

        switch (category) {
            case "Smartphone":
                cat = Category.SMARTPHONE
                break
            case "Laptop":
                cat = Category.LAPTOP
                break
            case "Appliance":
                cat = Category.APPLIANCE
                break
        }

        const productExists = await ProductDAO.prototype.exist(model);
        if (productExists) {
            return Promise.reject(new ProductAlreadyExistsError());
        }
        // verify if the date is undefined
        if (!arrivalDate) {
            arrivalDate = dayjs().format('YYYY-MM-DD');
        }
        if (dayjs(arrivalDate).isAfter(dayjs(), "date")) {
            // date after the current Date
            return new Promise((resolve, reject) => {
                reject(new DateError())
            })
        }
        newModel = new Product(sellingPrice, model, cat, arrivalDate, details, quantity)
        return this.dao.add(newModel)
    }

    /**
     * Increases the available quantity of a product through the addition of new units.
     * @param model The model of the product to increase.
     * @param newQuantity The number of product units to add. This number must be added to the existing quantity, it is not a new total.
     * @param changeDate The optional date in which the change occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async changeProductQuantity(model: string, newQuantity: number, changeDate: string | null): Promise<number> {

        // verify if the date is undefined
        if (!changeDate) {
            changeDate = dayjs().format('YYYY-MM-DD');
        } else if (dayjs(changeDate).isAfter(dayjs(), "date")) {
            return Promise.reject(new DateError());
        }
        try {
            const product = await this.dao.get(model);
            if (!product) {
                return Promise.reject(new ProductNotFoundError())
            }
            if (dayjs(product.arrivalDate).isAfter(dayjs(changeDate), "date")) {
                return Promise.reject(new DateError());
            }

            await this.dao.changeQuantity(model, product.quantity + newQuantity);
            return Promise.resolve(product.quantity + newQuantity);
        } catch (err) {
            return Promise.reject(err);
        }
    }

    /**
     * Decreases the available quantity of a product through the sale of units.
     * @param model The model of the product to sell
     * @param quantity The number of product units that were sold.
     * @param sellingDate The optional date in which the sale occurred.
     * @returns A Promise that resolves to the new available quantity of the product.
     */
    async sellProduct(model: string, quantity: number, sellingDate: string | null): Promise<number> {

        // verify if the date is undefined
        if (!sellingDate) {
            sellingDate = dayjs().format('YYYY-MM-DD');
        }
        if (dayjs(sellingDate).isAfter(dayjs(), "date")) {
            return Promise.reject(new DateError());
        }

        try {
            const product = await this.dao.get(model);
            if (!product) {
                return Promise.reject(new ProductNotFoundError());
            }
            if (dayjs(sellingDate).isBefore(dayjs(product.arrivalDate), "date")) {
                return Promise.reject(new DateError());
            }
            // verify if the number sold is less then the available quantity
            if (quantity <= product.quantity) {
                // verify if the quantity is greater than 0
                if (product.quantity > 0) {
                    // change the quantity of the available products
                    await this.dao.changeQuantity(model, product.quantity - quantity);
                    return Promise.resolve(product.quantity - quantity);
                } else {
                    return Promise.reject(new EmptyProductStockError()); // 409
                }
            } else {
                return Promise.reject(new LowProductStockError()); // 409
            }

        } catch (err) {
            return Promise.reject(err); //404 or others
        }

    }
    /**
     * Returns all products in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {
        if (grouping != null && grouping != 'model' && grouping != 'category') {
            return Promise.reject(new InvalidGroupingError());
        }
        let products: Product[] = []
        return new Promise<Product[]>((resolve, reject) => {
            if (grouping === null || this.validateFiltering(grouping, category, model)) {
                switch (grouping) {
                    case "category":
                        {
                            // Get all products from the database
                            this.dao.getAllProducts()
                                .then((res) => {
                                    // Filter them
                                    products = res.filter((value, index) => {
                                        // categoria già verificata nella route
                                        return value.category == category
                                    })
                                    resolve(products)
                                })
                                .catch((err) => reject(err))
                        }
                        break
                    case "model":
                        {
                            // Get products from the database that match the model
                            this.dao.getAllProducts()
                                .then((res) => {
                                    products = res.filter((value, index) => {
                                        return value.model == model
                                    })
                                    if(products.length == 0){
                                        return reject(new ProductNotFoundError());
                                    }
                                    resolve(products)
                                })
                        }
                        break
                    case null:
                    case undefined:
                        {
                            // Return all products in the database
                            this.dao.getAllProducts()
                                .then((res) => resolve(res))
                                .catch((err) => reject(err))
                        }
                        break
                }
            } else {
                reject(new InvalidGroupingError())
            }
        });
    }



    /**
     * Returns all available products (with a quantity above 0) in the database, with the option to filter them by category or model.
     * @param grouping An optional parameter. If present, it can be either "category" or "model".
     * @param category An optional parameter. It can only be present if grouping is equal to "category" (in which case it must be present) and, when present, it must be one of "Smartphone", "Laptop", "Appliance".
     * @param model An optional parameter. It can only be present if grouping is equal to "model" (in which case it must be present and not empty).
     * @returns A Promise that resolves to an array of Product objects.
     */
    async getAvailableProducts(grouping: string | null, category: string | null, model: string | null): Promise<Product[]> {

        if (grouping == null && (category != null || model != null)) {
            return Promise.reject(new InvalidGroupingError());
        }

        if (grouping != 'category' && grouping != 'model' && grouping != null) {
            return Promise.reject(new InvalidGroupingError());
        }

        if (grouping == 'category' && (category == null || model != null)) {
            return Promise.reject(new InvalidCategoryGroupingError());
        }

        if (grouping == 'model' && (model == null || category != null || model == '')) {
            return Promise.reject(new InvalidModelGroupingError());
        }

        if (grouping === 'model') {
            const productExists = await ProductDAO.prototype.exist(model);
            if (!productExists) {
                return Promise.reject(new ProductNotFoundError());
            }
            const products = await this.dao.getAvailableProducts(grouping, category, model);
            return Promise.resolve(products);
        }
        return this.dao.getAvailableProducts(grouping, category, model);
    }

    /**
     * Deletes all products.
     * @returns A Promise that resolves to `true` if all products have been successfully deleted.
     */
    async deleteAllProducts(): Promise<boolean> {
        try {
            await this.dao.deleteAll();
            return Promise.resolve(true);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Deletes one product, identified by its model
     * @param model The model of the product to delete
     * @returns A Promise that resolves to `true` if the product has been successfully deleted.
     */
    async deleteProduct(model: string): Promise<Boolean> {
        return new Promise<Boolean>((resolve, reject) => {
            if (model === null || model === " " || model.length < 1) {
                reject(new ProductNotFoundError());
            } else {
                return this.dao.deleteOne(model)
                    .then(() => resolve(true))
                    .catch((error) => {
                            reject(error);
                    });
            }
        });
    }

    /*
       *
       *   Validate input for product filtering
       * 
      */
    private validateFiltering(grouping: string | null, category: string, model: string): boolean {

        if (grouping != undefined) {
            if (category != undefined && model == undefined && grouping == "category") {
                return true;
            } else if (category == undefined && model != undefined && grouping == "model") {
                return true;
            } else {
                return false;
            }
        } else {
            if (category == undefined && model == undefined) {
                return true;
            } else {
                return false;
            }

        }
    }


}

export default ProductController;