import type { PassportStatic } from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { prisma } from "@friendinerary/db";

export function configurePassport(passport: PassportStatic) {
  // ─── JWT Strategy ────────────────────────────────────────────────────────
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env["JWT_SECRET"] ?? "fallback-secret",
      },
      async (payload: { sub: string }, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { id: payload.sub } });
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );

  // ─── Google Strategy ─────────────────────────────────────────────────────
  if (process.env["GOOGLE_CLIENT_ID"] && process.env["GOOGLE_CLIENT_SECRET"]) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env["GOOGLE_CLIENT_ID"],
          clientSecret: process.env["GOOGLE_CLIENT_SECRET"],
          callbackURL: `${process.env["API_URL"]}/api/auth/google/callback`,
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error("No email from Google"), false);

            let user = await prisma.user.findFirst({
              where: { OR: [{ googleId: profile.id }, { email }] },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  displayName: profile.displayName,
                  profilePhoto: profile.photos?.[0]?.value ?? null,
                  authProvider: "google",
                  googleId: profile.id,
                  emailVerified: true,
                },
              });
            } else if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: { googleId: profile.id, authProvider: "google" },
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error, false);
          }
        }
      )
    );
  }

  // ─── Facebook Strategy ───────────────────────────────────────────────────
  if (process.env["FACEBOOK_APP_ID"] && process.env["FACEBOOK_APP_SECRET"]) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env["FACEBOOK_APP_ID"],
          clientSecret: process.env["FACEBOOK_APP_SECRET"],
          callbackURL: `${process.env["API_URL"]}/api/auth/facebook/callback`,
          profileFields: ["id", "emails", "name", "picture"],
        },
        async (_accessToken, _refreshToken, profile, done) => {
          try {
            const email = profile.emails?.[0]?.value;
            if (!email) return done(new Error("No email from Facebook"), false);

            let user = await prisma.user.findFirst({
              where: { OR: [{ facebookId: profile.id }, { email }] },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email,
                  displayName: `${profile.name?.givenName ?? ""} ${profile.name?.familyName ?? ""}`.trim(),
                  authProvider: "facebook",
                  facebookId: profile.id,
                  emailVerified: true,
                },
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err as Error, false);
          }
        }
      )
    );
  }
}
