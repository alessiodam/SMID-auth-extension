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
        0% { box-shadow: 0 0 5px rgba(74, 158, 255, 0.5); }
        50% { box-shadow: 0 0 20px rgba(74, 158, 255, 0.8); }
        100% { box-shadow: 0 0 5px rgba(74, 158, 255, 0.5); }
      }
      
      @keyframes smidGradientFlow {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      .smid-btn {
        position: relative;
        overflow: hidden;
        transition: all 0.2s ease;
        z-index: 1;
      }
      
      .smid-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3);
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
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .smid-gradient-border {
        position: relative;
        border-radius: 8px;
        padding: 0;
        background: none;
      }
      
      .smid-powered-link {
        color: #4a9eff;
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
    background-color: rgba(0, 0, 0, 0.7) !important;
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
    border-radius: 8px !important;
    animation: smidScaleIn 0.3s ease !important;
  `;

  const innerContent = document.createElement('div');
  innerContent.className = 'smid-glass-effect';
  innerContent.style.cssText = `
    border-radius: 8px !important;
    color: #e0e0e0 !important;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    padding: 0 !important;
    overflow: hidden !important;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%) !important;
    padding: 24px !important;
    border-bottom: 1px solid #2a2a2a !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
  `;

  const logoContainer = document.createElement('div');
  logoContainer.style.cssText = `
    background: #0f0f0f !important;
    border: 1px solid #2a2a2a !important;
    border-radius: 8px !important;
    padding: 12px !important;
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
    border-radius: 6px !important;
    background-color: #4a9eff !important;
  `;
  logoContainer.appendChild(logoImg);
  
  const title = document.createElement('h2');
  title.textContent = "Authorization Request";
  title.style.cssText = `
    margin: 0 0 8px 0 !important;
    font-size: 20px !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    letter-spacing: -0.5px !important;
  `;
  
  const timestampEl = document.createElement('p');
  timestampEl.textContent = `Time: ${timestamp}`;
  timestampEl.style.cssText = `
    margin: 0 !important;
    font-size: 13px !important;
    color: #888 !important;
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
    background: #0f0f0f !important;
    padding: 16px !important;
    border-radius: 6px !important;
    border: 1px solid #2a2a2a !important;
    border-left: 4px solid #4a9eff !important;
  `;
  
  const infoText = document.createElement('p');
  infoText.textContent = "An extension is requesting access to your SMID authorization code:";
  infoText.style.cssText = `
    margin: 0 0 14px 0 !important;
    font-size: 14px !important;
    line-height: 1.5 !important;
    color: #e0e0e0 !important;
  `;
  
  const extensionIdContainer = document.createElement('div');
  extensionIdContainer.style.cssText = `
    display: flex !important;
    align-items: center !important;
    background: #0f0f0f !important;
    padding: 12px !important;
    border-radius: 6px !important;
    border: 1px solid #2a2a2a !important;
  `;
  
  const extensionIdLabel = document.createElement('span');
  extensionIdLabel.textContent = "Extension ID:";
  extensionIdLabel.style.cssText = `
    font-size: 13px !important;
    font-weight: 500 !important;
    margin-right: 8px !important;
    color: #888 !important;
  `;
  
  const extensionIdLink = document.createElement('a');
  extensionIdLink.href = `chrome://extensions/?id=${extensionId}`;
  extensionIdLink.target = "_blank";
  extensionIdLink.textContent = extensionId;
  extensionIdLink.style.cssText = `
    color: #4a9eff !important;
    text-decoration: none !important;
    font-size: 13px !important;
    font-family: 'Courier New', monospace !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    max-width: 220px !important;
    transition: color 0.2s ease !important;
  `;
  
  extensionIdLink.addEventListener('mouseenter', () => {
    extensionIdLink.style.color = '#5c9aff';
  });
  extensionIdLink.addEventListener('mouseleave', () => {
    extensionIdLink.style.color = '#4a9eff';
  });
  
  extensionIdContainer.appendChild(extensionIdLabel);
  extensionIdContainer.appendChild(extensionIdLink);
  extensionInfo.appendChild(infoText);
  extensionInfo.appendChild(extensionIdContainer);
  
  const privacyInfo = document.createElement('div');
  privacyInfo.style.cssText = `
    margin-bottom: 20px !important;
    font-size: 13px !important;
    color: #b0b0b0 !important;
    background: #0f0f0f !important;
    padding: 16px !important;
    border-radius: 6px !important;
    border: 1px solid #2a2a2a !important;
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
    gap: 12px !important;
    margin-bottom: 16px !important;
  `;
  
  const denyButton = document.createElement('button');
  denyButton.id = `${approvalId}-deny`;
  denyButton.className = "smid-btn";
  denyButton.textContent = "Deny";
  denyButton.style.cssText = `
    flex: 1 !important;
    background-color: #2a2a2a !important;
    color: #e0e0e0 !important;
    border: 1px solid #3a3a3a !important;
    padding: 12px 16px !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    font-size: 14px !important;
    font-weight: 500 !important;
    transition: all 0.2s ease !important;
    font-family: 'Inter', sans-serif !important;
  `;
  
  denyButton.addEventListener('mouseenter', () => {
    denyButton.style.backgroundColor = '#3a3a3a';
    denyButton.style.borderColor = '#4a4a4a';
  });
  denyButton.addEventListener('mouseleave', () => {
    denyButton.style.backgroundColor = '#2a2a2a';
    denyButton.style.borderColor = '#3a3a3a';
  });
  
  const approveButton = document.createElement('button');
  approveButton.id = `${approvalId}-approve`;
  approveButton.className = "smid-btn";
  approveButton.textContent = "Approve";
  approveButton.style.cssText = `
    flex: 1 !important;
    background: #4a9eff !important;
    color: #000 !important;
    border: none !important;
    padding: 12px 16px !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    transition: all 0.2s ease !important;
    font-family: 'Inter', sans-serif !important;
    box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3) !important;
  `;
  
  approveButton.addEventListener('mouseenter', () => {
    approveButton.style.backgroundColor = '#3a8ee5';
    approveButton.style.transform = 'translateY(-1px)';
    approveButton.style.boxShadow = '0 6px 16px rgba(74, 158, 255, 0.4)';
  });
  approveButton.addEventListener('mouseleave', () => {
    approveButton.style.backgroundColor = '#4a9eff';
    approveButton.style.transform = 'translateY(0)';
    approveButton.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.3)';
  });
  
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
    color: #666 !important;
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
  
  document.getElementById(`${approvalId}-approve`).addEventListener('click', async function() {
    try {
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
            border-top-color: #4a9eff;
            animation: smidSpin 1s linear infinite;
          "></div>
          <div style="
            position: absolute;
            width: 85px;
            height: 85px;
            margin: 7.5px;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #34d399;
            animation: smidSpin 1.5s linear infinite reverse;
          "></div>
          <div style="
            position: absolute;
            width: 70px;
            height: 70px;
            margin: 15px;
            border-radius: 50%;
            border: 4px solid transparent;
            border-top-color: #4a9eff;
            animation: smidSpin 2s linear infinite;
          "></div>
        </div>
      `;
      
      setTimeout(() => {
        animationContainer.innerHTML = `
          <div style="text-align: center;">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#4a9eff" stroke-width="4" 
                style="stroke-dasharray: 380; stroke-dashoffset: 380; animation: smidCheckmarkCircle 1s ease forwards;" />
              <polyline points="40,60 55,75 80,45" fill="none" stroke="#34d399" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"
                style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: smidCheckmark 1s ease forwards;" />
            </svg>
            <p style="margin-top: 10px; font-size: 15px; color: #34d399; font-weight: 500;">Access Granted</p>
          </div>
        `;
        
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'approveExternalRequest',
            requestId: requestId,
            approved: true
          }).then(() => {
            const popup = document.getElementById(approvalId);
            const overlay = document.getElementById(`${approvalId}-overlay`);
            
            if (popup) {
              popup.remove();
            }
            
            if (overlay) {
              overlay.remove();
            }
          }).catch(error => {
          });
        }, 1000);
      }, 800);
    } catch (error) {
    }
  });
  
  document.getElementById(`${approvalId}-deny`).addEventListener('click', async function() {
    try {
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
            <circle cx="60" cy="60" r="54" fill="none" stroke="#ef4444" stroke-width="4" 
              style="stroke-dasharray: 380; stroke-dashoffset: 380; animation: smidCheckmarkCircle 0.8s ease forwards;" />
            <line x1="42" y1="42" x2="78" y2="78" stroke="#ef4444" stroke-width="6" stroke-linecap="round"
              style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: smidDenied 0.8s ease forwards 0.2s;" />
            <line x1="78" y1="42" x2="42" y2="78" stroke="#ef4444" stroke-width="6" stroke-linecap="round"
              style="stroke-dasharray: 100; stroke-dashoffset: 100; animation: smidDenied 0.8s ease forwards 0.2s;" />
          </svg>
          <p style="margin-top: 10px; font-size: 15px; color: #ef4444; font-weight: 500;">Access Denied</p>
        </div>
      `;
      
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'approveExternalRequest',
          requestId: requestId,
          approved: false
        }).then(() => {
          const popup = document.getElementById(approvalId);
          const overlay = document.getElementById(`${approvalId}-overlay`);
          
          if (popup) {
            popup.remove();
          }
          
          if (overlay) {
            overlay.remove();
          }
        }).catch(error => {
        });
      }, 1000);
    } catch (error) {
    }
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showApprovalPopup') {
    createApprovalPopup(message.requestId, message.extensionId);
    sendResponse({ success: true });
    return true;
  }
});

