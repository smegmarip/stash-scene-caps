// ==UserScript==
// @name        scenecaps
// @description Toggle Screen Caps on Scene Player
// @namespace   https://github.com/smegmarip
// @version     0.0.1
// @homepage    https://github.com/smegmarip/stash-scene-caps/
// @author      smegmarip
// @match       http://localhost:9999/*
// @connect     localhost
// @run-at      document-idle
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src/StashUserscriptLibrary.js
// @downloadURL https://raw.githubusercontent.com/smegmarip/stash-scene-caps/main/dist/scenecaps.user.js
// @updateURL   https://raw.githubusercontent.com/smegmarip/stash-scene-caps/main/dist/scenecaps.user.js
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==
(function () {
  "use strict";

  const { stash: stash$1 } = unsafeWindow.stash;

  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  /**
   * Returns an array containing the scenario and scenario ID extracted from the current URL.
   * @returns {Array<string>} An array containing the scenario and scenario ID.
   */
  function getScenarioAndID() {
    var result = document.URL.match(/(scenes|images)\/(\d+)/);
    var scenario = result[1];
    var scenario_id = result[2];
    return [scenario, scenario_id];
  }

  /**
   * Retrieves the URL of the sprite for a given scene ID.
   *
   * @param {number} scene_id - The ID of the scene to retrieve the sprite URL for.
   * @returns {Promise<string|null>} - A Promise that resolves with the sprite URL if it exists, or null if it does not.
   */
  async function getUrlSprite(scene_id) {
    const reqData = {
      query: `{
        findScene(id: ${scene_id}){
          paths{
            sprite
          }
        }
      }`,
    };
    var result = await stash$1.callGQL(reqData);
    const url = result.data.findScene.paths["sprite"];
    const response = await fetch(url);
    if (response.status === 404) {
      return null;
    } else {
      return result.data.findScene.paths["sprite"];
    }
  }

  const { stash } = unsafeWindow.stash;
  stash.addEventListener("page:scene", function () {
    let btnGrp = ".ml-auto .btn-group";
    let wrapper = ".VideoPlayer .video-wrapper";
    waitForElm(wrapper).then(async ($el) => {
      if (!document.querySelector("#screencaps")) {
        const [_, scene_id] = getScenarioAndID();
        const spriteUrl = await getUrlSprite(scene_id);
        if (spriteUrl) {
          const screenCaps = document.createElement("div");
          const link = document.createElement("a");
          screenCaps.setAttribute("id", "screencaps");
          screenCaps.setAttribute(
            "style",
            "display: none; position: absolute; top: 10px; left: 10px; bottom: 10px; right: 10px; background: url(" +
              spriteUrl +
              "); background-position: center; z-index: 1"
          );
          link.setAttribute("href", spriteUrl);
          link.setAttribute("target", "_screencap");
          link.setAttribute(
            "style",
            "display: block; background:transparent; position: absolute; top: 10px; left: 10px; bottom: 10px; right: 10px;"
          );
          screenCaps.appendChild(link);
          $el.prepend(screenCaps);
          waitForElm(btnGrp).then(async ($btnGrpEl) => {
            if (!document.querySelector("#scenecaps")) {
              const btn = document.createElement("button");
              btn.setAttribute("id", "scenecaps");
              btn.setAttribute("class", "minimal pr-1 btn btn-secondary");
              const spn = document.createElement("span");
              const svg = `<svg width="16" height="16" fill="#FFFFFF" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 402.598 402.598" xml:space="preserve"><g id="XMLID_42_"><rect id="XMLID_48_" x="192.93" y="272.598" width="50" height="40"/><path id="XMLID_43_" d="M148.53,182.598l205.016-91.236L312.888,0L29.667,126.039l33.263,74.745v201.813h310v-220H148.53zM136.685,111.25l38.762-17.249l-20.281,52.808l-38.762,17.25L136.685,111.25z M228.046,70.593l38.761-17.25l-20.28,52.808L207.765,123.4L228.046,70.593z M122.93,272.598v-30h190v30h-40v40h40v30h-190v-30h40v-40H122.93z"/></g></svg>`;
              spn.innerHTML = svg;
              btn.appendChild(spn);
              $btnGrpEl.prepend(btn);
              btn.addEventListener("click", function () {
                if (screenCaps.style.display === "none") {
                  screenCaps.style.display = "block";
                } else {
                  screenCaps.style.display = "none";
                }
              });
            }
          });
        }
      }
    });
  });
})();
