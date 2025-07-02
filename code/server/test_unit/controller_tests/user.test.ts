import { test, expect, jest, beforeAll, afterEach, describe } from "@jest/globals";
import UserController from "../../src/controllers/userController";
import UserDAO from "../../src/dao/userDAO";
import { Role, User } from "../../src/components/user";
import { UnauthorizedUserError } from "../../src/errors/userError";
import { DateError } from "../../src/utilities";

jest.mock("../../src/dao/userDAO");

// Example of a unit test for the createUser method of the UserController
describe("UserController", () => {
    let controller: UserController;
    let testUser: any;
    let users: User[];
    let users_customer: User[];

    beforeAll(() => {
        controller = new UserController();
        testUser = {
            username: "username",
            name: "test",
            surname: "test",
            password: "test",
            role: "Customer"
        };
        users = [
            {
                username: "user1",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "test",
                birthdate: "test"
            },
            {
                username: "user2",
                name: "test",
                surname: "test",
                role: Role.MANAGER,
                address: "test",
                birthdate: "test"
            },
            {
                username: "user3",
                name: "test",
                surname: "test",
                role: Role.ADMIN,
                address: "test",
                birthdate: "test"
            }
        ];

        users_customer = [
            {
                username: "user1",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "test",
                birthdate: "test"
            },
            {
                username: "user4",
                name: "test",
                surname: "test",
                role: Role.CUSTOMER,
                address: "test",
                birthdate: "test"
            }
        ];
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("createUser", () => {
        test("should return true when DAO method returns true", async () => {
            jest.spyOn(UserDAO.prototype, "createUser").mockResolvedValueOnce(true);

            const response = await controller.createUser(testUser.username, testUser.name, testUser.surname, testUser.password, testUser.role);

            expect(UserDAO.prototype.createUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.createUser).toHaveBeenCalledWith(
                testUser.username,
                testUser.name,
                testUser.surname,
                testUser.password,
                testUser.role
            );
            expect(response).toBe(true);
        });
    });

    describe("getUsers", () => {
        test("should return an array of users", async () => {
            jest.spyOn(UserDAO.prototype, "getUsers").mockResolvedValueOnce(users);

            const response = await controller.getUsers();

            expect(UserDAO.prototype.getUsers).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsers).toHaveBeenCalledWith();
            expect(response).toBe(users);
        });
    });

    describe("getUsersByRole", () => {
        test("should return an array of users with the specified role", async () => {
            jest.spyOn(UserDAO.prototype, "getUsersByRole").mockResolvedValueOnce(users_customer);

            const response = await controller.getUsersByRole("Customer");

            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUsersByRole).toHaveBeenCalledWith("Customer");
            expect(response).toBe(users_customer);
        });
    });

    describe("getUserByUsername", () => {
        test("should return a user with the specified username, by the User himself", async () => {
            const user: User = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user);

            const response = await controller.getUserByUsername(user, user.username);

            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith("test");
            expect(response).toBe(user);
        });

        test("should return a user with the specified username, by an Admin", async () => {
            const user_admin: User = new User("user1", "test", "test", Role.ADMIN, "test", "test");
            const user_customer: User = new User("user2", "test", "test", Role.CUSTOMER, "test", "test");
            
            jest.spyOn(UserDAO.prototype, "getUserByUsername").mockResolvedValueOnce(user_customer);

            const response = await controller.getUserByUsername(user_admin, user_customer.username);
            
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledWith(user_customer.username);
            expect(response).toBe(user_customer);
            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(1);
        })

        test("should return UnauthorizedUserError", async () => {
            const testCustomer: User = new User("test_customer", "test", "test", Role.CUSTOMER, "test", "test");
            const testAdmin: User = new User("test_admin", "test", "test", Role.ADMIN, "test", "test");

            await expect(controller.getUserByUsername(testCustomer, testAdmin.username)).rejects.toThrow(UnauthorizedUserError);

            expect(UserDAO.prototype.getUserByUsername).toHaveBeenCalledTimes(0);
        });
    });

    describe("deleteUser", () => {
        test("should return true when deleting a non-admin user", async () => {
            const testCustomer: User = new User("test", "test", "test", Role.CUSTOMER, "test", "test");

            jest.spyOn(UserDAO.prototype, "deleteUser").mockResolvedValueOnce(true);

            const response = await controller.deleteUser(testCustomer, testCustomer.username);

            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledWith("test");
            expect(response).toBe(true);
        });

        test("should return true when deleting a non-admin user", async () => {
            const testCustomer: User = new User("test_customer", "test", "test", Role.CUSTOMER, "test", "test");
            const testAdmin: User = new User("test_admin", "test", "test", Role.ADMIN, "test", "test");

            jest.spyOn(UserDAO.prototype, "deleteUserAdmin").mockResolvedValueOnce(true);

            const response = await controller.deleteUser(testAdmin, testCustomer.username);

            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledWith("test_customer");
            expect(response).toBe(true);
        });

        test("should return UnauthorizedUserError", async () => {
            const testCustomer: User = new User("test_customer", "test", "test", Role.CUSTOMER, "test", "test");
            const testAdmin: User = new User("test_admin", "test", "test", Role.ADMIN, "test", "test");

            await expect(controller.deleteUser(testCustomer, testAdmin.username)).rejects.toThrow(UnauthorizedUserError);

            expect(UserDAO.prototype.deleteUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.deleteUser).toHaveBeenCalledTimes(0);
        });
    });

    describe("deleteAll", () => {
        test("should return true if all users are deleted", async () => {
            
            jest.spyOn(UserDAO.prototype, "deleteAllUsers").mockResolvedValueOnce(true);

            const response = await controller.deleteAll();

            expect(UserDAO.prototype.deleteAllUsers).toHaveBeenCalledTimes(1);
            expect(response).toBe(true);
        })
    });

    describe("updateUserInfo", () => {
        test("should return a user with the updated info", async () => {
            const userToUpdate = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(userToUpdate);

            const response = await controller.updateUserInfo(testUser, "name", "surname", "address", "birthdate", "username");

            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUser).toHaveBeenCalledWith(userToUpdate);
            expect(response).toBe(userToUpdate);
        })

        test("should return a user with the updated info performed by an admin", async () => {
            const testAdmin: User = new User("test_admin", "test", "test", Role.ADMIN, "test", "test");
            const userToUpdate = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");

            jest.spyOn(UserDAO.prototype, "updateUserAdmin").mockResolvedValueOnce(userToUpdate);

            const response = await controller.updateUserInfo(testAdmin, "name", "surname", "address", "birthdate", "username");

            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(1);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledWith(userToUpdate);
            expect(response).toBe(userToUpdate);
        });

        test("should return a DateError", async () => {
            const userToUpdate = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            jest.spyOn(UserDAO.prototype, "updateUser").mockResolvedValueOnce(userToUpdate);

            await expect(controller.updateUserInfo(testUser, "name", "surname", "address", "2025/01/01", "username")).rejects.toThrow(DateError);

            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
        });

        test("should return an UnauthorizedUserError", async () => {
            const testAdmin: User = new User("test_admin", "test", "test", Role.ADMIN, "test", "test");
            const user = new User("username", "name", "surname", Role.CUSTOMER, "address", "birthdate");
            jest.spyOn(UserDAO.prototype, "updateUserAdmin").mockResolvedValueOnce(testAdmin);

            await expect(controller.updateUserInfo(user, "name", "surname", "address", "birthdate", "test_admin")).rejects.toThrow(UnauthorizedUserError);

            expect(UserDAO.prototype.updateUser).toHaveBeenCalledTimes(0);
            expect(UserDAO.prototype.updateUserAdmin).toHaveBeenCalledTimes(0);
        })
    })
});


