import { test, expect, jest, beforeEach, afterEach, describe, beforeAll } from "@jest/globals";
import request from 'supertest';
import { app } from "../../index";
import { validationResult } from 'express-validator';

import UserController from "../../src/controllers/userController";
import { Role, User } from "../../src/components/user";
import ErrorHandler from "../../src/helper";
import Authenticator from "../../src/routers/auth";
import express from "express";

jest.mock("../../src/controllers/userController");
jest.mock("../../src/routers/auth");
jest.mock("../../src/helper");

function registerErrorHandler(router: express.Application) {
    router.use((err: any, req: any, res: any, next: any) => {
        return res.status(err.customCode || 503).json({
            error: err.customMessage || "Internal Server Error",
            status: err.customCode || 503
        });
    })
}
registerErrorHandler(app);


const baseURL = "/ezelectronics";

describe("userRoutes", () => {
    const customer = {
        username: "customer",
        name: "customer",
        surname: "customer",
        password: "customer",
        role: Role.CUSTOMER
    };
    const manager = {
        username: "manager",
        name: "manager",
        surname: "manager",
        password: "manager",
        role: Role.MANAGER
    };
    const admin = {
        username: "admin",
        name: "admin",
        surname: "admin",
        password: "admin",
        role: Role.ADMIN,
        address: "",
        birthdate: ""
    };

    const customer_user: User = {
        username: "customer",
        name: "customer",
        surname: "customer",
        role: Role.CUSTOMER,
        address: "",
        birthdate: ""
    };
    const manager_user = {
        username: "manager",
        name: "manager",
        surname: "manager",
        role: Role.MANAGER,
        address: "",
        birthdate: ""
    };
    const admin_user = {
        username: "admin",
        name: "admin",
        surname: "admin",
        role: Role.ADMIN,
        address: "",
        birthdate: ""
    };

    const users: User[] = [customer_user, manager_user, admin_user];

    afterEach(async () => {
        jest.resetAllMocks();
    });

    describe("POST /users", () => {
        test("It should return a 200 success code", async () => {
            const inputUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            };

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "createUser").mockResolvedValueOnce(true);

            const response = await request(app).post(`${baseURL}/users`).send(inputUser);
            expect(response.status).toBe(200);
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserController.prototype.createUser).toHaveBeenCalledWith(
                inputUser.username,
                inputUser.name,
                inputUser.surname,
                inputUser.password,
                inputUser.role
            );
        });

        test("It should return a 503 error", async () => {
            const inputUser = {
                username: "test",
                name: "test",
                surname: "test",
                password: "test",
                role: "Manager"
            };

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isString: () => ({ isLength: () => ({}) }),
                    isIn: () => ({ isLength: () => ({}) }),
                })),
            }));

            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req: any, res: any, next: any) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "createUser").mockRejectedValueOnce(new Error("Internal Server Error"));

            const response = await request(app).post(`${baseURL}/users`).send(inputUser);
            expect(response.status).toBe(503);
            expect(UserController.prototype.createUser).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /users", () => {
        test("Correct insertion case (200 status code)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([customer_user, admin_user, manager_user]);
            const response = await request(app).get(`${baseURL}/users`);
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual([customer_user, admin_user, manager_user]);
        });

        test("It should return status 401 (Unauthenticated user)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => next());

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([customer_user, admin_user, manager_user]);
            const response = await request(app).get(`${baseURL}/users`);
            expect(response.status).toBe(401);
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(0);
        });

        test("It should return status 401 (User is not an admin)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => next());

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce([customer_user, admin_user, manager_user]);
            const response = await request(app).get(`${baseURL}/users`);
            expect(response.status).toBe(401);
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(0);
        });

        test("It should return status 422 (The parameters are not formatted properly)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly", status: 422 });
            });

            jest.spyOn(UserController.prototype, "getUsers").mockResolvedValueOnce(users);
            const response = await request(app).get(`${baseURL}/users`);
            expect(response.status).toBe(422);
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(0);
        });

        test("It should return status 503", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "getUsers").mockRejectedValueOnce(new Error("Internal Server Error"));
            const response = await request(app).get(`${baseURL}/users`);
            expect(response.status).toBe(503);
            expect(UserController.prototype.getUsers).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /users/roles/:role", () => {
        test("It should return status 200 (Users for a valid Role)", async () => {
            const result = [
                {
                    username: "test3",
                    name: "test",
                    surname: "test",
                    role: Role.ADMIN,
                    address: "test",
                    birthdate: "test"
                }
            ];

            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({}) }),
                })),
            }));

            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(result);

            const response = await request(app).get(`${baseURL}/users/roles/Admin`);
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledWith("Admin");
            expect(response.body).toEqual(result);
        });

        test("It should return status 401 (Unauthenticated user)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => next());
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => next());

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([customer_user, admin_user, manager_user]);
            const response = await request(app).get(`${baseURL}/users/roles/Admin`);
            expect(response.status).toBe(401);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0);
        });

        test("It should return status 401 (User is not an admin)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => next());

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce([customer_user, admin_user, manager_user]);
            const response = await request(app).get(`${baseURL}/users/roles/Admin`);
            expect(response.status).toBe(401);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0);
        });

        test("It should return status 422 (The parameters are not formatted properly)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly", status: 422 });
            });

            jest.spyOn(UserController.prototype, "getUsersByRole").mockResolvedValueOnce(users);
            const response = await request(app).get(`${baseURL}/users/roles/InvalidRole`);
            expect(response.status).toBe(422);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(0);
        });

        test("It should return status 503", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "getUsersByRole").mockRejectedValueOnce(new Error("Internal Server Error"));
            const response = await request(app).get(`${baseURL}/users/roles/Admin`);
            expect(response.status).toBe(503);
            expect(UserController.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET users/username", () => {
        test(" Correct function 200 code", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(outputUser);
            const response = await request(app).get(baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(200);
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(response.body).toStrictEqual(outputUser);
        });

        test("User not logged in (401 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                res.status(401).json({error: "Unauthenticated user", status: 401});
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, "validateRequest").mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(outputUser);
            const response = await request(app).get(baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(401);
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
            expect(response.body).toStrictEqual({error: "Unauthenticated user", status: 401});
        });

        test("Parameters are not formatted properly (422 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                res.status(422).json({error: "The parameters are not formatted properly", status: 422});
            });
            jest.spyOn(UserController.prototype, "getUserByUsername").mockResolvedValueOnce(outputUser);
            const response = await request(app).get(baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(422);
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
            expect(response.body).toStrictEqual({error: "The parameters are not formatted properly", status: 422});
        });

        test("Unexpected Error (503 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req: any, res: any, next: any) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(UserController.prototype, "getUserByUsername").mockRejectedValueOnce(new Error("Internal Server Error"))
            const response = await request(app).get(baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(503);
            expect(UserController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        });
    });

    describe("DELETE /users/", () => {
        test("Correct Function (200 code)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users");
            expect(response.status).toBe(200);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1);
        });

        test("User not logged in (401 code)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users");
            expect(response.status).toBe(401);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(0);
        });

        test("User is not an Admin (401 code)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users");
            expect(response.status).toBe(401);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(0);
        });

        test("User is not an Admin (401 code)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "User is not an admin", status: 401 });
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users");
            expect(response.status).toBe(401);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(0);
        });

        test("The parameters are not formatted properly (422 coe)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly\n\n", status: 422})
            });
    
            jest.spyOn(UserController.prototype, "deleteAll").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users");
            expect(response.status).toBe(422);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(0);
        });

        test("Unexpected Error (503 code)", async () => {
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(Authenticator.prototype, "isAdmin").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteAll").mockRejectedValueOnce(new Error("Internal Server Error"));
            const response = await request(app).delete( baseURL + "/users");
            expect(response.status).toBe(503);
            expect(UserController.prototype.deleteAll).toHaveBeenCalledTimes(1);
        });
    });

    describe("DELETE /users/username", () => {
        test("Correct function (200 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(200);
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
        });

        test("user not logged in (401 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(401);
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(0);
        });

        test("The parameters are not formatted properly (422 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "The parameters are not formatted properly", status: 401 });
            });
    
            jest.spyOn(UserController.prototype, "deleteUser").mockResolvedValueOnce(true);
            const response = await request(app).delete( baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(422);
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(0);
        });

        test("Unexpected Error (503 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            const outputUser = { username: "test2", name: "test", surname: "test", role: Role.CUSTOMER, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "deleteUser").mockRejectedValueOnce(new Error("Internal Server Error"))
            const response = await request(app).delete( baseURL + "/users/username").send({user: inputUser, username: outputUser.username});
            expect(response.status).toBe(503);
            expect(UserController.prototype.deleteUser).toHaveBeenCalledTimes(1);
        });
    });

    describe("PATCH /users/username", () => {
        test("Correct Function (200 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(inputUser);
            const response = await request(app).patch( baseURL + "/users/username").send({user: inputUser, name: inputUser.name, surname: inputUser.surname, address: inputUser.address, birthdate: inputUser.birthdate, username: inputUser.username});
            expect(response.status).toBe(200);
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        });

        test("User not logged in (401 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(inputUser);
            const response = await request(app).patch( baseURL + "/users/username").send({user: inputUser, name: inputUser.name, surname: inputUser.surname, address: inputUser.address, birthdate: inputUser.birthdate, username: inputUser.username});
            expect(response.status).toBe(401);
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
        });
        
        test("Parameters are not formatted properly (422 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Parameters are not formatted properly", status: 422 });
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockResolvedValue(inputUser);
            const response = await request(app).patch( baseURL + "/users/username").send({user: inputUser, name: inputUser.name, surname: inputUser.surname, address: inputUser.address, birthdate: inputUser.birthdate, username: inputUser.username});
            expect(response.status).toBe(422);
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
        });
        
        test("Unexpected Error (503 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });
    
            jest.spyOn(UserController.prototype, "updateUserInfo").mockRejectedValueOnce(new Error("Internal Server Error"))
            const response = await request(app).patch( baseURL + "/users/username").send({user: inputUser, name: inputUser.name, surname: inputUser.surname, address: inputUser.address, birthdate: inputUser.birthdate, username: inputUser.username});
            expect(response.status).toBe(503);
            expect(UserController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
        });
    });
});

