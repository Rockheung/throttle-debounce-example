import app from "../src/app";

test("can mount app", () => {
  expect(app("[data-app]")).not.toBe(null);
});
