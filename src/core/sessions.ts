// Based on src/parlant/core/sessions.py

export type SessionId = string;
export type EventId = string;
export type CustomerId = string;
export type AgentId = string;

export enum EventSource {
  CUSTOMER = 'customer',
  CUSTOMER_UI = 'customer_ui',
  HUMAN_AGENT = 'human_agent',
  HUMAN_AGENT_ON_BEHALF_OF_AI_AGENT = 'human_agent_on_behalf_of_ai_agent',
  AI_AGENT = 'ai_agent',
  SYSTEM = 'system',
}

export enum EventKind {
  MESSAGE = 'message',
  TOOL = 'tool',
  STATUS = 'status',
  CUSTOM = 'custom',
}

export interface Participant {
  id?: AgentId | CustomerId | null;
  display_name: string;
}

export interface MessageEventData {
  message: string;
  participant: Participant;
  flagged?: boolean;
  tags?: string[];
  draft?: string;
}

export interface Session {
  id: SessionId;
  creation_utc: string;
  customer_id: CustomerId;
  agent_id: AgentId;
  mode: 'auto' | 'manual';
  title?: string;
  consumption_offsets: Record<string, number>;
  agent_states: any[]; // This is complex, placeholder for now
}

export interface Event {
  id: EventId;
  source: EventSource;
  kind: EventKind;
  creation_utc: string;
  offset: number;
  correlation_id: string;
  data: any;
  deleted: boolean;
}

export interface SessionStore {
  create_session(params: {
    customer_id: CustomerId;
    agent_id: AgentId;
    creation_utc?: string;
    title?: string;
  }): Promise<Session>;

  read_session(session_id: SessionId): Promise<Session>;
  delete_session(session_id: SessionId): Promise<void>;
  update_session(session_id: SessionId, params: Partial<Session>): Promise<Session>;
  list_sessions(agent_id?: AgentId, customer_id?: CustomerId): Promise<Session[]>;

  create_event(params: {
    session_id: SessionId;
    source: EventSource;
    kind: EventKind;
    correlation_id: string;
    data: any;
    creation_utc?: string;
  }): Promise<Event>;

  read_event(session_id: SessionId, event_id: EventId): Promise<Event>;
  delete_event(event_id: EventId): Promise<void>;
  list_events(params: {
    session_id: SessionId;
    source?: EventSource;
    correlation_id?: string;
    kinds?: EventKind[];
    min_offset?: number;
    exclude_deleted?: boolean;
  }): Promise<Event[]>;
}
