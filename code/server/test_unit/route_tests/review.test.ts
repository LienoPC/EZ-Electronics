import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import { assert, error } from "console"
import { ProductReview } from "../../src/components/review";
import ReviewController from "../../src/controllers/reviewController"
import Authenticator from "../../src/routers/auth";
import { User, Role } from "../../src/components/user";
import dayjs from "dayjs";
import ReviewRoutes from "../../src/routers/reviewRoutes";
import { app } from "../../index"
import request from 'supertest'
import ErrorHandler from "../../src/helper";
import { param } from "express-validator";
import { ProductNotFoundError } from "../../src/errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError";
import express from "express";



jest.mock("../../src/controllers/reviewController")
jest.mock("../../src/routers/auth")
jest.mock("../../src/helper")

function registerErrorHandler(router: express.Application) {
    router.use((err: any, req: any, res: any, next: any) => {
        return res.status(err.customCode || 503).json({
            error: err.customMessage || "Internal Server Error",
            status: err.customCode || 503
        });
    })
}
registerErrorHandler(app);



const baseURL = "/ezelectronics"
const GENERIC_SQL_ERROR = "SQL_error"
const CORRECT_SCORE = 1
const testReview = new ProductReview("model", "user", CORRECT_SCORE, "YYYY-MM-DD", "comment")
const testRequest = {
    score: CORRECT_SCORE,
    comment: "comment"
}
const testAdmin = new User("admin", "admin", "admin", Role.ADMIN, "", "")
const testCustomer = new User("customer", "customer", "customer", Role.CUSTOMER, "", "")



let mockReviewControlleraddReview: any
let mockReviewControllergetProductReviews: any
let mockReviewControllerdeleteReview: any
let mockReviewControllerdeleteReviewsOfProduct: any
let mockReviewControllerdeleteAllReviews: any
let mockAuthenticatorisLoggedIn: any
let mockAuthenticatorisCustomer: any
let mockAuthenticatorisAdminOrManager: any
let mockExpressValidator: any

beforeAll(async () =>{
    mockReviewControlleraddReview = jest.spyOn(ReviewController.prototype, "addReview")
    mockReviewControllergetProductReviews = jest.spyOn(ReviewController.prototype, "getProductReviews")
    mockReviewControllerdeleteReview = jest.spyOn(ReviewController.prototype, "deleteReview")
    mockReviewControllerdeleteReviewsOfProduct = jest.spyOn(ReviewController.prototype, "deleteReviewsOfProduct")
    mockReviewControllerdeleteAllReviews = jest.spyOn(ReviewController.prototype, "deleteAllReviews")
    mockAuthenticatorisLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn")
    mockAuthenticatorisCustomer = jest.spyOn(Authenticator.prototype, "isCustomer")
    mockAuthenticatorisAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager")
    mockExpressValidator = jest.spyOn(ErrorHandler.prototype, "validateRequest")
})

afterEach(async () => {
    mockReviewControlleraddReview.mockRestore()
    mockReviewControllergetProductReviews.mockRestore()
    mockReviewControllerdeleteReview.mockRestore()
    mockReviewControllerdeleteReviewsOfProduct.mockRestore()
    mockReviewControllerdeleteAllReviews.mockRestore()
    mockAuthenticatorisLoggedIn.mockRestore()
    mockAuthenticatorisCustomer.mockRestore()
    mockAuthenticatorisAdminOrManager.mockRestore()
    mockExpressValidator.mockReset()
})

