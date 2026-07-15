import { getAccessToken } from './firebase';

export async function addCalendarEvent(title: string, date: Date, type: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  const start = new Date(date);
  const end = new Date(date);
  end.setHours(end.getHours() + 1);

  // Color code by type (just an example mapping)
  const colorId = type === 'bill' ? '11' : type === 'income' ? '10' : '8';

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      colorId,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 24 * 60 }
        ]
      }
    })
  });
  if (!res.ok) throw new Error('Failed to create calendar event');
  return await res.json();
}

export async function markCalendarEventPaid(eventId: string, title: string) {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');
  
  // We'll update the event summary to start with [PAID] and change color to green (colorId: '10' is green)
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: `[PAID] ${title.replace(/^\[PAID\]\s*/i, '')}`,
      colorId: '10'
    })
  });
  
  if (!res.ok) throw new Error('Failed to update calendar event');
  return await res.json();
}

export async function fetchRecentEmails() {
  const token = await getAccessToken();
  if (!token) throw new Error('No access token');

  // Query for recent emails that might be bills/receipts
  const q = 'newer_than:30d (bill OR receipt OR invoice OR subscription OR payment)';
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) throw new Error('Failed to fetch emails');
  const data = await res.json();
  
  if (!data.messages) return [];

  const emails = await Promise.all(
    data.messages.map(async (msg: any) => {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const msgData = await msgRes.json();
      
      const subjectHeader = msgData.payload.headers.find((h: any) => h.name.toLowerCase() === 'subject');
      const fromHeader = msgData.payload.headers.find((h: any) => h.name.toLowerCase() === 'from');
      const dateHeader = msgData.payload.headers.find((h: any) => h.name.toLowerCase() === 'date');
      
      let snippet = msgData.snippet;
      
      return {
        id: msgData.id,
        subject: subjectHeader ? subjectHeader.value : '',
        from: fromHeader ? fromHeader.value : '',
        date: dateHeader ? dateHeader.value : '',
        snippet
      };
    })
  );

  return emails;
}
