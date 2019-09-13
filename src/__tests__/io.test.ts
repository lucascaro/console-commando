import { io } from "../index";
import { mockStdio } from "./mockstdio";

describe("io#ask", () => {
  it("can request input", done => {
    const { mockStdin, mockStdout } = mockStdio();

    io.ask("test?", "defval").then(answer => {
      expect(answer).toBe("yes");
      done();
    });
    mockStdin.write("yes\n");
    mockStdin.end();
    mockStdin.restore();
    mockStdout.restore();
  });
});
