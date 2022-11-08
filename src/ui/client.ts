import { Tx, TxStatus } from '../types';

const API_URL = "http://localhost:3000/api/v1/tx" || process.env.API_URL;

export async function getAllTransmitters(): Promise<Tx[]> {
  const response = await fetch(API_URL);
  if (response.ok) {
    const transmitters = await response.json();
    return transmitters;
  }
  return [];
}

export async function addTransmitter(srtPort: number, whipUrl: string) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      port: srtPort,
      whipUrl: whipUrl,
      status: TxStatus.IDLE
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (!response.ok) {
    console.error(await response.text());
  }
}

export async function toggleState(srtPort: number) {
  const response = await fetch(API_URL + "/" + srtPort);
  if (response.ok) {
    const tx = await response.json();
    let newState;
    if (tx.status !== TxStatus.RUNNING) {
      newState = TxStatus.RUNNING;
    } else {
      newState = TxStatus.STOPPED;
    }
    const update = await fetch(API_URL + "/" + srtPort + "/state", {
      method: "PUT",
      body: JSON.stringify({
        desired: newState
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!update.ok) {
      console.error(await response.text());
    }
  }
}

export async function removePort(srtPort: number) {
  const response = await fetch(API_URL + "/" + srtPort, {
    method: "DELETE"
  });
  if (!response.ok) {
    console.error(await response.text());
  }
}