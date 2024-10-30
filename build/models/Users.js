import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
  avatar: {
    type: {
      url: {
        type: String,
        default: "https://cdn-icons-png.flaticon.com/512/660/660611.png" // Default avatar URL
      },
      localPath: String,
      _id: false
    }
  },
  username: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    // Use Date type for date of birth
    required: false
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    // Enum for gender values
    required: false
  },
  userCategory: {
    type: String,
    enum: ["Motivational", "Therapist", "Listener", "Psychologist"]
  },
  userType: {
    type: String,
    enum: ['CALLER', 'RECEIVER'],
    // Define the enum values
    default: 'CALLER' // Set default value
  },
  password: {
    type: String,
    required: false
  },
  deviceToken: {
    type: String
  },
  isValidUser: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  refreshToken: {
    type: String
  }
}, {
  timestamps: true
});

// Create a compound index for the phone field
userSchema.index({
  phone: 1
}, {
  unique: true
});

// Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  // Check if the password is already hashed
  if (!this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate access token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
    _id: this._id,
    username: this.username,
    userType: this.userType // Added userType instead of serviceType
  }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
};

// Method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
    _id: this._id
  }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  });
};

// Exporting the User model
const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;