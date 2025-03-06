async function getSMIDAuthCode() {
  try {
    const domain = window.location.hostname;
    console.log('Requesting SMID auth code for domain:', domain);
    const response = await chrome.runtime.sendMessage({
      action: 'requestSMIDCode',
      domain: domain
    });

    if (response.success) {
      console.log('Received SMID auth code:', response.data.code);
      console.log('Source:', response.data.source);
      return response.data;
    } else {
      console.error('Failed to get SMID auth code:', response.error);
      return null;
    }
  } catch (error) {
    console.error('Error requesting auth code:', error);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', async () => {

});

(async function () {
  if (window.location.hostname.endsWith('smartschool.be')) {
    const button = document.createElement('button');
    button.textContent = 'Test SMID Auth';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '10000';
    button.style.padding = '10px';
    button.style.backgroundColor = '#4285f4';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', async () => {
      console.log('Test button clicked');
      const authData = await getSMIDAuthCode();
      if (authData) {
        console.log('Auth code:', authData.code);
        alert(`SMID Auth Code: ${authData.code}`);
      } else {
        alert('Failed to get SMID Auth Code');
      }
    });

    document.body.appendChild(button);
  }
})();