// ==UserScript==
// @name        scenecaps
// @description Toggle Screen Caps on Scene Player
// @namespace   https://github.com/smegmarip
// @version     0.0.7
// @homepage    https://github.com/smegmarip/stash-scene-caps/
// @author      smegmarip
// @match       http://localhost:9999/*
// @connect     localhost
// @run-at      document-idle
// @require     https://code.jquery.com/jquery-1.11.1.min.js
// @require     https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src/StashUserscriptLibrary.js
// @downloadURL https://raw.githubusercontent.com/smegmarip/stash-scene-caps/main/dist/scenecaps.user.js
// @updateURL   https://raw.githubusercontent.com/smegmarip/stash-scene-caps/main/dist/scenecaps.user.js
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// ==/UserScript==
(function () {
  "use strict";

  let onSpriteHandler;
  const { stash: stash$1 } = unsafeWindow.stash;

  const ui = {
    templates: {
      cards: {
        tag: `
          <div draggable="false" class="tag-card zoom-0 grid-card card">
            <div class="thumbnail-section">
              <a class="tag-card-header" style="cursor: pointer">
                <img class="tag-card-image" alt="tag name" src="http://stash.tropicalnet.local/tag/[tag_id]/image?t=[timestamp]&amp;default=true">
              </a>
            </div>
            <div class="card-section">
              <a class="tag-title" style="cursor: pointer">
                  <h5 class="card-section-title flex-aligned">
                    <div class="TruncatedText center-text text-capitalize" style="-webkit-line-clamp: 2;">[tag_name]</div>
                  </h5>
              </a>
            </div>
          </div>
        `,
      },
      modals: {
        result: {
          top: `
          <div class="tagger-tabs" style="position: absolute; flex: 0 0 450px; max-width: 450px; min-width: 450px; height: 100%; overflow: auto; order: -1; background-color: var(--body-color); z-index: 10;">
            <div class="modal-dialog modal-xl top-accent">
              <div class="modal-content">
                <div class="modal-header" style="padding: 20px;">
                  <div class="stashtag-heading">
                    <div class="scrubber-item" data-offset="[vtt_offset]" style="position: relative; background-position: [bg_offset]; background-image: url(&quot;[sprite_url]&quot;); width: [bg_width]px; height: [bg_height]px;"></div>
                    <span class="stashtag-heading-text">Add Marker: [marker_time]</span>
                  </div>
                  <div class="stashtag-search">
                    <div role="toolbar" class="justify-content-center btn-toolbar">
                        <div class="mb-2 mr-2 d-flex">
                          <div class="flex-grow-1 query-text-field-group">
                              <input id="stashtag-search" placeholder="Search…" class="query-text-field bg-secondary text-white border-secondary form-control">
                              <button title="Clear" type="button" class="query-text-field-clear btn btn-secondary d-none">
                                <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="xmark" class="svg-inline--fa fa-xmark fa-icon " role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                    <path fill="currentColor" d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"></path>
                                </svg>
                              </button>
                          </div>
                        </div>
                    </div>
                  </div>
                </div>
                <div class="modal-body">
                    <div id="stashtag-results" class="row justify-content-center" style="zoom: 0.8">
          `,
          bottom: `
                </div>
                </div>
                <div class="ModalFooter modal-footer" style="border-top: 0px;">
                    <div>
                      <button id="tags-cancel" type="button" class="ml-2 btn btn-secondary">Close</button>
                    </div>
                </div>
              </div>
            </div>
          </div>
          `,
        },
      },
      icons: {
        clapper: `<svg width="16" height="16" fill="#FFFFFF" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 402.598 402.598" xml:space="preserve"><g id="XMLID_42_"><rect id="XMLID_48_" x="192.93" y="272.598" width="50" height="40"/><path id="XMLID_43_" d="M148.53,182.598l205.016-91.236L312.888,0L29.667,126.039l33.263,74.745v201.813h310v-220H148.53zM136.685,111.25l38.762-17.249l-20.281,52.808l-38.762,17.25L136.685,111.25z M228.046,70.593l38.761-17.25l-20.28,52.808L207.765,123.4L228.046,70.593z M122.93,272.598v-30h190v30h-40v40h40v30h-190v-30h40v-40H122.93z"/></g></svg>`,
        marker: `<svg xmlns="http://www.w3.org/2000/svg" style="opacity: 0.9;" height="50%" fill="#FD7E14" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>`,
      },
    },
  };

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
   * Retrieves the tags associated with a given scene ID.
   *
   * @param {string} scene_id - The ID of the scene to retrieve tags for.
   * @returns {Promise<string[]>} - A promise that resolves with an array of tag IDs.
   */
  async function getTagsForScene(scene_id) {
    const reqData = {
      query: `{
      findScene(id: "${scene_id}") {
        tags {
          id
        }
      }
    }`,
    };
    var result = await stash$1.callGQL(reqData);
    return result.data.findScene.tags.map((p) => p.id);
  }

  async function getSceneMarkers(scene_id) {
    const reqData = {
      variables: {
        scene_id,
      },
      query: `
        query FindSceneMarkers($scene_id: ID) {
          findScene(id: $scene_id) {
            scene_markers {
              id
              seconds
            }
          }
        }`,
    };
    let result = await stash.callGQL(reqData);
    return result.data?.findScene?.scene_markers;
  }

  /**
   * Updates a scene with the given scene_id and tag_ids.
   * @param {string} scene_id - The ID of the scene to update.
   * @param {Array<string>} tag_ids - An array of tag IDs to associate with the scene.
   * @returns {Promise<Object>} - A promise that resolves with the updated scene object.
   */
  async function updateScene(scene_id, tag_ids) {
    const reqData = {
      variables: { input: { id: scene_id, tag_ids: tag_ids } },
      query: `mutation sceneUpdate($input: SceneUpdateInput!){
      sceneUpdate(input: $input) {
        id
      }
    }`,
    };
    return stash$1.callGQL(reqData);
  }

  /**
   * Creates a marker for a scene with the given parameters.
   * @param {string} scene_id - The ID of the scene.
   * @param {string} primary_tag_id - The ID of the primary tag.
   * @param {number} seconds - The number of seconds for the marker.
   * @returns {Promise<string>} - The ID of the created marker.
   */
  async function createMarker(scene_id, primary_tag_id, seconds) {
    const reqData = {
      variables: {
        scene_id: scene_id,
        primary_tag_id: primary_tag_id,
        seconds: seconds,
      },
      query: `mutation SceneMarkerCreate($seconds: Float!, $scene_id: ID!, $primary_tag_id: ID!) {
      sceneMarkerCreate(input: {title:"", seconds: $seconds, scene_id: $scene_id, primary_tag_id: $primary_tag_id}) {
        id
      }
    }`,
    };
    let result = await stash$1.callGQL(reqData);
    return result.data.sceneMarkerCreate.id;
  }

  async function addMarker(tagId, time) {
    const [, scene_id] = getScenarioAndID();

    await createMarker(scene_id, tagId, time);
  }

  async function addTags(tag_ids) {
    const [, scene_id] = getScenarioAndID();
    let existingTags = await getTagsForScene(scene_id);

    for (const tag of tag_ids) {
      if (!existingTags.includes(tag)) {
        existingTags.push(tag);
      }
    }

    await updateScene(scene_id, existingTags);
  }

  /**
   * Retrieves all tags from the server and returns them as an object with tag names as keys and tag IDs as values.
   * @returns {Promise<Object>} An object with tag names as keys and tag IDs as values.
   */
  async function getAllTags(keys = "name") {
    const reqData = {
      query: `{
      allTags{
        id
        name
        aliases
      }
    }`,
    };
    var result = await stash$1.callGQL(reqData);
    if (keys === "name") {
      return result.data.allTags.reduce((map, obj) => {
        map[obj.name.toLowerCase()] = obj.id;
        obj.aliases.forEach((alias) => {
          map[alias.toLowerCase()] = obj.id;
        });
        return map;
      }, {});
    } else {
      return result.data.allTags.reduce((map, obj) => {
        if (!map[obj.id]) {
          map[obj.id] = {
            id: obj.id,
            name: obj.name.toLowerCase(),
            aliases: obj.aliases.map((alias) => {
              return alias.toLowerCase();
            }),
          };
        }
        return map;
      }, {});
    }
  }

  async function getLatestTags() {
    return getAllTags("id").then(async (tags) => {
      const reqData = {
        query: `mutation {
            querySQL(sql: "SELECT id, primary_tag_id FROM scene_markers ORDER BY created_at DESC", args: []) {
              rows
            }
          }`,
      };
      var result = await stash$1.callGQL(reqData),
        marker_tag_ids = result.data.querySQL.rows.reduce((map, arr) => {
          if (map.indexOf(arr[1]) === -1) {
            map.push(arr[1]);
          }
          return map;
        }, []);
      return marker_tag_ids
        .map(Number)
        .concat(
          Object.keys(tags)
            .map(Number)
            .filter((tag_id) => marker_tag_ids.indexOf(tag_id) === -1)
        )
        .filter((tag_id, i, self) => i == self.indexOf(tag_id))
        .map((tag_id) => tags[tag_id]);
    });
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

  async function download(url) {
    const vblob = await fetch(url).then((res) => res.blob());

    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(vblob);
    });
  }

  function getVTToffsets(vtt, scaleFactor) {
    let time_seconds = 0;
    let left,
      top,
      right,
      bottom,
      width,
      height = null;
    const lines = vtt.split("\n");
    const offsets = [];

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine.includes("-->")) {
        const start = trimmedLine.split("-->")[0].trim().split(":");
        time_seconds =
          parseInt(start[0]) * 3600 +
          parseInt(start[1]) * 60 +
          parseFloat(start[2]);
        left = top = right = bottom = width = height = null;
      } else if (trimmedLine.includes("xywh=")) {
        [left, top, width, height] = trimmedLine
          .split("xywh=")[1]
          .split(",")
          .map(Number)
          .map((n) => n * scaleFactor);
        right = left + width;
        bottom = top + height;
      } else {
        continue;
      }

      if (left !== null) {
        offsets.push({ left, top, right, bottom, width, height, time_seconds });
      }
    }

    return offsets;
  }

  function getVTTFrames(vtt, scaleFactor = 1) {
    const decodedVtt = atob(vtt.replace("data:text/vtt;base64,", ""));
    const offsets = getVTToffsets(decodedVtt, scaleFactor);
    const frames = offsets.map((offset, index) => ({
      index,
      time: offset.time_seconds,
      offset: {
        left: offset.left,
        top: offset.top,
        right: offset.right,
        bottom: offset.bottom,
        width: offset.width,
        height: offset.height,
      },
      unscaled: {
        left: Math.round(offset.left / scaleFactor),
        top: Math.round(offset.top / scaleFactor),
        right: Math.round(offset.right / scaleFactor),
        bottom: Math.round(offset.bottom / scaleFactor),
        width: Math.round(offset.width / scaleFactor),
        height: Math.round(offset.height / scaleFactor),
      },
    }));

    return frames;
  }

  function formatDuration(duration) {
    // Ensure the input is a number
    const totalSeconds = Number(duration);

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60, 2);

    // Format each component to be two digits
    const formattedHours = String(hours).padStart(2, "0");
    const formattedMinutes = String(minutes).padStart(2, "0");
    const formattedSeconds = String(seconds).padStart(2, "0");

    // Construct the formatted time string
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }

  function onKeyPressSave() {
    let btnGrp = "#scene-edit-details .edit-buttons";
    waitForElm(btnGrp).then(async ($el) => {
      const $btn = $el.querySelector(".btn-primary");
      if ($btn) {
        document.addEventListener("keydown", function (event) {
          // Check if 'S' is pressed along with Ctrl or Cmd
          if ((event.ctrlKey || event.metaKey) && event.key === "s") {
            event.preventDefault(); // Prevent the default save action
            // Trigger your specific button event
            $btn.click();
          }
        });
      }
    });
  }

  function bgImageSize(container, url, callback) {
    const divRect = container.getBoundingClientRect();
    const inset = 10;
    const divWidth = divRect.width;
    const divHeight = divRect.height;
    const divAspectRatio = divWidth / divHeight;

    const img = new Image();
    img.onload = function () {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      const imgAspectRatio = imgWidth / imgHeight;

      let scaledWidth, scaledHeight, posX, posY, scaleFactor, result;

      // Check if image aspect ratio is greater than div's aspect ratio
      if (imgAspectRatio > divAspectRatio) {
        // Scale image's width to div's width and adjust height
        scaledWidth = divWidth;
        scaledHeight = divWidth / imgAspectRatio;
        scaleFactor = divWidth / imgWidth;
      } else {
        // Scale image's height to div's height and adjust width
        scaledHeight = divHeight;
        scaledWidth = divHeight * imgAspectRatio;
        scaleFactor = divHeight / imgHeight;
      }

      // Calculate the position for centering the image
      posX = (divWidth - scaledWidth) / 2;
      posY = (divHeight - scaledHeight) / 2;

      result = {
        size: { width: scaledWidth, height: scaledHeight },
        position: { x: posX, y: posY },
        scale: scaleFactor,
      };

      if (typeof callback == "function") {
        callback(result);
      }
    };
    img.src = url;
  }

  async function getSelectedFrame(spriteUrl, spritePos, mouseCoords) {
    // get vtt blob
    const vtt_url = spriteUrl.replace("_sprite.jpg", "_thumbs.vtt");
    let vtt = await download(vtt_url);

    const frameData = getVTTFrames(vtt, spritePos.scale);
    const offset = ["x", "y"].reduce((o, k) => {
      o[k] -= spritePos.position[k];
      return o;
    }, mouseCoords);
    const clickFrame = frameData.reduce((o, f) => {
      if (offset.x > f.offset.left && offset.x <= f.offset.right) {
        if (offset.y > f.offset.top && offset.y <= f.offset.bottom) {
          o = f;
        }
      }
      return o;
    }, null);

    if (clickFrame) {
      clickFrame.spriteUrl = spriteUrl;
    }

    return clickFrame;
  }

  function close_modal() {
    $(".tagger-tabs").remove();
  }

  function onClearQuery(e) {
    e.preventDefault();
    $(e.currentTarget).addClass("d-none");
    $("#stashtag-search").val("");
    $("#stashtag-search").focus();
    $("#stashtag-search").trigger("input");
  }

  function displayModal(frame) {
    const offset = ((o) => {
        const { left, top, width, height } = o;
        return [left, top, width, height];
      })(frame.unscaled),
      template = ui.templates.modals.result;
    let card = ui.templates.cards.tag,
      html = template.top + template.bottom;

    html = html.replace("[vtt_offset]", offset.join(","));
    html = html.replace("[bg_offset]", `-${offset[0]}px -${offset[1]}px`);
    html = html.replace("[bg_width]", offset[2]);
    html = html.replace("[bg_height]", offset[3]);
    html = html.replace("[sprite_url]", frame.spriteUrl);
    html = html.replace("[marker_time]", formatDuration(frame.time));

    $(".main > .row").append(html);

    $("#tags-cancel").click(function () {
      close_modal();
    });

    $(".stashtag-search .query-text-field-clear").click(onClearQuery);

    $("#stashtag-results").on("click", ".tag-card a", function (e) {
      const tag_id = $(e.currentTarget).closest(".tag-card").data("tag_id");
      addMarker(tag_id, frame.time).then(() => annotateSprite(frame.spriteUrl));
      addTags([tag_id]);
      alert("marker added");
      close_modal();
    });

    getLatestTags().then((tags) => {
      updateSearch(tags.slice(0, 6));

      $("#stashtag-search").on("input", function () {
        const searchVal = $(this).val().toLowerCase(),
          $clearBtn = $(".stashtag-search .query-text-field-clear"),
          filteredTags = tags.filter(function (tag) {
            return tag.name.toLowerCase().includes(searchVal);
          });
        $clearBtn.toggleClass("d-none", !searchVal);
        updateSearch(filteredTags.slice(0, 6));
      });
    });
  }

  function updateSearch(filtered) {
    const $results = $("#stashtag-results");
    $results.empty();

    filtered.forEach(function (tag) {
      var card = ui.templates.cards.tag,
        ts = Date.now();
      card = card.replace("[tag_id]", tag.id);
      card = card.replace("[timestamp]", ts);
      card = card.replace("[tag_name]", tag.name);

      var $card = $(card);
      $card.data("tag_id", tag.id);
      $results.append($card);
    });
  }

  async function annotateSprite(spriteUrl) {
    const [_, scene_id] = getScenarioAndID();
    const sceneMarkers = await getSceneMarkers(scene_id);
    const screenCaps = document.querySelector("#screencaps");
    const link = screenCaps.querySelector("a");
    if (sceneMarkers) {
      let icon = ui.templates.icons.marker,
        vtt_url = spriteUrl.replace("_sprite.jpg", "_thumbs.vtt"),
        vtt = await download(vtt_url),
        $markerEl,
        marker,
        f,
        off;
      link.innerHTML = "";
      bgImageSize(screenCaps, spriteUrl, (spritePos) => {
        const frameData = getVTTFrames(vtt, spritePos.scale);
        for (marker of sceneMarkers) {
          f = frameData.reduce((s, o) => {
            s = Math.abs(marker.seconds - o.time) < 1.0 ? o : s;
            return s;
          }, null);
          if (f) {
            off = ["left", "top", "right", "bottom"].reduce((o, k) => {
              if (["left", "right"].includes(k)) {
                o[k] += spritePos.position.x;
              } else {
                o[k] += spritePos.position.y;
              }
              return o;
            }, f.offset);
            $markerEl = $(
              `<div class="screen-marker" style="display: flex; justify-content: center; align-items: center; position: absolute; left: ${off.left}px; top: ${off.top}px; width: ${off.width}px; height: ${off.height}px; z-index: 2; pointer-events: none;">${icon}</div>`
            );
            link.appendChild($markerEl.get(0));
          }
        }
      });
    }
  }

  const { stash } = unsafeWindow.stash;

  stash.addEventListener("page:scene", function () {
    let btnGrp = ".ml-auto .btn-group";
    let wrapper = ".VideoPlayer .video-wrapper";
    waitForElm(wrapper).then(async ($el) => {
      const [_, scene_id] = getScenarioAndID();
      const spriteUrl = await getUrlSprite(scene_id);
      if (spriteUrl) {
        if (!document.querySelector("#screencaps")) {
          const screenCaps = document.createElement("div");
          const link = document.createElement("a");

          screenCaps.setAttribute("id", "screencaps");
          screenCaps.setAttribute(
            "style",
            `
            background: url(${spriteUrl}) no-repeat center center/contain;
            display: block;
            position: absolute;
            inset: 10px;
            z-index: 1;
            display: none;
            `
          );
          onSpriteHandler = function (e) {
            const mouseCoords = { x: e.offsetX, y: e.offsetY };
            bgImageSize(screenCaps, spriteUrl, (spritePos) => {
              getSelectedFrame(spriteUrl, spritePos, mouseCoords).then(
                (frame) => {
                  displayModal(frame);
                }
              );
            });
          };
          // link.setAttribute("href", spriteUrl);
          // link.setAttribute("target", "_screencap");
          link.setAttribute(
            "style",
            "display: block; background:transparent; position: absolute; top: 0px; left: 0px; bottom: 0px; right: 0px; cursor: pointer; z-index: 3;"
          );
          link.addEventListener("click", onSpriteHandler);
          screenCaps.appendChild(link);
          $el.prepend(screenCaps);
          waitForElm(btnGrp).then(async ($btnGrpEl) => {
            if (!document.querySelector("#scenecaps")) {
              const btn = document.createElement("button");
              btn.setAttribute("id", "scenecaps");
              btn.setAttribute("class", "minimal pr-1 btn btn-secondary");
              const spn = document.createElement("span");
              const svg = ui.templates.icons.clapper;
              spn.innerHTML = svg;
              btn.appendChild(spn);
              $btnGrpEl.prepend(btn);
              btn.addEventListener("click", function () {
                if (screenCaps.style.display === "none") {
                  screenCaps.style.display = "block";
                  if (link.querySelectorAll(".screen-marker").length === 0) {
                    annotateSprite(spriteUrl);
                  }
                } else {
                  screenCaps.style.display = "none";
                }
              });
            }
          });
        } else {
          const screenCaps = document.querySelector("#screencaps");
          const link = screenCaps.querySelector("a");
          screenCaps.style.backgroundImage = "url(" + spriteUrl + ")";
          link.innerHTML = "";
          link.removeEventListener("click", onSpriteHandler);
          onSpriteHandler = function (e) {
            const mouseCoords = { x: e.offsetX, y: e.offsetY };
            bgImageSize(screenCaps, spriteUrl, (spritePos) => {
              getSelectedFrame(spriteUrl, spritePos, mouseCoords).then(
                (frame) => {
                  displayModal(frame);
                }
              );
            });
          };
          link.addEventListener("click", onSpriteHandler);
        }
      } else {
        const screenCaps = document.querySelector("#screencaps");
        const btn = document.querySelector("#scenecaps");
        if (screenCaps) {
          const link = screenCaps.querySelector("a");
          link.removeEventListener("click", onSpriteHandler);
          screenCaps.remove();
        }
        if (btn) {
          btn.remove();
        }
      }
    });
  });

  stash.addEventListener("page:scene", onKeyPressSave);
  stash.addEventListener("page:image", onKeyPressSave);
})();
