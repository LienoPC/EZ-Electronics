import UserDAO from '../../src/dao/userDAO';
import userController from '../../src/controllers/userController';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { User, Role } from '../../src/components/user';
import db from "../../src/db/db";
import { cleanup, createAllTables } from '../../src/db/cleanup';
import crypto from "crypto";
import request from 'supertest'
import { app } from "../../index"


const routePath = "/ezelectronics"; //Base route path for the API
const baseURL = routePath + '/users';

const userToObject = (user: User) => {
    return { username: user.username, name: user.name, surname: user.surname, password: "password", role: user.role }
};

const login = async (user: User) => {
    return new Promise<string>((resolve, reject) => {
        request(app)
            .post(`${routePath}/sessions`)
            .send(userToObject(user))
            .end((err, res) => {
                if (err) {
                    reject(err)
                }
                resolve(res.header["set-cookie"][0]);
            });
    });
};

const postUser = async (user: User) => {
    await request(app)
        .post(`${routePath}/users`)
        .send(userToObject(user))
};

describe('UserRouter Integration Tests', () => {
    let userDAO: UserDAO;
    let controller: userController;
    let userCookie: any;
    let nullValue: any;

    let user1: User;
    let user2: User;
    let user3: User;

    let users: User[]

    let hashedPassword: any;
    let salt: any;

    beforeAll(async () => {

        await createAllTables();

        userDAO = new UserDAO();
        controller = new userController();
        nullValue = null;

        salt = crypto.randomBytes(16);
        hashedPassword = crypto.scryptSync("password", salt, 16); // Usa 16 byte

        user1 = new User("customer", "customer", "customer", Role.CUSTOMER, nullValue, nullValue);
        user2 = new User("manager", "manager", "manager", Role.MANAGER, nullValue, nullValue);
        user3 = new User("admin", "admin", "admin", Role.ADMIN, nullValue, nullValue);

        users = new Array(user1, user2, user3);

        await postUser(user1);
        await postUser(user2);
        await postUser(user3);

        jest.spyOn(db, "get");
        jest.spyOn(db, "all");
        jest.spyOn(db, "run");
    });

    afterAll(async () => {
        await createAllTables();
        await cleanup();
        await new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    resolve(null);
                }
            });
        });
    });

    beforeEach(async () => {

        jest.clearAllMocks();
    });

    afterEach(async () => {
        /* await createAllTables();
        cleanup(); */
    });

    describe("POST /", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "createUser");
        });

        test("Correct Function (200 code)", async () => {
            const response = await request(app).post(baseURL).send({ username: "lorenzo", name: "customer", surname: "customer", password: "password", role: "Customer" });

            expect(response.status).toBe(200);
            expect(response.body).toStrictEqual({});
            expect(userController.prototype.createUser).toBeCalledTimes(1);
            expect(userController.prototype.createUser).toBeCalledWith("lorenzo", "customer", "customer", "password", "Customer");
            db.exec("DELETE FROM users WHERE username = 'lorenzo'")
        });

        test("Parameters are not formatted Properly (422 code)", async () => {
            const response = await request(app).post(baseURL).send({ username: "customer", name: "customer", surname: "customer", password: "password", role: "CUSTOMER" });
            expect(response.status).toBe(422);
            expect(userController.prototype.createUser).toBeCalledTimes(0);
        });

        test("User already Exist (409 code)", async () => {
            db.serialize(() => {
                db.run('INSERT INTO users (username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ["lorenzo", user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
            });
            const response = await request(app).post(baseURL).send({ username: "lorenzo", name: "customer", surname: "customer", password: "password", role: "Customer" });
            expect(response.status).toBe(409);
            expect(userController.prototype.createUser).toBeCalledTimes(1);
            db.exec("DELETE FROM users WHERE username = 'lorenzo'");
        });
    });

    describe("GET /", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "getUsers");
        });

        test("correctExecution", async () => {
            userCookie = await login(user3);
            const response = await request(app).get(baseURL).set("Cookie", userCookie);

            expect(response.status).toBe(200);
            expect(userController.prototype.getUsers).toBeCalledTimes(1);
        });

        test("userNotAllowed", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL).set("Cookie", userCookie);

            expect(response.status).toBe(401);
            expect(userController.prototype.getUsers).toBeCalledTimes(0);
        });
    });

    describe("GET /roles/role", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "getUsersByRole");
        });

        test("Correct Function (200 code)", async () => {
            userCookie = await login(user3);
            const response = await request(app).get(baseURL + "/roles/Customer").set("Cookie", userCookie);
            expect(response.status).toBe(200);
            expect(userController.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(userController.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");
        });

        test("User is not an Admin (401 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/roles/Customer").set("Cookie", userCookie);
            expect(response.status).toBe(401);
            expect(userController.prototype.getUsersByRole).toHaveBeenCalledTimes(0);
        });

        test("User is not logged in (401 code)", async () => {
            //userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/roles/Customer").set("Cookie", userCookie);
            expect(response.status).toBe(401);
            expect(userController.prototype.getUsersByRole).toHaveBeenCalledTimes(0);
        });
    });

    describe("GET /username", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "getUserByUsername");
        });

        test("Correct Function (200 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).get(baseURL + "/customer").set("Cookie", userCookie);
            expect(response.status).toBe(200);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledWith(user1, "customer");
        });

        test("User is not logged in (401 code)", async () => {
            const response = await request(app).get(baseURL + "/customer");
            expect(response.status).toBe(401);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
        });

        test("Unauthorized User (401 code)", async () => {
            userCookie = await login(user2);
            const response = await request(app).get(baseURL + "/customer").set("Cookie", userCookie);
            expect(response.status).toBe(401);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledWith(user2, "customer");
        });

        test("User not found (404 code)", async () => {
            userCookie = await login(user3);
            db.exec("DELETE FROM users WHERE username = 'customer'")
            const response = await request(app).get(baseURL + "/customer").set("Cookie", userCookie);
            expect(response.status).toBe(404);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(userController.prototype.getUserByUsername).toHaveBeenCalledWith(user3, "customer");
            await postUser(user1);
        });
    });

    describe("DELETE /username", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "deleteUser");
        });

        test("Correct Function Admin(200 code)", async () => {
            userCookie = await login(user3);
            const response = await request(app).delete(baseURL + "/customer").set("Cookie", userCookie);
            expect(response.status).toBe(200);
            expect(userController.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(userController.prototype.deleteUser).toHaveBeenCalledWith(user3, "customer");
            await postUser(user1);
        });

        test("Correct Function non Admin (200 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/customer").set("Cookie", userCookie);
            expect(response.status).toBe(200);
            expect(userController.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(userController.prototype.deleteUser).toHaveBeenCalledWith(user1, "customer");
            await postUser(user1);
        });

        test("User Is Not Logged In (401 code)", async () => {
            //userCookie = await login(user3);
            const response = await request(app).delete(baseURL + "/customer");
            expect(response.status).toBe(401);
            expect(userController.prototype.deleteUser).toHaveBeenCalledTimes(0);
        });

        test("Unauthorized User (401 code)", async () => {
            userCookie = await login(user2);
            const response = await request(app).delete(baseURL + "/customer").set("Cookie", userCookie);
            expect(response.status).toBe(401);
            expect(userController.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(userController.prototype.deleteUser).toHaveBeenCalledWith(user2, "customer");
        });

        test("userDoesNotExists", async () => {
            userCookie = await login(user3);
            const response = await request(app).delete(baseURL + "/lorenzo").set("Cookie", userCookie);
            expect(response.status).toBe(404);
            expect(userController.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(userController.prototype.deleteUser).toHaveBeenCalledWith(user3, "lorenzo");
        });

        test("userIsAdmin", async () => {
            const user4 = new User("admin2", "admin", "admin", Role.ADMIN, nullValue, nullValue);
            postUser(user4);

            userCookie = await login(user3);
            const response = await request(app).delete(baseURL + "/admin2").set("Cookie", userCookie);
            expect(response.status).toBe(401);
            expect(userController.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(userController.prototype.deleteUser).toHaveBeenCalledWith(user3, "admin2");
        });
    });

    describe("DELETE /", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "deleteAll");
        });

        test("Correct Function (200 code)", async () => {
            userCookie = await login(user3);
            const response = await request(app).delete(baseURL + "/").set("Cookie", userCookie);
            expect(response.status).toBe(200);
            expect(userController.prototype.deleteAll).toHaveBeenCalledTimes(1);
            expect(userController.prototype.deleteAll).toHaveBeenCalledWith();
            await postUser(user1);
            await postUser(user2);
            //await postUser(user3);
        });

        test("User is not logged in (401 code)", async () => {
            //userCookie = await login(user3);
            const response = await request(app).delete(baseURL + "/");
            expect(response.status).toBe(401);
            expect(userController.prototype.deleteAll).toHaveBeenCalledTimes(0);
        });

        test("User is not an Admin (401 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete(baseURL + "/").set("Cookie", userCookie);
            expect(response.status).toBe(401);
            expect(userController.prototype.deleteAll).toHaveBeenCalledTimes(0);
        });
    });

    describe("PATCH /username", () => {
        beforeAll(() => {
            jest.spyOn(userController.prototype, "updateUserInfo");
        });

        test("Correct Function Admin(200 code)", async () => {
            userCookie = await login(user3);
            const response = await request(app).patch(baseURL + "/customer")
                .set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2023-01-01",  // Data di nascita corretta
                    username: "customer"
                });

            expect(response.status).toBe(200);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledWith(user3, "lorenzo", "ricci", "address", "2023-01-01", "customer");
            db.run("UPDATE users SET name = ?, surname = ?, birthdate = ?, address = ? WHERE username = 'customer'", [user1.name, user1.surname, user1.birthdate, user1.address]);
        });

        test("Correct Function non Admin(200 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL + "/customer")
                .set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2023-01-01",  // Data di nascita corretta
                    username: "customer"
                });

            expect(response.status).toBe(200);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledWith(user1, "lorenzo", "ricci", "address", "2023-01-01", "customer");
            db.run("UPDATE users SET name = ?, surname = ?, birthdate = ?, address = ? WHERE username = 'customer'", [user1.name, user1.surname, user1.birthdate, user1.address]);
        });

        test("User is not Logged in (401 code)", async () => {
            //userCookie = await login(user1);
            const response = await request(app).patch(baseURL + "/customer")
                //.set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2023-01-01",  // Data di nascita corretta
                    username: "customer"
                });

            expect(response.status).toBe(401);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
        });

        test("Parameters are not formatted properly (422 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL + "/customer")
                .set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2023/03/30",  // Data di nascita sbagliata
                    username: "customer"
                });

            expect(response.status).toBe(422);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(0);
        });

        test("Unauthorized Error (401 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL + "/manager")
                .set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2023-01-01",  // Data di nascita corretta
                    username: "manager"
                });

            expect(response.status).toBe(401);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledWith(user1, "lorenzo", "ricci", "address", "2023-01-01", "manager");
        });

        test("Date Error (400 code)", async () => {
            userCookie = await login(user1);
            const response = await request(app).patch(baseURL + "/customer")
                .set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2025-01-01",  // Data di nascita sbagliata (futura)
                    username: "customer"
                });

            expect(response.status).toBe(400);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledWith(user1, "lorenzo", "ricci", "address", "2025-01-01", "customer");
        });

        test("userNotExistsAdmin (404)", async () => {
            userCookie = await login(user3);
            const response = await request(app).patch(baseURL + "/lorenzo")
                .set("Cookie", userCookie)
                .send({
                    name: "lorenzo",
                    surname: "ricci",
                    address: "address",
                    birthdate: "2023-01-01",  // Data di nascita corretta
                    username: "customer"
                });

            expect(response.status).toBe(404);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledTimes(1);
            expect(userController.prototype.updateUserInfo).toHaveBeenCalledWith(user3, "lorenzo", "ricci", "address", "2023-01-01", "lorenzo");
        });
    });

    describe("DELETE sessions/current", () => {
        test("correctExecution", async () => {
            userCookie = await login(user1);
            const response = await request(app).delete("/ezelectronics/sessions/current").set("Cookie", userCookie);

            expect(response.status).toBe(200);
        });
    });

    describe("GET sessions/current", () => {
        test("correctExecution", async () => {
            userCookie = await login(user1);
            const response = await request(app).get("/ezelectronics/sessions/current").set("Cookie", userCookie);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(user1);
        });
    });

});