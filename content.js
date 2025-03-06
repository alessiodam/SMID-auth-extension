function createApprovalPopup(requestId, domain, extensionId) {
  const approvalId = 'smid-approval-' + requestId;

  if (document.getElementById(approvalId)) {
    return;
  }

  const approvalDiv = document.createElement('div');
  approvalDiv.id = approvalId;
  approvalDiv.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 350px !important;
    background-color: black !important;
    color: white !important;
    border: 1px solid #555 !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5) !important;
    z-index: 10001 !important;
    font-family: Arial, sans-serif !important;
    padding: 20px !important;
  `;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  approvalDiv.innerHTML = `
    <div style="text-align: center; margin-bottom: 15px;">
      <img src="${chrome.runtime.getURL('icons/icon48.png')}" alt="SMID Auth" style="width: 48px; height: 48px; margin-bottom: 10px; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; font-size: 18px;">Authorization Request</h3>
      <p style="margin: 0; font-size: 14px; color: #aaa;">Time: ${timestamp}</p>
    </div>
    
    <div style="margin-bottom: 15px; background: #222; padding: 12px; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-size: 14px;">An extension is requesting access to your SMID authorization code:</p>
      <p style="margin: 0 0 5px 0; font-size: 13px;">
        <strong>Extension ID:</strong> 
        <a href="chrome://extensions/?id=${extensionId}" target="_blank" style="color: #4285F4; text-decoration: underline; cursor: pointer;">${extensionId}</a>
      </p>
    </div>
    
    <div style="margin-bottom: 15px; font-size: 12px; color: #ccc; background: #333; padding: 10px; border-radius: 8px;">
      <p style="margin: 0 0 5px 0;">SMID will send your PHPSESSID cookie to create a unique anonymous user profile based on your Smartschool account.</p>
      <p style="margin: 0;">Only a hashed version of this information will be stored for caching purposes.</p>
    </div>
    
    <div style="display: flex; justify-content: space-between;">
      <button id="${approvalId}-deny" style="flex: 1; margin-right: 10px; background-color: #555; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 14px;">Deny</button>
      <button id="${approvalId}-approve" style="flex: 1; background-color: #4285F4; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 14px;">Approve</button>
    </div>
  `;

  document.body.appendChild(approvalDiv);

  const overlay = document.createElement('div');
  overlay.id = `${approvalId}-overlay`;
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.5) !important;
    z-index: 10000 !important;
  `;
  document.body.appendChild(overlay);

  document.getElementById(`${approvalId}-approve`).addEventListener('click', async function () {
    try {
      await chrome.runtime.sendMessage({
        action: 'approveExternalRequest',
        requestId: requestId,
        approved: true
      });
      document.getElementById(approvalId).remove();
      document.getElementById(`${approvalId}-overlay`).remove();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  });

  document.getElementById(`${approvalId}-deny`).addEventListener('click', async function () {
    try {
      await chrome.runtime.sendMessage({
        action: 'approveExternalRequest',
        requestId: requestId,
        approved: false
      });
      document.getElementById(approvalId).remove();
      document.getElementById(`${approvalId}-overlay`).remove();
    } catch (error) {
      console.error('Error denying request:', error);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showApprovalPopup') {
    createApprovalPopup(message.requestId, message.domain, message.extensionId);
    sendResponse({ success: true });
    return true;
  }
});
