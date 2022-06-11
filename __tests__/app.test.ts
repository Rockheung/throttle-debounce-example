document.body.innerHTML = `<div data-app=""></div>`;

test("markup", () => {
  require("../src/app");
  expect(document.querySelector("header")).not.toBeNull();
});
