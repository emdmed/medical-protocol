#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// packages/medical-protocol/node_modules/commander/lib/error.js
var require_error = __commonJS({
  "packages/medical-protocol/node_modules/commander/lib/error.js"(exports2) {
    "use strict";
    var CommanderError2 = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {number} exitCode suggested exit code which could be used with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
        this.nestedError = void 0;
      }
    };
    var InvalidArgumentError2 = class extends CommanderError2 {
      /**
       * Constructs the InvalidArgumentError class
       * @param {string} [message] explanation of why argument is invalid
       */
      constructor(message) {
        super(1, "commander.invalidArgument", message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
      }
    };
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
  }
});

// packages/medical-protocol/node_modules/commander/lib/argument.js
var require_argument = __commonJS({
  "packages/medical-protocol/node_modules/commander/lib/argument.js"(exports2) {
    "use strict";
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Argument2 = class {
      /**
       * Initialize a new command argument with the given name and description.
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @param {string} name
       * @param {string} [description]
       */
      constructor(name, description) {
        this.description = description || "";
        this.variadic = false;
        this.parseArg = void 0;
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.argChoices = void 0;
        switch (name[0]) {
          case "<":
            this.required = true;
            this._name = name.slice(1, -1);
            break;
          case "[":
            this.required = false;
            this._name = name.slice(1, -1);
            break;
          default:
            this.required = true;
            this._name = name;
            break;
        }
        if (this._name.endsWith("...")) {
          this.variadic = true;
          this._name = this._name.slice(0, -3);
        }
      }
      /**
       * Return argument name.
       *
       * @return {string}
       */
      name() {
        return this._name;
      }
      /**
       * @package
       */
      _collectValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        previous.push(value);
        return previous;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Argument}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Set the custom handler for processing CLI command arguments into argument values.
       *
       * @param {Function} [fn]
       * @return {Argument}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Only allow argument value to be one of choices.
       *
       * @param {string[]} values
       * @return {Argument}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._collectValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Make argument required.
       *
       * @returns {Argument}
       */
      argRequired() {
        this.required = true;
        return this;
      }
      /**
       * Make argument optional.
       *
       * @returns {Argument}
       */
      argOptional() {
        this.required = false;
        return this;
      }
    };
    function humanReadableArgName(arg) {
      const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    exports2.Argument = Argument2;
    exports2.humanReadableArgName = humanReadableArgName;
  }
});

// packages/medical-protocol/node_modules/commander/lib/help.js
var require_help = __commonJS({
  "packages/medical-protocol/node_modules/commander/lib/help.js"(exports2) {
    "use strict";
    var { humanReadableArgName } = require_argument();
    var Help2 = class {
      constructor() {
        this.helpWidth = void 0;
        this.minWidthToWrap = 40;
        this.sortSubcommands = false;
        this.sortOptions = false;
        this.showGlobalOptions = false;
      }
      /**
       * prepareContext is called by Commander after applying overrides from `Command.configureHelp()`
       * and just before calling `formatHelp()`.
       *
       * Commander just uses the helpWidth and the rest is provided for optional use by more complex subclasses.
       *
       * @param {{ error?: boolean, helpWidth?: number, outputHasColors?: boolean }} contextOptions
       */
      prepareContext(contextOptions) {
        this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
      }
      /**
       * Get an array of the visible subcommands. Includes a placeholder for the implicit help command, if there is one.
       *
       * @param {Command} cmd
       * @returns {Command[]}
       */
      visibleCommands(cmd) {
        const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
        const helpCommand = cmd._getHelpCommand();
        if (helpCommand && !helpCommand._hidden) {
          visibleCommands.push(helpCommand);
        }
        if (this.sortSubcommands) {
          visibleCommands.sort((a, b) => {
            return a.name().localeCompare(b.name());
          });
        }
        return visibleCommands;
      }
      /**
       * Compare options for sort.
       *
       * @param {Option} a
       * @param {Option} b
       * @returns {number}
       */
      compareOptions(a, b) {
        const getSortKey = (option) => {
          return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
        };
        return getSortKey(a).localeCompare(getSortKey(b));
      }
      /**
       * Get an array of the visible options. Includes a placeholder for the implicit help option, if there is one.
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleOptions(cmd) {
        const visibleOptions = cmd.options.filter((option) => !option.hidden);
        const helpOption = cmd._getHelpOption();
        if (helpOption && !helpOption.hidden) {
          const removeShort = helpOption.short && cmd._findOption(helpOption.short);
          const removeLong = helpOption.long && cmd._findOption(helpOption.long);
          if (!removeShort && !removeLong) {
            visibleOptions.push(helpOption);
          } else if (helpOption.long && !removeLong) {
            visibleOptions.push(
              cmd.createOption(helpOption.long, helpOption.description)
            );
          } else if (helpOption.short && !removeShort) {
            visibleOptions.push(
              cmd.createOption(helpOption.short, helpOption.description)
            );
          }
        }
        if (this.sortOptions) {
          visibleOptions.sort(this.compareOptions);
        }
        return visibleOptions;
      }
      /**
       * Get an array of the visible global options. (Not including help.)
       *
       * @param {Command} cmd
       * @returns {Option[]}
       */
      visibleGlobalOptions(cmd) {
        if (!this.showGlobalOptions) return [];
        const globalOptions = [];
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          const visibleOptions = ancestorCmd.options.filter(
            (option) => !option.hidden
          );
          globalOptions.push(...visibleOptions);
        }
        if (this.sortOptions) {
          globalOptions.sort(this.compareOptions);
        }
        return globalOptions;
      }
      /**
       * Get an array of the arguments if any have a description.
       *
       * @param {Command} cmd
       * @returns {Argument[]}
       */
      visibleArguments(cmd) {
        if (cmd._argsDescription) {
          cmd.registeredArguments.forEach((argument) => {
            argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
          });
        }
        if (cmd.registeredArguments.find((argument) => argument.description)) {
          return cmd.registeredArguments;
        }
        return [];
      }
      /**
       * Get the command term to show in the list of subcommands.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandTerm(cmd) {
        const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
        return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + // simplistic check for non-help option
        (args ? " " + args : "");
      }
      /**
       * Get the option term to show in the list of options.
       *
       * @param {Option} option
       * @returns {string}
       */
      optionTerm(option) {
        return option.flags;
      }
      /**
       * Get the argument term to show in the list of arguments.
       *
       * @param {Argument} argument
       * @returns {string}
       */
      argumentTerm(argument) {
        return argument.name();
      }
      /**
       * Get the longest command term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestSubcommandTermLength(cmd, helper) {
        return helper.visibleCommands(cmd).reduce((max, command) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleSubcommandTerm(helper.subcommandTerm(command))
            )
          );
        }, 0);
      }
      /**
       * Get the longest option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestOptionTermLength(cmd, helper) {
        return helper.visibleOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest global option term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestGlobalOptionTermLength(cmd, helper) {
        return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
          return Math.max(
            max,
            this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option)))
          );
        }, 0);
      }
      /**
       * Get the longest argument term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      longestArgumentTermLength(cmd, helper) {
        return helper.visibleArguments(cmd).reduce((max, argument) => {
          return Math.max(
            max,
            this.displayWidth(
              helper.styleArgumentTerm(helper.argumentTerm(argument))
            )
          );
        }, 0);
      }
      /**
       * Get the command usage to be displayed at the top of the built-in help.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandUsage(cmd) {
        let cmdName = cmd._name;
        if (cmd._aliases[0]) {
          cmdName = cmdName + "|" + cmd._aliases[0];
        }
        let ancestorCmdNames = "";
        for (let ancestorCmd = cmd.parent; ancestorCmd; ancestorCmd = ancestorCmd.parent) {
          ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
        }
        return ancestorCmdNames + cmdName + " " + cmd.usage();
      }
      /**
       * Get the description for the command.
       *
       * @param {Command} cmd
       * @returns {string}
       */
      commandDescription(cmd) {
        return cmd.description();
      }
      /**
       * Get the subcommand summary to show in the list of subcommands.
       * (Fallback to description for backwards compatibility.)
       *
       * @param {Command} cmd
       * @returns {string}
       */
      subcommandDescription(cmd) {
        return cmd.summary() || cmd.description();
      }
      /**
       * Get the option description to show in the list of options.
       *
       * @param {Option} option
       * @return {string}
       */
      optionDescription(option) {
        const extraInfo = [];
        if (option.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (option.defaultValue !== void 0) {
          const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
          if (showDefault) {
            extraInfo.push(
              `default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`
            );
          }
        }
        if (option.presetArg !== void 0 && option.optional) {
          extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
        }
        if (option.envVar !== void 0) {
          extraInfo.push(`env: ${option.envVar}`);
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (option.description) {
            return `${option.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return option.description;
      }
      /**
       * Get the argument description to show in the list of arguments.
       *
       * @param {Argument} argument
       * @return {string}
       */
      argumentDescription(argument) {
        const extraInfo = [];
        if (argument.argChoices) {
          extraInfo.push(
            // use stringify to match the display of the default value
            `choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`
          );
        }
        if (argument.defaultValue !== void 0) {
          extraInfo.push(
            `default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`
          );
        }
        if (extraInfo.length > 0) {
          const extraDescription = `(${extraInfo.join(", ")})`;
          if (argument.description) {
            return `${argument.description} ${extraDescription}`;
          }
          return extraDescription;
        }
        return argument.description;
      }
      /**
       * Format a list of items, given a heading and an array of formatted items.
       *
       * @param {string} heading
       * @param {string[]} items
       * @param {Help} helper
       * @returns string[]
       */
      formatItemList(heading, items, helper) {
        if (items.length === 0) return [];
        return [helper.styleTitle(heading), ...items, ""];
      }
      /**
       * Group items by their help group heading.
       *
       * @param {Command[] | Option[]} unsortedItems
       * @param {Command[] | Option[]} visibleItems
       * @param {Function} getGroup
       * @returns {Map<string, Command[] | Option[]>}
       */
      groupItems(unsortedItems, visibleItems, getGroup) {
        const result = /* @__PURE__ */ new Map();
        unsortedItems.forEach((item) => {
          const group = getGroup(item);
          if (!result.has(group)) result.set(group, []);
        });
        visibleItems.forEach((item) => {
          const group = getGroup(item);
          if (!result.has(group)) {
            result.set(group, []);
          }
          result.get(group).push(item);
        });
        return result;
      }
      /**
       * Generate the built-in help text.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {string}
       */
      formatHelp(cmd, helper) {
        const termWidth = helper.padWidth(cmd, helper);
        const helpWidth = helper.helpWidth ?? 80;
        function callFormatItem(term, description) {
          return helper.formatItem(term, termWidth, description, helper);
        }
        let output = [
          `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
          ""
        ];
        const commandDescription = helper.commandDescription(cmd);
        if (commandDescription.length > 0) {
          output = output.concat([
            helper.boxWrap(
              helper.styleCommandDescription(commandDescription),
              helpWidth
            ),
            ""
          ]);
        }
        const argumentList = helper.visibleArguments(cmd).map((argument) => {
          return callFormatItem(
            helper.styleArgumentTerm(helper.argumentTerm(argument)),
            helper.styleArgumentDescription(helper.argumentDescription(argument))
          );
        });
        output = output.concat(
          this.formatItemList("Arguments:", argumentList, helper)
        );
        const optionGroups = this.groupItems(
          cmd.options,
          helper.visibleOptions(cmd),
          (option) => option.helpGroupHeading ?? "Options:"
        );
        optionGroups.forEach((options, group) => {
          const optionList = options.map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          output = output.concat(this.formatItemList(group, optionList, helper));
        });
        if (helper.showGlobalOptions) {
          const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
            return callFormatItem(
              helper.styleOptionTerm(helper.optionTerm(option)),
              helper.styleOptionDescription(helper.optionDescription(option))
            );
          });
          output = output.concat(
            this.formatItemList("Global Options:", globalOptionList, helper)
          );
        }
        const commandGroups = this.groupItems(
          cmd.commands,
          helper.visibleCommands(cmd),
          (sub) => sub.helpGroup() || "Commands:"
        );
        commandGroups.forEach((commands, group) => {
          const commandList = commands.map((sub) => {
            return callFormatItem(
              helper.styleSubcommandTerm(helper.subcommandTerm(sub)),
              helper.styleSubcommandDescription(helper.subcommandDescription(sub))
            );
          });
          output = output.concat(this.formatItemList(group, commandList, helper));
        });
        return output.join("\n");
      }
      /**
       * Return display width of string, ignoring ANSI escape sequences. Used in padding and wrapping calculations.
       *
       * @param {string} str
       * @returns {number}
       */
      displayWidth(str) {
        return stripColor(str).length;
      }
      /**
       * Style the title for displaying in the help. Called with 'Usage:', 'Options:', etc.
       *
       * @param {string} str
       * @returns {string}
       */
      styleTitle(str) {
        return str;
      }
      styleUsage(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word === "[command]") return this.styleSubcommandText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleCommandText(word);
        }).join(" ");
      }
      styleCommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleOptionDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleSubcommandDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleArgumentDescription(str) {
        return this.styleDescriptionText(str);
      }
      styleDescriptionText(str) {
        return str;
      }
      styleOptionTerm(str) {
        return this.styleOptionText(str);
      }
      styleSubcommandTerm(str) {
        return str.split(" ").map((word) => {
          if (word === "[options]") return this.styleOptionText(word);
          if (word[0] === "[" || word[0] === "<")
            return this.styleArgumentText(word);
          return this.styleSubcommandText(word);
        }).join(" ");
      }
      styleArgumentTerm(str) {
        return this.styleArgumentText(str);
      }
      styleOptionText(str) {
        return str;
      }
      styleArgumentText(str) {
        return str;
      }
      styleSubcommandText(str) {
        return str;
      }
      styleCommandText(str) {
        return str;
      }
      /**
       * Calculate the pad width from the maximum term length.
       *
       * @param {Command} cmd
       * @param {Help} helper
       * @returns {number}
       */
      padWidth(cmd, helper) {
        return Math.max(
          helper.longestOptionTermLength(cmd, helper),
          helper.longestGlobalOptionTermLength(cmd, helper),
          helper.longestSubcommandTermLength(cmd, helper),
          helper.longestArgumentTermLength(cmd, helper)
        );
      }
      /**
       * Detect manually wrapped and indented strings by checking for line break followed by whitespace.
       *
       * @param {string} str
       * @returns {boolean}
       */
      preformatted(str) {
        return /\n[^\S\r\n]/.test(str);
      }
      /**
       * Format the "item", which consists of a term and description. Pad the term and wrap the description, indenting the following lines.
       *
       * So "TTT", 5, "DDD DDDD DD DDD" might be formatted for this.helpWidth=17 like so:
       *   TTT  DDD DDDD
       *        DD DDD
       *
       * @param {string} term
       * @param {number} termWidth
       * @param {string} description
       * @param {Help} helper
       * @returns {string}
       */
      formatItem(term, termWidth, description, helper) {
        const itemIndent = 2;
        const itemIndentStr = " ".repeat(itemIndent);
        if (!description) return itemIndentStr + term;
        const paddedTerm = term.padEnd(
          termWidth + term.length - helper.displayWidth(term)
        );
        const spacerWidth = 2;
        const helpWidth = this.helpWidth ?? 80;
        const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
        let formattedDescription;
        if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
          formattedDescription = description;
        } else {
          const wrappedDescription = helper.boxWrap(description, remainingWidth);
          formattedDescription = wrappedDescription.replace(
            /\n/g,
            "\n" + " ".repeat(termWidth + spacerWidth)
          );
        }
        return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
      }
      /**
       * Wrap a string at whitespace, preserving existing line breaks.
       * Wrapping is skipped if the width is less than `minWidthToWrap`.
       *
       * @param {string} str
       * @param {number} width
       * @returns {string}
       */
      boxWrap(str, width) {
        if (width < this.minWidthToWrap) return str;
        const rawLines = str.split(/\r\n|\n/);
        const chunkPattern = /[\s]*[^\s]+/g;
        const wrappedLines = [];
        rawLines.forEach((line) => {
          const chunks = line.match(chunkPattern);
          if (chunks === null) {
            wrappedLines.push("");
            return;
          }
          let sumChunks = [chunks.shift()];
          let sumWidth = this.displayWidth(sumChunks[0]);
          chunks.forEach((chunk) => {
            const visibleWidth = this.displayWidth(chunk);
            if (sumWidth + visibleWidth <= width) {
              sumChunks.push(chunk);
              sumWidth += visibleWidth;
              return;
            }
            wrappedLines.push(sumChunks.join(""));
            const nextChunk = chunk.trimStart();
            sumChunks = [nextChunk];
            sumWidth = this.displayWidth(nextChunk);
          });
          wrappedLines.push(sumChunks.join(""));
        });
        return wrappedLines.join("\n");
      }
    };
    function stripColor(str) {
      const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
      return str.replace(sgrPattern, "");
    }
    exports2.Help = Help2;
    exports2.stripColor = stripColor;
  }
});

