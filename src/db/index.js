import 'dotenv/config'
import mongoose from "mongoose";

import { DB_NAME } from "../constant.js";


const connectDB = async () => {
    console.log(process.env.MONGODB_URI);
    
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, 
        );

        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MONGODB connection FAILED", error);
        process.exit(1);
    }
};

export default connectDB;


