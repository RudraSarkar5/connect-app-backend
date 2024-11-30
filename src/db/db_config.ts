import mongoose from "mongoose";
import { env_config } from "../configVariable/envConfig";

const URI = env_config.MONGO_URI!;



const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(URI);
        console.log("database Connection successful");
    } catch (error) {
        console.error("Problem connecting to the database: ", error);
        process.exit(1);
    }
};

export default connectDB;