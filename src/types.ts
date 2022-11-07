import { Static, Type } from '@sinclair/typebox'

export enum TxStatus {
  IDLE,
  RUNNING,
  STOPPED,
  FAILED
}

export const Tx = Type.Object({
  port: Type.Number(),
  whipUrl: Type.String(),
  status: Type.Enum(TxStatus)
});
export type Tx = Static<typeof Tx>;
