import mongoose from 'mongoose';

const menuSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PgOwner',
      required: [true, 'Owner reference is required']
    },
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
    startDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index to ensure one menu per week per property
menuSchema.index({ property: 1, startDate: 1 }, { unique: true });

const Menu = mongoose.model('Menu', menuSchema);

export default Menu;