// packages/medical-protocol/node_modules/commander/lib/option.js
var require_option = __commonJS({
  "packages/medical-protocol/node_modules/commander/lib/option.js"(exports2) {
    "use strict";
    var { InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var Option2 = class {
      /**
       * Initialize a new `Option` with the given `flags` and `description`.
       *
       * @param {string} flags
       * @param {string} [description]
       */
      constructor(flags, description) {
        this.flags = flags;
        this.description = description || "";
        this.required = flags.includes("<");
        this.optional = flags.includes("[");
        this.variadic = /\w\.\.\.[>\]]$/.test(flags);
        this.mandatory = false;
        const optionFlags = splitOptionFlags(flags);
        this.short = optionFlags.shortFlag;
        this.long = optionFlags.longFlag;
        this.negate = false;
        if (this.long) {
          this.negate = this.long.startsWith("--no-");
        }
        this.defaultValue = void 0;
        this.defaultValueDescription = void 0;
        this.presetArg = void 0;
        this.envVar = void 0;
        this.parseArg = void 0;
        this.hidden = false;
        this.argChoices = void 0;
        this.conflictsWith = [];
        this.implied = void 0;
        this.helpGroupHeading = void 0;
      }
      /**
       * Set the default value, and optionally supply the description to be displayed in the help.
       *
       * @param {*} value
       * @param {string} [description]
       * @return {Option}
       */
      default(value, description) {
        this.defaultValue = value;
        this.defaultValueDescription = description;
        return this;
      }
      /**
       * Preset to use when option used without option-argument, especially optional but also boolean and negated.
       * The custom processing (parseArg) is called.
       *
       * @example
       * new Option('--color').default('GREYSCALE').preset('RGB');
       * new Option('--donate [amount]').preset('20').argParser(parseFloat);
       *
       * @param {*} arg
       * @return {Option}
       */
      preset(arg) {
        this.presetArg = arg;
        return this;
      }
      /**
       * Add option name(s) that conflict with this option.
       * An error will be displayed if conflicting options are found during parsing.
       *
       * @example
       * new Option('--rgb').conflicts('cmyk');
       * new Option('--js').conflicts(['ts', 'jsx']);
       *
       * @param {(string | string[])} names
       * @return {Option}
       */
      conflicts(names) {
        this.conflictsWith = this.conflictsWith.concat(names);
        return this;
      }
      /**
       * Specify implied option values for when this option is set and the implied options are not.
       *
       * The custom processing (parseArg) is not called on the implied values.
       *
       * @example
       * program
       *   .addOption(new Option('--log', 'write logging information to file'))
       *   .addOption(new Option('--trace', 'log extra details').implies({ log: 'trace.txt' }));
       *
       * @param {object} impliedOptionValues
       * @return {Option}
       */
      implies(impliedOptionValues) {
        let newImplied = impliedOptionValues;
        if (typeof impliedOptionValues === "string") {
          newImplied = { [impliedOptionValues]: true };
        }
        this.implied = Object.assign(this.implied || {}, newImplied);
        return this;
      }
      /**
       * Set environment variable to check for option value.
       *
       * An environment variable is only used if when processed the current option value is
       * undefined, or the source of the current value is 'default' or 'config' or 'env'.
       *
       * @param {string} name
       * @return {Option}
       */
      env(name) {
        this.envVar = name;
        return this;
      }
      /**
       * Set the custom handler for processing CLI option arguments into option values.
       *
       * @param {Function} [fn]
       * @return {Option}
       */
      argParser(fn) {
        this.parseArg = fn;
        return this;
      }
      /**
       * Whether the option is mandatory and must have a value after parsing.
       *
       * @param {boolean} [mandatory=true]
       * @return {Option}
       */
      makeOptionMandatory(mandatory = true) {
        this.mandatory = !!mandatory;
        return this;
      }
      /**
       * Hide option in help.
       *
       * @param {boolean} [hide=true]
       * @return {Option}
       */
      hideHelp(hide = true) {
        this.hidden = !!hide;
        return this;
      }
      /**
       * @package
       */
      _collectValue(value, previous) {
        if (previous === this.defaultValue || !Array.isArray(previous)) {
          return [value];
        }
        previous.push(value);
        return previous;
      }
      /**
       * Only allow option value to be one of choices.
       *
       * @param {string[]} values
       * @return {Option}
       */
      choices(values) {
        this.argChoices = values.slice();
        this.parseArg = (arg, previous) => {
          if (!this.argChoices.includes(arg)) {
            throw new InvalidArgumentError2(
              `Allowed choices are ${this.argChoices.join(", ")}.`
            );
          }
          if (this.variadic) {
            return this._collectValue(arg, previous);
          }
          return arg;
        };
        return this;
      }
      /**
       * Return option name.
       *
       * @return {string}
       */
      name() {
        if (this.long) {
          return this.long.replace(/^--/, "");
        }
        return this.short.replace(/^-/, "");
      }
      /**
       * Return option name, in a camelcase format that can be used
       * as an object attribute key.
       *
       * @return {string}
       */
      attributeName() {
        if (this.negate) {
          return camelcase(this.name().replace(/^no-/, ""));
        }
        return camelcase(this.name());
      }
      /**
       * Set the help group heading.
       *
       * @param {string} heading
       * @return {Option}
       */
      helpGroup(heading) {
        this.helpGroupHeading = heading;
        return this;
      }
      /**
       * Check if `arg` matches the short or long flag.
       *
       * @param {string} arg
       * @return {boolean}
       * @package
       */
      is(arg) {
        return this.short === arg || this.long === arg;
      }
      /**
       * Return whether a boolean option.
       *
       * Options are one of boolean, negated, required argument, or optional argument.
       *
       * @return {boolean}
       * @package
       */
      isBoolean() {
        return !this.required && !this.optional && !this.negate;
      }
    };
    var DualOptions = class {
      /**
       * @param {Option[]} options
       */
      constructor(options) {
        this.positiveOptions = /* @__PURE__ */ new Map();
        this.negativeOptions = /* @__PURE__ */ new Map();
        this.dualOptions = /* @__PURE__ */ new Set();
        options.forEach((option) => {
          if (option.negate) {
            this.negativeOptions.set(option.attributeName(), option);
          } else {
            this.positiveOptions.set(option.attributeName(), option);
          }
        });
        this.negativeOptions.forEach((value, key) => {
          if (this.positiveOptions.has(key)) {
            this.dualOptions.add(key);
          }
        });
      }
      /**
       * Did the value come from the option, and not from possible matching dual option?
       *
       * @param {*} value
       * @param {Option} option
       * @returns {boolean}
       */
      valueFromOption(value, option) {
        const optionKey = option.attributeName();
        if (!this.dualOptions.has(optionKey)) return true;
        const preset = this.negativeOptions.get(optionKey).presetArg;
        const negativeValue = preset !== void 0 ? preset : false;
        return option.negate === (negativeValue === value);
      }
    };
    function camelcase(str) {
      return str.split("-").reduce((str2, word) => {
        return str2 + word[0].toUpperCase() + word.slice(1);
      });
    }
    function splitOptionFlags(flags) {
      let shortFlag;
      let longFlag;
      const shortFlagExp = /^-[^-]$/;
      const longFlagExp = /^--[^-]/;
      const flagParts = flags.split(/[ |,]+/).concat("guard");
      if (shortFlagExp.test(flagParts[0])) shortFlag = flagParts.shift();
      if (longFlagExp.test(flagParts[0])) longFlag = flagParts.shift();
      if (!shortFlag && shortFlagExp.test(flagParts[0]))
        shortFlag = flagParts.shift();
      if (!shortFlag && longFlagExp.test(flagParts[0])) {
        shortFlag = longFlag;
        longFlag = flagParts.shift();
      }
      if (flagParts[0].startsWith("-")) {
        const unsupportedFlag = flagParts[0];
        const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
        if (/^-[^-][^-]/.test(unsupportedFlag))
          throw new Error(
            `${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`
          );
        if (shortFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many short flags`);
        if (longFlagExp.test(unsupportedFlag))
          throw new Error(`${baseError}
- too many long flags`);
        throw new Error(`${baseError}
- unrecognised flag format`);
      }
      if (shortFlag === void 0 && longFlag === void 0)
        throw new Error(
          `option creation failed due to no flags found in '${flags}'.`
        );
      return { shortFlag, longFlag };
    }
    exports2.Option = Option2;
    exports2.DualOptions = DualOptions;
  }
});

// packages/medical-protocol/node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS({
  "packages/medical-protocol/node_modules/commander/lib/suggestSimilar.js"(exports2) {
    "use strict";
    var maxDistance = 3;
    function editDistance(a, b) {
      if (Math.abs(a.length - b.length) > maxDistance)
        return Math.max(a.length, b.length);
      const d3 = [];
      for (let i = 0; i <= a.length; i++) {
        d3[i] = [i];
      }
      for (let j2 = 0; j2 <= b.length; j2++) {
        d3[0][j2] = j2;
      }
      for (let j2 = 1; j2 <= b.length; j2++) {
        for (let i = 1; i <= a.length; i++) {
          let cost = 1;
          if (a[i - 1] === b[j2 - 1]) {
            cost = 0;
          } else {
            cost = 1;
          }
          d3[i][j2] = Math.min(
            d3[i - 1][j2] + 1,
            // deletion
            d3[i][j2 - 1] + 1,
            // insertion
            d3[i - 1][j2 - 1] + cost
            // substitution
          );
          if (i > 1 && j2 > 1 && a[i - 1] === b[j2 - 2] && a[i - 2] === b[j2 - 1]) {
            d3[i][j2] = Math.min(d3[i][j2], d3[i - 2][j2 - 2] + 1);
          }
        }
      }
      return d3[a.length][b.length];
    }
    function suggestSimilar(word, candidates) {
      if (!candidates || candidates.length === 0) return "";
      candidates = Array.from(new Set(candidates));
      const searchingOptions = word.startsWith("--");
      if (searchingOptions) {
        word = word.slice(2);
        candidates = candidates.map((candidate) => candidate.slice(2));
      }
      let similar = [];
      let bestDistance = maxDistance;
      const minSimilarity = 0.4;
      candidates.forEach((candidate) => {
        if (candidate.length <= 1) return;
        const distance = editDistance(word, candidate);
        const length = Math.max(word.length, candidate.length);
        const similarity = (length - distance) / length;
        if (similarity > minSimilarity) {
          if (distance < bestDistance) {
            bestDistance = distance;
            similar = [candidate];
          } else if (distance === bestDistance) {
            similar.push(candidate);
          }
        }
      });
      similar.sort((a, b) => a.localeCompare(b));
      if (searchingOptions) {
        similar = similar.map((candidate) => `--${candidate}`);
      }
      if (similar.length > 1) {
        return `
(Did you mean one of ${similar.join(", ")}?)`;
      }
      if (similar.length === 1) {
        return `
(Did you mean ${similar[0]}?)`;
      }
      return "";
    }
    exports2.suggestSimilar = suggestSimilar;
  }
});

// packages/medical-protocol/node_modules/commander/lib/command.js
var require_command = __commonJS({
  "packages/medical-protocol/node_modules/commander/lib/command.js"(exports2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var childProcess = require("child_process");
    var path7 = require("path");
    var fs7 = require("fs");
    var process2 = require("process");
    var { Argument: Argument2, humanReadableArgName } = require_argument();
    var { CommanderError: CommanderError2 } = require_error();
    var { Help: Help2, stripColor } = require_help();
    var { Option: Option2, DualOptions } = require_option();
    var { suggestSimilar } = require_suggestSimilar();
    var Command2 = class _Command extends EventEmitter {
      /**
       * Initialize a new `Command`.
       *
       * @param {string} [name]
       */
      constructor(name) {
        super();
        this.commands = [];
        this.options = [];
        this.parent = null;
        this._allowUnknownOption = false;
        this._allowExcessArguments = false;
        this.registeredArguments = [];
        this._args = this.registeredArguments;
        this.args = [];
        this.rawArgs = [];
        this.processedArgs = [];
        this._scriptPath = null;
        this._name = name || "";
        this._optionValues = {};
        this._optionValueSources = {};
        this._storeOptionsAsProperties = false;
        this._actionHandler = null;
        this._executableHandler = false;
        this._executableFile = null;
        this._executableDir = null;
        this._defaultCommandName = null;
        this._exitCallback = null;
        this._aliases = [];
        this._combineFlagAndOptionalValue = true;
        this._description = "";
        this._summary = "";
        this._argsDescription = void 0;
        this._enablePositionalOptions = false;
        this._passThroughOptions = false;
        this._lifeCycleHooks = {};
        this._showHelpAfterError = false;
        this._showSuggestionAfterError = true;
        this._savedState = null;
        this._outputConfiguration = {
          writeOut: (str) => process2.stdout.write(str),
          writeErr: (str) => process2.stderr.write(str),
          outputError: (str, write) => write(str),
          getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : void 0,
          getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : void 0,
          getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
          getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
          stripColor: (str) => stripColor(str)
        };
        this._hidden = false;
        this._helpOption = void 0;
        this._addImplicitHelpCommand = void 0;
        this._helpCommand = void 0;
        this._helpConfiguration = {};
        this._helpGroupHeading = void 0;
        this._defaultCommandGroup = void 0;
        this._defaultOptionGroup = void 0;
      }
      /**
       * Copy settings that are useful to have in common across root command and subcommands.
       *
       * (Used internally when adding a command using `.command()` so subcommands inherit parent settings.)
       *
       * @param {Command} sourceCommand
       * @return {Command} `this` command for chaining
       */
      copyInheritedSettings(sourceCommand) {
        this._outputConfiguration = sourceCommand._outputConfiguration;
        this._helpOption = sourceCommand._helpOption;
        this._helpCommand = sourceCommand._helpCommand;
        this._helpConfiguration = sourceCommand._helpConfiguration;
        this._exitCallback = sourceCommand._exitCallback;
        this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
        this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
        this._allowExcessArguments = sourceCommand._allowExcessArguments;
        this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
        this._showHelpAfterError = sourceCommand._showHelpAfterError;
        this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
        return this;
      }
      /**
       * @returns {Command[]}
       * @private
       */
      _getCommandAndAncestors() {
        const result = [];
        for (let command = this; command; command = command.parent) {
          result.push(command);
        }
        return result;
      }
      /**
       * Define a command.
       *
       * There are two styles of command: pay attention to where to put the description.
       *
       * @example
       * // Command implemented using action handler (description is supplied separately to `.command`)
       * program
       *   .command('clone <source> [destination]')
       *   .description('clone a repository into a newly created directory')
       *   .action((source, destination) => {
       *     console.log('clone command called');
       *   });
       *
       * // Command implemented using separate executable file (description is second parameter to `.command`)
       * program
       *   .command('start <service>', 'start named service')
       *   .command('stop [service]', 'stop named service, or all if no name supplied');
       *
       * @param {string} nameAndArgs - command name and arguments, args are `<required>` or `[optional]` and last may also be `variadic...`
       * @param {(object | string)} [actionOptsOrExecDesc] - configuration options (for action), or description (for executable)
       * @param {object} [execOpts] - configuration options (for executable)
       * @return {Command} returns new command for action handler, or `this` for executable command
       */
      command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
        let desc = actionOptsOrExecDesc;
        let opts = execOpts;
        if (typeof desc === "object" && desc !== null) {
          opts = desc;
          desc = null;
        }
        opts = opts || {};
        const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const cmd = this.createCommand(name);
        if (desc) {
          cmd.description(desc);
          cmd._executableHandler = true;
        }
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        cmd._hidden = !!(opts.noHelp || opts.hidden);
        cmd._executableFile = opts.executableFile || null;
        if (args) cmd.arguments(args);
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd.copyInheritedSettings(this);
        if (desc) return this;
        return cmd;
      }
      /**
       * Factory routine to create a new unattached command.
       *
       * See .command() for creating an attached subcommand, which uses this routine to
       * create the command. You can override createCommand to customise subcommands.
       *
       * @param {string} [name]
       * @return {Command} new command
       */
      createCommand(name) {
        return new _Command(name);
      }
      /**
       * You can customise the help with a subclass of Help by overriding createHelp,
       * or by overriding Help properties using configureHelp().
       *
       * @return {Help}
       */
      createHelp() {
        return Object.assign(new Help2(), this.configureHelp());
      }
      /**
       * You can customise the help by overriding Help properties using configureHelp(),
       * or with a subclass of Help by overriding createHelp().
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureHelp(configuration) {
        if (configuration === void 0) return this._helpConfiguration;
        this._helpConfiguration = configuration;
        return this;
      }
      /**
       * The default output goes to stdout and stderr. You can customise this for special
       * applications. You can also customise the display of errors by overriding outputError.
       *
       * The configuration properties are all functions:
       *
       *     // change how output being written, defaults to stdout and stderr
       *     writeOut(str)
       *     writeErr(str)
       *     // change how output being written for errors, defaults to writeErr
       *     outputError(str, write) // used for displaying errors and not used for displaying help
       *     // specify width for wrapping help
       *     getOutHelpWidth()
       *     getErrHelpWidth()
       *     // color support, currently only used with Help
       *     getOutHasColors()
       *     getErrHasColors()
       *     stripColor() // used to remove ANSI escape codes if output does not have colors
       *
       * @param {object} [configuration] - configuration options
       * @return {(Command | object)} `this` command for chaining, or stored configuration
       */
      configureOutput(configuration) {
        if (configuration === void 0) return this._outputConfiguration;
        this._outputConfiguration = {
          ...this._outputConfiguration,
          ...configuration
        };
        return this;
      }
      /**
       * Display the help or a custom message after an error occurs.
       *
       * @param {(boolean|string)} [displayHelp]
       * @return {Command} `this` command for chaining
       */
      showHelpAfterError(displayHelp = true) {
        if (typeof displayHelp !== "string") displayHelp = !!displayHelp;
        this._showHelpAfterError = displayHelp;
        return this;
      }
      /**
       * Display suggestion of similar commands for unknown commands, or options for unknown options.
       *
       * @param {boolean} [displaySuggestion]
       * @return {Command} `this` command for chaining
       */
      showSuggestionAfterError(displaySuggestion = true) {
        this._showSuggestionAfterError = !!displaySuggestion;
        return this;
      }
      /**
       * Add a prepared subcommand.
       *
       * See .command() for creating an attached subcommand which inherits settings from its parent.
       *
       * @param {Command} cmd - new subcommand
       * @param {object} [opts] - configuration options
       * @return {Command} `this` command for chaining
       */
      addCommand(cmd, opts) {
        if (!cmd._name) {
          throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
        }
        opts = opts || {};
        if (opts.isDefault) this._defaultCommandName = cmd._name;
        if (opts.noHelp || opts.hidden) cmd._hidden = true;
        this._registerCommand(cmd);
        cmd.parent = this;
        cmd._checkForBrokenPassThrough();
        return this;
      }
      /**
       * Factory routine to create a new unattached argument.
       *
       * See .argument() for creating an attached argument, which uses this routine to
       * create the argument. You can override createArgument to return a custom argument.
       *
       * @param {string} name
       * @param {string} [description]
       * @return {Argument} new argument
       */
      createArgument(name, description) {
        return new Argument2(name, description);
      }
      /**
       * Define argument syntax for command.
       *
       * The default is that the argument is required, and you can explicitly
       * indicate this with <> around the name. Put [] around the name for an optional argument.
       *
       * @example
       * program.argument('<input-file>');
       * program.argument('[output-file]');
       *
       * @param {string} name
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom argument processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      argument(name, description, parseArg, defaultValue) {
        const argument = this.createArgument(name, description);
        if (typeof parseArg === "function") {
          argument.default(defaultValue).argParser(parseArg);
        } else {
          argument.default(parseArg);
        }
        this.addArgument(argument);
        return this;
      }
      /**
       * Define argument syntax for command, adding multiple at once (without descriptions).
       *
       * See also .argument().
       *
       * @example
       * program.arguments('<cmd> [env]');
       *
       * @param {string} names
       * @return {Command} `this` command for chaining
       */
      arguments(names) {
        names.trim().split(/ +/).forEach((detail) => {
          this.argument(detail);
        });
        return this;
      }
      /**
       * Define argument syntax for command, adding a prepared argument.
       *
       * @param {Argument} argument
       * @return {Command} `this` command for chaining
       */
      addArgument(argument) {
        const previousArgument = this.registeredArguments.slice(-1)[0];
        if (previousArgument?.variadic) {
          throw new Error(
            `only the last argument can be variadic '${previousArgument.name()}'`
          );
        }
        if (argument.required && argument.defaultValue !== void 0 && argument.parseArg === void 0) {
          throw new Error(
            `a default value for a required argument is never used: '${argument.name()}'`
          );
        }
        this.registeredArguments.push(argument);
        return this;
      }
      /**
       * Customise or override default help command. By default a help command is automatically added if your command has subcommands.
       *
       * @example
       *    program.helpCommand('help [cmd]');
       *    program.helpCommand('help [cmd]', 'show help');
       *    program.helpCommand(false); // suppress default help command
       *    program.helpCommand(true); // add help command even if no subcommands
       *
       * @param {string|boolean} enableOrNameAndArgs - enable with custom name and/or arguments, or boolean to override whether added
       * @param {string} [description] - custom description
       * @return {Command} `this` command for chaining
       */
      helpCommand(enableOrNameAndArgs, description) {
        if (typeof enableOrNameAndArgs === "boolean") {
          this._addImplicitHelpCommand = enableOrNameAndArgs;
          if (enableOrNameAndArgs && this._defaultCommandGroup) {
            this._initCommandGroup(this._getHelpCommand());
          }
          return this;
        }
        const nameAndArgs = enableOrNameAndArgs ?? "help [command]";
        const [, helpName, helpArgs] = nameAndArgs.match(/([^ ]+) *(.*)/);
        const helpDescription = description ?? "display help for command";
        const helpCommand = this.createCommand(helpName);
        helpCommand.helpOption(false);
        if (helpArgs) helpCommand.arguments(helpArgs);
        if (helpDescription) helpCommand.description(helpDescription);
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        if (enableOrNameAndArgs || description) this._initCommandGroup(helpCommand);
        return this;
      }
      /**
       * Add prepared custom help command.
       *
       * @param {(Command|string|boolean)} helpCommand - custom help command, or deprecated enableOrNameAndArgs as for `.helpCommand()`
       * @param {string} [deprecatedDescription] - deprecated custom description used with custom name only
       * @return {Command} `this` command for chaining
       */
      addHelpCommand(helpCommand, deprecatedDescription) {
        if (typeof helpCommand !== "object") {
          this.helpCommand(helpCommand, deprecatedDescription);
          return this;
        }
        this._addImplicitHelpCommand = true;
        this._helpCommand = helpCommand;
        this._initCommandGroup(helpCommand);
        return this;
      }
      /**
       * Lazy create help command.
       *
       * @return {(Command|null)}
       * @package
       */
      _getHelpCommand() {
        const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
        if (hasImplicitHelpCommand) {
          if (this._helpCommand === void 0) {
            this.helpCommand(void 0, void 0);
          }
          return this._helpCommand;
        }
        return null;
      }
      /**
       * Add hook for life cycle event.
       *
       * @param {string} event
       * @param {Function} listener
       * @return {Command} `this` command for chaining
       */
      hook(event, listener) {
        const allowedValues = ["preSubcommand", "preAction", "postAction"];
        if (!allowedValues.includes(event)) {
          throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        if (this._lifeCycleHooks[event]) {
          this._lifeCycleHooks[event].push(listener);
        } else {
          this._lifeCycleHooks[event] = [listener];
        }
        return this;
      }
      /**
       * Register callback to use as replacement for calling process.exit.
       *
       * @param {Function} [fn] optional callback which will be passed a CommanderError, defaults to throwing
       * @return {Command} `this` command for chaining
       */
      exitOverride(fn) {
        if (fn) {
          this._exitCallback = fn;
        } else {
          this._exitCallback = (err) => {
            if (err.code !== "commander.executeSubCommandAsync") {
              throw err;
            } else {
            }
          };
        }
        return this;
      }
      /**
       * Call process.exit, and _exitCallback if defined.
       *
       * @param {number} exitCode exit code for using with process.exit
       * @param {string} code an id string representing the error
       * @param {string} message human-readable description of the error
       * @return never
       * @private
       */
      _exit(exitCode, code, message) {
        if (this._exitCallback) {
          this._exitCallback(new CommanderError2(exitCode, code, message));
        }
        process2.exit(exitCode);
      }
      /**
       * Register callback `fn` for the command.
       *
       * @example
       * program
       *   .command('serve')
       *   .description('start service')
       *   .action(function() {
       *      // do work here
       *   });
       *
       * @param {Function} fn
       * @return {Command} `this` command for chaining
       */
      action(fn) {
        const listener = (args) => {
          const expectedArgsCount = this.registeredArguments.length;
          const actionArgs = args.slice(0, expectedArgsCount);
          if (this._storeOptionsAsProperties) {
            actionArgs[expectedArgsCount] = this;
          } else {
            actionArgs[expectedArgsCount] = this.opts();
          }
          actionArgs.push(this);
          return fn.apply(this, actionArgs);
        };
        this._actionHandler = listener;
        return this;
      }
      /**
       * Factory routine to create a new unattached option.
       *
       * See .option() for creating an attached option, which uses this routine to
       * create the option. You can override createOption to return a custom option.
       *
       * @param {string} flags
       * @param {string} [description]
       * @return {Option} new option
       */
      createOption(flags, description) {
        return new Option2(flags, description);
      }
      /**
       * Wrap parseArgs to catch 'commander.invalidArgument'.
       *
       * @param {(Option | Argument)} target
       * @param {string} value
       * @param {*} previous
       * @param {string} invalidArgumentMessage
       * @private
       */
      _callParseArg(target, value, previous, invalidArgumentMessage) {
        try {
          return target.parseArg(value, previous);
        } catch (err) {
          if (err.code === "commander.invalidArgument") {
            const message = `${invalidArgumentMessage} ${err.message}`;
            this.error(message, { exitCode: err.exitCode, code: err.code });
          }
          throw err;
        }
      }
      /**
       * Check for option flag conflicts.
       * Register option if no conflicts found, or throw on conflict.
       *
       * @param {Option} option
       * @private
       */
      _registerOption(option) {
        const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
        if (matchingOption) {
          const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
          throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
        }
        this._initOptionGroup(option);
        this.options.push(option);
      }
      /**
       * Check for command name and alias conflicts with existing commands.
       * Register command if no conflicts found, or throw on conflict.
       *
       * @param {Command} command
       * @private
       */
      _registerCommand(command) {
        const knownBy = (cmd) => {
          return [cmd.name()].concat(cmd.aliases());
        };
        const alreadyUsed = knownBy(command).find(
          (name) => this._findCommand(name)
        );
        if (alreadyUsed) {
          const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
          const newCmd = knownBy(command).join("|");
          throw new Error(
            `cannot add command '${newCmd}' as already have command '${existingCmd}'`
          );
        }
        this._initCommandGroup(command);
        this.commands.push(command);
      }
      /**
       * Add an option.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addOption(option) {
        this._registerOption(option);
        const oname = option.name();
        const name = option.attributeName();
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          if (!this._findOption(positiveLongFlag)) {
            this.setOptionValueWithSource(
              name,
              option.defaultValue === void 0 ? true : option.defaultValue,
              "default"
            );
          }
        } else if (option.defaultValue !== void 0) {
          this.setOptionValueWithSource(name, option.defaultValue, "default");
        }
        const handleOptionValue = (val, invalidValueMessage, valueSource) => {
          if (val == null && option.presetArg !== void 0) {
            val = option.presetArg;
          }
          const oldValue = this.getOptionValue(name);
          if (val !== null && option.parseArg) {
            val = this._callParseArg(option, val, oldValue, invalidValueMessage);
          } else if (val !== null && option.variadic) {
            val = option._collectValue(val, oldValue);
          }
          if (val == null) {
            if (option.negate) {
              val = false;
            } else if (option.isBoolean() || option.optional) {
              val = true;
            } else {
              val = "";
            }
          }
          this.setOptionValueWithSource(name, val, valueSource);
        };
        this.on("option:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "cli");
        });
        if (option.envVar) {
          this.on("optionEnv:" + oname, (val) => {
            const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
            handleOptionValue(val, invalidValueMessage, "env");
          });
        }
        return this;
      }
      /**
       * Internal implementation shared by .option() and .requiredOption()
       *
       * @return {Command} `this` command for chaining
       * @private
       */
      _optionEx(config, flags, description, fn, defaultValue) {
        if (typeof flags === "object" && flags instanceof Option2) {
          throw new Error(
            "To add an Option object use addOption() instead of option() or requiredOption()"
          );
        }
        const option = this.createOption(flags, description);
        option.makeOptionMandatory(!!config.mandatory);
        if (typeof fn === "function") {
          option.default(defaultValue).argParser(fn);
        } else if (fn instanceof RegExp) {
          const regex = fn;
          fn = (val, def) => {
            const m = regex.exec(val);
            return m ? m[0] : def;
          };
          option.default(defaultValue).argParser(fn);
        } else {
          option.default(fn);
        }
        return this.addOption(option);
      }
      /**
       * Define option with `flags`, `description`, and optional argument parsing function or `defaultValue` or both.
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space. A required
       * option-argument is indicated by `<>` and an optional option-argument by `[]`.
       *
       * See the README for more details, and see also addOption() and requiredOption().
       *
       * @example
       * program
       *     .option('-p, --pepper', 'add pepper')
       *     .option('--pt, --pizza-type <TYPE>', 'type of pizza') // required option-argument
       *     .option('-c, --cheese [CHEESE]', 'add extra cheese', 'mozzarella') // optional option-argument with default
       *     .option('-t, --tip <VALUE>', 'add tip to purchase cost', parseFloat) // custom parse function
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      option(flags, description, parseArg, defaultValue) {
        return this._optionEx({}, flags, description, parseArg, defaultValue);
      }
      /**
       * Add a required option which must have a value after parsing. This usually means
       * the option must be specified on the command line. (Otherwise the same as .option().)
       *
       * The `flags` string contains the short and/or long flags, separated by comma, a pipe or space.
       *
       * @param {string} flags
       * @param {string} [description]
       * @param {(Function|*)} [parseArg] - custom option processing function or default value
       * @param {*} [defaultValue]
       * @return {Command} `this` command for chaining
       */
      requiredOption(flags, description, parseArg, defaultValue) {
        return this._optionEx(
          { mandatory: true },
          flags,
          description,
          parseArg,
          defaultValue
        );
      }
      /**
       * Alter parsing of short flags with optional values.
       *
       * @example
       * // for `.option('-f,--flag [value]'):
       * program.combineFlagAndOptionalValue(true);  // `-f80` is treated like `--flag=80`, this is the default behaviour
       * program.combineFlagAndOptionalValue(false) // `-fb` is treated like `-f -b`
       *
       * @param {boolean} [combine] - if `true` or omitted, an optional value can be specified directly after the flag.
       * @return {Command} `this` command for chaining
       */
      combineFlagAndOptionalValue(combine = true) {
        this._combineFlagAndOptionalValue = !!combine;
        return this;
      }
      /**
       * Allow unknown options on the command line.
       *
       * @param {boolean} [allowUnknown] - if `true` or omitted, no error will be thrown for unknown options.
       * @return {Command} `this` command for chaining
       */
      allowUnknownOption(allowUnknown = true) {
        this._allowUnknownOption = !!allowUnknown;
        return this;
      }
      /**
       * Allow excess command-arguments on the command line. Pass false to make excess arguments an error.
       *
       * @param {boolean} [allowExcess] - if `true` or omitted, no error will be thrown for excess arguments.
       * @return {Command} `this` command for chaining
       */
      allowExcessArguments(allowExcess = true) {
        this._allowExcessArguments = !!allowExcess;
        return this;
      }
      /**
       * Enable positional options. Positional means global options are specified before subcommands which lets
       * subcommands reuse the same option names, and also enables subcommands to turn on passThroughOptions.
       * The default behaviour is non-positional and global options may appear anywhere on the command line.
       *
       * @param {boolean} [positional]
       * @return {Command} `this` command for chaining
       */
      enablePositionalOptions(positional = true) {
        this._enablePositionalOptions = !!positional;
        return this;
      }
      /**
       * Pass through options that come after command-arguments rather than treat them as command-options,
       * so actual command-options come before command-arguments. Turning this on for a subcommand requires
       * positional options to have been enabled on the program (parent commands).
       * The default behaviour is non-positional and options may appear before or after command-arguments.
       *
       * @param {boolean} [passThrough] for unknown options.
       * @return {Command} `this` command for chaining
       */
      passThroughOptions(passThrough = true) {
        this._passThroughOptions = !!passThrough;
        this._checkForBrokenPassThrough();
        return this;
      }
      /**
       * @private
       */
      _checkForBrokenPassThrough() {
        if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
          throw new Error(
            `passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`
          );
        }
      }
      /**
       * Whether to store option values as properties on command object,
       * or store separately (specify false). In both cases the option values can be accessed using .opts().
       *
       * @param {boolean} [storeAsProperties=true]
       * @return {Command} `this` command for chaining
       */
      storeOptionsAsProperties(storeAsProperties = true) {
        if (this.options.length) {
          throw new Error("call .storeOptionsAsProperties() before adding options");
        }
        if (Object.keys(this._optionValues).length) {
          throw new Error(
            "call .storeOptionsAsProperties() before setting option values"
          );
        }
        this._storeOptionsAsProperties = !!storeAsProperties;
        return this;
      }
      /**
       * Retrieve option value.
       *
       * @param {string} key
       * @return {object} value
       */
      getOptionValue(key) {
        if (this._storeOptionsAsProperties) {
          return this[key];
        }
        return this._optionValues[key];
      }
      /**
       * Store option value.
       *
       * @param {string} key
       * @param {object} value
       * @return {Command} `this` command for chaining
       */
      setOptionValue(key, value) {
        return this.setOptionValueWithSource(key, value, void 0);
      }
      /**
       * Store option value and where the value came from.
       *
       * @param {string} key
       * @param {object} value
       * @param {string} source - expected values are default/config/env/cli/implied
       * @return {Command} `this` command for chaining
       */
      setOptionValueWithSource(key, value, source) {
        if (this._storeOptionsAsProperties) {
          this[key] = value;
        } else {
          this._optionValues[key] = value;
        }
        this._optionValueSources[key] = source;
        return this;
      }
      /**
       * Get source of option value.
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSource(key) {
        return this._optionValueSources[key];
      }
      /**
       * Get source of option value. See also .optsWithGlobals().
       * Expected values are default | config | env | cli | implied
       *
       * @param {string} key
       * @return {string}
       */
      getOptionValueSourceWithGlobals(key) {
        let source;
        this._getCommandAndAncestors().forEach((cmd) => {
          if (cmd.getOptionValueSource(key) !== void 0) {
            source = cmd.getOptionValueSource(key);
          }
        });
        return source;
      }
      /**
       * Get user arguments from implied or explicit arguments.
       * Side-effects: set _scriptPath if args included script. Used for default program name, and subcommand searches.
       *
       * @private
       */
      _prepareUserArgs(argv, parseOptions) {
        if (argv !== void 0 && !Array.isArray(argv)) {
          throw new Error("first parameter to parse must be array or undefined");
        }
        parseOptions = parseOptions || {};
        if (argv === void 0 && parseOptions.from === void 0) {
          if (process2.versions?.electron) {
            parseOptions.from = "electron";
          }
          const execArgv = process2.execArgv ?? [];
          if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
            parseOptions.from = "eval";
          }
        }
        if (argv === void 0) {
          argv = process2.argv;
        }
        this.rawArgs = argv.slice();
        let userArgs;
        switch (parseOptions.from) {
          case void 0:
          case "node":
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
            break;
          case "electron":
            if (process2.defaultApp) {
              this._scriptPath = argv[1];
              userArgs = argv.slice(2);
            } else {
              userArgs = argv.slice(1);
            }
            break;
          case "user":
            userArgs = argv.slice(0);
            break;
          case "eval":
            userArgs = argv.slice(1);
            break;
          default:
            throw new Error(
              `unexpected parse option { from: '${parseOptions.from}' }`
            );
        }
        if (!this._name && this._scriptPath)
          this.nameFromFilename(this._scriptPath);
        this._name = this._name || "program";
        return userArgs;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Use parseAsync instead of parse if any of your action handlers are async.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * program.parse(); // parse process.argv and auto-detect electron and special node flags
       * program.parse(process.argv); // assume argv[0] is app and argv[1] is script
       * program.parse(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv] - optional, defaults to process.argv
       * @param {object} [parseOptions] - optionally specify style of options with from: node/user/electron
       * @param {string} [parseOptions.from] - where the args are from: 'node', 'user', 'electron'
       * @return {Command} `this` command for chaining
       */
      parse(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        this._parseCommand([], userArgs);
        return this;
      }
      /**
       * Parse `argv`, setting options and invoking commands when defined.
       *
       * Call with no parameters to parse `process.argv`. Detects Electron and special node options like `node --eval`. Easy mode!
       *
       * Or call with an array of strings to parse, and optionally where the user arguments start by specifying where the arguments are `from`:
       * - `'node'`: default, `argv[0]` is the application and `argv[1]` is the script being run, with user arguments after that
       * - `'electron'`: `argv[0]` is the application and `argv[1]` varies depending on whether the electron application is packaged
       * - `'user'`: just user arguments
       *
       * @example
       * await program.parseAsync(); // parse process.argv and auto-detect electron and special node flags
       * await program.parseAsync(process.argv); // assume argv[0] is app and argv[1] is script
       * await program.parseAsync(my-args, { from: 'user' }); // just user supplied arguments, nothing special about argv[0]
       *
       * @param {string[]} [argv]
       * @param {object} [parseOptions]
       * @param {string} parseOptions.from - where the args are from: 'node', 'user', 'electron'
       * @return {Promise}
       */
      async parseAsync(argv, parseOptions) {
        this._prepareForParse();
        const userArgs = this._prepareUserArgs(argv, parseOptions);
        await this._parseCommand([], userArgs);
        return this;
      }
      _prepareForParse() {
        if (this._savedState === null) {
          this.saveStateBeforeParse();
        } else {
          this.restoreStateBeforeParse();
        }
      }
      /**
       * Called the first time parse is called to save state and allow a restore before subsequent calls to parse.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state saved.
       */
      saveStateBeforeParse() {
        this._savedState = {
          // name is stable if supplied by author, but may be unspecified for root command and deduced during parsing
          _name: this._name,
          // option values before parse have default values (including false for negated options)
          // shallow clones
          _optionValues: { ...this._optionValues },
          _optionValueSources: { ...this._optionValueSources }
        };
      }
      /**
       * Restore state before parse for calls after the first.
       * Not usually called directly, but available for subclasses to save their custom state.
       *
       * This is called in a lazy way. Only commands used in parsing chain will have state restored.
       */
      restoreStateBeforeParse() {
        if (this._storeOptionsAsProperties)
          throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
        this._name = this._savedState._name;
        this._scriptPath = null;
        this.rawArgs = [];
        this._optionValues = { ...this._savedState._optionValues };
        this._optionValueSources = { ...this._savedState._optionValueSources };
        this.args = [];
        this.processedArgs = [];
      }
      /**
       * Throw if expected executable is missing. Add lots of help for author.
       *
       * @param {string} executableFile
       * @param {string} executableDir
       * @param {string} subcommandName
       */
      _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
        if (fs7.existsSync(executableFile)) return;
        const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
        const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
        throw new Error(executableMissing);
      }
      /**
       * Execute a sub-command executable.
       *
       * @private
       */
      _executeSubCommand(subcommand, args) {
        args = args.slice();
        let launchWithNode = false;
        const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
        function findFile(baseDir, baseName) {
          const localBin = path7.resolve(baseDir, baseName);
          if (fs7.existsSync(localBin)) return localBin;
          if (sourceExt.includes(path7.extname(baseName))) return void 0;
          const foundExt = sourceExt.find(
            (ext) => fs7.existsSync(`${localBin}${ext}`)
          );
          if (foundExt) return `${localBin}${foundExt}`;
          return void 0;
        }
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
        let executableDir = this._executableDir || "";
        if (this._scriptPath) {
          let resolvedScriptPath;
          try {
            resolvedScriptPath = fs7.realpathSync(this._scriptPath);
          } catch {
            resolvedScriptPath = this._scriptPath;
          }
          executableDir = path7.resolve(
            path7.dirname(resolvedScriptPath),
            executableDir
          );
        }
        if (executableDir) {
          let localFile = findFile(executableDir, executableFile);
          if (!localFile && !subcommand._executableFile && this._scriptPath) {
            const legacyName = path7.basename(
              this._scriptPath,
              path7.extname(this._scriptPath)
            );
            if (legacyName !== this._name) {
              localFile = findFile(
                executableDir,
                `${legacyName}-${subcommand._name}`
              );
            }
          }
          executableFile = localFile || executableFile;
        }
        launchWithNode = sourceExt.includes(path7.extname(executableFile));
        let proc;
        if (process2.platform !== "win32") {
          if (launchWithNode) {
            args.unshift(executableFile);
            args = incrementNodeInspectorPort(process2.execArgv).concat(args);
            proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
          } else {
            proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
          }
        } else {
          this._checkForMissingExecutable(
            executableFile,
            executableDir,
            subcommand._name
          );
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
        }
        if (!proc.killed) {
          const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
          signals.forEach((signal) => {
            process2.on(signal, () => {
              if (proc.killed === false && proc.exitCode === null) {
                proc.kill(signal);
              }
            });
          });
        }
        const exitCallback = this._exitCallback;
        proc.on("close", (code) => {
          code = code ?? 1;
          if (!exitCallback) {
            process2.exit(code);
          } else {
            exitCallback(
              new CommanderError2(
                code,
                "commander.executeSubCommandAsync",
                "(close)"
              )
            );
          }
        });
        proc.on("error", (err) => {
          if (err.code === "ENOENT") {
            this._checkForMissingExecutable(
              executableFile,
              executableDir,
              subcommand._name
            );
          } else if (err.code === "EACCES") {
            throw new Error(`'${executableFile}' not executable`);
          }
          if (!exitCallback) {
            process2.exit(1);
          } else {
            const wrappedError = new CommanderError2(
              1,
              "commander.executeSubCommandAsync",
              "(error)"
            );
            wrappedError.nestedError = err;
            exitCallback(wrappedError);
          }
        });
        this.runningCommand = proc;
      }
      /**
       * @private
       */
      _dispatchSubcommand(commandName, operands, unknown) {
        const subCommand = this._findCommand(commandName);
        if (!subCommand) this.help({ error: true });
        subCommand._prepareForParse();
        let promiseChain;
        promiseChain = this._chainOrCallSubCommandHook(
          promiseChain,
          subCommand,
          "preSubcommand"
        );
        promiseChain = this._chainOrCall(promiseChain, () => {
          if (subCommand._executableHandler) {
            this._executeSubCommand(subCommand, operands.concat(unknown));
          } else {
            return subCommand._parseCommand(operands, unknown);
          }
        });
        return promiseChain;
      }
      /**
       * Invoke help directly if possible, or dispatch if necessary.
       * e.g. help foo
       *
       * @private
       */
      _dispatchHelpCommand(subcommandName) {
        if (!subcommandName) {
          this.help();
        }
        const subCommand = this._findCommand(subcommandName);
        if (subCommand && !subCommand._executableHandler) {
          subCommand.help();
        }
        return this._dispatchSubcommand(
          subcommandName,
          [],
          [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]
        );
      }
      /**
       * Check this.args against expected this.registeredArguments.
       *
       * @private
       */
      _checkNumberOfArguments() {
        this.registeredArguments.forEach((arg, i) => {
          if (arg.required && this.args[i] == null) {
            this.missingArgument(arg.name());
          }
        });
        if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
          return;
        }
        if (this.args.length > this.registeredArguments.length) {
          this._excessArguments(this.args);
        }
      }
      /**
       * Process this.args using this.registeredArguments and save as this.processedArgs!
       *
       * @private
       */
      _processArguments() {
        const myParseArg = (argument, value, previous) => {
          let parsedValue = value;
          if (value !== null && argument.parseArg) {
            const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
            parsedValue = this._callParseArg(
              argument,
              value,
              previous,
              invalidValueMessage
            );
          }
          return parsedValue;
        };
        this._checkNumberOfArguments();
        const processedArgs = [];
        this.registeredArguments.forEach((declaredArg, index) => {
          let value = declaredArg.defaultValue;
          if (declaredArg.variadic) {
            if (index < this.args.length) {
              value = this.args.slice(index);
              if (declaredArg.parseArg) {
                value = value.reduce((processed, v) => {
                  return myParseArg(declaredArg, v, processed);
                }, declaredArg.defaultValue);
              }
            } else if (value === void 0) {
              value = [];
            }
          } else if (index < this.args.length) {
            value = this.args[index];
            if (declaredArg.parseArg) {
              value = myParseArg(declaredArg, value, declaredArg.defaultValue);
            }
          }
          processedArgs[index] = value;
        });
        this.processedArgs = processedArgs;
      }
      /**
       * Once we have a promise we chain, but call synchronously until then.
       *
       * @param {(Promise|undefined)} promise
       * @param {Function} fn
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCall(promise, fn) {
        if (promise?.then && typeof promise.then === "function") {
          return promise.then(() => fn());
        }
        return fn();
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallHooks(promise, event) {
        let result = promise;
        const hooks = [];
        this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== void 0).forEach((hookedCommand) => {
          hookedCommand._lifeCycleHooks[event].forEach((callback) => {
            hooks.push({ hookedCommand, callback });
          });
        });
        if (event === "postAction") {
          hooks.reverse();
        }
        hooks.forEach((hookDetail) => {
          result = this._chainOrCall(result, () => {
            return hookDetail.callback(hookDetail.hookedCommand, this);
          });
        });
        return result;
      }
      /**
       *
       * @param {(Promise|undefined)} promise
       * @param {Command} subCommand
       * @param {string} event
       * @return {(Promise|undefined)}
       * @private
       */
      _chainOrCallSubCommandHook(promise, subCommand, event) {
        let result = promise;
        if (this._lifeCycleHooks[event] !== void 0) {
          this._lifeCycleHooks[event].forEach((hook) => {
            result = this._chainOrCall(result, () => {
              return hook(this, subCommand);
            });
          });
        }
        return result;
      }
      /**
       * Process arguments in context of this command.
       * Returns action result, in case it is a promise.
       *
       * @private
       */
      _parseCommand(operands, unknown) {
        const parsed = this.parseOptions(unknown);
        this._parseOptionsEnv();
        this._parseOptionsImplied();
        operands = operands.concat(parsed.operands);
        unknown = parsed.unknown;
        this.args = operands.concat(unknown);
        if (operands && this._findCommand(operands[0])) {
          return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
        }
        if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
          return this._dispatchHelpCommand(operands[1]);
        }
        if (this._defaultCommandName) {
          this._outputHelpIfRequested(unknown);
          return this._dispatchSubcommand(
            this._defaultCommandName,
            operands,
            unknown
          );
        }
        if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
          this.help({ error: true });
        }
        this._outputHelpIfRequested(parsed.unknown);
        this._checkForMissingMandatoryOptions();
        this._checkForConflictingOptions();
        const checkForUnknownOptions = () => {
          if (parsed.unknown.length > 0) {
            this.unknownOption(parsed.unknown[0]);
          }
        };
        const commandEvent = `command:${this.name()}`;
        if (this._actionHandler) {
          checkForUnknownOptions();
          this._processArguments();
          let promiseChain;
          promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
          promiseChain = this._chainOrCall(
            promiseChain,
            () => this._actionHandler(this.processedArgs)
          );
          if (this.parent) {
            promiseChain = this._chainOrCall(promiseChain, () => {
              this.parent.emit(commandEvent, operands, unknown);
            });
          }
          promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
          return promiseChain;
        }
        if (this.parent?.listenerCount(commandEvent)) {
          checkForUnknownOptions();
          this._processArguments();
          this.parent.emit(commandEvent, operands, unknown);
        } else if (operands.length) {
          if (this._findCommand("*")) {
            return this._dispatchSubcommand("*", operands, unknown);
          }
          if (this.listenerCount("command:*")) {
            this.emit("command:*", operands, unknown);
          } else if (this.commands.length) {
            this.unknownCommand();
          } else {
            checkForUnknownOptions();
            this._processArguments();
          }
        } else if (this.commands.length) {
          checkForUnknownOptions();
          this.help({ error: true });
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      }
      /**
       * Find matching command.
       *
       * @private
       * @return {Command | undefined}
       */
      _findCommand(name) {
        if (!name) return void 0;
        return this.commands.find(
          (cmd) => cmd._name === name || cmd._aliases.includes(name)
        );
      }
      /**
       * Return an option matching `arg` if any.
       *
       * @param {string} arg
       * @return {Option}
       * @package
       */
      _findOption(arg) {
        return this.options.find((option) => option.is(arg));
      }
      /**
       * Display an error message if a mandatory option does not have a value.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForMissingMandatoryOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd.options.forEach((anOption) => {
            if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === void 0) {
              cmd.missingMandatoryOptionValue(anOption);
            }
          });
        });
      }
      /**
       * Display an error message if conflicting options are used together in this.
       *
       * @private
       */
      _checkForConflictingLocalOptions() {
        const definedNonDefaultOptions = this.options.filter((option) => {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === void 0) {
            return false;
          }
          return this.getOptionValueSource(optionKey) !== "default";
        });
        const optionsWithConflicting = definedNonDefaultOptions.filter(
          (option) => option.conflictsWith.length > 0
        );
        optionsWithConflicting.forEach((option) => {
          const conflictingAndDefined = definedNonDefaultOptions.find(
            (defined) => option.conflictsWith.includes(defined.attributeName())
          );
          if (conflictingAndDefined) {
            this._conflictingOption(option, conflictingAndDefined);
          }
        });
      }
      /**
       * Display an error message if conflicting options are used together.
       * Called after checking for help flags in leaf subcommand.
       *
       * @private
       */
      _checkForConflictingOptions() {
        this._getCommandAndAncestors().forEach((cmd) => {
          cmd._checkForConflictingLocalOptions();
        });
      }
      /**
       * Parse options from `argv` removing known options,
       * and return argv split into operands and unknown arguments.
       *
       * Side effects: modifies command by storing options. Does not reset state if called again.
       *
       * Examples:
       *
       *     argv => operands, unknown
       *     --known kkk op => [op], []
       *     op --known kkk => [op], []
       *     sub --unknown uuu op => [sub], [--unknown uuu op]
       *     sub -- --unknown uuu op => [sub --unknown uuu op], []
       *
       * @param {string[]} args
       * @return {{operands: string[], unknown: string[]}}
       */
      parseOptions(args) {
        const operands = [];
        const unknown = [];
        let dest = operands;
        function maybeOption(arg) {
          return arg.length > 1 && arg[0] === "-";
        }
        const negativeNumberArg = (arg) => {
          if (!/^-(\d+|\d*\.\d+)(e[+-]?\d+)?$/.test(arg)) return false;
          return !this._getCommandAndAncestors().some(
            (cmd) => cmd.options.map((opt) => opt.short).some((short) => /^-\d$/.test(short))
          );
        };
        let activeVariadicOption = null;
        let activeGroup = null;
        let i = 0;
        while (i < args.length || activeGroup) {
          const arg = activeGroup ?? args[i++];
          activeGroup = null;
          if (arg === "--") {
            if (dest === unknown) dest.push(arg);
            dest.push(...args.slice(i));
            break;
          }
          if (activeVariadicOption && (!maybeOption(arg) || negativeNumberArg(arg))) {
            this.emit(`option:${activeVariadicOption.name()}`, arg);
            continue;
          }
          activeVariadicOption = null;
          if (maybeOption(arg)) {
            const option = this._findOption(arg);
            if (option) {
              if (option.required) {
                const value = args[i++];
                if (value === void 0) this.optionMissingArgument(option);
                this.emit(`option:${option.name()}`, value);
              } else if (option.optional) {
                let value = null;
                if (i < args.length && (!maybeOption(args[i]) || negativeNumberArg(args[i]))) {
                  value = args[i++];
                }
                this.emit(`option:${option.name()}`, value);
              } else {
                this.emit(`option:${option.name()}`);
              }
              activeVariadicOption = option.variadic ? option : null;
              continue;
            }
          }
          if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
            const option = this._findOption(`-${arg[1]}`);
            if (option) {
              if (option.required || option.optional && this._combineFlagAndOptionalValue) {
                this.emit(`option:${option.name()}`, arg.slice(2));
              } else {
                this.emit(`option:${option.name()}`);
                activeGroup = `-${arg.slice(2)}`;
              }
              continue;
            }
          }
          if (/^--[^=]+=/.test(arg)) {
            const index = arg.indexOf("=");
            const option = this._findOption(arg.slice(0, index));
            if (option && (option.required || option.optional)) {
              this.emit(`option:${option.name()}`, arg.slice(index + 1));
              continue;
            }
          }
          if (dest === operands && maybeOption(arg) && !(this.commands.length === 0 && negativeNumberArg(arg))) {
            dest = unknown;
          }
          if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
            if (this._findCommand(arg)) {
              operands.push(arg);
              unknown.push(...args.slice(i));
              break;
            } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
              operands.push(arg, ...args.slice(i));
              break;
            } else if (this._defaultCommandName) {
              unknown.push(arg, ...args.slice(i));
              break;
            }
          }
          if (this._passThroughOptions) {
            dest.push(arg, ...args.slice(i));
            break;
          }
          dest.push(arg);
        }
        return { operands, unknown };
      }
      /**
       * Return an object containing local option values as key-value pairs.
       *
       * @return {object}
       */
      opts() {
        if (this._storeOptionsAsProperties) {
          const result = {};
          const len = this.options.length;
          for (let i = 0; i < len; i++) {
            const key = this.options[i].attributeName();
            result[key] = key === this._versionOptionName ? this._version : this[key];
          }
          return result;
        }
        return this._optionValues;
      }
      /**
       * Return an object containing merged local and global option values as key-value pairs.
       *
       * @return {object}
       */
      optsWithGlobals() {
        return this._getCommandAndAncestors().reduce(
          (combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()),
          {}
        );
      }
      /**
       * Display error message and exit (or call exitOverride).
       *
       * @param {string} message
       * @param {object} [errorOptions]
       * @param {string} [errorOptions.code] - an id string representing the error
       * @param {number} [errorOptions.exitCode] - used with process.exit
       */
      error(message, errorOptions) {
        this._outputConfiguration.outputError(
          `${message}
`,
          this._outputConfiguration.writeErr
        );
        if (typeof this._showHelpAfterError === "string") {
          this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
        } else if (this._showHelpAfterError) {
          this._outputConfiguration.writeErr("\n");
          this.outputHelp({ error: true });
        }
        const config = errorOptions || {};
        const exitCode = config.exitCode || 1;
        const code = config.code || "commander.error";
        this._exit(exitCode, code, message);
      }
      /**
       * Apply any option related environment variables, if option does
       * not have a value from cli or client code.
       *
       * @private
       */
      _parseOptionsEnv() {
        this.options.forEach((option) => {
          if (option.envVar && option.envVar in process2.env) {
            const optionKey = option.attributeName();
            if (this.getOptionValue(optionKey) === void 0 || ["default", "config", "env"].includes(
              this.getOptionValueSource(optionKey)
            )) {
              if (option.required || option.optional) {
                this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
              } else {
                this.emit(`optionEnv:${option.name()}`);
              }
            }
          }
        });
      }
      /**
       * Apply any implied option values, if option is undefined or default value.
       *
       * @private
       */
      _parseOptionsImplied() {
        const dualHelper = new DualOptions(this.options);
        const hasCustomOptionValue = (optionKey) => {
          return this.getOptionValue(optionKey) !== void 0 && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
        };
        this.options.filter(
          (option) => option.implied !== void 0 && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(
            this.getOptionValue(option.attributeName()),
            option
          )
        ).forEach((option) => {
          Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
            this.setOptionValueWithSource(
              impliedKey,
              option.implied[impliedKey],
              "implied"
            );
          });
        });
      }
      /**
       * Argument `name` is missing.
       *
       * @param {string} name
       * @private
       */
      missingArgument(name) {
        const message = `error: missing required argument '${name}'`;
        this.error(message, { code: "commander.missingArgument" });
      }
      /**
       * `Option` is missing an argument.
       *
       * @param {Option} option
       * @private
       */
      optionMissingArgument(option) {
        const message = `error: option '${option.flags}' argument missing`;
        this.error(message, { code: "commander.optionMissingArgument" });
      }
      /**
       * `Option` does not have a value, and is a mandatory option.
       *
       * @param {Option} option
       * @private
       */
      missingMandatoryOptionValue(option) {
        const message = `error: required option '${option.flags}' not specified`;
        this.error(message, { code: "commander.missingMandatoryOptionValue" });
      }
      /**
       * `Option` conflicts with another option.
       *
       * @param {Option} option
       * @param {Option} conflictingOption
       * @private
       */
      _conflictingOption(option, conflictingOption) {
        const findBestOptionFromValue = (option2) => {
          const optionKey = option2.attributeName();
          const optionValue = this.getOptionValue(optionKey);
          const negativeOption = this.options.find(
            (target) => target.negate && optionKey === target.attributeName()
          );
          const positiveOption = this.options.find(
            (target) => !target.negate && optionKey === target.attributeName()
          );
          if (negativeOption && (negativeOption.presetArg === void 0 && optionValue === false || negativeOption.presetArg !== void 0 && optionValue === negativeOption.presetArg)) {
            return negativeOption;
          }
          return positiveOption || option2;
        };
        const getErrorMessage = (option2) => {
          const bestOption = findBestOptionFromValue(option2);
          const optionKey = bestOption.attributeName();
          const source = this.getOptionValueSource(optionKey);
          if (source === "env") {
            return `environment variable '${bestOption.envVar}'`;
          }
          return `option '${bestOption.flags}'`;
        };
        const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
        this.error(message, { code: "commander.conflictingOption" });
      }
      /**
       * Unknown option `flag`.
       *
       * @param {string} flag
       * @private
       */
      unknownOption(flag) {
        if (this._allowUnknownOption) return;
        let suggestion = "";
        if (flag.startsWith("--") && this._showSuggestionAfterError) {
          let candidateFlags = [];
          let command = this;
          do {
            const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
            candidateFlags = candidateFlags.concat(moreFlags);
            command = command.parent;
          } while (command && !command._enablePositionalOptions);
          suggestion = suggestSimilar(flag, candidateFlags);
        }
        const message = `error: unknown option '${flag}'${suggestion}`;
        this.error(message, { code: "commander.unknownOption" });
      }
      /**
       * Excess arguments, more than expected.
       *
       * @param {string[]} receivedArgs
       * @private
       */
      _excessArguments(receivedArgs) {
        if (this._allowExcessArguments) return;
        const expected = this.registeredArguments.length;
        const s = expected === 1 ? "" : "s";
        const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
        const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
        this.error(message, { code: "commander.excessArguments" });
      }
      /**
       * Unknown command.
       *
       * @private
       */
      unknownCommand() {
        const unknownName = this.args[0];
        let suggestion = "";
        if (this._showSuggestionAfterError) {
          const candidateNames = [];
          this.createHelp().visibleCommands(this).forEach((command) => {
            candidateNames.push(command.name());
            if (command.alias()) candidateNames.push(command.alias());
          });
          suggestion = suggestSimilar(unknownName, candidateNames);
        }
        const message = `error: unknown command '${unknownName}'${suggestion}`;
        this.error(message, { code: "commander.unknownCommand" });
      }
      /**
       * Get or set the program version.
       *
       * This method auto-registers the "-V, --version" option which will print the version number.
       *
       * You can optionally supply the flags and description to override the defaults.
       *
       * @param {string} [str]
       * @param {string} [flags]
       * @param {string} [description]
       * @return {(this | string | undefined)} `this` command for chaining, or version string if no arguments
       */
      version(str, flags, description) {
        if (str === void 0) return this._version;
        this._version = str;
        flags = flags || "-V, --version";
        description = description || "output the version number";
        const versionOption = this.createOption(flags, description);
        this._versionOptionName = versionOption.attributeName();
        this._registerOption(versionOption);
        this.on("option:" + versionOption.name(), () => {
          this._outputConfiguration.writeOut(`${str}
`);
          this._exit(0, "commander.version", str);
        });
        return this;
      }
      /**
       * Set the description.
       *
       * @param {string} [str]
       * @param {object} [argsDescription]
       * @return {(string|Command)}
       */
      description(str, argsDescription) {
        if (str === void 0 && argsDescription === void 0)
          return this._description;
        this._description = str;
        if (argsDescription) {
          this._argsDescription = argsDescription;
        }
        return this;
      }
      /**
       * Set the summary. Used when listed as subcommand of parent.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      summary(str) {
        if (str === void 0) return this._summary;
        this._summary = str;
        return this;
      }
      /**
       * Set an alias for the command.
       *
       * You may call more than once to add multiple aliases. Only the first alias is shown in the auto-generated help.
       *
       * @param {string} [alias]
       * @return {(string|Command)}
       */
      alias(alias) {
        if (alias === void 0) return this._aliases[0];
        let command = this;
        if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
          command = this.commands[this.commands.length - 1];
        }
        if (alias === command._name)
          throw new Error("Command alias can't be the same as its name");
        const matchingCommand = this.parent?._findCommand(alias);
        if (matchingCommand) {
          const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
          throw new Error(
            `cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`
          );
        }
        command._aliases.push(alias);
        return this;
      }
      /**
       * Set aliases for the command.
       *
       * Only the first alias is shown in the auto-generated help.
       *
       * @param {string[]} [aliases]
       * @return {(string[]|Command)}
       */
      aliases(aliases) {
        if (aliases === void 0) return this._aliases;
        aliases.forEach((alias) => this.alias(alias));
        return this;
      }
      /**
       * Set / get the command usage `str`.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      usage(str) {
        if (str === void 0) {
          if (this._usage) return this._usage;
          const args = this.registeredArguments.map((arg) => {
            return humanReadableArgName(arg);
          });
          return [].concat(
            this.options.length || this._helpOption !== null ? "[options]" : [],
            this.commands.length ? "[command]" : [],
            this.registeredArguments.length ? args : []
          ).join(" ");
        }
        this._usage = str;
        return this;
      }
      /**
       * Get or set the name of the command.
       *
       * @param {string} [str]
       * @return {(string|Command)}
       */
      name(str) {
        if (str === void 0) return this._name;
        this._name = str;
        return this;
      }
      /**
       * Set/get the help group heading for this subcommand in parent command's help.
       *
       * @param {string} [heading]
       * @return {Command | string}
       */
      helpGroup(heading) {
        if (heading === void 0) return this._helpGroupHeading ?? "";
        this._helpGroupHeading = heading;
        return this;
      }
      /**
       * Set/get the default help group heading for subcommands added to this command.
       * (This does not override a group set directly on the subcommand using .helpGroup().)
       *
       * @example
       * program.commandsGroup('Development Commands:);
       * program.command('watch')...
       * program.command('lint')...
       * ...
       *
       * @param {string} [heading]
       * @returns {Command | string}
       */
      commandsGroup(heading) {
        if (heading === void 0) return this._defaultCommandGroup ?? "";
        this._defaultCommandGroup = heading;
        return this;
      }
      /**
       * Set/get the default help group heading for options added to this command.
       * (This does not override a group set directly on the option using .helpGroup().)
       *
       * @example
       * program
       *   .optionsGroup('Development Options:')
       *   .option('-d, --debug', 'output extra debugging')
       *   .option('-p, --profile', 'output profiling information')
       *
       * @param {string} [heading]
       * @returns {Command | string}
       */
      optionsGroup(heading) {
        if (heading === void 0) return this._defaultOptionGroup ?? "";
        this._defaultOptionGroup = heading;
        return this;
      }
      /**
       * @param {Option} option
       * @private
       */
      _initOptionGroup(option) {
        if (this._defaultOptionGroup && !option.helpGroupHeading)
          option.helpGroup(this._defaultOptionGroup);
      }
      /**
       * @param {Command} cmd
       * @private
       */
      _initCommandGroup(cmd) {
        if (this._defaultCommandGroup && !cmd.helpGroup())
          cmd.helpGroup(this._defaultCommandGroup);
      }
      /**
       * Set the name of the command from script filename, such as process.argv[1],
       * or require.main.filename, or __filename.
       *
       * (Used internally and public although not documented in README.)
       *
       * @example
       * program.nameFromFilename(require.main.filename);
       *
       * @param {string} filename
       * @return {Command}
       */
      nameFromFilename(filename) {
        this._name = path7.basename(filename, path7.extname(filename));
        return this;
      }
      /**
       * Get or set the directory for searching for executable subcommands of this command.
       *
       * @example
       * program.executableDir(__dirname);
       * // or
       * program.executableDir('subcommands');
       *
       * @param {string} [path]
       * @return {(string|null|Command)}
       */
      executableDir(path8) {
        if (path8 === void 0) return this._executableDir;
        this._executableDir = path8;
        return this;
      }
      /**
       * Return program help documentation.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to wrap for stderr instead of stdout
       * @return {string}
       */
      helpInformation(contextOptions) {
        const helper = this.createHelp();
        const context = this._getOutputContext(contextOptions);
        helper.prepareContext({
          error: context.error,
          helpWidth: context.helpWidth,
          outputHasColors: context.hasColors
        });
        const text = helper.formatHelp(this, helper);
        if (context.hasColors) return text;
        return this._outputConfiguration.stripColor(text);
      }
      /**
       * @typedef HelpContext
       * @type {object}
       * @property {boolean} error
       * @property {number} helpWidth
       * @property {boolean} hasColors
       * @property {function} write - includes stripColor if needed
       *
       * @returns {HelpContext}
       * @private
       */
      _getOutputContext(contextOptions) {
        contextOptions = contextOptions || {};
        const error = !!contextOptions.error;
        let baseWrite;
        let hasColors;
        let helpWidth;
        if (error) {
          baseWrite = (str) => this._outputConfiguration.writeErr(str);
          hasColors = this._outputConfiguration.getErrHasColors();
          helpWidth = this._outputConfiguration.getErrHelpWidth();
        } else {
          baseWrite = (str) => this._outputConfiguration.writeOut(str);
          hasColors = this._outputConfiguration.getOutHasColors();
          helpWidth = this._outputConfiguration.getOutHelpWidth();
        }
        const write = (str) => {
          if (!hasColors) str = this._outputConfiguration.stripColor(str);
          return baseWrite(str);
        };
        return { error, write, hasColors, helpWidth };
      }
      /**
       * Output help information for this command.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean } | Function} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      outputHelp(contextOptions) {
        let deprecatedCallback;
        if (typeof contextOptions === "function") {
          deprecatedCallback = contextOptions;
          contextOptions = void 0;
        }
        const outputContext = this._getOutputContext(contextOptions);
        const eventContext = {
          error: outputContext.error,
          write: outputContext.write,
          command: this
        };
        this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
        this.emit("beforeHelp", eventContext);
        let helpInformation = this.helpInformation({ error: outputContext.error });
        if (deprecatedCallback) {
          helpInformation = deprecatedCallback(helpInformation);
          if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
            throw new Error("outputHelp callback must return a string or a Buffer");
          }
        }
        outputContext.write(helpInformation);
        if (this._getHelpOption()?.long) {
          this.emit(this._getHelpOption().long);
        }
        this.emit("afterHelp", eventContext);
        this._getCommandAndAncestors().forEach(
          (command) => command.emit("afterAllHelp", eventContext)
        );
      }
      /**
       * You can pass in flags and a description to customise the built-in help option.
       * Pass in false to disable the built-in help option.
       *
       * @example
       * program.helpOption('-?, --help' 'show help'); // customise
       * program.helpOption(false); // disable
       *
       * @param {(string | boolean)} flags
       * @param {string} [description]
       * @return {Command} `this` command for chaining
       */
      helpOption(flags, description) {
        if (typeof flags === "boolean") {
          if (flags) {
            if (this._helpOption === null) this._helpOption = void 0;
            if (this._defaultOptionGroup) {
              this._initOptionGroup(this._getHelpOption());
            }
          } else {
            this._helpOption = null;
          }
          return this;
        }
        this._helpOption = this.createOption(
          flags ?? "-h, --help",
          description ?? "display help for command"
        );
        if (flags || description) this._initOptionGroup(this._helpOption);
        return this;
      }
      /**
       * Lazy create help option.
       * Returns null if has been disabled with .helpOption(false).
       *
       * @returns {(Option | null)} the help option
       * @package
       */
      _getHelpOption() {
        if (this._helpOption === void 0) {
          this.helpOption(void 0, void 0);
        }
        return this._helpOption;
      }
      /**
       * Supply your own option to use for the built-in help option.
       * This is an alternative to using helpOption() to customise the flags and description etc.
       *
       * @param {Option} option
       * @return {Command} `this` command for chaining
       */
      addHelpOption(option) {
        this._helpOption = option;
        this._initOptionGroup(option);
        return this;
      }
      /**
       * Output help information and exit.
       *
       * Outputs built-in help, and custom text added using `.addHelpText()`.
       *
       * @param {{ error: boolean }} [contextOptions] - pass {error:true} to write to stderr instead of stdout
       */
      help(contextOptions) {
        this.outputHelp(contextOptions);
        let exitCode = Number(process2.exitCode ?? 0);
        if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
          exitCode = 1;
        }
        this._exit(exitCode, "commander.help", "(outputHelp)");
      }
      /**
       * // Do a little typing to coordinate emit and listener for the help text events.
       * @typedef HelpTextEventContext
       * @type {object}
       * @property {boolean} error
       * @property {Command} command
       * @property {function} write
       */
      /**
       * Add additional text to be displayed with the built-in help.
       *
       * Position is 'before' or 'after' to affect just this command,
       * and 'beforeAll' or 'afterAll' to affect this command and all its subcommands.
       *
       * @param {string} position - before or after built-in help
       * @param {(string | Function)} text - string to add, or a function returning a string
       * @return {Command} `this` command for chaining
       */
      addHelpText(position, text) {
        const allowedValues = ["beforeAll", "before", "after", "afterAll"];
        if (!allowedValues.includes(position)) {
          throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
        }
        const helpEvent = `${position}Help`;
        this.on(helpEvent, (context) => {
          let helpStr;
          if (typeof text === "function") {
            helpStr = text({ error: context.error, command: context.command });
          } else {
            helpStr = text;
          }
          if (helpStr) {
            context.write(`${helpStr}
`);
          }
        });
        return this;
      }
      /**
       * Output help information if help flags specified
       *
       * @param {Array} args - array of options to search for help flags
       * @private
       */
      _outputHelpIfRequested(args) {
        const helpOption = this._getHelpOption();
        const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
        if (helpRequested) {
          this.outputHelp();
          this._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    };
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        if (!arg.startsWith("--inspect")) {
          return arg;
        }
        let debugOption;
        let debugHost = "127.0.0.1";
        let debugPort = "9229";
        let match;
        if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
          debugOption = match[1];
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
          debugOption = match[1];
          if (/^\d+$/.test(match[3])) {
            debugPort = match[3];
          } else {
            debugHost = match[3];
          }
        } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
          debugOption = match[1];
          debugHost = match[3];
          debugPort = match[4];
        }
        if (debugOption && debugPort !== "0") {
          return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
        }
        return arg;
      });
    }
    function useColor() {
      if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
        return false;
      if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== void 0)
        return true;
      return void 0;
    }
    exports2.Command = Command2;
    exports2.useColor = useColor;
  }
});

