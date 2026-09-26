/**
 * Phase 13 verification client.
 *
 * Exercises the real-time notification transport end to end with a bare
 * Socket.io client (no UI): it logs four employees in over GraphQL, opens one
 * socket per employee, drives every notification-producing mutation, and asserts
 * that exactly the right socket received exactly the right event. Also asserts
 * that a handshake without a valid session cookie is rejected.
 *
 * Run with the server already listening:
 *   npm run socket:verify -w backend
 *
 * Every row it creates is deleted again in the `finally` block, and the table
 * counts are printed before/after so the baseline can be checked by hand.
 */
import 'reflect-metadata';
import { io, Socket } from 'socket.io-client';
import { AppDataSource } from '../src/config/data-source';
import { env } from '../src/config/env';
import {
  NOTIFICATION_EVENTS,
  NotificationEventName,
  NotificationEventPayload,
} from '../src/realtime/events';

const SERVER_URL = process.env.VERIFY_SERVER_URL ?? `http://localhost:${env.PORT}`;
const GRAPHQL_URL = `${SERVER_URL}/graphql`;
const CONNECT_TIMEOUT_MS = 5_000;
const EVENT_TIMEOUT_MS = 8_000;
const DUPLICATE_GRACE_MS = 600;
const TITLE_PREFIX = 'Phase13 socket verify';

const EMPLOYEES = {
  priya: { email: 'priya@mri.com', password: 'Employee@123' },
  aarav: { email: 'aarav@mri.com', password: 'Employee@123' },
  sara: { email: 'sara@mri.com', password: 'Employee@123' },
  rohan: { email: 'rohan@mri.com', password: 'Employee@123' },
} as const;

type Person = keyof typeof EMPLOYEES;
type Session = { token: string; userId: number; name: string };
type Received = { event: NotificationEventName; payload: NotificationEventPayload };

const results: { label: string; ok: boolean; detail: string }[] = [];

