async function fetchGHFile(path) {
    if (!ghConfig.user || !ghConfig.repo || !ghConfig.token) return null;
    
    // 增加 8 秒超时机制，防止国内网络直连 GitHub 时无限卡死
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}?t=${Date.now()}`;
        const res = await fetch(url, { 
            headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (res.ok) { 
            const data = await res.json(); 
            return { sha: data.sha, content: decodeBase64Utf8(data.content) }; 
        }
        if (res.status === 404) return null;
        
        if (res.status === 401 || res.status === 403) {
            throw new Error(`Token 失效或无权限 (${res.status})`);
        }
        throw new Error(`GitHub API 返回 ${res.status}`);
    } catch (e) { 
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
            throw new Error('网络请求超时 (GitHub API 被墙或网络极差)');
        }
        console.warn(`拉取 ${path} 失败`, e); 
        throw e; 
    }
}

async function pushGHFile(path, contentStr, oldSha) {
    try {
        const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/${path}`;
        const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': `token ${ghConfig.token}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `🐾 自动更新 ${path}`, content: encodeBase64Utf8(contentStr), sha: oldSha || undefined }) });
        return res.ok;
    } catch (e) { console.warn(`上传 ${path} 失败`, e); return false; }
}