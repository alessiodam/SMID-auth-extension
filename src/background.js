class RequestManager {
  constructor(expirationTime = 5 * 60 * 1000) {
    this.requests = new Map();
    this.expirationTime = expirationTime;
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  add(requestId, requestData) {
    this.requests.set(requestId, {
      ...requestData,
      timestamp: Date.now()
    });
    return requestId;
  }

  get(requestId) {
    return this.requests.get(requestId);
  }

  has(requestId) {
    return this.requests.has(requestId);
  }

  delete(requestId) {
    return this.requests.delete(requestId);
  }

  cleanup() {
    const now = Date.now();
    for (const [requestId, request] of this.requests.entries()) {
      if (now - request.timestamp > this.expirationTime) {
        if (request.sendResponse) {
          try {
            request.sendResponse({
              success: false,
              error: 'Request timed out'
            });
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
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

const pendingRequests = new RequestManager();

function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function isValidSmartschoolDomain(domain) {
  return domain && typeof domain === 'string' && domain.endsWith('smartschool.be');
}

async function getCookie(domain) {
  try {
    console.log(`Attempting to retrieve PHPSESSID cookie for domain: ${domain}`);

    if (!isValidSmartschoolDomain(domain)) {
      return {
        success: false,
        error: 'Invalid domain. Only *.smartschool.be domains are supported.'
      };
    }

    const cookie = await chrome.cookies.get({
      url: `https://${domain}`,
      name: 'PHPSESSID'
    });

    if (cookie) {
      console.log(`Successfully retrieved cookie for ${domain}`);
      return { success: true, cookie };
    } else {
      console.warn(`PHPSESSID cookie not found for ${domain}`);
      return {
        success: false,
        error: 'PHPSESSID cookie not found on this domain'
      };
    }
  } catch (error) {
    console.error(`Error retrieving cookie for ${domain}:`, error);
    return {
      success: false,
      error: `Failed to retrieve cookie: ${error.message}`
    };
  }
}

async function fetchAuthCode(phpSessId, domain) {
  try {
    console.log(`Requesting auth code from SMID API for domain: ${domain}`);

    if (!phpSessId) {
      return {
        success: false,
        error: 'Missing PHPSESSID value'
      };
    }

    const apiUrl = `https://smid.alessiodam.dev/v1/auth-code?domain=${encodeURIComponent(domain)}&phpSessId=${encodeURIComponent(phpSessId)}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SMID-Chrome-Extension'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`API request failed with status: ${response.status}`, errorText);
      return {
        success: false,
        error: `API request failed with status: ${response.status}`,
        details: errorText
      };
    }

    const data = await response.json();
    console.log('Successfully retrieved auth code from API');
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching auth code:', error);
    return {
      success: false,
      error: `Failed to fetch auth code: ${error.message}`
    };
  }
}

async function getAuthCodeForCurrentTab(tab) {
  try {
    if (!tab || !tab.url) {
      throw new Error('No active tab or URL provided');
    }

    const url = new URL(tab.url);
    const domain = url.hostname;

    console.log(`Getting auth code for current tab with domain: ${domain}`);
    return await getAuthCodeForDomain(domain);
  } catch (error) {
    console.error('Error getting auth code for current tab:', error);
    return {
      success: false,
      error: `Failed to get auth code for current tab: ${error.message}`
    };
  }
}

async function getAuthCodeForDomain(domain) {
  try {
    console.log(`Getting auth code for domain: ${domain}`);

    if (!isValidSmartschoolDomain(domain)) {
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
      const timestamp = getFormattedTimestamp();
      console.log(`Auth code retrieved successfully at ${timestamp}`);
    }

    return authResponse;
  } catch (error) {
    console.error(`Error getting auth code for domain ${domain}:`, error);
    return {
      success: false,
      error: `Failed to get auth code: ${error.message}`
    };
  }
}

async function findActiveTabForDomain(domain) {
  try {
    const tabs = await chrome.tabs.query({ url: `*://${domain}/*` });
    if (tabs.length === 0) {
      return { success: false, error: 'No active tab found for the specified domain' };
    }
    return { success: true, tab: tabs[0] };
  } catch (error) {
    console.error(`Error finding tab for domain ${domain}:`, error);
    return { success: false, error: `Failed to find tab: ${error.message}` };
  }
}

async function getActiveTabForApproval() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
      return { success: false, error: 'No active tab found' };
    }
    return { success: true, tab: tabs[0] };
  } catch (error) {
    console.error('Error getting active tab:', error);
    return { success: false, error: `Failed to get active tab: ${error.message}` };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received internal message:', message.action);

  switch (message.action) {
    case 'fetchAuthCode':
      fetchAuthCode(message.phpSessId, message.domain)
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Error in background script:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'getAuthCodeFromCurrentPage':
      getAuthCodeForCurrentTab(sender.tab)
        .then(response => sendResponse(response))
        .catch(error => {
          console.error('Error getting auth code for current tab:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case 'approveExternalRequest':
      handleApprovalResponse(message, sendResponse);
      return true;

    default:
      console.warn('Unknown message action:', message.action);
      sendResponse({ success: false, error: 'Unknown action' });
      return false;
  }
});

async function handleApprovalResponse(message, sendResponse) {
  const requestId = message.requestId;

  if (!pendingRequests.has(requestId)) {
    console.warn(`No pending request found with ID: ${requestId}`);
    sendResponse({
      success: false,
      error: 'No pending request found with that ID'
    });
    return;
  }

  const pendingRequest = pendingRequests.get(requestId);
  console.log(`Processing ${message.approved ? 'approved' : 'denied'} request: ${requestId}`);

  try {
    if (message.approved) {
      if (pendingRequest.requestType === 'authCode' && pendingRequest.domain) {
        const response = await getAuthCodeForDomain(pendingRequest.domain);

        if (response.success) {
          const timestamp = getFormattedTimestamp();
          console.log(`Auth code successfully retrieved at ${timestamp} for request ${requestId}`);
        }

        pendingRequest.sendResponse(response);
      } 
      else if (pendingRequest.requestType === 'approval') {
        pendingRequest.sendResponse({
          success: true,
          approved: true,
          timestamp: getFormattedTimestamp()
        });
      }
    } else {
      pendingRequest.sendResponse({
        success: false,
        error: 'User denied the request',
        approved: false
      });
    }

    pendingRequests.delete(requestId);
    sendResponse({ success: true });
  } catch (error) {
    console.error(`Error processing ${message.approved ? 'approved' : 'denied'} request:`, error);

    try {
      pendingRequest.sendResponse({
        success: false,
        error: `Error processing request: ${error.message}`
      });
    } catch (responseError) {
      console.error('Failed to send response to requester:', responseError);
    }

    pendingRequests.delete(requestId);
    sendResponse({ success: false, error: error.message });
  }
}

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  const senderInfo = sender.id ? 
    `extension: ${sender.id}` : 
    `webpage: ${sender.origin || sender.url || 'unknown'}`;
  
  console.log(`Received external message from ${senderInfo}`, message);

  if (message.action === 'getAuthCode') {
    handleExternalAuthRequest(message, sender, sendResponse);
    return true;
  }
  
  if (message.action === 'requestSMIDApproval') {
    handleExternalApprovalRequest(message, sender, sendResponse);
    return true;
  }

  console.warn('Invalid external message action:', message.action);
  sendResponse({
    success: false,
    error: 'Invalid action or missing parameters'
  });
});

async function handleExternalApprovalRequest(message, sender, sendResponse) {
  try {
    const origin = sender.origin || 'Unknown origin';
    const requestSource = sender.id ? `extension ${sender.id}` : `website ${origin}`;
    
    console.log(`Processing approval request from ${requestSource}`);

    const tabResult = await getActiveTabForApproval();
    if (!tabResult.success) {
      sendResponse(tabResult);
      return;
    }

    const requestId = generateRequestId();
    console.log(`Created new approval request ${requestId} from ${requestSource}`);

    pendingRequests.add(requestId, {
      requestType: 'approval',
      requestSource,
      origin: sender.origin,
      extensionId: sender.id,
      sendResponse,
      timestamp: Date.now()
    });

    try {
      await chrome.tabs.sendMessage(tabResult.tab.id, {
        action: 'showApprovalPopup',
        requestId,
        extensionId: sender.id || sender.origin || 'External Website'
      });
    } catch (error) {
      console.error('Error sending message to content script:', error);
      sendResponse({
        success: false,
        error: 'Failed to show approval popup'
      });
      pendingRequests.delete(requestId);
    }
  } catch (error) {
    console.error('Error handling external approval request:', error);
    sendResponse({
      success: false,
      error: `Failed to process request: ${error.message}`
    });
  }
}

async function handleExternalAuthRequest(message, sender, sendResponse) {
  try {
    const domain = message.domain || (sender.tab ? new URL(sender.tab.url).hostname : null);
    const extensionId = sender.id;
    const origin = sender.origin || 'Unknown origin';

    if (!domain) {
      sendResponse({
        success: false,
        error: 'No domain provided and unable to determine domain from sender'
      });
      return;
    }

    if (!isValidSmartschoolDomain(domain)) {
      sendResponse({
        success: false,
        error: 'This feature only works on *.smartschool.be domains'
      });
      return;
    }

    const tabResult = await findActiveTabForDomain(domain);
    if (!tabResult.success) {
      sendResponse(tabResult);
      return;
    }

    const requestId = generateRequestId();
    const requestSource = extensionId ? `extension ${extensionId}` : `website ${origin}`;
    console.log(`Created new auth code request ${requestId} from ${requestSource} for domain ${domain}`);

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
      console.error('Error sending message to content script:', error);
      sendResponse({
        success: false,
        error: 'Failed to show approval popup'
      });
      pendingRequests.delete(requestId);
    }
  } catch (error) {
    console.error('Error handling external auth request:', error);
    sendResponse({
      success: false,
      error: `Failed to process request: ${error.message}`
    });
  }
}

chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension being unloaded, cleaning up...');
  pendingRequests.dispose();
});
