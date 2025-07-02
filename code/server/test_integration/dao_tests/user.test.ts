import UserDAO from '../../src/dao/userDAO';
import { jest, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { User, Role } from '../../src/components/user';
import { CartNotFoundError, ProductInCartError, EmptyCartError, ProductNotInCartError } from '../../src/errors/cartError';
import { EmptyProductStockError, ProductNotFoundError } from '../../src/errors/productError';
import db from "../../src/db/db";
import { cleanup, createAllTables, createAllTriggers } from '../../src/db/cleanup';
import crypto from "crypto";
import { UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from '../../src/errors/userError';



describe('UserDAO Integration Tests', () => {
    let userDAO: UserDAO;
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
    
    describe("getIsUserAuthenticated", () => {
        test("Correct Function", async () => {
            const response = await userDAO.getIsUserAuthenticated(user1.username, "password");
            expect(db.get).toBeCalledTimes(1);
            expect(response).toEqual(true);
        }); 

        test("User not found", async () => {
            db.exec('DELETE FROM users WHERE username = "customer"'); // Simulate SQL error
            const response = await userDAO.getIsUserAuthenticated("customer", "password");
            expect(db.get).toBeCalledTimes(1);
            expect(response).toBe(false);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("errorSQL_get", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.getIsUserAuthenticated(user1.username, "password")).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("Different Buffer Lenght", async () => {
            salt = crypto.randomBytes(16).toString('hex');
            hashedPassword = crypto.scryptSync("password", salt, 32).toString('hex'); // Usa 32 byte, noi usiamo 16
            cleanup();
            db.serialize(() => {
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
            });
            const response = await userDAO.getIsUserAuthenticated(user1.username, "password");
            expect(db.get).toBeCalledTimes(1);
            expect(response).toEqual(false);
        });

        test("Incorrect password should return false", async () => {
            const response = await userDAO.getIsUserAuthenticated(user1.username, "wrongpassword");
            expect(db.get).toBeCalledTimes(1);
            expect(response).toBe(false);
        });
    });

    describe("createUser", () => {
        test("Correct Function", async () => {
            const response = await userDAO.createUser("lore", "lorenzo", "ricci", "1234", "Admin");
            expect(db.run).toBeCalledTimes(1);
            expect(response).toEqual(true);
            db.exec("DELETE FROM users WHERE username = 'lorenzo'")
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("UNIQUE constraint failed: users.username", async () => {
            await expect(userDAO.createUser("customer", "lorenzo", "ricci", "1234", "Admin")).rejects.toThrow(UserAlreadyExistsError);
            expect(db.run).toBeCalledTimes(1);
        });

        test("errorSQL_run", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.createUser("lore", "lorenzo", "ricci", "1234", "Admin")).rejects.toThrow("SQLITE_ERROR: no such table: users");
            expect(db.run).toBeCalledTimes(1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });
    
    describe("getUserByUsername", () => {
        test("Correct Function", async () => {
        
            const response = await userDAO.getUserByUsername("customer")
            expect(db.get).toBeCalledTimes(1);
            expect(response).toStrictEqual(user1);
        });

        test("User not Found", async () => {
            db.exec('DELETE FROM users WHERE username = "customer"');
            await expect(userDAO.getUserByUsername("customer")).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("errorSQL_get", async () => {
            db.exec('DROP TABLE users');
            await expect(userDAO.getUserByUsername("customer")).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("getUsers", () => {
        test("Correct Function", async () => {
            const response = await userDAO.getUsers();
            expect(db.all).toBeCalledTimes(1);
            expect(response).toStrictEqual(users);
        });

        test("errorSQL_all", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.getUsers()).rejects.toThrow();
            expect(db.all).toBeCalledTimes(1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("getUsersByRole", () => {
        test("Correct Function", async () => {
            const response = await userDAO.getUsersByRole("Customer");
            expect(db.all).toBeCalledTimes(1);
            expect(response).toStrictEqual([user1]);
        });

        test("errorSQL_all", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.getUsersByRole("Customer")).rejects.toThrow();
            expect(db.all).toBeCalledTimes(1);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("deleteUserAdmin", () => {
        test("Correct Function", async () => {
            const response = await userDAO.deleteUserAdmin("customer");
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(response).toStrictEqual(true);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("User not found", async () => {
            db.exec('DELETE FROM users WHERE username = "customer"')
            await expect(userDAO.deleteUserAdmin("customer")).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("User is admin", async () => {
            await expect(userDAO.deleteUserAdmin("admin")).rejects.toThrow(UserIsAdminError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        });

        test("errorSQL_get", async () => {
            db.exec('DROP TABLE users');
            await expect(userDAO.deleteUserAdmin("customer")).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("deleteUser", () => {
        test("Correct Function", async () => {
            const response = await userDAO.deleteUser("customer");
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(response).toBe(true);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("User not found", async () => {
            db.exec('DELETE FROM users WHERE username = "customer"')
            await expect(userDAO.deleteUser("customer")).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("errorSQL_get", async () => {
            db.exec('DROP TABLE users');
            await expect(userDAO.deleteUser("customer")).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("deleteAllUsers", () => {
        test("Correct Function", async () => {
            const response = await userDAO.deleteAllUsers();
            expect(db.run).toBeCalledTimes(1);
            expect(response).toStrictEqual(true);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("errorSQL_run", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.deleteUserAdmin("customer")).rejects.toThrow();
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("updateUserAdmin", () => {
        test("Correct Function", async () => {
            const response = await userDAO.updateUserAdmin(user1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(response).toStrictEqual(user1);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("User not found", async () => {
            db.exec('DELETE FROM users WHERE username = "customer"')
            await expect(userDAO.updateUserAdmin(user1)).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("User is admin", async () => {
            await expect(userDAO.updateUserAdmin(user3)).rejects.toThrow(UserIsAdminError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);

        });

        test("errorSQL_get", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.updateUserAdmin(user1)).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });

    describe("updateUser", () => {
        test("Correct Function", async () => {
            const response = await userDAO.updateUser(user1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
            expect(response).toStrictEqual(user1);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("User not found", async () => {
            db.exec('DELETE FROM users WHERE username = "customer"')
            await expect(userDAO.updateUser(user1)).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec("DELETE FROM users");
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });

        test("errorSQL_get", async () => {
            db.exec("DROP TABLE users");
            await expect(userDAO.updateUser(user1)).rejects.toThrow();
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
            db.serialize(() => {
                db.exec(`CREATE TABLE IF NOT EXISTS "users" ("id" INTEGER NOT NULL UNIQUE, "username" TEXT NOT NULL UNIQUE, "name" TEXT NOT NULL, "surname" TEXT NOT NULL, "role" TEXT NOT NULL CHECK(role = 'Customer' OR role = 'Manager' OR role = 'Admin'), "password" TEXT NOT NULL, "salt" TEXT NOT NULL, "address" TEXT, "birthdate" TEXT, PRIMARY KEY("id" AUTOINCREMENT))`);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, user1.username, user1.name, user1.surname, user1.role, hashedPassword, salt, user1.address, user1.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [2, user2.username, user2.name, user2.surname, user2.role, hashedPassword, salt, user2.address, user2.birthdate]);
                db.run('INSERT INTO users (id, username, name, surname, role, password, salt, address, birthdate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [3, user3.username, user3.name, user3.surname, user3.role, hashedPassword, salt, user3.address, user3.birthdate]);
            })
        });
    });
});

