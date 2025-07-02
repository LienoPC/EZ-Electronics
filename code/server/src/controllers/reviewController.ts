import dayjs from "dayjs";
import { User } from "../components/user";
import ReviewDAO from "../dao/reviewDAO";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";
import { ProductReview } from "../components/review"
import { rejects } from "assert";
import { resolve } from "path";
import ProductController from "./productController";
import ProductDAO from "../dao/productDAO"
import { ProductNotFoundError } from "../errors/productError";

class ReviewController {
    private dao: ReviewDAO

    constructor() {
        this.dao = new ReviewDAO
    }

    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: User, score: number, comment: string): Promise<void> {
        let productDAO = new ProductDAO()
        return new Promise((resolve, reject) => {
            productDAO.exist(model)
            .then((res) => {
                if (res){
                    // product exists, I can add a review
                    this.dao.addReview(model, user.username, score, comment, dayjs().format("YYYY-MM-DD"))
                    .then((res) => {
                        resolve(res) 
                    })
                    .catch((err) => {
                        reject(err)
                    })
                }else{
                    // product doesn't exist
                    reject(new ProductNotFoundError())
                }
            })
            .catch((err) => {
                reject(err)
            })
        });
        
    }


    /**
     * Returns all reviews for a product
     * @param model The model of the product to get reviews from
     * @returns A Promise that resolves to an array of ProductReview objects
     */
    async getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise((resolve, reject) => {
            this.dao.getProductReviews(model)
            .then((res) => {
                resolve(res)
            })
            .catch((err) => {
                if(err instanceof NoReviewProductError){
                    resolve([])
                }else{
                    reject(err)
                }
            })
        });
    }


    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: User): Promise<void> {
        let productDAO = new ProductDAO()
        return new Promise((resolve, reject) => {
            productDAO.exist(model)
            .then((res) => {
                if(res){
                    // product exists
                    this.dao.getProductReviews(model)
                    .then((reviews) => {
                        if(reviews.find((review, index) => { return review.user == user.username}) == undefined){
                            // reviews not found   
                            reject(new NoReviewProductError())
                        }else{
                            // found at least one review
                            this.dao.deleteReview(model, user.username)
                            .then((res) => {
                                resolve()
                            })
                            .catch((err) => {
                                    reject(err)
                            })
                        }
                    })
                    .catch((err) => {
                        reject(err)
                        
                    })
                }else{
                    // product doesn't exist
                    reject(new ProductNotFoundError())
                }
                
            })
            .catch((err) => {
                reject(err)
            })
    })
        
    }

    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string): Promise<void> {
        let productDAO = new ProductDAO()
        return new Promise((resolve, reject) => {
            productDAO.exist(model)
            .then((res) => {
                if(res){
                    // product exists
                    this.dao.deleteReviewsOfProduct(model)
                    .then(() => {
                        resolve()
                    })
                    .catch((err) => {
                        reject(err)
                    })
                }else{
                    // product doesn't exist
                    reject(new ProductNotFoundError())
                }
                
            })
            .catch((err) => {
                reject(err)
            })
        })
        
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.dao.deleteAllReviews()
            .then(() => {
                resolve()
            })
            .catch((err) => {
                reject(err)
            })
        }) 
    }
}

export default ReviewController;