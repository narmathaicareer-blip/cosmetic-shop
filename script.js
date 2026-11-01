
/* GLOWORA COSMETICS STORE - 360 PRODUCTS
   Demo data is saved in this browser's localStorage.
   Real payment processing and a shared customer database require a backend.
*/
const brands = ["Glowora","Maybelline","L'Oréal Paris","Lakmé","NYX","Pond's","Minimalist","Mamaearth","Swiss Beauty","Insight","Faces Canada","Colorbar"];
const shades = ["Rose Pink","Nude Beige","Berry Red","Peach Glow","Coral Crush","Mocha Brown","Cherry Red","Soft Mauve","Natural Glow","Golden Beige","Blush Pink","Classic Black","Caramel Nude","Plum Wine","Sunset Orange"];
const catalog = [
  ["Lipstick","Lipstick",199,499],["Matte Lipstick","Lipstick",149,399],["Lip Tint","Lip Tint",99,299],
  ["Lip Liner","Lip Liner",99,249],["Lip Gloss","Lip Gloss",129,299],["Foundation","Face Makeup",199,699],
  ["Face Primer","Face Makeup",149,499],["Compact Powder","Face Makeup",149,399],["Highlighter","Face Makeup",149,399],
  ["Concealer","Face Makeup",149,399],["Blush","Face Makeup",129,349],["Eyeliner","Eye Makeup",99,299],
  ["Kajal","Eye Makeup",79,249],["Mascara","Eye Makeup",149,399],["Eyeshadow Palette","Eye Makeup",199,599],
  ["Face Serum","Skincare",199,699],["Moisturizer","Skincare",149,499],["Face Cleanser","Skincare",149,399],
  ["Sunscreen","Skincare",199,599],["Hair Serum","Haircare",149,399],["Shampoo","Haircare",149,399],
  ["Conditioner","Haircare",149,399],["Press-on Nails","Nails",99,299],["Beauty Combo","Combo Offers",199,899]
];
const photos = {
  "Lipstick":"photo-1586495777744-4413f21062fa","Lip Tint":"photo-1586495777744-4413f21062fa",
  "Lip Liner":"photo-1586495777744-4413f21062fa","Lip Gloss":"photo-1586495777744-4413f21062fa",
  "Face Makeup":"photo-1596462502278-27bfdc403348","Eye Makeup":"photo-1512496015851-a90fb38ba796",
  "Skincare":"photo-1601049541289-9b1b7bbbfe19","Haircare":"photo-1527799820374-dcf8d9d4a388",
  "Nails":"photo-1604654894610-df63bc536371","Combo Offers":"photo-1596462502278-27bfdc403348"
};

const products = [];
let nextId = 1;

catalog.forEach(([type,category,min,max], ti) => {
  for (let i=0;i<15;i++) {
    const brand=brands[(ti+i)%brands.length], shade=shades[i];
    let price=min+((i*37+ti*19)%Math.max(1,max-min+1));
    if(category==="Combo Offers") price=i<8?199+i*7:299+(i-8)*55;
    products.push({
      id:nextId++,
      name:category==="Combo Offers"?`${brand} Beauty Combo ${i+1}`:`${brand} ${type} - ${shade}`,
      brand,category,price,old:Math.round(price*1.25),
      rating:Number((4+((i+ti)%10)/10).toFixed(1)),
      image:`https://images.unsplash.com/${photos[category]||photos["Face Makeup"]}?auto=format&fit=crop&w=500&q=75`,
      description:`${type} from ${brand}. Explore this ${shade.toLowerCase()} beauty pick for your daily routine.`,
      shade
    });
  }
});

const $ = s => document.querySelector(s);

function readStore(key,fallback) {
  try {
    const v=JSON.parse(localStorage.getItem(key)||"null");
    return v==null?fallback:v;
  } catch {
    return fallback;
  }
}

let cart=readStore("gloworaCart",[]);
let wishlist=readStore("gloworaWishlist",[]);
let orders=readStore("gloworaOrders",[]);
let currentProduct=products[0], quantity=1, brandFilter="", categoryFilter="All", under250=false, currentPage=1;
const pageSize=20;

try {
  const saved=readStore("gloworaProducts",null);
  if(Array.isArray(saved)&&saved.length) {
    products.splice(0,products.length,...saved);
    nextId=Math.max(...products.map(p=>Number(p.id)||0))+1;
  }
} catch(e) {
  console.warn("Could not load saved products",e);
}

