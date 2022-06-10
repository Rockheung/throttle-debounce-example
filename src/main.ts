import _ from "lodash";

declare global {
  interface Window {}
}

const main = async () => {
  const $app = document.querySelector("[data-app]");
  if ($app === null) {
    throw new Error("No app");
  }
};

main().catch(console.error);
