import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type WizardStep = 'category' | 'offerType' | 'workshop' | 'datetime' | 'details' | 'review' | 'confirmed';
export type OfferType = 'private' | 'workshop' | 'package';

export interface BookingDraft {
  category?: 'code' | 'combat';
  offerType?: OfferType;
  // Private session
  serviceId?: string;
  deliveryType?: 'online' | 'in-person' | 'hybrid';
  startTime?: string; // ISO UTC instant of the selected slot
  endTime?: string;
  // Group workshop
  workshopId?: string;
  // Shared client details
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  notes?: string;
  timezone?: string;
  waiverAccepted?: boolean;
}

interface BookingState {
  step: WizardStep;
  draft: BookingDraft;
  isSubmitting: boolean;
  error?: string;
}

const initialState: BookingState = {
  step: 'category',
  draft: {},
  isSubmitting: false,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    updateBookingDraft: (state, action: PayloadAction<Partial<BookingDraft>>) => {
      state.draft = { ...state.draft, ...action.payload };
    },
    setWizardStep: (state, action: PayloadAction<WizardStep>) => {
      state.step = action.payload;
    },
    resetBookingDraft: (state) => {
      state.draft = {};
      state.step = 'category';
      state.error = undefined;
    },
    setBookingSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setBookingError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
  },
});

export const {
  updateBookingDraft,
  setWizardStep,
  resetBookingDraft,
  setBookingSubmitting,
  setBookingError,
} = bookingSlice.actions;
export default bookingSlice.reducer;