describe("POST review/:model test", () => {
    test("Correct insertion case (200 status code)", async () => {
        // make authenticator go further in the validation chain
        
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), notEmpty: () => ({})}),
                isInt: () => (() => ({})),
            })),
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            req.user = testCustomer;
            return next();
        })
        
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControlleraddReview.mockResolvedValueOnce(undefined)
        const response = await request(app).post(baseURL + "/reviews/model").send(testRequest)
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
        expect(mockReviewControlleraddReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControlleraddReview).toHaveBeenCalledWith(
            testReview.model,
            testCustomer,
            testReview.score,
            testReview.comment
        )
    })


    test("Not existing product (404 status code)", async () => {
        const err = new ProductNotFoundError()
        jest.spyOn(ReviewController.prototype, "addReview").mockRejectedValue(err)
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), notEmpty: () => ({})}),
                isInt: () => (() => ({})),
            })),
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            req.user = testCustomer;
            return next();
        })
        
        //We mock the ErrorHandler validateRequest method to return the next function, because we are not testing the validation logic here (we assume it works correctly)
        jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
            return next()
        })
        
        
        const response = await request(app).post(baseURL + "/reviews/model").send(testRequest)
       // console.log(response)
        expect(response.status).toBe(404)
    
        expect(mockReviewControlleraddReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControlleraddReview).toHaveBeenCalledWith(
            testReview.model,
            testCustomer,
            testReview.score,
            testReview.comment
        )
    })

    test("Product already reviewed (409 status code)", async () => {
        const err = new ExistingReviewError()
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), notEmpty: () => ({})}),
                isInt: () => (() => ({})),
            })),
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            req.user = testCustomer;
            return next();
        })
        
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControlleraddReview.mockRejectedValueOnce(err)
        const response = await request(app).post(baseURL + "/reviews/model").send(testRequest)
        expect(response.status).toBe(409)
        expect(mockReviewControlleraddReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControlleraddReview).toHaveBeenCalledWith(
            testReview.model,
            testCustomer,
            testReview.score,
            testReview.comment
        )
    })

    test("User not customer (401 status code)", async () => {
        jest.mock('express-validator', () => ({
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), notEmpty: () => ({})}),
                isInt: () => (() => ({})),
            })),
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockReviewControlleraddReview.mockResolvedValueOnce(undefined)
        const response = await request(app).post(baseURL + "/reviews/model").send(testRequest)
        expect(response.status).toBe(401)
        expect(mockReviewControlleraddReview).toHaveBeenCalledTimes(0)
    })

    test("Input param not valid (422 status code)", async () => {
        const err = new Error("Invalid value")        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => {
                throw err
            }),
            body: jest.fn().mockImplementation(() => ({
                isString: () => ({ isLength: () => ({}), notEmpty: () => ({})}),
                isInt: () => (() => ({})),
            })),  
        }))
        
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            req.user = testCustomer;
            return next();
        })
        
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
        })
        
        //mockReviewControlleraddReview.mockResolvedValueOnce(undefined)
        const response = await request(app).post(baseURL + "/reviews/model").send(testRequest)
        expect(response.status).toBe(422)
        expect(mockReviewControlleraddReview).toHaveBeenCalledTimes(0)
    })


})


describe("GET review/:model test", () => {
    test("Correct resolve test (200 status code)", async () => {
        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllergetProductReviews.mockResolvedValueOnce([testReview])
        const response = await request(app).get(baseURL + "/reviews/model")
        expect(response.status).toBe(200)
        expect(response.body).toEqual([testReview])
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledWith(
            "model"
        )
    })


    test("No reviews test (200 status code)", async () => {        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllergetProductReviews.mockResolvedValueOnce([])
        const response = await request(app).get(baseURL + "/reviews/model")
        expect(response.status).toBe(200)
        expect(response.body).toEqual([])
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledWith(
            "model"
        )
    })


    test("Internal server error", async () => {
        const err = new Error()
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllergetProductReviews.mockRejectedValueOnce(err)
        const response = await request(app).get(baseURL + "/reviews/model")
        expect(response.status).toBe(503)
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledWith(
            "model"
        )
    })


    test("Input param not valid (422 status code)", async () => {
        const err = new Error("Invalid value")        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => {
                throw err
            })
        }))
    
        
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
        })
        const response = await request(app).get(baseURL + "/reviews/model")
        expect(response.status).toBe(422)
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledTimes(0)
    })


})



