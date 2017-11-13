#!/usr/bin/env node
// Require the lib, get a working terminal
const term = require("terminal-kit").terminal;
const execa = require("execa");
const chalk = require("chalk");
const stripAnsi = require("strip-ansi");

// The term() function simply output a string to stdout, using current style
// output "Hello world!" in default terminal's colors

// term.fullscreen();
term.hideCursor();

const getColor = status => {
  const colorStatus = {
    "??": chalk.gray(status),
    "A ": chalk.green(status),
    MM: chalk.green(status[0]) + chalk.yellow(status[1]),
    AM: chalk.green(status[0]) + chalk.yellow(status[1]),
    "M ": chalk.green(status[0]) + " ",
    " M": " " + chalk.yellow(status[1]),
    " A": chalk.red(status),
    UU: chalk.red(status)
  };

  return colorStatus[status];
};

term.cyan("What do you want to watch?\n");

var items = ["status", "branch", "log"];

term.singleColumnMenu(items, function(error, response) {
  term.clear();

  setInterval(() => {
    term.moveTo(1, 1);
    term.green("Watching: " + response.selectedText + "\n");

    switch (response.selectedText) {
      case "log":
        const cmd =
          "git log " +
          `-${Math.round(term.height * 0.7)} ` +
          "--graph " +
          "--pretty='format:%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' " +
          "--abbrev-commit " +
          "--date=relative";

        execa.shell(cmd).then(result => {
          term.eraseDisplayBelow(result.stdout);
        });
        break;

      case "branch":
        execa.shell("git -c color.status=always branch").then(result => {
          term.eraseDisplayBelow(result.stdout);
        });
        break;

      case "status":
        execa.shell("git -c color.status=always status -s").then(result => {
          term.eraseDisplayBelow(result.stdout);
        });
        break;

      case "status":
        execa.shell("git status -s").then(result => {
          if (!result.stdout) {
            term.eraseDisplayBelow.green(
              "Nothing to commit, working tree clean"
            );
            return;
          }

          const text = stripAnsi(result.stdout);
          const lines = text.split("\n");

          lines.forEach(line => {
            const status = line.substr(0, 2);
            const path = line.substr(2);

            term.eraseDisplayBelow(getColor(status) + " " + path);

            term("\n");
          });
        });
    }
  }, 1e3);
});

term.grabInput();

term.on("key", function(name, matches, data) {
  // Detect CTRL-C and exit 'manually'
  if (name === "CTRL_C") {
    // term.fullscreen(false);
    term.hideCursor(false);

    process.exit();
  }
});
