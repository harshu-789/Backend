import 'dotenv/config'
import mongoose from "mongoose";

import { DB_NAME } from "../constant.js";
// import dotenv from "dotenv"
// dotenv.config()

const connectDB = async () => {
    console.log(process.env.MONGODB_URI);
    
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection FAILED", error);
        process.exit(1);
    }
};

export default connectDB;


