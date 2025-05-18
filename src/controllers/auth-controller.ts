import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/user_model";
import { AuthRequest } from "../common/auth-middleware";
import { OAuth2Client } from "google-auth-library";

// Google SignIn
const client = new OAuth2Client();
const googleSignIn = async (req: Request, res: Response) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const email = payload?.email;

        if (email) {
            let user = await userModel.findOne({ email: email });
            if (!user) {
                const salt = await bcrypt.genSalt();
                const hashPassword = await bcrypt.hash(
                    `PlaceHolder${[payload.name]}`,
                    salt
                );
                user = await userModel.create({
                    email: email,
                    password: hashPassword,
                    avatar: payload.picture,
                });
            }
            const tokens = generateTokens(user._id.toString());

            if (!tokens) {
                res.status(400).send({ message: "Missing Configuration" });
                return;
            }

            if (user.refreshTokens == null) {
                user.refreshTokens = [];
            }
            user.refreshTokens.push(tokens.refreshToken);
            await user.save();

            res.status(200).send({
                refreshToken: tokens.refreshToken,
                accessToken: tokens.accessToken,
                _id: user._id,
                firstPartner: user.firstPartner,
                secondPartner: user.secondPartner,
                email: user.email,
                avatar: user.avatar,
            });
        }
    } catch (error) {
        res
            .status(400)
            .send({ message: "Google token verification failed", error });
    }
};

// Generate Token
export const generateTokens = (
    _id: string
): { accessToken: string; refreshToken: string } | null => {
    const random = Math.floor(Math.random() * 1000000);

    if (!process.env.TOKEN_SECRET) {
        return null;
    }

    const accessToken = jwt.sign(
        { _id, randNum: random },
        process.env.TOKEN_SECRET || "default_secret",
        { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES) || "15m" }
    );

    const refreshToken = jwt.sign(
        { _id, randNum: random },
        process.env.TOKEN_SECRET || "default_secret",
        { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES) || "7d" }
    );

    return { accessToken, refreshToken };
};

// Register User
const register = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).send({ message: "Email and password are required." });
        return;
    }

    if (await userModel.findOne({ email })) {
        res.status(400).send({ message: "Email already exists." });
        return;
    }

    if (password.length < 6) {
        res
            .status(400)
            .send({ message: "Password must be at least 6 characters long." });
        return;
    }

    try {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);
        if (!req.body.avatar) {
            req.body.avatar = null;
        }
        const user = await userModel.create({
            firstPartner: req.body.firstPartner,
            secondPartner: req.body.secondPartner,
            email: req.body.email,
            password: hashPassword,
            avatar: req.body.avatar,
        });
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
};

// Login User
const login = async (req: Request, res: Response) => {
    try {
        const user = await userModel.findOne({ email: req.body.email });
        if (!user) {
            res.status(400).send({ message: "Invalid Email or Password" });
            return;
        }

        const validPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );
        if (!validPassword) {
            res.status(400).send({ message: "Invalid Email or Password" });
            return;
        }

        const tokens = generateTokens(user._id.toString());
        if (!tokens) {
            res.status(400).send({ message: "Missing Configuration" });
            return;
        }

        if (user.refreshTokens == null) {
            user.refreshTokens = [];
        }
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        res.status(200).send({
            refreshToken: tokens.refreshToken,
            accessToken: tokens.accessToken,
            _id: user._id,
            firstPartner: user.firstPartner,
            secondPartner: user.secondPartner,
            email: user.email,
            avatar: user.avatar,
        });
    } catch (error) {
        res.status(400).send(error);
    }
};

// Logout User
const logout = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({ message: "Missing Token" });
        return;
    }

    if (!process.env.TOKEN_SECRET) {
        res.status(500).send({ message: "Server Error" });
        return;
    }

    jwt.verify(
        refreshToken,
        process.env.TOKEN_SECRET,
        async (err: unknown, data: unknown) => {
            if (err) {
                res.status(403).send({ message: "Invalid Token" });
                return;
            }

            const payload = data as TokenPayload;
            try {
                const user = await userModel.findOne({ _id: payload._id });
                if (!user) {
                    res.status(400).send({ message: "User Not Found" });
                    return;
                }

                if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                    user.refreshTokens = [];
                    await user.save();
                    res.status(400).send({ message: "Invalid Token" });
                    return;
                }

                user.refreshTokens = user.refreshTokens.filter(
                    (token) => token !== refreshToken
                );
                await user.save();
                res.status(200).send({ message: "Logged Out" });
            } catch (error) {
                res.status(400).send({ message: "Invalid Token" });
            }
        }
    );
};

