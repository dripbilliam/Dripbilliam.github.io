import { ensureState, getItemPriceForLocation, gold, itemLabel, loadState, num, ORDER_STATUSES, saveState, uid } from "./store-data.js";

let state = ensureState(loadState());

const els = {
  addOrderBtn: document.getElementById("addOrderBtn"),
  orderList: document.getElementById("orderList"),
  orderEmptyState: document.getElementById("orderEmptyState"),
  orderDetail: document.getElementById("orderDetail"),
  orderNumberInput: document.getElementById("orderNumberInput"),
  orderCustomerInput: document.getElementById("orderCustomerInput"),
  orderStatusInput: document.getElementById("orderStatusInput"),
  orderAssignedToInput: document.getElementById("orderAssignedToInput"),
  orderLocationInput: document.getElementById("orderLocationInput"),
  orderDueDateInput: document.getElementById("orderDueDateInput"),
  orderDepositInput: document.getElementById("orderDepositInput"),
  orderNotesInput: document.getElementById("orderNotesInput"),
  addOrderLineBtn: document.getElementById("addOrderLineBtn"),
  orderLineRows: document.getElementById("orderLineRows"),
  orderTotalValue: document.getElementById("orderTotalValue"),
  orderOutstandingQty: document.getElementById("orderOutstandingQty"),
  orderBalanceDue: document.getElementById("orderBalanceDue"),
  deleteOrderBtn: document.getElementById("deleteOrderBtn")
};

bindEvents();
render();

function persist() {
  state = ensureState(state);
  saveState(state);
}

function bindEvents() {
  els.addOrderBtn.addEventListener("click", () => {
    const order = {
      id: uid(),
      orderNumber: `SO-${Date.now().toString().slice(-6)}`,
      customer: "",
      status: "open",
      assignedTo: "",
      locationId: state.locations[0]?.id || "",
      dueDate: "",
      deposit: 0,
      notes: "",
      lines: []
    };
    state.specialOrders.push(order);
    state.selectedOrderId = order.id;
    persist();
    render();
  });

  els.orderList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    state.selectedOrderId = button.dataset.id;
    persist();
    render();
  });

  [
    "orderNumberInput", "orderCustomerInput", "orderStatusInput", "orderAssignedToInput",
    "orderLocationInput", "orderDueDateInput", "orderDepositInput", "orderNotesInput"
  ].forEach((key) => {
    els[key].addEventListener("change", onOrderFieldChange);
  });

  els.addOrderLineBtn.addEventListener("click", () => {
    const order = selectedOrder();
    if (!order) return;
    const defaultItem = state.inventoryItems[0] || null;
    order.lines.push({
      id: uid(),
      itemId: defaultItem?.id || "",
      qty: 0,
      completedQty: 0,
      pricingMode: "price",
      unitPrice: resolveLineUnitPrice(order, { pricingMode: "price" }, defaultItem)
    });
    persist();
    renderOrderLines(order);
    renderOrderSummary(order);
  });

  els.orderLineRows.addEventListener("change", onLineInput);
  els.orderLineRows.addEventListener("click", onLineDelete);

  els.deleteOrderBtn.addEventListener("click", () => {
    const order = selectedOrder();
    if (!order) return;
    if (!confirm("Delete selected order?")) return;
    state.specialOrders = state.specialOrders.filter((entry) => entry.id !== order.id);
    state.selectedOrderId = state.specialOrders[0]?.id || "";
    persist();
    render();
  });
}

function render() {
  renderOrderList();
  renderOrderDetail();
}

function renderOrderList() {
  if (!state.specialOrders.length) {
    els.orderList.innerHTML = `<p class="hint">No orders yet. Create your first special order.</p>`;
    return;
  }

  els.orderList.innerHTML = state.specialOrders
    .slice()
    .sort((a, b) => String(a.orderNumber).localeCompare(String(b.orderNumber)))
    .map((order) => {
      const selected = order.id === state.selectedOrderId;
      const outstanding = order.lines.reduce((sum, line) => sum + Math.max(0, num(line.qty) - num(line.completedQty)), 0);
      return `
        <button class="inventory-item ${selected ? "selected" : ""}" data-id="${order.id}">
          <span class="inventory-item-name">${escapeHtml(order.orderNumber)} • ${escapeHtml(order.customer || "No Customer")}</span>
          <span class="inventory-item-meta">${escapeHtml(order.status)} • Outstanding ${outstanding}</span>
        </button>
      `;
    })
    .join("");
}

function renderOrderDetail() {
  const order = selectedOrder();
  if (!order) {
    els.orderEmptyState.hidden = false;
    els.orderDetail.hidden = true;
    return;
  }

  els.orderEmptyState.hidden = true;
  els.orderDetail.hidden = false;

  els.orderNumberInput.value = order.orderNumber || "";
  els.orderCustomerInput.value = order.customer || "";
  els.orderStatusInput.value = ORDER_STATUSES.includes(order.status) ? order.status : "open";
  els.orderAssignedToInput.value = order.assignedTo || "";
  els.orderDueDateInput.value = order.dueDate || "";
  els.orderDepositInput.value = String(Math.max(0, num(order.deposit)));
  els.orderNotesInput.value = order.notes || "";

  els.orderLocationInput.innerHTML = state.locations.map((location) => `<option value="${location.id}" ${location.id === order.locationId ? "selected" : ""}>${escapeHtml(location.name)}</option>`).join("")
    || `<option value="">No locations</option>`;

  renderOrderLines(order);
  renderOrderSummary(order);
}

