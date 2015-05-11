var dateFormat = require('dateformat');
var path = require('path');
var util = require('util');

var colors = {
    debug: 'green',
    info:  'cyan',
    silly: 'magenta',
    warn:  'yellow',
    error: 'red'
};

var levels = {
	"silent": 0,
	"error": 1,
	"warn": 2,
	"info": 3,
	"debug": 4
};

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
};

var mino_logger = {
	set_level: function(level) {
		mino_logger.current_level = level;
	},
    set_format: function() {
        mino_logger.current_format = arguments[0];
    },
	info: function() {
		mino_logger.log("info", arguments);
	},
	debug: function() {
		mino_logger.log("debug", arguments);
	},
	warn: function() {
		mino_logger.log("warn", arguments);
	},
	error: function() {
		mino_logger.log("error", arguments);
	},
	log: function(level, args) {

		if (levels[level] !== undefined && levels[mino_logger.current_level] < levels[level]) {
			return;
		}

        var options = analyze_stack();
        options.level = level;

		console.log(mino_logger.format(args[0], options));

		for (var i=1; i<args.length; i++) {
            console.log(mino_logger.format(args[i], options));
		}

	},
    format: function(message, options) {
        if (mino_logger.current_format !== "json" && typeof message === 'object') {
    		try {
                message = JSON.stringify(message, null, 4);
    		} catch (err) {
    			message = util.inspect(message);
    		}
    	}

        var time = dateFormat(new Date(), "isoDateTime");
        var colored_level = options.level.toUpperCase()[colors[options.level]] || '';
        var file = options.file || '';
        var line = options.line || '';
        var method = options.method || '';

        var output;
        if (mino_logger.current_format === "json") {
            var object = {
                time: time,
                level: options.level,
                stack: {
                    file: file,
                    line: line,
                    file_line: file + ":" + line,
                    method: method
                },
                data: message
            };
            try {
                output = JSON.stringify(object);
            } catch (err) {
                output = util.inspect(output);
            }
        } else {
        	output = time + ' <' + colored_level + '> ' + file + ':' + line + ' (' + method +') ' + message;
        }
        return output;
    }
};

mino_logger.set_level('info');
mino_logger.set_format('text');

module.exports = mino_logger;