const check = (label: string, ok: boolean, detail = ''): void => {
  results.push({ label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const iso = (date: Date): string => date.toISOString();
const sameInstant = (value: string | undefined, expected: Date): boolean =>
  value !== undefined && new Date(value).getTime() === expected.getTime();

// ---------------------------------------------------------------- GraphQL ---

type GqlResponse = { data?: Record<string, any>; errors?: { message: string }[] };

const graphql = async (
  session: Session | null,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<Record<string, any>> => {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(session ? { cookie: `token=${session.token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as GqlResponse;
  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join(' | '));
  }
  return body.data ?? {};
};

const logIn = async (person: Person): Promise<Session> => {
  const { email, password } = EMPLOYEES[person];
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      query: `mutation LogIn($input: LogInInput!) {
        logIn(input: $input) { id firstName lastName email }
      }`,
      variables: { input: { email, password } },
    }),
  });
  const body = (await response.json()) as GqlResponse;
  if (body.errors?.length) {
    throw new Error(
      `logIn failed for ${email}: ${body.errors.map((e) => e.message).join(' | ')}`,
    );
  }
  const cookie = response
    .headers.getSetCookie()
    .find((value) => value.startsWith('token='));
  if (!cookie) {
    throw new Error(`logIn returned no session cookie for ${email}`);
  }
  const user = (body.data as any).logIn;
  return {
    token: decodeURIComponent(cookie.split(';')[0].replace('token=', '')),
    userId: user.id,
    name: `${user.firstName} ${user.lastName}`,
  };
};

// ----------------------------------------------------------------- socket ---

const connect = (token: string | null): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      ...(token ? { extraHeaders: { cookie: `token=${token}` } } : {}),
      reconnection: false,
      timeout: CONNECT_TIMEOUT_MS,
    });

    const settle = (action: () => void) => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      action();
    };
    const onConnect = () => settle(() => resolve(socket));
    const onError = (error: Error) =>
      settle(() => {
        socket.close();
        reject(new Error(error.message));
      });
    const timer = setTimeout(
      () =>
        settle(() => {
          socket.close();
          reject(new Error('handshake timed out'));
        }),
      CONNECT_TIMEOUT_MS,
    );

    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
  });

const listen = (label: string, socket: Socket, inbox: Received[]): void => {
  (Object.values(NOTIFICATION_EVENTS) as NotificationEventName[]).forEach((event) => {
    socket.on(event, (payload: NotificationEventPayload) => {
      inbox.push({ event, payload });
      console.log(
        `      <- ${label} ${event} recipient=${payload.recipientId} booking=${payload.bookingId} "${payload.title}"`,
      );
    });
  });

  socket.on('disconnect', (reason: string) => {
    console.log(`      !! ${label} socket disconnected: ${reason}`);
  });
};

const waitForEvent = async (
  inbox: Received[],
  event: NotificationEventName,
  predicate: (payload: NotificationEventPayload) => boolean = () => true,
): Promise<NotificationEventPayload> => {
  const deadline = Date.now() + EVENT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const match = inbox.find((item) => item.event === event && predicate(item.payload));
    if (match) {
      return match.payload;
    }
    await sleep(100);
  }
  throw new Error(`no ${event} event received within ${EVENT_TIMEOUT_MS}ms`);
};

const expectInboxSize = (inbox: Received[], size: number, label: string): void => {
  const events = inbox.map((item) => item.event).join(', ') || 'none';
  check(
    label,
    inbox.length === size,
    `${inbox.length} event(s) on this socket [${events}]`,
  );
};

const expectRejection = async (label: string, token: string | null): Promise<void> => {
  try {
    const socket = await connect(token);
    socket.close();
    check(label, false, 'connection succeeded');
  } catch (error) {
    const message = (error as Error).message;
    check(label, message === 'Unauthorized', `error="${message}"`);
  }
};

// ------------------------------------------------------------------- main ---

const tableCounts = async (): Promise<Record<string, number>> => {
  const rows = (await AppDataSource.query(
    `SELECT
       (SELECT COUNT(*) FROM bookings)         AS bookings,
       (SELECT COUNT(*) FROM participants)     AS participants,
       (SELECT COUNT(*) FROM check_ins)        AS check_ins,
       (SELECT COUNT(*) FROM waitlist_entries) AS waitlist_entries`,
  )) as Record<string, string>[];
  return Object.fromEntries(
    Object.entries(rows[0]).map(([key, value]) => [key, Number(value)]),
  );
};

const main = async () => {
  console.log(`Server: ${SERVER_URL}`);

  await AppDataSource.initialize();

  const createdBookingIds: number[] = [];
  const createdWaitlistEntryIds: number[] = [];
  const sockets: Socket[] = [];
  const inboxes = new Map<Person, Received[]>();
  const sessions = {} as Record<Person, Session>;

  const baseline = await tableCounts();
  console.log(`Baseline: ${JSON.stringify(baseline)}`);

  const inbox = (person: Person): Received[] => inboxes.get(person)!;
  const resetInboxes = (): void =>
    inboxes.forEach((entries) => {
      entries.length = 0;
    });

  try {
    const health = await fetch(`${SERVER_URL}/health`);
    check('server is up (/health 200)', health.status === 200, `status ${health.status}`);

    for (const person of Object.keys(EMPLOYEES) as Person[]) {
      sessions[person] = await logIn(person);
    }
    check(
      'four employees logged in over GraphQL',
      true,
      Object.values(sessions)
        .map((session) => `${session.userId}:${session.name}`)
        .join(', '),
    );

    await expectRejection('handshake without a session cookie is rejected', null);
    await expectRejection('handshake with an invalid token is rejected', 'not-a-real-token');

    for (const person of Object.keys(EMPLOYEES) as Person[]) {
      const socket = await connect(sessions[person].token);
      sockets.push(socket);
      const received: Received[] = [];
      inboxes.set(person, received);
      listen(`${person}(${sessions[person].userId})`, socket, received);
    }
    check('four authenticated sockets connected', sockets.length === 4, `on ${SERVER_URL}`);

    const freeRoom = async (
      startTime: Date,
      endTime: Date,
      minCapacity: number,
    ): Promise<{ id: number; name: string }> => {
      const data = await graphql(
        sessions.priya,
        `query FreeRooms($input: RoomFilterInput!) {
          rooms(filter: $input) { id name capacity }
        }`,
        {
          input: {
            status: 'AVAILABLE',
            minCapacity,
            startTime: iso(startTime),
            endTime: iso(endTime),
          },
        },
      );
      const room = (data.rooms as { id: number; name: string }[])[0];
      if (!room) {
        throw new Error(`no AVAILABLE room free for ${iso(startTime)} - ${iso(endTime)}`);
      }
      return room;
    };

    const createBooking = async (
      roomId: number,
      title: string,
      startTime: Date,
      endTime: Date,
      participantIds: number[],
    ): Promise<number> => {
      const data = await graphql(
        sessions.priya,
        `mutation CreateBooking($input: CreateBookingInput!) {
          createBooking(input: $input) { id }
        }`,
        {
          input: {
            roomId,
            title,
            startTime: iso(startTime),
            endTime: iso(endTime),
            participantIds,
          },
        },
      );
      const id = (data.createBooking as { id: number }).id;
      createdBookingIds.push(id);
      return id;
    };

    // --- 1. BOOKING_CREATED -------------------------------------------
    const bookingAStart = new Date(Date.now() + 3 * 60 * 60 * 1000);
    const bookingAEnd = new Date(bookingAStart.getTime() + 60 * 60 * 1000);
    const roomA = await freeRoom(bookingAStart, bookingAEnd, 2);

    resetInboxes();
    const bookingA = await createBooking(
      roomA.id,
      `${TITLE_PREFIX} participant flow`,
      bookingAStart,
      bookingAEnd,
      [sessions.aarav.userId],
    );

    const created = await waitForEvent(
      inbox('aarav'),
      NOTIFICATION_EVENTS.BOOKING_CREATED,
      (payload) => payload.bookingId === bookingA,
    );
    check(
      'BOOKING_CREATED reaches the participant socket with the full payload',
      created.recipientId === sessions.aarav.userId &&
        created.title === `${TITLE_PREFIX} participant flow` &&
        created.roomName === roomA.name &&
        created.organizerName === sessions.priya.name &&
        sameInstant(created.startTime, bookingAStart) &&
        sameInstant(created.endTime, bookingAEnd),
      `recipient=${created.recipientId} room=${created.roomName} start=${created.startTime}`,
    );

    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('aarav'), 1, 'BOOKING_CREATED is emitted exactly once');
    expectInboxSize(inbox('priya'), 0, 'BOOKING_CREATED is not sent to the organizer');
    expectInboxSize(inbox('sara'), 0, 'BOOKING_CREATED is not broadcast to non-participants');
    expectInboxSize(inbox('rohan'), 0, 'BOOKING_CREATED is not broadcast to other employees');

    // --- 2. PARTICIPANT_ADDED -----------------------------------------
    resetInboxes();
    const bookingWithSara = (
      await graphql(
        sessions.priya,
        `mutation AddParticipants($input: AddParticipantsInput!) {
          addParticipants(input: $input) { id }
        }`,
        { input: { bookingId: bookingA, employeeIds: [sessions.sara.userId] } },
      )
    ).addParticipants as { id: number };

    const participantAdded = await waitForEvent(
      inbox('sara'),
      NOTIFICATION_EVENTS.PARTICIPANT_ADDED,
      (payload) => payload.bookingId === bookingWithSara.id,
    );
    check(
      'PARTICIPANT_ADDED reaches the added employee socket',
      participantAdded.recipientId === sessions.sara.userId &&
        participantAdded.organizerName === sessions.priya.name &&
        participantAdded.roomName === roomA.name,
      `recipient=${participantAdded.recipientId} booking=${participantAdded.bookingId}`,
    );
    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('aarav'), 0, 'PARTICIPANT_ADDED is not sent to existing participants');
    expectInboxSize(inbox('priya'), 0, 'PARTICIPANT_ADDED is not sent to the organizer');

    // --- 3. PARTICIPANT_REMOVED ---------------------------------------
    resetInboxes();
    await graphql(
      sessions.priya,
      `mutation RemoveParticipant($input: RemoveParticipantInput!) {
        removeParticipant(input: $input) { id }
      }`,
      { input: { bookingId: bookingA, employeeId: sessions.sara.userId } },
    );

    const participantRemoved = await waitForEvent(
      inbox('sara'),
      NOTIFICATION_EVENTS.PARTICIPANT_REMOVED,
      (payload) => payload.bookingId === bookingA,
    );
    check(
      'PARTICIPANT_REMOVED reaches the removed employee socket',
      participantRemoved.recipientId === sessions.sara.userId &&
        participantRemoved.organizerName === sessions.priya.name,
      `recipient=${participantRemoved.recipientId}`,
    );
    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('priya'), 0, 'PARTICIPANT_REMOVED is not sent to the organizer');

    // --- 4. CHECK_IN ---------------------------------------------------
    const checkInStart = new Date(Date.now() + 90 * 1000);
    const checkInEnd = new Date(checkInStart.getTime() + 30 * 60 * 1000);
    const roomB = await freeRoom(checkInStart, checkInEnd, 2);

    resetInboxes();
    const bookingB = await createBooking(
      roomB.id,
      `${TITLE_PREFIX} check-in flow`,
      checkInStart,
      checkInEnd,
      [sessions.rohan.userId],
    );

    await waitForEvent(
      inbox('rohan'),
      NOTIFICATION_EVENTS.BOOKING_CREATED,
      (payload) => payload.bookingId === bookingB,
    );
    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('rohan'), 1, 'BOOKING_CREATED fires once per recipient, not once per booking');

    const waitMs = checkInStart.getTime() - Date.now() + 1_000;
    console.log(
      `      waiting ${Math.ceil(waitMs / 1000)}s for the check-in window of booking ${bookingB} to open...`,
    );
    await sleep(waitMs);

    resetInboxes();
    await graphql(
      sessions.rohan,
      `mutation CheckIn($id: Int!) { checkIn(id: $id) { id hasCheckedIn } }`,
      { id: bookingB },
    );

    const checkIn = await waitForEvent(
      inbox('priya'),
      NOTIFICATION_EVENTS.CHECK_IN,
      (payload) => payload.bookingId === bookingB,
    );
    check(
      'CHECK_IN reaches the organizer socket with checkedInByName',
      checkIn.recipientId === sessions.priya.userId &&
        checkIn.checkedInByName === sessions.rohan.name,
      `recipient=${checkIn.recipientId} checkedInBy=${checkIn.checkedInByName}`,
    );
    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('rohan'), 0, 'CHECK_IN is not sent back to the checking employee');
    expectInboxSize(inbox('sara'), 0, 'CHECK_IN is not broadcast to other employees');

    // --- 5. WAITLIST_CONVERTED ----------------------------------------
    const waitlistStart = new Date(Date.now() + 5 * 60 * 60 * 1000);
    const waitlistEnd = new Date(waitlistStart.getTime() + 60 * 60 * 1000);
    const roomC = await freeRoom(waitlistStart, waitlistEnd, 1);

    resetInboxes();
    const blocker = await createBooking(
      roomC.id,
      `${TITLE_PREFIX} waitlist blocker`,
      waitlistStart,
      waitlistEnd,
      [],
    );

    const entry = (
      await graphql(
        sessions.rohan,
        `mutation JoinWaitlist($input: JoinWaitlistInput!) {
          joinWaitlist(input: $input) { id startTime endTime }
        }`,
        {
          input: {
            roomId: roomC.id,
            startTime: iso(waitlistStart),
            endTime: iso(waitlistEnd),
          },
        },
      )
    ).joinWaitlist as { id: number };
    createdWaitlistEntryIds.push(entry.id);

    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('rohan'), 0, 'joining a waitlist emits no notification');

    await graphql(
      sessions.priya,
      `mutation Cancel($id: Int!) { cancelBooking(id: $id) { id status } }`,
      { id: blocker },
    );

    const converted = await waitForEvent(
      inbox('rohan'),
      NOTIFICATION_EVENTS.WAITLIST_CONVERTED,
    );
    check(
      'WAITLIST_CONVERTED reaches the waiter socket after a cancellation',
      converted.recipientId === sessions.rohan.userId &&
        converted.roomName === roomC.name &&
        sameInstant(converted.startTime, waitlistStart) &&
        sameInstant(converted.endTime, waitlistEnd) &&
        sameInstant(converted.waitlistStartTime, waitlistStart) &&
        sameInstant(converted.waitlistEndTime, waitlistEnd),
      `recipient=${converted.recipientId} booking=${converted.bookingId} waitlist=${converted.waitlistStartTime}`,
    );
    createdBookingIds.push(converted.bookingId);

    const convertedBooking = (
      await graphql(
        sessions.rohan,
        `query BookingDetails($id: Int!) {
          bookingDetails(id: $id) { id organizerId status room { id } }
        }`,
        { id: converted.bookingId },
      )
    ).bookingDetails as { organizerId: number; status: string };
    check(
      'the converted booking really exists, is CONFIRMED and owned by the waiter',
      convertedBooking.organizerId === sessions.rohan.userId &&
        convertedBooking.status === 'CONFIRMED',
      `organizer=${convertedBooking.organizerId} status=${convertedBooking.status}`,
    );

    await sleep(DUPLICATE_GRACE_MS);
    expectInboxSize(inbox('priya'), 0, 'WAITLIST_CONVERTED is not sent to the cancelling organizer');
    expectInboxSize(inbox('aarav'), 0, 'WAITLIST_CONVERTED is not broadcast to unrelated employees');
    expectInboxSize(inbox('sara'), 0, 'WAITLIST_CONVERTED is not broadcast to unrelated employees');

    sockets[0].disconnect();
    await sleep(200);
    check('a socket can disconnect cleanly', sockets[0].connected === false);
  } catch (error) {
    check('unexpected failure', false, (error as Error).message);
  } finally {
    sockets.forEach((socket) => socket.close());

    for (const id of createdBookingIds) {
      await AppDataSource.query(`DELETE FROM bookings WHERE id = $1`, [id]);
    }
    for (const id of createdWaitlistEntryIds) {
      await AppDataSource.query(`DELETE FROM waitlist_entries WHERE id = $1`, [id]);
    }

    const after = await tableCounts();
    console.log(`After cleanup: ${JSON.stringify(after)}`);
    const restored = Object.keys(baseline).every((table) => baseline[table] === after[table]);
    check(
      'every row created by this script was removed',
      restored,
      restored
        ? 'counts match the baseline'
        : `baseline ${JSON.stringify(baseline)} vs after ${JSON.stringify(after)}`,
    );

    await AppDataSource.destroy();
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
};

main().catch(async (error) => {
  console.error('Verification script crashed', error);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
