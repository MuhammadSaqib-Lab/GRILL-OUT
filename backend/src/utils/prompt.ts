import readline from "readline";
import type { Readable, Writable } from "stream";

/**
 * Minimal terminal prompts for operator scripts (no dependencies).
 *
 * `promptHidden` is for secrets: it puts the terminal in raw mode and reads
 * keystrokes itself, so the typed characters are never echoed by the terminal —
 * only a "*" per character is printed. The value is returned to the caller and
 * is never written anywhere by this module.
 */

export interface PromptIO {
  input: Readable & { isTTY?: boolean; setRawMode?: (mode: boolean) => unknown };
  output: Writable;
}

const defaultIO = (): PromptIO => ({ input: process.stdin, output: process.stdout });

export class PromptAborted extends Error {
  constructor() {
    super("Cancelled.");
  }
}

/** True when there is a real terminal on stdin, i.e. a person can type a hidden password. */
export function canPromptInteractively(io: PromptIO = defaultIO()): boolean {
  return Boolean(io.input.isTTY && typeof io.input.setRawMode === "function");
}

/** A normal (visible) line of input — fine for things like an email address. */
export function promptLine(question: string, io: PromptIO = defaultIO()): Promise<string> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({ input: io.input, output: io.output, terminal: Boolean(io.input.isTTY) });
    let answered = false;
    rl.on("close", () => {
      if (!answered) reject(new PromptAborted());
    });
    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      resolve(answer.trim());
    });
  });
}

/** A secret: nothing typed is echoed (a "*" is shown per character instead). */
export function promptHidden(question: string, io: PromptIO = defaultIO()): Promise<string> {
  const { input, output } = io;
  if (!canPromptInteractively(io)) {
    return Promise.reject(new Error("A hidden password prompt needs an interactive terminal."));
  }

  return new Promise((resolve, reject) => {
    let value = "";
    output.write(question);
    input.setRawMode?.(true);
    input.resume();
    input.setEncoding("utf8");

    const finish = (result: () => void) => {
      input.removeListener("data", onData);
      input.setRawMode?.(false);
      input.pause();
      output.write("\n");
      result();
    };

    const onData = (chunk: string) => {
      // A paste arrives as one chunk; walk it by code point so multi-byte
      // characters count as one and control keys are handled individually.
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish(() => resolve(value));
        if (ch === "\u0003" || ch === "\u0004") return finish(() => reject(new PromptAborted())); // Ctrl+C / Ctrl+D
        if (ch === "\u007f" || ch === "\b") {
          if (value.length > 0) {
            const removed = [...value].pop() as string;
            value = value.slice(0, value.length - removed.length);
            output.write("\b \b");
          }
          continue;
        }
        if (ch === "\u001b") return; // escape sequence (arrow keys etc.) — ignore the rest of this chunk
        if (ch < " ") continue; // other control characters
        value += ch;
        output.write("*");
      }
    };

    input.on("data", onData);
  });
}
