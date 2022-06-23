var requireUncached = require('./_utils/requireUncached');

// Dependencies
var vows = require('vows'),
    assert = require('assert');

vows.describe('Tests for strict mode').addBatch({

  "Specifying an unused NODE_ENV value and valid NODE_APP_INSTANCE value throws an exception": _expectException({
    NODE_ENV         : 'BOOM',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage : "FATAL: NODE_ENV value of 'BOOM' did not match any deployment config file names. "
                     + "Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),

  // Because NODE_ENV=development = default
  "Specifying NODE_ENV=development with no development file does not throw an exception. ": _expectException({
    NODE_ENV         : 'development',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage : null,
  }),

  "Specifying NODE_ENV=production,cloud with no cloud file throws an exception. ": _expectException({
    NODE_ENV         : 'production,cloud',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage : "FATAL: NODE_ENV value of 'cloud' did not match any deployment config file names. "
                     + "Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode"
  }),

  "Specifying an unused NODE_APP_INSTANCE and valid NODE_ENV value throws an exception": _expectException({
    NODE_ENV         : 'valid-deployment',
    APP_INSTANCE     : 'BOOM',
    exceptionMessage : "FATAL: NODE_APP_INSTANCE value of 'BOOM' did not match any instance config file names. "
                     + "Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),

  "NODE_ENV=default throws exception: reserved word": _expectException({
    NODE_ENV         : 'default',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage :"FATAL: NODE_ENV value of 'default' is ambiguous. "
                     +"Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),

  "NODE_ENV=production,default throws exception: reserved word": _expectException({
    NODE_ENV         : 'production,default',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage :"FATAL: NODE_ENV value of 'default' is ambiguous. "
                     +"Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),

  "NODE_ENV=local throws exception: reserved word": _expectException({
    NODE_ENV         : 'local',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage :"FATAL: NODE_ENV value of 'local' is ambiguous. "
                     +"Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),

  "Specifying reserved word for NODE_CONFIG_ENV throws reserved word exception with appropriate wording": _expectException({
    NODE_CONFIG_ENV  : 'local',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage :"FATAL: NODE_CONFIG_ENV value of 'local' is ambiguous. "
                     +"Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),

  "Specifying NODE_CONFIG_ENV=production,cloud with no cloud file throws an exception with appropriate wording": _expectException({
    NODE_CONFIG_ENV  : 'cloud',
    APP_INSTANCE     : 'valid-instance',
    exceptionMessage :"FATAL: NODE_CONFIG_ENV value of 'cloud' did not match any deployment config file names. "
                     +"Strict mode is on, aborting. See https://github.com/node-config/node-config/wiki/Strict-Mode",
  }),
})
.addBatch({

  "Specifying an unused NODE_ENV value and valid NODE_APP_INSTANCE value shows warnings when strict mode is off": _verifyConsoleOutput({
    NODE_ENV         : 'BOOM',
    APP_INSTANCE     : 'valid-instance',
    warningMessage   : "WARNING: NODE_ENV value of 'BOOM' did not match any deployment config file names.",
    tryToSuppress    : false,
    canBeSuppressed  : true,
  }),

  "Specifying an unused NODE_ENV value and valid NODE_APP_INSTANCE shows no warnings when strict mode is off and warnings are suppressed": _verifyConsoleOutput({
    NODE_ENV         : 'BOOM',
    APP_INSTANCE     : 'valid-instance',
    tryToSuppress    : true,
    canBeSuppressed  : true
  }),

  "Specifying an unused NODE_APP_INSTANCE and valid NODE_ENV shows warnings when strict mode is off": _verifyConsoleOutput({
    NODE_ENV         : 'valid-deployment',
    APP_INSTANCE     : 'BOOM',
    warningMessage   : "WARNING: NODE_APP_INSTANCE value of 'BOOM' did not match any instance config file names.",
    tryToSuppress    : false,
    canBeSuppressed  : true
  }),

  "Specifying an unused NODE_APP_INSTANCE and valid NODE_ENV shows no warnings when strict mode is off and warnings are suppressed": _verifyConsoleOutput({
    NODE_ENV         : 'valid-deployment',
    APP_INSTANCE     : 'BOOM',
    tryToSuppress    : true,
    canBeSuppressed  : true
  }),

  "NODE_ENV=default shows warnings when strict mode is off: reserved word": _verifyConsoleOutput({
    NODE_ENV         : 'default',
    APP_INSTANCE     : 'valid-instance',
    warningMessage   : "WARNING: NODE_ENV value of 'default' is ambiguous.",
    tryToSuppress    : false,
    canBeSuppressed  : false
  }),

  "NODE_ENV=default warning message cannot be suppressed": _verifyConsoleOutput({
    NODE_ENV         : 'default',
    APP_INSTANCE     : 'valid-instance',
    tryToSuppress    : true,
    canBeSuppressed  : false
  })

})
.export(module);

// helper function to create similar tests
// Pass in NODE_ENV and APP_INSTANCE and an 'exceptionMessage' that is' expected to be generated by the combo under strict mode.
function _expectException (opts) {
  return {
    topic: function () {
      // Change the configuration directory for testing
      process.env.NODE_CONFIG_DIR         = __dirname + '/6-config';
      process.env.NODE_CONFIG_STRICT_MODE = 1;
      process.env.NODE_APP_INSTANCE       = opts.APP_INSTANCE;

      if (!!opts.NODE_ENV) {
        process.env.NODE_ENV              = opts.NODE_ENV;
      }

      if (!!opts.NODE_CONFIG_ENV) {
        process.env.NODE_CONFIG_ENV       = opts.NODE_CONFIG_ENV;
      }

      delete process.env.NODE_CONFIG;
      try {
        var config = requireUncached(__dirname + '/../lib/config');
      }
      catch (e) {
        return e;
      }

      // No error
      return null;
    },

    'Exception is an error object': function(error) {
        // Allow case for exceptionMessage=null to indicate no error
        if (opts.exceptionMessage) {
          assert.instanceOf(error,Error);
        }
    },

    'Exception contains expected string': function (error) {
      // This conditional allows to test for error===null
      if (error) {
        assert.equal(error.message, opts.exceptionMessage );
      }
      else {
        assert.equal(error, opts.exceptionMessage );
      }
    }
  };
}

// Helper function similar to above, but geared towards analyzing console output
function _verifyConsoleOutput (opts) {

  // Appended to all warnings when strict mode is off
  var strictModeNotice = 'WARNING: Strict mode is off, continuing. See https://github.com/node-config/node-config/wiki/Strict-Mode'
  // Appended to warnings which can be suppressed
  var suppressNotice = 'WARNING: To disable this warning, set SUPPRESS_NO_CONFIG_WARNING in the environment.';

  var tests = {
    topic: function() {
      process.env.NODE_CONFIG_DIR             = __dirname + '/6-config';
      process.env.NODE_CONFIG_STRICT_MODE     = 0;
      process.env.NODE_APP_INSTANCE           = opts.APP_INSTANCE;
      process.env.NODE_ENV                    = opts.NODE_ENV;
      if (opts.tryToSuppress) {
        process.env.SUPPRESS_NO_CONFIG_WARNING = 1;
      } else {
        // process.env coerces even undefined to 'undefined', so we must delete
        delete process.env.SUPPRESS_NO_CONFIG_WARNING;
      }
      delete process.env.NODE_CONFIG;
      delete process.env.NODE_CONFIG_ENV;

      var consoleError,
        messages = [];

      // We collect messages by temporarily overriding console.error
      consoleError = console.error;
      console.error = _collectMessage;
      requireUncached(__dirname + '/../lib/config');
      console.error = consoleError;

      function _collectMessage(line) {
        messages.push(line);
      }

      return messages;
    }
  };

  if (!opts.tryToSuppress) {
    tests['Expected warning messages are shown when strict mode is off'] = function(messages) {
      var expectedMessages = [opts.warningMessage, strictModeNotice]
      if (opts.canBeSuppressed) {
        expectedMessages.push(suppressNotice);
      }
      assert.deepEqual(messages, expectedMessages);
    }


  } else if (opts.tryToSuppress) {
    tests['Warning messages are suppressed when strict mode is off and SUPPRESS_NO_CONFIG_WARNING is set'] = function(messages) {
      assert.equal(messages.length, 0);
    }

  }

  return tests;
}