import _ from "lodash";

declare global {
  interface Window {}
}

const app = async ($parent: string) => {
  const $app = document.querySelector($parent);
  return $app;
};

app("[data-app]").catch(console.error);

export default app;
