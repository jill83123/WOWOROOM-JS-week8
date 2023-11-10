import { customerApi } from './api.js';
import { showToast } from './swal.js';

// 取得產品列表
function getProducts() {
  axios
    .get(`${customerApi}/products`)
    .then((res) => {
      productList = res.data.products;
      renderProductList(productList);
    })
    .catch((err) => {
      showToast('error', err);
      console.log(err);
    });
}

// 取得購物車列表
function getCartItems() {
  axios
    .get(`${customerApi}/carts`)
    .then((res) => {
      renderCartList(res.data);
    })
    .catch((err) => {
      showToast('error', err);
    });
}

// 加入購物車
function addToCart(id, qty = 1) {
  let data = {
    productId: id,
    quantity: qty,
  };

  axios
    .post(`${customerApi}/carts`, { data })
    .then((res) => {
      renderCartList(res.data);

      spinner.style.display = 'none';
      allAddCardBtn.forEach((item) => item.classList.remove('disabled'));

      showToast('success', '成功加入購物車');
    })
    .catch((err) => {
      showToast('error', err);
    });
}

// 編輯購物車產品數量
function updateCartItemNum(id, qty) {
  const data = {
    id: id,
    quantity: qty,
  };

  axios
    .patch(`${customerApi}/carts`, { data })
    .then((res) => {
      renderCartList(res.data);
      showToast('success', '編輯成功');
      cartBtns.forEach((item) => item.classList.remove('disabled'));
    })
    .catch((err) => {
      showToast('error', err);
    });
}

// 清除購物車內產品
function deleteCartItem(option, id) {
  let api = `${customerApi}/carts`;

  if (option !== 'all') {
    api += `/${id}`;
  }

  axios
    .delete(api)
    .then((res) => {
      renderCartList(res.data);
      cartBtns.forEach((item) => item.classList.remove('disabled'));
      showToast('success', `成功${option === 'all' ? '清空購物車' : '刪除商品'}`);
    })
    .catch((err) => {
      showToast('error', err);
    });
}

// 送出購買訂單
function addOrder() {
  let data = userData;

  axios
    .post(`${customerApi}/orders`, { data })
    .then((res) => {
      orderInfoForm.reset();
      getCartItems();
      showToast('success', '預訂成功');
      orderInfoBtn.classList.remove('disabled');
    })
    .catch((err) => {
      showToast('error', err);
    });
}

/* - - - - - - - - - - - - - - 產品列表相關 - - - - - - - - - - - - - - */
let productList = [];

const productWrap = document.querySelector('.productWrap');
const productSelect = document.querySelector('.productSelect');
let allAddCardBtn = '';
let spinner = ''; // 當前加入購物車按鈕旁的 Loading icon

// 渲染產品列表
function renderProductList(data) {
  let template = '';

  data.forEach((item) => {
    template += `
      <li class="productCard" data-id="${item.id}">
          <h4 class="productType">新品</h4>
          <img
            src="${item.images}"
            alt="${item.title}"
          />
          <a href="#" class="addCardBtn d-flex align-items-center justify-content-center gap-2">
            <div class="spinner-border spinner-border-sm" role="status" style="display: none;">
              <span class="visually-hidden">Loading...</span>
            </div>
            加入購物車
          </a>
          <h3>${item.title}</h3>
          <del class="originPrice">NT$${item.origin_price}</del>
          <p class="nowPrice">NT$${item.price}</p>
      </li>`;
  });

  productWrap.innerHTML = template;
  allAddCardBtn = document.querySelectorAll('.addCardBtn');
}

// 監聽產品篩選
productSelect.addEventListener('change', (e) => {
  let filterData = [];
  if (e.target.value === '全部') {
    filterData = productList;
  } else {
    filterData = productList.filter((item) => item.category === e.target.value);
  }
  renderProductList(filterData);
});

// 點擊加入購物車
productWrap.addEventListener('click', (e) => {
  e.preventDefault();

  if (e.target.classList[0] === 'addCardBtn') {
    let id = e.target.parentNode.getAttribute('data-id');
    let hasSameItem = false;

    if (cartList.length > 0) {
      hasSameItem = cartList.some((item) => item.product.id === id);
    }

    if (hasSameItem) {
      showToast('error', '購物車已有相同商品');
    } else {
      addToCart(id);

      spinner = e.target.children[0];
      spinner.style.display = 'block';

      allAddCardBtn.forEach((item) => item.classList.add('disabled'));
    }
  }
});

/* - - - - - - - - - - - - - - 購物車列表相關 - - - - - - - - - - - - - - */
let cartList = [];

const shoppingCartTable = document.querySelector('.shoppingCart-table');
const shoppingCartTableBody = document.querySelector('#shoppingCart-table-body');
const finalTotalPrice = document.querySelector('#finalTotalPrice');
let cartBtns = '';

