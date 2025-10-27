import { Static, Type } from '@sinclair/typebox'

export enum TxStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  STOPPED = 'stopped',
  FAILED = 'failed'
}

export enum SrtMode {
  CALLER = 1,
  LISTENER = 2
}

export const Tx = Type.Object({
  label: Type.Optional(Type.String({ description: 'Optional label for this transmitter' })),
  port: Type.Number({ description: 'SRT port' }),
  mode: Type.Optional(Type.Enum(SrtMode, { description: 'srt mode'})),
  srtUrl: Type.Optional(Type.String({ description: 'srtUrl in case caller mode'})),
  whipUrl: Type.String({ description: 'WHIP url' }),
  passThroughUrl: Type.Optional(Type.String({ description: 'Pass-through to SRT ingest URL' })),
  noVideo: Type.Optional(Type.Boolean({ description: 'Disable video stream' })),
  status: Type.Enum(TxStatus)
});
export type Tx = Static<typeof Tx>;

export const TxStateChange = Type.Object({
  desired: Type.Enum(TxStatus)
});
export type TxStateChange = Static<typeof TxStateChange>;