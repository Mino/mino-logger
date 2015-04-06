var logger = require('winston');
var dateFormat = require('dateformat');
var path = require('path');
var util = require('util');

var colors = {
    debug: 'green',
    info:  'cyan',
    silly: 'magenta',
    warn:  'yellow',
    error: 'red'
}
logger.addColors(colors);

var levels = {
	"silent": 0,
	"error": 1,
	"warn": 2,
	"info": 3,
	"debug": 4
}

var formatter = function(options) {
	var time = dateFormat(new Date(), "isoDateTime");
	var level = options.level.toUpperCase()[colors[options.level]] || '';
	var file = options.meta.file || '';
	var line = options.meta.line || '';
	var method = options.method || '';
	var message = options.message || '';

	var output = time + ' <' + level + '> ' + file + ':' + line + ' (' + method +') ' + message;
	return output;
}


var analyze_stack = function() {
	//Based on https://github.com/baryon/tracer/blob/master/lib/console.js
	var stacklist = (new Error()).stack.split('\n').slice(4);
	var stackReg = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi;
	var stackReg2 = /at\s+()(.*):(\d*):(\d*)/gi;

	var data = {};
	var s = stacklist[0],
		sp = stackReg.exec(s) || stackReg2.exec(s);
	if (sp && sp.length === 5) {
		data.method = sp[1];
		data.path = sp[2];
		data.line = sp[3];
		data.pos = sp[4];
		data.file = path.basename(data.path);
		data.stack = stacklist.join('\n');
	}

	return data;
}

var format_message = function(message) {
	if (typeof message === 'object') {
		try {
			return JSON.stringify(message, null, 4);
		} catch (err) {
			return util.inspect(message);
		}
	} else {
		return message;
	}
}

var mino_logger = {
	set_level: function(level) {
		mino_logger.current_level = level;
		logger.remove(logger.transports.Console);
		logger.add(logger.transports.Console, {
			level: level,
			colorize: true, 
			formatter: formatter
		});
	},
	info: function() {
		mino_logger.log("info", arguments);
	},
	debug: function(message, meta) {
		mino_logger.log("debug", arguments);
	},
	warn: function(message, meta) {
		mino_logger.log("warn", arguments);
	},
	error: function(message, meta) {
		mino_logger.log("error", arguments);
	},
	log: function(level, args) {

		if (levels[level] !== undefined && levels[mino_logger.current_level] < levels[level]) {
			return;
		}

		var meta = {};
		var message = format_message(args[0])

		for (var i=1; i<args.length; i++) {
			message += ' ' + format_message(args[i]);
		}

		var meta = analyze_stack();
		logger.log(level, message, meta);
	}
}

mino_logger.set_level('info');

module.exports = mino_logger;