// 渲染購物車列表
function renderCartList(data) {
  cartList = data.carts;

  let template = '';

  if (cartList.length > 0) {
    cartList.forEach((item) => {
      template += `
      <tr data-id="${item.id}">
        <td>
          <div class="cardItem-title">
            <img src="${item.product.images}" alt="${item.product.title}" />
            <p>${item.product.title}</p>
          </div>
        </td>
        <td>NT$${item.product.price}</td>
        <td>
          <div class="d-flex align-items-center gap-3" style="margin-left: -12px;">
            <div class="updateBtn">
              <a href="#" class="material-icons" id="removeBtn" style="font-size: 24px;"> remove </a>
            </div>
            ${item.quantity}
            <div class="updateBtn">
              <a href="#" class="material-icons" id="addBtn" style="font-size: 24px;"> add </a>
            </div>
          </div>
        </td>
        <td>NT$${item.product.price * item.quantity}</td>
        <td class="discardBtn">
          <a href="#" class="material-icons" id="discardBtn"> clear </a>
        </td>
      </tr>`;
    });
  } else {
    template = `<tr>
      <td colspan="5" style=" text-align: center; color:#6A33FF;">購物車目前沒有商品！</td>
    </tr>`;
  }

  shoppingCartTableBody.innerHTML = template;
  finalTotalPrice.textContent = `NT$${data.finalTotal}`;

  // 所有購物車的按鈕
  cartBtns = document.querySelectorAll('.updateBtn > *, .discardBtn > *, .discardAllBtn');
}

// 刪除購物車商品
shoppingCartTable.addEventListener('click', (e) => {
  e.preventDefault();

  let option = '';
  let id = e.target.parentNode.parentNode.getAttribute('data-id');

  if (e.target.tagName === 'A' && cartList.length > 0) {
    if (e.target.classList[0] === 'discardAllBtn') {
      option = 'all';
    } else if (e.target.id === 'discardBtn') {
      option = 'one';
    } else {
      return;
    }

    deleteCartItem(option, id);
    cartBtns.forEach((item) => item.classList.add('disabled'));
  } else {
    showToast('error', '購物車目前沒有商品');
  }
});

// 編輯購物車產品數量
shoppingCartTable.addEventListener('click', (e) => {
  e.preventDefault();

  let qty = 1;

  if (e.target.parentNode.classList[0] === 'updateBtn') {
    let id = e.target.closest('tr').getAttribute('data-id');
    let cartIndex = cartList.findIndex((item) => item.id === id);

    if (e.target.id === 'addBtn') {
      qty = cartList[cartIndex].quantity + 1;
    } else {
      qty = cartList[cartIndex].quantity - 1;
    }

    if (qty < 1) {
      showToast('warning', '數量不得小於１');
      return;
    }

    updateCartItemNum(id, qty);
    cartBtns.forEach((item) => item.classList.add('disabled'));
  }
});

/* - - - - - - - - - - - - - - 表單相關 - - - - - - - - - - - - - - */
const orderInfoForm = document.querySelector('.orderInfo-form');
const orderInfoBtn = document.querySelector('.orderInfo-btn');

let userData = {
  user: {
    name: '',
    tel: '',
    email: '',
    address: '',
    payment: '',
  },
};

// 驗證條件
const constraints = {
  姓名: {
    presence: {
      message: '為必填',
    },
  },
  電話: {
    presence: {
      message: '為必填',
    },
    format: {
      pattern: /^((0)([0-9]{1})([-]?)|\(\d[0-9]{1}\))([0-9]{6,8})$|^(09)([0-9]{2})([-]?)([0-9]{6})$/,
      message: '請輸入正確的號碼',
    },
  },
  Email: {
    presence: {
      message: '為必填',
    },
    email: {
      message: '請輸入正確的格式',
    },
  },
  寄送地址: {
    presence: {
      message: '為必填',
    },
  },
  交易方式: {
    presence: {
      message: '為必填',
    },
  },
};

// 驗證表單
orderInfoBtn.addEventListener('click', (e) => {
  e.preventDefault();

  if (cartList.length === 0) {
    showToast('warning', '購物車目前沒有商品');
    return;
  }

  let error = validate(orderInfoForm, constraints);
  if (error === undefined) error = [];

  Object.keys(constraints).forEach((item) => {
    const messageDom = document.querySelector(`[data-message="${item}"]`);

    if (Object.keys(error).includes(item)) {
      messageDom.innerHTML = error[item];
    } else {
      messageDom.innerHTML = '';
    }
  });

  if (error.length === 0) {
    addOrder();
    orderInfoBtn.classList.add('disabled');
  }
});

// 表單輸入監聽
orderInfoForm.addEventListener('change', (e) => {
  userData.user[e.target.id] = e.target.value;
});

// 初始化
function init() {
  getProducts();
  getCartItems();
}

init();
