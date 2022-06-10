import _ from "lodash";

declare global {
  interface Window {}
}

const main = async () => {
  const $app = document.querySelector("[data-app]");
  if ($app === null) {
    throw new Error("No app");
  }

  const $header = document.createElement("header");
  const $searchInput = document.createElement("input");
  $searchInput.type = "text";
  const $form = document.createElement("form");
  $form.appendChild($searchInput);
  $header.appendChild($form);
  const $main = document.createElement("main");

  $app.appendChild($header);
  $app.appendChild($main);
};

main().catch(console.error);