describe("DELETE review/:model test", () => {
    test("Correct resolve test (200 status code)", async () => {
        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReview.mockResolvedValueOnce(undefined)
        const response = await request(app).delete(baseURL + "/reviews/model")
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledWith(
            "model",
            undefined,
        )
    })


    test("No reviews test (404 status code)", async () => {  
        const err = new NoReviewProductError()
        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReview.mockRejectedValueOnce(err)
        const response = await request(app).delete(baseURL + "/reviews/model")
        expect(response.status).toBe(404)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledWith(
            "model",
            undefined,
        )
    })

    test("Product not found test(404 status code)", async () => {  
        const err = new ProductNotFoundError()
        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReview.mockRejectedValueOnce(err)
        const response = await request(app).delete(baseURL + "/reviews/model")
        expect(response.status).toBe(404)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledWith(
            "model",
            undefined,
        )
    })

    test("User not customer (401 status code)", async () => {
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not a customer", status: 401 })
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        const response = await request(app).delete(baseURL + "/reviews/model")
        expect(response.status).toBe(401)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledTimes(0)
    })

    test("Internal server error", async () => {
        const err = new Error()
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReview.mockRejectedValue(err)
        const response = await request(app).delete(baseURL + "/reviews/model")
        expect(response.status).toBe(503)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReview).toHaveBeenCalledWith(
            "model",
            undefined
        )
    })


    test("Input param not valid (422 status code)", async () => {
        const err = new Error("Invalid value")        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => {
                throw err
            })
        }))
    
        
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisCustomer.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
        })
        const response = await request(app).delete(baseURL + "/reviews/model")
        expect(response.status).toBe(422)
        expect(mockReviewControllergetProductReviews).toHaveBeenCalledTimes(0)
    })


})



describe("DELETE review/:model/all test", () => {
    test("Correct resolve test (200 status code)", async () => {
        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReviewsOfProduct.mockResolvedValueOnce(undefined)
        const response = await request(app).delete(baseURL + "/reviews/model/all")
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledWith(
            "model",
        )
    })

    test("User not admin or manager (401 status code)", async () => {
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not a admin/manager", status: 401 })
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        const response = await request(app).delete(baseURL + "/reviews/model/all")
        expect(response.status).toBe(401)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledTimes(0)
    })

    test("Product not found test(404 status code)", async () => {  
        const err = new ProductNotFoundError()
        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReviewsOfProduct.mockRejectedValueOnce(err)
        const response = await request(app).delete(baseURL + "/reviews/model/all")
        expect(response.status).toBe(404)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledWith(
            "model"
        )
    })

    test("Internal server error", async () => {
        const err = new Error()
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteReviewsOfProduct.mockRejectedValueOnce(err)
        const response = await request(app).delete(baseURL + "/reviews/model/all")
        expect(response.status).toBe(503)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledWith(
            "model"
        )
    })


    test("Input param not valid (422 status code)", async () => {
        const err = new Error("Invalid value")        
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => {
                throw err
            })
        }))
    
        
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return res.status(422).json({ error: "The parameters are not formatted properly\n\n" });
        })
        const response = await request(app).delete(baseURL + "/reviews/model/all")
        expect(response.status).toBe(422)
        expect(mockReviewControllerdeleteReviewsOfProduct).toHaveBeenCalledTimes(0)
    })


})



describe("DELETE review/", () => {
    test("Correct resolve test (200 status code)", async () => {
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteAllReviews.mockResolvedValueOnce(undefined)
        const response = await request(app).delete(baseURL + "/reviews/")
        expect(response.status).toBe(200)
        expect(response.body).toEqual({})
        expect(mockReviewControllerdeleteAllReviews).toHaveBeenCalledTimes(1)
    })

    test("User not admin or manager (401 status code)", async () => {
       
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return res.status(401).json({ error: "User is not a admin/manager", status: 401 })
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        const response = await request(app).delete(baseURL + "/reviews/")
        expect(response.status).toBe(401)
        expect(mockReviewControllerdeleteAllReviews).toHaveBeenCalledTimes(0)
    })

    test("Internal server error", async () => {
        const err = new Error()
        jest.mock('express-validator', () => ({
            param: jest.fn().mockImplementation(() => ({
                isString: () => ({ notEmpty: () => ({})}),
            })),
        }))
    
        mockAuthenticatorisLoggedIn.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockAuthenticatorisAdminOrManager.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        mockExpressValidator.mockImplementation((req: any, res: any, next: any) => {
            return next();
        })
        
        mockReviewControllerdeleteAllReviews.mockRejectedValueOnce(err)
        const response = await request(app).delete(baseURL + "/reviews/")
        expect(response.status).toBe(503)
        expect(mockReviewControllerdeleteAllReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewControllerdeleteAllReviews).toHaveBeenCalledWith()
    })


})
