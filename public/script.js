const socket = io();
let peerConnection;
let localStream;
let currentTargetId;
const remoteAudio = document.createElement("audio");

remoteAudio.autoplay = true;

document.body.appendChild(remoteAudio);

const rtcConfig = {
    
    iceServers: [
        {
            urls: "stun:stun.l.google.com:19302"
        }
    ]
};
async function createPeerConnection(){

    peerConnection =
    new RTCPeerConnection(rtcConfig);

    peerConnection.ontrack = event => {

        remoteAudio.srcObject =
        event.streams[0];

        console.log("REMOTE AUDIO RECEIVED");

    };

    peerConnection.onicecandidate = event => {

        if(event.candidate){

            socket.emit(
                "ice-candidate",
                {
                    targetId: currentTargetId,
                    candidate: event.candidate
                }
            );

        }

    };

}
socket.on("incoming-call", async (data) => {

    console.log("CALL RECEIVED", data);

    const accept = confirm(
        `${data.callerName} is calling you`
    );

    if(!accept){
        return;
    }

    console.log("CALL ACCEPTED");

    try{

        localStream =
        await navigator.mediaDevices.getUserMedia({
            audio:true
        });

        console.log("MICROPHONE OK");
        await createPeerConnection();

localStream.getTracks().forEach(track => {
    peerConnection.addTrack(
        track,
        localStream
    );
});

currentTargetId =
data.callerId;
        alert("Microphone Connected");

    }catch(err){

        console.log("MIC ERROR", err);

        alert("Microphone Failed");
    }

});
socket.on("offer", async data => {

    console.log("OFFER RECEIVED", data);

    if(!peerConnection){

        peerConnection =
        new RTCPeerConnection(rtcConfig);

        peerConnection.onicecandidate = event => {

            if(event.candidate){

                socket.emit(
                    "ice-candidate",
                    {
                        candidate:
                        event.candidate
                    }
                );

            }

        };

        peerConnection.ontrack = event => {

            const remoteAudio =
            new Audio();

            remoteAudio.srcObject =
            event.streams[0];

            remoteAudio.play();

            console.log(
                "REMOTE AUDIO RECEIVED"
            );

        };

    }

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
            data.offer
        )
    );

    const answer =
    await peerConnection.createAnswer();

    await peerConnection.setLocalDescription(
        answer
    );

    socket.emit(
        "answer",
        {
            targetId:
            data.callerId,
            answer
        }
    );

});

socket.on("answer", async data => {

    console.log("ANSWER RECEIVED", data);

    if(
        peerConnection.currentRemoteDescription
    ){
        console.log("Answer already set");
        return;
    }

    await peerConnection.setRemoteDescription(
        new RTCSessionDescription(
            data.answer
        )
    );

});

socket.on("ice-candidate", async data => {
    console.log("ICE RECEIVED", data);

    try{

        await peerConnection.addIceCandidate(
            new RTCIceCandidate(
                data.candidate
            )
        );

    }catch(err){

        console.log(err);

    }

});
const notificationSound = new Audio("/sound.mp3");
let notificationsEnabled =localStorage.getItem("notifications") !== "off";
let username = "";

let unreadCount = 0;
let unreadMessages = {};

let replyingTo = null;
let privateUser = null;

window.isActive = true;

