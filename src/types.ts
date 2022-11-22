import { Static, Type } from '@sinclair/typebox'

export enum TxStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
  FAILED = 'failed'
}

export const Tx = Type.Object({
  port: Type.Number({ description: 'SRT port' }),
  whipUrl: Type.String({ description: 'WHIP url' }),
  passThroughUrl: Type.Optional(Type.String({ description: 'Pass-through to SRT ingest URL' })),
  status: Type.Enum(TxStatus)
});
export type Tx = Static<typeof Tx>;

export const TxStateChange = Type.Object({
  desired: Type.Enum(TxStatus)
});
export type TxStateChange = Static<typeof TxStateChange>;