// packages/medical-protocol/node_modules/commander/index.js
var require_commander = __commonJS({
  "packages/medical-protocol/node_modules/commander/index.js"(exports2) {
    "use strict";
    var { Argument: Argument2 } = require_argument();
    var { Command: Command2 } = require_command();
    var { CommanderError: CommanderError2, InvalidArgumentError: InvalidArgumentError2 } = require_error();
    var { Help: Help2 } = require_help();
    var { Option: Option2 } = require_option();
    exports2.program = new Command2();
    exports2.createCommand = (name) => new Command2(name);
    exports2.createOption = (flags, description) => new Option2(flags, description);
    exports2.createArgument = (name, description) => new Argument2(name, description);
    exports2.Command = Command2;
    exports2.Option = Option2;
    exports2.Argument = Argument2;
    exports2.Help = Help2;
    exports2.CommanderError = CommanderError2;
    exports2.InvalidArgumentError = InvalidArgumentError2;
    exports2.InvalidOptionArgumentError = InvalidArgumentError2;
  }
});

// packages/medical-protocol/package.json
var version;
var init_package = __esm({
  "packages/medical-protocol/package.json"() {
    version = "1.3.0";
  }
});

// node_modules/fast-string-truncated-width/dist/utils.js
var isAmbiguous, isFullWidth, isWide;
var init_utils = __esm({
  "node_modules/fast-string-truncated-width/dist/utils.js"() {
    "use strict";
    isAmbiguous = (x) => {
      return x === 161 || x === 164 || x === 167 || x === 168 || x === 170 || x === 173 || x === 174 || x >= 176 && x <= 180 || x >= 182 && x <= 186 || x >= 188 && x <= 191 || x === 198 || x === 208 || x === 215 || x === 216 || x >= 222 && x <= 225 || x === 230 || x >= 232 && x <= 234 || x === 236 || x === 237 || x === 240 || x === 242 || x === 243 || x >= 247 && x <= 250 || x === 252 || x === 254 || x === 257 || x === 273 || x === 275 || x === 283 || x === 294 || x === 295 || x === 299 || x >= 305 && x <= 307 || x === 312 || x >= 319 && x <= 322 || x === 324 || x >= 328 && x <= 331 || x === 333 || x === 338 || x === 339 || x === 358 || x === 359 || x === 363 || x === 462 || x === 464 || x === 466 || x === 468 || x === 470 || x === 472 || x === 474 || x === 476 || x === 593 || x === 609 || x === 708 || x === 711 || x >= 713 && x <= 715 || x === 717 || x === 720 || x >= 728 && x <= 731 || x === 733 || x === 735 || x >= 768 && x <= 879 || x >= 913 && x <= 929 || x >= 931 && x <= 937 || x >= 945 && x <= 961 || x >= 963 && x <= 969 || x === 1025 || x >= 1040 && x <= 1103 || x === 1105 || x === 8208 || x >= 8211 && x <= 8214 || x === 8216 || x === 8217 || x === 8220 || x === 8221 || x >= 8224 && x <= 8226 || x >= 8228 && x <= 8231 || x === 8240 || x === 8242 || x === 8243 || x === 8245 || x === 8251 || x === 8254 || x === 8308 || x === 8319 || x >= 8321 && x <= 8324 || x === 8364 || x === 8451 || x === 8453 || x === 8457 || x === 8467 || x === 8470 || x === 8481 || x === 8482 || x === 8486 || x === 8491 || x === 8531 || x === 8532 || x >= 8539 && x <= 8542 || x >= 8544 && x <= 8555 || x >= 8560 && x <= 8569 || x === 8585 || x >= 8592 && x <= 8601 || x === 8632 || x === 8633 || x === 8658 || x === 8660 || x === 8679 || x === 8704 || x === 8706 || x === 8707 || x === 8711 || x === 8712 || x === 8715 || x === 8719 || x === 8721 || x === 8725 || x === 8730 || x >= 8733 && x <= 8736 || x === 8739 || x === 8741 || x >= 8743 && x <= 8748 || x === 8750 || x >= 8756 && x <= 8759 || x === 8764 || x === 8765 || x === 8776 || x === 8780 || x === 8786 || x === 8800 || x === 8801 || x >= 8804 && x <= 8807 || x === 8810 || x === 8811 || x === 8814 || x === 8815 || x === 8834 || x === 8835 || x === 8838 || x === 8839 || x === 8853 || x === 8857 || x === 8869 || x === 8895 || x === 8978 || x >= 9312 && x <= 9449 || x >= 9451 && x <= 9547 || x >= 9552 && x <= 9587 || x >= 9600 && x <= 9615 || x >= 9618 && x <= 9621 || x === 9632 || x === 9633 || x >= 9635 && x <= 9641 || x === 9650 || x === 9651 || x === 9654 || x === 9655 || x === 9660 || x === 9661 || x === 9664 || x === 9665 || x >= 9670 && x <= 9672 || x === 9675 || x >= 9678 && x <= 9681 || x >= 9698 && x <= 9701 || x === 9711 || x === 9733 || x === 9734 || x === 9737 || x === 9742 || x === 9743 || x === 9756 || x === 9758 || x === 9792 || x === 9794 || x === 9824 || x === 9825 || x >= 9827 && x <= 9829 || x >= 9831 && x <= 9834 || x === 9836 || x === 9837 || x === 9839 || x === 9886 || x === 9887 || x === 9919 || x >= 9926 && x <= 9933 || x >= 9935 && x <= 9939 || x >= 9941 && x <= 9953 || x === 9955 || x === 9960 || x === 9961 || x >= 9963 && x <= 9969 || x === 9972 || x >= 9974 && x <= 9977 || x === 9979 || x === 9980 || x === 9982 || x === 9983 || x === 10045 || x >= 10102 && x <= 10111 || x >= 11094 && x <= 11097 || x >= 12872 && x <= 12879 || x >= 57344 && x <= 63743 || x >= 65024 && x <= 65039 || x === 65533 || x >= 127232 && x <= 127242 || x >= 127248 && x <= 127277 || x >= 127280 && x <= 127337 || x >= 127344 && x <= 127373 || x === 127375 || x === 127376 || x >= 127387 && x <= 127404 || x >= 917760 && x <= 917999 || x >= 983040 && x <= 1048573 || x >= 1048576 && x <= 1114109;
    };
    isFullWidth = (x) => {
      return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
    };
    isWide = (x) => {
      return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9800 && x <= 9811 || x === 9855 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 19968 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x === 94192 || x === 94193 || x >= 94208 && x <= 100343 || x >= 100352 && x <= 101589 || x >= 101632 && x <= 101640 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128727 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129672 || x >= 129680 && x <= 129725 || x >= 129727 && x <= 129733 || x >= 129742 && x <= 129755 || x >= 129760 && x <= 129768 || x >= 129776 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
    };
  }
});

