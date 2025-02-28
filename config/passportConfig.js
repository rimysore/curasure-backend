const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');  // Add this line

// File path for the users JSON file
const USERS_FILE = path.join(__dirname, '../data/users.json');

// Helper function to read users from the file
const readUsersFromFile = () => {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
};

// Helper function to write users to the file
const writeUsersToFile = (users) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,  // Your Google Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  // Your Google Client Secret
      callbackURL: 'http://localhost:5002/auth/google/callback',  // Adjust if deployed
    },
    (accessToken, refreshToken, profile, done) => {
      // Handle user authentication and store in the JSON file
      let users = readUsersFromFile();
      
      // Check if the user already exists by googleId
      const existingUser = users.find(user => user.googleId === profile.id);
      if (existingUser) {
        return done(null, existingUser);  // User exists, log them in
      } else {
        // Create a new user in the database (users.json)
        const newUser = {
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          role: 'user',  // Set default role or adjust as needed
          googleAccessToken: accessToken,  // Store the Google access token if needed
        };

        // Add the new user to the users array
        users.push(newUser);
        writeUsersToFile(users);  // Write updated users array to file

        // Log the user in after saving to the file
        return done(null, newUser);
      }
    }
  )
);

// Serialize user into the session
passport.serializeUser((user, done) => {
  done(null, user.googleId);  // Store the googleId to track the session
});

// Deserialize user from the session
passport.deserializeUser((googleId, done) => {
  let users = readUsersFromFile();
  const user = users.find(u => u.googleId === googleId);
  done(null, user);  // Pass the user object to the session
});

// Add a custom JWT authentication strategy to verify users with a JWT token
passport.use('jwt', new JwtStrategy(
  {
    secretOrKey: process.env.JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  },
  (jwtPayload, done) => {
    const users = readUsersFromFile();
    const user = users.find(u => u.email === jwtPayload.email); // Verify if the user exists by email

    if (!user) {
      return done(null, false, { message: 'User not found' });
    }
    return done(null, user);  // User found, proceed with the JWT authentication
  }
));
