import env from "dotenv";
env.config();

export async function connectDB(mongoose){
    try{
        console.log("Connecting to MongoDB...");
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch(error){
        console.log(`Error: ${error.message}`);
        process.exit(1); //1 means failure, 0 is success
    }
}