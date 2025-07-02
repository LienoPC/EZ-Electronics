import { test, expect, jest, describe, afterEach } from "@jest/globals"
import ProductController from "../../src/controllers/productController"
import request from 'supertest'
import { app } from "../../index"
import Authenticator from "../../src/routers/auth"
import { Category, Product } from "../../src/components/product"
import ProductDAO from "../../src/dao/productDAO"
import { ProductNotFoundError, ProductAlreadyExistsError, InvalidCategoryGroupingError, EmptyProductStockError, InvalidModelGroupingError, InvalidGroupingError } from "../../src/errors/productError";
import { error } from "console"
import { DateError } from "../../src/utilities"
import dayjs from "dayjs"
import ErrorHandler from "../../src/helper"

const baseURL = "/ezelectronics/products"

jest.mock("../../src/controllers/productController")
jest.mock("../../src/routers/auth")

describe("Product Route Tests", () => {

    afterEach(() => {
        jest.clearAllMocks();
    })


    describe("Inserisci nuovo prodotto", () => {

        test("It should return a 200 success code", async () => {
            const inputProduct = { model: "test", category: "Smartphone", quantity: 10, details: "", sellingPrice: 10, arrivalDate: "2023-01-01" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "registerProducts").mockImplementation(() => Promise.resolve());
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(200)
            expect(ProductController.prototype.registerProducts).toHaveBeenCalled()
            expect(ProductController.prototype.registerProducts).toHaveBeenCalledWith(inputProduct.model, inputProduct.category, inputProduct.quantity, inputProduct.details, inputProduct.sellingPrice, inputProduct.arrivalDate,)
        })

        test("Modello non fornito", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
        })

        //It should return a 409 error if `model` represents an already existing set of products in the database
        test("Modello ripetuto", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "IPhone13", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: "" }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            const mockRegisterProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new ProductAlreadyExistsError());
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(409)
            expect(mockRegisterProducts).toHaveBeenCalled()
        })

        test("Quantità insufficiente", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "model", category: "Smartphone", sellingPrice: 10, quantity: 0, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            const mockGetProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new EmptyProductStockError());
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(mockGetProducts).not.toHaveBeenCalled()
        })

        test("Prezzo di vendita insufficiente", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "model", category: "Smartphone", sellingPrice: 0, quantity: 10, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
        })

        test("Categoria errata", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "model", category: "Computer", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "registerProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
        })

        //  - It should return a 400 error when `arrivalDate` is after the current date
        test("Data di arrivo dopo la data odierna", async () => {
            const arrivalDate: string | null = "2026-02-02"
            const inputProduct = { model: "iPhone13", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: "" }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            const mockRegisterProducts = jest.spyOn(ProductController.prototype, "registerProducts").mockRejectedValue(new DateError());
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(400)
            expect(mockRegisterProducts).toHaveBeenCalled()
        })
    });

    describe("Modifica quantità prodotto", () => {

        test("Corretto Funzionamento", async () => {
            const newQuantity: number = 10;
            const model = "iPhone13";
            const inputProduct = { quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, model, Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);

            // Check the status and response
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ quantity: 10 });

            // Ensure the changeProductQuantity method was called with correct parameters
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(model, inputProduct.quantity, inputProduct.changeDate);
        })

        /*
            test("Modello non è una stringa", async()=>{
                const inputProduct = { model: 3, newQuantity: 10, changeDate: "2023-01-01"} 
                
                jest.mock('express-validator', () => ({
                    body: jest.fn().mockImplementation(() => ({
                        isString: () => ({ isLength: () => ({}) }),
                        isNumeric: () => ({ isLength: () => ({}) }),
                    })),
                }))
            
                const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
                mockIsLoggedIn.mockImplementation((req, res, next) => {
                    return next();
                });
            
                const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
                mockIsAdminOrManager.mockImplementation((req, res, next) => {
                    return next();
                });
            
                const mockexample = jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new Error());
           
                const response = await request(app).patch(baseURL + `/${inputProduct.model}`).send(inputProduct);
                expect(mockexample).toBe(422)
            })*/

        test("Modello non fornito", async () => {
            const arrivalDate: string | null = null
            const newQuantity: number = 10;
            const model = "iPhone13";
            const inputProduct = { quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, model, Category.SMARTPHONE, "2021-01-01", "", 10)
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockResolvedValue(10);
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.registerProducts).not.toHaveBeenCalled()
        })

        test("Modello non esistente", async () => {
            const newQuantity: number = 10;
            const model = "iPhone130";
            const inputProduct = { quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, "iPhone13", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new ProductNotFoundError());
            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);
            expect(response.status).toBe(404)
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled()
        })

        test("Quantità insufficiente", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "model", category: "Smartphone", sellingPrice: 10, quantity: 0, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
        })

        test("Data non valida", async () => {
            const newQuantity: number = 10;
            const model = "iPhone13";
            const inputProduct = { quantity: newQuantity, changeDate: "2023-01-01" };
            const product = new Product(10, model, Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "changeProductQuantity").mockRejectedValue(new DateError());

            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);

            // Check the status and response
            expect(response.status).toBe(400);

            // Ensure the changeProductQuantity method was called with correct parameters
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalledWith(model, inputProduct.quantity, inputProduct.changeDate);
        })
    });

    describe("Route Vendita prodotto", () => {
        test("Corretto Funzionamento", async () => {
            const quantity: number = 10;
            const model = "iPhone13";
            const inputProduct = { quantity: quantity, sellingDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(10);

            const response = await request(app).patch(baseURL + `/${model}` + "/sell").send(inputProduct);


            expect(response.status).toBe(200);
            expect(response.body).toEqual({ quantity: 10 });


            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(model, inputProduct.quantity, inputProduct.sellingDate);
        })

        test("Modello non fornito", async () => {
            const newQuantity: number = 10;
            const model = " ";
            const inputProduct = { model: model, quantity: newQuantity, sellingDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10);

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "sellProduct").mockResolvedValue(10);
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled()
        })


        /*
                test("Modello non esistente", async()=>{
                    const inputProduct = { model: "model", newQuantity: 10, changeDate: "2023-01-01"}
                    jest.mock('express-validator', () => ({
                        body: jest.fn().mockImplementation(() => ({
                            isString: () => ({ isLength: () => ({}) }),
                            isNumeric: () => ({ isLength: () => ({}) }),
                        })),
                    }))
        
                    const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
                    mockIsLoggedIn.mockImplementation((req, res, next) => {
                        return next();
                    });
        
                    const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
                    mockIsAdminOrManager.mockImplementation((req, res, next) => {
                        return next();
                    });
        
                   jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([]);
                    const mockSellProduct = jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new ProductNotFoundError());
                    await request(app).patch(baseURL + `/${inputProduct.model}` + "/sell").send(inputProduct);
                    expect(mockSellProduct).toBe(404)
                })
                */

        test("Quantità insufficiente", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "model", category: "Smartphone", sellingPrice: 10, quantity: 0, arrivalDate: arrivalDate, details: "" }

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new EmptyProductStockError());
            await request(app).post(baseURL + "/").send(inputProduct)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled();
        })

        test("La quantità venduta è maggiore della quantità disponibile", async () => {
            const inputProduct = { model: "model", quantity: 20, sellingDate: "2023-01-01" }
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new EmptyProductStockError());
            await request(app).post(baseURL + "/").send(inputProduct)
            expect(ProductController.prototype.sellProduct).not.toHaveBeenCalled();
        });

        test("Data non valida", async () => {
            const model = "model";
            const inputProduct = { model: model, quantity: 10, sellingDate: "2029-01-01" };
            const product = new Product(10, model, Category.SMARTPHONE, "2023-01-01", "", 10);

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new DateError());
            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled();
        })

        test("Data dopo la data attuale", async () => {
            const model = "model";
            const inputProduct = { model: model, quantity: 10, sellingDate: "2029-01-01" };
            const product = new Product(10, model, Category.SMARTPHONE, "2023-01-01", "", 10);

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new DateError());
            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled();
        })

        test("La data di vendita è prima della data di arrivo", async () => {
            const model = "model";
            const inputProduct = { model: "model", quantity: 10, sellingDate: "2019-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2020-12-31", "", 10);

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValue(new DateError());
            const response = await request(app).patch(baseURL + `/${model}`).send(inputProduct);
            expect(response.status).toBe(400);
            expect(ProductController.prototype.changeProductQuantity).toHaveBeenCalled();
        });

        test("Grouping non valido", async () => {
            const grouping: string | null = "GroupingNonValido";
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts");
            jest.spyOn(ProductController.prototype, "getProducts");
            const response = await request(app).post(baseURL + "/").send(product);
            expect(response.status).toBe(400);
        });

        test("Categoria non valida (deve essere una stringa)", async () => {
            const grouping: string | null = "category";
            const category: string | null = "CategoryNonValida";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts");
            jest.spyOn(ProductController.prototype, "getProducts");
            const response = await request(app).post(baseURL + "/").send(products);
            expect(response.status).toBe(422);
        })


        test("Grouping su categoria, ma categoria nulla", async () => {
            const grouping: string | null = "category";
            const category: string | null = null;
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts");
            jest.spyOn(ProductController.prototype, "getProducts");
            const response = await request(app).post(baseURL + "/").send(products);
            expect(response.status).toBe(422);
        })

        test("Grouping su modello, ma modello vuoto", async () => {
            const grouping: string | null = "model";
            const category: string | null = null;
            const model: string | null = " ";
            const product = new Product(10, " ", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts")

            jest.spyOn(ProductController.prototype, "getProducts")
            const response = await request(app).post(baseURL + "/").send(products)
            expect(response.status).toBe(422)

        })

        test("Grouping su modello, ma modello nullo", async () => {
            const grouping: string | null = "model";
            const category: string | null = "CategoryNonValida";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts")
            jest.spyOn(ProductController.prototype, "getProducts")
            const response = await request(app).post(baseURL + "/").send(products)
            expect(response.status).toBe(422)
        })

        test("Grouping su modello, ma modello non esistente", async () => {
            const grouping: string | null = "model";
            const category: string | null = null;
            const model: string | null = "ModelloNonEsistente";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);

            jest.spyOn(ProductController.prototype, "getProducts").mockImplementation((grouping: string | null, category: string | null, model: string | null) => {
                return Promise.reject(new ProductNotFoundError());
            });
            jest.spyOn(ProductDAO.prototype, "getAllProducts")
            jest.spyOn(ProductController.prototype, "getProducts")
            const response = await request(app).post(baseURL + "/").send(products)
            expect(response.status).toBe(422)
        })

        test("Grouping nullo, ma categoria o modello non nulli", async () => {
            const grouping: string | null = null;
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductDAO.prototype, "getAllProducts")
            jest.spyOn(ProductController.prototype, "getProducts")
            const response = await request(app).post(baseURL + "/").send(products)
            expect(response.status).toBe(422)
        })

        test("Errore sellProduct", async () => {
            const quantity: number = 10;
            const model = "iPhone13";
            const inputProduct = { quantity: quantity, sellingDate: "2023-01-01" };
            const product = new Product(10, "model", Category.SMARTPHONE, "2021-01-01", "", 10)

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }));

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "sellProduct").mockRejectedValueOnce(new Error());

            const response = await request(app).patch(baseURL + `/${model}` + "/sell").send(inputProduct);


            expect(response.status).toBe(503);
            expect(ProductController.prototype.sellProduct).toHaveBeenCalledWith(model, inputProduct.quantity, inputProduct.sellingDate);
        })
    });

    describe("Route Get All Products", () => {

        test("Corretto Funzionamento", async () => {
            const grouping: string | null = "category";
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);

            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping, category, "");
        })

        test("Error getProducts", async () => {
            const grouping: string | null = "category";
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockRejectedValue(new Error());

            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(503);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledWith(grouping, category, "");
        })

        test("Wrong user", async () => {
            const grouping: string | null = "category";
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin or manager", status: 401 });
            });

            jest.spyOn(ProductController.prototype, "getProducts")

            const response = await request(app).get(baseURL).query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(401);
            expect(ProductController.prototype.getProducts).toHaveBeenCalledTimes(0);
        })
    });

    describe("Route Get Available Products", () => {

        test("Corretto Funzionamento category", async () => {
            const grouping: string | null = "category";
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([product]);

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, category, "");
        })

        test("Corretto funzionamento model", async () => {

            const grouping: string | null = "model";
            const category: string | null = null;
            const model: string | null = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });


            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([product]);

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith(grouping, "", model);
        })

        test("Corretto funzionamento senza parametri", async () => {
            const grouping: string | null = null;
            const category: string | null = null;
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockResolvedValue(products);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(200);
            expect(response.body).toEqual(products);
            expect(ProductController.prototype.getAvailableProducts).toHaveBeenCalledWith("", "", "");
        })

        test("Grouping nullo, ma categoria o modello non nulli", async () => {
            const grouping: string | null = null;
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10);
            const products = [product];

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue(products);
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValue(new InvalidGroupingError());
            const response = await request(app).get(`${baseURL}/available`).query({ grouping, category, model });
            expect(response.status).toBe(422);
        });

        test("Grouping non valido", async () => {
            const grouping: string | null = "GroupingNonValido";
            const category: string | null = "Smartphone";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]
            const error = new InvalidGroupingError();

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
        });

        test("Categoria non valida (deve essere una stringa)", async () => {
            const grouping: string | null = "category";
            const category: string | null = "CategoryNonValida";
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]
            const error = new InvalidCategoryGroupingError();

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
        });

        test("Grouping su categoria, ma categoria nulla", async () => {
            const grouping: string | null = "category";
            const category: string | null = null;
            const model: string | null = null;
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]
            const error = new InvalidCategoryGroupingError();

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductDAO.prototype, "getAllProducts").mockResolvedValue([product]);
            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
        });

        test("Grouping su categoria, ma modello not null e categoria null", async () => {
            const grouping: string | null = "category";
            const category: string | null = null;
            const model: string | null = "Iphone13";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]
            const error = new InvalidGroupingError();

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(error);
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
        });

        test("Grouping su modello, ma modello vuoto", async () => {
            const grouping: string | null = "model";
            const category: string | null = null;
            const model: string | null = " ";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)
            const products = [product]

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getAvailableProducts").mockRejectedValueOnce(new InvalidModelGroupingError());
            const response = await request(app).get(baseURL + "/available").query({ grouping: grouping, category: category, model: model });
            expect(response.status).toBe(422);
        });
    });

    describe("Route Cancellazione tutti prodotti", () => {

        test("Corretto funzionamento", async () => {
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockResolvedValue(true);
            const response = await request(app).delete(baseURL);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalled();
        })

        test("Errore deleteAllProducts", async () => {
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "deleteAllProducts").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL);
            expect(response.status).toBe(503);
            expect(ProductController.prototype.deleteAllProducts).toHaveBeenCalledTimes(1);
        })

        test("nessun prodotto da eliminare", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))
            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });
            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ProductController.prototype, "deleteAllProducts")
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
        })
    });

    describe("Route Cancellazione prodotto", () => {

        test("Corretto funzionamento", async () => {

            const model = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);

            jest.spyOn(ProductController.prototype, "deleteProduct").mockResolvedValue(true);
            const response = await request(app).delete(baseURL + `/${model}`);
            expect(response.status).toBe(200);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(model);
        })

        test("Errore deleteProducts", async () => {

            const model = "model";
            const product = new Product(10, "model", Category.SMARTPHONE, "2023-01-01", "", 10)

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "getProducts").mockResolvedValue([product]);

            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new Error());
            const response = await request(app).delete(baseURL + `/${model}`);
            expect(response.status).toBe(503);
            expect(ProductController.prototype.deleteProduct).toHaveBeenCalledWith(model);
        })

        test("Modello non fornito", async () => {
            const arrivalDate: string | null = null
            const inputProduct = { model: "", category: "Smartphone", sellingPrice: 10, quantity: 10, arrivalDate: arrivalDate, details: "" }
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isNumeric: () => ({ isLength: () => ({}) }),
                })),
            }))

            const mockIsLoggedIn = jest.spyOn(Authenticator.prototype, "isLoggedIn");
            mockIsLoggedIn.mockImplementation((req, res, next) => {
                return next();
            });

            const mockIsAdminOrManager = jest.spyOn(Authenticator.prototype, "isAdminOrManager");
            mockIsAdminOrManager.mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(ProductController.prototype, "deleteProduct").mockRejectedValue(new ProductNotFoundError());
            const response = await request(app).post(baseURL + "/").send(inputProduct)
            expect(response.status).toBe(422)
        })
    });
});










































