import { Tx, TxStatus } from '../types';

let API_URL: string;

if (process.env.API_URL) {
  API_URL = process.env.API_URL;
} else {
  API_URL = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/api/v1/tx`;
}

export async function getAllTransmitters(): Promise<Tx[]> {
  const response = await fetch(API_URL);
  if (response.ok) {
    const transmitters = await response.json();
    return transmitters;
  }
  return [];
}

export async function addTransmitter(srtPort: number, whipUrl: string, restreamUrl?: string) {
  const txObject = {
    port: srtPort,
    whipUrl: whipUrl,
    status: TxStatus.IDLE
  };
  if (restreamUrl) {
    txObject.passThroughUrl = restreamUrl;
  }
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(txObject),
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