// node_modules/fast-string-truncated-width/dist/index.js
var ANSI_RE, CONTROL_RE, TAB_RE, EMOJI_RE, LATIN_RE, MODIFIER_RE, NO_TRUNCATION, getStringTruncatedWidth, dist_default;
var init_dist = __esm({
  "node_modules/fast-string-truncated-width/dist/index.js"() {
    "use strict";
    init_utils();
    ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/y;
    CONTROL_RE = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
    TAB_RE = /\t{1,1000}/y;
    EMOJI_RE = new RegExp("[\\u{1F1E6}-\\u{1F1FF}]{2}|\\u{1F3F4}[\\u{E0061}-\\u{E007A}]{2}[\\u{E0030}-\\u{E0039}\\u{E0061}-\\u{E007A}]{1,3}\\u{E007F}|(?:\\p{Emoji}\\uFE0F\\u20E3?|\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation})(?:\\u200D(?:\\p{Emoji_Modifier_Base}\\p{Emoji_Modifier}?|\\p{Emoji_Presentation}|\\p{Emoji}\\uFE0F\\u20E3?))*", "yu");
    LATIN_RE = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
    MODIFIER_RE = new RegExp("\\p{M}+", "gu");
    NO_TRUNCATION = { limit: Infinity, ellipsis: "" };
    getStringTruncatedWidth = (input, truncationOptions = {}, widthOptions = {}) => {
      const LIMIT = truncationOptions.limit ?? Infinity;
      const ELLIPSIS = truncationOptions.ellipsis ?? "";
      const ELLIPSIS_WIDTH = truncationOptions?.ellipsisWidth ?? (ELLIPSIS ? getStringTruncatedWidth(ELLIPSIS, NO_TRUNCATION, widthOptions).width : 0);
      const ANSI_WIDTH = widthOptions.ansiWidth ?? 0;
      const CONTROL_WIDTH = widthOptions.controlWidth ?? 0;
      const TAB_WIDTH = widthOptions.tabWidth ?? 8;
      const AMBIGUOUS_WIDTH = widthOptions.ambiguousWidth ?? 1;
      const EMOJI_WIDTH = widthOptions.emojiWidth ?? 2;
      const FULL_WIDTH_WIDTH = widthOptions.fullWidthWidth ?? 2;
      const REGULAR_WIDTH = widthOptions.regularWidth ?? 1;
      const WIDE_WIDTH = widthOptions.wideWidth ?? 2;
      let indexPrev = 0;
      let index = 0;
      let length = input.length;
      let lengthExtra = 0;
      let truncationEnabled = false;
      let truncationIndex = length;
      let truncationLimit = Math.max(0, LIMIT - ELLIPSIS_WIDTH);
      let unmatchedStart = 0;
      let unmatchedEnd = 0;
      let width = 0;
      let widthExtra = 0;
      outer: while (true) {
        if (unmatchedEnd > unmatchedStart || index >= length && index > indexPrev) {
          const unmatched = input.slice(unmatchedStart, unmatchedEnd) || input.slice(indexPrev, index);
          lengthExtra = 0;
          for (const char of unmatched.replaceAll(MODIFIER_RE, "")) {
            const codePoint = char.codePointAt(0) || 0;
            if (isFullWidth(codePoint)) {
              widthExtra = FULL_WIDTH_WIDTH;
            } else if (isWide(codePoint)) {
              widthExtra = WIDE_WIDTH;
            } else if (AMBIGUOUS_WIDTH !== REGULAR_WIDTH && isAmbiguous(codePoint)) {
              widthExtra = AMBIGUOUS_WIDTH;
            } else {
              widthExtra = REGULAR_WIDTH;
            }
            if (width + widthExtra > truncationLimit) {
              truncationIndex = Math.min(truncationIndex, Math.max(unmatchedStart, indexPrev) + lengthExtra);
            }
            if (width + widthExtra > LIMIT) {
              truncationEnabled = true;
              break outer;
            }
            lengthExtra += char.length;
            width += widthExtra;
          }
          unmatchedStart = unmatchedEnd = 0;
        }
        if (index >= length)
          break;
        LATIN_RE.lastIndex = index;
        if (LATIN_RE.test(input)) {
          lengthExtra = LATIN_RE.lastIndex - index;
          widthExtra = lengthExtra * REGULAR_WIDTH;
          if (width + widthExtra > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / REGULAR_WIDTH));
          }
          if (width + widthExtra > LIMIT) {
            truncationEnabled = true;
            break;
          }
          width += widthExtra;
          unmatchedStart = indexPrev;
          unmatchedEnd = index;
          index = indexPrev = LATIN_RE.lastIndex;
          continue;
        }
        ANSI_RE.lastIndex = index;
        if (ANSI_RE.test(input)) {
          if (width + ANSI_WIDTH > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, index);
          }
          if (width + ANSI_WIDTH > LIMIT) {
            truncationEnabled = true;
            break;
          }
          width += ANSI_WIDTH;
          unmatchedStart = indexPrev;
          unmatchedEnd = index;
          index = indexPrev = ANSI_RE.lastIndex;
          continue;
        }
        CONTROL_RE.lastIndex = index;
        if (CONTROL_RE.test(input)) {
          lengthExtra = CONTROL_RE.lastIndex - index;
          widthExtra = lengthExtra * CONTROL_WIDTH;
          if (width + widthExtra > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / CONTROL_WIDTH));
          }
          if (width + widthExtra > LIMIT) {
            truncationEnabled = true;
            break;
          }
          width += widthExtra;
          unmatchedStart = indexPrev;
          unmatchedEnd = index;
          index = indexPrev = CONTROL_RE.lastIndex;
          continue;
        }
        TAB_RE.lastIndex = index;
        if (TAB_RE.test(input)) {
          lengthExtra = TAB_RE.lastIndex - index;
          widthExtra = lengthExtra * TAB_WIDTH;
          if (width + widthExtra > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / TAB_WIDTH));
          }
          if (width + widthExtra > LIMIT) {
            truncationEnabled = true;
            break;
          }
          width += widthExtra;
          unmatchedStart = indexPrev;
          unmatchedEnd = index;
          index = indexPrev = TAB_RE.lastIndex;
          continue;
        }
        EMOJI_RE.lastIndex = index;
        if (EMOJI_RE.test(input)) {
          if (width + EMOJI_WIDTH > truncationLimit) {
            truncationIndex = Math.min(truncationIndex, index);
          }
          if (width + EMOJI_WIDTH > LIMIT) {
            truncationEnabled = true;
            break;
          }
          width += EMOJI_WIDTH;
          unmatchedStart = indexPrev;
          unmatchedEnd = index;
          index = indexPrev = EMOJI_RE.lastIndex;
          continue;
        }
        index += 1;
      }
      return {
        width: truncationEnabled ? truncationLimit : width,
        index: truncationEnabled ? truncationIndex : length,
        truncated: truncationEnabled,
        ellipsed: truncationEnabled && LIMIT >= ELLIPSIS_WIDTH
      };
    };
    dist_default = getStringTruncatedWidth;
  }
});

