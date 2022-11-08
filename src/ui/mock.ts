import { Tx, TxStatus } from '../types';

const MOCK_TRANSMITTERS: Tx[] = [
  {
    port: 9191,
    whipUrl: 'http://localhost:8200/api/v2/whip/sfu-broadcaster?channelId=chan1',
    status: TxStatus.IDLE
  },
  {
    port: 9192,
    whipUrl: 'http://localhost:8200/api/v2/whip/sfu-broadcaster?channelId=chan2',
    status: TxStatus.RUNNING
  },
  {
    port: 9193,
    whipUrl: 'http://localhost:8200/api/v2/whip/sfu-broadcaster?channelId=chan3',
    status: TxStatus.FAILED
  },
  {
    port: 9194,
    whipUrl: 'http://localhost:8200/api/v2/whip/sfu-broadcaster?channelId=chan4',
    status: TxStatus.STOPPED
  },
];

export async function getAllTransmitters(): Promise<Tx[]> {
  return MOCK_TRANSMITTERS;
}