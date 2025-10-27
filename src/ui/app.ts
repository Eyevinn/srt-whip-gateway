//import * as client from "./mock";
import * as client from "./client";
import { SrtMode, TxStatus } from "../types";

function showWarningModal() {
  const modal = document.querySelector<HTMLElement>("#warningModal");
  modal?.classList.add('show');
}

function hideWarningModal() {
  const modal = document.querySelector<HTMLElement>("#warningModal");
  modal?.classList.remove('show');
}

async function updateTransmitters() {
  const portSection = document.querySelector('#ports');
  const transmitters = await client.getAllTransmitters();

  transmitters.forEach(tx => {
    const elementId = 'port-' + tx.port;
    let element = document.querySelector<HTMLButtonElement>("#" + elementId);
    if (!element) {
      element = document.createElement('button');
      element.id = elementId;
      portSection?.appendChild(element);

      element.addEventListener('click', async (event) => {
        const btn = <HTMLButtonElement>event.target;
        const port = parseInt(btn.id.split("-")[1], 10);
        await client.toggleState(port);
        await updateTransmitters();
      });
    }
    element.innerHTML = `<span class="srtPort">${tx.port}</span><br>` 
      + `<a class="whipUrl" href="${tx.whipUrl}">WHIP</a>`
      + (tx.passThroughUrl ? ` <a class="srtUrl" href="${tx.passThroughUrl}">SRT</a>` : '')
      + `<p class="state">${tx.status}</p>`;
    element.className = tx.status;
    const removeBtn = document.createElement('a');
    removeBtn.className = 'remove';
    removeBtn.innerHTML = 'X';
    element.appendChild(removeBtn);
    removeBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      const btn = <HTMLAnchorElement>event.target;
      const portElement = <HTMLButtonElement>btn.parentElement;
      const port = parseInt(portElement.id.split("-")[1], 10);

      // Check if transmitter is in running state
      if (tx.status === TxStatus.RUNNING) {
        showWarningModal();
        return;
      }

      await client.removePort(port);
      portSection?.removeChild(portElement);
    });

  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await updateTransmitters();

  // Setup modal close button
  const closeModalButton = document.querySelector<HTMLButtonElement>("#closeModal");
  closeModalButton?.addEventListener('click', () => {
    hideWarningModal();
  });

  // Close modal when clicking outside the modal content
  const modal = document.querySelector<HTMLElement>("#warningModal");
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) {
      hideWarningModal();
    }
  });

  // Toggle SRT URL field visibility based on caller mode checkbox
  const srtCallerModeCheckbox = document.querySelector<HTMLInputElement>("#srtCallerMode");
  const srtUrlGroup = document.querySelector<HTMLElement>("#srtUrlGroup");

  srtCallerModeCheckbox?.addEventListener('change', () => {
    if (srtCallerModeCheckbox.checked) {
      srtUrlGroup?.classList.remove('hidden');
    } else {
      srtUrlGroup?.classList.add('hidden');
    }
  });

  const addTransmitterButton = document.querySelector<HTMLButtonElement>("#addTransmitter");
  addTransmitterButton?.addEventListener('click', async () => {
    const srtPort = document.querySelector<HTMLInputElement>("#newSrtPort")?.value;
    const whipUrl = document.querySelector<HTMLInputElement>("#newWhipUrl")?.value;
    const restreamUrl = document.querySelector<HTMLInputElement>("#restreamUrl")?.value;
    const srtCallerMode = document.querySelector<HTMLInputElement>("#srtCallerMode")?.checked;
    const srtUrl = document.querySelector<HTMLInputElement>("#srtUrl")?.value;
    const noVideo = document.querySelector<HTMLInputElement>("#noVideo")?.checked;
    const srtMode = srtCallerMode ? SrtMode.CALLER : SrtMode.LISTENER;

    if (!srtPort || !whipUrl) return;

    await client.addTransmitter(parseInt(srtPort, 10), whipUrl, restreamUrl, srtMode, srtUrl, noVideo);
    await updateTransmitters();
  });
});