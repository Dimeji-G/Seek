import sequelize  from "./config/Sequelize";
import { sanitizeRequest } from "./Middlewares/sanitizeRequest.middleware";

const express = require("express");
const dotenv = require("dotenv");
const session = require("express-session");
const cors = require("cors");
var bodyParser = require("body-parser");

const app = express();
dotenv.config();

const FRONTEND_URL: any = process.env.FRONTEND_URL;
const PORT = process.env.PORT || 8000;

interface corsInterface {
  origin: string;
  methods: string[];
  allowedHeaders?: string[];
}

const allowedCorsUrls = FRONTEND_URL
    ? FRONTEND_URL.split(',')
    : [];

    console.log(allowedCorsUrls)

const corsOption: corsInterface = {
  origin: allowedCorsUrls,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOption));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV == 'dev' ? 'false' : 'true' },
  })
);

app.use(sanitizeRequest);  // Sanitize request body middleware


console.log("starting server...");


const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("DB connection established");

    await sequelize.sync({ alter: true });
    console.log("Database synced");

    app.listen(PORT, () => {
      console.log(`Server is listening on port: ${PORT}`);
    });
  } catch (error) {
    console.error("Startup error:", error);
  }
};

startServer();