// node_modules/fast-string-width/dist/index.js
var NO_TRUNCATION2, fastStringWidth, dist_default2;
var init_dist2 = __esm({
  "node_modules/fast-string-width/dist/index.js"() {
    "use strict";
    init_dist();
    NO_TRUNCATION2 = {
      limit: Infinity,
      ellipsis: "",
      ellipsisWidth: 0
    };
    fastStringWidth = (input, options = {}) => {
      return dist_default(input, NO_TRUNCATION2, options).width;
    };
    dist_default2 = fastStringWidth;
  }
});

// node_modules/fast-wrap-ansi/lib/main.js
function wrapAnsi(string, columns, options) {
  return String(string).normalize().split(CRLF_OR_LF).map((line) => exec(line, columns, options)).join("\n");
}
var ESC, CSI, END_CODE, ANSI_ESCAPE_BELL, ANSI_CSI, ANSI_OSC, ANSI_SGR_TERMINATOR, ANSI_ESCAPE_LINK, GROUP_REGEX, getClosingCode, wrapAnsiCode, wrapAnsiHyperlink, wrapWord, stringVisibleTrimSpacesRight, exec, CRLF_OR_LF;
var init_main = __esm({
  "node_modules/fast-wrap-ansi/lib/main.js"() {
    "use strict";
    init_dist2();
    ESC = "\x1B";
    CSI = "\x9B";
    END_CODE = 39;
    ANSI_ESCAPE_BELL = "\x07";
    ANSI_CSI = "[";
    ANSI_OSC = "]";
    ANSI_SGR_TERMINATOR = "m";
    ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
    GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");
    getClosingCode = (openingCode) => {
      if (openingCode >= 30 && openingCode <= 37)
        return 39;
      if (openingCode >= 90 && openingCode <= 97)
        return 39;
      if (openingCode >= 40 && openingCode <= 47)
        return 49;
      if (openingCode >= 100 && openingCode <= 107)
        return 49;
      if (openingCode === 1 || openingCode === 2)
        return 22;
      if (openingCode === 3)
        return 23;
      if (openingCode === 4)
        return 24;
      if (openingCode === 7)
        return 27;
      if (openingCode === 8)
        return 28;
      if (openingCode === 9)
        return 29;
      if (openingCode === 0)
        return 0;
      return void 0;
    };
    wrapAnsiCode = (code) => `${ESC}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
    wrapAnsiHyperlink = (url) => `${ESC}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;
    wrapWord = (rows, word, columns) => {
      const characters = word[Symbol.iterator]();
      let isInsideEscape = false;
      let isInsideLinkEscape = false;
      let lastRow = rows.at(-1);
      let visible = lastRow === void 0 ? 0 : dist_default2(lastRow);
      let currentCharacter = characters.next();
      let nextCharacter = characters.next();
      let rawCharacterIndex = 0;
      while (!currentCharacter.done) {
        const character = currentCharacter.value;
        const characterLength = dist_default2(character);
        if (visible + characterLength <= columns) {
          rows[rows.length - 1] += character;
        } else {
          rows.push(character);
          visible = 0;
        }
        if (character === ESC || character === CSI) {
          isInsideEscape = true;
          isInsideLinkEscape = word.startsWith(ANSI_ESCAPE_LINK, rawCharacterIndex + 1);
        }
        if (isInsideEscape) {
          if (isInsideLinkEscape) {
            if (character === ANSI_ESCAPE_BELL) {
              isInsideEscape = false;
              isInsideLinkEscape = false;
            }
          } else if (character === ANSI_SGR_TERMINATOR) {
            isInsideEscape = false;
          }
        } else {
          visible += characterLength;
          if (visible === columns && !nextCharacter.done) {
            rows.push("");
            visible = 0;
          }
        }
        currentCharacter = nextCharacter;
        nextCharacter = characters.next();
        rawCharacterIndex += character.length;
      }
      lastRow = rows.at(-1);
      if (!visible && lastRow !== void 0 && lastRow.length && rows.length > 1) {
        rows[rows.length - 2] += rows.pop();
      }
    };
    stringVisibleTrimSpacesRight = (string) => {
      const words = string.split(" ");
      let last = words.length;
      while (last) {
        if (dist_default2(words[last - 1])) {
          break;
        }
        last--;
      }
      if (last === words.length) {
        return string;
      }
      return words.slice(0, last).join(" ") + words.slice(last).join("");
    };
    exec = (string, columns, options = {}) => {
      if (options.trim !== false && string.trim() === "") {
        return "";
      }
      let returnValue = "";
      let escapeCode;
      let escapeUrl;
      const words = string.split(" ");
      let rows = [""];
      let rowLength = 0;
      for (let index = 0; index < words.length; index++) {
        const word = words[index];
        if (options.trim !== false) {
          const row = rows.at(-1) ?? "";
          const trimmed = row.trimStart();
          if (row.length !== trimmed.length) {
            rows[rows.length - 1] = trimmed;
            rowLength = dist_default2(trimmed);
          }
        }
        if (index !== 0) {
          if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
            rows.push("");
            rowLength = 0;
          }
          if (rowLength || options.trim === false) {
            rows[rows.length - 1] += " ";
            rowLength++;
          }
        }
        const wordLength = dist_default2(word);
        if (options.hard && wordLength > columns) {
          const remainingColumns = columns - rowLength;
          const breaksStartingThisLine = 1 + Math.floor((wordLength - remainingColumns - 1) / columns);
          const breaksStartingNextLine = Math.floor((wordLength - 1) / columns);
          if (breaksStartingNextLine < breaksStartingThisLine) {
            rows.push("");
          }
          wrapWord(rows, word, columns);
          rowLength = dist_default2(rows.at(-1) ?? "");
          continue;
        }
        if (rowLength + wordLength > columns && rowLength && wordLength) {
          if (options.wordWrap === false && rowLength < columns) {
            wrapWord(rows, word, columns);
            rowLength = dist_default2(rows.at(-1) ?? "");
            continue;
          }
          rows.push("");
          rowLength = 0;
        }
        if (rowLength + wordLength > columns && options.wordWrap === false) {
          wrapWord(rows, word, columns);
          rowLength = dist_default2(rows.at(-1) ?? "");
          continue;
        }
        rows[rows.length - 1] += word;
        rowLength += wordLength;
      }
      if (options.trim !== false) {
        rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
      }
      const preString = rows.join("\n");
      let inSurrogate = false;
      for (let i = 0; i < preString.length; i++) {
        const character = preString[i];
        returnValue += character;
        if (!inSurrogate) {
          inSurrogate = character >= "\uD800" && character <= "\uDBFF";
        } else {
          continue;
        }
        if (character === ESC || character === CSI) {
          GROUP_REGEX.lastIndex = i + 1;
          const groupsResult = GROUP_REGEX.exec(preString);
          const groups = groupsResult?.groups;
          if (groups?.code !== void 0) {
            const code = Number.parseFloat(groups.code);
            escapeCode = code === END_CODE ? void 0 : code;
          } else if (groups?.uri !== void 0) {
            escapeUrl = groups.uri.length === 0 ? void 0 : groups.uri;
          }
        }
        if (preString[i + 1] === "\n") {
          if (escapeUrl) {
            returnValue += wrapAnsiHyperlink("");
          }
          const closingCode = escapeCode ? getClosingCode(escapeCode) : void 0;
          if (escapeCode && closingCode) {
            returnValue += wrapAnsiCode(closingCode);
          }
        } else if (character === "\n") {
          if (escapeCode && getClosingCode(escapeCode)) {
            returnValue += wrapAnsiCode(escapeCode);
          }
          if (escapeUrl) {
            returnValue += wrapAnsiHyperlink(escapeUrl);
          }
        }
      }
      return returnValue;
    };
    CRLF_OR_LF = /\r?\n/;
  }
});

// node_modules/sisteransi/src/index.js
var require_src = __commonJS({
  "node_modules/sisteransi/src/index.js"(exports2, module2) {
    "use strict";
    var ESC2 = "\x1B";
    var CSI2 = `${ESC2}[`;
    var beep = "\x07";
    var cursor = {
      to(x, y2) {
        if (!y2) return `${CSI2}${x + 1}G`;
        return `${CSI2}${y2 + 1};${x + 1}H`;
      },
      move(x, y2) {
        let ret = "";
        if (x < 0) ret += `${CSI2}${-x}D`;
        else if (x > 0) ret += `${CSI2}${x}C`;
        if (y2 < 0) ret += `${CSI2}${-y2}A`;
        else if (y2 > 0) ret += `${CSI2}${y2}B`;
        return ret;
      },
      up: (count = 1) => `${CSI2}${count}A`,
      down: (count = 1) => `${CSI2}${count}B`,
      forward: (count = 1) => `${CSI2}${count}C`,
      backward: (count = 1) => `${CSI2}${count}D`,
      nextLine: (count = 1) => `${CSI2}E`.repeat(count),
      prevLine: (count = 1) => `${CSI2}F`.repeat(count),
      left: `${CSI2}G`,
      hide: `${CSI2}?25l`,
      show: `${CSI2}?25h`,
      save: `${ESC2}7`,
      restore: `${ESC2}8`
    };
    var scroll = {
      up: (count = 1) => `${CSI2}S`.repeat(count),
      down: (count = 1) => `${CSI2}T`.repeat(count)
    };
    var erase = {
      screen: `${CSI2}2J`,
      up: (count = 1) => `${CSI2}1J`.repeat(count),
      down: (count = 1) => `${CSI2}J`.repeat(count),
      line: `${CSI2}2K`,
      lineEnd: `${CSI2}K`,
      lineStart: `${CSI2}1K`,
      lines(count) {
        let clear = "";
        for (let i = 0; i < count; i++)
          clear += this.line + (i < count - 1 ? cursor.up() : "");
        if (count)
          clear += cursor.left;
        return clear;
      }
    };
    module2.exports = { cursor, scroll, erase, beep };
  }
});

// node_modules/@clack/core/dist/index.mjs
function d(r, t2, e) {
  if (!e.some((o) => !o.disabled)) return r;
  const s = r + t2, i = Math.max(e.length - 1, 0), n = s < 0 ? i : s > i ? 0 : s;
  return e[n].disabled ? d(n, t2 < 0 ? -1 : 1, e) : n;
}
function V(r, t2) {
  if (typeof r == "string") return u.aliases.get(r) === t2;
  for (const e of r) if (e !== void 0 && V(e, t2)) return true;
  return false;
}
function j(r, t2) {
  if (r === t2) return;
  const e = r.split(`
`), s = t2.split(`
`), i = Math.max(e.length, s.length), n = [];
  for (let o = 0; o < i; o++) e[o] !== s[o] && n.push(o);
  return { lines: n, numLinesBefore: e.length, numLinesAfter: s.length, numLines: i };
}
function q(r) {
  return r === C;
}
function w(r, t2) {
  const e = r;
  e.isTTY && e.setRawMode(t2);
}
function z({ input: r = import_node_process.stdin, output: t2 = import_node_process.stdout, overwrite: e = true, hideCursor: s = true } = {}) {
  const i = _.createInterface({ input: r, output: t2, prompt: "", tabSize: 1 });
  _.emitKeypressEvents(r, i), r instanceof import_node_tty.ReadStream && r.isTTY && r.setRawMode(true);
  const n = (o, { name: a, sequence: h }) => {
    const l = String(o);
    if (V([l, a, h], "cancel")) {
      s && t2.write(import_sisteransi.cursor.show), process.exit(0);
      return;
    }
    if (!e) return;
    const f = a === "return" ? 0 : -1, v = a === "return" ? -1 : 0;
    _.moveCursor(t2, f, v, () => {
      _.clearLine(t2, 1, () => {
        r.once("keypress", n);
      });
    });
  };
  return s && t2.write(import_sisteransi.cursor.hide), r.once("keypress", n), () => {
    r.off("keypress", n), s && t2.write(import_sisteransi.cursor.show), r instanceof import_node_tty.ReadStream && r.isTTY && !Y && r.setRawMode(false), i.terminal = false, i.close();
  };
}
function R(r, t2, e, s = e) {
  const i = O(r ?? import_node_process.stdout);
  return wrapAnsi(t2, i - e.length, { hard: true, trim: false }).split(`
`).map((n, o) => `${o === 0 ? s : e}${n}`).join(`
`);
}
var import_node_util, import_node_process, _, import_node_readline, import_sisteransi, import_node_tty, E, G, u, Y, C, O, A, p, Q, nt, at;
var init_dist3 = __esm({
  "node_modules/@clack/core/dist/index.mjs"() {
    "use strict";
    import_node_util = require("util");
    import_node_process = require("process");
    _ = __toESM(require("readline"), 1);
    import_node_readline = __toESM(require("readline"), 1);
    init_main();
    import_sisteransi = __toESM(require_src(), 1);
    import_node_tty = require("tty");
    E = ["up", "down", "left", "right", "space", "enter", "cancel"];
    G = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    u = { actions: new Set(E), aliases: /* @__PURE__ */ new Map([["k", "up"], ["j", "down"], ["h", "left"], ["l", "right"], ["", "cancel"], ["escape", "cancel"]]), messages: { cancel: "Canceled", error: "Something went wrong" }, withGuide: true, date: { monthNames: [...G], messages: { required: "Please enter a valid date", invalidMonth: "There are only 12 months in a year", invalidDay: (r, t2) => `There are only ${r} days in ${t2}`, afterMin: (r) => `Date must be on or after ${r.toISOString().slice(0, 10)}`, beforeMax: (r) => `Date must be on or before ${r.toISOString().slice(0, 10)}` } } };
    Y = globalThis.process.platform.startsWith("win");
    C = /* @__PURE__ */ Symbol("clack:cancel");
    O = (r) => "columns" in r && typeof r.columns == "number" ? r.columns : 80;
    A = (r) => "rows" in r && typeof r.rows == "number" ? r.rows : 20;
    p = class {
      input;
      output;
      _abortSignal;
      rl;
      opts;
      _render;
      _track = false;
      _prevFrame = "";
      _subscribers = /* @__PURE__ */ new Map();
      _cursor = 0;
      state = "initial";
      error = "";
      value;
      userInput = "";
      constructor(t2, e = true) {
        const { input: s = import_node_process.stdin, output: i = import_node_process.stdout, render: n, signal: o, ...a } = t2;
        this.opts = a, this.onKeypress = this.onKeypress.bind(this), this.close = this.close.bind(this), this.render = this.render.bind(this), this._render = n.bind(this), this._track = e, this._abortSignal = o, this.input = s, this.output = i;
      }
      unsubscribe() {
        this._subscribers.clear();
      }
      setSubscriber(t2, e) {
        const s = this._subscribers.get(t2) ?? [];
        s.push(e), this._subscribers.set(t2, s);
      }
      on(t2, e) {
        this.setSubscriber(t2, { cb: e });
      }
      once(t2, e) {
        this.setSubscriber(t2, { cb: e, once: true });
      }
      emit(t2, ...e) {
        const s = this._subscribers.get(t2) ?? [], i = [];
        for (const n of s) n.cb(...e), n.once && i.push(() => s.splice(s.indexOf(n), 1));
        for (const n of i) n();
      }
      prompt() {
        return new Promise((t2) => {
          if (this._abortSignal) {
            if (this._abortSignal.aborted) return this.state = "cancel", this.close(), t2(C);
            this._abortSignal.addEventListener("abort", () => {
              this.state = "cancel", this.close();
            }, { once: true });
          }
          this.rl = import_node_readline.default.createInterface({ input: this.input, tabSize: 2, prompt: "", escapeCodeTimeout: 50, terminal: true }), this.rl.prompt(), this.opts.initialUserInput !== void 0 && this._setUserInput(this.opts.initialUserInput, true), this.input.on("keypress", this.onKeypress), w(this.input, true), this.output.on("resize", this.render), this.render(), this.once("submit", () => {
            this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), w(this.input, false), t2(this.value);
          }), this.once("cancel", () => {
            this.output.write(import_sisteransi.cursor.show), this.output.off("resize", this.render), w(this.input, false), t2(C);
          });
        });
      }
      _isActionKey(t2, e) {
        return t2 === "	";
      }
      _setValue(t2) {
        this.value = t2, this.emit("value", this.value);
      }
      _setUserInput(t2, e) {
        this.userInput = t2 ?? "", this.emit("userInput", this.userInput), e && this._track && this.rl && (this.rl.write(this.userInput), this._cursor = this.rl.cursor);
      }
      _clearUserInput() {
        this.rl?.write(null, { ctrl: true, name: "u" }), this._setUserInput("");
      }
      onKeypress(t2, e) {
        if (this._track && e.name !== "return" && (e.name && this._isActionKey(t2, e) && this.rl?.write(null, { ctrl: true, name: "h" }), this._cursor = this.rl?.cursor ?? 0, this._setUserInput(this.rl?.line)), this.state === "error" && (this.state = "active"), e?.name && (!this._track && u.aliases.has(e.name) && this.emit("cursor", u.aliases.get(e.name)), u.actions.has(e.name) && this.emit("cursor", e.name)), t2 && (t2.toLowerCase() === "y" || t2.toLowerCase() === "n") && this.emit("confirm", t2.toLowerCase() === "y"), this.emit("key", t2?.toLowerCase(), e), e?.name === "return") {
          if (this.opts.validate) {
            const s = this.opts.validate(this.value);
            s && (this.error = s instanceof Error ? s.message : s, this.state = "error", this.rl?.write(this.userInput));
          }
          this.state !== "error" && (this.state = "submit");
        }
        V([t2, e?.name, e?.sequence], "cancel") && (this.state = "cancel"), (this.state === "submit" || this.state === "cancel") && this.emit("finalize"), this.render(), (this.state === "submit" || this.state === "cancel") && this.close();
      }
      close() {
        this.input.unpipe(), this.input.removeListener("keypress", this.onKeypress), this.output.write(`
`), w(this.input, false), this.rl?.close(), this.rl = void 0, this.emit(`${this.state}`, this.value), this.unsubscribe();
      }
      restoreCursor() {
        const t2 = wrapAnsi(this._prevFrame, process.stdout.columns, { hard: true, trim: false }).split(`
`).length - 1;
        this.output.write(import_sisteransi.cursor.move(-999, t2 * -1));
      }
      render() {
        const t2 = wrapAnsi(this._render(this) ?? "", process.stdout.columns, { hard: true, trim: false });
        if (t2 !== this._prevFrame) {
          if (this.state === "initial") this.output.write(import_sisteransi.cursor.hide);
          else {
            const e = j(this._prevFrame, t2), s = A(this.output);
            if (this.restoreCursor(), e) {
              const i = Math.max(0, e.numLinesAfter - s), n = Math.max(0, e.numLinesBefore - s);
              let o = e.lines.find((a) => a >= i);
              if (o === void 0) {
                this._prevFrame = t2;
                return;
              }
              if (e.lines.length === 1) {
                this.output.write(import_sisteransi.cursor.move(0, o - n)), this.output.write(import_sisteransi.erase.lines(1));
                const a = t2.split(`
`);
                this.output.write(a[o]), this._prevFrame = t2, this.output.write(import_sisteransi.cursor.move(0, a.length - o - 1));
                return;
              } else if (e.lines.length > 1) {
                if (i < n) o = i;
                else {
                  const h = o - n;
                  h > 0 && this.output.write(import_sisteransi.cursor.move(0, h));
                }
                this.output.write(import_sisteransi.erase.down());
                const a = t2.split(`
`).slice(o);
                this.output.write(a.join(`
`)), this._prevFrame = t2;
                return;
              }
            }
            this.output.write(import_sisteransi.erase.down());
          }
          this.output.write(t2), this.state === "initial" && (this.state = "active"), this._prevFrame = t2;
        }
      }
    };
    Q = class extends p {
      get cursor() {
        return this.value ? 0 : 1;
      }
      get _value() {
        return this.cursor === 0;
      }
      constructor(t2) {
        super(t2, false), this.value = !!t2.initialValue, this.on("userInput", () => {
          this.value = this._value;
        }), this.on("confirm", (e) => {
          this.output.write(import_sisteransi.cursor.move(0, -1)), this.value = e, this.state = "submit", this.close();
        }), this.on("cursor", () => {
          this.value = !this.value;
        });
      }
    };
    nt = class extends p {
      options;
      cursor = 0;
      get _selectedValue() {
        return this.options[this.cursor];
      }
      changeValue() {
        this.value = this._selectedValue.value;
      }
      constructor(t2) {
        super(t2, false), this.options = t2.options;
        const e = this.options.findIndex(({ value: i }) => i === t2.initialValue), s = e === -1 ? 0 : e;
        this.cursor = this.options[s].disabled ? d(s, 1, this.options) : s, this.changeValue(), this.on("cursor", (i) => {
          switch (i) {
            case "left":
            case "up":
              this.cursor = d(this.cursor, -1, this.options);
              break;
            case "down":
            case "right":
              this.cursor = d(this.cursor, 1, this.options);
              break;
          }
          this.changeValue();
        });
      }
    };
    at = class extends p {
      get userInputWithCursor() {
        if (this.state === "submit") return this.userInput;
        const t2 = this.userInput;
        if (this.cursor >= t2.length) return `${this.userInput}\u2588`;
        const e = t2.slice(0, this.cursor), [s, ...i] = t2.slice(this.cursor);
        return `${e}${(0, import_node_util.styleText)("inverse", s)}${i.join("")}`;
      }
      get cursor() {
        return this._cursor;
      }
      constructor(t2) {
        super({ ...t2, initialUserInput: t2.initialUserInput ?? t2.initialValue }), this.on("userInput", (e) => {
          this._setValue(e);
        }), this.on("finalize", () => {
          this.value || (this.value = t2.defaultValue), this.value === void 0 && (this.value = "");
        });
      }
    };
  }
});

