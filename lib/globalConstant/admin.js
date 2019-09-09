const rootPrefix = '../..';

class Admin {
  get loginCookieName() {
    return 'pal_c';
  }
}

module.exports = new Admin();
