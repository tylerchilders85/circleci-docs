import Cookies from 'js-cookie';
import { updateCookieExpiration } from '../utils';

export function setUserData(userData) {
  window.userData = userData;
  const { name, jekyllProperties } = window.currentPage;
  if (window.userData.created_at) {
    AnalyticsClient.trackPage(name, {
      ...jekyllProperties,
      user_account_created_at: userData.created_at,
    });
  } else {
    AnalyticsClient.trackPage(name, jekyllProperties);
  }

  // emit an event to let the system know that userData is ready/has changed
  const userDataReady = new CustomEvent('userDataReady');
  window.dispatchEvent(userDataReady);
}

export function setLoggedIn(userData) {
  $(document.body).addClass('loggedin');
  Cookies.set('cci-customer', 'true', { expires: 365 * 2 });

  setUserData(userData);
}

export function setLoggedOut() {
  $(document.body).removeClass('loggedin');
  Cookies.set('cci-customer', 'false', { expires: 365 * 2 });

  setUserData({});
}

export function fetchUserData() {
  // Update cookie expiry (migrating from 10 years to 2 years)
  updateCookieExpiration('cci-customer', 365 * 2);

  if (Cookies.get('cci-customer') === 'true') {
    $(document.body).addClass('loggedin');
  }

  $.ajax({
    url: 'https://circleci.com/api/v1/me',
    xhrFields: {
      withCredentials: true,
    },
    dataType: 'json',
    timeout: 10000, // 10 seconds
  })
    .done(function (userData) {
      setLoggedIn(userData);
      setAmplitudeId(); // set Amplitude required data
    })
    .fail(function () {
      setLoggedOut();
    });
}

$(fetchUserData);

export function setAmplitudeId() {
  const DAYS_PER_MINUTE = 1 / 24 / 60;
  const sessionId = window.AnalyticsClient.getSessionId();

  Cookies.set('amplitude-session-id', sessionId, {
    expires: 30 * DAYS_PER_MINUTE,
  });
  window.AnalyticsClient.trackUser(userData.analytics_id);
}