function addMessage(data) {

    const div = document.createElement("div");

    div.classList.add("message");

    div.id = `msg-${data._id}`;

    if (data.username === username) {
        div.classList.add("me");
    } else {
        div.classList.add("other");
    }

    const colors = [
        "#6c63ff",
        "#22c55e",
        "#f97316",
        "#ec4899",
        "#06b6d4",
        "#eab308"
    ];

    const avatarColor =
        colors[data.username.length % colors.length];

    div.innerHTML = `
    <div style="
    display:flex;
    align-items:flex-start;
    gap:12px;
    ">

        <div style="
        width:45px;
        height:45px;
        border-radius:50%;
        background:${avatarColor};
        color:white;
        display:flex;
        justify-content:center;
        align-items:center;
        font-weight:bold;
        font-size:18px;
        flex-shrink:0;
        ">
        ${data.username.charAt(0).toUpperCase()}
        </div>

        <div style="width:100%;">

            <strong>${data.username}</strong>

            <div style="
            margin-top:6px;
            line-height:1.5;
            ">
            ${
            data.replyTo
            ?
            `
            <div class="reply-preview">
            ↩ ${data.replyTo}
            </div>
            `
            :
            ""
            }

                <span class="message-text">
                    ${data.message}
                </span>
            <div class="reaction-bar">

            <button
            class="add-reaction-btn"
            onclick="showReactionMenu('${data._id}',event)">

                <i class="fa-regular fa-face-smile"></i>

            </button>

            </div>

            <div
            id="reaction-${data._id}"
            class="reaction-counts">
            </div>

            <small style="
            opacity:.7;
            display:block;
            margin-top:8px;
            ">
            ${data.time}
            </small>

            ${
                data.username === username
                ?
                `<span
                    class="seen-status"
                    id="seen-${data._id}">
                    ${data.seen ? "✓ Seen" : "✓ Sent"}
                </span>
                <button
                class="reply-btn"
                onclick="replyMessage(
                '${data._id}',
                '${data.message}'
                )">
                ↩ Reply
                </button>
                <button
                class="edit-btn"
                onclick="editMessage(
                '${data._id}',
                '${data.message}'
                )">
                ✏️ Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteMessage('${data._id}')">
                    Delete
                </button>`
                :
                ""
                }

        </div>

    </div>
    `;

    const messages =
        document.getElementById("messages");

    messages.appendChild(div);

    messages.scrollTop =messages.scrollHeight;
}

async function joinRoom() {

    username =
        document.getElementById("username").value;
    

    const room =
        document.getElementById("room").value;

    if (username.trim() === "") {
        alert("Please enter username");
        return;
    }
    

    socket.emit(
        "joinRoom",
        {
            username,
            room
        }
    );

    document.getElementById(
        "currentRoom"
    ).innerText =
        room + " Room";

    document.getElementById(
        "messages"
    ).innerHTML = "";

    document.getElementById(
        "username"
    ).disabled = true;

    document.querySelector(
        ".join-box"
    ).style.display = "none";
}

function sendMessage() {

    const input =
        document.getElementById("message");

    if (input.value.trim() === "")
        return;
    if(
    input.value.startsWith("@ai ")
){

    const question =
    input.value.replace(
        "@ai ",
        ""
    );

    fetch(
        "/ask-ai",
        {
            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({
                question
            })
        }
    )
    .then(res => res.json())
    .then(data => {

    addMessage({
        _id: Date.now(),
        username: username,
        message: "@ai " + question,
        time: new Date().toLocaleTimeString(),
        seen: true
    });

    addMessage({
        _id: Date.now() + 1,
        username: "🤖 Gemini AI",
        message: data.answer,
        time: new Date().toLocaleTimeString(),
        seen: true
    });

});

    input.value = "";

    return;
}
    
    socket.emit(
    "chatMessage",
    {
        username: username,
        
        room: document.getElementById("room").value,
        message: input.value,
        replyTo: replyingTo,
        privateTo: privateUser,
        isPrivate: privateUser !== null

    }
);

    input.value = "";

    replyingTo = null;

    document.getElementById(
        "typing"
    ).innerHTML = "";

    input.focus();
}
function deleteMessage(messageId){

    socket.emit(
        "deleteMessage",
        {
            messageId,
            username
        }
    );

}

document
.getElementById("message")
.addEventListener(
    "keypress",
    function (e) {

        if (e.key === "Enter") {
            sendMessage();
        }

    }
);

document
.getElementById("message")
.addEventListener(
    "input",
    () => {

        if (username !== "") {

            socket.emit(
                "typing",
                username
            );

        }

    }
);

socket.on(
    "chatHistory",
    messages => {

        document.getElementById(
            "messages"
        ).innerHTML = "";

        messages.forEach(msg => {

            addMessage({

                _id: msg._id,

                username: msg.username,

                message: msg.message,

                time: msg.createdAt
                    ? new Date(
                        msg.createdAt
                    ).toLocaleString()
                    : "Unknown",

                seen: msg.seen

            });

        });

    }
);

