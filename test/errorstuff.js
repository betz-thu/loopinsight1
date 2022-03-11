var mylog = function (buffer) {
    var rest = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        rest[_i - 1] = arguments[_i];
    }
    console.log("<<<".concat(buffer, ">>>"));
    return true;
};
var debugLog = "";
var log_fun = function (params) {
    var args;
    if (typeof params === 'object') {
        args = Object.values(arguments);
    }
    else {
        args = [arguments];
    }
    for (var _i = 0, args_1 = args; _i < args_1.length; _i++) {
        var arg = args_1[_i];
        if (typeof arg === "string") {
            debugLog = debugLog + arg.trim() + " ";
        }
        else if (typeof arg === "object") {
            debugLog = debugLog + JSON.stringify(arg) + ";";
        }
        else {
            debugLog = debugLog + JSON.stringify(arg);
        }
    }
    debugLog = debugLog + ";";
};
process.stderr.write = log_fun;
//console.log = mylog as any
process.stderr.write('Hi');
console.error('foo');
console.log(debugLog);
