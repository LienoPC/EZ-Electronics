import UserDAO from '../../src/dao/userDAO';
import userController from '../../src/controllers/userController';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { User, Role } from '../../src/components/user';
import db from "../../src/db/db";
import { cleanup,createAllTables, createAllTriggers } from '../../src/db/cleanup';
import crypto from "crypto";
import { UnauthorizedUserError, UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from '../../src/errors/userError';
import { DateError } from '../../src/utilities';



describe('UserController Integration Tests', () => {
    let userDAO: UserDAO;
    let controller: userController;
    let nullValue: any;

    let user1: User;
    let user2: User;
    let user3: User;

    let users: User[]

    let hashedPassword: any;
    let salt: any;

    beforeAll(async () => {
        await createAllTables();
        await createAllTriggers();
        userDAO = new UserDAO();
        controller = new userController();
        nullValue = null;

        salt = crypto.randomBytes(16);
        hashedPassword = crypto.scryptSync("password", salt, 16); // Usa 16 byte

        user1 = new User("customer", "customer", "customer", Role.CUSTOMER, nullValue, nullValue);
        user2 = new User("manager", "manager", "manager", Role.MANAGER, nullValue, nullValue);
        user3 = new User("admin", "admin", "admin", Role.ADMIN, nullValue, nullValue);

        users = new Array(user1, user2, user3);
        cleanup();
        db.serialize(() => {
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
            db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
        })


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

    beforeEach(() => {
    
        jest.clearAllMocks();
    });

    afterEach(async () => {
    
        jest.clearAllMocks();

    });

    describe("createUser", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "createUser");
        });

        test("Correct Function", async () => {
            const response = await controller.createUser("lore", "lorenzo", "ricci", "1234", "Admin");
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith("lore", "lorenzo", "ricci", "1234", "Admin");
            expect(response).toBe(true);
            db.exec("DELETE FROM users WHERE username = 'lorenzo'")

        });

        test("Database Error", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.createUser("lore", "lorenzo", "ricci", "1234", "Admin")).rejects.toThrow();
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith("lore", "lorenzo", "ricci", "1234", "Admin");
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })       
        });

        test("User already exist", async () => {
            await expect(controller.createUser("customer", "lorenzo", "ricci", "1234", "Admin")).rejects.toThrow(UserAlreadyExistsError);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith("customer", "lorenzo", "ricci", "1234", "Admin");
        });
    });

    describe("getUsers", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "getUsers");
        });

        test("Correct Function", async () => {
            const response = await controller.getUsers();
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledWith();
            expect(response).toStrictEqual(users);
        });

        test("Database Error", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.getUsers()).rejects.toThrow();
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledWith();
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("getUsersByRole", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "getUsersByRole");
        });

        test("Correct Function", async () => {
            const response = await controller.getUsersByRole("Customer");
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");
            expect(response).toStrictEqual([user1]);
        });

        test("Database Error", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.getUsersByRole("Customer")).rejects.toThrow();
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
                });
    });

    describe("getUserByUsername", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "getUserByUsername");
        });

        test("Correct Function Admin", async () => {
            const response = await controller.getUserByUsername(user3, "customer");
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("customer");
            expect(response).toStrictEqual(user1);
        });

        test("Correct Function non Admin", async () => {
            const response = await controller.getUserByUsername(user1, "customer");
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("customer");
            expect(response).toStrictEqual(user1);
        });

        test("UnauthorizedUserError", async () => {
            await expect(controller.getUserByUsername(user1, "admin")).rejects.toThrow(UnauthorizedUserError);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
        });

        test("Database Error", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.getUserByUsername(user3, "customer")).rejects.toThrow();
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("customer");
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });


    describe("deleteUser", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "deleteUserAdmin");
            jest.spyOn(UserDAO.prototype, "deleteUser");
        });

        test("Correct Function Admin", async () => {
            const response = await controller.deleteUser(user3, "customer");
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledWith("customer");
            expect(response).toBe(true);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
    
        });

        test("Correct Function non Admin", async () => {
            const response = await controller.deleteUser(user1, "customer");
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("customer");
            expect(response).toBe(true);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
    
        });

        test("UnauthorizedUserError", async () => {
            await expect(controller.deleteUser(user1, "admin")).rejects.toThrow(UnauthorizedUserError)
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(0);
        });

        test("User not Found Error Admin", async () => {
            await expect(controller.deleteUser(user3, "lore")).rejects.toThrow(UserNotFoundError)
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledWith("lore");
        });

        test("User not found Error non Admin", async () => {
            db.exec("DELETE FROM users WHERE username = 'customer'")
            await expect(controller.deleteUser(user1, "customer")).rejects.toThrow(UserNotFoundError)
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("customer");
        });

        test("UserIsAdminError", async () => {
            db.serialize(() => {
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [4, "lore", "lorenzo", "ricci", Role.ADMIN, hashedPassword, salt, "", ""]);
            });
            await expect(controller.deleteUser(user3, "lore")).rejects.toThrow(UserIsAdminError)
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledWith("lore");
        });

        test("Database Error Admin", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.deleteUser(user3, "customer")).rejects.toThrow()
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledWith("customer");
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("Database Error non Admin", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.deleteUser(user1, "customer")).rejects.toThrow()
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("customer");
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("deleteAll", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "deleteAllUsers");
        });

        test("Correct Function", async () => {
            const response = await controller.deleteAll();
            expect(response).toBe(true);
            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("Database Error", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.deleteAll()).rejects.toThrow();
            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("updateUserInfo", () => {
        beforeAll(() => {
            jest.spyOn(UserDAO.prototype, "updateUserAdmin");
            jest.spyOn(UserDAO.prototype, "updateUser");
        });

        test("Correct Function Admin", async () => {
            const response = await controller.updateUserInfo(user3, "lorenzo", "ricci", "", "", "customer");
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledWith(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", ""));
            expect(response).toStrictEqual(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", ""));
            db.run("UPDATE users SET name = ?, surname = ?, birthdate = ?, address = ? WHERE username = 'customer'", [user1.name, user1.surname, user1.birthdate, user1.address]);

        });

        test("Correct Function non Admin", async () => {
            const response = await controller.updateUserInfo(user1, "lorenzo", "ricci", "", "", "customer");
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", ""));
            expect(response).toStrictEqual(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", ""));
            db.run("UPDATE users SET name = ?, surname = ?, birthdate = ?, address = ? WHERE username = 'customer'", [user1.name, user1.surname, user1.birthdate, user1.address]);
       
        });

        test("User Not Found Error Admin", async () => {
            await expect(controller.updateUserInfo(user3, "lorenzo", "ricci", "", "", "lore")).rejects.toThrow(UserNotFoundError);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledWith(new User("lore", "lorenzo", "ricci", Role.CUSTOMER, "", ""));
        });

        test("User Not Found Error non Admin", async () => {
            db.exec("DELETE FROM users WHERE username = 'customer'")
            await expect(controller.updateUserInfo(user1, "lorenzo", "ricci", "", "", "customer")).rejects.toThrow(UserNotFoundError);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", ""));
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })       
         });

        test("User Is Admin Error", async () => {
            db.run('INSERT INTO users (username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', ['lorenzo', 'lorenzo', 'lorenzo', user3.role, hashedPassword, salt, null, null]);

            await expect(controller.updateUserInfo(user3, "lorenzo", "ricci", "", "", "lorenzo")).rejects.toThrow(UserIsAdminError);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledWith(new User("lorenzo", "lorenzo", "ricci", Role.CUSTOMER, "", ""));

            db.exec('DELETE FROM users WHERE username = "lorenzo"');
        });

        test("Date Error", async () => {
            await expect(controller.updateUserInfo(user3, "lorenzo", "ricci", "", "2025-01-01", "admin")).rejects.toThrow(DateError);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
        });

        test("Database Error Admin", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.updateUserInfo(user3, "lorenzo", "ricci", "", "", "customer")).rejects.toThrow();
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledWith(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", "")); 
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("Database Error non Admin", async () => {
            db.exec("DROP TABLE users");
            await expect(controller.updateUserInfo(user1, "lorenzo", "ricci", "", "", "customer")).rejects.toThrow();
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(new User("customer", "lorenzo", "ricci", Role.CUSTOMER, "", "")); 
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

    });
    
});