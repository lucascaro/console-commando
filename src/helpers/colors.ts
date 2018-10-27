const RESET = '\x1b[0m';
const BRIGHT = '\x1b[1m';
const DIM = '\x1b[2m';
const UNDERSCORE = '\x1b[4m';
const BLINK = '\x1b[5m';
const REVERSE = '\x1b[7m';
const HIDDEN = '\x1b[8m';

const FGBLACK = '\x1b[30m';
const FGRED = '\x1b[31m';
const FGGREEN = '\x1b[32m';
const FGYELLOW = '\x1b[33m';
const FGBLUE = '\x1b[34m';
const FGMAGENTA = '\x1b[35m';
const FGCYAN = '\x1b[36m';
const FGWHITE = '\x1b[37m';

const BGBLACK = '\x1b[40m';
const BGRED = '\x1b[41m';
const BGGREEN = '\x1b[42m';
const BGYELLOW = '\x1b[43m';
const BGBLUE = '\x1b[44m';
const BGMAGENTA = '\x1b[45m';
const BGCYAN = '\x1b[46m';
const BGWHITE = '\x1b[47m';

export default {
  red(str: string): string {
    return `${FGRED}${str}${RESET}`;
  },

  yellow(str: string): string {
    return `${FGYELLOW}${str}${RESET}`;
  },

  green(str: string): string {
    return `${FGGREEN}${str}${RESET}`;
  },

  grey(str: string): string {
    return `${DIM}${str}${RESET}`;
  },
};