function renderOrderLines(order) {
  if (!order.lines.length) {
    els.orderLineRows.innerHTML = `<tr><td colspan="8">No lines yet.</td></tr>`;
    return;
  }

  els.orderLineRows.innerHTML = order.lines.map((line) => {
    const item = state.inventoryItems.find((entry) => entry.id === line.itemId) || null;
    const cost = Math.max(0, num(item?.unitCost));
    const lineTotal = num(line.qty) * num(line.unitPrice);
    return `
      <tr>
        <td>${itemSearchControl(line.id, line.itemId)}</td>
        <td><input data-action="qty" data-line-id="${line.id}" type="number" min="0" value="${Math.max(0, Math.floor(num(line.qty)))}" /></td>
        <td><input data-action="completedQty" data-line-id="${line.id}" type="number" min="0" value="${Math.max(0, Math.floor(num(line.completedQty)))}" /></td>
        <td>${gold(cost)}</td>
        <td>
          <select data-action="pricingMode" data-line-id="${line.id}">
            <option value="price" ${line.pricingMode === "cost" ? "" : "selected"}>Price</option>
            <option value="cost" ${line.pricingMode === "cost" ? "selected" : ""}>Cost</option>
          </select>
        </td>
        <td><input data-action="unitPrice" data-line-id="${line.id}" type="number" min="0" value="${Math.max(0, num(line.unitPrice))}" /></td>
        <td>${gold(lineTotal)}</td>
        <td><button data-action="delete-line" data-line-id="${line.id}" class="danger">Delete</button></td>
      </tr>
    `;
  }).join("");
}

function renderOrderSummary(order) {
  const total = order.lines.reduce((sum, line) => sum + num(line.qty) * num(line.unitPrice), 0);
  const outstanding = order.lines.reduce((sum, line) => sum + Math.max(0, num(line.qty) - num(line.completedQty)), 0);
  const balance = Math.max(0, total - Math.max(0, num(order.deposit)));

  els.orderTotalValue.textContent = gold(total);
  els.orderOutstandingQty.textContent = String(outstanding);
  els.orderBalanceDue.textContent = gold(balance);
}

function onOrderFieldChange() {
  const order = selectedOrder();
  if (!order) return;

  const previousLocationId = order.locationId;
  order.orderNumber = els.orderNumberInput.value;
  order.customer = els.orderCustomerInput.value;
  order.status = ORDER_STATUSES.includes(els.orderStatusInput.value) ? els.orderStatusInput.value : "open";
  order.assignedTo = els.orderAssignedToInput.value;
  order.locationId = els.orderLocationInput.value;
  order.dueDate = els.orderDueDateInput.value;
  order.deposit = Math.max(0, num(els.orderDepositInput.value));
  order.notes = els.orderNotesInput.value;

  if (order.locationId !== previousLocationId) {
    order.lines.forEach((line) => {
      const item = state.inventoryItems.find((entry) => entry.id === line.itemId) || null;
      line.unitPrice = resolveLineUnitPrice(order, line, item);
    });
  }

  persist();
  renderOrderList();
  renderOrderLines(order);
  renderOrderSummary(order);
}

function onLineInput(event) {
  const order = selectedOrder();
  if (!order) return;
  const line = order.lines.find((entry) => entry.id === event.target.dataset.lineId);
  if (!line) return;

  const action = event.target.dataset.action;
  if (action === "itemSearch") {
    if (event.type !== "change") return;
    const selectedName = String(event.target.value || "").trim().toLowerCase();
    const item = state.inventoryItems.find((entry) => itemLabel(state, entry).trim().toLowerCase() === selectedName);
    if (!item) {
      renderOrderLines(order);
      return;
    }
    line.itemId = item.id;
    line.unitPrice = resolveLineUnitPrice(order, line, item);
  }
  if (action === "pricingMode") {
    line.pricingMode = event.target.value === "cost" ? "cost" : "price";
    const item = state.inventoryItems.find((entry) => entry.id === line.itemId) || null;
    line.unitPrice = resolveLineUnitPrice(order, line, item);
  }
  if (action === "qty") line.qty = Math.max(0, Math.floor(num(event.target.value)));
  if (action === "completedQty") line.completedQty = Math.max(0, Math.floor(num(event.target.value)));
  if (action === "unitPrice") line.unitPrice = Math.max(0, num(event.target.value));

  persist();
  renderOrderLines(order);
  renderOrderSummary(order);
  renderOrderList();
}

function onLineDelete(event) {
  const order = selectedOrder();
  if (!order) return;
  if (event.target.dataset.action !== "delete-line") return;

  order.lines = order.lines.filter((line) => line.id !== event.target.dataset.lineId);
  persist();
  renderOrderLines(order);
  renderOrderSummary(order);
  renderOrderList();
}

function itemSearchControl(lineId, selectedId) {
  if (!state.inventoryItems.length) {
    return `<input data-action="itemSearch" data-line-id="${lineId}" type="search" value="" placeholder="No items" disabled />`;
  }

  const selectedItem = state.inventoryItems.find((item) => item.id === selectedId) || state.inventoryItems[0];
  const listId = `order-line-items-${lineId}`;
  const options = state.inventoryItems
    .map((item) => `<option value="${escapeHtml(itemLabel(state, item))}"></option>`)
    .join("");

  return `
    <input data-action="itemSearch" data-line-id="${lineId}" type="search" list="${listId}" value="${escapeHtml(itemLabel(state, selectedItem))}" placeholder="Search item" />
    <datalist id="${listId}">${options}</datalist>
  `;
}

function selectedOrder() {
  return state.specialOrders.find((order) => order.id === state.selectedOrderId) || null;
}

function resolveLineUnitPrice(order, line, item) {
  if (!item) return 0;
  if (line?.pricingMode === "cost") return Math.max(0, num(item.unitCost));
  return Math.max(0, getItemPriceForLocation(state, item, order.locationId));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