describe("AuthRoutes", () => {

    const customer = {
        username: "customer",
        name: "customer",
        surname: "customer",
        password: "customer",
        role: Role.CUSTOMER
    };

    beforeEach(() => {
        jest.resetAllMocks();
    })

    describe("POST /sessions", () => {
        test("Correct Function (200 code)", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(undefined);

            const response = await request(app).post(baseURL + "/sessions").send(customer);
            expect(response.status).toBe(200);
            expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1);
        });

        test("Parameters are not formatted properly (422 code)", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Parameters are not formatted properly", status: 422})
            });

            jest.spyOn(Authenticator.prototype, "login").mockResolvedValueOnce(undefined);

            const response = await request(app).post(baseURL + "/sessions").send(customer);
            expect(response.status).toBe(422);
            expect(Authenticator.prototype.login).toHaveBeenCalledTimes(0);
        });

        test("Incorrect username or password (401 code)", async () => {
            jest.mock('express-validator', () => ({
                body: jest.fn().mockImplementation(() => ({
                    isInt: () => (() => ({})),
                    isIn: () => (() => ({})),
                    notEmpty: () => (() => ({})),
                    isString: () => (() => ({}))
                })),
                param: jest.fn().mockImplementation(() => ({
                    isString: () => ({ notEmpty: () => ({})}),
                })),
            }));
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "login").mockRejectedValueOnce(new Error("Incorrect username or password"));

            const response = await request(app).post(baseURL + "/sessions").send(customer);
            expect(response.status).toBe(401);
            expect(Authenticator.prototype.login).toHaveBeenCalledTimes(1);
        });
    });

    describe("DELETE /sessions/current", () => {
        test("Correct Function (200 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(undefined);

            const response = await request(app).delete(baseURL + "/sessions/current").send(inputUser);
            expect(response.status).toBe(200);
            expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1);
        });

        test("User is not logged in (401 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return res.status(401).json({ error: "Unauthenticated user", status: 401 });
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(undefined);

            const response = await request(app).delete(baseURL + "/sessions/current").send(inputUser);
            expect(response.status).toBe(401);
            expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(0);
        });

        test("Parameters are not formatted properly (422 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return res.status(422).json({ error: "Parameters are not formatted properly", status: 422 });
            });

            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(undefined);

            const response = await request(app).delete(baseURL + "/sessions/current").send(inputUser);
            expect(response.status).toBe(422);
            expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(0);
        });

        test("Unexpected Error (503 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "logout").mockRejectedValueOnce(new Error("Internal Server Error"));

            const response = await request(app).delete(baseURL + "/sessions/current").send(inputUser);
            expect(response.status).toBe(503);
            expect(Authenticator.prototype.logout).toHaveBeenCalledTimes(1);
        });
    });

    describe("GET /sessions/current", () => {
        test("Correct Function (200 code)", async () => {
            const inputUser = { username: "test1", name: "test", surname: "test", role: Role.ADMIN, address: "", birthdate: ""};
            jest.spyOn(Authenticator.prototype, "isLoggedIn").mockImplementation((req, res, next) => {
                return next();
            });
            jest.spyOn(ErrorHandler.prototype, 'validateRequest').mockImplementation((req, res, next) => {
                return next();
            });

            jest.spyOn(Authenticator.prototype, "logout").mockResolvedValueOnce(undefined);

            const response = await request(app).get(baseURL + "/sessions/current").send(inputUser);
            expect(response.status).toBe(200);
        })
    })
});
