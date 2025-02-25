
export const generateQRCodeUrl = (url: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
};

export const downloadQRCode = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading QR code:', error);
  }
};

export const createStyledQRCode = async (
  qrUrl: string, 
  businessName: string, 
  serviceUrl: string
): Promise<void> => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    canvas.width = 600;
    canvas.height = 800;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#FF1493'); // Gebeya Pink
    gradient.addColorStop(1, '#FFA500'); // Gebeya Orange
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN ME', canvas.width / 2, 100);
    
    ctx.font = '24px Arial';
    ctx.fillText('TO VISIT OUR WEBSITE', canvas.width / 2, 140);

    // Load and draw QR code
    const qrImage = new Image();
    qrImage.crossOrigin = 'anonymous';
    qrImage.src = qrUrl;
    
    await new Promise((resolve, reject) => {
      qrImage.onload = resolve;
      qrImage.onerror = reject;
    });

    const qrSize = 300;
    const qrX = (canvas.width - qrSize) / 2;
    const qrY = 200;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Draw business name and URL
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(businessName, canvas.width / 2, qrY + qrSize + 60);
    ctx.font = '20px Arial';
    ctx.fillText(serviceUrl, canvas.width / 2, qrY + qrSize + 100);

    // Load and draw Gebeya logo
    const logoImage = new Image();
    logoImage.src = '/lovable-uploads/14afcb65-2dcb-477c-8c08-3ae4cd079ee7.png';
    
    await new Promise((resolve, reject) => {
      logoImage.onload = resolve;
      logoImage.onerror = reject;
    });

    // Calculate logo dimensions (height of 40px while maintaining aspect ratio)
    const logoHeight = 40;
    const logoWidth = (logoImage.width / logoImage.height) * logoHeight;
    const logoX = (canvas.width - logoWidth) / 2;
    const logoY = canvas.height - logoHeight - 40; // 40px from bottom

    ctx.drawImage(logoImage, logoX, logoY, logoWidth, logoHeight);

    // Download the canvas
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'styled-qr-code.png';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 'image/png');
  } catch (error) {
    console.error('Error creating styled QR code:', error);
  }
};
