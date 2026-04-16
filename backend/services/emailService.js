const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send rebalance notification email
const sendRebalanceNotification = async (recipientEmail, basket, changes) => {
  try {
    const addedStocksHTML = changes.added.map(stock => 
      `<li><strong>${stock.ticker}</strong> - Added to basket. Reason: ${stock.reason}</li>`
    ).join('');

    const removedStocksHTML = changes.removed.map(stock => 
      `<li><strong>${stock.ticker}</strong> - Removed. Sale price: ₹${stock.salePrice.toFixed(2)}</li>`
    ).join('');

    const htmlContent = `
      <h2>Basket Rebalance Notification - ${basket.name}</h2>
      <p>Your ${basket.name} basket has been rebalanced on ${new Date().toLocaleDateString()}.</p>
      
      <h3>Changes Summary:</h3>
      <h4>Added Stocks:</h4>
      <ul>${addedStocksHTML || '<li>No stocks added</li>'}</ul>
      
      <h4>Removed Stocks:</h4>
      <ul>${removedStocksHTML || '<li>No stocks removed</li>'}</ul>
      
      <h3>Basket Details:</h3>
      <ul>
        <li><strong>Total Stocks:</strong> ${basket.stocks.length}</li>
        <li><strong>Total Value:</strong> ₹${basket.totalValue?.toFixed(2) || 'N/A'}</li>
        <li><strong>Minimum Investment:</strong> ₹${basket.minimumInvestment?.toFixed(2) || 'N/A'}</li>
        <li><strong>Next Rebalance:</strong> ${new Date(basket.nextRebalanceDate).toLocaleDateString()}</li>
      </ul>

      <p>Log in to your account to view detailed portfolio analytics.</p>
      <p style="color: #666; margin-top: 20px;">This is an automated email. Please do not reply.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@indian-stock-basket.com',
      to: recipientEmail,
      subject: `Basket Rebalance Alert - ${basket.name}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send subscription confirmation
const sendSubscriptionConfirmation = async (recipientEmail, basketName) => {
  try {
    const htmlContent = `
      <h2>Subscription Confirmed!</h2>
      <p>You have successfully subscribed to the <strong>${basketName}</strong> basket.</p>
      <p>You will receive email notifications for every rebalance event.</p>
      <p>To manage your subscriptions, log in to your account.</p>
      <p style="color: #666; margin-top: 20px;">This is an automated email. Please do not reply.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@indian-stock-basket.com',
      to: recipientEmail,
      subject: `Subscription Confirmed - ${basketName}`,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending subscription email:', error);
    return false;
  }
};

// Test email connection
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email service configured successfully');
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
};

module.exports = {
  sendRebalanceNotification,
  sendSubscriptionConfirmation,
  testEmailConnection
};
