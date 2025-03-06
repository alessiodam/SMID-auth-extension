const SMID_EXTENSION_ID = "poohpalffkmnicfcmdjofoaeagghgmdc";

async function getAuthCodeFromSMID(domain) {
  try {
    const response = await chrome.runtime.sendMessage(
      SMID_EXTENSION_ID,
      {
        action: 'getAuthCode',
        domain: domain
      }
    );

    return response;
  } catch (error) {
    console.error('Error communicating with SMID extension:', error);
    return {
      success: false,
      error: `Communication error: ${error.message}`
    };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'requestSMIDCode') {
    const domain = message.domain || (sender.tab ? new URL(sender.tab.url).hostname : null);

    if (!domain) {
      sendResponse({ success: false, error: 'No domain specified' });
      return;
    }

    getAuthCodeFromSMID(domain)
      .then(response => sendResponse(response))
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});