/**
 * Convenience function that promisifies an asynchronous chrome.debugger
 * function.
 *
 * @param fn A Chrome Debugger function. See https://developer.chrome.com/extensions/debugger#methods
 * @param args Arguments to be passed to `fn`.
 */
const callAsyncDebuggerFn = (fn, ...args) =>
  new Promise((resolve) => {
    const callback = (...callbackArgs) => resolve(...callbackArgs);
    fn.call(this, ...args, callback);
  });

function getDebuggee() {
  return {
    tabId: chrome.devtools.inspectedWindow.tabId,
  };
}

async function startProfiling(debuggee) {
  await callAsyncDebuggerFn(chrome.debugger.attach, debuggee, "1.2");
  await callAsyncDebuggerFn(
    chrome.debugger.sendCommand,
    debuggee,
    "Profiler.enable"
  );
  await callAsyncDebuggerFn(
    chrome.debugger.sendCommand,
    debuggee,
    "Profiler.start"
  );
}

async function stopProfiling(debuggee) {
  const { profile } = await callAsyncDebuggerFn(
    chrome.debugger.sendCommand,
    debuggee,
    "Profiler.stop"
  );
  await callAsyncDebuggerFn(
    chrome.debugger.sendCommand,
    debuggee,
    "Profiler.disable"
  );
  await callAsyncDebuggerFn(chrome.debugger.detach, debuggee);

  return profile;
}

async function profileForAShortTime() {
  try {
    const debuggee = getDebuggee();
    await startProfiling(debuggee);
    setTimeout(async () => {
      // Chrome DevTools Profile https://chromedevtools.github.io/devtools-protocol/tot/Profiler/#type-Profile
      const profile = await stopProfiling(debuggee);
      console.log(profile);
    }, 1000);
  } catch (e) {
    await stopProfiling();
  }
}

document
  .getElementById("profile")
  .addEventListener("click", profileForAShortTime);

profileForAShortTime();
