console = chrome.extension.getBackgroundPage?.().console;

let currentLabels = [];

function createLabelButton(labelEl) {
  const label = labelEl.innerHTML;
  const button = document.createElement("button");
  button.innerHTML = label;
  button.addEventListener("click", () => {
    if (currentLabels.includes(label)) {
      currentLabels.push(label);
    } else {
      const index = currentLabels.findIndex(label);
      currentLabels = currentLabels.slice(index, 1);
    }
  });
  const element = document.createElement("li");
  element.append(button);
  console.log(element);

  document.getElementById("labels").append(element);
}

function loadLabels() {
  chrome.cookies.getAll(
    {
      domain: "atlassian.net",
      name: "cloud.session.token",
    },
    (c) => {
      let cloudSessionToken;
      if (Array.isArray(c)) {
        cloudSessionToken = c[0].value;
        chrome.tabs.query(
          { active: true, lastFocusedWindow: true },
          async (tabs) => {
            let url = new URL(tabs[0].url);
            const ticket = url.pathname.slice(
              url.pathname.lastIndexOf("/") + 1
            );
            const graphqlAPI = `https://1stdibs.atlassian.net/rest/graphql/1/`;
            const labelsQuery = {
              query: `query { issue(issueIdOrKey: "${ticket}", latestVersion: true, screen: "view") { id }}`,
            };
            const cookie = `cloud.session.token=${cloudSessionToken}`;

            let request;
            try {
              request = await fetch(graphqlAPI, {
                method: "POST",
                headers: {
                  cookie,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(labelsQuery),
              });
            } catch (e) {
              console.log("e: ", e);
            }
            //   const t = await request.json();
            const result = await request.json();
            const issueId = result?.data?.issue?.id;

            const labelURL = `https://1stdibs.atlassian.net/rest/api/1.0/labels/${issueId}/suggest?query=`;
            const labelsRequest = await fetch(labelURL, {
              headers: {
                cookie,
                "Content-Type": "application/json",
              },
            });
            const labelsXML = await labelsRequest.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(labelsXML, "text/xml");
            const labels = xmlDoc.getElementsByTagName("label");
            console.log(labels);
            Array.prototype.map.call(labels, createLabelButton);
          }
        );
      }
    }
  );
}
loadLabels();

function test() {
  const cookies = [];
  //   chrome.cookies.set({ name: "test", value: "this is a cookie" });

  chrome.cookies.getAll(
    {
      // name: "cloud.session.token",
      //   name: "ajs_anonymous_id",
      //   url: "https://1stdibs.atlassian.net",
      domain: "atlassian.net",
      name: "cloud.session.token",
    },
    (c) => {
      let cloudSessionToken;
      if (Array.isArray(c)) {
        cloudSessionToken = c[0].value;
        chrome.tabs.query(
          { active: true, lastFocusedWindow: true },
          async (tabs) => {
            let url = new URL(tabs[0].url);
            const ticket = url.pathname.slice(
              url.pathname.lastIndexOf("/") + 1
            );
            const api = `https://1stdibs.atlassian.net/rest/api/2/issue/${ticket}`;
            const cookie = `cloud.session.token=${cloudSessionToken}`;

            let request;
            try {
              request = await fetch(api, {
                method: "PUT",
                headers: {
                  cookie,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  fields: { labels: ["app-buyer-finding"] },
                }),
              });
            } catch (e) {
              console.log("e: ", e);
            }
            //   const t = await request.json();
            console.log("request: ", request);
          }
        );
      }
    }
  );

  //   chrome.cookies.getAllCookieStores((c) => console.log(c));
  //   console.log(cookies);
  //   if (!cookies.length) {
  //     const element = document
  //       .createElement("li")
  //       .appendChild(document.createTextNode("No cookies"));
  //     document.getElementById("cookies").append(element);
  //   } else {
  //     cookies.forEach((c) => {
  //       const element = document
  //         .createElement("li")
  //         .append(document.createTextNode(c));
  //       document.getElementById("cookies").append(element);
  //     });
  //   }
}

document.getElementById("submit").addEventListener("click", test);
