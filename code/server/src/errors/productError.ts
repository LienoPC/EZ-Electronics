const PRODUCT_NOT_FOUND = "Product not found"
const PRODUCT_ALREADY_EXISTS = "The product already exists"
const PRODUCT_SOLD = "Product already sold"
const EMPTY_PRODUCT_STOCK = "Product stock is empty"
const LOW_PRODUCT_STOCK = "Product stock cannot satisfy the requested quantity"
const INVALID_GROUPING_ERROR = 'Invalid request: grouping is null and any of category or model is not null.';
const INVALID_CATEGORY_GROUPING_ERROR = 'Invalid request: grouping is category and category is null OR model is not null.';
const INVALID_MODEL_GROUPING_ERROR = 'Invalid request: grouping is model and model is null OR category is not null.';

/**
 * Represents an error that occurs when a product is not found.
 */
class ProductNotFoundError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_NOT_FOUND
        this.customCode = 404
    }
}

/**
 * Represents an error that occurs when a product id already exists.
 */
class ProductAlreadyExistsError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_ALREADY_EXISTS
        this.customCode = 409
    }
}

/**
 * Represents an error that occurs when a product is already sold.
 */
class ProductSoldError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = PRODUCT_SOLD
        this.customCode = 409
    }
}

class EmptyProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = EMPTY_PRODUCT_STOCK
        this.customCode = 409
    }
}

class LowProductStockError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = LOW_PRODUCT_STOCK
        this.customCode = 409
    }
}

class InvalidGroupingError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INVALID_GROUPING_ERROR
        this.customCode = 422
    }
}

class InvalidCategoryGroupingError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INVALID_CATEGORY_GROUPING_ERROR
        this.customCode = 422
    }
}

class InvalidModelGroupingError extends Error {
    customMessage: string
    customCode: number

    constructor() {
        super()
        this.customMessage = INVALID_MODEL_GROUPING_ERROR
        this.customCode = 422
    }
}

export { ProductNotFoundError, ProductAlreadyExistsError, ProductSoldError, EmptyProductStockError, LowProductStockError, InvalidCategoryGroupingError, InvalidModelGroupingError, InvalidGroupingError }