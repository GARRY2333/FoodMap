const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([39.9042, 116.4074], 13);
// 使用高德自带底图（简约风格 style=7）
const baseLayer = L.tileLayer('https://wprd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scl=2&style=7&x={x}&y={y}&z={z}', {
  maxZoom: 18,
  subdomains: ['1', '2', '3', '4'],
});
baseLayer.addTo(map);

// 仅保留业务图层：店铺标记
const minimalOverlay = L.layerGroup(); // 保留变量避免后续引用报错，但不使用自绘背景/Overpass

// 移除近似环路相关辅助函数

// 添加简单文字标签（用于环路名称、区域名称）
// 移除自定义文字标签函数（仅保留 POI 弹窗）

// 删除近似环路与边界绘制，改为仅使用精确几何

// 高级感绘制样式：边界采用柔和描边 + 轻填充；环路采用双层描边（光晕 + 主线）
// 移除环路与行政边界的样式函数

// Overpass API 获取北京市行政边界与环路精确形状
// 移除 Overpass 相关绘制逻辑

// 移除环路标签选择器

// 移除行政边界拼接逻辑

// 移除精确边界与环路的绘制调用，仅保留底图

const statusEl = document.getElementById('status');
const formEl = document.getElementById('searchForm');
const keywordsEl = document.getElementById('keywords');
const typeEl = document.getElementById('type');

let markersLayer = L.layerGroup();
markersLayer.addTo(map);

// 选中的餐厅数组
let selectedRestaurants = [];

// ensure map container doesn't cover fixed panels
const mapEl = document.getElementById('map');
mapEl.style.zIndex = '0';

function setStatus(text) {
  statusEl.textContent = text || '';
}

function markerPopupHtml(item) {
  const name = item.name || '未命名';
  const type = item.type || '未知类型';
  const addr = item.address || '';
  const isSelected = selectedRestaurants.some(r => r.name === item.name && r.location.lat === item.location.lat && r.location.lng === item.location.lng);
  
  return `
    <div class="poi">
      <div class="poi-title">${name}</div>
      <div class="poi-type">${type}</div>
      ${addr ? `<div class="poi-addr">${addr}</div>` : ''}
      <div class="poi-actions">
        <button class="btn-select ${isSelected ? 'selected' : ''}" onclick="toggleRestaurant('${encodeURIComponent(JSON.stringify(item))}')">
          ${isSelected ? '取消选择' : '选择餐厅'}
        </button>
        <button class="btn-detail" onclick="showRestaurantDetail('${encodeURIComponent(JSON.stringify(item))}')">
          详细信息
        </button>
      </div>
    </div>
  `;
}

async function fetchRestaurants() {
  const qs = new URLSearchParams({
    keywords: keywordsEl.value || '餐厅',
    types: typeEl.value || '050000',
    city: '北京',
    pages: '3',
    offset: '25',
  });

  setStatus('正在从高德获取数据…');
  try {
    const resp = await fetch(`/api/restaurants?${qs.toString()}`);
    const data = await resp.json();
    const items = data.items || [];

    markersLayer.clearLayers();
    const accent = '#2EC4B6';
    const bounds = [];
    items.forEach((item) => {
      const { lat, lng } = item.location || {};
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      
      // 检查是否已选择
      const isSelected = selectedRestaurants.some(r => r.name === item.name && r.location.lat === item.location.lat && r.location.lng === item.location.lng);
      
      const marker = L.circleMarker([lat, lng], {
        radius: isSelected ? 12 : 8,
        color: '#ffffff',
        weight: isSelected ? 3 : 2,
        fillColor: isSelected ? '#FF6B6B' : accent,
        fillOpacity: 1,
      });
      marker.bindPopup(markerPopupHtml(item));
      markersLayer.addLayer(marker);
      bounds.push([lat, lng]);
    });
    if (bounds.length) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    setStatus(items.length ? `已加载 ${items.length} 家餐厅` : (data.error ? data.error : '未找到餐厅'));
  } catch (err) {
    console.error(err);
    setStatus('请求失败，请稍后重试。');
  }
}

formEl.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchRestaurants();
});

// 切换餐厅选择状态
function toggleRestaurant(itemStr) {
  const item = JSON.parse(decodeURIComponent(itemStr));
  const existingIndex = selectedRestaurants.findIndex(r => 
    r.name === item.name && r.location.lat === item.location.lat && r.location.lng === item.location.lng
  );
  
  if (existingIndex >= 0) {
    selectedRestaurants.splice(existingIndex, 1);
  } else {
    selectedRestaurants.push(item);
  }
  
  updateSelectedPanel();
  fetchRestaurants(); // 重新渲染地图标记
}

