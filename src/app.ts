import _ from "lodash";

declare global {
  interface Window {}
}

const app = async ($parent: string) => {
  const $app = document.querySelector($parent);
  if ($app) $app.innerHTML = `<header></header>`;
  return $app;
};

app("[data-app]").catch(console.error);

export default app;
