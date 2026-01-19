import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crown, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, Linkedin, Target, FileText, Radio, MessageSquare, Newspaper, Shield } from 'lucide-react';
import { t } from '../utils/translations.js';
import { API_ENDPOINTS, apiGet } from '../config/api';
import logoImage from '../assets/logo.png';

export function Footer({ setCurrentPage, language }) {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const result = await apiGet(API_ENDPOINTS.SETTINGS.PUBLIC);
      if (result.success) {
        setSettings(result.data?.settings || result.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }
  const quickLinks = [
    { id: 'home', label: t('home', language), icon: Crown },
    { id: 'predictions', label: t('predictions', language), icon: Target },
    { id: 'bulletin', label: t('bulletin', language), icon: FileText },
    { id: 'live', label: t('live', language), icon: Radio },
    { id: 'news', label: t('news', language), icon: Newspaper },
  ];

  const vipLinks = [
    { id: 'vip', label: 'VIP Membership' },
    { id: 'vip', label: 'Pricing Plans' },
    { id: 'vip', label: 'Benefits' },
    { id: 'vip', label: 'Testimonials' },
  ];

  // Dynamic social links from settings
  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: settings?.socialMedia?.facebook || '#', color: 'hover:text-green-500', enabled: settings?.socialMedia?.facebook },
    { name: 'Twitter', icon: Twitter, href: settings?.socialMedia?.twitter || '#', color: 'hover:text-green-500', enabled: settings?.socialMedia?.twitter },
    { name: 'Instagram', icon: Instagram, href: settings?.socialMedia?.instagram || '#', color: 'hover:text-amber-500', enabled: settings?.socialMedia?.instagram },
    { name: 'Youtube', icon: Youtube, href: settings?.socialMedia?.youtube || '#', color: 'hover:text-green-500', enabled: settings?.socialMedia?.youtube },
    { name: 'LinkedIn', icon: Linkedin, href: settings?.socialMedia?.linkedin || '#', color: 'hover:text-green-500', enabled: false },
  ].filter(link => link.enabled || link.name === 'LinkedIn'); // Show only if URL exists or LinkedIn

  // Dynamic contact info from settings
  const contactInfo = [
    { icon: Mail, text: settings?.supportEmail || 'support@optikgoal.com', href: `mailto:${settings?.supportEmail || 'support@optikgoal.com'}` },
    settings?.contactPhone && { icon: Phone, text: settings.contactPhone, href: `tel:${settings.contactPhone.replace(/\s/g, '')}` },
    { icon: MapPin, text: 'New York, NY 10001, USA', href: '#' },
  ].filter(Boolean); // Remove null entries

  return (
    <footer className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-900 border-t border-amber-500/20 mt-20">
      {/* Decorative Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500 via-amber-500 to-transparent opacity-50" />

      <div className="container mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <img
                src={logoImage}
                alt="OptikGoal Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-gray-400 mb-6 leading-relaxed">
              {settings?.footerText || 'Your premium sports prediction platform. Get expert analysis, AI-powered insights, and exclusive VIP predictions to enhance your sports experience.'}
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-gray-400 ${social.color} transition-all hover:bg-gray-700`}
                    whileHover={{ y: -4, scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg mb-6 text-amber-500 flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Quick Links</span>
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <motion.li
                    key={link.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <button
                      onClick={() => setCurrentPage(link.id)}
                      className="flex items-center space-x-2 text-gray-400 hover:text-green-500 transition-colors group"
                    >
                      <motion.div whileHover={{ x: 5 }} className="flex items-center space-x-2">
                        <Icon className="w-4 h-4" />
                        <span>{link.label}</span>
                      </motion.div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>

          {/* VIP & Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg mb-6 text-amber-500 flex items-center space-x-2">
              <Crown className="w-5 h-5" />
              <span>VIP & Support</span>
            </h3>
            <ul className="space-y-3 mb-6">
              {vipLinks.map((link, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <button
                    onClick={() => setCurrentPage(link.id)}
                    className="text-gray-400 hover:text-green-500 transition-colors"
                  >
                    <motion.span whileHover={{ x: 5 }} className="inline-block">
                      {link.label}
                    </motion.span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg mb-6 text-amber-500 flex items-center space-x-2">
              <Mail className="w-5 h-5" />
              <span>Contact Us</span>
            </h3>
            <ul className="space-y-4 mb-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon;
                return (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                  >
                    <a
                      href={info.href}
                      className="flex items-start space-x-3 text-gray-400 hover:text-amber-500 transition-colors group"
                    >
                      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-sm">{info.text}</span>
                    </a>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        {/* VIP Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-2xl mb-12"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-amber-600/20 to-amber-500/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(251,191,36,0.1),transparent_70%)]" />

          <div className="relative border border-amber-500/30 rounded-2xl p-8 text-center">
            <motion.div
              animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block mb-4"
            >
              <Crown className="w-12 h-12 text-amber-500" />
            </motion.div>
            <h3 className="text-2xl mb-2">Become a VIP Member Today</h3>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Get exclusive access to premium predictions, advanced analytics, and priority support
            </p>
            <motion.button
              onClick={() => setCurrentPage('vip')}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 rounded-xl hover:shadow-2xl hover:shadow-green-500/50 transition-all text-white"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Explore VIP Plans
            </motion.button>
          </div>
        </motion.div>

        {/* Trust & Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6 mb-12"
        >
          {[
            { icon: Shield, text: 'Secure Platform' },
            { icon: Crown, text: 'Premium Quality' },
            { icon: Target, text: '87% Win Rate' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-amber-500/20 rounded-lg"
                whileHover={{ scale: 1.05, borderColor: 'rgba(251, 191, 36, 0.5)' }}
              >
                <Icon className="w-5 h-5 text-green-500" />
                <span className="text-sm text-gray-300">{item.text}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-amber-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-gray-400 text-sm text-center md:text-left"
            >
              {settings?.copyrightText || `© ${new Date().getFullYear()} OptikGoal. All rights reserved.`} | Designed with{' '}
              <span className="text-green-500">♥</span> for sports enthusiasts
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="flex items-center space-x-6 text-sm"
            >
              <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-amber-500 transition-colors">
                Cookie Policy
              </a>
            </motion.div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-green-500/30 via-amber-500/30 to-transparent" />
      </div>

      {/* Floating Animation Effect */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute top-1/2 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
        className="absolute top-1/3 right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
      />
    </footer>
  );
}

