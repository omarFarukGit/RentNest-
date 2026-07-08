import dotenv from "dotenv";
import path from "node:path";
dotenv.config({ path: path.join(process.cwd(), ".env") });
export default {
    // Server
    port: process.env.PORT,
    node_env: process.env.NODE_ENV,
    app_url: process.env.APP_URL,
    client_url: process.env.CLIENT_URL,
    // Database
    database_url: process.env.DATABASE_URL,
    // Bcrypt
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    // JWT
    jwt_access_secret: process.env.JWT_ACCESS_SECRET,
    jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
    jwt_access_expire_in: process.env.JWT_ACCESS_EXPRIRE_IN,
    jwt_refresh_expire_in: process.env.JWT_REFRESH_EXPRIRE_IN,
    // Stripe
    stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
    stripe_secret_key: process.env.STRIPE_SECRET_KEY,
    stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
    // Currency
    stripe_currency: process.env.STRIPE_CURRENCY || "usd",
};
//# sourceMappingURL=index.js.map