// node_modules/@clack/prompts/dist/index.mjs
function Ze() {
  return import_node_process2.default.platform !== "win32" ? import_node_process2.default.env.TERM !== "linux" : !!import_node_process2.default.env.CI || !!import_node_process2.default.env.WT_SESSION || !!import_node_process2.default.env.TERMINUS_SUBLIME || import_node_process2.default.env.ConEmuTask === "{cmd::Cmder}" || import_node_process2.default.env.TERM_PROGRAM === "Terminus-Sublime" || import_node_process2.default.env.TERM_PROGRAM === "vscode" || import_node_process2.default.env.TERM === "xterm-256color" || import_node_process2.default.env.TERM === "alacritty" || import_node_process2.default.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var import_node_util2, import_node_process2, import_node_fs, import_node_path, import_sisteransi2, ee, ae, w2, _e, oe, ue, F, le, d2, E2, Ie, Ee, z2, H2, te, U, J, xe, se, ce, Ge, $e, de, Oe, he, pe, me, ge, V2, ye, et2, Y2, ot2, O2, pt, mt, gt, Ct, fe, Ve, re, _t, je, Ot;
var init_dist4 = __esm({
  "node_modules/@clack/prompts/dist/index.mjs"() {
    "use strict";
    init_dist3();
    init_dist3();
    import_node_util2 = require("util");
    import_node_process2 = __toESM(require("process"), 1);
    init_main();
    init_dist2();
    import_node_fs = require("fs");
    import_node_path = require("path");
    import_sisteransi2 = __toESM(require_src(), 1);
    ee = Ze();
    ae = () => process.env.CI === "true";
    w2 = (e, i) => ee ? e : i;
    _e = w2("\u25C6", "*");
    oe = w2("\u25A0", "x");
    ue = w2("\u25B2", "x");
    F = w2("\u25C7", "o");
    le = w2("\u250C", "T");
    d2 = w2("\u2502", "|");
    E2 = w2("\u2514", "\u2014");
    Ie = w2("\u2510", "T");
    Ee = w2("\u2518", "\u2014");
    z2 = w2("\u25CF", ">");
    H2 = w2("\u25CB", " ");
    te = w2("\u25FB", "[\u2022]");
    U = w2("\u25FC", "[+]");
    J = w2("\u25FB", "[ ]");
    xe = w2("\u25AA", "\u2022");
    se = w2("\u2500", "-");
    ce = w2("\u256E", "+");
    Ge = w2("\u251C", "+");
    $e = w2("\u256F", "+");
    de = w2("\u2570", "+");
    Oe = w2("\u256D", "+");
    he = w2("\u25CF", "\u2022");
    pe = w2("\u25C6", "*");
    me = w2("\u25B2", "!");
    ge = w2("\u25A0", "x");
    V2 = (e) => {
      switch (e) {
        case "initial":
        case "active":
          return (0, import_node_util2.styleText)("cyan", _e);
        case "cancel":
          return (0, import_node_util2.styleText)("red", oe);
        case "error":
          return (0, import_node_util2.styleText)("yellow", ue);
        case "submit":
          return (0, import_node_util2.styleText)("green", F);
      }
    };
    ye = (e) => {
      switch (e) {
        case "initial":
        case "active":
          return (0, import_node_util2.styleText)("cyan", d2);
        case "cancel":
          return (0, import_node_util2.styleText)("red", d2);
        case "error":
          return (0, import_node_util2.styleText)("yellow", d2);
        case "submit":
          return (0, import_node_util2.styleText)("green", d2);
      }
    };
    et2 = (e, i, s, r, u2) => {
      let n = i, o = 0;
      for (let c2 = s; c2 < r; c2++) {
        const a = e[c2];
        if (n = n - a.length, o++, n <= u2) break;
      }
      return { lineCount: n, removals: o };
    };
    Y2 = ({ cursor: e, options: i, style: s, output: r = process.stdout, maxItems: u2 = Number.POSITIVE_INFINITY, columnPadding: n = 0, rowPadding: o = 4 }) => {
      const c2 = O(r) - n, a = A(r), l = (0, import_node_util2.styleText)("dim", "..."), $2 = Math.max(a - o, 0), y2 = Math.max(Math.min(u2, $2), 5);
      let p2 = 0;
      e >= y2 - 3 && (p2 = Math.max(Math.min(e - y2 + 3, i.length - y2), 0));
      let m = y2 < i.length && p2 > 0, g = y2 < i.length && p2 + y2 < i.length;
      const S2 = Math.min(p2 + y2, i.length), h = [];
      let f = 0;
      m && f++, g && f++;
      const v = p2 + (m ? 1 : 0), T = S2 - (g ? 1 : 0);
      for (let b = v; b < T; b++) {
        const x = wrapAnsi(s(i[b], b === e), c2, { hard: true, trim: false }).split(`
`);
        h.push(x), f += x.length;
      }
      if (f > $2) {
        let b = 0, x = 0, G2 = f;
        const M2 = e - v, R2 = (j2, D2) => et2(h, G2, j2, D2, $2);
        m ? ({ lineCount: G2, removals: b } = R2(0, M2), G2 > $2 && ({ lineCount: G2, removals: x } = R2(M2 + 1, h.length))) : ({ lineCount: G2, removals: x } = R2(M2 + 1, h.length), G2 > $2 && ({ lineCount: G2, removals: b } = R2(0, M2))), b > 0 && (m = true, h.splice(0, b)), x > 0 && (g = true, h.splice(h.length - x, x));
      }
      const C2 = [];
      m && C2.push(l);
      for (const b of h) for (const x of b) C2.push(x);
      return g && C2.push(l), C2;
    };
    ot2 = (e) => {
      const i = e.active ?? "Yes", s = e.inactive ?? "No";
      return new Q({ active: i, inactive: s, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue ?? true, render() {
        const r = e.withGuide ?? u.withGuide, u2 = `${V2(this.state)}  `, n = r ? `${(0, import_node_util2.styleText)("gray", d2)}  ` : "", o = R(e.output, e.message, n, u2), c2 = `${r ? `${(0, import_node_util2.styleText)("gray", d2)}
` : ""}${o}
`, a = this.value ? i : s;
        switch (this.state) {
          case "submit": {
            const l = r ? `${(0, import_node_util2.styleText)("gray", d2)}  ` : "";
            return `${c2}${l}${(0, import_node_util2.styleText)("dim", a)}`;
          }
          case "cancel": {
            const l = r ? `${(0, import_node_util2.styleText)("gray", d2)}  ` : "";
            return `${c2}${l}${(0, import_node_util2.styleText)(["strikethrough", "dim"], a)}${r ? `
${(0, import_node_util2.styleText)("gray", d2)}` : ""}`;
          }
          default: {
            const l = r ? `${(0, import_node_util2.styleText)("cyan", d2)}  ` : "", $2 = r ? (0, import_node_util2.styleText)("cyan", E2) : "";
            return `${c2}${l}${this.value ? `${(0, import_node_util2.styleText)("green", z2)} ${i}` : `${(0, import_node_util2.styleText)("dim", H2)} ${(0, import_node_util2.styleText)("dim", i)}`}${e.vertical ? r ? `
${(0, import_node_util2.styleText)("cyan", d2)}  ` : `
` : ` ${(0, import_node_util2.styleText)("dim", "/")} `}${this.value ? `${(0, import_node_util2.styleText)("dim", H2)} ${(0, import_node_util2.styleText)("dim", s)}` : `${(0, import_node_util2.styleText)("green", z2)} ${s}`}
${$2}
`;
          }
        }
      } }).prompt();
    };
    O2 = { message: (e = [], { symbol: i = (0, import_node_util2.styleText)("gray", d2), secondarySymbol: s = (0, import_node_util2.styleText)("gray", d2), output: r = process.stdout, spacing: u2 = 1, withGuide: n } = {}) => {
      const o = [], c2 = n ?? u.withGuide, a = c2 ? s : "", l = c2 ? `${i}  ` : "", $2 = c2 ? `${s}  ` : "";
      for (let p2 = 0; p2 < u2; p2++) o.push(a);
      const y2 = Array.isArray(e) ? e : e.split(`
`);
      if (y2.length > 0) {
        const [p2, ...m] = y2;
        p2.length > 0 ? o.push(`${l}${p2}`) : o.push(c2 ? i : "");
        for (const g of m) g.length > 0 ? o.push(`${$2}${g}`) : o.push(c2 ? s : "");
      }
      r.write(`${o.join(`
`)}
`);
    }, info: (e, i) => {
      O2.message(e, { ...i, symbol: (0, import_node_util2.styleText)("blue", he) });
    }, success: (e, i) => {
      O2.message(e, { ...i, symbol: (0, import_node_util2.styleText)("green", pe) });
    }, step: (e, i) => {
      O2.message(e, { ...i, symbol: (0, import_node_util2.styleText)("green", F) });
    }, warn: (e, i) => {
      O2.message(e, { ...i, symbol: (0, import_node_util2.styleText)("yellow", me) });
    }, warning: (e, i) => {
      O2.warn(e, i);
    }, error: (e, i) => {
      O2.message(e, { ...i, symbol: (0, import_node_util2.styleText)("red", ge) });
    } };
    pt = (e = "", i) => {
      const s = i?.output ?? process.stdout, r = i?.withGuide ?? u.withGuide ? `${(0, import_node_util2.styleText)("gray", E2)}  ` : "";
      s.write(`${r}${(0, import_node_util2.styleText)("red", e)}

`);
    };
    mt = (e = "", i) => {
      const s = i?.output ?? process.stdout, r = i?.withGuide ?? u.withGuide ? `${(0, import_node_util2.styleText)("gray", le)}  ` : "";
      s.write(`${r}${e}
`);
    };
    gt = (e = "", i) => {
      const s = i?.output ?? process.stdout, r = i?.withGuide ?? u.withGuide ? `${(0, import_node_util2.styleText)("gray", d2)}
${(0, import_node_util2.styleText)("gray", E2)}  ` : "";
      s.write(`${r}${e}

`);
    };
    Ct = (e) => (0, import_node_util2.styleText)("magenta", e);
    fe = ({ indicator: e = "dots", onCancel: i, output: s = process.stdout, cancelMessage: r, errorMessage: u2, frames: n = ee ? ["\u25D2", "\u25D0", "\u25D3", "\u25D1"] : ["\u2022", "o", "O", "0"], delay: o = ee ? 80 : 120, signal: c2, ...a } = {}) => {
      const l = ae();
      let $2, y2, p2 = false, m = false, g = "", S2, h = performance.now();
      const f = O(s), v = a?.styleFrame ?? Ct, T = (_2) => {
        const A2 = _2 > 1 ? u2 ?? u.messages.error : r ?? u.messages.cancel;
        m = _2 === 1, p2 && (W(A2, _2), m && typeof i == "function" && i());
      }, C2 = () => T(2), b = () => T(1), x = () => {
        process.on("uncaughtExceptionMonitor", C2), process.on("unhandledRejection", C2), process.on("SIGINT", b), process.on("SIGTERM", b), process.on("exit", T), c2 && c2.addEventListener("abort", b);
      }, G2 = () => {
        process.removeListener("uncaughtExceptionMonitor", C2), process.removeListener("unhandledRejection", C2), process.removeListener("SIGINT", b), process.removeListener("SIGTERM", b), process.removeListener("exit", T), c2 && c2.removeEventListener("abort", b);
      }, M2 = () => {
        if (S2 === void 0) return;
        l && s.write(`
`);
        const _2 = wrapAnsi(S2, f, { hard: true, trim: false }).split(`
`);
        _2.length > 1 && s.write(import_sisteransi2.cursor.up(_2.length - 1)), s.write(import_sisteransi2.cursor.to(0)), s.write(import_sisteransi2.erase.down());
      }, R2 = (_2) => _2.replace(/\.+$/, ""), j2 = (_2) => {
        const A2 = (performance.now() - _2) / 1e3, k = Math.floor(A2 / 60), L = Math.floor(A2 % 60);
        return k > 0 ? `[${k}m ${L}s]` : `[${L}s]`;
      }, D2 = a.withGuide ?? u.withGuide, ie = (_2 = "") => {
        p2 = true, $2 = z({ output: s }), g = R2(_2), h = performance.now(), D2 && s.write(`${(0, import_node_util2.styleText)("gray", d2)}
`);
        let A2 = 0, k = 0;
        x(), y2 = setInterval(() => {
          if (l && g === S2) return;
          M2(), S2 = g;
          const L = v(n[A2]);
          let Z;
          if (l) Z = `${L}  ${g}...`;
          else if (e === "timer") Z = `${L}  ${g} ${j2(h)}`;
          else {
            const Be = ".".repeat(Math.floor(k)).slice(0, 3);
            Z = `${L}  ${g}${Be}`;
          }
          const Ne = wrapAnsi(Z, f, { hard: true, trim: false });
          s.write(Ne), A2 = A2 + 1 < n.length ? A2 + 1 : 0, k = k < 4 ? k + 0.125 : 0;
        }, o);
      }, W = (_2 = "", A2 = 0, k = false) => {
        if (!p2) return;
        p2 = false, clearInterval(y2), M2();
        const L = A2 === 0 ? (0, import_node_util2.styleText)("green", F) : A2 === 1 ? (0, import_node_util2.styleText)("red", oe) : (0, import_node_util2.styleText)("red", ue);
        g = _2 ?? g, k || (e === "timer" ? s.write(`${L}  ${g} ${j2(h)}
`) : s.write(`${L}  ${g}
`)), G2(), $2();
      };
      return { start: ie, stop: (_2 = "") => W(_2, 0), message: (_2 = "") => {
        g = R2(_2 ?? g);
      }, cancel: (_2 = "") => W(_2, 1), error: (_2 = "") => W(_2, 2), clear: () => W("", 0, true), get isCancelled() {
        return m;
      } };
    };
    Ve = { light: w2("\u2500", "-"), heavy: w2("\u2501", "="), block: w2("\u2588", "#") };
    re = (e, i) => e.includes(`
`) ? e.split(`
`).map((s) => i(s)).join(`
`) : i(e);
    _t = (e) => {
      const i = (s, r) => {
        const u2 = s.label ?? String(s.value);
        switch (r) {
          case "disabled":
            return `${(0, import_node_util2.styleText)("gray", H2)} ${re(u2, (n) => (0, import_node_util2.styleText)("gray", n))}${s.hint ? ` ${(0, import_node_util2.styleText)("dim", `(${s.hint ?? "disabled"})`)}` : ""}`;
          case "selected":
            return `${re(u2, (n) => (0, import_node_util2.styleText)("dim", n))}`;
          case "active":
            return `${(0, import_node_util2.styleText)("green", z2)} ${u2}${s.hint ? ` ${(0, import_node_util2.styleText)("dim", `(${s.hint})`)}` : ""}`;
          case "cancelled":
            return `${re(u2, (n) => (0, import_node_util2.styleText)(["strikethrough", "dim"], n))}`;
          default:
            return `${(0, import_node_util2.styleText)("dim", H2)} ${re(u2, (n) => (0, import_node_util2.styleText)("dim", n))}`;
        }
      };
      return new nt({ options: e.options, signal: e.signal, input: e.input, output: e.output, initialValue: e.initialValue, render() {
        const s = e.withGuide ?? u.withGuide, r = `${V2(this.state)}  `, u2 = `${ye(this.state)}  `, n = R(e.output, e.message, u2, r), o = `${s ? `${(0, import_node_util2.styleText)("gray", d2)}
` : ""}${n}
`;
        switch (this.state) {
          case "submit": {
            const c2 = s ? `${(0, import_node_util2.styleText)("gray", d2)}  ` : "", a = R(e.output, i(this.options[this.cursor], "selected"), c2);
            return `${o}${a}`;
          }
          case "cancel": {
            const c2 = s ? `${(0, import_node_util2.styleText)("gray", d2)}  ` : "", a = R(e.output, i(this.options[this.cursor], "cancelled"), c2);
            return `${o}${a}${s ? `
${(0, import_node_util2.styleText)("gray", d2)}` : ""}`;
          }
          default: {
            const c2 = s ? `${(0, import_node_util2.styleText)("cyan", d2)}  ` : "", a = s ? (0, import_node_util2.styleText)("cyan", E2) : "", l = o.split(`
`).length, $2 = s ? 2 : 1;
            return `${o}${c2}${Y2({ output: e.output, cursor: this.cursor, options: this.options, maxItems: e.maxItems, columnPadding: c2.length, rowPadding: l + $2, style: (y2, p2) => i(y2, y2.disabled ? "disabled" : p2 ? "active" : "inactive") }).join(`
${c2}`)}
${a}
`;
          }
        }
      } }).prompt();
    };
    je = `${(0, import_node_util2.styleText)("gray", d2)}  `;
    Ot = (e) => new at({ validate: e.validate, placeholder: e.placeholder, defaultValue: e.defaultValue, initialValue: e.initialValue, output: e.output, signal: e.signal, input: e.input, render() {
      const i = e?.withGuide ?? u.withGuide, s = `${`${i ? `${(0, import_node_util2.styleText)("gray", d2)}
` : ""}${V2(this.state)}  `}${e.message}
`, r = e.placeholder ? (0, import_node_util2.styleText)("inverse", e.placeholder[0]) + (0, import_node_util2.styleText)("dim", e.placeholder.slice(1)) : (0, import_node_util2.styleText)(["inverse", "hidden"], "_"), u2 = this.userInput ? this.userInputWithCursor : r, n = this.value ?? "";
      switch (this.state) {
        case "error": {
          const o = this.error ? `  ${(0, import_node_util2.styleText)("yellow", this.error)}` : "", c2 = i ? `${(0, import_node_util2.styleText)("yellow", d2)}  ` : "", a = i ? (0, import_node_util2.styleText)("yellow", E2) : "";
          return `${s.trim()}
${c2}${u2}
${a}${o}
`;
        }
        case "submit": {
          const o = n ? `  ${(0, import_node_util2.styleText)("dim", n)}` : "", c2 = i ? (0, import_node_util2.styleText)("gray", d2) : "";
          return `${s}${c2}${o}`;
        }
        case "cancel": {
          const o = n ? `  ${(0, import_node_util2.styleText)(["strikethrough", "dim"], n)}` : "", c2 = i ? (0, import_node_util2.styleText)("gray", d2) : "";
          return `${s}${c2}${o}${n.trim() ? `
${c2}` : ""}`;
        }
        default: {
          const o = i ? `${(0, import_node_util2.styleText)("cyan", d2)}  ` : "", c2 = i ? (0, import_node_util2.styleText)("cyan", E2) : "";
          return `${s}${o}${u2}
${c2}
`;
        }
      }
    } }).prompt();
  }
});

// node_modules/picocolors/picocolors.js
var require_picocolors = __commonJS({
  "node_modules/picocolors/picocolors.js"(exports2, module2) {
    "use strict";
    var p2 = process || {};
    var argv = p2.argv || [];
    var env = p2.env || {};
    var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p2.platform === "win32" || (p2.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
    var formatter = (open, close, replace = open) => (input) => {
      let string = "" + input, index = string.indexOf(close, open.length);
      return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
    };
    var replaceClose = (string, close, replace, index) => {
      let result = "", cursor = 0;
      do {
        result += string.substring(cursor, index) + replace;
        cursor = index + close.length;
        index = string.indexOf(close, cursor);
      } while (~index);
      return result + string.substring(cursor);
    };
    var createColors = (enabled = isColorSupported) => {
      let f = enabled ? formatter : () => String;
      return {
        isColorSupported: enabled,
        reset: f("\x1B[0m", "\x1B[0m"),
        bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
        dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
        italic: f("\x1B[3m", "\x1B[23m"),
        underline: f("\x1B[4m", "\x1B[24m"),
        inverse: f("\x1B[7m", "\x1B[27m"),
        hidden: f("\x1B[8m", "\x1B[28m"),
        strikethrough: f("\x1B[9m", "\x1B[29m"),
        black: f("\x1B[30m", "\x1B[39m"),
        red: f("\x1B[31m", "\x1B[39m"),
        green: f("\x1B[32m", "\x1B[39m"),
        yellow: f("\x1B[33m", "\x1B[39m"),
        blue: f("\x1B[34m", "\x1B[39m"),
        magenta: f("\x1B[35m", "\x1B[39m"),
        cyan: f("\x1B[36m", "\x1B[39m"),
        white: f("\x1B[37m", "\x1B[39m"),
        gray: f("\x1B[90m", "\x1B[39m"),
        bgBlack: f("\x1B[40m", "\x1B[49m"),
        bgRed: f("\x1B[41m", "\x1B[49m"),
        bgGreen: f("\x1B[42m", "\x1B[49m"),
        bgYellow: f("\x1B[43m", "\x1B[49m"),
        bgBlue: f("\x1B[44m", "\x1B[49m"),
        bgMagenta: f("\x1B[45m", "\x1B[49m"),
        bgCyan: f("\x1B[46m", "\x1B[49m"),
        bgWhite: f("\x1B[47m", "\x1B[49m"),
        blackBright: f("\x1B[90m", "\x1B[39m"),
        redBright: f("\x1B[91m", "\x1B[39m"),
        greenBright: f("\x1B[92m", "\x1B[39m"),
        yellowBright: f("\x1B[93m", "\x1B[39m"),
        blueBright: f("\x1B[94m", "\x1B[39m"),
        magentaBright: f("\x1B[95m", "\x1B[39m"),
        cyanBright: f("\x1B[96m", "\x1B[39m"),
        whiteBright: f("\x1B[97m", "\x1B[39m"),
        bgBlackBright: f("\x1B[100m", "\x1B[49m"),
        bgRedBright: f("\x1B[101m", "\x1B[49m"),
        bgGreenBright: f("\x1B[102m", "\x1B[49m"),
        bgYellowBright: f("\x1B[103m", "\x1B[49m"),
        bgBlueBright: f("\x1B[104m", "\x1B[49m"),
        bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
        bgCyanBright: f("\x1B[106m", "\x1B[49m"),
        bgWhiteBright: f("\x1B[107m", "\x1B[49m")
      };
    };
    module2.exports = createColors();
    module2.exports.createColors = createColors;
  }
});

// packages/medical-protocol/src/files.ts
function getBundledPluginDir() {
  return path.resolve(__dirname, "..", "plugin");
}
function getSkillsDir(baseDir) {
  return path.join(baseDir, ".claude", "skills");
}
function getLibDir(baseDir) {
  return path.join(baseDir, ".claude", "lib");
}
function getScriptsDir(baseDir) {
  return path.join(baseDir, ".claude", "scripts");
}
function getAgentsDir(baseDir) {
  return path.join(baseDir, ".claude", "agents");
}
function getHooksDir(baseDir) {
  return path.join(baseDir, ".claude", "hooks");
}
function getSettingsPath(baseDir) {
  return path.join(baseDir, ".claude", "settings.json");
}
function listFiles(dir) {
  const results = [];
  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        results.push(path.relative(dir, fullPath));
      }
    }
  }
  walk(dir);
  return results.sort();
}
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  if (dest.endsWith(".sh") || dest.endsWith(".mjs")) {
    fs.chmodSync(dest, 493);
  }
}
function getDefaultSourceDir() {
  return path.join((0, import_os.homedir)(), ".medical-protocol");
}
function symlinkDir(target, linkPath) {
  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(linkPath)) {
    if (isLink(linkPath)) {
      removeLink(linkPath);
    } else {
      throw new Error(`${linkPath} already exists and is not a symlink. Remove it first or use --force.`);
    }
  }
  fs.symlinkSync(target, linkPath, process.platform === "win32" ? "junction" : "dir");
}
function symlinkFile(target, linkPath) {
  const parent = path.dirname(linkPath);
  fs.mkdirSync(parent, { recursive: true });
  try {
    if (fs.lstatSync(linkPath)) {
      fs.unlinkSync(linkPath);
    }
  } catch {
  }
  try {
    fs.symlinkSync(target, linkPath, "file");
  } catch (e) {
    if (process.platform === "win32" && e.code === "EPERM") {
      fs.copyFileSync(target, linkPath);
    } else {
      throw e;
    }
  }
}
function cloneOrPullRepo(sourceDir) {
  if (fs.existsSync(path.join(sourceDir, ".git"))) {
    try {
      const remote = (0, import_child_process.execSync)("git remote get-url origin", { cwd: sourceDir, encoding: "utf-8" }).trim();
      if (!remote.includes("emdmed/medical-protocol")) {
        throw new Error(
          `${sourceDir} exists but remote origin (${remote}) does not match expected repo. Use --source to specify a different path.`
        );
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes("does not match")) throw e;
      throw new Error(`${sourceDir} exists but is not a valid git repository.`);
    }
    try {
      (0, import_child_process.execSync)("git pull --ff-only", { cwd: sourceDir, stdio: "pipe" });
    } catch {
    }
    return { cloned: false };
  }
  fs.mkdirSync(path.dirname(sourceDir), { recursive: true });
  (0, import_child_process.execSync)(`git clone ${REPO_URL} "${sourceDir}"`, { stdio: "pipe" });
  return { cloned: true };
}
function isLink(filePath) {
  try {
    fs.readlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}
function removeLink(linkPath) {
  try {
    fs.unlinkSync(linkPath);
  } catch {
    fs.rmdirSync(linkPath);
  }
}
function getRepoStatus(sourceDir) {
  try {
    (0, import_child_process.execSync)("git fetch --quiet", { cwd: sourceDir, stdio: "pipe", timeout: 1e4 });
  } catch {
  }
  const branch = (0, import_child_process.execSync)("git rev-parse --abbrev-ref HEAD", { cwd: sourceDir, encoding: "utf-8" }).trim();
  let ahead = 0;
  let behind = 0;
  try {
    const status = (0, import_child_process.execSync)("git rev-list --left-right --count HEAD...@{upstream}", {
      cwd: sourceDir,
      encoding: "utf-8"
    }).trim();
    const parts = status.split(/\s+/);
    ahead = parseInt(parts[0], 10) || 0;
    behind = parseInt(parts[1], 10) || 0;
  } catch {
  }
  return { branch, ahead, behind };
}
var fs, path, import_os, import_child_process, REPO_URL, isSymlink;
var init_files = __esm({
  "packages/medical-protocol/src/files.ts"() {
    "use strict";
    fs = __toESM(require("fs"));
    path = __toESM(require("path"));
    import_os = require("os");
    import_child_process = require("child_process");
    REPO_URL = "https://github.com/emdmed/medical-protocol.git";
    isSymlink = isLink;
  }
});

// packages/medical-protocol/src/manifest.ts
function hashFile(filePath) {
  const content = fs2.readFileSync(filePath);
  const hash = crypto.createHash("sha256").update(content).digest("hex");
  return `sha256:${hash}`;
}
function readManifest(pluginDir) {
  const manifestPath = path2.join(pluginDir, MANIFEST_NAME);
  if (!fs2.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs2.readFileSync(manifestPath, "utf-8"));
  } catch {
    return null;
  }
}
function writeManifest(pluginDir, manifest) {
  const manifestPath = path2.join(pluginDir, MANIFEST_NAME);
  fs2.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}
