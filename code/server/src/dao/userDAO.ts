import db from "../db/db"
import { User, Role } from "../components/user"
import crypto from "crypto"
import { UserAlreadyExistsError, UserIsAdminError, UserNotFoundError } from "../errors/userError";

/**
 * A class that implements the interaction with the database for all user-related operations.
 * You are free to implement any method you need here, as long as the requirements are satisfied.
 */
class UserDAO {

    /**
     * Checks whether the information provided during login (username and password) is correct.
     * @param username The username of the user.
     * @param plainPassword The password of the user (in plain text).
     * @returns A Promise that resolves to true if the user is authenticated, false otherwise.
     */
    getIsUserAuthenticated(username: string, plainPassword: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "SELECT username, password, salt FROM users WHERE username = ?";
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    if (!row || row.username !== username || !row.salt) {
                        resolve(false);
                        return;
                    }

                    const hashedPassword = crypto.scryptSync(plainPassword, row.salt, 16);
                    const passwordHex = Buffer.from(row.password, "hex");

                    // Ensures the buffers have the same length
                    if (hashedPassword.length !== passwordHex.length) {
                        resolve(false);
                        return;
                    }

                    if (!crypto.timingSafeEqual(passwordHex, hashedPassword)) {
                        resolve(false);
                    } else {
                        resolve(true);
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    };

    /**
     * Creates a new user and saves their information in the database
     * @param username The username of the user. It must be unique.
     * @param name The name of the user
     * @param surname The surname of the user
     * @param password The password of the user. It must be encrypted using a secure algorithm (e.g. scrypt, bcrypt, argon2)
     * @param role The role of the user. It must be one of the three allowed types ("Manager", "Customer", "Admin")
     * @returns A Promise that resolves to true if the user has been created.
     */
    createUser(username: string, name: string, surname: string, password: string, role: string): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const salt = crypto.randomBytes(16)
                const hashedPassword = crypto.scryptSync(password, salt, 16)
                const sql = "INSERT INTO users(username, name, surname, role, password, salt) VALUES(?, ?, ?, ?, ?, ?)"
                db.run(sql, [username, name, surname, role, hashedPassword, salt], (err: Error | null) => {
                    if (err) {
                        if (err.message.includes("UNIQUE constraint failed: users.username")) return reject(new UserAlreadyExistsError)
                        return reject(err)
                    }
                    resolve(true)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns a user object from the database based on the username.
     * @param username The username of the user to retrieve
     * @returns A Promise that resolves the information of the requested user
     */
    getUserByUsername(username: string): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError())
                        return
                    }
                    const user: User = new User(row.username, row.name, row.surname, row.role, row.address, row.birthdate)
                    resolve(user)
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Returns a list of user object of all the users.
     * @returns A Promise that resolves the information of all the users
     */
    getUsers(): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users"
                db.all(sql, (err: Error | null, rows: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    const users: User[] = rows.map((user: any) => new User(user.username, user.name, user.surname, user.role, user.address, user.birthdate));
                    resolve(users);
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Returns a list of user object of all the users having a specific role.
     * @param role The role of the users to retrieve
     * @returns A Promise that resolves the information of the requested users
     */
    getUsersByRole(role: String): Promise<User[]> {
        return new Promise<User[]>((resolve, reject) => {
            try {
                const sql = "SELECT * FROM users WHERE role = ?"
                db.all(sql, [role], (err: Error | null, rows: any) => {
                    if (err) {
                        return reject(err)
                    }
                    const users: User[] = rows.map((user: any) => new User(user.username, user.name, user.surname, user.role, user.address, user.birthdate));
                    resolve(users);
                })
            } catch (error) {
                reject(error)
            }

        })
    }

    /**
     * Delete from the database a specific user given her username. Specific DAO function for the admins who can delete only non-admin users.
     * @param username The username of the user to delete
     * @returns A Promise that resolves to true if the user has been deleted
     */
    deleteUserAdmin(username: String): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM users WHERE username = ?"
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        return reject(err)
                    }
                    if (!row) {
                        return reject(new UserNotFoundError());
                    } else if (row.role === Role["ADMIN"]) {
                        return reject(new UserIsAdminError());
                    }
                    sql = "DELETE FROM users WHERE username = ?"
                    db.run(sql, [username], (err: Error | null) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(true);
                        }
                    });
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Delete from the database a specific user given her username.
     * @param username The username of the user to delete
     * @returns A Promise that resolves to true if the user has been deleted
     */
    deleteUser(username: String): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM users WHERE username = ?";
                db.get(sql, [username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err)
                        return
                    }
                    if (!row) {
                        reject(new UserNotFoundError());
                        return;
                    }
                    sql = "DELETE FROM users WHERE username = ?";
                    db.run(sql, [username], (err: Error | null) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(true);
                        }
                    });
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Delete all non-Admin users from the database.
     * @returns A Promise that resolves to true if all non-Admin users have been deleted
     */
    deleteAllUsers(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            try {
                const sql = "DELETE FROM users WHERE role <> ?";
                db.run(sql, [Role["ADMIN"]], (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(true);
                    }
                });
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
    * Update the information of a user saved in the database. Admin version. An Admin can update the infromation of all non-Admin users.
    * @param user The user containing the new infromation
    * @returns A Promise that resolves to the updated user
    */
    updateUserAdmin(user: User): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM users WHERE username = ?";
                db.get(sql, [user.username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new UserNotFoundError());
                        return;
                    }
                    else if (row.role === Role["ADMIN"]) {
                        reject(new UserIsAdminError());
                        return;
                    }
                    sql = "UPDATE users SET name = ?, surname = ?, address = ?, birthdate = ? WHERE username = ?"
                    db.run(sql, [user.name, user.surname, user.address, user.birthdate, user.username], (err: Error | null) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(user);
                        }
                    });
                })
            } catch (error) {
                reject(error)
            }
        })
    }

    /**
     * Update the information of a user saved in the database. DAO function for non-Admin users.
     * @param user The user containing the new infromation
     * @returns A Promise that resolves to the updated user
     */
    updateUser(user: User): Promise<User> {
        return new Promise<User>((resolve, reject) => {
            try {
                let sql = "SELECT * FROM users WHERE username = ?";
                db.get(sql, [user.username], (err: Error | null, row: any) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    if (!row) {
                        reject(new UserNotFoundError());
                        return;
                    }
                    sql = "UPDATE users SET name = ?, surname = ?, address = ?, birthdate = ? WHERE username = ?"
                    db.run(sql, [user.name, user.surname, user.address, user.birthdate, user.username], (err: Error | null) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(user);
                        }
                    });
                })


            } catch (error) {
                reject(error)
            }
        })
    }
}

export default UserDAO
