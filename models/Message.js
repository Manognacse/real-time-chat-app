const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
{
    username: {
        type: String,
        required: true
    },
    

    room: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    seen: {
        type: Boolean,
        default: false
    },
    reactions: {
        type: Object,
        default: {}
    },
    replyTo: {
    type: String,
    default: null
    },
    privateTo: {
    type: String,
    default: null
    },

    isPrivate: {
    type: Boolean,
    default: false
    }

    
},
{
    timestamps: true
}
);

module.exports = mongoose.model(
    "Message",
    messageSchema
);