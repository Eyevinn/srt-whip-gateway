//import * as client from "./mock";
import * as client from "./client";

async function updateTransmitters() {
  const portSection = document.querySelector('#ports');
  const transmitters = await client.getAllTransmitters();

  transmitters.forEach(tx => {
    const elementId = 'port-' + tx.port;
    let element = document.querySelector<HTMLButtonElement>("#" + elementId);
    if (!element) {
      element = document.createElement('button');
      element.id = elementId;
      portSection.appendChild(element);
      element.addEventListener('click', async (event) => {
        const btn = <HTMLButtonElement>event.target;
        const port = parseInt(btn.id.split("-")[1], 10);
        await client.toggleState(port);
        await updateTransmitters();
      });
    }
    element.innerHTML = `<span class="srtPort">${tx.port}</span><br>` 
      + `<a class="whipUrl" href="${tx.whipUrl}">WHIP URL</a>`
      + `<p class="state">${tx.status}</p>`;
    element.className = tx.status;
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  await updateTransmitters();  

  const addTransmitterButton = document.querySelector<HTMLButtonElement>("#addTransmitter");
  addTransmitterButton.addEventListener('click', async () => {
    const srtPort = document.querySelector<HTMLInputElement>("#newSrtPort").value;
    const whipUrl = document.querySelector<HTMLInputElement>("#newWhipUrl").value;

    await client.addTransmitter(parseInt(srtPort, 10), whipUrl);
    await updateTransmitters();
  });
});