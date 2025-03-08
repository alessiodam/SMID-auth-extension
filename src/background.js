const BASE_API_URL = 'https://smid.alessiodam.dev/v1';
// const BASE_API_URL = 'http://127.0.0.1:8000/v1';

class RequestManager {
  constructor(expirationTime = 5 * 60 * 1000) {
    this.requests = new Map();
    this.expirationTime = expirationTime;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  add(requestId, requestData) {
    this.requests.set(requestId, { ...requestData, timestamp: Date.now() });
    return requestId;
  }

  get(requestId) { return this.requests.get(requestId); }
  has(requestId) { return this.requests.has(requestId); }
  delete(requestId) { return this.requests.delete(requestId); }

  cleanup() {
    const now = Date.now();
    for (const [requestId, request] of this.requests.entries()) {
      if (now - request.timestamp > this.expirationTime) {
        if (request.sendResponse) {
          try {
            request.sendResponse({ success: false, error: 'Request timed out' });
          } catch (error) {
            console.error('Error sending timeout response:', error);
          }
        }
        this.requests.delete(requestId);
        console.log(`Request ${requestId} expired and was removed`);
      }
    }
  }

  dispose() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
  }
}

const pendingRequests = new RequestManager();

function getFormattedTimestamp() {
  const now = new Date();
  const pad = num => String(num).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;
}

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function isValidSmartschoolDomain(domain) {
  return domain && typeof domain === 'string' && domain.endsWith('smartschool.be');
}

async function getCookie(domain) {
  try {
    if (!isValidSmartschoolDomain(domain)) {
      return { success: false, error: 'Invalid domain. Only *.smartschool.be domains are supported.' };
    }

    const cookie = await chrome.cookies.get({
      url: `https://${domain}`,
      name: 'PHPSESSID'
    });

    return cookie
      ? { success: true, cookie }
      : { success: false, error: 'PHPSESSID cookie not found on this domain' };
  } catch (error) {
    return { success: false, error: `Failed to retrieve cookie: ${error.message}` };
  }
}

async function fetchAuthCode(phpSessId, domain) {
  try {
    if (!phpSessId) {
      return { success: false, error: 'Missing PHPSESSID value' };
    }

    const apiUrl = `${BASE_API_URL}/auth-code?domain=${encodeURIComponent(domain)}&phpSessId=${encodeURIComponent(phpSessId)}`;
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'User-Agent': 'SMID-Chrome-Extension' },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return {
        success: false,
        error: `API request failed with status: ${response.status}`,
        details: errorText
      };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    return { success: false, error: `Failed to fetch auth code: ${error.message}` };
  }
}

async function getAuthCodeForDomain(domain) {
  try {
    if (!isValidSmartschoolDomain(domain)) {
      return { success: false, error: 'This feature only works on *.smartschool.be domains' };
    }

    const cookieResponse = await getCookie(domain);
    if (!cookieResponse.success) return cookieResponse;

    const authResponse = await fetchAuthCode(cookieResponse.cookie.value, domain);
    return authResponse;
  } catch (error) {
    return { success: false, error: `Failed to get auth code: ${error.message}` };
  }
}

async function getAuthCodeForCurrentTab(tab) {
  try {
    if (!tab?.url) throw new Error('No active tab or URL provided');
    const domain = new URL(tab.url).hostname;
    return await getAuthCodeForDomain(domain);
  } catch (error) {
    return { success: false, error: `Failed to get auth code for current tab: ${error.message}` };
  }
}

async function findTab(query) {
  try {
    const tabs = await chrome.tabs.query(query);
    return tabs.length > 0
      ? { success: true, tab: tabs[0] }
      : { success: false, error: 'No matching tab found' };
  } catch (error) {
    return { success: false, error: `Failed to find tab: ${error.message}` };
  }
}

async function handleApprovalResponse(message, sendResponse) {
  const requestId = message.requestId;
  if (!pendingRequests.has(requestId)) {
    sendResponse({ success: false, error: 'No pending request found with that ID' });
    return;
  }

  const pendingRequest = pendingRequests.get(requestId);
  try {
    let response;
    if (message.approved) {
      if (pendingRequest.requestType === 'authCode' && pendingRequest.domain) {
        response = await getAuthCodeForDomain(pendingRequest.domain);
      } else if (pendingRequest.requestType === 'approval') {
        response = { success: true, approved: true, timestamp: getFormattedTimestamp() };
      }
    } else {
      response = { success: false, error: 'User denied the request', approved: false };
    }

    pendingRequest.sendResponse(response);
    pendingRequests.delete(requestId);
    sendResponse({ success: true });
  } catch (error) {
    try {
      pendingRequest.sendResponse({ success: false, error: `Error processing request: ${error.message}` });
    } catch (responseError) {
      console.error('Failed to send response to requester:', responseError);
    }
    pendingRequests.delete(requestId);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleExternalAuthRequest(message, sender, sendResponse) {
  try {
    const domain = message.domain || (sender.tab ? new URL(sender.tab.url).hostname : null);
    const extensionId = sender.id;
    const origin = sender.origin || 'Unknown origin';

    if (!domain) {
      sendResponse({ success: false, error: 'No domain provided and unable to determine domain from sender' });
      return;
    }

    if (!isValidSmartschoolDomain(domain)) {
      sendResponse({ success: false, error: 'This feature only works on *.smartschool.be domains' });
      return;
    }

    const tabResult = await findTab({ url: `*://${domain}/*` });
    if (!tabResult.success) {
      sendResponse(tabResult);
      return;
    }

    const requestId = generateRequestId();
    pendingRequests.add(requestId, {
      domain,
      requestType: 'authCode',
      extensionId,
      origin,
      sendResponse,
      timestamp: Date.now()
    });

    try {
      await chrome.tabs.sendMessage(tabResult.tab.id, {
        action: 'showApprovalPopup',
        requestId,
        domain,
        extensionId: extensionId || origin || 'External Website'
      });
    } catch (error) {
      sendResponse({ success: false, error: 'Failed to show approval popup' });
      pendingRequests.delete(requestId);
    }
  } catch (error) {
    sendResponse({ success: false, error: `Failed to process request: ${error.message}` });
  }
}

// Event listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'fetchAuthCode':
      fetchAuthCode(message.phpSessId, message.domain)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getAuthCodeFromCurrentPage':
      getAuthCodeForCurrentTab(sender.tab)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'approveExternalRequest':
      handleApprovalResponse(message, sendResponse);
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === 'getAuthCode') {
    handleExternalAuthRequest(message, sender, sendResponse);
    return true;
  }
  if (message.action === 'getVersion') {
    const manifest = chrome.runtime.getManifest();
    sendResponse({ success: true, version: manifest.version });
    return false;
  }
  sendResponse({ success: false, error: 'Invalid action or missing parameters' });
});

chrome.runtime.onSuspend.addListener(() => {
  pendingRequests.dispose();
});
