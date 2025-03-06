function createApprovalPopup(requestId, extensionId) {
  const approvalId = 'smid-approval-' + requestId;

  if (document.getElementById(approvalId)) {
    return;
  }

  const styleId = 'smid-global-styles';
  if (!document.getElementById(styleId)) {
    const globalStyles = document.createElement('style');
    globalStyles.id = styleId;
    globalStyles.innerHTML = `
      @keyframes smidFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes smidFadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      
      @keyframes smidScaleIn {
        from { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
        to { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      }
      
      @keyframes smidScaleOut {
        from { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        to { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
      }
      
      @keyframes smidSpin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes smidCheckmark {
        0% { stroke-dashoffset: 100; opacity: 0; }
        30% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      
      @keyframes smidCheckmarkCircle {
        0% { stroke-dashoffset: 380; opacity: 0; }
        30% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      
      @keyframes smidDenied {
        0% { stroke-dashoffset: 100; opacity: 0; }
        30% { opacity: 1; }
        100% { stroke-dashoffset: 0; opacity: 1; }
      }
      
      @keyframes smidPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
      
      @keyframes smidGlow {
        0% { box-shadow: 0 0 5px rgba(66, 133, 244, 0.5); }
        50% { box-shadow: 0 0 20px rgba(66, 133, 244, 0.8); }
        100% { box-shadow: 0 0 5px rgba(66, 133, 244, 0.5); }
      }
      
      @keyframes smidGradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .smid-btn {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        z-index: 1;
      }
      
      .smid-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }
      
      .smid-btn:active {
        transform: translateY(0);
      }
      
      .smid-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: all 0.5s ease;
        z-index: -1;
      }
      
      .smid-btn:hover::before {
        left: 100%;
      }
      
      .smid-blur-backdrop {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }
      
      .smid-glass-effect {
        background: rgba(30, 30, 30, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .smid-gradient-border {
        position: relative;
        border-radius: 16px;
        padding: 1px;
        background: linear-gradient(45deg, #4285F4, #34A853, #FBBC05, #EA4335);
        background-size: 400% 400%;
        animation: smidGradientFlow 3s ease infinite;
      }
      
      .smid-gradient-border::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 15px;
        background: #1a1a1a;
        margin: 1px;
        z-index: -1;
      }
      
      .smid-powered-link {
        color: #4285F4;
        text-decoration: none;
        font-size: 12px;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      
      .smid-powered-link:hover {
        color: #5c9aff;
        text-decoration: underline;
      }
      
      .smid-powered-link svg {
        transition: transform 0.2s ease;
      }
      
      .smid-powered-link:hover svg {
        transform: translateX(2px);
      }
    `;
    document.head.appendChild(globalStyles);
  }

  const overlay = document.createElement('div');
  overlay.id = `${approvalId}-overlay`;
  overlay.className = 'smid-blur-backdrop';
  overlay.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background-color: rgba(0, 0, 0, 0.6) !important;
    z-index: 2147483646 !important;
    opacity: 1 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
  `;
  document.body.appendChild(overlay);

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  const approvalDiv = document.createElement('div');
  approvalDiv.id = approvalId;
  approvalDiv.className = 'smid-gradient-border';
  approvalDiv.style.cssText = `
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 450px !important;
    max-width: 90vw !important;
    z-index: 2147483647 !important;
    opacity: 1 !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5) !important;
  `;

  const innerContent = document.createElement('div');
  innerContent.className = 'smid-glass-effect';
  innerContent.style.cssText = `
    border-radius: 15px !important;
    color: #f5f5f5 !important;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif !important;
    padding: 0 !important;
    overflow: hidden !important;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%) !important;
    padding: 24px 24px 20px 24px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
  `;

  const logoContainer = document.createElement('div');
  logoContainer.style.cssText = `
    background: linear-gradient(135deg, #2d2d2d 0%, #3d3d3d 100%) !important;
    border-radius: 16px !important;
    padding: 16px !important;
    margin-bottom: 16px !important;
    animation: smidPulse 2s infinite ease-in-out, smidGlow 3s infinite ease-in-out !important;
    display: inline-flex !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  `;

  const logoImg = document.createElement('img');
  logoImg.src = chrome.runtime.getURL('/icons/icon48.png');
  logoImg.alt = "SMID Auth";
  logoImg.style.cssText = `
    width: 56px !important;
    height: 56px !important;
    border-radius: 12px !important;
    background-color: #4285F4 !important;
  `;
  logoContainer.appendChild(logoImg);
  
  const title = document.createElement('h2');
  title.textContent = "Authorization Request";
  title.style.cssText = `
    margin: 0 0 8px 0 !important;
    font-size: 22px !important;
    font-weight: 600 !important;
    color: #ffffff !important;
  `;
  
  const timestampEl = document.createElement('p');
  timestampEl.textContent = `Time: ${timestamp}`;
  timestampEl.style.cssText = `
    margin: 0 !important;
    font-size: 13px !important;
    color: #a0a0a0 !important;
  `;
  
  header.appendChild(logoContainer);
  header.appendChild(title);
  header.appendChild(timestampEl);
  
  const content = document.createElement('div');
  content.style.cssText = `
    padding: 24px !important;
    background: #1a1a1a !important;
  `;
  
  const extensionInfo = document.createElement('div');
  extensionInfo.style.cssText = `
    margin-bottom: 20px !important;
    background: rgba(37, 37, 37, 0.7) !important;
    padding: 18px !important;
    border-radius: 12px !important;
    border-left: 4px solid #4285F4 !important;
  `;
  
  const infoText = document.createElement('p');
  infoText.textContent = "An extension is requesting access to your SMID authorization code:";
  infoText.style.cssText = `
    margin: 0 0 14px 0 !important;
    font-size: 15px !important;
    line-height: 1.5 !important;
    color: #e0e0e0 !important;
  `;
  
  const extensionIdContainer = document.createElement('div');
  extensionIdContainer.style.cssText = `
    display: flex !important;
    align-items: center !important;
    background: rgba(45, 45, 45, 0.7) !important;
    padding: 12px !important;
    border-radius: 10px !important;
  `;
  
  const extensionIdLabel = document.createElement('span');
  extensionIdLabel.textContent = "Extension ID:";
  extensionIdLabel.style.cssText = `
    font-size: 14px !important;
    font-weight: 500 !important;
    margin-right: 8px !important;
    color: #c0c0c0 !important;
  `;
  
  const extensionIdLink = document.createElement('a');
  extensionIdLink.href = `chrome://extensions/?id=${extensionId}`;
  extensionIdLink.target = "_blank";
  extensionIdLink.textContent = extensionId;
  extensionIdLink.style.cssText = `
    color: #4285F4 !important;
    text-decoration: none !important;
    font-size: 14px !important;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 220px !important;
  `;
  
  extensionIdContainer.appendChild(extensionIdLabel);
  extensionIdContainer.appendChild(extensionIdLink);
  extensionInfo.appendChild(infoText);
  extensionInfo.appendChild(extensionIdContainer);
  
  const privacyInfo = document.createElement('div');
  privacyInfo.style.cssText = `
    margin-bottom: 20px !important;
    font-size: 14px !important;
    color: #d0d0d0 !important;
    background: rgba(42, 42, 42, 0.7) !important;
    padding: 18px !important;
    border-radius: 12px !important;
    line-height: 1.5 !important;
  `;
  
  const privacyText1 = document.createElement('p');
  privacyText1.textContent = "SMID will send your PHPSESSID cookie to create a unique anonymous user profile based on your Smartschool account.";
  privacyText1.style.cssText = `
    margin: 0 0 10px 0 !important;
  `;
  
  const privacyText2 = document.createElement('p');
  privacyText2.textContent = "Only a hashed version of this information will be stored for caching purposes.";
  privacyText2.style.cssText = `
    margin: 0 !important;
  `;
  
  privacyInfo.appendChild(privacyText1);
  privacyInfo.appendChild(privacyText2);
  
  const buttonsContainer = document.createElement('div');
  buttonsContainer.id = `${approvalId}-buttons`;
  buttonsContainer.style.cssText = `
    display: flex !important;
    justify-content: space-between !important;
    gap: 16px !important;
    margin-bottom: 16px !important;
  `;
  
  const denyButton = document.createElement('button');
  denyButton.id = `${approvalId}-deny`;
  denyButton.className = "smid-btn";
  denyButton.textContent = "Deny";
  denyButton.style.cssText = `
    flex: 1 !important;
    background-color: #3a3a3a !important;
    color: white !important;
    border: none !important;
    padding: 14px !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;
  `;
  
  const approveButton = document.createElement('button');
  approveButton.id = `${approvalId}-approve`;
  approveButton.className = "smid-btn";
  approveButton.textContent = "Approve";
  approveButton.style.cssText = `
    flex: 1 !important;
    background: linear-gradient(135deg, #4285F4 0%, #5c9aff 100%) !important;
    color: white !important;
    border: none !important;
    padding: 14px !important;
    border-radius: 10px !important;
    cursor: pointer !important;
    font-size: 15px !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;
    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3) !important;
  `;
  
  buttonsContainer.appendChild(denyButton);
  buttonsContainer.appendChild(approveButton);
  
  const animationContainer = document.createElement('div');
  animationContainer.id = `${approvalId}-animation-container`;
  animationContainer.style.cssText = `
    display: none !important;
    justify-content: center !important;
    align-items: center !important;
    height: 140px !important;
    margin-bottom: 16px !important;
  `;
  
  const poweredByContainer = document.createElement('div');
  poweredByContainer.style.cssText = `
    text-align: center !important;
    font-size: 12px !important;
    color: #888 !important;
    margin-top: 4px !important;
  `;
  
  const poweredByLink = document.createElement('a');
  poweredByLink.href = "https://smid.alessiodam.dev/";
  poweredByLink.target = "_blank";
  poweredByLink.className = "smid-powered-link";
  poweredByLink.innerHTML = `
    Powered by SMID
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"></path>
      <path d="M12 5l7 7-7 7"></path>
    </svg>
  `;
  
  poweredByContainer.appendChild(poweredByLink);
  
  content.appendChild(extensionInfo);
  content.appendChild(privacyInfo);
  content.appendChild(buttonsContainer);
  content.appendChild(animationContainer);
  content.appendChild(poweredByContainer);
  
  innerContent.appendChild(header);
  innerContent.appendChild(content);
  approvalDiv.appendChild(innerContent);
  document.body.appendChild(approvalDiv);
  
  console.log("SMID approval popup created:", approvalId);
  
  document.getElementById(`${approvalId}-approve`).addEventListener('click', async function() {
    try {
      console.log("Approve button clicked");
      const approveBtn = document.getElementById(`${approvalId}-approve`);
      const denyBtn = document.getElementById(`${approvalId}-deny`);
      const buttonsContainer = document.getElementById(`${approvalId}-buttons`);
      const animationContainer = document.getElementById(`${approvalId}-animation-container`);
      
      approveBtn.disabled = true;
      denyBtn.disabled = true;
      
      buttonsContainer.style.display = 'none';
      animationContainer.style.display = 'flex';
      
      animationContainer.innerHTML = `
        <div style="position: relative; width: 100px; height: 100px;">
          <div style="
            position: absolute;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #4285F4;
            animation: smidSpin 1s linear infinite;
          "></div>
          <div style="
            position: absolute;
            width: 85px;
            height: 85px;
            margin: 7.5px;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #5cb85c;
            animation: smidSpin 1.5s linear infinite reverse;
          "></div>
          <div style="
            position: absolute;
            width: 70px;
            height: 70px;
            margin: 15px;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #f0ad4e;
            animation: smidSpin 2s linear infinite;
          "></div>
        </div>
      `;
      
      setTimeout(() => {
        animationContainer.innerHTML = `
          <div style="text-align: center;">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#4285F4" stroke-width="4" 
                style="stroke-dasharray: 380; stroke-dashoffset: 380; animation: smidCheckmarkCircle 1s ease forwards;" />
              <polyline points="40,60 55,75 80,45" fill="none" stroke="#5cb85c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
                style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: smidCheckmark 1s ease forwards;" />
            </svg>
            <p style="margin-top: 10px; font-size: 16px; color: #5cb85c; font-weight: 500;">Access Granted</p>
          </div>
        `;
        
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'approveExternalRequest',
            requestId: requestId,
            approved: true
          }).then(() => {
            console.log("Request approved and message sent");
            const popup = document.getElementById(approvalId);
            const overlay = document.getElementById(`${approvalId}-overlay`);
            
            if (popup) {
              popup.remove();
            }
            
            if (overlay) {
              overlay.remove();
            }
          }).catch(error => {
            console.error("Error sending approval message:", error);
          });
        }, 1000);
      }, 800);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  });
  
  document.getElementById(`${approvalId}-deny`).addEventListener('click', async function() {
    try {
      console.log("Deny button clicked");
      const approveBtn = document.getElementById(`${approvalId}-approve`);
      const denyBtn = document.getElementById(`${approvalId}-deny`);
      const buttonsContainer = document.getElementById(`${approvalId}-buttons`);
      const animationContainer = document.getElementById(`${approvalId}-animation-container`);
      
      approveBtn.disabled = true;
      denyBtn.disabled = true;
      
      buttonsContainer.style.display = 'none';
      animationContainer.style.display = 'flex';
      
      animationContainer.innerHTML = `
        <div style="text-align: center;">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke="#f44336" stroke-width="4" 
              style="stroke-dasharray: 380; stroke-dashoffset: 380; animation: smidCheckmarkCircle 0.8s ease forwards;" />
            <line x1="42" y1="42" x2="78" y2="78" stroke="#f44336" stroke-width="6" stroke-linecap="round"
              style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: smidDenied 0.8s ease forwards 0.2s;" />
            <line x1="78" y1="42" x2="42" y2="78" stroke="#f44336" stroke-width="6" stroke-linecap="round"
              style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: smidDenied 0.8s ease forwards 0.2s;" />
          </svg>
          <p style="margin-top: 10px; font-size: 16px; color: #f44336; font-weight: 500;">Access Denied</p>
        </div>
      `;
      
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'approveExternalRequest',
          requestId: requestId,
          approved: false
        }).then(() => {
          console.log("Request denied and message sent");
          const popup = document.getElementById(approvalId);
          const overlay = document.getElementById(`${approvalId}-overlay`);
          
          if (popup) {
            popup.remove();
          }
          
          if (overlay) {
            overlay.remove();
          }
        }).catch(error => {
          console.error("Error sending denial message:", error);
        });
      }, 1000);
    } catch (error) {
      console.error('Error denying request:', error);
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showApprovalPopup') {
    console.log("Received showApprovalPopup message:", message);
    createApprovalPopup(message.requestId, message.extensionId);
    sendResponse({ success: true });
    return true;
  }
});