function money(n) {
  return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
}

function escapeHTML(v) {
  return String(v??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function formatDate(v) {
  const d=new Date(v);
  return !v||Number.isNaN(d.getTime())?"—":d.toLocaleString("en-IN",{
    day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"
  });
}

function notify(message) {
  const t=$("#toast");
  if(!t) {
    alert(message);
    return;
  }
  t.textContent=message;
  t.classList.add("show");
  clearTimeout(window.gloworaToastTimer);
  window.gloworaToastTimer=setTimeout(()=>t.classList.remove("show"),2500);
}

function saveData() {
  localStorage.setItem("gloworaCart",JSON.stringify(cart));
  localStorage.setItem("gloworaWishlist",JSON.stringify(wishlist));
  updateCounts();
}

function saveOrders() {
  localStorage.setItem("gloworaOrders",JSON.stringify(orders));
}

function saveProducts() {
  localStorage.setItem("gloworaProducts",JSON.stringify(products));
}

function updateCounts() {
  if($("#cartCount")) $("#cartCount").textContent=cart.reduce((s,i)=>s+Number(i.qty||0),0);
  if($("#wishCount")) $("#wishCount").textContent=wishlist.length;
  if($("#wishHeading")) $("#wishHeading").textContent=`(${wishlist.length})`;
}

function showPage(id) {
  document.querySelectorAll("main > .page").forEach(p=>p.classList.add("hidden"));
  let target=document.getElementById(id);

  if(id==="checkout"&&!target) {
    target=document.createElement("section");
    target.id="checkout";
    target.className="page hidden section";
    $("main").appendChild(target);
  }

  if(id==="orders"&&!target) {
    target=document.createElement("section");
    target.id="orders";
    target.className="page hidden section";
    $("main").appendChild(target);
  }

  if(!target) {
    alert("Page not found: "+id);
    return;
  }

  target.classList.remove("hidden");

  if(id==="cart") renderCart();
  if(id==="wishlist") renderWishlist();
  if(id==="checkout") renderCheckout();
  if(id==="orders") renderOrderHistory();
  if(id==="admin") showAdmin("dashboard");

  window.scrollTo({top:0,behavior:"smooth"});
}

function filterCategory(category) {
  showPage("home");
  categoryFilter=category;
  brandFilter="";
  under250=false;
  currentPage=1;
  if($("#search")) $("#search").value="";
  renderProducts();
  $("#products")?.scrollIntoView({behavior:"smooth"});
}

function filterUnder250() {
  showPage("home");
  categoryFilter="All";
  brandFilter="";
  under250=true;
  currentPage=1;
  if($("#search")) $("#search").value="";
  renderProducts();
  $("#products")?.scrollIntoView({behavior:"smooth"});
}

function filterBrand(brand) {
  showPage("home");
  brandFilter=brand;
  categoryFilter="All";
  under250=false;
  currentPage=1;
  if($("#search")) $("#search").value="";
  renderProducts();
  $("#products")?.scrollIntoView({behavior:"smooth"});
}

function getFilteredProducts() {
  const q=($("#search")?.value||"").toLowerCase().trim();
  let list=products.filter(p=>
    `${p.name} ${p.brand} ${p.category} ${p.shade||""}`.toLowerCase().includes(q)&&
    (!brandFilter||p.brand.toLowerCase()===brandFilter.toLowerCase())&&
    (categoryFilter==="All"||p.category===categoryFilter)&&
    (!under250||p.price<250)
  );

  const sort=$("#sort")?.value||"featured";
  if(sort==="low") list.sort((a,b)=>a.price-b.price);
  if(sort==="high") list.sort((a,b)=>b.price-a.price);
  if(sort==="rating") list.sort((a,b)=>b.rating-a.rating);
  return list;
}

function renderProducts() {
  const grid=$("#productGrid");
  if(!grid) return;

  if(!$("#productCount")) {
    grid.insertAdjacentHTML("beforebegin",'<p id="productCount" class="product-count"></p>');
    grid.insertAdjacentHTML("afterend",'<div id="pagination" class="pagination"></div>');
  }

  const list=getFilteredProducts();
  const pages=Math.ceil(list.length/pageSize);
  currentPage=Math.min(currentPage,Math.max(1,pages));
  const start=(currentPage-1)*pageSize;
  const visible=list.slice(start,start+pageSize);

  $("#productCount").textContent=`Showing ${list.length?start+1:0}–${Math.min(start+pageSize,list.length)} of ${list.length} products${under250?" priced under ₹250":""}`;

  grid.innerHTML=visible.length?visible.map(p=>`
    <article class="card">
      <div class="card-image" onclick="openProduct(${Number(p.id)})">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/500x500/fff0f4/c92f5b?text=Glowora'">
        <button type="button" class="heart" aria-label="Toggle wishlist"
          onclick="event.stopPropagation();toggleWish(${Number(p.id)})">${wishlist.includes(p.id)?"♥":"♡"}</button>
      </div>
      <div class="card-info">
        <div class="brand-name">${escapeHTML(p.brand)}</div>
        <div class="product-name" onclick="openProduct(${Number(p.id)})">${escapeHTML(p.name)}</div>
        <div class="price-row">
          <span class="price">${money(p.price)}</span>
          <del class="old">${money(p.old||p.price)}</del>
          <span class="discount">${Math.max(0,Math.round((1-p.price/(p.old||p.price))*100))}% OFF</span>
        </div>
        <div class="rating">★ <span>${Number(p.rating||0).toFixed(1)} rating</span></div>
        <button type="button" class="primary" onclick="addToCart(${Number(p.id)})">Add to Cart</button>
      </div>
    </article>`).join(""):"<p>No products found. Try a different category or search.</p>";

  const pg=$("#pagination");
  pg.innerHTML="";

  if(pages>1) {
    const prev=document.createElement("button");
    prev.textContent="← Previous";
    prev.disabled=currentPage===1;
    prev.onclick=()=>{currentPage--;renderProducts();$("#products")?.scrollIntoView({behavior:"smooth"});};
    pg.appendChild(prev);

    for(let n=Math.max(1,currentPage-2);n<=Math.min(pages,currentPage+2);n++) {
      const b=document.createElement("button");
      b.textContent=n;
      if(n===currentPage) b.classList.add("active");
      b.onclick=()=>{currentPage=n;renderProducts();$("#products")?.scrollIntoView({behavior:"smooth"});};
      pg.appendChild(b);
    }

    const next=document.createElement("button");
    next.textContent="Next →";
    next.disabled=currentPage===pages;
    next.onclick=()=>{currentPage++;renderProducts();$("#products")?.scrollIntoView({behavior:"smooth"});};
    pg.appendChild(next);
  }
}

function openProduct(id) {
  currentProduct=products.find(p=>Number(p.id)===Number(id));
  if(!currentProduct) return;
  quantity=1;
  $("#detailImage").src=currentProduct.image;
  $("#detailName").textContent=currentProduct.name;
  $("#detailBrand").textContent=`Brand: ${currentProduct.brand} | Category: ${currentProduct.category}`;
  $("#detailRating").textContent=`${currentProduct.rating} rating`;
  $("#detailPrice").textContent=money(currentProduct.price);
  $("#detailDescription").textContent=currentProduct.description;
  $("#detailQty").textContent=quantity;
  showPage("product");
}

function changeDetailQty(n) {
  quantity=Math.max(1,quantity+n);
  $("#detailQty").textContent=quantity;
}

function addDetailToCart() {
  if(currentProduct) addToCart(currentProduct.id,quantity);
}

function toggleDetailWish() {
  if(currentProduct) toggleWish(currentProduct.id);
}

/* Cart and totals */
function addToCart(id,amount=1) {
  const p=products.find(x=>Number(x.id)===Number(id));
  if(!p) return;

  const n=Math.max(1,Math.floor(Number(amount)||1));
  const item=cart.find(x=>Number(x.id)===Number(id));

  if(item) item.qty=Math.max(1,Number(item.qty)||0)+n;
  else cart.push({id:p.id,qty:n});

  saveData();
  if($("#cart")&&!$("#cart").classList.contains("hidden")) renderCart();
  notify("Added to your cart!");
}

function cartDetails() {
  return cart.map(i=>{
    const p=products.find(x=>Number(x.id)===Number(i.id));
    if(!p) return null;
    const qty=Math.max(1,Number(i.qty)||1);
    return {...p,qty,lineTotal:Number(p.price)*qty};
  }).filter(Boolean);
}

function totals(items=cartDetails()) {
  const subtotal=items.reduce((s,p)=>s+p.lineTotal,0);
  const shipping=subtotal===0||subtotal>=999?0:49;
  return {subtotal,shipping,total:subtotal+shipping};
}

function renderCart() {
  if(!$("#cartItems")) return;
  const items=cartDetails();

  $("#cartItems").innerHTML=items.length?items.map(p=>`
    <article class="list-item">
      <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
      <div>
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.brand)} · ${escapeHTML(p.category)}</p>
        <p>Unit price: <b>${money(p.price)}</b></p>
        <div class="quantity">
          <button type="button" onclick="changeCartQty(${Number(p.id)},-1)">−</button>
          <span>${p.qty}</span>
          <button type="button" onclick="changeCartQty(${Number(p.id)},1)">+</button>
        </div>
      </div>
      <div class="list-actions">
        <b>${money(p.lineTotal)}</b>
        <button type="button" class="remove" onclick="removeCartItem(${Number(p.id)})">Remove</button>
      </div>
    </article>`).join(""):"<p>Your cart is empty. Explore our beauty collection!</p>";

  const t=totals(items);
  if($("#subtotal")) $("#subtotal").textContent=money(t.subtotal);
  if($("#shipping")) $("#shipping").textContent=money(t.shipping);
  if($("#total")) $("#total").textContent=money(t.total);

  const btn=$("#cart .summary button");
  if(btn) btn.disabled=!items.length;
}

function changeCartQty(id,n) {
  const item=cart.find(i=>Number(i.id)===Number(id));
  if(!item) return;
  item.qty=Number(item.qty)+n;
  if(item.qty<=0) {
    removeCartItem(id);
    return;
  }
  saveData();
  renderCart();
}

function removeCartItem(id) {
  cart=cart.filter(i=>Number(i.id)!==Number(id));
  saveData();
  renderCart();
  notify("Product removed from cart.");
}

function checkout() {
  if(!cartDetails().length) {
    notify("Your cart is empty!");
    return;
  }
  showPage("checkout");
}

/* Integrated checkout form */
function renderCheckout() {
  const page=$("#checkout");
  if(!page) return;
  const items=cartDetails(),t=totals(items);

  if(!items.length) {
    page.innerHTML=`<h1>Checkout</h1><p>Your cart is empty.</p><button class="primary" onclick="showPage('home')">Continue Shopping</button>`;
    return;
  }

  page.innerHTML=`
    <button type="button" class="back" onclick="showPage('cart')">← Back to Cart</button>
    <h1>Checkout</h1>
    <p>Enter delivery details and review your order.</p>
    <div class="checkout-layout" style="display:grid;grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:24px;align-items:start">
      <form id="checkoutForm" class="panel" style="padding:24px">
        <h2>Delivery Details</h2>
        <label for="checkoutName">Full name</label><br>
        <input id="checkoutName" name="name" autocomplete="name" maxlength="100" required placeholder="Enter your full name"></br>

        <label for="checkoutPhone">Mobile number</label><br>
        <input id="checkoutPhone" name="phone" type="tel" autocomplete="tel" maxlength="20" pattern="[0-9+() -]{7,20}" required placeholder="Enter your mobile number"><br>

        <label for="checkoutEmail">Email address (optional)</label><br>
        <input id="checkoutEmail" name="email" type="email" autocomplete="email" maxlength="150" placeholder="you@example.com"><br>

        <label for="checkoutAddress">House / Street / Delivery address</label><br>
        <textarea id="checkoutAddress" name="address" autocomplete="street-address" maxlength="500" required placeholder="Enter complete delivery address"></textarea><br>

        <label for="checkoutCity">City</label><br>
        <input id="checkoutCity" name="city" autocomplete="address-level2" maxlength="100" required placeholder="City"><br>

        <label for="checkoutPincode">PIN code</label><br>
        <input id="checkoutPincode" name="pincode" inputmode="numeric" autocomplete="postal-code" maxlength="10" pattern="[0-9A-Za-z -]{4,10}" required placeholder="PIN code"><br>

        <h2>Payment Method</h2>
        <label style="display:block;margin:12px 0"><input type="radio" name="paymentMethod" value="Cash on Delivery" checked> Cash on Delivery</label>
        <label style="display:block;margin:12px 0"><input type="radio" name="paymentMethod" value="Online Payment (Demo)"> Online Payment (Demo)</label>

        <p class="muted">Demo checkout only. No real payment is collected.</p>
        <button type="submit" class="primary wide">Place Order</button>
      </form>

      <aside class="summary panel" style="padding:24px">
        <h2>Order Summary</h2>
        ${items.map(p=>`<div style="display:flex;justify-content:space-between;gap:12px;margin:12px 0"><span>${escapeHTML(p.name)} × ${p.qty}</span><b>${money(p.lineTotal)}</b></div>`).join("")}
        <hr>
        <p>Subtotal <b>${money(t.subtotal)}</b></p>
        <p>Shipping <b>${money(t.shipping)}</b></p>
        <hr>
        <p>Total <strong>${money(t.total)}</strong></p>
      </aside>
    </div>`;

  $("#checkoutForm").addEventListener("submit",placeOrder);
}

function placeOrder(event) {
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity()) return;

  const items=cartDetails();
  if(!items.length) {
    notify("Your cart is empty!");
    showPage("cart");
    return;
  }

  const data=new FormData(form),t=totals(items),now=new Date();
  const order={
    orderId:"GLOW-"+now.getTime(),
    customerName:String(data.get("name")||"").trim(),
    phone:String(data.get("phone")||"").trim(),
    email:String(data.get("email")||"").trim(),
    address:String(data.get("address")||"").trim(),
    city:String(data.get("city")||"").trim(),
    pincode:String(data.get("pincode")||"").trim(),
    paymentMethod:String(data.get("paymentMethod")||"Cash on Delivery"),
    paymentStatus:"Not processed (demo)",
    items:items.map(p=>({id:p.id,name:p.name,brand:p.brand,category:p.category,price:Number(p.price),qty:Number(p.qty),lineTotal:Number(p.lineTotal)})),
    subtotal:t.subtotal,shipping:t.shipping,total:t.total,status:"Order Placed",createdAt:now.toISOString()
  };

  orders.push(order);
  saveOrders();
  cart=[];
  saveData();
  renderCart();

  $("#checkout").innerHTML=`
    <div class="panel" style="padding:28px;max-width:700px;margin:20px auto">
      <h1>Thank you for your order! 💗</h1>
      <p>Your demo order has been saved.</p>
      <p><b>Order ID:</b> ${escapeHTML(order.orderId)}</p>
      <p><b>Order date:</b> ${formatDate(order.createdAt)}</p>
      <p><b>Payment method:</b> ${escapeHTML(order.paymentMethod)}</p>
      <p><b>Total:</b> ${money(order.total)}</p>
      <p class="muted">Demo website: no real payment was taken.</p>
      <button type="button" class="primary" onclick="showPage('home')">Continue Shopping</button>
      <button type="button" class="secondary" onclick="showPage('orders')">View Order History</button>
    </div>`;

  notify("Order placed successfully!");
}

function renderOrderHistory() {
  const page=$("#orders");
  if(!page) return;

  page.innerHTML=`
    <h1>My Order History</h1>
    <p>Orders saved in this browser for this demo.</p>
    ${orders.length?[...orders].reverse().map(o=>`
      <article class="panel" style="padding:18px;margin:16px 0">
        <h3>${escapeHTML(o.orderId)}</h3>
        <p><b>Date:</b> ${formatDate(o.createdAt)}</p>
        <p><b>Status:</b> ${escapeHTML(o.status||"Order Placed")}</p>
        <p><b>Products:</b> ${(o.items||[]).map(i=>`${escapeHTML(i.name)} × ${i.qty}`).join(", ")}</p>
        <p><b>Total:</b> ${money(o.total)}</p>
      </article>`).join(""):"<p>No orders have been placed yet.</p>"}
    <button type="button" class="primary" onclick="showPage('home')">Continue Shopping</button>`;
}

/* Wishlist */
function toggleWish(id) {
  id=Number(id);
  wishlist=wishlist.includes(id)?wishlist.filter(x=>x!==id):[...wishlist,id];
  saveData();
  renderProducts();
  if($("#wishlist")&&!$("#wishlist").classList.contains("hidden")) renderWishlist();
  notify(wishlist.includes(id)?"Added to wishlist!":"Removed from wishlist");
}

function renderWishlist() {
  const el=$("#wishlistItems");
  if(!el) return;

  const list=wishlist.map(id=>products.find(p=>Number(p.id)===Number(id))).filter(Boolean);

  el.innerHTML=list.length?list.map(p=>`
    <article class="list-item">
      <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}">
      <div>
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.brand)} · ${escapeHTML(p.category)}</p>
        <b>${money(p.price)}</b>
      </div>
      <div class="list-actions">
        <button type="button" class="small-primary" onclick="addToCart(${Number(p.id)})">Add to Cart</button>
        <button type="button" class="remove" onclick="toggleWish(${Number(p.id)})">Remove ♥</button>
      </div>
    </article>`).join(""):"<p>Your wishlist is empty.</p>";
}

/* Admin: separate Products, Orders and Customers views */
function showAdmin(section="dashboard") {
  const title=$("#adminTitle"),content=$("#adminContent");
  if(!title||!content) return;

  title.textContent=({dashboard:"Dashboard",products:"Products",orders:"Orders",customers:"Customers"})[section]||"Dashboard";

  if(section==="dashboard") {
    const revenue=orders.reduce((s,o)=>s+Number(o.total||0),0);

    content.innerHTML=`
      <div class="stats">
        <div class="stat"><small>Total Products</small><strong>${products.length}</strong></div>
        <div class="stat"><small>Orders</small><strong>${orders.length}</strong></div>
        <div class="stat"><small>Customers</small><strong>${getCustomers().length}</strong></div>
        <div class="stat"><small>Order Revenue (demo)</small><strong>${money(revenue)}</strong></div>
      </div>
      <div class="panel">
        <h3>Welcome to Glowora Admin</h3>
        <p>Manage products, view orders and see customers who placed orders.</p>
        <button class="primary" onclick="showAdmin('orders')">View Orders</button>
        <button class="secondary" onclick="showAdmin('customers')">View Customers</button>
      </div>`;
  } else if(section==="orders") {
    renderAdminOrders(content);
  } else if(section==="customers") {
    renderAdminCustomers(content);
  } else if(section==="products") {
    renderAdminProducts(content);
  }
}

function renderAdminOrders(content) {
  const list=[...orders].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  content.innerHTML=`
    <div class="panel">
      <h3>Orders (${list.length})</h3>
      <p>This page shows orders only.</p>
      ${list.length?`
        <div class="admin-table-wrap">
          <table>
            <thead>
              <tr><th>Order ID</th><th>Order Date & Time</th><th>Customer</th><th>Products & Qty</th><th>Total</th><th>Payment</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${list.map(o=>`
                <tr>
                  <td>${escapeHTML(o.orderId)}</td>
                  <td>${formatDate(o.createdAt)}</td>
                  <td>${escapeHTML(o.customerName)}<br>${escapeHTML(o.phone)}</td>
                  <td>${(o.items||[]).map(i=>`${escapeHTML(i.name)} × ${Number(i.qty)}`).join("<br>")}</td>
                  <td>${money(o.total)}</td>
                  <td>${escapeHTML(o.paymentMethod||"—")}</td>
                  <td>
                    <select aria-label="Order status" onchange="updateOrderStatus('${escapeHTML(o.orderId)}',this.value)">
                      ${["Order Placed","Processing","Shipped","Delivered","Cancelled"].map(s=>`<option ${((o.status||"Order Placed")===s)?"selected":""}>${s}</option>`).join("")}
                    </select>
                  </td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`:"<p>No orders yet. Orders will appear here after checkout.</p>"}
    </div>`;
}

function updateOrderStatus(id,status) {
  const o=orders.find(x=>x.orderId===id);
  if(!o) return;
  o.status=status;
  saveOrders();
  notify("Order status updated.");
}

function getCustomers() {
  const map=new Map();

  orders.forEach(o=>{
    const key=`${(o.email||"").toLowerCase()}|${o.phone||""}|${o.customerName||""}`;

    if(!map.has(key)) {
      map.set(key,{
        name:o.customerName||"Unknown",
        phone:o.phone||"",
        email:o.email||"",
        address:[o.address,o.city,o.pincode].filter(Boolean).join(", "),
        orders:[],
        totalSpent:0,
        lastOrderAt:o.createdAt
      });
    }

    const c=map.get(key);
    c.orders.push(o);
    c.totalSpent+=Number(o.total||0);

    if(new Date(o.createdAt)>new Date(c.lastOrderAt)) {
      c.lastOrderAt=o.createdAt;
      c.address=[o.address,o.city,o.pincode].filter(Boolean).join(", ");
    }
  });

  return [...map.values()].sort((a,b)=>new Date(b.lastOrderAt)-new Date(a.lastOrderAt));
}

function renderAdminCustomers(content) {
  const customers=getCustomers();

  content.innerHTML=`
    <div class="panel">
      <h3>Customers Who Ordered (${customers.length})</h3>
      <p>Only customers who placed an order appear here.</p>
      ${customers.length?`
        <div class="admin-table-wrap">
          <table>
            <thead>
              <tr><th>Customer</th><th>Contact</th><th>Delivery Address</th><th>Products Ordered</th><th>Order Dates</th><th>Orders</th><th>Total Spent</th></tr>
            </thead>
            <tbody>
              ${customers.map(c=>`
                <tr>
                  <td>${escapeHTML(c.name)}</td>
                  <td>${escapeHTML(c.phone)}<br>${escapeHTML(c.email||"—")}</td>
                  <td>${escapeHTML(c.address||"—")}</td>
                  <td>${c.orders.map(o=>(o.items||[]).map(i=>`${escapeHTML(i.name)} × ${Number(i.qty)}`).join(", ")).join("<hr>")}</td>
                  <td>${c.orders.map(o=>formatDate(o.createdAt)).join("<br>")}</td>
                  <td>${c.orders.length}</td>
                  <td>${money(c.totalSpent)}</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>`:"<p>No customers yet. Customer details appear after an order is placed.</p>"}
    </div>`;
}

/* Admin product management */
function renderAdminProducts(content) {
  content.innerHTML=`
    <div class="panel">
      <h3 id="productFormHeading">Add a Product</h3>
      <form id="adminProductForm" class="admin-product-form">
        <input type="hidden" id="editProductId">
        <label>Product name</label><input id="adminProductName" required>
        <label>Brand</label><input id="adminProductBrand" required>
        <label>Category</label>
        <select id="adminProductCategory">
          ${["Lipstick","Lip Tint","Lip Liner","Lip Gloss","Face Makeup","Eye Makeup","Skincare","Haircare","Nails","Combo Offers"].map(c=>`<option>${c}</option>`).join("")}
        </select>
        <label>Price (₹)</label><input id="adminProductPrice" type="number" min="1" required>
        <label>Original price (₹)</label><input id="adminProductOldPrice" type="number" min="1" required>
        <label>Stock quantity</label><input id="adminProductStock" type="number" min="0" value="10" required>
        <label>Product image URL</label><input id="adminProductImage" type="url" placeholder="https://example.com/image.jpg">
        <label>Description</label><textarea id="adminProductDescription"></textarea>
        <button class="primary" type="submit">Save Product</button>
        <button type="button" onclick="resetAdminProductForm()">Clear Form</button>
      </form>
    </div>
    <div class="panel">
      <h3>Store Inventory (${products.length} products)</h3>
      <input id="adminProductSearch" placeholder="Search products">
      <div class="admin-table-wrap">
        <table>
          <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody id="adminProductRows"></tbody>
        </table>
      </div>
    </div>`;

  $("#adminProductForm").addEventListener("submit",saveAdminProduct);
  $("#adminProductSearch").addEventListener("input",renderAdminProductRows);
  renderAdminProductRows();
}

function saveAdminProduct(e) {
  e.preventDefault();

  const id=Number($("#editProductId").value);
  const name=$("#adminProductName").value.trim();
  const brand=$("#adminProductBrand").value.trim();
  const category=$("#adminProductCategory").value;
  const price=Number($("#adminProductPrice").value);
  const old=Number($("#adminProductOldPrice").value);
  const stock=Number($("#adminProductStock").value);
  const image=$("#adminProductImage").value.trim();
  const description=$("#adminProductDescription").value.trim();

  if(!name||!brand||price<=0||old<=0||stock<0) {
    notify("Please enter valid product details.");
    return;
  }

  if(id) {
    const p=products.find(x=>Number(x.id)===id);
    if(!p) return;
    Object.assign(p,{name,brand,category,price,old,stock,image:image||p.image,description:description||name});
    notify("Product updated!");
  } else {
    products.unshift({
      id:nextId++,name,brand,category,price,old,stock,
      image:image||"https://placehold.co/500x500/fff0f4/c92f5b?text=Glowora",
      description:description||name,rating:4.5,shade:"Default"
    });
    notify("Product added!");
  }

  saveProducts();
  renderProducts();
  showAdmin("products");
}

function editAdminProduct(id) {
  const p=products.find(x=>Number(x.id)===Number(id));
  if(!p) return;

  $("#editProductId").value=p.id;
  $("#adminProductName").value=p.name;
  $("#adminProductBrand").value=p.brand;
  $("#adminProductCategory").value=p.category;
  $("#adminProductPrice").value=p.price;
  $("#adminProductOldPrice").value=p.old||p.price;
  $("#adminProductStock").value=p.stock??10;
  $("#adminProductImage").value=p.image||"";
  $("#adminProductDescription").value=p.description||"";
  $("#productFormHeading").textContent="Edit Product #"+p.id;
  $("#adminProductForm").scrollIntoView({behavior:"smooth"});
}

function deleteAdminProduct(id) {
  const p=products.find(x=>Number(x.id)===Number(id));
  if(!p||!confirm(`Remove "${p.name}" from your store?`)) return;

  products.splice(products.findIndex(x=>Number(x.id)===Number(id)),1);
  cart=cart.filter(x=>Number(x.id)!==Number(id));
  wishlist=wishlist.filter(x=>Number(x)!==Number(id));
  saveProducts();
  saveData();
  renderProducts();
  showAdmin("products");
  notify("Product removed.");
}

function resetAdminProductForm() {
  const f=$("#adminProductForm");
  if(!f) return;
  f.reset();
  $("#editProductId").value="";
  $("#adminProductStock").value=10;
  $("#productFormHeading").textContent="Add a Product";
}

function renderAdminProductRows() {
  const body=$("#adminProductRows");
  if(!body) return;

  const q=($("#adminProductSearch")?.value||"").toLowerCase().trim();
  const list=products.filter(p=>`${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q));

  body.innerHTML=list.map(p=>`
    <tr>
      <td>${escapeHTML(p.name)}</td>
      <td>${escapeHTML(p.category)}</td>
      <td>${money(p.price)}</td>
      <td>${Number(p.stock??10)}</td>
      <td>
        <button type="button" onclick="editAdminProduct(${Number(p.id)})">Edit</button>
        <button type="button" class="remove" onclick="deleteAdminProduct(${Number(p.id)})">Delete</button>
      </td>
    </tr>`).join("")||'<tr><td colspan="5">No matching products found.</td></tr>';
}

/* Search, newsletter, login, contact form */
$("#searchForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  brandFilter="";
  categoryFilter="All";
  under250=false;
  currentPage=1;
  showPage("home");
  renderProducts();
  $("#products")?.scrollIntoView({behavior:"smooth"});
});

$("#search")?.addEventListener("input",()=>{
  brandFilter="";
  categoryFilter="All";
  under250=false;
  currentPage=1;
  renderProducts();
});

$("#sort")?.addEventListener("change",()=>{
  currentPage=1;
  renderProducts();
});

$("#newsletter")?.addEventListener("submit",e=>{
  e.preventDefault();
  notify("Thank you for subscribing!");
  e.target.reset();
});

$("#loginForm")?.addEventListener("submit",e=>{
  e.preventDefault();
  notify("Demo login only. Real accounts require a backend.");
});

$("#contactForm")?.addEventListener("submit",e=>{
  e.preventDefault();

  const msg={
    id:"MSG"+Date.now(),
    name:$("#contactName").value.trim(),
    phone:$("#contactPhone").value.trim(),
    email:$("#contactEmail").value.trim(),
    message:$("#contactMessage").value.trim(),
    submittedAt:new Date().toISOString()
  };

  const messages=readStore("gloworaMessages",[]);
  messages.push(msg);
  localStorage.setItem("gloworaMessages",JSON.stringify(messages));
  e.target.reset();
  alert("Thank you for contacting Glowora! Your message was saved in this browser.");
  showPage("home");
});

/* Start */
renderProducts();
updateCounts();
