import { expect, should, config } from 'chai';
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

// * TESTING START
describe(SECTION('XScanner - Extension Methods'), function () {
  this.beforeEach(function () {
    xs = new XScanner(testText);
  });

  describe('#savePointer()', function () {
    it('saves the current state of the scanner as a pointer', function () {
      xs.scan(goodString);

      expect(xs.pointers[testPointerName]).to.not.exist;

      xs.savePointer(testPointerName);

      // Test to make sure created pointer data is correct.
      xs.pointers[testPointerName].should.exist;
      xs.pointers[testPointerName].pos.should.equal(goodString.length);
      xs.pointers[testPointerName].lastPos.should.equal(0);
      xs.pointers[testPointerName].lastMatch.should.equal(goodString);
    });
  });
});
