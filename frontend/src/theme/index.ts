import { BookingStatus, RoomStatus } from '../types';

export const typeScale = {
  pageTitle: 'text-[30px] font-bold leading-none text-heading',
  panelTitle: 'text-lg font-bold text-heading',
  subCaption: 'text-sm text-muted',
  navLabel: 'text-[15px] font-semibold',
  eyebrow: 'text-xs uppercase tracking-[0.08em] text-faint',
  statLabel: 'text-[15px] text-statLabel',
  buttonLabel: 'text-[15px] font-semibold',
} as const;

export const field = {
  control:
    'h-11 w-full rounded border bg-white px-3 text-base text-ink placeholder:text-hint focus:outline-none focus:ring-2 focus:ring-navy',
  controlOk: 'border-black',
  controlError: 'border-red-500',
  label: 'block text-sm font-medium text-label',
  error: 'mt-1.5 text-xs text-red-600',
} as const;

export const layout = {
  pageBody: 'px-6',
  card: 'rounded border border-black bg-white shadow-sm',
  statRow4: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  statRow3: 'grid grid-cols-1 gap-4 sm:grid-cols-3',
  panelRow: 'grid grid-cols-1 gap-5 lg:grid-cols-2',
  sidebarItem: 'mx-3 flex h-11 items-center gap-2.5 rounded px-2.5',
  sidebarActive: 'bg-navy text-white',
  sidebarInactive: 'text-body hover:bg-tint',
  topNavItem: 'flex h-[35.5px] items-center gap-2.5 whitespace-nowrap rounded px-4',
  topNavActive: 'bg-navySoft text-white',
  topNavInactive: 'text-navyLabel hover:text-white',
  roleBadge:
    'rounded-full border border-roleRule bg-roleBg px-1 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-roleInk',
} as const;

export type StatusMeta = { label: string; glyph: string; className: string };

export const roomStatusMeta: Record<RoomStatus, StatusMeta> = {
  [RoomStatus.AVAILABLE]: {
    label: 'Available',
    glyph: '●',
    className: 'bg-green-100 text-green-800',
  },
  [RoomStatus.MAINTENANCE]: {
    label: 'Maintenance',
    glyph: '⚙',
    className: 'bg-amber-100 text-amber-800',
  },
  [RoomStatus.DISABLED]: {
    label: 'Disabled',
    glyph: '⊘',
    className: 'bg-red-100 text-red-800',
  },
};

export const bookingStatusMeta: Record<BookingStatus, StatusMeta> = {
  [BookingStatus.CONFIRMED]: {
    label: 'Confirmed',
    glyph: '✓',
    className: 'bg-blue-100 text-blue-800',
  },
  [BookingStatus.COMPLETED]: {
    label: 'Completed',
    glyph: '✓',
    className: 'bg-green-100 text-green-800',
  },
  [BookingStatus.CANCELLED]: {
    label: 'Cancelled',
    glyph: '✕',
    className: 'bg-slate-100 text-slate-700',
  },
  [BookingStatus.NO_SHOW]: {
    label: 'No-show',
    glyph: '!',
    className: 'bg-amber-100 text-amber-800',
  },
};

/**
 * The badge a maintenance *window* carries, as opposed to a room's own
 * `MAINTENANCE` status (which means the same thing visually but describes a
 * different fact). Added with the admin calendar, which shows windows inline
 * with bookings and needs to tell them apart at a glance.
 */
export const maintenanceWindowMeta: StatusMeta = {
  label: 'Maintenance',
  glyph: '⚙',
  className: 'bg-amber-100 text-amber-800',
};

export const copy = {
  wordmark: 'Room Meeting Intelligence',
  copyright: '© 2026 Room Meeting Intelligence',
  adminMenuEyebrow: 'Admin Menu',
  adminGreetingSub: "Here's what's happening today.",
  employeeGreetingSub: "Here is what's happening with your meetings today.",
  adminStats: {
    todaysBookings: "Today's Bookings",
    cancelled: 'Cancelled',
    noShow: 'No Show',
    activeRooms: 'Active Rooms',
  },
  employeeStats: {
    todaysMeetings: "Today's Meetings",
    upcomingMeetings: 'Upcoming Meetings',
    roomsAvailable: 'Rooms Available',
  },
  adminPanels: {
    todaysBookings: {
      title: "Today's Bookings",
      sub: 'Meetings scheduled for today',
      empty: 'No bookings for today.',
    },
    roomUsage: {
      title: 'Room Usage',
      sub: "Today's room booking statistics",
      empty: 'No room usage data available.',
    },
  },
  employeePanels: {
    todaysMeetings: {
      title: "Today's Meetings",
      sub: 'Your meetings scheduled for today',
      empty: 'No meetings for today.',
    },
    quickAction: {
      title: 'Quick Action',
      sub: 'Jump straight to booking a room',
    },
    upcomingMeetings: {
      title: 'Upcoming Meetings',
      sub: 'Your upcoming room bookings',
      empty: 'No upcoming meetings.',
    },
  },
  dashboardButtons: {
    findARoom: 'Find a Room',
    viewMyBookings: 'View My Bookings',
    bookARoom: 'Book a Room',
  },
} as const;
