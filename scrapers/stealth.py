import random
import asyncio
from dataclasses import dataclass
from typing import Dict, List, Optional, Any

@dataclass
class BrowserProfile:
    user_agent: str
    sec_ch_ua: str
    sec_ch_ua_platform: str
    sec_ch_ua_mobile: str
    accept_language: str
    viewport_width: int
    viewport_height: int
    device_scale_factor: float
    platform: str

# Curated, strictly synchronized browser identity profiles (no OS/User-Agent mismatches)
BROWSER_PROFILES: List[BrowserProfile] = [
    BrowserProfile(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        sec_ch_ua='"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        sec_ch_ua_platform='"macOS"',
        sec_ch_ua_mobile="?0",
        accept_language="en-US,en;q=0.9",
        viewport_width=1440,
        viewport_height=900,
        device_scale_factor=2.0,
        platform="MacIntel"
    ),
    BrowserProfile(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        sec_ch_ua='"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        sec_ch_ua_platform='"Windows"',
        sec_ch_ua_mobile="?0",
        accept_language="en-US,en;q=0.9,en-GB;q=0.8",
        viewport_width=1920,
        viewport_height=1080,
        device_scale_factor=1.0,
        platform="Win32"
    ),
    BrowserProfile(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        sec_ch_ua="", # Safari does not send Sec-CH-UA by default
        sec_ch_ua_platform="",
        sec_ch_ua_mobile="",
        accept_language="en-US,en;q=0.9",
        viewport_width=1512,
        viewport_height=982,
        device_scale_factor=2.0,
        platform="MacIntel"
    ),
    BrowserProfile(
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0",
        sec_ch_ua='"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126"',
        sec_ch_ua_platform='"Windows"',
        sec_ch_ua_mobile="?0",
        accept_language="en-US,en;q=0.9",
        viewport_width=1920,
        viewport_height=1080,
        device_scale_factor=1.25,
        platform="Win32"
    ),
]

def get_random_profile() -> BrowserProfile:
    """Returns a fully synchronized browser identity profile."""
    return random.choice(BROWSER_PROFILES)

def get_profile_headers(profile: BrowserProfile, custom_headers: Optional[Dict[str, str]] = None) -> Dict[str, str]:
    """
    Constructs ordered, synchronized headers matching a real browser network stack.
    """
    headers = {
        "User-Agent": profile.user_agent,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,application/json,*/*;q=0.8",
        "Accept-Language": profile.accept_language,
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "DNT": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
    }
    if profile.sec_ch_ua:
        headers["Sec-Ch-Ua"] = profile.sec_ch_ua
    if profile.sec_ch_ua_mobile:
        headers["Sec-Ch-Ua-Mobile"] = profile.sec_ch_ua_mobile
    if profile.sec_ch_ua_platform:
        headers["Sec-Ch-Ua-Platform"] = profile.sec_ch_ua_platform

    if custom_headers:
        headers.update(custom_headers)
    return headers

async def async_rate_limit_delay(min_s: float = 0.5, max_s: float = 2.0):
    """
    Applies a natural Poisson / Gaussian jitter delay to mimic realistic human pacing.
    """
    delay = random.uniform(min_s, max_s)
    await asyncio.sleep(delay)

# Comprehensive JavaScript stealth injection script for Playwright / Headless Chromium
STEALTH_INJECTION_SCRIPT = """
(() => {
    // 1. Strip navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
    });

    // 2. Mock chrome runtime object
    window.chrome = {
        runtime: {},
        app: {},
        csi: () => {},
        loadTimes: () => {}
    };

    // 3. Mock WebGL Vendor & Renderer (replace SwiftShader with hardware GPU)
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
            return 'Intel Inc.'; // UNMASKED_VENDOR_WEBGL
        }
        if (parameter === 37446) {
            return 'Intel Iris OpenGL Engine'; // UNMASKED_RENDERER_WEBGL
        }
        return getParameter.apply(this, arguments);
    };

    const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
            return 'Intel Inc.';
        }
        if (parameter === 37446) {
            return 'Intel Iris OpenGL Engine';
        }
        return getParameter2.apply(this, arguments);
    };

    // 4. Mock navigator.plugins
    Object.defineProperty(navigator, 'plugins', {
        get: () => [
            { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
        ]
    });

    // 5. Mock navigator.languages
    Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en']
    });

    // 6. Notification permission
    if (window.Notification) {
        Object.defineProperty(Notification, 'permission', {
            get: () => 'default'
        });
    }
})();
"""
