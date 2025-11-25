# 北京美食地图（Flask + 高德 API）

一个用 Python（Flask）构建的简约美观前端，调用高德 Web 服务 POI 接口，在北京地图上标注餐厅位置、名称与类型。

## 准备工作

1. 申请高德 Web 服务密钥（Key）：
   - 访问 https://console.amap.com/ ，创建应用并获取 key。
   - 使用的是「Web服务」类型的 Key。

2. 在环境变量中配置：
   - Linux/macOS：
     ```bash
     export AMAP_KEY="你的高德Web服务Key"
     ```
   - 或在项目根目录创建 `.env` 文件（如果使用了 python-dotenv）：
     ```env
     AMAP_KEY=你的高德Web服务Key
     ```

## 安装与运行

```bash
pip install -r requirements.txt
python app.py
# 打开浏览器访问 http://localhost:5000/
```

## 使用说明

- 顶部搜索栏可以输入关键词（如：火锅、烤鸭）并选择餐饮类型（AMap 类型代码），点击搜索后会从高德获取北京的相关餐厅并在地图上展示。点击选择餐厅后导出照片即可，可选择多个


## 常见问题

- 若页面提示“缺少 AMAP_KEY”，请确保已正确设置环境变量或 `.env` 文件。
