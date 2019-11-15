export enum COLOR {
  RESET = "\x1b[0m",
  BRIGHT = "\x1b[1m",
  DIM = "\x1b[2m",
  UNDERSCORE = "\x1b[4m",
  BLINK = "\x1b[5m",
  REVERSE = "\x1b[7m",
  HIDDEN = "\x1b[8m",
  FGBLACK = "\x1b[30m",
  FGRED = "\x1b[31m",
  FGGREEN = "\x1b[32m",
  FGYELLOW = "\x1b[33m",
  FGBLUE = "\x1b[34m",
  FGMAGENTA = "\x1b[35m",
  FGCYAN = "\x1b[36m",
  FGWHITE = "\x1b[37m",
  BGBLACK = "\x1b[40m",
  BGRED = "\x1b[41m",
  BGGREEN = "\x1b[42m",
  BGYELLOW = "\x1b[43m",
  BGBLUE = "\x1b[44m",
  BGMAGENTA = "\x1b[45m",
  BGCYAN = "\x1b[46m",
  BGWHITE = "\x1b[47m",
}

function colorize(color: COLOR, str: string): string {
  return `${color}${str}${COLOR.RESET}`;
}

const blue = (str: string) => colorize(COLOR.FGBLUE, str);
const cyan = (str: string) => colorize(COLOR.FGCYAN, str);
const green = (str: string) => colorize(COLOR.FGGREEN, str);
const grey = (str: string) => colorize(COLOR.DIM, str);
const red = (str: string) => colorize(COLOR.FGRED, str);
const yellow = (str: string) => colorize(COLOR.FGYELLOW, str);

export default {
  COLOR,
  colorize,
  blue,
  cyan,
  green,
  grey,
  red,
  yellow,
};
