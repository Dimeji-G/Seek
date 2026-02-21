import { DataTypes, Sequelize, Model } from "sequelize";
import sequelize from "../config/Sequelize";    

class userBotVerification extends Model {
    public id!: number;
    public userEmail!: number;
    public code!: boolean;
}

userBotVerification.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userEmail: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING,
            defaultValue: false,
        },
    },
    {
        sequelize: sequelize as Sequelize,
        modelName: "userBotVerification",
        tableName: "user_bot_verification",
        timestamps: true,
    }
);

export default userBotVerification;