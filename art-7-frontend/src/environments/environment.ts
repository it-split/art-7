export const environment = {
  production: false,
  serverApiUrl: 'http://localhost:3000/api',
  websocketUrl: 'http://localhost',
  // How frequently to update the canvas data
  sendCanvasDataCooldown: 0.1 * 1000,
  chat: {
    // How long to show new chat messages for
    recentChatMessageHideDelay: 12000,
    // How long to keep the chat window open for after moving the mouse away
    chatBoxLoseFocusDelay: 300,
  }
};
