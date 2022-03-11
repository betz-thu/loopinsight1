// const mylog = function(buffer: string, ...rest: any[]): boolean {
//     console.log(`<<<${buffer}>>>`)
//     return true
// }

// const old_fun = process.stderr.write

// let debugLog = ""
// var log_fun = function (params: string | any[] | Object) {

// 	let args: any[]
// 	if (typeof params === 'object') {
// 		args = Object.values(arguments);
// 	}
// 	else {
// 		args = [arguments];
// 	}

// 	for (const arg of args) {
// 		if (typeof arg === "string") {
// 			debugLog = debugLog + arg.trim() + " ";
// 		}
// 		else if (typeof arg === "object") {
// 			debugLog = debugLog + JSON.stringify(arg) + ";";
// 		}
// 		else {
// 			debugLog = debugLog + JSON.stringify(arg);
// 		}
// 	}
// 	debugLog = debugLog + ";";

//     return old_fun(params)
// }

// process.stderr.write = log_fun as any
// //console.log = mylog as any

// process.stderr.write('Hi')
// console.error('foo')

// console.log(debugLog)