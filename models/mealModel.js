import mongoose from 'mongoose';

const mealSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PgOwner',
      required: [true, 'Owner reference is required']
    },
    name: {
      type: String,
      required: [true, 'Meal name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'All Meals'],
      default: 'All Meals'
    },
    menuType: {
      type: String,
      enum: ['Vegetarian', 'Non-Vegetarian', 'Both', 'Vegan', 'Jain'],
      default: 'Both'
    },
    cuisineType: {
      type: String,
      enum: ['North Indian', 'South Indian', 'Continental', 'Chinese', 'Mixed', 'Other'],
      default: 'Mixed'
    },
    isBuffet: {
      type: Boolean,
      default: false
    },
    maxServings: {
      type: Number,
      min: [1, 'Max servings must be at least 1']
    },
    currentSubscribers: {
      type: Number,
      default: 0,
      min: [0, 'Subscribers cannot be negative']
    },
    features: [{
      type: String,
      trim: true
    }],
    weeklyMenu: {
      monday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      },
      tuesday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      },
      wednesday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      },
      thursday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      },
      friday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      },
      saturday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      },
      sunday: {
        breakfast: [String],
        lunch: [String],
        dinner: [String]
      }
    },
    specialDietOptions: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    images: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
mealSchema.index({ property: 1 });
mealSchema.index({ owner: 1 });
mealSchema.index({ planType: 1 });
mealSchema.index({ menuType: 1 });
mealSchema.index({ isActive: 1 });

// Virtual for availability
mealSchema.virtual('isAvailable').get(function() {
  if (!this.maxServings) return true;
  return this.currentSubscribers < this.maxServings;
});

// Virtual for occupancy percentage
mealSchema.virtual('subscriptionPercentage').get(function() {
  if (!this.maxServings || this.maxServings === 0) return 0;
  return ((this.currentSubscribers / this.maxServings) * 100).toFixed(2);
});

const Meal = mongoose.model('Meal', mealSchema);

export default Meal;
