import { Static, Type } from '@sinclair/typebox'

export enum TxStatus {
  IDLE,
  RUNNING,
  STOPPED,
  FAILED
}

export const Tx = Type.Object({
  port: Type.Number({ description: 'SRT port' }),
  whipUrl: Type.String({ description: 'WHIP url' }),
  status: Type.Enum(TxStatus)
});
export type Tx = Static<typeof Tx>;