// Refresh Token
const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.status(400).send({ message: "Missing Token" });
        return;
    }

    if (!process.env.TOKEN_SECRET) {
        res.status(500).send({ message: "Server Error" });
        return;
    }

    jwt.verify(
        refreshToken,
        process.env.TOKEN_SECRET,
        async (err: unknown, data: unknown) => {
            if (err) {
                res.status(403).send({ message: "Token expired or invalid" });
                return;
            }

            const payload = data as TokenPayload;
            try {
                const user = await userModel.findOne({ _id: payload._id });
                if (!user) {
                    res.status(400).send({ message: "User Not Found" });
                    return;
                }

                if (!user.refreshTokens || !user.refreshTokens.includes(refreshToken)) {
                    user.refreshTokens = [];
                    await user.save();
                    res.status(400).send({ message: "Invalid Tokens in User" });
                    return;
                }

                const newTokens = generateTokens(user.id.toString());
                if (!newTokens) {
                    user.refreshTokens = [];
                    await user.save();
                    res.status(400).send({ message: "Missing Configuration" });
                    return;
                }

                user.refreshTokens = user.refreshTokens.filter(
                    (token) => token !== refreshToken
                );
                user.refreshTokens.push(newTokens.refreshToken);
                await user.save();

                res.status(200).send({
                    refreshToken: newTokens.refreshToken,
                    accessToken: newTokens.accessToken,
                    _id: user._id,
                });
            } catch (error) {
                console.error("Error refreshing token:", error);
                res.status(400).send({ message: "Invalid Token" });
            }
        }
    );
};

// Update User
const updateUser = async (req: AuthRequest, res: Response) => {
    const { _id } = req.user as { _id: string };
    const { email, firstPartner, secondPartner, avatar } = req.body;

    try {
        const user = await userModel.findById(_id);
        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        const userEmail = await userModel.findOne({ email: email });
        if (userEmail && userEmail._id.toString() !== _id) {
            res.status(404).send({ message: "Email already taken" });
            return;
        }

        if (firstPartner) user.firstPartner = firstPartner;
        if (secondPartner) user.secondPartner = secondPartner;
        if (avatar) user.avatar = avatar;

        const updatedUser = await user.save();
        console.log("User updated");
        res.status(200).send({
            email: updatedUser.email,
            firstPartner: updatedUser.firstPartner,
            secondPartner: updatedUser.secondPartner,
            avatar: updatedUser.avatar,
        });
    } catch (error) {
        res.status(500).send({ message: "Server error", error });
    }
};

// Update Password
const updatePassword = async (req: AuthRequest, res: Response) => {
    const { _id } = req.user as { _id: string };
    const { newPassword } = req.body;

    try {
        const user = await userModel.findById(_id);
        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashPassword;

        await user.save();
        res.status(200).send({ message: "Password updated successfully" });
    }
    catch (error) {
        res.status(500).send({ message: "Server error", error });
    }
};

// Update Password
const getUserPremiumStatus = async (req: AuthRequest, res: Response) => {
    const { _id } = req.user as { _id: string };

    try {
        const user = await userModel.findById(_id);
        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }
        if (user.is_premium) {
            res.status(200).send({
                message: "User is premium",
                is_premium: true
            });
            return;
        }
        res.status(200).send({
            message: "User is not premium",
            is_premium: false
        });
    }
    catch (error) {
        res.status(500).send({ message: "Server error", error });
    }
};

type TokenPayload = {
    _id: string;
};

// Old auth middleware
const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authorizationHeader = req.header("authorization");
    const accessToken = authorizationHeader && authorizationHeader.split(" ")[1];

    if (!accessToken) {
        res.status(401).send({ message: "Access Denied" });
        return;
    }

    if (!process.env.TOKEN_SECRET) {
        res.status(500).send({ message: "Server Error" });
        return;
    }

    jwt.verify(accessToken, process.env.TOKEN_SECRET, (err, data) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                console.log("Access token expired");
                return res.status(401).send({ message: "Token Expired" });
            }
            console.log("Invalid token:", err.message);
            return res.status(403).send({ message: "Invalid Token" });
        }
        req.params.userId = (data as TokenPayload)._id;
        next();
    });
};

export default {
    register,
    login,
    logout,
    refresh,
    updateUser,
    googleSignIn,
    updatePassword,
    getUserPremiumStatus
};
