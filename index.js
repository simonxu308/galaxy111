const { exec } = require('child_process');
const fs = require('fs');

// =======================================================
// 1. 核心参数固定 (永久锁死，防止重启后报 404)
// =======================================================
const PORT = process.env.PORT || 3000;
const UUID = process.env.UUID || '854080e9-a866-45db-a1aa-3479838a6c74';
const SUB_PATH = process.env.SUB_PATH || 'simon123';
const ARGO_DOMAIN = process.env.ARGO_DOMAIN || 'v2.xautumon.com';

// =======================================================
// 2. 纯净版直连配置 (彻底剥离 Argo 隧道)
// =======================================================
const xrayConfig = {
    "log": {
        "access": "none",
        "error": "warning",
        "loglevel": "warning"
    },
    "inbounds": [
        {
            "port": PORT,
            "protocol": "vless",
            "settings": {
                "clients": [
                    {
                        "id": UUID,
                        "level": 0
                    }
                ],
                "decryption": "none"
            },
            "streamSettings": {
                "network": "ws",
                "security": "none",
                "wsSettings": {
                    "path": `/${SUB_PATH}`
                }
            }
        }
    ],
    "outbounds": [
        {
            "protocol": "freedom"
        }
    ]
};

// =======================================================
// 3. 服务启动核心逻辑
// =======================================================
async function startService() {
    console.log("==========================================");
    console.log("🚀 Northflank 专属 VLESS 直连节点初始化");
    console.log(`- 监听端口: ${PORT}`);
    console.log(`- 固定路径: /${SUB_PATH}`);
    console.log("==========================================");

    // 生成配置文件
    fs.writeFileSync('config.json', JSON.stringify(xrayConfig, null, 2));
    
    // 自动拉取 Xray 核心 (智能兼容 wget 与 curl)
    if (!fs.existsSync('./xray')) {
        console.log("⬇️ 正在下载纯净版 Xray 核心组件...");
        const url = "https://github.com/XTLS/Xray-core/releases/latest/download/Xray-linux-64.zip";
        const cmd = `wget -qO xray.zip ${url} || curl -sL -o xray.zip ${url}; unzip -qo xray.zip xray -d . && rm xray.zip && chmod +x xray`;
        
        exec(cmd, (err) => {
            if (err) {
                console.error("❌ Xray 核心下载失败:", err);
                return;
            }
            runXray();
        });
    } else {
        runXray();
    }
}

function runXray() {
    console.log("✅ 正在启动代理引擎 (直连模式，Argo已禁用)...");
    
    const xray = exec('./xray -c config.json');
    
    xray.stdout.on('data', data => console.log(`[Xray] ${data.trim()}`));
    xray.stderr.on('data', data => console.error(`[Xray Error] ${data.trim()}`));
    
    // 生成最终的 VLESS 订阅节点分享链接
    const vlessUrl = `vless://${UUID}@104.21.35.67:443?encryption=none&security=tls&sni=${ARGO_DOMAIN}&type=ws&host=${ARGO_DOMAIN}&path=%2F${SUB_PATH}#Northflank-US`;
    
    setTimeout(() => {
        console.log("\n==========================================");
        console.log("🎉 节点启动成功！请复制下方链接导入 v2rayN：");
        console.log(vlessUrl);
        console.log("==========================================\n");
    }, 2000);
}

startService();
