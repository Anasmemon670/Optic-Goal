const Settings = require('../models/Settings');
const {
  sendSuccess,
  sendError,
} = require('../utils/responseHandler');

/**
 * Get Public Settings
 * GET /api/settings
 */
const getPublicSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        // Return all safe public info (exclude sensitive data like SMTP passwords if added later)
        const publicSettings = {
            // General
            appName: settings.appName,
            appLogo: settings.appLogo,
            supportEmail: settings.supportEmail,
            tagline: settings.tagline,
            contactPhone: settings.contactPhone,
            footerText: settings.footerText,
            copyrightText: settings.copyrightText,

            // Feature Toggles
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            registrationEnabled: settings.registrationEnabled,
            commentsEnabled: settings.commentsEnabled,
            vipEnabled: settings.vipEnabled,
            liveScoresEnabled: settings.liveScoresEnabled,

            // Social Media
            socialMedia: settings.socialMedia || {},

            // SEO (safe to expose)
            seo: settings.seo || {},

            languages: settings.languages,
            vipPricing: settings.vipPricing || {},
        };

        return sendSuccess(res, { settings: publicSettings }, 'Settings retrieved successfully');
    } catch (error) {
        console.error('Error fetching public settings:', error);
        // Return default settings on error instead of failing completely
        const defaultSettings = {
            appName: 'OptikGoal',
            tagline: 'Your Ultimate Sports Prediction Platform',
            vipPricing: {},
            socialMedia: {},
            seo: {}
        };
        return sendSuccess(res, { settings: defaultSettings }, 'Settings retrieved with defaults', 200, true);
    }
};

module.exports = {
    getPublicSettings,
};
