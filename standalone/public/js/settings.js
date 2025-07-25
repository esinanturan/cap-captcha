import setState from "./state.js";
import { createModal } from "./utils.js";
import makeApiRequest from "./api.js";

export const openSettings = () => {
  setState("settings");

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  (async () => {
    const sessions = await makeApiRequest("GET", "/settings/sessions");

    const sessionsList = document.querySelector(
      ".state-settings .sessions-list"
    );
    sessionsList.innerHTML = "";

    sessions.forEach((session) => {
      const sessionEl = document.createElement("div");
      sessionEl.classList.add("session");

      sessionEl.innerHTML = `
        <div class="session-info">
          <span class="session-token">${session.token}...</span>
          <span class="session-expires">${
            JSON.parse(localStorage.getItem("cap_auth")).hash.endsWith(
              session.token
            )
              ? "<b>current</b> • "
              : ""
          }expires ${formatDate(session.expires)}${
        JSON.parse(localStorage.getItem("cap_auth")).hash.endsWith(
          session.token
        )
          ? ""
          : " • created " + formatDate(session.created)
      }</span>
        </div>
        <button class="session-delete-button">Logout</button>
      `;

      sessionsList.appendChild(sessionEl);

      sessionEl
        .querySelector(".session-delete-button")
        .addEventListener("click", async () => {
          const modal = createModal(
            "Logout session?",
            `<button class="logout-confirm-button primary" style="margin-bottom:8px;">Yes, log out</button>
           <button class="logout-cancel-button primary secondary">Cancel</button>`
          );

          modal
            .querySelector(".logout-confirm-button")
            .addEventListener("click", async () => {
              modal.querySelector(".logout-confirm-button").disabled = true;
              await makeApiRequest("POST", `/logout`, {
                session: session.token,
              });
              document.body.removeChild(modal);
              if (sessions.length === 1) {
                localStorage.removeItem("cap_auth");
                location.reload();
              }
              openSettings();
            });

          modal
            .querySelector(".logout-cancel-button")
            .addEventListener("click", () => {
              document.body.removeChild(modal);
            });
        });
    });
  })();

  (async () => {
    const apikeys = await makeApiRequest("GET", "/settings/apikeys");

    const apikeysList = document.querySelector(".state-settings .apikeys-list");
    apikeysList.innerHTML = "";

    if (apikeys.length === 0) {
      apikeysList.innerHTML = `<p>You don't have any API keys</p>`;
      return;
    }

    apikeys.forEach((key) => {
      const keyEl = document.createElement("div");
      keyEl.classList.add("apikey");

      keyEl.innerHTML = `
        <div class="apikey-info">
          <span class="apikey-token">${key.name
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")}</span>
          <span class="apikey-created" title="${key.id}...">${key.id.slice(
        0,
        12
      )}... • created ${formatDate(key.created)}</span>
        </div>
        <button class="apikey-delete-button">Delete</button>
      `;

      apikeysList.appendChild(keyEl);

      keyEl
        .querySelector(".apikey-delete-button")
        .addEventListener("click", async () => {
          const modal = createModal(
            "Delete API key?",
            `<button class="delete-confirm-button primary" style="margin-bottom:8px;">Yes, delete</button>
           <button class="delete-cancel-button primary secondary">Cancel</button>`
          );

          modal
            .querySelector(".delete-confirm-button")
            .addEventListener("click", async () => {
              modal.querySelector(".delete-confirm-button").disabled = true;
              await makeApiRequest("DELETE", `/settings/apikeys/${key.id}`);
              document.body.removeChild(modal);
              openSettings();
            });

          modal
            .querySelector(".delete-cancel-button")
            .addEventListener("click", () => {
              document.body.removeChild(modal);
            });
        });
    });
  })();
};
