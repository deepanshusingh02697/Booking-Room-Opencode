type BookingNotification = {
  recipientId: number;
  bookingId: number;
  title: string;
  roomName: string;
  startTime: Date;
  endTime: Date;
  organizerName: string;
};

export type BookingCreatedNotification = BookingNotification & {
  type: 'BOOKING_CREATED';
};

export type ParticipantAddedNotification = BookingNotification & {
  type: 'PARTICIPANT_ADDED';
};

export type ParticipantRemovedNotification = BookingNotification & {
  type: 'PARTICIPANT_REMOVED';
};

export type BookingCheckedInNotification = BookingNotification & {
  type: 'CHECK_IN';
  checkedInByName: string;
};

export type WaitlistConvertedNotification = BookingNotification & {
  type: 'WAITLIST_CONVERTED';
  waitlistStartTime: Date;
  waitlistEndTime: Date;
};

export type NotificationPayload =
  | BookingCreatedNotification
  | ParticipantAddedNotification
  | ParticipantRemovedNotification
  | BookingCheckedInNotification
  | WaitlistConvertedNotification;
