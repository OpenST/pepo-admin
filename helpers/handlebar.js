const rootPrefix = '..';

const BigNumber = require('bignumber.js');

var helper = null;

module.exports = helper = {
  block: function(name) {
    var blocks = this._blocks,
      content = blocks && blocks[name];

    return content ? content.join('\n') : null;
  },

  contentFor: function(name, options) {
    var blocks = this._blocks || (this._blocks = {}),
      block = blocks[name] || (blocks[name] = []);

    block.push(options.fn(this));
  },

  convertWeiToNormal: function(value) {
    var divisor = new BigNumber(10).pow(18);
    return new BigNumber(value).div(divisor);
  }
};