// 显示餐厅详细信息
function showRestaurantDetail(itemStr) {
  const item = JSON.parse(decodeURIComponent(itemStr));
  
  // 使用高德地图的详细信息显示
  const lat = item.location.lat;
  const lng = item.location.lng;
  
  // 移除之前的详细信息面板
  const existingDetail = document.querySelector('.restaurant-detail-panel');
  if (existingDetail) {
    existingDetail.remove();
  }
  
  // 创建详细信息面板
  const detailPanel = document.createElement('div');
  detailPanel.className = 'restaurant-detail-panel';
  detailPanel.innerHTML = `
    <div class="detail-header">
      <h3>${item.name}</h3>
      <button onclick="this.parentElement.parentElement.remove()" class="btn-close">×</button>
    </div>
    <div class="detail-content">
      <p><strong>类型：</strong>${item.type}</p>
      <p><strong>地址：</strong>${item.address || '暂无地址信息'}</p>
      <p><strong>坐标：</strong>${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
      <div class="detail-actions">
        <button onclick="window.open('https://uri.amap.com/marker?position=${lng},${lat}&name=${encodeURIComponent(item.name)}', '_blank')" class="btn-amap">
          在高德地图中查看
        </button>
      </div>
    </div>
  `;
  
  // 将面板添加到地图容器
  const mapContainer = document.getElementById('map');
  mapContainer.appendChild(detailPanel);
  
  // 调整地图视图以显示餐厅，但不关闭弹窗
  map.setView([lat, lng], 16);
}

