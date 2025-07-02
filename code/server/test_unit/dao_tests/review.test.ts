import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import { ProductReview } from "../../src/components/review"
import { User, Role} from "../../src/components/user"
import ReviewDAO from "../../src/dao/reviewDAO"
import db from "../../src/db/db"
import { Database } from "sqlite3"
import { assert, error } from "console"
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { Category } from "../../src/components/product"
import { ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/db/db.ts")

const GENERIC_SQL_ERROR = "SQL_error"

const mockReviews: Array<any> = new Array();
mockReviews.push({model:"model", username:"user1", score:1, date:"YYYY-MM-DD1", comment:"comment1"})
mockReviews.push({model:"model", username:"user2", score:1, date:"YYYY-MM-DD1", comment:"comment1"})

const mockReturnReviews: Array<ProductReview> = new Array();
mockReturnReviews.push(new ProductReview("model","user1", 1, "YYYY-MM-DD1", "comment1"))
mockReturnReviews.push(new ProductReview("model","user2", 1, "YYYY-MM-DD1", "comment1"))

// testReview mock defined for all tests
const testReview = new ProductReview("model", "user", 1, "YYYY-MM-DD", "comment")

// mock DB interfaces
let mockDBrun: any
let mockDBall: any
let mockDBget: any
let nullValue: any

const user1 = {id: 1, 
    username: "user1",
    name: "customer",
    surname: "customer",
    role: Role.CUSTOMER, 
    address: nullValue,
    birthDate: nullValue
}

const user2 = {id: 2, 
    username: "user2",
    name: "customer",
    surname: "customer",
    role: Role.CUSTOMER, 
    address: nullValue,
    birthDate: nullValue
}


const product = {
    id: 1,
    model: "model",
    category: "category",
    sellingPrice: 1,
    arrivalDate: "YYYY-MM-DD",
    details: "",
    quantity: 1
}
beforeAll(async () =>{
    mockDBrun = jest.spyOn(db, "run")
    mockDBall = jest.spyOn(db, "all")
    mockDBget = jest.spyOn(db, "get")
    nullValue = null;

})

afterEach(async () => {
    mockDBrun.mockRestore()
    mockDBall.mockRestore()
    mockDBget.mockRestore()
})

describe("AddReview method WhiteBox tests", () => {
    test("Correct test", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(null, null)
            return {} as Database
        });
        const result = await reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date) // mock of the input
        expect(result).toBe(undefined)
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.score, testReview.date, testReview.comment, user1.id, product.id], // sql parameters
            expect.any(Function) //callback
        )
    })
    
    test("Null elements test", async () => {
        const err = new Error("NOT NULL constraint failed: reviews.date")
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.score, testReview.date, testReview.comment, user1.id, product.id], // sql parameters
            expect.any(Function) //callback
        )
    })
    
    

    test("Not unique test", async () => {
        const err = new Error("UNIQUE constraint failed: reviews.userId, reviews.productId")
        const reviewDAO = new ReviewDAO();
         mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(ExistingReviewError)
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.score, testReview.date, testReview.comment, user1.id, product.id], // sql parameters
            expect.any(Function) //callback
        )
    })
    
    
    test("Internal server error test", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.score, testReview.date, testReview.comment, user1.id, product.id], // sql parameters
            expect.any(Function) //callback
        )
    })

    
    test("Db throw exception (dbRun)", async() => {
        const reviewDAO = new ReviewDAO()
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            throw new Error(GENERIC_SQL_ERROR)
        });  
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.score, testReview.date, testReview.comment, user1.id, product.id], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Db throw exception (dbGet User)", async() => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO()
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        })  
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })

    test("Db throw exception (dbGet Product)", async() => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO()
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        }); 
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })

    test("Product not found test", async() => {
        const err = new ProductNotFoundError()
        const reviewDAO = new ReviewDAO()
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, nullValue)
            return {} as Database
        }); 
        await expect(reviewDAO.addReview(testReview.model, testReview.user, testReview.score, testReview.comment, testReview.date))
        .rejects
        .toThrow(ProductNotFoundError)
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })
    
})



