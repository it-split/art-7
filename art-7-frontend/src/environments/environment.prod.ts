export const environment = {
  production: true,
  serverApiUrl: 'https://splits.space/server/api',
  websocketUrl: 'https://splits.space',
  // 200 ms
  sendCanvasDataCooldown: 0.2 * 1000,
  chat: {
    // How long to show new chat messages for
    recentChatMessageHideDelay: 12000,
    // How long to keep the chat window open for after moving the mouse away
    chatBoxLoseFocusDelay: 300,
  }
};
