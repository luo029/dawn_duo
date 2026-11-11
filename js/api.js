async function _doFetch(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        return res;
    } catch (e) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') throw new Error(`网络请求超时 (${timeoutMs / 1000}s)`);
        throw e;
    }
}

async function ghFetch(path, options = {}, forceTimeout = 8000) {
    const cleanHost = ghConfig.apiProxy ? ghConfig.apiProxy.replace(/\/$/, '') : '';
    const directUrl = `https://api.github.com${path}`;
    const proxyUrl = cleanHost ? `${cleanHost}${path}` : null;

    if (!proxyUrl) {
        return _doFetch(directUrl, options, forceTimeout);
    }

    if (ghConfig.autoFallback === false) {
        return _doFetch(proxyUrl, options, forceTimeout);
    }

    const fallbackMs = 3000;
    try {
        return await _doFetch(directUrl, options, fallbackMs);
    } catch (e) {
        console.warn('直连超时，自动切换代理重试...', e);
        return await _doFetch(proxyUrl, options, forceTimeout);
    }
}

async function fetchGHFile(path) {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return null;
    try {
        const res = await ghFetch(`/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}?t=${Date.now()}`, { headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' } });
        if (res.ok) { const data = await res.json(); return { sha: data.sha, content: decodeBase64Utf8(data.content) }; }
        if (res.status === 404) return null;
        if (res.status === 401 || res.status === 403) throw new Error(`Token 失效或无权限 (${res.status})`);
        throw new Error(`GitHub API 返回 ${res.status}`);
    } catch (e) { console.warn(`拉取 ${path} 失败`, e); throw e; }
}

async function pushGHFile(path, contentStr, oldSha) {
    try {
        const res = await ghFetch(`/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}`, { method: 'PUT', headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `🐾 自动更新 ${path}`, content: encodeBase64Utf8(contentStr), sha: oldSha || undefined }) });
        return res.ok;
    } catch (e) { console.warn(`上传 ${path} 失败`, e); return false; }
}