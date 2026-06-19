import React, { useState } from 'react';
import { createSeedRestaurantStore } from './src/data/seedRestaurantStore';
import {
  MenuItem,
  Order,
  OrderItem,
  Payment,
  RestaurantTable,
} from './src/domain/entities';
import {
  OrderItemStatus,
  OrderStatus,
  TableStatus,
} from './src/domain/enums/RestaurantEnums';
import { RestaurantStore } from './src/domain/repositories/RestaurantStore';
import { AppShell, AppTab } from './src/ui/layout/AppShell';
import { HistoryScreen } from './src/ui/screens/HistoryScreen';
import { MenuScreen } from './src/ui/screens/MenuScreen';
import { TablesScreen } from './src/ui/screens/TablesScreen';
import { WaitersScreen } from './src/ui/screens/WaitersScreen';

const initialStore = createSeedRestaurantStore();

function App(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<AppTab>('tables');
  const [store, setStore] = useState<RestaurantStore>(initialStore);
  const [selectedTableId, setSelectedTableId] = useState(2);
  const [selectedCategoryId, setSelectedCategoryId] = useState(1);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState(1);
  const [search, setSearch] = useState('');
  const [isTableDetailsOpen, setIsTableDetailsOpen] = useState(false);
  const [menuSourceTableId, setMenuSourceTableId] = useState<number>();

  const selectedTable =
    store.tables.find(table => table.id === selectedTableId) ?? store.tables[0];
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

  const changeTab = (tab: AppTab) => {
    if (tab === 'menu') {
      setMenuSourceTableId(undefined);
    }
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

  const paySelectedItems = () => {
    if (!selectedOrder || selectedItemIds.length === 0) {
      return;
    }

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
        0,
        'teraz',
      );
      const paidIds = itemsToPay.map(item => item.id);

      return updateOrderPaymentState(current, selectedOrder, paidIds, payment);
    });
    setSelectedItemIds([]);
  };

  const payFullBill = () => {
    if (!selectedOrder) {
      return;
    }

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
        0,
        'teraz',
      );
      const paidIds = itemsToPay.map(item => item.id);

      return updateOrderPaymentState(current, selectedOrder, paidIds, payment);
    });
    setSelectedItemIds([]);
  };

  const releaseSelectedTable = () => {
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
    <AppShell activeTab={activeTab} onChangeTab={changeTab}>
      {activeTab === 'tables' && (
        <TablesScreen
          tables={store.tables}
          selectedTable={selectedTable}
          selectedOrder={selectedOrder}
          orderItems={selectedOrderItems}
          paymentMethods={store.paymentMethods}
          waiters={store.waiters}
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
          categories={store.categories}
          menuItems={store.menuItems}
          tables={store.tables}
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
