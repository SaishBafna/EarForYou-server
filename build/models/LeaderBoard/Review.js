import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Service provider
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // User giving the rating
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Rating (1-5 stars)
  review: {
    type: String
  },
  // Optional text review
  comments: [{
    text: {
      type: String,
      required: true
    },
    // Comment text
    commenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    } // User who made the comment
  }]
}, {
  timestamps: true
});
reviewSchema.index({
  user: 1
});
reviewSchema.index({
  reviewer: 1
});
export default mongoose.model("Review", reviewSchema);