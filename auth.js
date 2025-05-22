const passport = require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;

const GOOGLE_CLIENT_ID = '472854691188-2tpsl7sf44s4004f5bjnv3o638ajogt1.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';

passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
   
      return done(null, profile);
    }
));

passport.serializeUser(function(user, done){
    done(null, user);
});
passport.deserializeUser(function(user, done){
    done(null, user);
});