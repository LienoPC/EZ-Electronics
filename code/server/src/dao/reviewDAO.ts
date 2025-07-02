import db from "../db/db"
import { ProductReview} from "../components/review"
import { ProductNotFoundError } from "../errors/productError";
import { ExistingReviewError, NoReviewProductError } from "../errors/reviewError";

/**
 * A class that implements the interaction with the database for all review-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class ReviewDAO {
    
    
    /**
     * Adds a new review for a product
     * @param model The model of the product to review
     * @param user The username of the user who made the review
     * @param score The score assigned to the product, in the range [1, 5]
     * @param comment The comment made by the user
     * @returns A Promise that resolves to nothing
     */
    async addReview(model: string, user: string, score: number, comment: string, date: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {

                // execute the query to get userId
                const sqlUser = "SELECT id FROM users WHERE username = ?"
                db.get(sqlUser, [user], (err: Error | null, u: any) => {
                    if(err){
                        return reject(err)
                    }else{
                        // user exists
                        // execute the query to get productId
                        const sqlProduct = "SELECT id FROM products WHERE model = ?"
                        db.get(sqlProduct, [model], (err: Error | null, product: any) => {
                            if(err){
                                return reject(err)
                            }else if (!product){
                                return reject(new ProductNotFoundError())
                            }else{
                                const sqlReview = 'INSERT INTO reviews (score, date, comment, userId, productId) VALUES (?, ?, ?, ?, ?)';
                                db.run(sqlReview, [score, date, comment, u.id, product.id], (err: Error | null) => {
                                    if (err) {
                                        if(err.message != undefined){
                                            if (err.message.includes("UNIQUE constraint failed: reviews.userId, reviews.productId"))
                                                reject(new ExistingReviewError())
                                            else
                                                reject(err)
                                        }
                                        
                                        reject(err)
                                    }
                                    resolve()
                                })
                            }
                            
                        })
                    }
                    
                    
                })
               
            } catch (error) {
                reject(error)
            }

        });
    }

    /**
     * Gets all reviews for a product
     * @param model The model of the product to get reviews for
     * @returns A Promise that resolves to an array of ProductReview
     */
    async getProductReviews(model: string): Promise<ProductReview[]> {
        return new Promise<ProductReview[]>((resolve, reject) => {
            try {
                const sql = 'SELECT * FROM reviews r, products p, users u WHERE p.model = ? AND p.id = r.productId AND u.id = r.userId';
                db.all(sql, [model], (err: Error | null, rows: any) => {
                    if (err) { 
                        return reject(err)
                    }else{
                        if (rows != undefined && rows.length > 0){
                            const reviews: Array<ProductReview> = new Array(); 
                            for (let row in rows){
                                // read the username starting by the productId
                                // execute the query to get userId
                                let review = new ProductReview(model, rows[row].username, rows[row].score, rows[row].date, rows[row].comment)
                                reviews.push(review);
                                   
                            }
                            /*
                            const reviews = rows.map((row: any) =>{
                                // read the username starting by the productId
                                // execute the query to get userId
                                const sqlUser = "SELECT username FROM users WHERE id = ?"
                                db.get(sqlUser, [row.userId], (err: Error | null, u: any) => {
                                    if(err){
                                        return reject(err)
                                    }else{
                                        return new ProductReview(model, u.username, row.score, row.date, row.comment)
                                    }

                                });
                            });
                            */
                            return resolve(reviews);
                        }else{
                            return reject(new NoReviewProductError())
                        }
                        
                    }
                });
            } catch (error) {
                reject(error)
            }
        });
    
    }

    /**
     * Deletes the review made by a user for a product
     * @param model The model of the product to delete the review from
     * @param user The user who made the review to delete
     * @returns A Promise that resolves to nothing
     */
    async deleteReview(model: string, user: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                // select the id of the product
                 // execute the query to get userId
                 const sqlUser = "SELECT id FROM users WHERE username = ?"
                 db.get(sqlUser, [user], (err: Error | null, u: any) => {
                     if(err){
                         return reject(err)
                     }else{
                         // user exists
                         // execute the query to get productId
                         const sqlProduct = "SELECT id FROM products WHERE model = ?"
                         db.get(sqlProduct, [model], (err: Error | null, product: any) => {
                            if(err){
                                return reject(err)
                            }else if (!product){
                                return reject(new ProductNotFoundError())
                            }else{
                                const sql = 'DELETE FROM reviews WHERE productId = ? AND userId = ?';
                                db.run(sql, [product.id, u.id], (err: Error | null) => {
                                    if (err) {
                                        return reject(err)
                                    } else {
                                        return resolve();
                                    }
                                }); 
                            }
                         })
                    }
                })
            } catch (error) {
                reject(error);
            }
        });
    
    }
    /**
     * Deletes all reviews for a product
     * @param model The model of the product to delete the reviews from
     * @returns A Promise that resolves to nothing
     */
    async deleteReviewsOfProduct(model: string): Promise<void> {
        
        return new Promise<void>((resolve, reject) => {
            try {
                const sqlProduct = "SELECT id FROM products WHERE model = ?"
                db.get(sqlProduct, [model], (err: Error | null, product: any) => {
                   if(err){
                       return reject(err)
                   }else if (!product){
                       return reject(new ProductNotFoundError())
                   }else{
                    const sql = 'DELETE FROM reviews WHERE productId = ?';
                    db.run(sql, [product.id], (err: Error | null) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve();
                        }
                    });
                 }
                });
            } catch (error) {
                reject(error);
            }
        });
    
    }

    /**
     * Deletes all reviews of all products
     * @returns A Promise that resolves to nothing
     */
    async deleteAllReviews(): Promise<void> {
        const sql = 'DELETE FROM reviews';
        return new Promise<void>((resolve, reject) => {
            try {
                db.run(sql, [], (err: Error | null) => {
                    if (err) 
                        reject(err);
                    
                    resolve()
                })
            } catch (error) {
                reject(error)
            }
        });
    }

}   


export default ReviewDAO