socket.on(
    "typing",
    user => {

        const typing =
            document.getElementById(
                "typing"
            );

        if (!typing) return;

        typing.innerText =
            `${user} is typing...`;

        clearTimeout(
            window.typingTimeout
        );

        window.typingTimeout =
            setTimeout(() => {

                typing.innerText = "";

            }, 1200);

    }
);

socket.on(
    "chatMessage",
    data => {

        console.log(
            "Browser received:",
            data
        );

        addMessage(data);
        if(
            data.username !== username &&
            data.username &&
            privateUser !== data.username &&
            document.getElementById("currentRoom")
                .innerText !== `💬 Private Chat: ${data.username}`
        ){

            unreadMessages[data.username] =
                (unreadMessages[data.username] || 0) + 1;

            refreshUserList();
        }

        // Play sound only for messages from others
        if (
            data.username !== username &&
            notificationsEnabled
        ) {

            notificationSound.currentTime = 0;

            notificationSound.play()
            .catch(err => {
            console.log(err);
        });

}

        // Mark message as seen
        if(
            data.username !== username &&
            document.hasFocus() &&
            data._id
        ){

            socket.emit(
                "messageSeen",
                data._id
            );

        }

    }
);
socket.on(
    "messageDeleted",
    messageId => {

        const message =
            document.getElementById(
                `msg-${messageId}`
            );

        if(message){

            message.remove();

        }

    }
);

socket.on(
    "systemMessage",
    data => {

        const div =
            document.createElement(
                "div"
            );

        div.className =
            "system";

        div.innerHTML = `
            <i>
                ${data.text}
            </i>
        `;

        document
            .getElementById(
                "messages"
            )
            .appendChild(div);

    }
);
socket.on(
    "messageSeenUpdate",
    messageId => {

        const seen =
            document.getElementById(
                `seen-${messageId}`
            );

        if(seen){

            seen.innerText =
                "✓ Seen";

        }

    }
);
socket.on(
    "reactionUpdated",
    data => {

        const box =
        document.getElementById(
            `reaction-${data.messageId}`
        );

        if(!box) return;

        box.innerHTML = "";

        for(
            let emoji in data.reactions
        ){

            box.innerHTML += `
                <span>
                    ${emoji}
                    ${data.reactions[emoji]}
                </span>
            `;
        }

    }
);
let currentUsers = [];
document
.getElementById("voiceCallBtn")
.addEventListener(
    "click",
    async () => {

        const targetUser =
        prompt(
            "Enter username to call"
        );

        if(!targetUser){
            return;
        }

        currentTargetId = targetUser;

localStream =
await navigator.mediaDevices.getUserMedia({
    audio:true
});

await createPeerConnection();

localStream.getTracks().forEach(track => {
    peerConnection.addTrack(
        track,
        localStream
    );
});
const offer =
await peerConnection.createOffer();

await peerConnection.setLocalDescription(
    offer
);

socket.emit(
    "call-user",
    {
        callerName: username,
        targetId: targetUser
    }
);
console.log("SENDING OFFER");
socket.emit(
    "offer",
    {
        targetId: targetUser,
        offer
    }
);

    }
);

function refreshUserList(){

    const ul =
    document.getElementById(
        "users"
    );

    ul.innerHTML = "";

    currentUsers.forEach(user => {

        const li =
        document.createElement(
            "li"
        );

        li.className =
        "user";
        if(user === privateUser){

            li.classList.add(
                "active-user"
            );

        }

        li.innerHTML = `
        <div class="user-info">

            <span class="online-dot">
                ●
            </span>

            <span class="user-name">
                ${user}
            </span>

        </div>

        ${
        unreadMessages[user]
        ?
        `
        <span class="unread-badge">
            ${unreadMessages[user]}
        </span>
        `
        :
        ""
        }
        `;

        li.onclick = () => {

            if(user === username)
                return;

            privateUser = user;

            unreadMessages[user] = 0;

            refreshUserList();

            document.getElementById(
                "currentRoom"
            ).innerText =
            `💬 Private Chat: ${user}`;
        };

        ul.appendChild(li);

    });

}

