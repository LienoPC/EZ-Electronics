import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"
import { ProductReview } from "../../src/components/review"
import ReviewDAO from "../../src/dao/reviewDAO"
import ProductDAO from "../../src/dao/productDAO"
import { assert, error } from "console"
import ReviewController from "../../src/controllers/reviewController"
import {Role, User} from "../../src/components/user"
import dayjs from "dayjs";
import { ExistingReviewError, NoReviewProductError } from "../../src/errors/reviewError"
import { ProductNotFoundError } from "../../src/errors/productError"

jest.mock("../../src/dao/reviewDAO.ts")

const GENERIC_SQL_ERROR = "SQL_error"
const CORRECT_SCORE = 1
const testReview = new ProductReview("model", "user", CORRECT_SCORE, "YYYY-MM-DD", "comment")
const testUser = new User("user1", "name", "surname", Role['CUSTOMER'], "address", "YYYY-MM-DD")
const testErrUser = new User("user3", "name", "surname", Role['CUSTOMER'], "address", "YYYY-MM-DD")

// mock test of recieved reviews from the database
const mockReviews: Array<ProductReview> = new Array();
mockReviews.push(new ProductReview("model", "user1", 1, "YYYY-MM-DD1", "comment1"))
mockReviews.push(new ProductReview("model", "user2", 1, "YYYY-MM-DD2", "comment2"))

let mockProductDAOexist: any
let mockReviewDAOaddReview: any
let mockReviewDAOgetProductReviews: any
let mockReviewDAOdeleteReview: any
let mockReviewDAOdeleteReviewsOfProduct: any
let mockReviewDAOdeleteAllReviews: any

beforeAll(async () =>{
    mockReviewDAOaddReview = jest.spyOn(ReviewDAO.prototype, "addReview")
    mockReviewDAOgetProductReviews = jest.spyOn(ReviewDAO.prototype, "getProductReviews")
    mockReviewDAOdeleteReview = jest.spyOn(ReviewDAO.prototype, "deleteReview")
    mockReviewDAOdeleteReviewsOfProduct = jest.spyOn(ReviewDAO.prototype, "deleteReviewsOfProduct")
    mockReviewDAOdeleteAllReviews = jest.spyOn(ReviewDAO.prototype, "deleteAllReviews")
    mockProductDAOexist = jest.spyOn(ProductDAO.prototype, "exist")
})

afterEach(async () => {
    mockReviewDAOaddReview.mockRestore()
    mockReviewDAOgetProductReviews.mockRestore()
    mockReviewDAOdeleteReview.mockRestore()
    mockReviewDAOdeleteReviewsOfProduct.mockRestore()
    mockReviewDAOdeleteAllReviews.mockRestore()
    mockProductDAOexist.mockReset()
  
})

describe("addReview method WhiteBox tests", () => {
    
    test("Correct result test", async () =>{
        const controller = new ReviewController()
        mockReviewDAOaddReview.mockResolvedValueOnce(undefined)
        mockProductDAOexist.mockResolvedValueOnce(true)
        // call the addReview method of the controller with the resolved result of the mock
        const response = await controller.addReview(testReview.model, testUser, testReview.score, testReview.comment)

        expect(mockReviewDAOaddReview).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOaddReview).toHaveBeenCalledWith(
            testReview.model,
            testUser.username,
            testReview.score,
            testReview.comment,
            dayjs().format("YYYY-MM-DD"))
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(response).toBe(undefined)
    })

    test("Existing review error test", async () =>{
        const controller = new ReviewController()
        const err = new ExistingReviewError()
        mockReviewDAOaddReview.mockRejectedValueOnce(err)
        mockProductDAOexist.mockResolvedValueOnce(true)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.addReview(testReview.model, testUser, testReview.score, testReview.comment))
        .rejects
        .toThrow(err)
        expect(mockReviewDAOaddReview).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOaddReview).toHaveBeenCalledWith(
            testReview.model,
            testUser.username,
            testReview.score,
            testReview.comment,
            dayjs().format("YYYY-MM-DD"))
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )

    })

    test("Product not exist error test", async () =>{
        const controller = new ReviewController()
        const err = new ProductNotFoundError()
        mockProductDAOexist.mockResolvedValueOnce(false)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.addReview(testReview.model, testUser, testReview.score, testReview.comment))
        .rejects
        .toThrow(err)
        expect(mockReviewDAOaddReview).toHaveBeenCalledTimes(0)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)

    })


    test("Internal server error test (ReviewDAO)", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockReviewDAOaddReview.mockRejectedValueOnce(err)
        mockProductDAOexist.mockResolvedValueOnce(true)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.addReview(testReview.model, testUser, testReview.score, testReview.comment))
        .rejects
        .toThrow(err)
        expect(mockReviewDAOaddReview).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOaddReview).toHaveBeenCalledWith(
            testReview.model,
            testUser.username,
            testReview.score,
            testReview.comment,
            dayjs().format("YYYY-MM-DD"))
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
    })

    test("Internal server error test (ProductDAO)", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        //mockReviewDAOaddReview.mockRejectedValueOnce(err)
        mockProductDAOexist.mockRejectedValueOnce(err)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.addReview(testReview.model, testUser, testReview.score, testReview.comment))
        .rejects
        .toThrow(err)
        expect(mockReviewDAOaddReview).toHaveBeenCalledTimes(0)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
    })
    
    

})