(function checkForUpdate() {
  const manifest = chrome.runtime.getManifest();
  const currentVersion = manifest.version;

  fetch("https://api.github.com/repos/alessiodam/SMID-auth-extension/releases/latest")
    .then(response => response.json())
    .then(data => {
      const latestVersion = data.tag_name.replace(/^v/, '');
      const updateAvailable = latestVersion !== currentVersion;

      if (updateAvailable) {
        const container = document.createElement('div');
        container.style.cssText = `
          position: fixed !important;
          top: 20px !important;
          right: 20px !important;
          background: linear-gradient(135deg, #4a9eff 0%, #5c9aff 100%) !important;
          color: #000 !important;
          padding: 16px 20px !important;
          border-radius: 6px !important;
          z-index: 2147483647 !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          box-shadow: 0 4px 12px rgba(74, 158, 255, 0.3) !important;
          max-width: 320px !important;
          animation: smidScaleIn 0.3s ease !important;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
          display: flex !important;
          align-items: center !important;
          margin-bottom: 10px !important;
          gap: 8px !important;
        `;

        const logo = document.createElement('img');
        logo.src = chrome.runtime.getURL('/icons/icon48.png');
        logo.style.cssText = `
          width: 24px !important;
          height: 24px !important;
          border-radius: 6px !important;
        `;

        const title = document.createElement('strong');
        title.textContent = 'SMID Update Available';
        title.style.cssText = `
          font-size: 15px !important;
          flex-grow: 1 !important;
          color: #000 !important;
        `;

        const message = document.createElement('p');
        message.style.cssText = `
          margin: 0 0 12px 0 !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          color: #000 !important;
        `;
        message.textContent = `Version ${latestVersion} is now available. Please update to ensure proper functionality.`;

        const downloadLink = document.createElement('a');
        downloadLink.href = data.html_url;
        downloadLink.target = '_blank';
        downloadLink.style.cssText = `
          display: inline-block !important;
          background: rgba(0, 0, 0, 0.1) !important;
          color: #000 !important;
          text-decoration: none !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          transition: all 0.2s ease !important;
        `;
        downloadLink.onmouseover = () => {
          downloadLink.style.background = 'rgba(0, 0, 0, 0.15)';
        };
        downloadLink.onmouseout = () => {
          downloadLink.style.background = 'rgba(0, 0, 0, 0.1)';
        };
        downloadLink.textContent = 'Download Update';

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
          background: none !important;
          border: none !important;
          color: #000 !important;
          font-size: 20px !important;
          cursor: pointer !important;
          padding: 0 !important;
          line-height: 1 !important;
          opacity: 0.8 !important;
          transition: opacity 0.2s ease !important;
        `;
        closeBtn.onmouseover = () => closeBtn.style.opacity = '1';
        closeBtn.onmouseout = () => closeBtn.style.opacity = '0.8';
        closeBtn.onclick = () => {
          container.style.animation = 'smidScaleOut 0.3s ease forwards';
          setTimeout(() => container.remove(), 300);
        };

        header.appendChild(logo);
        header.appendChild(title);
        header.appendChild(closeBtn);
        container.appendChild(header);
        container.appendChild(message);
        container.appendChild(downloadLink);
        
        document.body.appendChild(container);
      }
    })
    .catch(error => {});
})();
