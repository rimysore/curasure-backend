const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
require('dotenv').config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5002/api/auth/google/callback'
    },
    (accessToken, refreshToken, profile, done) => {
      const user = {
        email: profile.emails[0].value,
        name: profile.displayName,
        googleAccessToken: accessToken
      };

      // Generate JWT token
      user.token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

module.exports = passport;
