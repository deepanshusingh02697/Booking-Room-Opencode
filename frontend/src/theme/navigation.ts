import type { IconType } from 'react-icons';
import {
  LuCalendar,
  LuCalendarCheck,
  LuDoorOpen,
  LuLayoutDashboard,
  LuListOrdered,
  LuProjector,
  LuSearch,
  LuUsers,
} from 'react-icons/lu';

export type NavItem = {
  to: string;
  label: string;
  icon: IconType;
  end?: boolean;
};

export const adminNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
  { to: '/admin/calendar', label: 'Calendar', icon: LuCalendar },
  { to: '/admin/rooms', label: 'Rooms', icon: LuDoorOpen },
  { to: '/equipment', label: 'Equipment', icon: LuProjector },
];

export const employeeNavItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard, end: true },
  { to: '/rooms', label: 'Find Room', icon: LuSearch },
  { to: '/bookings', label: 'Bookings', icon: LuCalendarCheck },
  { to: '/wait-list', label: 'Wait-List', icon: LuListOrdered },
  { to: '/meetings', label: 'Meetings', icon: LuUsers },
];

export const navItemsForRole = (isAdmin: boolean): NavItem[] =>
  isAdmin ? adminNavItems : employeeNavItems;
