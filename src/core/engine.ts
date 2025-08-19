// Based on src/parlant/core/engines/types.py

import { EventEmitter } from './types';

export interface Context {
  session_id: string;
  agent_id: string;
}

export enum UtteranceRationale {
  UNSPECIFIED,
  BUY_TIME,
  FOLLOW_UP,
}

export interface UtteranceRequest {
  action: string;
  rationale: UtteranceRationale;
}

export interface Engine {
  process(context: Context, event_emitter: EventEmitter): Promise<boolean>;
  utter(
    context: Context,
    event_emitter: EventEmitter,
    requests: UtteranceRequest[]
  ): Promise<boolean>;
}
