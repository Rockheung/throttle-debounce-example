import app from "../src/app";

document.body.innerHTML = `<div data-app=""></div>`;

test("can mount app", async () => {
  expect(await app("[data-app]")).not.toBe(null);
});
