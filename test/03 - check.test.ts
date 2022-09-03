import { expect, should, config } from 'chai';
import { SECTION } from './utils';
import { XScanner } from '../out/index';
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
describe(SECTION('XScanner - Check Methods'), function () {
  this.beforeEach(function () {
    xs = new XScanner(testText);
  });

  describe('#checkString()', function () {
    xit('properly checks a string input and does not update position', function () {});
  });
});
