import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    password: string;
    profession: string;
    fullName?: string;
    phone?: string;
    location?: string;
    bio?: string;
    targetRole?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
    skills?: string[];
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            trim: true,
            minlength: [3, "Minimum 3 characters required"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please fill a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        profession: {
            type: String,
            required: [true, "Profession is required"],
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
            default: "",
        },
        phone: {
            type: String,
            trim: true,
            default: "",
        },
        location: {
            type: String,
            trim: true,
            default: "",
        },
        bio: {
            type: String,
            trim: true,
            default: "",
        },
        targetRole: {
            type: String,
            trim: true,
            default: "",
        },
        linkedinUrl: {
            type: String,
            trim: true,
            default: "",
        },
        githubUrl: {
            type: String,
            trim: true,
            default: "",
        },
        portfolioUrl: {
            type: String,
            trim: true,
            default: "",
        },
        skills: {
            type: [String],
            default: [],
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_, ret) => {
                delete ret.password;
                return ret;
            },
        },
    }
);

const userModel = mongoose.model<IUser>("user", UserSchema);

export default userModel;