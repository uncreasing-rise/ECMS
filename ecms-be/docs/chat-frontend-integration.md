# Chat Frontend Integration Guide

This guide describes how frontend integrates with the chat system (REST + Socket.IO) including message delivery/read status and unread counters.

## 1) Authentication

- REST: use `Authorization: Bearer <access_token>`.
- Socket: provide the same JWT in one of the following:
  - `Authorization` header (`Bearer <token>`)
  - `auth.token` when creating Socket.IO client

## 2) Data Model (API-level)

### Conversation

```json
{
  "id": "b5f4a67d-8f58-4874-9621-769694a80f52",
  "type": "direct",
  "name": null,
  "member_ids": ["user-a-uuid", "user-b-uuid"],
  "created_by": "user-a-uuid",
  "created_at": "2026-04-10T08:00:00.000Z",
  "updated_at": "2026-04-10T08:05:00.000Z",
  "last_message_at": "2026-04-10T08:05:00.000Z",
  "last_message_preview": "Hello from ECMS chat",
  "my_state": {
    "unread_count": 2,
    "last_delivered_message_id": "msg-uuid-1",
    "last_read_message_id": "msg-uuid-0"
  }
}
```

### Message

```json
{
  "id": "e57f6f90-5854-4315-9586-02276074f12f",
  "conversation_id": "b5f4a67d-8f58-4874-9621-769694a80f52",
  "sender_id": "user-a-uuid",
  "content": "Hello from ECMS chat",
  "created_at": "2026-04-10T08:05:00.000Z"
}
```

## 3) REST API

Base path: `/chat`

### 3.1 Create or get direct conversation

- `POST /chat/conversations/direct`

Request:

```json
{
  "peer_user_id": "peer-user-uuid"
}
```

Response: `Conversation`

### 3.2 Create group conversation

- `POST /chat/conversations/group`

Request:

```json
{
  "name": "Teacher Team",
  "member_ids": ["user-1-uuid", "user-2-uuid"]
}
```

Response: `Conversation`

### 3.3 List my conversations

- `GET /chat/conversations`

Response: `Conversation[]`

### 3.4 Get messages in a conversation

- `GET /chat/conversations/:id/messages?limit=50`
- `limit` range is capped server-side (`1..200`)

Response: `Message[]`

Note:

- When messages are fetched, server auto-marks the latest fetched message as `delivered` for current user.

### 3.5 Send message

- `POST /chat/conversations/:id/messages`

Request:

```json
{
  "content": "Hi everyone"
}
```

Response: `Message`

Server behavior:

- Sender: `unread_count = 0`, `last_read = last_delivered = sent message`
- Other members: `unread_count += 1`

### 3.6 Mark delivered

- `PATCH /chat/conversations/:id/delivered`

Request (optional message id):

```json
{
  "message_id": "latest-received-message-uuid"
}
```

Response:

```json
{
  "delivered": true,
  "message_id": "latest-received-message-uuid"
}
```

If `message_id` is omitted, server uses latest message in that conversation.

### 3.7 Mark read

- `PATCH /chat/conversations/:id/read`

Request (optional message id):

```json
{
  "message_id": "latest-read-message-uuid"
}
```

Response:

```json
{
  "read": true,
  "message_id": "latest-read-message-uuid"
}
```

Server behavior:

- `unread_count` resets to `0` for current user.

### 3.8 Total unread count

- `GET /chat/unread/count`

Response:

```json
{
  "count": 12
}
```

## 4) Socket.IO Realtime

Namespace: `/chat`

### 4.1 Connect

```ts
import { io } from 'socket.io-client';

const socket = io(`${API_BASE_URL}/chat`, {
  transports: ['websocket'],
  auth: { token: accessToken },
});
```

### 4.2 Join conversation room

Client emit:

```ts
socket.emit('chat:join', { conversation_id: conversationId });
```

Server ack:

```json
{ "success": true }
```

### 4.3 Receive new message

Server event: `chat:message`

Payload: `Message`

### 4.4 Receive conversation metadata update

Server event: `chat:conversation.updated`

Payload:

```json
{
  "conversation_id": "b5f4a67d-8f58-4874-9621-769694a80f52"
}
```

Suggested client behavior:

- On `chat:conversation.updated`, call `GET /chat/conversations` for fresh `my_state.unread_count` and last preview/time.

## 5) Suggested Frontend Flow

### Conversation list screen

1. Call `GET /chat/conversations`.
2. Show per-conversation `my_state.unread_count`.
3. Listen to `chat:conversation.updated` and refresh list.

### Conversation detail screen

1. Emit `chat:join` with conversation id.
2. Call `GET /chat/conversations/:id/messages?limit=50`.
3. On open/focus, call `PATCH /chat/conversations/:id/read`.
4. On incoming `chat:message` in active conversation, render immediately and optionally debounce `read` update.

### App badge counter

1. On app load: `GET /chat/unread/count`.
2. On `chat:conversation.updated`, refresh unread count.

## 6) Error handling

All errors follow backend unified envelope. For chat, common keys include:

- `chat.bad_request`
- `chat.not_found`
- `chat.forbidden`

Use API `code` + `message` for UX mapping.

## 7) Notes for production

- Chat now persists in Prisma tables:
  - `chat_conversations`
  - `chat_conversation_members`
  - `chat_messages`
- If your deployment uses DB migrations, add these models into migration workflow before release.
