import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync.js';

const app = express();
const jwtSecretKey = "dsfdsfsdfdsvcsvdfgefg";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const adapter = new FileSync('./database.json');
const db = low(adapter);

app.get("/", (_req, res) => {
    res.send("Auth API.\nPlease use POST /auth & POST /verify for authentication");
});

app.post("/auth", async (req, res) => {
    const { email, password } = req.body;
    
    const user = db.get("users").value().filter(user => email === user.email);
    
    if (user.length === 1) {
        const result = await bcrypt.compare(password, user[0].password);
        if (!result) {
            return res.status(401).json({ message: "Invalid password" });
        } else {
            const loginData = {
                email,
                signInTime: Date.now(),
            };
            const token = jwt.sign(loginData, jwtSecretKey);
            return res.status(200).json({ message: "success", token });
        }
    } else if (user.length === 0) {
        const hash = await bcrypt.hash(password, 10);
        console.log({ email, password: hash });
        db.get("users").push({ email, password: hash }).write();

        const loginData = {
            email,
            signInTime: Date.now(),
        };
        const token = jwt.sign(loginData, jwtSecretKey);
        return res.status(200).json({ message: "success", token });
    }
});

app.post('/verify', (req, res) => {
    const tokenHeaderKey = "jwt-token";
    const authToken = req.headers[tokenHeaderKey];
    try {
        const verified = jwt.verify(authToken, jwtSecretKey);
        if (verified) {
            return res
                .status(200)
                .json({ status: "logged in", message: "success" });
        } else {
            return res.status(401).json({ status: "invalid auth", message: "error" });
        }
    } catch (error) {
        return res.status(401).json({ status: "invalid auth", message: "error" });
    }
});

app.post('/check-account', (req, res) => {
    const { email } = req.body;

    console.log(req.body);

    const user = db.get("users").value().filter(user => email === user.email);

    console.log(user);
    
    res.status(200).json({
        status: user.length === 1 ? "User exists" : "User does not exist", userExists: user.length === 1
    });
});

app.listen(3080);
