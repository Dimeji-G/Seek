import { DataTypes, Model, Sequelize } from "sequelize";
import sequelize from "../config/Sequelize";

class User extends Model {
  public id!: number;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public phone_number!: string;
  public password!: string;
  public oauth!: string | null;
  public oauth_method!: string | null;
  public dateOfBirth!: string | null;
  public gender!: string | null;
  public height!: number | null;
  public weight!: number | null;
  public skinType!: string | null;
  public nationality!: string | null;
  public dietType!: string | null;
  public allergies!: string[];
  public userGoals!: string[];
  public account_completed!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    oauth: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    oauth_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    height: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    weight: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    skinType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nationality: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dietType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    allergies: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    userGoals: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    account_completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize: sequelize as Sequelize,
    tableName: "users",
    timestamps: true,
  }
);

export default User;