// 更新选中餐厅面板
function updateSelectedPanel() {
  let panel = document.getElementById('selectedPanel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'selectedPanel';
    panel.className = 'selected-panel';
    document.body.appendChild(panel);
  }
  
  if (selectedRestaurants.length === 0) {
    panel.innerHTML = '<div class="panel-empty">暂未选择餐厅</div>';
    panel.style.display = 'none';
  } else {
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="panel-header">
        <h3>已选择餐厅 (${selectedRestaurants.length})</h3>
        <button onclick="exportMapImage()" class="btn-export">导出地图图片</button>
      </div>
      <div class="panel-list">
        ${selectedRestaurants.map(restaurant => `
          <div class="panel-item">
            <span>${restaurant.name}</span>
            <button onclick="removeRestaurant('${encodeURIComponent(JSON.stringify(restaurant))}')" class="btn-remove">×</button>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// 移除选中的餐厅
function removeRestaurant(itemStr) {
  const item = JSON.parse(decodeURIComponent(itemStr));
  const existingIndex = selectedRestaurants.findIndex(r => 
    r.name === item.name && r.location.lat === item.location.lat && r.location.lng === item.location.lng
  );
  
  if (existingIndex >= 0) {
    selectedRestaurants.splice(existingIndex, 1);
  }
  
  updateSelectedPanel();
  fetchRestaurants(); // 重新渲染地图标记
}

// 导出地图图片
function exportMapImage() {
  if (selectedRestaurants.length === 0) {
    alert('请先选择至少一家餐厅');
    return;
  }
  
  setStatus('正在生成专业美食地图...');
  
  // 保存当前状态
  const originalCenter = map.getCenter();
  const originalZoom = map.getZoom();
  
  // 进入导出模式
  const originalMarkers = [];
  markersLayer.eachLayer(layer => {
    originalMarkers.push(layer);
  });
  
  // 清除所有标记
  markersLayer.clearLayers();
  
  // 只添加选中的餐厅（但不在Leaflet中添加标记，只用于计算边界）
  const bounds = [];
  selectedRestaurants.forEach((item, index) => {
    const { lat, lng } = item.location;
    bounds.push([lat, lng]);
    
    // 注意：这里不再创建Leaflet标记，避免重复红点
    // 所有视觉元素将在导出容器中直接创建
  });
  
  // 调整视图以包含所有选中的餐厅
  if (bounds.length > 0) {
    map.fitBounds(bounds, { 
      padding: [80, 80],
      maxZoom: 12
    });
  }
  
  // 等待地图完全稳定
  setTimeout(() => {
    const mapContainer = document.getElementById('map');
    
    // 隐藏所有原始标记，确保画面干净
    const leafletMarkerPane = mapContainer.querySelector('.leaflet-marker-pane');
    const leafletPopupPane = mapContainer.querySelector('.leaflet-popup-pane');
    
    if (leafletMarkerPane) {
      leafletMarkerPane.style.display = 'none';
    }
    if (leafletPopupPane) {
      leafletPopupPane.style.display = 'none';
    }
    
    // 创建导出容器，包含所有信息
    const exportContainer = document.createElement('div');
    exportContainer.className = 'export-container';
    exportContainer.style.position = 'absolute';
    exportContainer.style.top = '0';
    exportContainer.style.left = '0';
    exportContainer.style.width = mapContainer.offsetWidth + 'px';
    exportContainer.style.height = mapContainer.offsetHeight + 'px';
    exportContainer.style.pointerEvents = 'none';
    exportContainer.style.zIndex = '9999';
    
    // 添加标题信息
    const titleOverlay = document.createElement('div');
    titleOverlay.className = 'export-title-overlay';
    titleOverlay.innerHTML = `
      <div class="export-main-title">北京美食地图</div>
      <div class="export-subtitle">${selectedRestaurants.length}家精选餐厅</div>
      <div class="export-date-info">${new Date().toLocaleDateString('zh-CN')}</div>
    `;
    exportContainer.appendChild(titleOverlay);
    
    // 为每个选中的餐厅添加标记和信息
    selectedRestaurants.forEach((item, index) => {
      const { lat, lng } = item.location;
      
      // 将地理坐标转换为像素坐标
      const latLng = L.latLng(lat, lng);
      const point = map.latLngToContainerPoint(latLng);
      
      // 创建餐厅标记（更大更饱和的红点）
      const restaurantMarker = document.createElement('div');
      restaurantMarker.className = 'export-restaurant-marker';
      restaurantMarker.style.position = 'absolute';
      restaurantMarker.style.left = point.x + 'px';
      restaurantMarker.style.top = point.y + 'px';
      restaurantMarker.style.width = '24px';
      restaurantMarker.style.height = '24px';
      restaurantMarker.style.background = '#FF4444'; // 更高饱和度的红色
      restaurantMarker.style.border = '4px solid white';
      restaurantMarker.style.borderRadius = '50%';
      restaurantMarker.style.transform = 'translate(-12px, -12px)'; // 调整中心点
      restaurantMarker.style.zIndex = '9998';
      restaurantMarker.style.boxShadow = '0 0 0 3px rgba(255,68,68,0.6), 0 4px 12px rgba(0,0,0,0.4)';
      restaurantMarker.style.pointerEvents = 'none';
      
      exportContainer.appendChild(restaurantMarker);
      
      // 创建餐厅信息卡片
      const restaurantCard = document.createElement('div');
      restaurantCard.className = 'export-restaurant-card';
      restaurantCard.innerHTML = `
        <div class="restaurant-name">${item.name}</div>
        <div class="restaurant-type">${item.type.split(';')[0]}</div>
        <div class="restaurant-addr">${item.address || '地址暂无'}</div>
        <div class="restaurant-coord">${lat.toFixed(4)}°, ${lng.toFixed(4)}°</div>
      `;
      
      // 设置位置（相对于地图容器）- 确保与更大的红点标记完美对齐
      restaurantCard.style.position = 'absolute';
      restaurantCard.style.left = (point.x + 30) + 'px'; // 在更大的标记右侧
      restaurantCard.style.top = (point.y - 70) + 'px'; // 调整位置适应更大的标记
      restaurantCard.style.background = 'rgba(0,0,0,0.9)';
      restaurantCard.style.color = 'white';
      restaurantCard.style.padding = '10px';
      restaurantCard.style.borderRadius = '6px';
      restaurantCard.style.fontSize = '11px';
      restaurantCard.style.fontFamily = 'Inter, system-ui, sans-serif';
      restaurantCard.style.minWidth = '150px';
      restaurantCard.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
      restaurantCard.style.border = '1px solid rgba(255,255,255,0.2)';
      restaurantCard.style.backdropFilter = 'blur(5px)';
      restaurantCard.style.lineHeight = '1.3';
      restaurantCard.style.zIndex = (1000 + index).toString();
      restaurantCard.style.pointerEvents = 'none';
      restaurantCard.style.transform = 'translate(0, 0)'; // 确保位置准确
      
      // 添加餐厅名称样式
      const nameDiv = restaurantCard.querySelector('.restaurant-name');
      nameDiv.style.fontWeight = '600';
      nameDiv.style.color = '#2EC4B6';
      nameDiv.style.marginBottom = '2px';
      nameDiv.style.fontSize = '12px';
      
      const typeDiv = restaurantCard.querySelector('.restaurant-type');
      typeDiv.style.color = 'rgba(255,255,255,0.8)';
      typeDiv.style.marginBottom = '3px';
      
      const addrDiv = restaurantCard.querySelector('.restaurant-addr');
      addrDiv.style.color = 'rgba(255,255,255,0.7)';
      addrDiv.style.marginBottom = '2px';
      addrDiv.style.maxWidth = '180px';
      addrDiv.style.overflow = 'hidden';
      addrDiv.style.textOverflow = 'ellipsis';
      addrDiv.style.whiteSpace = 'nowrap';
      
      const coordDiv = restaurantCard.querySelector('.restaurant-coord');
      coordDiv.style.color = 'rgba(255,255,255,0.6)';
      coordDiv.style.fontSize = '9px';
      coordDiv.style.fontFamily = 'monospace';
      
      exportContainer.appendChild(restaurantCard);
    });
    
    // 将导出容器添加到地图容器中
    mapContainer.appendChild(exportContainer);
    
    // 直接自动导出预览画面
    setTimeout(() => {
      // 先显示进度提示
      const saveHint = document.createElement('div');
      saveHint.className = 'temp-save-hint';
      saveHint.innerHTML = `
        <div class="export-progress">
          <div class="progress-text">正在生成专业美食地图...</div>
          <div class="progress-spinner"></div>
        </div>
      `;
      saveHint.style.position = 'fixed';
      saveHint.style.top = '50%';
      saveHint.style.left = '50%';
      saveHint.style.transform = 'translate(-50%, -50%)';
      saveHint.style.zIndex = '20000';
      saveHint.style.color = 'white';
      saveHint.style.fontFamily = 'Inter, system-ui, sans-serif';
      saveHint.style.background = 'rgba(0,0,0,0.8)';
      saveHint.style.padding = '20px';
      saveHint.style.borderRadius = '8px';
      saveHint.style.backdropFilter = 'blur(10px)';
      
      document.body.appendChild(saveHint);
      
      // 使用html2canvas直接捕获当前预览画面
      html2canvas(mapContainer, {
        useCORS: true,
        allowTaint: true,
        scale: 2, // 高分辨率
        backgroundColor: null,
        logging: false,
        width: mapContainer.offsetWidth,
        height: mapContainer.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        ignoreElements: (element) => {
          // 忽略控制面板和进度提示，只保留地图内容
          return element.classList && (
            element.classList.contains('selected-panel') ||
            element.id === 'selectedPanel' ||
            element.classList.contains('temp-save-hint') ||
            element.classList.contains('topbar') // 也隐藏顶部工具栏
          );
        }
      }).then(canvas => {
        // 移除进度提示
        document.body.removeChild(saveHint);
        
        // 恢复原始标记显示
        if (leafletMarkerPane) {
          leafletMarkerPane.style.display = '';
        }
        if (leafletPopupPane) {
          leafletPopupPane.style.display = '';
        }
        
        // 自动下载图片
        const link = document.createElement('a');
        link.download = `北京美食地图_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}_${selectedRestaurants.length}家餐厅.png`;
        link.href = canvas.toDataURL('image/png', 0.9);
        link.click();
        
        // 显示成功消息
        setStatus(`✅ 成功导出${selectedRestaurants.length}家餐厅的专业美食地图`);
        
        // 清理并恢复原始状态
        setTimeout(() => {
          mapContainer.removeChild(exportContainer);
          
          // 清除导出模式标记
          markersLayer.clearLayers();
          
          // 恢复原始标记
          originalMarkers.forEach(marker => {
            markersLayer.addLayer(marker);
          });
          
          // 恢复原始视图
          map.setView(originalCenter, originalZoom);
        }, 1000);
        
      }).catch(err => {
        console.error('html2canvas导出失败:', err);
        
        // 恢复原始标记显示
        if (leafletMarkerPane) {
          leafletMarkerPane.style.display = '';
        }
        if (leafletPopupPane) {
          leafletPopupPane.style.display = '';
        }
        
        // 移除进度提示
        if (document.body.contains(saveHint)) {
          document.body.removeChild(saveHint);
        }
        
        // 恢复原始状态
        mapContainer.removeChild(exportContainer);
        markersLayer.clearLayers();
        originalMarkers.forEach(marker => {
          markersLayer.addLayer(marker);
        });
        map.setView(originalCenter, originalZoom);
        
        setStatus('❌ 导出失败，请重试');
        alert('导出失败：' + err.message + '\n请检查浏览器权限或使用Chrome浏览器。');
      });
    }, 800); // 稍等确保画面完全稳定
  }, 1500); // 等待地图完全稳定
}

// Initial load
fetchRestaurants();
updateSelectedPanel();
