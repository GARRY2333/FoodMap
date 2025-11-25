import os
from typing import List, Dict

from flask import Flask, render_template, request, jsonify
import requests

from dotenv import load_dotenv
load_dotenv()



AMAP_KEY = os.getenv("AMAP_KEY")

app = Flask(__name__, static_folder="static", template_folder="templates")


@app.route("/")
def index():
    return render_template("index.html")


def fetch_amap_pois(keywords: str, types: str, city: str, pages: int = 3, offset: int = 25) -> List[Dict]:
    """Fetch POIs from AMap Place Text API.

    Args:
        keywords: keyword term, e.g. "餐厅".
        types: AMap type code, e.g. "050000" for 餐饮服务.
        city: city name, e.g. "北京".
        pages: number of pages to retrieve (each page returns up to `offset` items).
        offset: page size (max 25 per AMap docs).

    Returns:
        List of simplified POI dictionaries.
    """
    base_url = "https://restapi.amap.com/v3/place/text"
    results: List[Dict] = []

    for page in range(1, max(1, pages) + 1):
        params = {
            "key": AMAP_KEY,
            "keywords": keywords or "餐厅",
            "city": city or "北京",
            "types": types or "050000",
            "offset": offset,
            "page": page,
        }

        resp = requests.get(base_url, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        

        pois = data.get("pois", [])
        if not pois:
            break

        for p in pois:
            loc = p.get("location", "")
            try:
                lng_str, lat_str = loc.split(",")
                lng = float(lng_str)
                lat = float(lat_str)
            except Exception:
                continue

            results.append({
                "name": p.get("name"),
                "type": p.get("type"),
                "address": p.get("address"),
                "location": {"lng": lng, "lat": lat},
            })

    return results


@app.route("/api/restaurants")
def api_restaurants():
    keywords = request.args.get("keywords", "餐厅")
    types = request.args.get("types", "050000")  # 050000 餐饮服务
    city = request.args.get("city", "北京")
    pages = min(int(request.args.get("pages", 3)), 10)
    offset = min(int(request.args.get("offset", 25)), 25)

    if not AMAP_KEY:
        return jsonify({
            "error": "缺少 AMAP_KEY。请在环境变量中设置你的高德 Web 服务密钥。",
            "items": [],
        }), 200

    items = fetch_amap_pois(keywords, types, city, pages=pages, offset=offset)
    return jsonify({"items": items})


 


 


 


 


 


 


 


 


def _port() -> int:
    val = os.getenv("PORT")
    try:
        return int(val) if val else 5000
    except Exception:
        return 5000


########################
# 已移除边界与环路辅助逻辑（不再用于静态图生成）
########################

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=_port(), debug=True)
