import { describe, test, expect, beforeAll, afterAll, afterEach, jest } from "@jest/globals"

import UserDAO from "../../src/dao/userDAO"
import crypto from "crypto"
import db from "../../src/db/db"
import { Database, ERROR } from "sqlite3"
import { UserAlreadyExistsError, UserNotFoundError, UserIsAdminError } from "../../src/errors/userError"
import { Role, User } from "../../src/components/user"
import { mock } from "node:test"    

const DATABASE_ERROR_MESSAGE = "Database Error"

jest.mock("crypto")
jest.mock("../../src/db/db.ts")

//Example of unit test for the createUser method
//It mocks the database run method to simulate a successful insertion and the crypto randomBytes and scrypt methods to simulate the hashing of the password
//It then calls the createUser method and expects it to resolve true

describe("UserDAO", () => {
    let userDAO: UserDAO;

    let user: User;
    let user1: User;
    let user2: User;
    let user3: User;
    let user4: User;

    let users: Object[];

    let users_Customer: Object[];
    let users_Admin: Object[];
    let users_Manager: Object[];

    let nullValue: null;

    beforeAll(() => {
        userDAO = new UserDAO;

        nullValue = null;

        user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

        user1 = new User("user1", "Lorenzo", "Ricci", Role.CUSTOMER, "address", "birthdate");
        user2 = new User("user2", "Diego", "Dagiau", Role.ADMIN, "address", "birthdate");
        user3 = new User("user3", "Alberto", "Cagnazzo", Role.MANAGER, "address", "birthdate");
        user4 = new User("user4", "Paola", "Verrone", Role.CUSTOMER,"address", "birthdate")

        users = new Array(user1, user2, user3);

        users_Customer = new Array(user1, user4);
        users_Admin = new Array(user2);
        users_Manager = new Array(user3);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });


    describe("getIsUserAuthenticated", () => {

        test("UserAuthenticatedSuccessfully", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", password: Buffer.from("hashedPassword").toString("hex"), salt: "salt" }));
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
                return Buffer.from("hashedPassword");
            });
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(true);

            const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(result).toBe(true);
        });

        test("UserNotFound", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, null));

            const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(result).toBe(false);

            mockDBGet.mockRestore();
        });

        test("UserNotAuthenticatedDueToWrongPassword", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", password: Buffer.from("hashedPassword").toString("hex"), salt: "salt" }));
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
                return Buffer.from("wrongHashedPassword");
            });
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(false);

            const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(result).toBe(false);

            mockDBGet.mockRestore();
            mockScrypt.mockRestore();
            mockTimingSafeEqual.mockRestore();
        });

        test("DatabaseError", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(new Error("Database Error")));

            await expect(userDAO.getIsUserAuthenticated("username", "plainPassword")).rejects.toThrow("Database Error");

            mockDBGet.mockRestore();
        });

        test("UserNotAuthenticatedDueToMissingSalt", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", password: Buffer.from("hashedPassword").toString("hex") }));

            const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(result).toBe(false);

            mockDBGet.mockRestore();
        });

        test("returns false when crypto.timingSafeEqual returns false", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", password: Buffer.from("hashedPassword").toString("hex"), salt: "salt" }));
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation((password, salt, keylen) => {
                return Buffer.from("hashedPassword");
            });
            const mockTimingSafeEqual = jest.spyOn(crypto, "timingSafeEqual").mockReturnValue(false);

            const result = await userDAO.getIsUserAuthenticated("username", "plainPassword");
            expect(result).toBe(false);
        });

        test("CatchError", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", password: Buffer.from("hashedPassword").toString("hex"), salt: "salt" }));
            const mockScrypt = jest.spyOn(crypto, "scryptSync").mockImplementation(() => {
                throw new Error("Scrypt Error");
            });

            await expect(userDAO.getIsUserAuthenticated("username", "plainPassword")).rejects.toThrow("Scrypt Error");

            mockDBGet.mockRestore();
            mockScrypt.mockRestore();
        });
    })

    describe("createUser", () => {

        test("CorrectUser", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null)
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            const result = await userDAO.createUser("username", "name", "surname", "password", "role")
            expect(result).toBe(true)
            mockRandomBytes.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })

        test("errorUserAlreadyExist", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("UNIQUE constraint failed: users.username"))
                return {} as Database
            });
            const mockRandomBytes = jest.spyOn(crypto, "randomBytes").mockImplementation((size) => {
            return (Buffer.from("salt"))
            })
            const mockScrypt = jest.spyOn(crypto, "scrypt").mockImplementation(async (password, salt, keylen) => {
                return Buffer.from("hashedPassword")
            })
            
            await expect(userDAO.createUser("username", "name", "surname", "password", "role"))
                .rejects
                .toThrow(UserAlreadyExistsError);
            expect(db.run).toBeCalledTimes(1);
            mockRandomBytes.mockRestore()
            mockDBRun.mockRestore()
            mockScrypt.mockRestore()
        })

        test("CatchError", async () => {
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.createUser("username", "name", "surname", "password", "role")).rejects.toThrow("Unexpected Error");
            mockDBRun.mockRestore();
        });
    })

    describe("getUserByUsername", () => {
        test("UserRetrievedSuccessfully", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                const row = {
                    username: "username",
                    name: "name",
                    surname: "surname",
                    role: "Customer",
                    address: "address",
                    birthdate: "birthdate"
                };
                callback(null, row);
                return {} as Database
            });

            const response = await userDAO.getUserByUsername("username")
            expect(response).toEqual(new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate"));
            expect(db.get).toBeCalledTimes(1)
            mockDBGet.mockRestore();
        })

        test("UserNotFound", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null)
                return {} as Database
            });

            await expect(userDAO.getUserByUsername("username"))
                .rejects
                .toThrow(UserNotFoundError)
            expect(db.get).toHaveBeenCalledTimes(1)
            mockDBGet.mockRestore();
        })

        test("DatabaseError", async () => {
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error("Database Error"), null);
                return {} as Database
            });

            await expect(userDAO.getUserByUsername("username")).rejects.toThrow("Database Error");

            mockDBGet.mockRestore();
        });

        test("CatchError", async () => {
            jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.getUserByUsername("username")).rejects.toThrow("Unexpected Error");
        });
    })

    describe("getUsers", () => {
        test("UserRetrievedSuccessfully", async () => {
            const users = [
                { username: "user1", name: "Name1", surname: "Surname1", role: "Customer", address: "address", birthdate: "birthdate"},
                { username: "user2", name: "Name2", surname: "Surname2", role: "Customer", address: "address", birthdate: "birthdate" }
            ];
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                if (typeof params === "function") {
                    callback = params;
                }
                callback(null, users);
                return {} as Database;
            });


            const response = await userDAO.getUsers();
            expect(db.all).toBeCalledTimes(1);
            expect(response).toEqual(users);
        })

        test("errorSQL_all", async () => {
            const mockDBAll = jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                if (typeof params === "function") {
                    callback = params;
                }
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            });
            
            await expect(userDAO.getUsers()).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.all).toBeCalledTimes(1);
        })

        test("CatchError", async () => {
            jest.spyOn(db, "all").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.getUsers()).rejects.toThrow("Unexpected Error");
        })
    })

    describe("getUsersByRole", () => {
        test("UsersRetrievedByRoleSuccessfully", async () => {
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(null, users_Customer);
                return {} as Database
            })

            const response = await userDAO.getUsersByRole("Customer");
            expect(response).toEqual(users_Customer);
            expect(db.all).toBeCalledTimes(1);
        })

        test("errorSQL_all", async () => {
            jest.spyOn(db, "all").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database
            })

            await expect(userDAO.getUsersByRole("Customer")).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.all).toBeCalledTimes(1);
        })

        test("CatchError", async () => {
            jest.spyOn(db, "all").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.getUsersByRole("Customer")).rejects.toThrow("Unexpected Error");
        })
    })

    describe("deleteUserAdmin", () => {
        test("UserDeletedSuccessfully", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", role: Role["CUSTOMER"] }));
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });

            const result = await userDAO.deleteUserAdmin("username");
            expect(result).toBe(true);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database
            })
            await expect(userDAO.deleteUserAdmin).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
        })

        test("UserNotFound", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, null));

            await expect(userDAO.deleteUserAdmin("username")).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);

            mockDBGet.mockRestore();
        });

        test("UserIsAdminError", async () => {
            const userDAO = new UserDAO();
            const user_admin = new User("username", "name", "surname", Role.ADMIN, "", "");
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user_admin);
                return {} as Database
            });
        
            await expect(userDAO.deleteUserAdmin("username")).rejects.toThrow(UserIsAdminError);
            expect(db.get).toBeCalledTimes(1);
        });

        test("DatabaseErrorOnSelect", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(new Error("Database Error")));

            await expect(userDAO.deleteUserAdmin("username")).rejects.toThrow("Database Error");
            expect(db.get).toBeCalledTimes(1);

            mockDBGet.mockRestore();
        });

        test("DatabaseErrorOnDelete", async () => {
            const userDAO = new UserDAO();
            const mockDBGet = jest.spyOn(db, "get").mockImplementation((sql, params, callback) => callback(null, { username: "username", role: Role["CUSTOMER"] }));
            const mockDBRun = jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error("Database Error"));
                return {} as Database;
            });

            await expect(userDAO.deleteUserAdmin("username")).rejects.toThrow("Database Error");
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);

            mockDBGet.mockRestore();
            mockDBRun.mockRestore();
        });

        test("CatchError", async () => {
            const userDAO = new UserDAO();
            jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.deleteUserAdmin("username")).rejects.toThrow("Unexpected Error");
        });
    })

    describe("deleteUser", () => {
        test("userDeletedSuccessfully", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user);
                return {} as Database
            })

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database
            })

            const response = await userDAO.deleteUser("username");
            expect(response).toBe(true);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        })

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE))
                return {} as Database
            })

            await expect(userDAO.deleteUser("username")).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
        })

        test("UserNotFound", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database
            })

            await expect(userDAO.deleteUser("username")).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
        })

        test("errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user);
                return {} as Database
            })

            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database
            })

            await expect(userDAO.deleteUser("username")).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        })

        test("CatchError", async () => {
            const userDAO = new UserDAO();
            jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.deleteUser("username")).rejects.toThrow("Unexpected Error");
        });
    })

    describe("deleteAllUsers", () => {
        test("allUsersDeletedSuccessfully", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            const response = await userDAO.deleteAllUsers();
            expect(response).toBe(true);
            expect(db.run).toBeCalledTimes(1);
        })

        test("errorSQL_run", async () => {
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            })
            await expect(userDAO.deleteAllUsers()).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.run).toBeCalledTimes(1);
        })

        test("CatchError", async () => {
            const userDAO = new UserDAO();
            jest.spyOn(db, "run").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.deleteAllUsers()).rejects.toThrow("Unexpected Error");
        });
    })

    describe("updateUserAdmin", () => {
        test("UserUpdatedSuccesfully", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, users);
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            const response = await userDAO.updateUserAdmin(user1);
            expect(response).toBe(user1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        })

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            await expect(userDAO.updateUserAdmin(user1)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        })

        test("UserNotFoundError", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);  // Passa null come secondo parametro per simulare l'assenza di risultato
                return {} as Database;
            });
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            });
            await expect(userDAO.updateUserAdmin(user)).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        })

        test("UserIsAdminError", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user2);
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            await expect(userDAO.updateUserAdmin(user2)).rejects.toThrow(UserIsAdminError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        })

        test("errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, user);
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            })
            await expect(userDAO.updateUserAdmin(user)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        })

        test("CatchError", async () => {
            const userDAO = new UserDAO();
            jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });
            jest.spyOn(db, "run").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.updateUserAdmin(user)).rejects.toThrow("Unexpected Error");
        });
    })

    describe("updateUser", () => {
        test("UserUpdatedSuccessfully", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, users);
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            const response =  await userDAO.updateUser(user1);
            expect(response).toBe(user1);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        })

        test("errorSQL_get", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            await expect(userDAO.updateUser(user1)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        })

        test("UserNotFound", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, null);
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(null);
                return {} as Database;
            })
            await expect(userDAO.updateUser(user1)).rejects.toThrow(UserNotFoundError);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(0);
        })

        test("errorSQL_run", async () => {
            jest.spyOn(db, "get").mockImplementation((sql, params, callback) => {
                callback(null, users);
                return {} as Database;
            })
            jest.spyOn(db, "run").mockImplementation((sql, params, callback) => {
                callback(new Error(DATABASE_ERROR_MESSAGE));
                return {} as Database;
            })
            await expect(userDAO.updateUser(user1)).rejects.toThrow(DATABASE_ERROR_MESSAGE);
            expect(db.get).toBeCalledTimes(1);
            expect(db.run).toBeCalledTimes(1);
        })

        test("CatchError", async () => {
            const userDAO = new UserDAO();
            jest.spyOn(db, "get").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });
            jest.spyOn(db, "run").mockImplementation(() => {
                throw new Error("Unexpected Error");
            });

            await expect(userDAO.updateUser(user)).rejects.toThrow("Unexpected Error");
        });
    })
})