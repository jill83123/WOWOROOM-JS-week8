import { adminApi, token } from './api.js';
import { showToast, showCheck } from './swal.js';

// 取得訂單列表
function getOrders() {
  axios
    .get(`${adminApi}/orders`, token)
    .then((res) => {
      renderOrderList(res.data.orders);
    })
    .catch((err) => {
      showToast('error', err);
    });
}

// 修改訂單狀態
function updateOrders(id, paid) {
  const data = {
    id,
    paid,
  };

  axios
    .put(`${adminApi}/orders`, { data }, token)
    .then((res) => {
      renderOrderList(res.data.orders);
      showToast('success', '修改成功');
    })
    .catch((err) => {
      showToast('error', err);
    });
}

// 刪除訂單
function deleteOrders(option, id) {
  let apiUrl = `${adminApi}/orders`;
  apiUrl = option !== 'all' ? `${apiUrl}/${id}` : apiUrl;

  axios
    .delete(apiUrl, token)
    .then((res) => {
      renderOrderList(res.data.orders);
      showToast('success', '刪除成功');
    })
    .catch((err) => {
      showToast('error', err);
    });
}

/* - - - - - - - - - - - - - - 訂單列表相關 - - - - - - - - - - - - - - */
let orderList = [];

const orderPageList = document.querySelector('.orderPage-list');
const orderTableBody = orderPageList.querySelector('tbody');
let deleteOrderBtns = null;

// 渲染訂單列表
function renderOrderList(data) {
  orderList = data;

  let template = '';

  orderList.forEach((order) => {
    template += `<tr data-id="${order.id}">
    <td>10088377474</td>
    <td>
      <p>${order.user.name}</p>
      <p>${order.user.tel}</p>
    </td>
    <td>${order.user.address}</td>
    <td>${order.user.email}</td>
    <td>
      <ul style="list-style: disc; list-style-position: inside;">
        <li>${order.products
          .map((item) => {
            return item.title;
          })
          .join('</li><li>')}
        </li>
      </ul>
    </td>
    <td>${formatDate(order.createdAt)}</td>
    <td class="orderStatus">
      <a href="#" class="orderStatusA" style="color:${order.paid ? '#A5DC86' : '#F27474'};">
        ${order.paid ? '已處理' : '未處理'}
      </a>
    </td>
    <td>
      <input type="button" class="delSingleOrder-Btn" value="刪除" />
    </td>
    </tr>`;
  });

  orderTableBody.innerHTML = template;
  deleteOrderBtns = document.querySelectorAll('.delSingleOrder-Btn, .discardAllBtn');

  // 渲染當前選單圖表
  if (orderList.length > 0) {
    chartMethod[currentChartSelect]();
  } else {
    chartDom.innerHTML = `
    <p
      class="section-title position-absolute top-50 start-50 translate-middle" style="color: #6a33ff;">
        目前沒有訂單！
    </p>`;
  }
}

// 時間戳轉日期
function formatDate(date) {
  const timestamp = date;
  const dateObject = new Date(timestamp * 1000);

  const year = dateObject.getFullYear();
  const month = ('0' + (dateObject.getMonth() + 1)).slice(-2);
  const day = ('0' + dateObject.getDate()).slice(-2);

  const formattedDate = `${year}/${month}/${day}`;

  return formattedDate;
}

// 編輯訂單狀態
orderPageList.addEventListener('click', (e) => {
  e.preventDefault();

  if (e.target.classList[0] === 'orderStatusA') {
    const id = e.target.closest('tr').getAttribute('data-id');
    let status = e.target.textContent.trim() === '已處理' ? false : true;

    updateOrders(id, status);
  }
});

// 刪除訂單
orderPageList.addEventListener('click', (e) => {
  let option = '';
  let id = '';

  if (e.target.classList[0] === 'discardAllBtn') {
    option = 'all';
  } else if (e.target.classList[0] === 'delSingleOrder-Btn') {
    option = 'one';
    id = e.target.closest('tr').getAttribute('data-id');
  } else {
    return;
  }
  showCheck('warning', '確認刪除', () => {
    deleteOrders(option, id);
  });
});

/* - - - - - - - - - - - - - - 圖表相關 - - - - - - - - - - - - - - */
const chartSelect = document.querySelector('#chartSelect');
const chartSelectTitle = document.querySelector('#chartSelect-title');
const chartDom = document.querySelector('#chart');

let chartResultData = [];
let currentChartSelect = chartSelect[0].value; // 下拉選單當前的值

// 下拉選單監聽
chartSelect.addEventListener('change', (e) => {
  currentChartSelect = e.target.value;
  chartMethod[e.target.value]();
  chartSelectTitle.textContent = e.target.options[e.target.selectedIndex].textContent;
});

const chartMethod = {
  // 品項營收
  allProductSales() {
    // 所有訂單的商品轉成一個物件
    let totalPriceObj = {};
    orderList.forEach((order) => {
      order.products.forEach((product) => {
        const { title, quantity, price } = product;
        if (totalPriceObj[title]) {
          totalPriceObj[title] += quantity * price;
        } else {
          totalPriceObj[title] = quantity * price;
        }
      });
    });

    // 排序
    const productSort = Object.entries(totalPriceObj)
      .map(([title, totalPrice]) => ({ title, totalPrice }))
      .sort((a, b) => b.totalPrice - a.totalPrice);

    // 整理
    let chartList = productSort;

    if (productSort.length > 3) {
      const topThree = productSort.slice(0, 3);
      const otherArray = productSort.slice(3);
      let otherTotalPrice = 0;

      // 計算其他的總價
      otherArray.forEach((product) => {
        otherTotalPrice += product.totalPrice;
      });

      chartList = topThree;
      chartList.push({ title: '其他', otherTotalPrice });
    }

    chartResultData = chartList.map((obj) => Object.values(obj));
    this.renderChart();
  },
  // 類別營收
  allCategorySales() {
    let categoryObj = {};

    orderList.forEach((order) => {
      order.products.forEach((product) => {
        const { category, quantity } = product;
        if (categoryObj[category]) {
          categoryObj[category] += quantity;
        } else {
          categoryObj[category] = quantity;
        }
      });
    });

    chartResultData = Object.entries(categoryObj);
    this.renderChart();
  },
  // 渲染圖表
  renderChart() {
    let chart = c3.generate({
      bindto: '#chart',
      data: {
        type: 'pie',
        columns: chartResultData,
      },
      color: {
        pattern: ['#DACBFF', '#9D7FEA', '#5434A7', '#301E5F'],
      },
    });
  },
};

// 初始化
function init() {
  getOrders();
}

init();
