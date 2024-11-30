import dotenv from "dotenv";

dotenv.config();

export const env_config = {
    PORT : process.env.PORT,
    MONGO_URI : process.env.MONGO_URI
}