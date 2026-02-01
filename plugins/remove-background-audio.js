const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Config plugin to remove 'audio' from UIBackgroundModes
 * This ensures the app doesn't declare background audio capability
 * since we don't use persistent background audio playback
 */
module.exports = function withRemoveBackgroundAudio(config) {
  return withInfoPlist(config, (config) => {
    // Get existing UIBackgroundModes or create empty array
    const backgroundModes = config.modResults.UIBackgroundModes || [];
    
    // Remove 'audio' if it exists
    const filteredModes = backgroundModes.filter(mode => mode !== 'audio');
    
    // Only set UIBackgroundModes if there are other modes, otherwise remove the key entirely
    if (filteredModes.length > 0) {
      config.modResults.UIBackgroundModes = filteredModes;
    } else {
      // Remove the key entirely if no background modes remain
      delete config.modResults.UIBackgroundModes;
    }
    
    return config;
  });
};