describe("getProductReviews method WhiteBox tests", () => {
    
    test("Correct result test", async () =>{
        const controller = new ReviewController()
        mockReviewDAOgetProductReviews.mockResolvedValueOnce(mockReviews)
        const response = await controller.getProductReviews("model")
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith(
            "model")
        expect(response).toBe(mockReviews)
    })

    test("No review test", async () =>{
        const controller = new ReviewController()
        const err = new NoReviewProductError()
        mockReviewDAOgetProductReviews.mockRejectedValueOnce(err)
        const response = await controller.getProductReviews("model")
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith(
            "model")
        expect(response).toStrictEqual([])
    })

    test("Internal server error test", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockReviewDAOgetProductReviews.mockRejectedValueOnce(err)
        await expect(controller.getProductReviews("model"))
        .rejects
        .toThrow(err)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith(
            "model")
    })
    

})


describe("deleteReview method WhiteBox tests", () => {
    
    test("Correct result test", async () =>{
        const controller = new ReviewController()
        mockReviewDAOgetProductReviews.mockResolvedValueOnce(mockReviews)
        mockReviewDAOdeleteReview.mockResolvedValueOnce(true)
        mockProductDAOexist.mockResolvedValueOnce(true)
        // call the addReview method of the controller with the resolved result of the mock
        const response = await controller.deleteReview("model", testUser)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith(
            "model")
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledWith(
            "model",
            testUser.username)
        expect(response).toBe(undefined)
    })

    test("Product not found error test", async () =>{
        const controller = new ReviewController()
        const err = new ProductNotFoundError()
        //mockReviewDAOgetProductReviews.mockResolvedValueOnce(mockReviews)
        mockProductDAOexist.mockResolvedValueOnce(false)
        await expect(controller.deleteReview("model", testErrUser))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(0)
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledTimes(0)
        
    })

    test("No Existing review error test", async () =>{
        const controller = new ReviewController()
        const err = new NoReviewProductError()
        mockReviewDAOgetProductReviews.mockResolvedValueOnce(mockReviews)
        mockProductDAOexist.mockResolvedValueOnce(true)
        await expect(controller.deleteReview("model", testErrUser))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith("model")
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledTimes(0)
        
    })

    test("Internal server error test of exist", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockProductDAOexist.mockRejectedValueOnce(err)
        //call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteReview("model", testUser))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(0)
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledTimes(0)
    })

    test("Internal server error test of deleteReview", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockProductDAOexist.mockResolvedValueOnce(true)
        mockReviewDAOgetProductReviews.mockResolvedValueOnce(mockReviews)
        mockReviewDAOdeleteReview.mockRejectedValueOnce(err)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteReview("model", testUser))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith(
            "model")
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledWith(
            "model",
            testUser.username)

    })

    test("Internal server error test of getProductReviews", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockProductDAOexist.mockResolvedValueOnce(true)
        mockReviewDAOgetProductReviews.mockRejectedValueOnce(err)
        //call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteReview("model", testUser))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOgetProductReviews).toHaveBeenCalledWith(
            "model")
        expect(mockReviewDAOdeleteReview).toHaveBeenCalledTimes(0)
    })

  
    
})

describe("deleteReviewsOfProduct method WhiteBox tests", () => {
    
    test("Correct result test", async () =>{
        const controller = new ReviewController()
        mockProductDAOexist.mockResolvedValueOnce(true)
        mockReviewDAOdeleteReviewsOfProduct.mockResolvedValueOnce(undefined)
        // call the addReview method of the controller with the resolved result of the mock
        const response = await controller.deleteReviewsOfProduct(testReview.model)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOdeleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOdeleteReviewsOfProduct).toHaveBeenCalledWith(
            testReview.model)
        expect(response).toBe(undefined)
    })

    test("Product not found test", async () =>{
        const controller = new ReviewController()
        const err = new ProductNotFoundError()
        mockProductDAOexist.mockResolvedValueOnce(false)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(err)    
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)   
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOdeleteReviewsOfProduct).toHaveBeenCalledTimes(0)
    })


    test("Internal server error test of exist", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockProductDAOexist.mockRejectedValue(err)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOdeleteReviewsOfProduct).toHaveBeenCalledTimes(0)

    })

    test("Internal server error test of deleteReviewsOfProduct", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockProductDAOexist.mockResolvedValueOnce(true)
        mockReviewDAOdeleteReviewsOfProduct.mockRejectedValueOnce(err)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteReviewsOfProduct(testReview.model))
        .rejects
        .toThrow(err)
        expect(mockProductDAOexist).toHaveBeenCalledTimes(1)
        expect(mockProductDAOexist).toHaveBeenCalledWith(
            testReview.model
        )
        expect(mockReviewDAOdeleteReviewsOfProduct).toHaveBeenCalledTimes(1)
        expect(mockReviewDAOdeleteReviewsOfProduct).toHaveBeenCalledWith(
            testReview.model)

    })

   
    
})


describe("deleteAllReviews method WhiteBox tests", () => {
    
    test("Correct result test", async () =>{
        const controller = new ReviewController()
        mockReviewDAOdeleteAllReviews.mockResolvedValueOnce(undefined)
        // call the addReview method of the controller with the resolved result of the mock
        const response = await controller.deleteAllReviews()
        expect(mockReviewDAOdeleteAllReviews).toHaveBeenCalledTimes(1)
        expect(response).toBe(undefined)
    })


    test("Internal server error test", async () =>{
        const controller = new ReviewController()
        const err = new Error(GENERIC_SQL_ERROR)
        mockReviewDAOdeleteAllReviews.mockRejectedValueOnce(err)
        // call the addReview method of the controller with the resolved result of the mock
        await expect(controller.deleteAllReviews())
        .rejects
        .toThrow(err)
        expect(mockReviewDAOdeleteAllReviews).toHaveBeenCalledTimes(1)

    })
    
})