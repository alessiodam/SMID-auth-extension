const pendingRequests = new Map();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCookie') {
    getCookie(message.domain)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('Error getting cookie:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
  else if (message.action === 'fetchAuthCode') {
    fetchAuthCode(message.phpSessId, message.domain)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('Error in background script:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
  else if (message.action === 'getAuthCodeFromCurrentPage') {
    getAuthCodeForCurrentTab(sender.tab)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('Error getting auth code for current tab:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
  else if (message.action === 'approveExternalRequest') {
    const requestId = message.requestId;
    if (pendingRequests.has(requestId)) {
      const pendingRequest = pendingRequests.get(requestId);

      if (message.approved) {
        getAuthCodeForDomain(pendingRequest.domain)
          .then(response => {
            if (response.success) {
              const timestamp = new Date().toISOString().substr(0, 10) + ' ' +
                new Date().toISOString().substr(11, 8);
              console.log('Auth code retrieved successfully');
              console.log('Current date/time (UTC):', timestamp);
            }

            pendingRequest.sendResponse(response);
            pendingRequests.delete(requestId);
          })
          .catch(error => {
            console.error('Error processing approved request:', error);
            pendingRequest.sendResponse({
              success: false,
              error: error.message
            });
            pendingRequests.delete(requestId);
          });
      } else {
        pendingRequest.sendResponse({
          success: false,
          error: 'User denied the request'
        });
        pendingRequests.delete(requestId);
      }

      sendResponse({ success: true });
    } else {
      sendResponse({
        success: false,
        error: 'No pending request found with that ID'
      });
    }

    return true;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log('Received external message from extension:', sender.id, message);

  if (message.action === 'getAuthCode') {
    const domain = message.domain || (sender.tab ? new URL(sender.tab.url).hostname : null);

    if (!domain) {
      sendResponse({
        success: false,
        error: 'No domain provided and unable to determine domain from sender'
      });
      return;
    }

    if (!domain.endsWith('smartschool.be')) {
      sendResponse({
        success: false,
        error: 'This feature only works on *.smartschool.be domains'
      });
      return;
    }

    const requestId = Date.now().toString() + Math.random().toString().slice(2);

    chrome.tabs.query({ url: `*://${domain}/*` }, (tabs) => {
      if (tabs.length === 0) {
        sendResponse({
          success: false,
          error: 'No active tab found for the specified domain'
        });
        return;
      }

      pendingRequests.set(requestId, {
        domain,
        extensionId: sender.id,
        sendResponse,
        timestamp: new Date().toISOString()
      });

      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showApprovalPopup',
        requestId,
        domain,
        extensionId: sender.id
      }).catch(error => {
        console.error('Error sending message to content script:', error);
        sendResponse({
          success: false,
          error: 'Failed to show approval popup'
        });
        pendingRequests.delete(requestId);
      });
    });

    return true;
  }

  sendResponse({
    success: false,
    error: 'Invalid action or missing parameters'
  });
});

async function getCookie(domain) {
  try {
    const cookie = await chrome.cookies.get({
      url: `https://${domain}`,
      name: 'PHPSESSID'
    });

    if (cookie) {
      return { success: true, cookie };
    } else {
      return {
        success: false,
        error: 'PHPSESSID cookie not found on this domain'
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function fetchAuthCode(phpSessId, domain) {
  try {
    const apiUrl = `https://smid.alessiodam.dev/v1/auth-code?domain=${domain}&phpSessId=${phpSessId}`;

    console.log('Requesting auth code from:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API request failed with status: ${response.status}`
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAuthCodeForCurrentTab(tab) {
  try {
    if (!tab) {
      throw new Error('No active tab provided');
    }

    const url = new URL(tab.url);
    const domain = url.hostname;

    return await getAuthCodeForDomain(domain);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAuthCodeForDomain(domain) {
  try {
    if (!domain.endsWith('smartschool.be')) {
      return {
        success: false,
        error: 'This feature only works on *.smartschool.be domains'
      };
    }

    const cookieResponse = await getCookie(domain);

    if (!cookieResponse.success) {
      return cookieResponse;
    }

    const authResponse = await fetchAuthCode(cookieResponse.cookie.value, domain);
    if (authResponse.success) {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      console.log('Auth code retrieved successfully');
      console.log('Current date/time (UTC):', timestamp);
    }

    return authResponse;
  } catch (error) {
    return { success: false, error: error.message };
  }
}