socket.on(
    "updateUsers",
    users => {

        currentUsers = users;

        refreshUserList();

    }
);

socket.on(
    "onlineCount",
    count => {

        const onlineCount =
            document.getElementById(
                "onlineCount"
            );

        if (onlineCount) {

            onlineCount.innerText =
                `Online: ${count}`;

        }

    }
);

document
.getElementById("room")
.addEventListener(
    "change",
    () => {

        if (username !== "") {

            joinRoom();

        }

    }
);

function toggleTheme() {

    document.body.classList.toggle(
        "light-mode"
    );

    localStorage.setItem(
        "theme",
        document.body.classList.contains(
            "light-mode"
        )
            ? "light"
            : "dark"
    );
}

/* =========================
    EMOJI PICKER
========================= */

const picker =
document.getElementById("picker");

const emojiBtn =
document.getElementById("emojiBtn");

const messageInput =
document.getElementById("message");

if (picker && emojiBtn) {

    picker.style.display = "none";

    emojiBtn.addEventListener(
        "click",
        (e) => {

            e.stopPropagation();

            picker.style.display =
                picker.style.display === "block"
                ? "none"
                : "block";

        }
    );

    picker.addEventListener(
        "emoji-click",
        event => {

            messageInput.value +=
                event.detail.unicode;

            messageInput.focus();

        }
    );

    document.addEventListener(
        "click",
        (e) => {

            if (
                !picker.contains(e.target) &&
                e.target !== emojiBtn
            ) {

                picker.style.display =
                    "none";

            }

        }
    );

}

/* =========================
    SEARCH MESSAGES
========================= */

const searchBox =
document.getElementById("searchBox");

if(searchBox){

    searchBox.addEventListener(
        "keyup",
        () => {

            const value =
                searchBox.value.toLowerCase();

            const messages =
                document.querySelectorAll(
                    ".message"
                );

            messages.forEach(msg => {

                const text =
                    msg.innerText.toLowerCase();

                if(text.includes(value)){

                    msg.style.display =
                        "block";

                } else {

                    msg.style.display =
                        "none";

                }

            });

        }
    );

}
window.addEventListener(
    "blur",
    () => {

        window.isActive = false;

    }
);

window.addEventListener(
    "focus",
    () => {

        window.isActive = true;

        unreadCount = 0;

        document.title =
            "Pro Chat";

        document
            .querySelectorAll(".message.other")
            .forEach(msg => {

                const id =
                    msg.id.replace(
                        "msg-",
                        ""
                    );

                if(
                    id &&
                    id !== "undefined"
                ){
                    socket.emit(
                        "messageSeen",
                        id
                    );
                }

            });

    }
);
document
.getElementById("fileInput")
.addEventListener(
    "change",
    async function(){

        const file = this.files[0];

        if(!file) return;

        const formData =
            new FormData();

        formData.append(
            "file",
            file
        );

        try{

            const response =
                await fetch(
                    "/upload",
                    {
                        method:"POST",
                        body:formData
                    }
                );

            const data =
                await response.json();

            let messageContent;

if (file.type.startsWith("image/")) {

    messageContent = `<img src="${data.fileUrl}" style="max-width:300px;border-radius:10px;">`;

}
else if (
    file.type.startsWith("video/")
) {

    messageContent = `
        <video
            controls
            style="
                max-width:250px;
                border-radius:10px;
                margin-top:10px;
            "
        >
            <source
                src="${data.fileUrl}"
                type="${file.type}"
            >
        </video>
    `;

}
else {

    messageContent = `
        <a
            href="${data.fileUrl}"
            target="_blank"
        >
            📎 ${file.name}
        </a>
    `;

}

            socket.emit(
                "chatMessage",
                {
                    username,
                    room: document.getElementById("room").value,
                    message: messageContent,
                    replyTo: replyingTo,
                    privateTo:privateUser,
                    isPrivate:privateUser !== null
                }
            );

        }catch(err){

            console.log(
                "Upload Error:",
                err
            );

        }

    }
);
window.addEventListener(
    "load",
    () => {

        const theme =
            localStorage.getItem("theme");

        if (theme === "light") {

            document.body.classList.add(
                "light-mode"
            );

        }

        const btn =
        document.getElementById(
            "muteBtn"
        );

        if(btn){

            if(!notificationsEnabled){

                btn.innerHTML =
                '<i class="fa-solid fa-bell-slash"></i> Muted';

                btn.classList.add("off");

            }

        }

    }
);
function toggleMute() {

    notificationsEnabled =
        !notificationsEnabled;

    localStorage.setItem(
        "notifications",
        notificationsEnabled
            ? "on"
            : "off"
    );

    document.getElementById(
        "muteBtn"
    ).innerText =
        notificationsEnabled
        ? "🔔 Notifications ON"
        : "🔕 Notifications OFF";

}
function react(messageId, emoji){

    socket.emit(
        "addReaction",
        {
            messageId,
            emoji
        }
    );

}
let currentReactionMessage = null;
function showReactionMenu(messageId,event){

    currentReactionMessage =
    messageId;

    const menu =
    document.getElementById(
        "reactionMenu"
    );

    menu.style.display = "flex";

    const rect =
    event.target.getBoundingClientRect();

    menu.style.left =
        (rect.left - 70) + "px";

    menu.style.top =
        (rect.top - 65) + "px";
}

