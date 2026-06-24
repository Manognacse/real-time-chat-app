console.log("=== SERVER FILE LOADED ===");
process.on("uncaughtException", err => {
    console.error("UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", err => {
    console.error("UNHANDLED REJECTION:", err);
});
require("dotenv").config();
const PORT = process.env.PORT || 3000;
const fs = require("fs");

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Message = require("./models/Message");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const auth = require("./middleware/auth");
//const { GoogleGenAI } = require("@google/genai");
const multer = require("multer");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "chat-app-uploads",
        resource_type: "auto"
    }
});

const upload = multer({
    storage
});

const app = express();
app.use(express.static("public"));

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use((req, res, next) => {
    console.log("REQUEST RECEIVED:", req.method, req.url);
    next();
});
app.get("/", (req, res) => {
    console.log("ROOT ROUTE HIT");
    res.status(200).send("SERVER IS ALIVE");
});
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});
try {
    if (!fs.existsSync("uploads")) {
        fs.mkdirSync("uploads");
    }
} catch (err) {
    console.log("UPLOAD FOLDER ERROR:", err);
}
const server = http.createServer(app);
const io = new Server(server);
//const genAI = new GoogleGenAI({
 //   apiKey: process.env.GEMINI_API_KEY
//});
//console.log("API KEY:", process.env.GEMINI_API_KEY);
//console.log(
  //  "Gemini Key Loaded:",
    //process.env.GEMINI_API_KEY
      //  ? "YES"
        //: "NO"
//);
console.log("Starting app...");
console.log("PORT =", process.env.PORT);
console.log("MONGO_URI exists =", !!process.env.MONGO_URI);
console.log("OPENROUTER_API_KEY exists =", !!process.env.OPENROUTER_API_KEY);
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
})
.then(() => {
    console.log("✅ MongoDB Connected");
})
.catch(err => {
    console.log("MongoDB Error:");
    console.log(err);
});


// REGISTER

app.post(
    "/register",
    async (req,res) => {

        try{

            const {
                username,
                password
            } = req.body;

            const existingUser =
            await User.findOne({
                username
            });

            if(existingUser){

                return res.status(400).json({
                    message:
                    "Username already exists"
                });

            }

            const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

            const newUser =
            new User({

                username,

                password:
                hashedPassword

            });

            await newUser.save();

            res.json({
                message:
                "Registration successful"
            });

        }catch(err){

            console.log(err);

            res.status(500).json({
                message:
                "Server Error"
            });

        }

    }
);
// LOGIN

