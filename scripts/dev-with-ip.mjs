import { networkInterfaces } from "os";
import { spawn } from "child_process";

const reset = "\x1b[0m";
const bold = "\x1b[1m";
const dim = "\x1b[2m";
const green = "\x1b[32m";
const cyan = "\x1b[36m";
const yellow = "\x1b[33m";
const magenta = "\x1b[35m";
const blue = "\x1b[34m";
const white = "\x1b[37m";
const bgGreen = "\x1b[42m";
const black = "\x1b[30m";

function getNetworkIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const ip = getNetworkIP();
const port = process.env.PORT || 3000;

console.log("");
console.log(`  ${dim}${"─".repeat(48)}${reset}`);
console.log(`  ${bold}${magenta}SOCO${reset} ${dim}Development Server${reset}`);
console.log(`  ${dim}${"─".repeat(48)}${reset}`);
console.log("");
console.log(`  ${bold}${green}Local:${reset}     ${cyan}http://localhost:${port}${reset}`);
if (ip) {
  console.log(`  ${bold}${green}Network:${reset}   ${cyan}http://${ip}:${port}${reset}`);
}
console.log("");
console.log(`  ${dim}Press${reset} ${bold}Ctrl+C${reset} ${dim}to stop the server${reset}`);
console.log(`  ${dim}${"─".repeat(48)}${reset}`);
console.log("");

const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", String(port)], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
});

function transformOutput(data) {
  let text = data.toString();

  // Hide Next.js default Local/Network lines since we print our own
  if (/- Local:\s+http:\/\/localhost/.test(text) || /- Network:\s+http:\/\/0\.0\.0\.0/.test(text)) {
    text = text.replace(/- Local:\s+http:\/\/localhost:\d+\n?/g, "");
    text = text.replace(/- Network:\s+http:\/\/0\.0\.0\.0:\d+\n?/g, "");
  }

  // Colorize Next.js status messages
  text = text.replace(/✓ Ready in (\d+ms)/g, `${bold}${green}✓ Ready in $1${reset}`);
  text = text.replace(/✓ Starting\.\.\./g, `${bold}${green}✓ Starting...${reset}`);
  text = text.replace(/▲ Next\.js ([\d.]+)/g, `${bold}${white}▲ Next.js $1${reset}`);
  text = text.replace(/\(Turbopack\)/g, `${bold}${yellow}(Turbopack)${reset}`);

  // Colorize HTTP methods and status codes
  text = text.replace(/ (GET|POST|PUT|DELETE|PATCH) /g, (_, method) => {
    const colors = { GET: green, POST: blue, PUT: yellow, DELETE: "\x1b[31m", PATCH: magenta };
    return ` ${bold}${colors[method] || white}${method}${reset} `;
  });
  text = text.replace(/ (2\d{2}) /g, ` ${green}$1${reset} `);
  text = text.replace(/ (3\d{2}) /g, ` ${cyan}$1${reset} `);
  text = text.replace(/ (4\d{2}) /g, ` ${yellow}$1${reset} `);
  text = text.replace(/ (5\d{2}) /g, ` \x1b[31m$1${reset} `);

  // Colorize timing info
  text = text.replace(/in (\d+ms)/g, `in ${dim}$1${reset}`);
  text = text.replace(/\(compile: (\d+ms), render: (\d+ms)\)/g,
    `${dim}(compile: $1, render: $2)${reset}`);

  return text;
}

child.stdout.on("data", (data) => process.stdout.write(transformOutput(data)));
child.stderr.on("data", (data) => process.stderr.write(transformOutput(data)));
child.on("exit", (code) => process.exit(code));
