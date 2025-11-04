/// <reference types="mdast" />
import { h } from "hastscript";

/**
 * Creates a Steam Card component.
 *
 * @param {Object} properties - The properties of the component.
 * @param {string} properties.id - The Steam profile ID in the format "76561198887857717".
 * @param {import('mdast').RootContent[]} children - The children elements of the component.
 * @returns {import('mdast').Parent} The created Steam Card component.
 */
export function SteamCardComponent(properties, children) {
	// Check if children are provided (should be leaf directive)
	if (Array.isArray(children) && children.length !== 0)
		return h("div", { class: "hidden" }, [
			'Invalid directive. ("steam" directive must be leaf type "::steam{id="76561198887857717"}")',
		]);

	// Validate Steam ID format
	// if (!properties.id || !/^76561198[0-9]{10}$/.test(properties.id))
	// 	return h(
	// 		"div",
	// 		{ class: "hidden" },
	// 		'Invalid Steam ID. ("id" attribute must be a valid Steam ID in the format "76561198xxxxxxxxxx")',
	// 	);

	const steamId = properties.id;
	const cardUuid = `SC${Math.random().toString(36).slice(-6)}`; // Collisions are not important

	// Create avatar element
	const nAvatar = h(`div#${cardUuid}-avatar`, { class: "sc-avatar" });

	// Create name element
	const nUsername = h(
		`span#${cardUuid}-username`,
		{ class: "sc-username" },
		"Loading...",
	);

	// Create status element (block-level to appear below username)
	const nStatus = h(
		`div#${cardUuid}-status`,
		{ class: "sc-status" },
		"Loading...",
	);

	// Create title bar
	const nTitle = h("div", { class: "sc-titlebar" }, [
		h("div", { class: "sc-titlebar-left" }, [
			h("div", { class: "sc-user-info" }, [
				nAvatar,
				h("div", { class: "sc-user-details" }, [nUsername, nStatus]),
			]),
		]),
	]);

	// (description element removed)

	// Right-side game artwork (hidden until image is loaded)
	const nGameArt = h(`div#${cardUuid}-gameart`, { class: "sc-gameart" }, "");

	// Create game info element
	const nGameInfo = h(`div#${cardUuid}-gameinfo`, { class: "sc-gameinfo" }, "");

	// Create country flag element
	const nCountry = h(`div#${cardUuid}-country`, { class: "sc-country" }, "");

	// Create script to fetch and populate Steam data
	const nScript = h(
		`script#${cardUuid}-script`,
		{ type: "text/javascript", defer: true },
		`
      fetch('https://o.jk.sb/steam/profile/${steamId}', { referrerPolicy: "no-referrer" })
        .then(response => response.json())
        .then(data => {
          // Handle the data structure from the API
          const userData = data.data && data.data.length > 0 ? data.data[0] : null;
          
	        if (!userData) {
	            return;
	          }
          // Update username
          document.getElementById('${cardUuid}-username').innerText = userData.personaname || "Unknown User";
          
          // Update status
          const statusText = userData.personastate === 1 ? "Online" : 
                            userData.personastate === 2 ? "Busy" : 
                            userData.personastate === 3 ? "Away" : 
                            userData.personastate === 4 ? "Snooze" : 
                            userData.personastate === 5 ? "Looking to trade" : 
                            userData.personastate === 6 ? "Looking to play" : "Offline";
          document.getElementById('${cardUuid}-status').innerText = statusText;
          
          // Update avatar
          const avatarEl = document.getElementById('${cardUuid}-avatar');
          if (userData.avatarfull) {
            avatarEl.style.backgroundImage = 'url(' + userData.info.avatarUrl + ')';
            avatarEl.style.backgroundColor = 'transparent';
          }
          
          // Update game info if playing
          const gameInfoEl = document.getElementById('${cardUuid}-gameinfo');
          if (userData.gameextrainfo) {
            gameInfoEl.innerText = userData.gameextrainfo;
            gameInfoEl.style.display = 'block';
          }
          
	      // Update country info
          const countryEl = document.getElementById('${cardUuid}-country');
          if (userData.loccountrycode) {
            countryEl.innerText = userData.loccountrycode;
            countryEl.style.display = 'block';
          }
	          // Fetch and apply game artwork on the right side
          if (userData.gameid) {
            fetch('https://o.jk.sb/steam/imageurl2base64/' + userData.gameid, { referrerPolicy: "no-referrer" })
              .then(response => response.json())
              .then(imageData => {
                const artEl = document.getElementById('${cardUuid}-gameart');
                if (!artEl) return;
                let src = null;
                if (imageData && typeof imageData === 'object' && 'code' in imageData) {
                  if (imageData.code === 0 && imageData.data) {
                    src = 'data:image/jpeg;base64,' + imageData.data;
                  }
                } else if (typeof imageData === 'string') {
                  src = imageData;
                } else if (imageData) {
                  const base64 = imageData.data || imageData.base64 || imageData.image || imageData.result;
                  if (base64) src = 'data:image/jpeg;base64,' + base64;
                }
                if (src) {
                  artEl.style.backgroundImage = 'url(' + src + ')';
                  artEl.style.display = 'block';
                }
              })
              .catch(err => console.error('[STEAM-CARD] Error loading game image:', err));
          }
          // Remove loading class
          document.getElementById('${cardUuid}-card').classList.remove("fetch-waiting");
          console.log("[STEAM-CARD] Loaded card for " + userData.personaname + " | " + '${cardUuid}' + ".")
        })
        .catch(err => {
          console.error("[STEAM-CARD] Error loading profile:", err);
	          const card = document.getElementById('${cardUuid}-card');
	          card?.classList.add("fetch-error");
        });
    `,
	);

	// Return the complete card structure
	return h(
		`a#${cardUuid}-card`,
		{
			class: "card-steam fetch-waiting no-styling",
			href: `https://steamcommunity.com/profiles/${steamId}`,
			target: "_blank",
			rel: "noopener noreferrer",
			steamId,
		},
		[
			nGameArt,
			nTitle,
			h("div", { class: "sc-infobar" }, [nGameInfo, nCountry]),
			nScript,
		],
	);
}