var crypto, fs2, path2, MANIFEST_NAME;
var init_manifest = __esm({
  "packages/medical-protocol/src/manifest.ts"() {
    "use strict";
    crypto = __toESM(require("crypto"));
    fs2 = __toESM(require("fs"));
    path2 = __toESM(require("path"));
    MANIFEST_NAME = ".manifest.json";
  }
});

// packages/medical-protocol/src/settings.ts
function mergeSettings(baseDir, pluginDir) {
  const target = getSettingsPath(baseDir);
  const existing = readSettings(target);
  const bundledPath = path3.join(pluginDir, "settings.json");
  const bundled = fs3.existsSync(bundledPath) ? JSON.parse(fs3.readFileSync(bundledPath, "utf-8")) : {};
  const perms = existing.permissions ?? {};
  for (const key of ["allow", "deny"]) {
    const merged = [.../* @__PURE__ */ new Set([...perms[key] ?? [], ...bundled.permissions?.[key] ?? []])];
    if (merged.length) perms[key] = merged;
  }
  existing.permissions = perms;
  const source = pluginHooks(pluginDir);
  const ours = new Set(fs3.readdirSync(path3.join(pluginDir, "hooks")).filter((f) => f.endsWith(".mjs")));
  const isOurs = (command) => command.includes("/.claude/hooks/") && ours.has(scriptOf(command) ?? "");
  const hooks = existing.hooks ?? {};
  for (const event of Object.keys(hooks)) {
    hooks[event] = hooks[event].map((g) => ({ ...g, hooks: g.hooks.filter((h) => !isOurs(h.command)) })).filter((g) => g.hooks.length);
    if (!hooks[event].length) delete hooks[event];
  }
  for (const [event, groups] of Object.entries(source)) {
    hooks[event] = [...hooks[event] ?? [], ...groups.map((g) => ({ ...g, hooks: g.hooks.map((h) => ({ ...h, command: localCommand(h.command) })) }))];
  }
  existing.hooks = hooks;
  fs3.mkdirSync(path3.dirname(target), { recursive: true });
  fs3.writeFileSync(target, JSON.stringify(existing, null, 2) + "\n");
}
function hookIssues(baseDir, pluginDir) {
  let settings;
  try {
    settings = readSettings(getSettingsPath(baseDir));
  } catch (e) {
    return [e.message];
  }
  const registered = settings.hooks ?? {};
  const issues = [];
  for (const [event, groups] of Object.entries(pluginHooks(pluginDir))) {
    for (const g of groups) {
      for (const h of g.hooks) {
        const command = localCommand(h.command);
        const script = scriptOf(command) ?? command;
        if (!(registered[event] ?? []).some((r) => r.matcher === g.matcher && r.hooks.some((x) => x.command === command)))
          issues.push(`Safety hook not active: ${script} (${event}). Run 'medical-protocol update'.`);
        if (scriptOf(command) && !fs3.existsSync(path3.join(getHooksDir(baseDir), script)))
          issues.push(`Safety hook file missing: .claude/hooks/${script}. Run 'medical-protocol update'.`);
      }
    }
  }
  return [...new Set(issues)];
}
var fs3, path3, localCommand, scriptOf, readSettings, pluginHooks;
var init_settings = __esm({
  "packages/medical-protocol/src/settings.ts"() {
    "use strict";
    fs3 = __toESM(require("fs"));
    path3 = __toESM(require("path"));
    init_files();
    localCommand = (command) => command.replaceAll("${CLAUDE_PLUGIN_ROOT}", "${CLAUDE_PROJECT_DIR}/.claude");
    scriptOf = (command) => command.match(/\/hooks\/([\w.-]+\.mjs)/)?.[1];
    readSettings = (file) => {
      if (!fs3.existsSync(file)) return {};
      try {
        return JSON.parse(fs3.readFileSync(file, "utf-8"));
      } catch {
        throw new Error(`Can't parse ${file}. Fix or remove it, then run this again.`);
      }
    };
    pluginHooks = (pluginDir) => {
      const file = path3.join(pluginDir, "hooks", "hooks.json");
      return fs3.existsSync(file) ? JSON.parse(fs3.readFileSync(file, "utf-8")).hooks ?? {} : {};
    };
  }
});

// plugin/lib/format.ts
var formatJson, formatTable, formatHeader, formatError, printResult;
var init_format = __esm({
  "plugin/lib/format.ts"() {
    "use strict";
    formatJson = (data) => {
      return JSON.stringify(data, null, 2);
    };
    formatTable = (rows) => {
      const maxLabel = Math.max(...rows.map(([label]) => label.length));
      return rows.map(([label, value]) => `  ${label.padEnd(maxLabel)}  ${value}`).join("\n");
    };
    formatHeader = (title) => {
      return `
${title}
${"\u2500".repeat(title.length)}`;
    };
    formatError = (message) => {
      return `Error: ${message}`;
    };
    printResult = (data, json, humanFn) => {
      if (json) {
        process.stdout.write(formatJson(data) + "\n");
      } else {
        process.stdout.write(humanFn() + "\n");
      }
    };
  }
});

// packages/medical-protocol/src/prompts.ts
function isInteractive(opts) {
  return !opts.yes && !opts.json && !!process.stdin.isTTY;
}
async function selectInstallMode() {
  const result = await _t({
    message: "How would you like to install?",
    options: [
      { value: "copy", label: "Copy files", hint: "recommended" },
      { value: "link", label: "Symlink", hint: "for development" }
    ]
  });
  if (q(result)) return "cancel";
  return result;
}
async function confirmAlreadyInstalled() {
  const result = await _t({
    message: "Plugin already installed. What would you like to do?",
    options: [
      { value: "update", label: "Update to latest" },
      { value: "reinstall", label: "Reinstall (overwrite)" },
      { value: "cancel", label: "Cancel" }
    ]
  });
  if (q(result)) return "cancel";
  return result;
}
async function promptSourcePath() {
  const result = await Ot({
    message: "Path to repo clone:",
    placeholder: "~/.medical-protocol"
  });
  if (q(result)) return null;
  return result || null;
}
async function confirmInstallAgentBrowser() {
  const result = await ot2({
    message: "Also install agent-browser? (enables automated browser QA of your clinical UI)",
    initialValue: true
  });
  if (q(result)) return false;
  return result;
}
async function confirmOverwriteModified(files) {
  const list = files.map((f) => `  - ${f}`).join("\n");
  O2.warn(`Locally modified files:
${list}`);
  const result = await ot2({
    message: "Overwrite these files with the latest version?"
  });
  if (q(result)) return false;
  return result;
}
var init_prompts = __esm({
  "packages/medical-protocol/src/prompts.ts"() {
    "use strict";
    init_dist4();
  }
});

