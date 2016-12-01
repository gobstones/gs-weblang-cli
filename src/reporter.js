var gsWeblangCore = require("gs-weblang-core/umd/index.umd");
var Context = gsWeblangCore.Context;
var parser = gsWeblangCore.getParser();
_ = require("lodash");

var NoProgramsFoundError = function() { }
NoProgramsFoundError.prototype = new Error("No programs found");

var reporter = {}

reporter.run = function(code, initialBoard, format) {
  var ast;
  try {
    ast = parser.parseProgram(code);
    if (ast.length === 0) throw new NoProgramsFoundError();
    ast = ast[0];
  } catch (err) {
    return this._buildError(function() {
      return {
        status: "compilation_error",
        result: this._buildCompilationError(err)
      };
    });
  }

  try {
    var board = ast.interpret(new Context()).board();
    board.table = format == "gbb"
      ? gsWeblangCore.gbb.builder.build(board)
      : board.toView();

    return {
      status: "passed",
      result: board
    }
  } catch (err) {
    return this._buildError(function() {
      return {
        status: "runtime_error",
        result: this._buildRuntimeError(err)
      };
    });
  }
}

reporter._buildCompilationError = function(error) {
  return {
    on: error.on,
    message: error.error
  }
}

reporter._buildRuntimeError = function(error) {
  error.on = error.on.token;
  return _.pick(error, "on", "message");
}

reporter._buildError = function(builder) {
  try {
    return builder()
  } catch (err) {
    return {
      status: "all_is_broken_error",
      message: "Something has gone very wrong",
      detail: err,
      moreDetail: err.message
    }
  }
}
module.exports = reporter
