import sequelize  from "./config/Sequelize";
import { sanitizeRequest } from "./Middlewares/sanitizeRequest.middleware";
import AuthController  from './controllers/Auth.controller'
import { upload } from "./services/Multer.services";
import { analyzeImageQuestion } from './controllers/userActions/imageScan';
import middleware from "./Middlewares/Auth.middleware";
import {reccommendMeals} from './controllers/userActions/suggestMeals';
import {generateBotCode}  from "./controllers/userActions/generateBotCode";
import {sendChat} from "./controllers/userActions/sendChat";
import {getDetailedMealAnalysis} from './controllers/userActions/getMealDetails';
import {analyzeQrCode} from './controllers/userActions/analyzeQrCode';
import {generateBlogTopics} from './controllers/userActions/getBlogs';
import {generateExtensiveBlogPost} from './controllers/userActions/generateBlog';


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


// Auth Routes
app.post("/api/v1/login", AuthController.login);
app.post("/api/v1/signup", AuthController.signup);
// app.get("/api/v1/refreshToken", middleware.verifyToken, AuthController.refreshToken);
app.post("/api/v1/verifyOTP", AuthController.verifyOTP);
app.post("/api/v1/otp", AuthController.sendOTP);
app.post("/api/v1/forgotPassword", AuthController.sendForgotPasswordEmail);
app.post("/api/v1/resetPassword", AuthController.resetPassword);
app.post("/api/v1/verifyToken", AuthController.verifyToken);
app.post("/api/v1/completeSignup", AuthController.completeSignup);
app.post("/api/v1/imageScan", middleware.verifyToken, upload.single('image'), analyzeImageQuestion);
app.get("/api/v1/recommendMeals", middleware.verifyToken, reccommendMeals);
app.post("/api/v1/generateBotCode", middleware.verifyToken, generateBotCode);
app.post("/api/v1/sendChat", middleware.verifyToken, sendChat);
app.post("/api/v1/getAnalysis", middleware.verifyToken, getDetailedMealAnalysis);
app.post("/api/v1/analyzeQrCode", middleware.verifyToken, analyzeQrCode);
app.get("/api/v1/blog", middleware.verifyToken, generateBlogTopics);
app.post("/api/v1/blog", middleware.verifyToken, generateExtensiveBlogPost);


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