app.post(
    "/login",
    async (req,res) => {

        try{

            const {
                username,
                password
            } = req.body;

            const user =
            await User.findOne({
                username
            });

            if(!user){

                return res.status(400).json({
                    message:
                    "Invalid Username"
                });

            }

            const match =
            await bcrypt.compare(
                password,
                user.password
            );

            if(!match){

                return res.status(400).json({
                    message:
                    "Invalid Password"
                });

            }

            const token =
            jwt.sign(
                {
                    username:
                    user.username
                },
                process.env.JWT_SECRET,
                {
                    expiresIn:"1d"
                }
            );

            res.json({

                token,

                username:
                user.username

            });

        }catch(err){

            console.log(err);

            res.status(500).json({
                message:
                "Server Error"
            });

        }

    }
);
app.get(
    "/profile",
    auth,
    (req, res) => {

        res.json({
            message: "JWT Working",
            user: req.user
        });

    }
);
app.post("/ask-ai", async (req, res) => {
    try {
        const { question } = req.body;

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "openai/gpt-oss-20b:free",
                messages: [
                    {
                        role: "user",
                        content: question
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const answer =
            response.data.choices[0].message.content;

        res.json({ answer });

    } catch (err) {

        console.log("OpenRouter Error:");

        if (err.response) {
            console.log(err.response.data);
        } else {
            console.log(err.message);
        }

        res.status(500).json({
            answer: "AI Assistant unavailable"
        });
    }
});
app.post(
    "/upload",
    upload.single("file"),
    (req, res) => {

        if (!req.file) {
            return res.status(400).json({
                error: "No file uploaded"
            });
        }

        res.json({
            fileUrl: req.file.path
        });

    }
);
let users = [];

function updateRoomUsers(room) {

    const roomUsers = users
        .filter(user => user.room === room)
        .map(user => user.username);

    io.to(room).emit(
        "updateUsers",
        roomUsers
    );

    io.to(room).emit(
        "onlineCount",
        roomUsers.length
    );
}

io.on("connection", socket => {
    socket.on(
    "addReaction",
    async ({ messageId, emoji }) => {

        try {

            const message =
            await Message.findById(messageId);

            if(!message) return;

            const reactions =
            message.reactions || {};

            reactions[emoji] =
                (reactions[emoji] || 0) + 1;

            message.reactions =
            reactions;

            await message.save();

            io.to(socket.room).emit(
                "reactionUpdated",
                {
                    messageId,
                    reactions
                }
            );

        } catch(err){

            console.log(err);

        }

    }
);
// ======================
// WEBRTC SIGNALING
// ======================

socket.on("call-user", data => {

    const targetUser = users.find(
        u => u.username === data.targetId
    );

    if(!targetUser){
        return;
    }

    io.to(targetUser.id).emit(
        "incoming-call",
        {
            callerId: socket.id,
            callerName: data.callerName
        }
    );

});

socket.on("offer", data => {

    io.to(data.targetId).emit(
        "offer",
        {
            offer: data.offer,
            callerId: socket.id
        }
    );

});

socket.on("answer", data => {

    io.to(data.targetId).emit(
        "answer",
        {
            answer: data.answer
        }
    );

});

socket.on("ice-candidate", data => {

    io.to(data.targetId).emit(
        "ice-candidate",
        {
            candidate: data.candidate
        }
    );

});

    socket.on(
        "joinRoom",
        async ({ username, room }) => {

            try {

                if (socket.room) {
                    socket.leave(socket.room);
                    updateRoomUsers(socket.room);
                }

                socket.username = username;
                socket.room = room;

                socket.join(room);

                users = users.filter(
                    user => user.id !== socket.id
                );

                users.push({
                    id: socket.id,
                    username,
                    room
                });

                const messages = await Message
                    .find({
                        room,
                        isPrivate: false
                    })
                    .sort({ createdAt: 1 });

                socket.emit(
                    "chatHistory",
                    messages
                );

                updateRoomUsers(room);

                io.to(room).emit(
                    "systemMessage",
                    {
                        text: `${username} joined ${room}`
                    }
                );

            } catch (err) {

                console.log(
                    "Join Room Error:",
                    err
                );

            }

        }
    );

    socket.on(
        "typing",
        username => {

            socket.broadcast
                .to(socket.room)
                .emit(
                    "typing",
                    username
                );

        }
    );

    socket.on(
        "chatMessage",
        async data => {
            console.log("Received:", data);
            console.log("Message length:", data.message.length);

            try {
                if (data.message.startsWith("@ai")) {

    io.to(data.room).emit(
        "chatMessage",
        {
            username: data.username,
            message: data.message,
            time: new Date().toLocaleString(),
            seen: false
        }
    );

    try {

        const response = await axios.post(
            `http://127.0.0.1:${PORT}/ask-ai`,
            {
                question: data.message.replace("@ai", "").trim()
            }
);

        const aiMsg = new Message({
            username: "Gemini AI",
            room: data.room,
            message: response.data.answer,
            seen: false
        });

const savedAiMsg = await aiMsg.save();

io.to(data.room).emit("chatMessage", {
    _id: savedAiMsg._id,
    username: savedAiMsg.username,
    message: savedAiMsg.message,
    time: new Date().toLocaleString(),
    seen: false
});

    } catch (err) {

        const userMsg = new Message({
    username: data.username,
    room: data.room,
    message: data.message,
    seen: false
});

const savedUserMsg = await userMsg.save();

io.to(data.room).emit("chatMessage", {
    _id: savedUserMsg._id,
    username: savedUserMsg.username,
    message: savedUserMsg.message,
    time: new Date().toLocaleString(),
    seen: false
});

    }

    return;
}

                const newMessage =
                new Message({

                    username:
                    data.username,
                    

                    room:
                    data.room||socket.room,

                    message:
                    data.message,

                    replyTo:
                    data.replyTo || null,

                    privateTo:
                    data.privateTo || null,

                    isPrivate:
                    data.isPrivate || false,


                    seen:false

                });

                const savedMessage =
                await newMessage.save();
                console.log("Saved:", savedMessage);
                console.log("Sending message to clients");
                console.log("Emitting to room:", data.room);
                if(data.isPrivate){

    const targetUser =
    users.find(
        u =>
        u.username ===
        data.privateTo
    );

    if(targetUser){

        io.to(
            targetUser.id
        ).emit(
            "chatMessage",
            {
                _id:
                savedMessage._id,

                username:
                savedMessage.username,

                message:
                savedMessage.message,

                replyTo:
                savedMessage.replyTo,

                time:
                new Date()
                .toLocaleString(),

                seen:false
            }
        );

        socket.emit(
            "chatMessage",
            {
                _id:
                savedMessage._id,

                username:
                savedMessage.username,

                message:
                savedMessage.message,

                replyTo:
                savedMessage.replyTo,

                time:
                new Date()
                .toLocaleString(),

                seen:false
            }
        );

    }

}else{

    io.to(data.room).emit(
        "chatMessage",
        {
            _id:
            savedMessage._id,

            username:
            savedMessage.username,

            message:
            savedMessage.message,

            replyTo:
            savedMessage.replyTo,

            time:
            new Date()
            .toLocaleString(),

            seen:false
        }
    );

}

            } catch (err) {

                console.log(
                    "Message Save Error:",
                    err
                );

            }

        }
    );

    // Seen Status

    socket.on(
    "messageSeen",
    async messageId => {

        try {

            if(!messageId){
                return;
            }

            await Message.findByIdAndUpdate(
                messageId,
                {
                    seen:true
                }
            );

            io.to(socket.room).emit(
                "messageSeenUpdate",
                messageId
            );

        } catch(err){

            console.log(err);

        }

    }
);

    // Delete Message
    socket.on(
    "editMessage",
    async ({
        messageId,
        newMessage
    }) => {

        if(!messageId){
            return;
        }

        try{

            const updated =
            await Message.findByIdAndUpdate(
                messageId,
                {
                    message:newMessage
                },
                {
                    new:true
                }
            );

            io.to(socket.room).emit(
                "messageEdited",
                {
                    messageId,
                    message:newMessage
                }
            );

        }catch(err){

            console.log(err);

        }

    }
);
    
    socket.on(
        "deleteMessage",
        async ({
            messageId,
            username
        }) => {

            try {
                if(!messageId){
                    return;
                }
                const message =
                await Message.findById(
                    messageId
                );

                if(
                    message &&
                    message.username === username
                ){

                    await Message.findByIdAndDelete(
                        messageId
                    );

                    io.to(socket.room).emit(
                        "messageDeleted",
                        messageId
                    );

                }

            } catch(err){

                console.log(err);

            }

        }
    );

    socket.on(
        "disconnect",
        () => {

            const room =
                socket.room;

            users = users.filter(
                user =>
                user.id !== socket.id
            );

            if(room){

                updateRoomUsers(
                    room
                );

            }

            if(socket.username){

                io.to(room).emit(
                    "systemMessage",
                    {
                        text:
                        `${socket.username} left the chat`
                    }
                );

            }

        }
    );

});

console.log("Starting app...");
console.log("PORT =", PORT);
console.log("MONGO_URI exists =", !!process.env.MONGO_URI);
console.log("OPENROUTER_API_KEY exists =", !!process.env.OPENROUTER_API_KEY);
app.use((err, req, res, next) => {
    console.error("EXPRESS ERROR:", err);
    res.status(500).send("Server Error");
});
server.listen(PORT, "0.0.0.0", () => {
    console.log("SERVER STARTED");
    console.log(`Server running on port ${PORT}`);
});