const { start, error, done, log } = require("../../utils/logger");
const prettyTime = require("pretty-hrtime");

function formatError(e) {
  if (!e.error) {
    return e.message;
  }

  // PluginError
  if (typeof e.error.showStack === "boolean") {
    return e.error.toString();
  }

  // Normal error
  if (e.error.stack) {
    return e.error.stack;
  }
  if (typeof e.error === "object") {
    try {
      e.error = JSON.stringify(e.error);
    } catch (error) {}
  }
  return new Error(String(e.error)).stack;
}

function logEvents(gulpInst) {
  const loggedErrors = [];

  gulpInst.on("start", function (evt) {
    if (["watch", "<series>", "<parallel>"].includes(evt.name)) return;
    log();
    start("'" + evt.name + "'...");
  });

  gulpInst.on("stop", function (evt) {
    if (["watch", "<series>", "<parallel>"].includes(evt.name)) return;
    const time = prettyTime(evt.duration);
    log();
    done("'" + evt.name + "'耗时" + time);
  });

  gulpInst.on("error", function (evt) {
    const msg = formatError(evt);
    const time = prettyTime(evt.duration);
    error("'" + evt.name + "' errored after" + time);

    // If we haven't logged this before, log it and add to list
    if (loggedErrors.indexOf(evt.error) === -1) {
      error(msg);
      loggedErrors.push(evt.error);
    }
  });
}

module.exports = logEvents;
