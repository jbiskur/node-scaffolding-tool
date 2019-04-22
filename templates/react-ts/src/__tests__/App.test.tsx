import * as React from "react";
import { render, cleanup } from "react-testing-library";
import App from "../App";

afterEach(cleanup);

describe("App", () => {
  it("should run without error", () => {
    const color = "Blue";
    const { getByText } = render(<App color={color} />);
    expect(getByText(/Blue/)).toBeInTheDocument();
  });
});
