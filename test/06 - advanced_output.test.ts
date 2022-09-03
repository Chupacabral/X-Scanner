import { expect, should, config } from 'chai';
import { AdvancedScannerOutput, XScanner } from '../out/index';
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
var out: AdvancedScannerOutput;

// * TESTING START
describe(SECTION('AdvancedScannerOutput'), function () {
  this.beforeEach(function () {
    xs = new XScanner(testText);
    out = new AdvancedScannerOutput(xs, { matched: true });
  });

  describe('@parent', function () {
    it('should return the parent XScanner object', function () {
      out.parent.should.equal(xs);
    });

    it('should not be nullable', function () {
      const badInit = () => {
        // @ts-expect-error
        out = new AdvancedScannerOutput(null, { matched: true });
      };

      badInit.should.throw();
    });

    it('should be read-only to the user', function () {
      const badAssign = () => {
        // @ts-expect-error
        out.parent = null;
      };

      badAssign.should.throw();
    });
  });

  describe('@matched', function () {
    it('should return a boolean value', function () {
      out.matched.should.be.a('boolean')

      // Test extreme case of nothing given for matched.
      // @ts-ignore
      out = new AdvancedScannerOutput(xs, { })

      out.matched.should.be.a('boolean')
    });

    it('should be read-only to the user', function () {
      const badAssign = () => {
        // @ts-expect-error
        out.matched = false
      }

      badAssign.should.throw()
    });
  });

  describe('@type', function () {
    xit('should be a string, null, or undefined', function () {});

    xit('should be read-only to the user', function () {});
  });

  describe('@key', function () {
    xit('should be able to be any value', function () {});

    xit('should be read-only to the user', function () {});
  });

  describe('@result', function () {
    xit('should be able to be any value', function () {});

    xit('should be read-only to the user', function () {});
  });

  describe('@textMatched', function () {
    xit('should be a string, null, or undefined', function () {});

    xit('should be read-only to the user', function () {});
  });

  describe('#then()', function () {
    it('should return the parent XScanner if a good match', function () {
      out.then?.should.equal(xs)
    });

    it('should return null if a bad match', function () {
      // @ts-ignore
      out = new AdvancedScannerOutput(xs, {})

      expect(out.then).to.be.null
    });
  });

  describe('#toString()', function () {
    xit('should output in the proper format', function () {});
  });
});