function selectReaction(emoji){

    react(
        currentReactionMessage,
        emoji
    );

    document.getElementById(
        "reactionMenu"
    ).style.display =
    "none";
}
function replyMessage(
    messageId,
    messageText
){

    replyingTo = messageText;

    document.getElementById(
        "typing"
    ).innerHTML =
    `
    Replying to:
    ${messageText}
    `;
}
function editMessage(
    messageId,
    oldMessage
){

    const newMessage =
    prompt(
        "Edit Message",
        oldMessage
    );

    if(
        !newMessage ||
        newMessage.trim() === ""
    ){
        return;
    }

    socket.emit(
        "editMessage",
        {
            messageId,
            newMessage
        }
    );
}
socket.on(
    "messageEdited",
    data => {

        const msg =
        document.getElementById(
            `msg-${data.messageId}`
        );

        if(!msg) return;

        const text =
        msg.querySelector(
            ".message-text"
        );

        if(text){

            text.innerHTML =
            data.message +
            ' <small>(edited)</small>';

        }

    }
);
async function registerUser(){

    const username =
    document.getElementById(
        "loginUsername"
    ).value;

    const password =
    document.getElementById(
        "loginPassword"
    ).value;

    const response =
    await fetch(
        "/register",
        {
            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({
                username,
                password
            })
        }
    );

    const data =
    await response.json();

    alert(data.message);
}

async function loginUser(){

    const username =
    document.getElementById(
        "loginUsername"
    ).value;

    const password =
    document.getElementById(
        "loginPassword"
    ).value;

    const response =
    await fetch(
        "/login",
        {
            method:"POST",

            headers:{
                "Content-Type":
                "application/json"
            },

            body:JSON.stringify({
                username,
                password
            })
        }
    );

    const data =
    await response.json();

    if(data.token){

        localStorage.setItem(
            "token",
            data.token
        );

        localStorage.setItem(
            "username",
            data.username
        );

        document.getElementById(
            "authBox"
        ).style.display =
        "none";

        document.getElementById(
            "username"
        ).value =
        data.username;

    }else{

        alert(
            data.message
        );

    }

}

window.addEventListener(
    "load",
    () => {

        const token =
        localStorage.getItem(
            "token"
        );

        const savedUser =
        localStorage.getItem(
            "username"
        );

        if(token && savedUser){

            document.getElementById(
                "authBox"
            ).style.display =
            "none";

            document.getElementById(
                "username"
            ).value =
            savedUser;

        }

    }
);
function logout(){

    localStorage.removeItem(
        "token"
    );

    localStorage.removeItem(
        "username"
    );

    location.reload();

}
