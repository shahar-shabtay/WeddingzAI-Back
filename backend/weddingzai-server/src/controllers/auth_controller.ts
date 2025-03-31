import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/user_model";
import { OAuth2Client } from "google-auth-library";

// Google SignIn
const client = new OAuth2Client();
const googleSignIn = async (req: Request, res: Response) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: req.body.credential,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        const payload = ticket.getPayload();
        const email = payload?.email;
        
        if (email) {
            let user = await userModel.findOne({ 'email': email });
            if (!user) {
                const salt = await bcrypt.genSalt();
                const hashPassword = await bcrypt.hash(`PlaceHolder${[payload.name]}`, salt);
                user = await userModel.create({
                    'email': email,
                    'password': hashPassword,
                    'username': payload.name,
                    'avatar': payload.picture
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
                username: user.username,
                email: user.email,
                avatar: user.avatar,
            });
        }
    } catch (error) {
        res.status(400).send({ message: "Google token verification failed", error });
    }
}

// Generate Token
export const generateTokens = (_id: string): { accessToken: string, refreshToken: string } | null => {
    const random = Math.floor(Math.random() * 1000000);

    if (!process.env.TOKEN_SECRET) {
        return null;
    }

    const accessToken = jwt.sign(
        { _id: _id, randNum: random },
        process.env.TOKEN_SECRET as string,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES }
    );

    const refreshToken = jwt.sign(
        { _id: _id, randNum: random },
        process.env.TOKEN_SECRET as string,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES }
    );

    return { accessToken, refreshToken };
};

// Register User
const register = async (req: Request, res: Response) => {
    const { username, email, password } = req.body;

    if (!email || !password || !username) {
        res.status(400).send({ message: "Email and password are required." });
        return;
    }

    if (await userModel.findOne({ email })) {
        res.status(400).send({ message: "Email already exists." });
        return;
    }

    if (await userModel.findOne({ username })) {
        res.status(400).send({ message: "Username already taken." });
        return;
    }

    if (password.length < 6) {
        res.status(400).send({ message: "Password must be at least 6 characters long." });
        return;
    }

    try {
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);
        if (!req.body.avatar) {
            req.body.avatar = null;
        }
        const user = await userModel.create({
            username: req.body.username,
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
            res.status(400).send({ message: "Invalid Username or Password" });
            return;
        }

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) {
            res.status(400).send({ message: "Invalid Username or Password" });
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
            username: user.username,
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

    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: unknown, data: unknown) => {
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

            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
            await user.save();
            res.status(200).send({ message: "Logged Out" });
        } catch (error) {
            res.status(400).send({ message: "Invalid Token" });
        }
    });
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

    jwt.verify(refreshToken, process.env.TOKEN_SECRET, async (err: unknown, data: unknown) => {
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
                res.status(400).send({ message: "Invalid Token" });
                return;
            }

            const newTokens = generateTokens(user.id.toString());
            if (!newTokens) {
                user.refreshTokens = [];
                await user.save();
                res.status(400).send({ message: "Missing Configuration" });
                return;
            }

            user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
            user.refreshTokens.push(newTokens.refreshToken);
            await user.save();

            res.status(200).send({
                refreshToken: newTokens.refreshToken,
                accessToken: newTokens.accessToken,
                _id: user._id,
            });
        } catch (error) {
            res.status(400).send({ message: "Invalid Token" });
        }
    });
};

// Update User
const updateUser = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { username, avatar } = req.body;

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        const userUsername = await userModel.findOne({ username: username });
        if (userUsername) {
            res.status(401).send({ message: "Username already taken" });
            return;
        }

        if (username) user.username = username;
        if (avatar) user.avatar = avatar;

        const updatedUser = await user.save();
        console.log('User updated');
        res.status(200).send({
            username: updatedUser.username,
            avatar: updatedUser.avatar
        });
    } catch (error) {
        res.status(500).send({ message: "Server error", error });
    }
};

type TokenPayload = {
    _id: string;
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authorizationHeader = req.header("authorization");
    const accessToken = authorizationHeader && authorizationHeader.split(" ")[1];

    if (!accessToken) {
        res.status(401).send({ message: "Access Denied" });;
        return;
    }

    if (!process.env.TOKEN_SECRET) {
        res.status(500).send({ message: "Server Error" });
        return;
    }

    jwt.verify(accessToken, process.env.TOKEN_SECRET, (err, data) => {
        if (err) {
            res.status(401).send({ message: "Access Denied" });
            console.log("Token Expired, Refresh!");
            return;
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
    googleSignIn
};
