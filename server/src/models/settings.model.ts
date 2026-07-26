// Path: src/models/settings.model.ts
// Purpose: Singleton settings document — app-wide configuration (maintenance mode, etc.)
// Dependencies: mongoose

import mongoose, { Schema, type Model } from 'mongoose';

const SINGLETON_ID = 'app-settings';

export interface ISettingsDocument {
  _id: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ISettingsModel extends Model<ISettingsDocument> {
  getInstance(): Promise<ISettingsDocument>;
}

const settingsSchema = new Schema<ISettingsDocument>(
  {
    _id: {
      type: String,
      default: SINGLETON_ID,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "We're currently performing maintenance. Please check back shortly.",
      maxlength: [500, 'Maintenance message must be at most 500 characters'],
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, unknown>) {
        delete ret['__v'];
        return ret;
      },
    },
  }
);

// ---------------------------------------------------------------------------
// Static: guaranteed singleton retrieval (upserts if missing)
// ---------------------------------------------------------------------------

settingsSchema.statics.getInstance = async function (): Promise<ISettingsDocument> {
  const doc = await this.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc;
};

export const Settings = mongoose.model<ISettingsDocument, ISettingsModel>('Settings', settingsSchema);