describe("getProductReviews method WhiteBox tests", () => {
    test("Correct test", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
            callback(null, mockReviews)
            return {} as Database
        });
        const result = await reviewDAO.getProductReviews("model")
        expect(result).toEqual(mockReturnReviews)
        expect(mockDBall).toHaveBeenCalledTimes(1)
        expect(mockDBall).toHaveBeenCalledWith(
            expect.any(String), // sql
            ["model"], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Product not reviewed test", async() => {
        const reviewDAO = new ReviewDAO()
        mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
            callback(null, [])
            return {} as Database
        });  
        await expect(reviewDAO.getProductReviews("model"))
        .rejects
        .toThrow(NoReviewProductError)
        expect(mockDBget).toHaveBeenCalledTimes(0)
        expect(mockDBall).toHaveBeenCalledTimes(1)
        expect(mockDBall).toHaveBeenCalledWith(
            expect.any(String), // sql
            ["model"], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Internal server error test (DBrun)", async() => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO()
        mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });  
        await expect(reviewDAO.getProductReviews("model"))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(0)
        expect(mockDBall).toHaveBeenCalledTimes(1)
        expect(mockDBall).toHaveBeenCalledWith(
            expect.any(String), // sql
            ["model"], // sql parameters
            expect.any(Function) //callback
        )
    })


    test("Db throw exception", async() => {
        const err = new Error()
        const reviewDAO = new ReviewDAO()
        mockDBall.mockImplementation((sql: any, params: any, callback: any) => {
            throw new Error(GENERIC_SQL_ERROR)
        });  
        await expect(reviewDAO.getProductReviews("model"))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBall).toHaveBeenCalledTimes(1)
        expect(mockDBall).toHaveBeenCalledWith(
            expect.any(String), // sql
            ["model"], // sql parameters
            expect.any(Function) //callback
        )
    })
})


describe("deleteReview method WhiteBox tests", () => {
    test("Correct test", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(null, null)
            return {} as Database
        });
        const result = await reviewDAO.deleteReview(testReview.model, testReview.user)
        expect(result).toBe(undefined)
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [product.id, user1.id], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Internal server error test (DBrun)", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.deleteReview(testReview.model, testReview.user))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        ) 
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [product.id, user1.id], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Internal server error test (DBget User)", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        })
        await expect(reviewDAO.deleteReview(testReview.model, testReview.user))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(1)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })

    test("Internal server error test (DBget Product)", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.deleteReview(testReview.model, testReview.user))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })

    test("Product not found error test (DBget Product)", async () => {
        const err = new ProductNotFoundError()
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, nullValue)
            return {} as Database
        });
        await expect(reviewDAO.deleteReview(testReview.model, testReview.user))
        .rejects
        .toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })


    test("Db throw exception", async() => {
        const err = new Error()
        const reviewDAO = new ReviewDAO()
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, user1)
            return {} as Database
        }).mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            throw new Error(GENERIC_SQL_ERROR)
        });  
        await expect(reviewDAO.deleteReview(testReview.model, testReview.user))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(2)
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.user], // sql parameters
            expect.any(Function) //callback
        )        
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [product.id, user1.id], // sql parameters
            expect.any(Function) //callback
        )
    })
        
})



describe("deleteReviewsOfProduct method WhiteBox tests", () => {
    test("Correct test", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(null, null)
            return {} as Database
        });
        const result = await reviewDAO.deleteReviewsOfProduct(testReview.model)
        expect(result).toBe(undefined)
        expect(mockDBget).toHaveBeenCalledTimes(1)    
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [product.id], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Product not found error test (DBget)", async () => {
        const err = new ProductNotFoundError()
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, nullValue)
            return {} as Database
        });
        await expect(reviewDAO.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(err)
        expect(mockDBget).toHaveBeenCalledTimes(1)    
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })

    test("Internal server error test (DBget)", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(1)    
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(0)
    })

    test("Internal server error test (DBrun)", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(1)    
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [product.id], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Db throw exception", async() => {
        const err = new Error()
        const reviewDAO = new ReviewDAO()
        mockDBget.mockImplementationOnce((sql: any, params: any, callback: any) => {
            callback(null, product)
            return {} as Database
        });
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            throw new Error(GENERIC_SQL_ERROR)
        });  
        await expect(reviewDAO.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBget).toHaveBeenCalledTimes(1)    
        expect(mockDBget).toHaveBeenCalledWith(
            expect.any(String), // sql
            [testReview.model], // sql parameters
            expect.any(Function) //callback
        )  
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [product.id], // sql parameters
            expect.any(Function) //callback
        )
    })
})



describe("deleteAllReviews method WhiteBox tests", () => {
    test("Correct test", async () => {
        const reviewDAO = new ReviewDAO();
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(null, null)
            return {} as Database
        });
        const result = await reviewDAO.deleteAllReviews()
        expect(result).toBe(undefined)
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Internal server error test", async () => {
        const err = new Error(GENERIC_SQL_ERROR)
        const reviewDAO = new ReviewDAO();
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            callback(err, null)
            return {} as Database
        });
        await expect(reviewDAO.deleteAllReviews())
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [], // sql parameters
            expect.any(Function) //callback
        )
    })

    test("Db throw exception", async() => {
        const err = new Error()
        const reviewDAO = new ReviewDAO()
        mockDBrun.mockImplementation((sql: any, params: any, callback: any) => {
            throw new Error(GENERIC_SQL_ERROR)
        });  
        await expect(reviewDAO.deleteAllReviews())
        .rejects
        .toThrow(Error(GENERIC_SQL_ERROR))
        expect(mockDBrun).toHaveBeenCalledTimes(1)
        expect(mockDBrun).toHaveBeenCalledWith(
            expect.any(String), // sql
            [], // sql parameters
            expect.any(Function) //callback
        )
    })
})


