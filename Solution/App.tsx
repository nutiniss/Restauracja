import React, { useEffect, useState } from 'react';
import { restaurantApi } from './src/api/restaurantApi';
import {
  MenuCategory,
  MenuItem,
  Order,
  OrderItem,
  Payment,
  PaymentMethod,
  RestaurantTable,
  Waiter,
} from './src/domain/entities';
import {
  OrderItemStatus,
  OrderStatus,
  TableStatus,
} from './src/domain/enums/RestaurantEnums';
import { RestaurantStore } from './src/domain/repositories/RestaurantStore';
import { AppMode, AppShell, AppTab } from './src/ui/layout/AppShell';
import { AdminScreen } from './src/ui/screens/AdminScreen';
import { HistoryScreen } from './src/ui/screens/HistoryScreen';
import { MenuScreen } from './src/ui/screens/MenuScreen';
import { TablesScreen } from './src/ui/screens/TablesScreen';
import { WaitersScreen } from './src/ui/screens/WaitersScreen';

const initialStore = restaurantApi.seedStore();

function App(): React.JSX.Element {
  const [mode, setMode] = useState<AppMode>('service');
  const [activeTab, setActiveTab] = useState<AppTab>('tables');
  const [store, setStore] = useState<RestaurantStore>(initialStore);
  const [selectedTableId, setSelectedTableId] = useState(2);
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState(1);
  const [search, setSearch] = useState('');
  const [isTableDetailsOpen, setIsTableDetailsOpen] = useState(false);
  const [menuSourceTableId, setMenuSourceTableId] = useState<number>();
  const [apiStatus, setApiStatus] = useState('Ładowanie danych z API...');

  const syncStore = async (operation: () => Promise<RestaurantStore>) => {
    try {
      const nextStore = await operation();
      setStore(nextStore);
      setApiStatus('Połączono z API i bazą danych');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'nieznany błąd';
      setApiStatus(`Tryb offline: ${message}`);
      console.warn('Restaurant API unavailable', error);
    }
  };

  useEffect(() => {
    syncStore(restaurantApi.getStore);
  }, []);

  const activeTables = store.tables.filter(table => table.isActive);
  const activeCategories = store.categories.filter(
    category => category.isActive,
  );
  const activeMenuItems = store.menuItems.filter(item => item.isAvailable);
  const activePaymentMethods = store.paymentMethods.filter(
    method => method.isActive,
  );
  const activeWaiters = store.waiters.filter(waiter => waiter.isActive);
  const selectedTable =
    activeTables.find(table => table.id === selectedTableId) ??
    activeTables[0] ??
    store.tables[0];
  const selectedOrder = store.orders.find(
    order => order.id === selectedTable.orderId,
  );
  const selectedOrderItems = store.orderItems.filter(
    item => item.orderId === selectedOrder?.id,
  );

  const getMenuItem = (id: number) =>
    store.menuItems.find(item => item.id === id);
  const getWaiter = (id?: number) =>
    store.waiters.find(waiter => waiter.id === id);
  const getOrderItems = (orderId?: number) =>
    store.orderItems.filter(item => item.orderId === orderId);
  const getOrderTotal = (orderId?: number) =>
    getOrderItems(orderId).reduce((sum, item) => sum + item.total, 0);
  const getPaidTotal = (orderId?: number) =>
    getOrderItems(orderId)
      .filter(item => item.isPaid)
      .reduce((sum, item) => sum + item.total, 0);

  const openOrder = (table: RestaurantTable) => {
    syncStore(() => restaurantApi.openOrder(table.id));
    if (table.orderId) {
      setSelectedTableId(table.id);
      setIsTableDetailsOpen(true);
      return;
    }

    setStore(current => {
      const newOrderId =
        Math.max(...current.orders.map(order => order.id), 0) + 1;
      const waiterId = table.waiterId ?? current.waiters[0].id;
      const newOrder = new Order(
        newOrderId,
        table.id,
        waiterId,
        'teraz',
        OrderStatus.Open,
      );

      return {
        ...current,
        orders: [...current.orders, newOrder],
        tables: current.tables.map(currentTable =>
          currentTable.id === table.id
            ? currentTable.assignOrder(newOrderId, waiterId)
            : currentTable,
        ),
      };
    });
    setSelectedTableId(table.id);
    setIsTableDetailsOpen(true);
  };

  const addItemToOrder = (
    menuItem: MenuItem,
    tableId: number,
    quantity: number,
    notes?: string,
  ) => {
    if (!menuItem.isAvailable || quantity <= 0) {
      return;
    }

    syncStore(() =>
      restaurantApi.addItem(tableId, menuItem.id, quantity, notes),
    );

    setStore(current => {
      const table = current.tables.find(
        currentTable => currentTable.id === tableId,
      );
      if (!table) {
        return current;
      }

      const orderId =
        table.orderId ??
        Math.max(...current.orders.map(order => order.id), 0) + 1;
      const waiterId = table.waiterId ?? current.waiters[0].id;
      const newItemId =
        Math.max(...current.orderItems.map(item => item.id), 0) + 1;
      const newItem = new OrderItem(
        newItemId,
        orderId,
        menuItem.id,
        quantity,
        menuItem.price,
        OrderItemStatus.Ordered,
        undefined,
        notes,
      );
      const orders = table.orderId
        ? current.orders
        : [
            ...current.orders,
            new Order(orderId, table.id, waiterId, 'teraz', OrderStatus.Open),
          ];

      return {
        ...current,
        orders,
        orderItems: [...current.orderItems, newItem],
        tables: current.tables.map(currentTable =>
          currentTable.id === table.id && !table.orderId
            ? currentTable.assignOrder(orderId, waiterId)
            : currentTable,
        ),
      };
    });
    setSelectedTableId(tableId);
  };

  const goToOrderItemSelection = () => {
    setMenuSourceTableId(selectedTable.id);
    setIsTableDetailsOpen(false);
    setActiveTab('menu');
  };

  const backToOrderDetails = () => {
    if (menuSourceTableId) {
      setSelectedTableId(menuSourceTableId);
      setIsTableDetailsOpen(true);
    }
    setActiveTab('tables');
  };

  const changeMode = (nextMode: AppMode) => {
    setMode(nextMode);
    setIsTableDetailsOpen(false);
    setSelectedItemIds([]);
    setMenuSourceTableId(undefined);
  };

  const changeTab = (tab: AppTab) => {
    if (mode === 'admin' && tab !== 'admin') {
      setMode('service');
    }
    if (mode === 'service' && tab === 'admin') {
      setMode('admin');
    }
    if (tab === 'menu') {
      setMenuSourceTableId(undefined);
    }
    setIsTableDetailsOpen(false);
    setSelectedItemIds([]);
    setActiveTab(tab);
  };

  const togglePaymentItem = (itemId: number) => {
    setSelectedItemIds(current =>
      current.includes(itemId)
        ? current.filter(id => id !== itemId)
        : [...current, itemId],
    );
  };

  const updateOrderPaymentState = (
    current: RestaurantStore,
    order: Order,
    paidIds: number[],
    payment: Payment,
  ): RestaurantStore => {
    const orderItems = current.orderItems.map(item =>
      paidIds.includes(item.id) ? item.markPaid(payment.id) : item,
    );
    const hasUnpaidItems = orderItems.some(
      item =>
        item.orderId === order.id &&
        !item.isPaid &&
        item.status !== OrderItemStatus.Cancelled,
    );
    const orderStatus = hasUnpaidItems
      ? OrderStatus.PartiallyPaid
      : OrderStatus.Paid;
    const tableStatus = hasUnpaidItems
      ? TableStatus.PartiallyPaid
      : TableStatus.Paid;

    return {
      ...current,
      payments: [...current.payments, payment],
      orderItems,
      orders: current.orders.map(currentOrder =>
        currentOrder.id === order.id
          ? currentOrder.updateStatus(
              orderStatus,
              hasUnpaidItems ? undefined : 'teraz',
            )
          : currentOrder,
      ),
      tables: current.tables.map(table =>
        table.id === order.tableId ? table.updateStatus(tableStatus) : table,
      ),
    };
  };

  const assignWaiterToSelectedTable = (waiterId: number) => {
    syncStore(() => restaurantApi.assignWaiter(selectedTable.id, waiterId));
    setStore(current => ({
      ...current,
      tables: current.tables.map(table =>
        table.id === selectedTable.id ? table.assignWaiter(waiterId) : table,
      ),
      orders: current.orders.map(order =>
        order.id === selectedOrder?.id ? order.assignWaiter(waiterId) : order,
      ),
    }));
  };

  const paySelectedItems = (tipAmount = 0) => {
    if (!selectedOrder || selectedItemIds.length === 0) {
      return;
    }

    syncStore(() =>
      restaurantApi.payOrder(
        selectedOrder.id,
        paymentMethodId,
        selectedItemIds,
      ),
    );

    setStore(current => {
      const itemsToPay = current.orderItems.filter(
        item =>
          selectedItemIds.includes(item.id) &&
          item.orderId === selectedOrder.id &&
          !item.isPaid,
      );
      const amount = itemsToPay.reduce((sum, item) => sum + item.total, 0);
      if (amount === 0) {
        return current;
      }

      const newPaymentId =
        Math.max(...current.payments.map(payment => payment.id), 0) + 1;
      const payment = new Payment(
        newPaymentId,
        selectedOrder.id,
        paymentMethodId,
        amount,
        tipAmount,
        'teraz',
      );
      const paidIds = itemsToPay.map(item => item.id);

      return updateOrderPaymentState(current, selectedOrder, paidIds, payment);
    });
    setSelectedItemIds([]);
  };

  const payFullBill = (tipAmount = 0) => {
    if (!selectedOrder) {
      return;
    }

    syncStore(() => restaurantApi.payOrder(selectedOrder.id, paymentMethodId));

    setStore(current => {
      const itemsToPay = current.orderItems.filter(
        item => item.orderId === selectedOrder.id && !item.isPaid,
      );
      const amount = itemsToPay.reduce((sum, item) => sum + item.total, 0);
      if (amount === 0) {
        return current;
      }

      const newPaymentId =
        Math.max(...current.payments.map(payment => payment.id), 0) + 1;
      const payment = new Payment(
        newPaymentId,
        selectedOrder.id,
        paymentMethodId,
        amount,
        tipAmount,
        'teraz',
      );
      const paidIds = itemsToPay.map(item => item.id);

      return updateOrderPaymentState(current, selectedOrder, paidIds, payment);
    });
    setSelectedItemIds([]);
  };

  const saveTable = (table: RestaurantTable) => {
    setStore(current => ({
      ...current,
      tables: current.tables.some(currentTable => currentTable.id === table.id)
        ? current.tables.map(currentTable =>
            currentTable.id === table.id ? table : currentTable,
          )
        : [...current.tables, table],
    }));
    setSelectedTableId(table.id);
  };

  const saveCategory = (category: MenuCategory) => {
    setStore(current => ({
      ...current,
      categories: current.categories.some(
        currentCategory => currentCategory.id === category.id,
      )
        ? current.categories.map(currentCategory =>
            currentCategory.id === category.id ? category : currentCategory,
          )
        : [...current.categories, category],
    }));
    setSelectedCategoryId(category.id);
  };

  const saveMenuItemFromAdmin = (menuItem: MenuItem) => {
    setStore(current => ({
      ...current,
      menuItems: current.menuItems.some(item => item.id === menuItem.id)
        ? current.menuItems.map(item =>
            item.id === menuItem.id ? menuItem : item,
          )
        : [...current.menuItems, menuItem],
    }));
    setSelectedCategoryId(menuItem.categoryId);
  };

  const savePaymentMethod = (paymentMethod: PaymentMethod) => {
    setStore(current => ({
      ...current,
      paymentMethods: current.paymentMethods.some(
        method => method.id === paymentMethod.id,
      )
        ? current.paymentMethods.map(method =>
            method.id === paymentMethod.id ? paymentMethod : method,
          )
        : [...current.paymentMethods, paymentMethod],
    }));
    setPaymentMethodId(paymentMethod.id);
  };

  const saveWaiter = (waiter: Waiter) => {
    setStore(current => ({
      ...current,
      waiters: current.waiters.some(
        currentWaiter => currentWaiter.id === waiter.id,
      )
        ? current.waiters.map(currentWaiter =>
            currentWaiter.id === waiter.id ? waiter : currentWaiter,
          )
        : [...current.waiters, waiter],
    }));
  };

  const activateTable = (tableId: number) => {
    setStore(current => ({
      ...current,
      tables: current.tables.map(table =>
        table.id === tableId
          ? new RestaurantTable(
              table.id,
              table.number,
              table.seats,
              table.zone,
              table.status,
              table.waiterId,
              table.orderId,
              true,
            )
          : table,
      ),
    }));
  };

  const activateCategory = (categoryId: number) => {
    setStore(current => ({
      ...current,
      categories: current.categories.map(category =>
        category.id === categoryId
          ? new MenuCategory(
              category.id,
              category.name,
              category.description,
              category.displayOrder,
              true,
            )
          : category,
      ),
    }));
  };

  const activateMenuItem = (menuItemId: number) => {
    setStore(current => ({
      ...current,
      menuItems: current.menuItems.map(item =>
        item.id === menuItemId
          ? new MenuItem(
              item.id,
              item.categoryId,
              item.name,
              item.description,
              item.price,
              true,
              item.imageUrl,
            )
          : item,
      ),
    }));
  };

  const activatePaymentMethod = (methodId: number) => {
    setStore(current => ({
      ...current,
      paymentMethods: current.paymentMethods.map(method =>
        method.id === methodId
          ? new PaymentMethod(method.id, method.name, true)
          : method,
      ),
    }));
  };

  const activateWaiter = (waiterId: number) => {
    setStore(current => ({
      ...current,
      waiters: current.waiters.map(waiter =>
        waiter.id === waiterId
          ? new Waiter(
              waiter.id,
              waiter.firstName,
              waiter.lastName,
              waiter.code,
              true,
            )
          : waiter,
      ),
    }));
  };

  const deactivateTable = (tableId: number) => {
    setStore(current => ({
      ...current,
      tables: current.tables.map(table =>
        table.id === tableId ? table.deactivate() : table,
      ),
    }));
  };

  const deactivateCategory = (categoryId: number) => {
    setStore(current => ({
      ...current,
      categories: current.categories.map(category =>
        category.id === categoryId
          ? new MenuCategory(
              category.id,
              category.name,
              category.description,
              category.displayOrder,
              false,
            )
          : category,
      ),
    }));
  };

  const deactivateMenuItem = (menuItemId: number) => {
    setStore(current => ({
      ...current,
      menuItems: current.menuItems.map(item =>
        item.id === menuItemId
          ? new MenuItem(
              item.id,
              item.categoryId,
              item.name,
              item.description,
              item.price,
              false,
              item.imageUrl,
            )
          : item,
      ),
    }));
  };

  const deactivatePaymentMethod = (methodId: number) => {
    setStore(current => ({
      ...current,
      paymentMethods: current.paymentMethods.map(method =>
        method.id === methodId
          ? new PaymentMethod(method.id, method.name, false)
          : method,
      ),
    }));
  };

  const deactivateWaiter = (waiterId: number) => {
    setStore(current => ({
      ...current,
      waiters: current.waiters.map(waiter =>
        waiter.id === waiterId
          ? new Waiter(
              waiter.id,
              waiter.firstName,
              waiter.lastName,
              waiter.code,
              false,
            )
          : waiter,
      ),
    }));
  };

  const releaseSelectedTable = () => {
    syncStore(() => restaurantApi.releaseTable(selectedTable.id));
    setStore(current => ({
      ...current,
      tables: current.tables.map(table =>
        table.id === selectedTable.id ? table.release() : table,
      ),
    }));
    setSelectedItemIds([]);
    setIsTableDetailsOpen(false);
  };

  return (
    <AppShell
      activeTab={activeTab}
      mode={mode}
      apiStatus={apiStatus}
      onChangeMode={changeMode}
      onChangeTab={changeTab}
    >
      {activeTab === 'tables' && (
        <TablesScreen
          tables={activeTables}
          selectedTable={selectedTable}
          selectedOrder={selectedOrder}
          orderItems={selectedOrderItems}
          paymentMethods={activePaymentMethods}
          waiters={activeWaiters}
          paymentMethodId={paymentMethodId}
          selectedItemIds={selectedItemIds}
          isDetailsOpen={isTableDetailsOpen}
          getWaiter={getWaiter}
          getMenuItem={getMenuItem}
          getOrderTotal={getOrderTotal}
          getPaidTotal={getPaidTotal}
          onOpenOrder={openOrder}
          onTogglePaymentItem={togglePaymentItem}
          onChangePaymentMethod={setPaymentMethodId}
          onAssignWaiter={assignWaiterToSelectedTable}
          onPaySelectedItems={paySelectedItems}
          onPayFullBill={payFullBill}
          onReleaseTable={releaseSelectedTable}
          onCloseDetails={() => {
            setIsTableDetailsOpen(false);
            setSelectedItemIds([]);
          }}
          onAddOrderItem={goToOrderItemSelection}
        />
      )}
      {activeTab === 'menu' && (
        <MenuScreen
          categories={activeCategories}
          menuItems={activeMenuItems}
          tables={activeTables}
          selectedCategoryId={selectedCategoryId}
          search={search}
          sourceTableId={menuSourceTableId}
          onSelectCategory={setSelectedCategoryId}
          onChangeSearch={setSearch}
          onAddItem={addItemToOrder}
          onBackToOrder={backToOrderDetails}
        />
      )}
      {activeTab === 'waiters' && (
        <WaitersScreen waiters={store.waiters} tables={store.tables} />
      )}
      {activeTab === 'admin' && (
        <AdminScreen
          tables={store.tables}
          categories={store.categories}
          menuItems={store.menuItems}
          paymentMethods={store.paymentMethods}
          waiters={store.waiters}
          onSaveTable={saveTable}
          onSaveCategory={saveCategory}
          onSaveMenuItem={saveMenuItemFromAdmin}
          onSavePaymentMethod={savePaymentMethod}
          onSaveWaiter={saveWaiter}
          onDeactivateTable={deactivateTable}
          onDeactivateCategory={deactivateCategory}
          onDeactivateMenuItem={deactivateMenuItem}
          onDeactivatePaymentMethod={deactivatePaymentMethod}
          onDeactivateWaiter={deactivateWaiter}
          onActivateTable={activateTable}
          onActivateCategory={activateCategory}
          onActivateMenuItem={activateMenuItem}
          onActivatePaymentMethod={activatePaymentMethod}
          onActivateWaiter={activateWaiter}
        />
      )}
      {activeTab === 'history' && (
        <HistoryScreen
          payments={store.payments}
          orders={store.orders}
          tables={store.tables}
          paymentMethods={store.paymentMethods}
        />
      )}
    </AppShell>
  );
}

export default App;
