import { expect, should, config, assert } from 'chai';
import { XScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  goodString,
  goodStringCI,
  badString,
  goodRegex,
  goodRegexCI,
  badRegex,
  testEnumOutput,
  testPointerName,
  testTypeName,
  testMacroName,
} from './constants';

// Initialize chai.should so that it can be used.
should();

// Disable truncation from chai output.
config.truncateThreshold = 0;

var xs: XScanner;

console.log(
  `
  Key For Mode Names:
  N = Normal Mode
  I = Case Insensitive Mode
  F = Full Output Mode
  A = Advanced Output Mode
`.trim(),
);

// * TESTING START
describe(SECTION('XScanner - Base'), function () {
  this.beforeEach(function () {
    xs = new XScanner(testText);
  });

  describe('@lastState', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('lastState');

      const badAssign = () => {
        // @ts-expect-error
        xs.lastState = {};
      };

      expect(badAssign).to.throw();
    });

    it('should equal the previous scanner match state', function () {
      xs
        .savePointer(testPointerName)
        .scan(goodString)

      xs.lastState.should.deep.equal(xs.pointers[testPointerName])
    });
  });

  describe('@text', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('text');

      const badAssign = () => {
        // @ts-expect-error
        xs.text = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should equal the total scanner text', function () {});
  });

  describe('@scannedText', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('scannedText');

      const badAssign = () => {
        // @ts-expect-error
        xs.text = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be an empty string', function () {});

    xit('should equal the already scanned text', function () {});

    xit('should equal @text after full scan', function () {});
  });

  describe('@unscannedText', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('scannedText');

      const badAssign = () => {
        // @ts-expect-error
        xs.text = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially equal @text', function () {});

    xit('should equal the unscanned text', function () {});

    xit('should be an empty string after full scan', function () {});
  });

  describe('@pos', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('pos');

      const badAssign = () => {
        // @ts-expect-error
        xs.pos = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be 0', function () {});

    xit('should equal the current scanner position', function () {});
  });

  describe('@lastPos', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('lastPos');

      const badAssign = () => {
        // @ts-expect-error
        xs.lastPos = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be 0', function () {});

    xit('should equal the last scanner position', function () {});
  });

  describe('@lastMatch', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('lastMatch');

      const badAssign = () => {
        // @ts-expect-error
        xs.lastMatch = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be null', function () {});

    xit('should equal the last scanner matched text', function () {});
  });

  describe('@pointers', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('pointers');

      const badAssign = () => {
        // @ts-expect-error
        xs.pointers = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should equal an object of all the saved scan pointers', function () {});
  });

  describe('@types', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('types');

      const badAssign = () => {
        // @ts-expect-error
        xs.types = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be an empty object', function () {});

    xit('should equal an object of all the scan types', function () {});
  });

  describe('@macros', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('macros');

      const badAssign = () => {
        // @ts-expect-error
        xs.macros = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be an empty object', function () {});

    xit('should equal an object of all the scan macros', function () {});
  });

  describe('@outputTypes', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('outputTypes');

      const badAssign = () => {
        // @ts-expect-error
        xs.outputTypes = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should have default types "normal", "full", and "advanded"', function () {});

    xit('should equal an object of all the scan output types', function () {});
  });

  describe('@comparisonModes', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('comparisonModes');

      const badAssign = () => {
        // @ts-expect-error
        xs.comparisonModes = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should have default modes "normal" and "insensitive"', function () {});

    xit('should equal an object of all the comparison modes', function () {});
  });

  describe('@data', function () {
    it('should be read-only to the user', function () {
      xs.should.have.property('data');

      const badAssign = () => {
        // @ts-expect-error
        xs.data = {};
      };

      expect(badAssign).to.throw();
    });

    xit('should initially be an empty object', function () {});

    xit('should equal an object of all the saved scanner data', function () {});
  });

  describe('@outputType', function () {
    it('should be read-write to the user', function () {
      xs.should.have.property('outputType');

      xs.outputType = 'advanced';
    });

    xit('should have a default of "normal"', function () {});

    xit('should equal the current scan output type', function () {});

    xit('should throw an error if set to undefined type', function () {});
  });

  describe('@comparisonMode', function () {
    it('should be read-write to the user', function () {
      xs.should.have.property('comparisonMode');

      xs.comparisonMode = 'insensitive';
    });

    xit('should have a default of "normal"', function () {});

    xit('should equal the current comparison mode', function () {});

    xit('should throw an error if set to undefined mode', function () {});
  });
});
