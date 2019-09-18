const rootPrefix = '../..';

class Cookie {
  get loginCookieName() {
    return 'pal_c';
  }

  get csrfCookieName() {
    return '_ad_csrf';
  }
}

module.exports = new Cookie();
