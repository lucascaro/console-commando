import { stdio, MockReadable, MockWritable } from "stdio-mock";

export interface Restorable {
  restore: () => void;
}
export type MockStdin = MockReadable & Restorable;
export type MockStdout = MockWritable & Restorable;
export type MockStderr = MockWritable & Restorable;
export type MockInOut = MockStdin | MockStdout | MockStderr;

export interface MockStdio {
  mockStdin: MockStdin;
  mockStdout: MockStdout;
  mockStderr: MockStderr;
}

export function mockStdio(): MockStdio {
  return {
    mockStdin: mockStdin(),
    mockStdout: mockStdout(),
    mockStderr: mockStderr(),
  };
}

export function mockStdin(): MockStdin {
  const { stdin: mockStdin } = stdio();
  const { stdin } = process;
  Object.defineProperty(process, "stdin", {
    value: mockStdin,
    configurable: true,
    writable: false,
  });

  Object.defineProperty(mockStdin, "restore", {
    value: () =>
      Object.defineProperty(process, "stdin", {
        value: stdin,
        configurable: true,
        writable: false,
      }),
    configurable: true,
    writable: false,
  });
  return mockStdin as MockStdin;
}

export function mockStdout(): MockStdout {
  const { stdout: mockStdout } = stdio();
  const { stdout } = process;
  Object.defineProperty(process, "stdout", {
    value: mockStdout,
    configurable: true,
    writable: false,
  });

  Object.defineProperty(mockStdout, "restore", {
    value: () =>
      Object.defineProperty(process, "stdout", {
        value: stdout,
        configurable: true,
        writable: false,
      }),
    configurable: true,
    writable: false,
  });
  return mockStdout as MockStdout;
}

export function mockStderr(): MockStderr {
  const { stderr: mockStderr } = stdio();
  const { stderr } = process;
  Object.defineProperty(process, "stderr", {
    value: mockStderr,
    configurable: true,
    writable: false,
  });

  Object.defineProperty(mockStderr, "restore", {
    value: () =>
      Object.defineProperty(process, "stderr", {
        value: stderr,
        configurable: true,
        writable: false,
      }),
    configurable: true,
    writable: false,
  });
  return mockStderr as MockStderr;
}
