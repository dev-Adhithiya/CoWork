import http from 'http';

const BASE = 'http://localhost:3000';

async function request(path, options = {}) {
  const token = 'cowork_token_test_suite';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response from ${path}: ${text.slice(0, 200)}`);
  }

  if (!response.ok) {
    throw new Error(`Request to ${path} failed (${response.status}): ${JSON.stringify(json)}`);
  }

  return json;
}

async function runTests() {
  console.log('🚀 [E2E] Starting Workspace Tools & Confirmation Verification...');

  // 0. Ensure user is logged in
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: { email: 'askadhithiya@gmail.com', name: 'Adhithiya' },
  });
  console.log('✅ 1. Auth login established:', loginRes.user.email);

  // 1. Test Chat Intent & Preview for Email
  const emailChatRes = await request('/chat', {
    method: 'POST',
    body: { message: 'Send an email to sarah.chen@techcorp.io about Q3 Roadmap saying everything is on track for the demo' },
  });
  console.log('✅ 2. Email proposal generated:', {
    hasProposal: !!emailChatRes.tool_proposal,
    tool: emailChatRes.tool_proposal?.tool,
    to: emailChatRes.tool_proposal?.args?.to,
    subject: emailChatRes.tool_proposal?.args?.subject,
    status: emailChatRes.tool_proposal?.status,
  });

  if (emailChatRes.tool_proposal?.tool !== 'send_email') {
    throw new Error('Expected tool to be send_email');
  }

  // 2. Test Confirming the Email
  const confirmEmailRes = await request('/chat/confirm-tool', {
    method: 'POST',
    body: {
      session_id: emailChatRes.session_id,
      tool_id: emailChatRes.tool_proposal.id,
      action: 'confirm',
      tool: emailChatRes.tool_proposal.tool,
      args: emailChatRes.tool_proposal.args,
    },
  });
  console.log('✅ 3. Email confirmed & dispatched:', confirmEmailRes.result?.message);

  // Check Gmail messages endpoint
  const messagesRes = await request('/gmail/messages');
  const foundEmail = messagesRes.emails.find((e) => e.subject === emailChatRes.tool_proposal.args.subject);
  console.log('✅ 4. Email verified in Gmail store:', foundEmail?.subject);
  if (!foundEmail) throw new Error('Sent email not found in /gmail/messages');

  // 3. Test Chat Intent & Preview for Calendar Event + Meet
  const calChatRes = await request('/chat', {
    method: 'POST',
    body: { message: 'Schedule a sprint planning meeting with alex.chen@techcorp.io tomorrow at 10am' },
  });
  console.log('✅ 5. Calendar & Meet proposal generated:', {
    hasProposal: !!calChatRes.tool_proposal,
    tool: calChatRes.tool_proposal?.tool,
    summary: calChatRes.tool_proposal?.args?.summary,
    meetRequested: calChatRes.tool_proposal?.args?.add_google_meet,
  });

  if (calChatRes.tool_proposal?.tool !== 'create_calendar_event') {
    throw new Error('Expected tool to be create_calendar_event');
  }

  // 4. Test Confirming the Calendar Event
  const confirmCalRes = await request('/chat/confirm-tool', {
    method: 'POST',
    body: {
      session_id: calChatRes.session_id,
      tool_id: calChatRes.tool_proposal.id,
      action: 'confirm',
      tool: calChatRes.tool_proposal.tool,
      args: calChatRes.tool_proposal.args,
    },
  });
  console.log('✅ 6. Event confirmed & scheduled with Google Meet:', {
    summary: confirmCalRes.result?.summary,
    meet_link: confirmCalRes.result?.meet_link,
  });
  if (!confirmCalRes.result?.meet_link?.startsWith('https://meet.google.com/')) {
    throw new Error('Expected valid Google Meet link');
  }

  // Verify in Calendar events list
  const calList = await request('/calendar/events');
  const foundCal = calList.events.find((e) => e.id === confirmCalRes.result.id);
  console.log('✅ 7. Event verified in Calendar store with Meet link:', foundCal?.meet_link);
  if (!foundCal) throw new Error('Scheduled event not found in /calendar/events');

  // 5. Test "Create Meet if Accepted" in Scheduling Flow
  const workspaces = await request('/api/workspaces');
  const wsId = workspaces[0].id;
  const meetingReq = await request(`/api/workspaces/${wsId}/meeting-requests`, {
    method: 'POST',
    body: {
      recipient: 'alex.chen@techcorp.io',
      reason: 'Architecture Sync',
      durationMinutes: 45,
      proposedStart: new Date(Date.now() + 86400000).toISOString(),
    },
  });
  console.log('✅ 8. Meeting request created:', meetingReq.id, 'status:', meetingReq.status);

  // Accept meeting request
  const acceptedReq = await request(`/api/meeting-requests/${meetingReq.id}`, {
    method: 'PATCH',
    headers: { 'x-workspace-id': wsId },
    body: { status: 'accepted', comment: 'Confirmed, see you there!' },
  });
  console.log('✅ 9. Meeting request accepted -> Auto-generated Google Meet:', acceptedReq.meet_link);
  if (!acceptedReq.meet_link?.startsWith('https://meet.google.com/')) {
    throw new Error('Expected Google Meet link on accepted meeting request');
  }

  // Verify meeting was added to calendar events
  const calAfterAccept = await request('/calendar/events');
  const acceptedCal = calAfterAccept.events.find((e) => e.meet_link === acceptedReq.meet_link);
  console.log('✅ 10. Calendar event auto-created for accepted meeting:', acceptedCal?.summary);
  if (!acceptedCal) throw new Error('Auto-created calendar event not found for accepted meeting');

  console.log('\n🎉 ALL 10/10 WORKSPACE TOOLS & MEET INTEGRATION TESTS PASSED PERFECTLY!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
