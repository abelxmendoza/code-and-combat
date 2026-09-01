import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminState {
  calendarView: 'month' | 'week' | 'agenda';
  selectedDateRange?: {
    start: string;
    end: string;
  };
  filterStatus?: string[];
  filterServiceType?: 'code' | 'combat' | undefined;
  filterDelivery?: 'online' | 'in-person' | 'hybrid' | undefined;
  sidebarOpen: boolean;
}

const initialState: AdminState = {
  calendarView: 'month',
  sidebarOpen: true,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setCalendarView: (
      state,
      action: PayloadAction<'month' | 'week' | 'agenda'>,
    ) => {
      state.calendarView = action.payload;
    },
    setSelectedDateRange: (
      state,
      action: PayloadAction<{ start: string; end: string } | undefined>,
    ) => {
      state.selectedDateRange = action.payload;
    },
    setFilterStatus: (state, action: PayloadAction<string[] | undefined>) => {
      state.filterStatus = action.payload;
    },
    setFilterServiceType: (
      state,
      action: PayloadAction<'code' | 'combat' | undefined>,
    ) => {
      state.filterServiceType = action.payload;
    },
    setFilterDelivery: (
      state,
      action: PayloadAction<'online' | 'in-person' | 'hybrid' | undefined>,
    ) => {
      state.filterDelivery = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
  },
});

export const {
  setCalendarView,
  setSelectedDateRange,
  setFilterStatus,
  setFilterServiceType,
  setFilterDelivery,
  toggleSidebar,
} = adminSlice.actions;
export default adminSlice.reducer;