// packages/medical-protocol/src/commands/update.ts
var update_exports = {};
__export(update_exports, {
  run: () => run
});
async function run(opts) {
  try {
    await runUpdate(opts);
  } catch (e) {
    process.stderr.write(formatError(e.message) + "\n");
    process.exitCode = 1;
  }
}
async function runUpdate(opts) {
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);
  const linkManifest = readManifest(path4.join(baseDir, ".claude"));
  if (linkManifest?.mode === "link") {
    if (isInteractive(opts)) {
      await updateLinkedInteractive(baseDir, linkManifest);
    } else {
      updateLinked(baseDir, linkManifest, !!opts.json);
    }
    return;
  }
  const manifest = readManifest(skillsDir);
  if (!manifest) {
    if (isInteractive(opts)) {
      O2.error("Not installed. Run 'medical-protocol install' first.");
    } else {
      process.stderr.write(formatError("Not installed. Run 'medical-protocol install' first.") + "\n");
    }
    process.exitCode = 1;
    return;
  }
  if (isInteractive(opts)) {
    await updateCopyInteractive(baseDir, manifest, !!opts.force);
  } else {
    updateCopy(baseDir, manifest, !!opts.force, !!opts.json);
  }
}
async function updateLinkedInteractive(baseDir, manifest) {
  mt(import_picocolors.default.bgCyan(import_picocolors.default.black(" medical-protocol ")));
  const sourcePath = manifest.sourcePath;
  if (!fs4.existsSync(path4.join(sourcePath, ".git"))) {
    O2.error(`Source repo not found at ${sourcePath}`);
    gt(import_picocolors.default.red("Update failed"));
    process.exitCode = 1;
    return;
  }
  const s = fe();
  s.start("Pulling latest changes...");
  let pullOutput;
  let pullFailed = false;
  try {
    pullOutput = (0, import_child_process2.execSync)("git pull --ff-only", { cwd: sourcePath, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    pullOutput = "Pull skipped (working tree has local changes)";
    pullFailed = true;
  }
  const alreadyUpToDate = !pullFailed && pullOutput.includes("Already up to date");
  mergeSettings(baseDir, path4.join(sourcePath, "plugin"));
  const newManifest = {
    ...manifest,
    installedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeManifest(path4.join(baseDir, ".claude"), newManifest);
  if (pullFailed) {
    s.stop(import_picocolors.default.yellow("Pull skipped (local changes in repo)"));
  } else if (alreadyUpToDate) {
    s.stop(import_picocolors.default.green("Already up-to-date"));
  } else {
    s.stop(import_picocolors.default.green("Updated via git pull"));
  }
  gt(alreadyUpToDate ? import_picocolors.default.green("All good") : "Done");
}
async function updateCopyInteractive(baseDir, manifest, force) {
  mt(import_picocolors.default.bgCyan(import_picocolors.default.black(" medical-protocol ")));
  const s = fe();
  s.start("Checking for updates...");
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();
  const bundledSkillsDir = path4.join(bundledDir, "skills");
  const bundledHooksDir = path4.join(bundledDir, "hooks");
  const updated = [];
  const skipped = [];
  const added = [];
  const removed = [];
  const newHashes = {};
  if (fs4.existsSync(bundledSkillsDir)) {
    processDir(bundledSkillsDir, skillsDir, "skills", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(bundledHooksDir)) {
    processDir(bundledHooksDir, hooksDir, "hooks", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(path4.join(bundledDir, "lib"))) {
    processDir(path4.join(bundledDir, "lib"), getLibDir(baseDir), "lib", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(path4.join(bundledDir, "scripts"))) {
    processDir(path4.join(bundledDir, "scripts"), getScriptsDir(baseDir), "scripts", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(path4.join(bundledDir, "agents"))) {
    processDir(path4.join(bundledDir, "agents"), getAgentsDir(baseDir), "agents", manifest, force, newHashes, updated, skipped, added);
  }
  if (skipped.length > 0 && !force) {
    s.stop(import_picocolors.default.yellow(`${skipped.length} locally modified file(s) found`));
    const overwrite = await confirmOverwriteModified(skipped);
    if (overwrite) {
      const s2 = fe();
      s2.start("Overwriting modified files...");
      for (const key of [...skipped]) {
        const [prefix, ...rest] = key.split("/");
        const relPath = rest.join("/");
        const bundledPath = path4.join(bundledDir, prefix, relPath);
        const installedPath = resolveInstalledPath(baseDir, key);
        const bundledHash = hashFile(bundledPath);
        copyFile(bundledPath, installedPath);
        newHashes[key] = bundledHash;
        updated.push(key);
      }
      skipped.length = 0;
      s2.stop(import_picocolors.default.green("Modified files overwritten"));
    }
  } else if (skipped.length === 0) {
  }
  const bundledKeys = new Set(Object.keys(newHashes));
  for (const key of Object.keys(manifest.files)) {
    if (bundledKeys.has(key)) continue;
    const installedPath = resolveInstalledPath(baseDir, key);
    if (installedPath && fs4.existsSync(installedPath)) {
      fs4.unlinkSync(installedPath);
    }
    removed.push(key);
  }
  const newManifest = {
    version,
    installedAt: (/* @__PURE__ */ new Date()).toISOString(),
    files: newHashes,
    mode: "copy"
  };
  writeManifest(skillsDir, newManifest);
  mergeSettings(baseDir, bundledDir);
  const totalChanged = updated.length + added.length + removed.length;
  if (skipped.length === 0 && totalChanged === 0) {
    s.stop(import_picocolors.default.green("Already up-to-date"));
  } else if (totalChanged > 0 && skipped.length === 0) {
    s.stop(import_picocolors.default.green(`${totalChanged} file(s) updated`));
  }
  if (updated.length > 0) O2.success(`Updated: ${updated.length} file(s)`);
  if (added.length > 0) O2.success(`Added: ${added.length} file(s)`);
  if (removed.length > 0) O2.info(`Removed: ${removed.length} file(s)`);
  if (skipped.length > 0) O2.warn(`Skipped: ${skipped.length} locally modified file(s)`);
  gt(`Done! Plugin v${version}`);
}
function updateLinked(baseDir, manifest, json) {
  const sourcePath = manifest.sourcePath;
  if (!fs4.existsSync(path4.join(sourcePath, ".git"))) {
    process.stderr.write(formatError(`Source repo not found at ${sourcePath}`) + "\n");
    process.exitCode = 1;
    return;
  }
  let pullOutput;
  let pullFailed = false;
  try {
    pullOutput = (0, import_child_process2.execSync)("git pull --ff-only", { cwd: sourcePath, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    pullOutput = "Pull skipped (working tree has local changes)";
    pullFailed = true;
  }
  const alreadyUpToDate = !pullFailed && pullOutput.includes("Already up to date");
  mergeSettings(baseDir, path4.join(sourcePath, "plugin"));
  const newManifest = {
    ...manifest,
    installedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  writeManifest(path4.join(baseDir, ".claude"), newManifest);
  const statusText = pullFailed ? "pull-skipped" : alreadyUpToDate ? "up-to-date" : "updated";
  const data = {
    status: statusText,
    mode: "link",
    sourcePath,
    pullOutput
  };
  const statusLabel = pullFailed ? "Pull skipped (local changes)" : alreadyUpToDate ? "Already up-to-date" : "Updated via git pull";
  printResult(
    data,
    json,
    () => [
      formatHeader("medical-protocol update (linked)"),
      formatTable([
        ["Mode", "symlink"],
        ["Source", sourcePath],
        ["Status", statusLabel]
      ]),
      !alreadyUpToDate && !pullFailed ? `
  ${pullOutput}` : "",
      ""
    ].join("\n")
  );
}
function updateCopy(baseDir, manifest, force, json) {
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();
  const bundledSkillsDir = path4.join(bundledDir, "skills");
  const bundledHooksDir = path4.join(bundledDir, "hooks");
  const updated = [];
  const skipped = [];
  const added = [];
  const removed = [];
  const newHashes = {};
  if (fs4.existsSync(bundledSkillsDir)) {
    processDir(bundledSkillsDir, skillsDir, "skills", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(bundledHooksDir)) {
    processDir(bundledHooksDir, hooksDir, "hooks", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(path4.join(bundledDir, "lib"))) {
    processDir(path4.join(bundledDir, "lib"), getLibDir(baseDir), "lib", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(path4.join(bundledDir, "scripts"))) {
    processDir(path4.join(bundledDir, "scripts"), getScriptsDir(baseDir), "scripts", manifest, force, newHashes, updated, skipped, added);
  }
  if (fs4.existsSync(path4.join(bundledDir, "agents"))) {
    processDir(path4.join(bundledDir, "agents"), getAgentsDir(baseDir), "agents", manifest, force, newHashes, updated, skipped, added);
  }
  const bundledKeys = new Set(Object.keys(newHashes));
  for (const key of Object.keys(manifest.files)) {
    if (bundledKeys.has(key)) continue;
    const installedPath = resolveInstalledPath(baseDir, key);
    if (installedPath && fs4.existsSync(installedPath)) {
      fs4.unlinkSync(installedPath);
    }
    removed.push(key);
  }
  const newManifest = {
    version,
    installedAt: (/* @__PURE__ */ new Date()).toISOString(),
    files: newHashes,
    mode: "copy"
  };
  writeManifest(skillsDir, newManifest);
  mergeSettings(baseDir, bundledDir);
  const totalChanged = updated.length + added.length + removed.length;
  const data = {
    status: totalChanged === 0 && skipped.length === 0 ? "up-to-date" : "updated",
    mode: "copy",
    version,
    updated,
    added,
    removed,
    skipped
  };
  printResult(data, json, () => {
    const lines = [formatHeader("medical-protocol update")];
    lines.push(
      formatTable([
        ["Version", `v${version}`],
        ["Updated", `${updated.length}`],
        ["Added", `${added.length}`],
        ["Removed", `${removed.length}`],
        ["Skipped", `${skipped.length} (locally modified)`]
      ])
    );
    if (skipped.length > 0) {
      lines.push(`
  Skipped files (use --force to overwrite):`);
      for (const f of skipped) lines.push(`    ${f}`);
    }
    lines.push("");
    return lines.join("\n");
  });
}
function processDir(bundledBase, installedBase, prefix, manifest, force, newHashes, updated, skipped, added) {
  const files = listFiles(bundledBase);
  for (const relPath of files) {
    const key = `${prefix}/${relPath}`;
    const bundledPath = path4.join(bundledBase, relPath);
    const installedPath = path4.join(installedBase, relPath);
    const bundledHash = hashFile(bundledPath);
    const manifestHash = manifest.files[key];
    if (!manifestHash) {
      copyFile(bundledPath, installedPath);
      newHashes[key] = bundledHash;
      added.push(key);
      continue;
    }
    if (bundledHash === manifestHash) {
      newHashes[key] = manifestHash;
      continue;
    }
    if (fs4.existsSync(installedPath)) {
      const installedHash = hashFile(installedPath);
      if (installedHash !== manifestHash && !force) {
        skipped.push(key);
        newHashes[key] = manifest.files[key];
        continue;
      }
    }
    copyFile(bundledPath, installedPath);
    newHashes[key] = bundledHash;
    updated.push(key);
  }
}
function resolveInstalledPath(baseDir, key) {
  if (key.startsWith("skills/")) {
    return path4.join(getSkillsDir(baseDir), key.slice("skills/".length));
  }
  if (key.startsWith("hooks/")) {
    return path4.join(getHooksDir(baseDir), key.slice("hooks/".length));
  }
  if (key.startsWith("lib/")) {
    return path4.join(getLibDir(baseDir), key.slice("lib/".length));
  }
  if (key.startsWith("scripts/")) {
    return path4.join(getScriptsDir(baseDir), key.slice("scripts/".length));
  }
  if (key.startsWith("agents/")) {
    return path4.join(getAgentsDir(baseDir), key.slice("agents/".length));
  }
  return null;
}
var import_picocolors, import_child_process2, fs4, path4;
var init_update = __esm({
  "packages/medical-protocol/src/commands/update.ts"() {
    "use strict";
    init_dist4();
    import_picocolors = __toESM(require_picocolors());
    import_child_process2 = require("child_process");
    init_package();
    init_files();
    init_manifest();
    init_format();
    init_prompts();
    init_settings();
    fs4 = __toESM(require("fs"));
    path4 = __toESM(require("path"));
  }
});

// packages/medical-protocol/src/commands/install.ts
var install_exports = {};
__export(install_exports, {
  run: () => run2
});
async function run2(opts) {
  if (isInteractive(opts) && !opts.force && !opts.link && !opts.source) {
    await runInteractive(opts);
  } else {
    runNonInteractive(opts);
  }
}
async function runInteractive(opts) {
  mt(import_picocolors2.default.bgCyan(import_picocolors2.default.black(" medical-protocol ")));
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);
  const manifestPath = path5.join(skillsDir, ".manifest.json");
  const linkManifest = readManifest(path5.join(baseDir, ".claude"));
  const alreadyInstalled = fs5.existsSync(manifestPath) || linkManifest?.mode === "link";
  if (alreadyInstalled) {
    const action = await confirmAlreadyInstalled();
    if (action === "cancel") {
      pt("Installation cancelled.");
      return;
    }
    if (action === "update") {
      const updateMod = await Promise.resolve().then(() => (init_update(), update_exports));
      gt("Switching to update...");
      await updateMod.run({ dir: baseDir, yes: true });
      return;
    }
    opts.force = true;
  }
  const mode = await selectInstallMode();
  if (mode === "cancel") {
    pt("Installation cancelled.");
    return;
  }
  if (mode === "link") {
    let sourcePath = opts.source;
    if (!sourcePath) {
      sourcePath = await promptSourcePath() ?? void 0;
    }
    const s = fe();
    s.start("Cloning/updating source repo...");
    try {
      installLinked(baseDir, sourcePath, !!opts.force, false);
      s.stop(import_picocolors2.default.green("Plugin installed (symlink mode)"));
    } catch (e) {
      s.error(import_picocolors2.default.red("Installation failed"));
      O2.error(e.message);
      process.exitCode = 1;
      return;
    }
  } else {
    const s = fe();
    s.start("Installing plugin...");
    try {
      installCopy(baseDir, !!opts.force, false);
      s.stop(import_picocolors2.default.green("Plugin installed"));
    } catch (e) {
      s.error(import_picocolors2.default.red("Installation failed"));
      O2.error(e.message);
      process.exitCode = 1;
      return;
    }
  }
  await promptAndInstallAgentBrowser();
  gt(`Done! Plugin v${version} installed`);
}
function isAgentBrowserInstalled() {
  try {
    (0, import_child_process3.execSync)("agent-browser --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}
function installAgentBrowser(silent) {
  const stdio = silent ? "ignore" : "inherit";
  (0, import_child_process3.execSync)("npm install -g agent-browser", { stdio });
  (0, import_child_process3.execSync)("agent-browser install", { stdio });
}
async function promptAndInstallAgentBrowser() {
  if (isAgentBrowserInstalled()) {
    O2.info("agent-browser already installed \u2014 browser QA enabled.");
    return;
  }
  const wants = await confirmInstallAgentBrowser();
  if (!wants) return;
  const s = fe();
  s.start("Installing agent-browser (also downloads a browser)...");
  try {
    installAgentBrowser(true);
    s.stop(import_picocolors2.default.green("agent-browser installed"));
  } catch (e) {
    s.error(import_picocolors2.default.yellow("Could not install agent-browser \u2014 skipping (the plugin works without it)"));
    O2.warn(e.message);
  }
}
function runNonInteractive(opts) {
  const useLink = opts.link || !!opts.source;
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);
  const manifestPath = path5.join(skillsDir, ".manifest.json");
  if (fs5.existsSync(manifestPath) && !opts.force) {
    process.stderr.write(
      formatError(`Skills already installed at ${skillsDir}
Use --force to overwrite, or use 'update' to update changed files.`) + "\n"
    );
    process.exitCode = 1;
    return;
  }
  try {
    if (useLink) installLinked(baseDir, opts.source, !!opts.force, !!opts.json);
    else installCopy(baseDir, !!opts.force, !!opts.json);
  } catch (e) {
    process.stderr.write(formatError(e.message) + "\n");
    process.exitCode = 1;
    return;
  }
  if (opts.agentBrowser && process.exitCode !== 1 && !isAgentBrowserInstalled()) {
    try {
      installAgentBrowser(!!opts.json);
    } catch (e) {
      if (!opts.json) {
        process.stderr.write(formatError(`agent-browser install failed (skipped): ${e.message}`) + "\n");
      }
    }
  }
}
function installLinked(baseDir, sourcePath, force, json) {
  const sourceDir = sourcePath ?? getDefaultSourceDir();
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  let repoAction;
  try {
    const result = cloneOrPullRepo(sourceDir);
    repoAction = result.cloned ? "cloned" : "updated";
  } catch (e) {
    process.stderr.write(formatError(e.message) + "\n");
    process.exitCode = 1;
    return;
  }
  const pluginDir = path5.join(sourceDir, "plugin");
  if (!fs5.existsSync(pluginDir)) {
    process.stderr.write(formatError(`Plugin directory not found at ${pluginDir}. Is this the right repo?`) + "\n");
    process.exitCode = 1;
    return;
  }
  const sourceSkillsDir = path5.join(pluginDir, "skills");
  const sourceHooksDir = path5.join(pluginDir, "hooks");
  if (fs5.existsSync(skillsDir) && force) {
    if (isLink(skillsDir)) {
      removeLink(skillsDir);
    } else {
      fs5.rmSync(skillsDir, { recursive: true });
    }
  }
  if (fs5.existsSync(sourceSkillsDir)) {
    symlinkDir(sourceSkillsDir, skillsDir);
  }
  for (const [dir, dest] of [["lib", getLibDir(baseDir)], ["scripts", getScriptsDir(baseDir)]]) {
    const src = path5.join(pluginDir, dir);
    if (!fs5.existsSync(src)) continue;
    if (fs5.existsSync(dest) && force) {
      if (isLink(dest)) removeLink(dest);
      else fs5.rmSync(dest, { recursive: true });
    }
    symlinkDir(src, dest);
  }
  const sourceAgentsDir = path5.join(pluginDir, "agents");
  if (fs5.existsSync(sourceAgentsDir)) {
    for (const relPath of listFiles(sourceAgentsDir)) {
      symlinkFile(path5.join(sourceAgentsDir, relPath), path5.join(getAgentsDir(baseDir), relPath));
    }
  }
  let hookCount = 0;
  if (fs5.existsSync(sourceHooksDir)) {
    fs5.mkdirSync(hooksDir, { recursive: true });
    const hookFiles = listFiles(sourceHooksDir);
    for (const relPath of hookFiles) {
      if (relPath === "hooks.json") continue;
      const target = path5.join(sourceHooksDir, relPath);
      const linkPath = path5.join(hooksDir, relPath);
      symlinkFile(target, linkPath);
      hookCount++;
    }
  }
  mergeSettings(baseDir, pluginDir);
  const manifestDir = path5.join(baseDir, ".claude");
  fs5.mkdirSync(manifestDir, { recursive: true });
  const manifest = {
    version,
    installedAt: (/* @__PURE__ */ new Date()).toISOString(),
    files: {},
    mode: "link",
    sourcePath: sourceDir
  };
  writeManifest(manifestDir, manifest);
  const data = {
    status: "installed",
    mode: "link",
    version,
    repoAction,
    sourcePath: sourceDir,
    skillsDir,
    hooksDir,
    hookFiles: hookCount
  };
  printResult(
    data,
    json,
    () => [
      formatHeader("medical-protocol installed (linked)"),
      formatTable([
        ["Version", `v${version}`],
        ["Mode", "symlink"],
        ["Source", sourceDir],
        ["Repo", repoAction],
        ["Skills", `${skillsDir} -> ${sourceSkillsDir}`],
        ["Hooks", `${hookCount} files symlinked`]
      ]),
      "",
      "Next: open Claude Code in this project and run  /medical-protocol:start  to build your first interface.",
      ""
    ].join("\n")
  );
}
function installCopy(baseDir, force, json) {
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const bundledDir = getBundledPluginDir();
  if (!fs5.existsSync(bundledDir)) {
    process.stderr.write(formatError("Bundled plugin directory not found. Package may be corrupted.") + "\n");
    process.exitCode = 1;
    return;
  }
  const bundledSkillsDir = path5.join(bundledDir, "skills");
  const bundledHooksDir = path5.join(bundledDir, "hooks");
  const fileHashes = {};
  let totalFiles = 0;
  if (fs5.existsSync(skillsDir) && isLink(skillsDir)) {
    removeLink(skillsDir);
  }
  if (fs5.existsSync(bundledSkillsDir)) {
    const skillFiles = listFiles(bundledSkillsDir);
    for (const relPath of skillFiles) {
      const src = path5.join(bundledSkillsDir, relPath);
      const dest = path5.join(skillsDir, relPath);
      copyFile(src, dest);
      const key = `skills/${relPath}`;
      fileHashes[key] = hashFile(src);
      totalFiles++;
    }
  }
  const bundledLibDir = path5.join(bundledDir, "lib");
  if (fs5.existsSync(bundledLibDir)) {
    for (const relPath of listFiles(bundledLibDir)) {
      const src = path5.join(bundledLibDir, relPath);
      copyFile(src, path5.join(getLibDir(baseDir), relPath));
      fileHashes[`lib/${relPath}`] = hashFile(src);
      totalFiles++;
    }
  }
  const bundledScriptsDir = path5.join(bundledDir, "scripts");
  if (fs5.existsSync(bundledScriptsDir)) {
    for (const relPath of listFiles(bundledScriptsDir)) {
      const src = path5.join(bundledScriptsDir, relPath);
      copyFile(src, path5.join(getScriptsDir(baseDir), relPath));
      fileHashes[`scripts/${relPath}`] = hashFile(src);
      totalFiles++;
    }
  }
  const bundledAgentsDir = path5.join(bundledDir, "agents");
  if (fs5.existsSync(bundledAgentsDir)) {
    for (const relPath of listFiles(bundledAgentsDir)) {
      const src = path5.join(bundledAgentsDir, relPath);
      copyFile(src, path5.join(getAgentsDir(baseDir), relPath));
      fileHashes[`agents/${relPath}`] = hashFile(src);
      totalFiles++;
    }
  }
  if (fs5.existsSync(bundledHooksDir)) {
    const hookFiles = listFiles(bundledHooksDir);
    for (const relPath of hookFiles) {
      const src = path5.join(bundledHooksDir, relPath);
      const dest = path5.join(hooksDir, relPath);
      copyFile(src, dest);
      const key = `hooks/${relPath}`;
      fileHashes[key] = hashFile(src);
      totalFiles++;
    }
  }
  mergeSettings(baseDir, bundledDir);
  const manifest = {
    version,
    installedAt: (/* @__PURE__ */ new Date()).toISOString(),
    files: fileHashes,
    mode: "copy"
  };
  writeManifest(skillsDir, manifest);
  const data = {
    status: "installed",
    mode: "copy",
    version,
    filesInstalled: totalFiles,
    skillsDir,
    hooksDir
  };
  printResult(
    data,
    json,
    () => [
      formatHeader("medical-protocol installed"),
      formatTable([
        ["Version", `v${version}`],
        ["Files", `${totalFiles}`],
        ["Skills", skillsDir],
        ["Hooks", hooksDir]
      ]),
      "",
      "Next: open Claude Code in this project and run  /medical-protocol:start  to build your first interface.",
      ""
    ].join("\n")
  );
}
var import_picocolors2, import_child_process3, fs5, path5;
var init_install = __esm({
  "packages/medical-protocol/src/commands/install.ts"() {
    "use strict";
    init_dist4();
    import_picocolors2 = __toESM(require_picocolors());
    init_package();
    init_files();
    init_manifest();
    init_settings();
    init_format();
    init_prompts();
    import_child_process3 = require("child_process");
    fs5 = __toESM(require("fs"));
    path5 = __toESM(require("path"));
  }
});

// packages/medical-protocol/src/commands/check.ts
var check_exports = {};
__export(check_exports, {
  run: () => run3
});
async function run3(opts) {
  const baseDir = opts.dir;
  const skillsDir = getSkillsDir(baseDir);
  const linkManifest = readManifest(path6.join(baseDir, ".claude"));
  if (linkManifest?.mode === "link") {
    if (isInteractive(opts)) {
      await checkLinkedInteractive(baseDir, linkManifest);
    } else {
      checkLinked(baseDir, linkManifest, !!opts.json);
    }
    return;
  }
  const manifest = readManifest(skillsDir);
  if (!manifest) {
    if (isInteractive(opts)) {
      O2.error("Not installed. Run 'medical-protocol install' first.");
    } else {
      process.stderr.write(formatError("Not installed. Run 'medical-protocol install' first.") + "\n");
    }
    process.exitCode = 1;
    return;
  }
  if (isInteractive(opts)) {
    await checkCopyInteractive(baseDir, manifest);
  } else {
    checkCopy(baseDir, manifest, !!opts.json);
  }
}
async function checkLinkedInteractive(baseDir, manifest) {
  mt(import_picocolors3.default.bgCyan(import_picocolors3.default.black(" medical-protocol ")));
  const s = fe();
  s.start("Checking plugin status...");
  const { issues, repoStatus } = gatherLinkedStatus(baseDir, manifest);
  const healthy = issues.length === 0;
  if (healthy) {
    s.stop(import_picocolors3.default.green("Plugin is healthy"));
  } else {
    s.stop(import_picocolors3.default.yellow(`${issues.length} issue(s) found`));
  }
  O2.info(`Version: v${manifest.version} | Mode: symlink`);
  if (repoStatus) {
    O2.info(`Branch: ${repoStatus.branch} | Ahead: ${repoStatus.ahead} | Behind: ${repoStatus.behind}`);
    if (repoStatus.behind > 0) {
      O2.warn(`Behind by ${repoStatus.behind} commits \u2014 run 'medical-protocol update' to pull latest.`);
    }
  }
  if (issues.length > 0) {
    for (const issue of issues) {
      O2.warn(issue);
    }
  }
  gt(healthy ? import_picocolors3.default.green("All good") : import_picocolors3.default.yellow("Issues need attention"));
  if (!healthy) {
    process.exitCode = 1;
  }
}
async function checkCopyInteractive(baseDir, manifest) {
  mt(import_picocolors3.default.bgCyan(import_picocolors3.default.black(" medical-protocol ")));
  const s = fe();
  s.start("Checking plugin status...");
  const { stale, added, removed, modified, issues, upToDate } = gatherCopyStatus(baseDir, manifest);
  if (upToDate) {
    s.stop(import_picocolors3.default.green("Plugin is up-to-date"));
  } else {
    s.stop(import_picocolors3.default.yellow("Updates available"));
  }
  O2.info(`Installed: v${manifest.version} | Bundled: v${version}`);
  if (stale.length > 0) O2.warn(`Stale: ${stale.length} file(s)`);
  if (added.length > 0) O2.info(`New: ${added.length} file(s)`);
  if (removed.length > 0) O2.info(`Removed upstream: ${removed.length} file(s)`);
  if (modified.length > 0) O2.warn(`Locally modified: ${modified.length} file(s)`);
  for (const issue of issues) O2.warn(issue);
  gt(upToDate ? import_picocolors3.default.green("All good") : import_picocolors3.default.yellow("Run 'medical-protocol update' to fix"));
  if (!upToDate) {
    process.exitCode = 1;
  }
}
function gatherLinkedStatus(baseDir, manifest) {
  const skillsDir = getSkillsDir(baseDir);
  const hooksDir = getHooksDir(baseDir);
  const sourcePath = manifest.sourcePath;
  const issues = [];
  if (!fs6.existsSync(skillsDir)) {
    issues.push("Skills directory missing");
  } else if (!isSymlink(skillsDir)) {
    issues.push("Skills directory is not a symlink (expected linked mode)");
  } else {
    const target = fs6.readlinkSync(skillsDir);
    if (!fs6.existsSync(target)) {
      issues.push(`Skills symlink target missing: ${target}`);
    }
  }
  if (fs6.existsSync(hooksDir)) {
    const entries = fs6.readdirSync(hooksDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "hooks.json") continue;
      const fullPath = path6.join(hooksDir, entry.name);
      if (isSymlink(fullPath)) {
        const target = fs6.readlinkSync(fullPath);
        if (!fs6.existsSync(target)) {
          issues.push(`Broken hook symlink: ${entry.name} -> ${target}`);
        }
      }
    }
  }
  issues.push(...hookIssues(baseDir, path6.join(sourcePath, "plugin")));
  let repoStatus = null;
  if (fs6.existsSync(path6.join(sourcePath, ".git"))) {
    try {
      repoStatus = getRepoStatus(sourcePath);
    } catch {
      issues.push("Could not read source repo status");
    }
  } else {
    issues.push(`Source repo not found at ${sourcePath}`);
  }
  return { issues, repoStatus };
}
function gatherCopyStatus(baseDir, manifest) {
  const skillsDir = getSkillsDir(baseDir);
  const bundledDir = getBundledPluginDir();
  const bundledSkillsDir = path6.join(bundledDir, "skills");
  const bundledHooksDir = path6.join(bundledDir, "hooks");
  const stale = [];
  const added = [];
  const removed = [];
  const modified = [];
  const allBundledKeys = /* @__PURE__ */ new Set();
  for (const [prefix, bundledBase] of [
    ["skills", bundledSkillsDir],
    ["hooks", bundledHooksDir],
    ["lib", path6.join(bundledDir, "lib")],
    ["scripts", path6.join(bundledDir, "scripts")],
    ["agents", path6.join(bundledDir, "agents")]
  ]) {
    if (!fs6.existsSync(bundledBase)) continue;
    const files = listFiles(bundledBase);
    for (const relPath of files) {
      const key = `${prefix}/${relPath}`;
      allBundledKeys.add(key);
      const bundledHash = hashFile(path6.join(bundledBase, relPath));
      const manifestHash = manifest.files[key];
      if (!manifestHash) {
        added.push(key);
      } else if (bundledHash !== manifestHash) {
        stale.push(key);
      }
    }
  }
  for (const key of Object.keys(manifest.files)) {
    if (!allBundledKeys.has(key)) {
      removed.push(key);
    }
  }
  for (const key of Object.keys(manifest.files)) {
    const installedPath = resolveInstalledPath2(baseDir, key);
    if (!installedPath || !fs6.existsSync(installedPath)) continue;
    const installedHash = hashFile(installedPath);
    if (installedHash !== manifest.files[key]) {
      modified.push(key);
    }
  }
  const issues = hookIssues(baseDir, bundledDir);
  const upToDate = stale.length === 0 && added.length === 0 && removed.length === 0 && issues.length === 0;
  return { stale, added, removed, modified, issues, upToDate };
}
function checkLinked(baseDir, manifest, json) {
  const sourcePath = manifest.sourcePath;
  const { issues, repoStatus } = gatherLinkedStatus(baseDir, manifest);
  const healthy = issues.length === 0;
  const data = {
    status: healthy ? "healthy" : "issues-found",
    mode: "link",
    installedVersion: manifest.version,
    bundledVersion: version,
    sourcePath,
    repoStatus,
    issues
  };
  printResult(data, json, () => {
    const lines = [formatHeader("medical-protocol status (linked)")];
    lines.push(
      formatTable([
        ["Installed version", `v${manifest.version}`],
        ["Bundled version", `v${version}`],
        ["Mode", "symlink"],
        ["Source", sourcePath],
        ["Status", healthy ? "Healthy" : `${issues.length} issue(s)`]
      ])
    );
    if (repoStatus) {
      lines.push(
        formatTable([
          ["Branch", repoStatus.branch],
          ["Ahead", `${repoStatus.ahead}`],
          ["Behind", `${repoStatus.behind}`]
        ])
      );
      if (repoStatus.behind > 0) {
        lines.push(`
  Run 'medical-protocol update --dir ${path6.resolve(baseDir)}' to pull latest changes.`);
      }
    }
    if (issues.length > 0) {
      lines.push(`
  Issues:`);
      for (const issue of issues) lines.push(`    - ${issue}`);
    }
    lines.push("");
    return lines.join("\n");
  });
  if (!healthy) {
    process.exitCode = 1;
  }
}
function checkCopy(baseDir, manifest, json) {
  const { stale, added, removed, modified, issues, upToDate } = gatherCopyStatus(baseDir, manifest);
  const data = {
    status: upToDate ? "up-to-date" : "updates-available",
    mode: "copy",
    installedVersion: manifest.version,
    bundledVersion: version,
    stale,
    added,
    removed,
    modified,
    issues
  };
  printResult(data, json, () => {
    const lines = [formatHeader("medical-protocol status")];
    lines.push(
      formatTable([
        ["Installed version", `v${manifest.version}`],
        ["Bundled version", `v${version}`],
        ["Status", upToDate ? "Up-to-date" : "Updates available"]
      ])
    );
    if (stale.length > 0) {
      lines.push(`
  Stale (${stale.length}):`);
      for (const f of stale) lines.push(`    ${f}`);
    }
    if (added.length > 0) {
      lines.push(`
  New files (${added.length}):`);
      for (const f of added) lines.push(`    ${f}`);
    }
    if (removed.length > 0) {
      lines.push(`
  Removed upstream (${removed.length}):`);
      for (const f of removed) lines.push(`    ${f}`);
    }
    if (modified.length > 0) {
      lines.push(`
  Locally modified (${modified.length}):`);
      for (const f of modified) lines.push(`    ${f}`);
    }
    if (issues.length > 0) {
      lines.push(`
  Issues:`);
      for (const issue of issues) lines.push(`    - ${issue}`);
    }
    lines.push("");
    return lines.join("\n");
  });
  if (!upToDate) {
    process.exitCode = 1;
  }
}
function resolveInstalledPath2(baseDir, key) {
  if (key.startsWith("skills/")) {
    return path6.join(getSkillsDir(baseDir), key.slice("skills/".length));
  }
  if (key.startsWith("hooks/")) {
    return path6.join(getHooksDir(baseDir), key.slice("hooks/".length));
  }
  if (key.startsWith("lib/")) {
    return path6.join(getLibDir(baseDir), key.slice("lib/".length));
  }
  if (key.startsWith("scripts/")) {
    return path6.join(getScriptsDir(baseDir), key.slice("scripts/".length));
  }
  if (key.startsWith("agents/")) {
    return path6.join(getAgentsDir(baseDir), key.slice("agents/".length));
  }
  return null;
}
var import_picocolors3, fs6, path6;
var init_check = __esm({
  "packages/medical-protocol/src/commands/check.ts"() {
    "use strict";
    init_dist4();
    import_picocolors3 = __toESM(require_picocolors());
    init_package();
    init_files();
    init_manifest();
    init_format();
    init_prompts();
    init_settings();
    fs6 = __toESM(require("fs"));
    path6 = __toESM(require("path"));
  }
});

// packages/medical-protocol/node_modules/commander/esm.mjs
var import_index = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  // deprecated old name
  Command,
  Argument,
  Option,
  Help
} = import_index.default;

// packages/medical-protocol/src/index.ts
init_package();
var program2 = new Command();
program2.name("medical-protocol").description("Install and manage the medical-protocol plugin for Claude Code").version(`v${version}`, "-v, --version").option("-y, --yes", "Skip prompts, use defaults");
program2.command("install").description("Install the plugin into your project").option("--dir <path>", "Target project directory", process.cwd()).option("--force", "Overwrite existing installation").option("--link", "Use symlinks to a shared repo clone instead of copying").option("--source <path>", "Path to repo clone (default: ~/.medical-protocol)").option("--agent-browser", "Also install agent-browser (browser-QA tool) globally").option("--json", "Output as JSON").action(async (opts) => {
  const yes = program2.opts().yes;
  const mod = await Promise.resolve().then(() => (init_install(), install_exports));
  await mod.run({ ...opts, yes });
});
program2.command("check").description("Check if the plugin is up-to-date").option("--dir <path>", "Target project directory", process.cwd()).option("--json", "Output as JSON").action(async (opts) => {
  const yes = program2.opts().yes;
  const mod = await Promise.resolve().then(() => (init_check(), check_exports));
  await mod.run({ ...opts, yes });
});
program2.command("update").description("Update the plugin to the latest version").option("--dir <path>", "Target project directory", process.cwd()).option("--force", "Overwrite locally modified files").option("--json", "Output as JSON").action(async (opts) => {
  const yes = program2.opts().yes;
  const mod = await Promise.resolve().then(() => (init_update(), update_exports));
  await mod.run({ ...opts, yes });
});
program2.action(() => {
  program2.help();
});
program2.parse();
