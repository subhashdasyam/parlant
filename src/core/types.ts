// Placeholder interfaces for core components

export interface Logger {
  info(message: string): void;
  error(message: string): void;
  warn(message: string): void;
}

export interface ContextualCorrelator {
  scope<T>(name: string, data: Record<string, any>, fn: () => T): T;
  readonly correlation_id: string;
}

export interface SessionStore {
  create_session(params: any): Promise<any>;
  read_session(id: string): Promise<any>;
  update_session(id: string, params: any): Promise<any>;
  delete_session(id: string): Promise<void>;
  create_event(params: any): Promise<any>;
  list_events(params: any): Promise<any[]>;
}

export interface SessionListener {
    wait_for_events(params: any): Promise<boolean>;
}

export interface GuidelineStore {}
export interface GuidelineToolAssociationStore {}
export interface RelationshipStore {}
export interface JourneyStore {}
export interface Engine {}
export interface EventEmitterFactory {}
export interface BackgroundTaskService {}
