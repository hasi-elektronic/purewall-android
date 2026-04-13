// Purewall DNS Service
// Android VPN API üzerinden DNS filtreleme
// Not: Gerçek VPN implementasyonu için react-native-vpn-state veya native module gerekir
// Bu simüle edilmiş bir implementasyondur — gerçek uygulamada native Android VpnService kullanılır

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BlockStat {
  domain: string;
  type: 'ad' | 'tracker' | 'malware';
  timestamp: number;
  appName?: string;
}

export interface FilterList {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  category: 'ads' | 'trackers' | 'malware' | 'regional';
  count?: number;
  isPro?: boolean;
}

export const DEFAULT_FILTER_LISTS: FilterList[] = [
  {
    id: 'easylist',
    name: 'EasyList',
    url: 'https://easylist.to/easylist/easylist.txt',
    enabled: true,
    category: 'ads',
    isPro: false,
  },
  {
    id: 'easyprivacy',
    name: 'EasyPrivacy',
    url: 'https://easylist.to/easylist/easyprivacy.txt',
    enabled: true,
    category: 'trackers',
    isPro: false,
  },
  {
    id: 'ag_base',
    name: 'AdGuard Base',
    url: 'https://filters.adtidy.org/extension/chromium/filters/2.txt',
    enabled: false,
    category: 'ads',
    isPro: true,
  },
  {
    id: 'ag_tracking',
    name: 'AdGuard Tracking Protection',
    url: 'https://filters.adtidy.org/extension/chromium/filters/3.txt',
    enabled: false,
    category: 'trackers',
    isPro: true,
  },
  {
    id: 'ag_mobile',
    name: 'AdGuard Mobile Ads',
    url: 'https://filters.adtidy.org/extension/chromium/filters/11.txt',
    enabled: false,
    category: 'ads',
    isPro: true,
  },
  {
    id: 'ub_privacy',
    name: 'uBlock Privacy',
    url: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
    enabled: false,
    category: 'trackers',
    isPro: true,
  },
  {
    id: 'malware',
    name: 'Malware Domains',
    url: 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
    enabled: true,
    category: 'malware',
    isPro: false,
  },
  {
    id: 'de_filter',
    name: 'Germany Filter 🇩🇪',
    url: 'https://filters.adtidy.org/extension/chromium/filters/6.txt',
    enabled: false,
    category: 'regional',
    isPro: true,
  },
  {
    id: 'tr_filter',
    name: 'Turkey Filter 🇹🇷',
    url: 'https://filters.adtidy.org/extension/chromium/filters/13.txt',
    enabled: false,
    category: 'regional',
    isPro: true,
  },
];

// Bilinen reklam domainleri (örnek liste — gerçekte binlerce olur)
const KNOWN_AD_DOMAINS = new Set([
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'adnxs.com', 'criteo.com', 'taboola.com', 'outbrain.com',
  'amazon-adsystem.com', 'advertising.com', 'adroll.com',
  'facebook.com/tr', 'connect.facebook.net',
  'hotjar.com', 'mixpanel.com', 'segment.io', 'fullstory.com',
  'mouseflow.com', 'crazyegg.com', 'clarity.ms',
  'google-analytics.com', 'googletagmanager.com',
]);

class DNSService {
  private blockedDomains: Set<string> = new Set();
  private blockLog: BlockStat[] = [];
  private isActive = false;
  private totalBlocked = 0;

  async initialize() {
    await this.loadState();
    await this.loadBlockedDomains();
  }

  async loadState() {
    try {
      const state = await AsyncStorage.getItem('dns_state');
      if (state) {
        const parsed = JSON.parse(state);
        this.isActive = parsed.isActive || false;
        this.totalBlocked = parsed.totalBlocked || 0;
      }
    } catch (e) {}
  }

  async saveState() {
    await AsyncStorage.setItem('dns_state', JSON.stringify({
      isActive: this.isActive,
      totalBlocked: this.totalBlocked,
    }));
  }

  async loadBlockedDomains() {
    // Varsayılan domainleri yükle
    KNOWN_AD_DOMAINS.forEach(d => this.blockedDomains.add(d));
    
    try {
      const extra = await AsyncStorage.getItem('extra_domains');
      if (extra) {
        JSON.parse(extra).forEach((d: string) => this.blockedDomains.add(d));
      }
    } catch (e) {}
  }

  // DNS sorgusu engellenmeli mi?
  shouldBlock(domain: string): boolean {
    if (!this.isActive) return false;
    const clean = domain.toLowerCase().replace(/^www\./, '');
    return this.blockedDomains.has(clean) ||
           Array.from(this.blockedDomains).some(d => clean.endsWith('.' + d));
  }

  // Domain engelle ve logla
  blockRequest(domain: string, appName?: string) {
    const type = this.getBlockType(domain);
    const stat: BlockStat = {
      domain,
      type,
      timestamp: Date.now(),
      appName,
    };
    this.blockLog.unshift(stat);
    if (this.blockLog.length > 500) this.blockLog.pop();
    this.totalBlocked++;
    this.saveState();
    this.saveLog();
    return stat;
  }

  private getBlockType(domain: string): BlockStat['type'] {
    const trackerKeywords = ['analytics', 'tracking', 'telemetry', 'pixel', 'beacon'];
    const malwareKeywords = ['malware', 'phishing', 'badware'];
    if (malwareKeywords.some(k => domain.includes(k))) return 'malware';
    if (trackerKeywords.some(k => domain.includes(k))) return 'tracker';
    return 'ad';
  }

  async saveLog() {
    try {
      await AsyncStorage.setItem('block_log', JSON.stringify(this.blockLog.slice(0, 100)));
    } catch (e) {}
  }

  async loadLog() {
    try {
      const log = await AsyncStorage.getItem('block_log');
      if (log) this.blockLog = JSON.parse(log);
    } catch (e) {}
    return this.blockLog;
  }

  async start() {
    this.isActive = true;
    await this.saveState();
    // Gerçek implementasyonda: Android VpnService.Builder başlatılır
    // VPN tüneli kurulur, tüm DNS sorguları bu servise yönlendirilir
    console.log('Purewall DNS Blocker started');
  }

  async stop() {
    this.isActive = false;
    await this.saveState();
    console.log('Purewall DNS Blocker stopped');
  }

  getStatus() {
    return {
      isActive: this.isActive,
      totalBlocked: this.totalBlocked,
      domainsLoaded: this.blockedDomains.size,
    };
  }

  getLog() { return this.blockLog; }
  getTotalBlocked() { return this.totalBlocked; }

  async resetStats() {
    this.blockLog = [];
    this.totalBlocked = 0;
    await this.saveState();
    await AsyncStorage.removeItem('block_log');
  }
}

export const dnsService = new DNSService();
