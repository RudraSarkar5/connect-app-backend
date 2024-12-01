import express from "express";
import cors from "cors";
import { env_config } from "./configVariable/envConfig";
import user_route from './route/user';
import errorMiddleware from "./middleware/error";
import connectDB from "./db/db_config";
import http from "http";
import { WebSocketServer } from "ws";
import User from './model/user'; // Adjust the path to your user model

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1/user', user_route);
app.use(errorMiddleware);

const server = http.createServer(app);
const wss = new WebSocketServer({ server });


interface UserType {
    email: string;
    latitude?: number;
    longitude?: number;
    active: boolean;
  }
  
  // Haversine formula to calculate distance between two geographic coordinates
  const getFlatDistance = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const degreesToMeters = 111320; // Approximate meters per degree of latitude/longitude at the equator
    const latDiff = lat2 - lat1;
    const lonDiff = lon2 - lon1;
  
    // Convert latitude to radians to calculate cosine
    const avgLat = (lat1 + lat2) / 2;
    const lonConversion = degreesToMeters * Math.cos(avgLat * Math.PI / 180);
  
    // Calculate the flat distance using the Euclidean formula
    const distance = Math.sqrt(Math.pow(latDiff * degreesToMeters, 2) + Math.pow(lonDiff * lonConversion, 2));
  
    return distance;
  };
  
  
  
  // Function to find active users within a 10-meter radius
  const findNearbyUsers = async (email:string,lat: number, lon: number): Promise<string[]> => {
    try {
      const users: UserType[] = await User.find({ active: true }); // Get all active users
      const nearbyUsers: string[] = []; // List to store emails of nearby users
  
      users.forEach((user: UserType) => {
        if (user.latitude && user.longitude) {
           

            // const distance = haversineDistance(lat1, lon1, lat2, lon2);
              const distance = getFlatDistance(lat, lon, user.latitude, user.longitude);
            
          console.log("distance of them are : ",distance);
          
  
          if (distance <= 5 && user.email != email) { // If the distance is within 10 meters
            nearbyUsers.push(user.email); // Add user's email to the list of nearby users
          }
        }
      });
  
      return nearbyUsers;
    } catch (err) {
      console.error('Error finding nearby users:', err);
      return [];
    }
  };
  

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    const dataString = message.toString(); // Convert the message to a string
     const data = JSON.parse(dataString);

    if (data.type === 'updateLocation') {
        const { email, lat, lng } = data;
        console.log("updated location...");
        console.log(`email: ${email}. latitude: ${lat}. longitude: ${lng}`);
  
        // Step 1: Update the user's location in the database
        await User.updateOne(
          { email },
          { latitude: lat, longitude: lng, active: true }
        );
  
        // Step 2: Find nearby active users within 10 meters
        const nearbyUsers = await findNearbyUsers(email,lat, lng);
  
        // Step 3: Send the list of nearby users back to the client
        const responseMessage = {
          type: 'nearbyUsers',
          users: nearbyUsers // List of nearby user emails
        };
  
        // Send the response back to the client (the one who sent the location update)
        // ws.send(JSON.stringify(responseMessage));
        console.log("the response messages are : ",responseMessage.users);
        
    }
    

    if (data.type === 'close_connection') {
        const { email, lat, lng } = data;
        await User.updateOne({ email }, { latitude: lat, longitude: lng, active: false });
    }
  });

  ws.on('close', async () => {
    console.log('Client disconnected');

    // Handle user disconnection
    // Here we can track the user who disconnected and set their active status to false.
    // Assume we have some way to identify the user who disconnected
    // For example, store user email in the WebSocket object when they connect
    
  });
});

connectDB().then(() => {
  server.listen(env_config.PORT, () => {
    console.log(`Server is running at ${env_config.PORT}`);
  });
});
