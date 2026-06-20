import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  NativeModules,
  Platform,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Order,
  Payment,
  PaymentMethod,
  RestaurantTable,
} from '../../domain/entities';
import { SectionTitle } from '../components/SectionTitle';
import { colors } from '../theme/colors';

const money = (value: number) => `${value.toFixed(2)} zł`;

type InvoiceBuyer = {
  name: string;
  taxId: string;
  address: string;
};

type InvoiceContext = {
  payment: Payment;
  order?: Order;
  table?: RestaurantTable;
  method?: PaymentMethod;
};

const toInvoiceNumber = (payment: Payment) =>
  `FV/${new Date().getFullYear()}/${String(payment.id).padStart(4, '0')}`;

const sanitizePdfText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[()\\]/g, match => `\\${match}`);

const base64Encode = (value: string) => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let index = 0;

  while (index < value.length) {
    const first = value.charCodeAt(index++);
    const second = value.charCodeAt(index++);
    const third = value.charCodeAt(index++);

    const enc1 = Math.floor(first / 4);
    const enc2 =
      (first % 4) * 16 + (Number.isNaN(second) ? 0 : Math.floor(second / 16));
    const enc3 = Number.isNaN(second)
      ? 64
      : (second % 16) * 4 + (Number.isNaN(third) ? 0 : Math.floor(third / 64));
    const enc4 = Number.isNaN(third) ? 64 : third % 64;

    output +=
      chars.charAt(enc1) +
      chars.charAt(enc2) +
      chars.charAt(enc3) +
      chars.charAt(enc4);
  }

  return output;
};

const createInvoicePdfBase64 = (
  { payment, table, method }: InvoiceContext,
  buyer: InvoiceBuyer,
) => {
  const invoiceNumber = toInvoiceNumber(payment);
  const paidAmount = payment.amount + payment.tipAmount;
  const lines = [
    `Faktura ${invoiceNumber}`,
    `Data wystawienia: ${new Date().toLocaleDateString('pl-PL')}`,
    '',
    'Sprzedawca: RestauracjaPOS',
    'Nabywca:',
    buyer.name,
    `NIP: ${buyer.taxId || '-'}`,
    buyer.address,
    '',
    `Platnosc: #${payment.id}`,
    `Stolik: ${table?.number ?? '-'}`,
    `Metoda platnosci: ${method?.name ?? '-'}`,
    `Data platnosci: ${payment.paidAt}`,
    `Kwota: ${money(payment.amount)}`,
    `Napiwek: ${money(payment.tipAmount)}`,
    `Razem: ${money(paidAmount)}`,
  ];
  const contentLines = lines.map((line, index) => {
    const prefix = index === 0 ? 'BT /F1 18 Tf 50 790 Td' : 'T*';
    const font = index === 2 ? '' : ` (${sanitizePdfText(line)}) Tj`;
    return `${prefix}${font}`;
  });
  const stream = `${contentLines.join('\n')}\nET`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];

  objects.forEach(object => {
    offsets.push(pdf.length);
    pdf += object;
  });

  const xrefPosition = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPosition}\n%%EOF`;

  return base64Encode(pdf);
};

const { InvoicePdf } = NativeModules;

export function HistoryScreen({
  payments,
  orders,
  tables,
  paymentMethods,
}: {
  payments: Payment[];
  orders: Order[];
  tables: RestaurantTable[];
  paymentMethods: PaymentMethod[];
}) {
  const [invoiceContext, setInvoiceContext] = useState<InvoiceContext>();
  const [buyer, setBuyer] = useState<InvoiceBuyer>({
    name: '',
    taxId: '',
    address: '',
  });
  const canDownloadInvoice =
    buyer.name.trim().length > 0 && buyer.address.trim().length > 0;
  const modalTitle = useMemo(
    () =>
      invoiceContext
        ? `Dane do faktury ${toInvoiceNumber(invoiceContext.payment)}`
        : 'Dane do faktury',
    [invoiceContext],
  );

  const openInvoiceModal = (context: InvoiceContext) => {
    setInvoiceContext(context);
    setBuyer({ name: '', taxId: '', address: '' });
  };

  const closeInvoiceModal = () => {
    setInvoiceContext(undefined);
    setBuyer({ name: '', taxId: '', address: '' });
  };

  const downloadGeneratedInvoice = async () => {
    if (!invoiceContext || !canDownloadInvoice) {
      Alert.alert('Uzupełnij dane', 'Podaj nazwę i adres nabywcy faktury.');
      return;
    }

    if (Platform.OS !== 'android' || !InvoicePdf?.saveInvoicePdf) {
      Alert.alert(
        'Nie można zapisać PDF',
        'Zapisywanie faktury jest obecnie obsługiwane tylko na Androidzie.',
      );
      return;
    }

    const invoiceNumber = toInvoiceNumber(invoiceContext.payment).replace(
      /[^a-zA-Z0-9_-]/g,
      '_',
    );

    try {
      await InvoicePdf.saveInvoicePdf(
        `${invoiceNumber}.pdf`,
        createInvoicePdfBase64(invoiceContext, buyer),
      );
      closeInvoiceModal();
      Alert.alert('Faktura zapisana', 'PDF został zapisany w folderze Pobrane.');
    } catch (error) {
      Alert.alert(
        'Nie udało się zapisać faktury',
        error instanceof Error ? error.message : 'Spróbuj ponownie później.',
      );
    }
  };

  return (
    <>
      <FlatList
        contentContainerStyle={styles.content}
        data={payments}
        keyExtractor={item => String(item.id)}
        ListHeaderComponent={
          <SectionTitle
            title="Historia płatności"
            subtitle="Płatności całe i za wybrane pozycje rachunku."
          />
        }
        renderItem={({ item }) => {
          const order = orders.find(current => current.id === item.orderId);
          const table = tables.find(current => current.id === order?.tableId);
          const method = paymentMethods.find(
            current => current.id === item.paymentMethodId,
          );

          return (
            <View style={styles.listCard}>
              <Text style={styles.menuName}>
                Płatność #{item.id} • {money(item.amount)}
              </Text>
              <Text style={styles.cardMuted}>
                Stolik {table?.number ?? '-'} • {method?.name} • {item.paidAt}
              </Text>
              <Text style={styles.cardText}>
                Napiwek: {money(item.tipAmount)}
              </Text>
              <View style={styles.invoiceRow}>
                <View style={styles.flexOne}>
                  <Text style={styles.invoiceLabel}>Faktura</Text>
                  <Text style={styles.cardMuted}>
                    Wygeneruj PDF z danych tej płatności
                  </Text>
                </View>
                <Pressable
                  style={styles.invoiceButton}
                  onPress={() =>
                    openInvoiceModal({ payment: item, order, table, method })
                  }
                >
                  <Text style={styles.invoiceButtonText}>Wystaw</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(invoiceContext)}
        onRequestClose={closeInvoiceModal}
      >
        <View style={styles.overlayBackdrop}>
          <View style={styles.invoiceModalWindow}>
            <View style={styles.rowBetween}>
              <View style={styles.flexOne}>
                <Text style={styles.sectionHeading}>{modalTitle}</Text>
                <Text style={styles.cardMuted}>
                  PDF zostanie wygenerowany z kwoty, napiwku, metody płatności i
                  danych nabywcy.
                </Text>
              </View>
              <Pressable
                hitSlop={12}
                style={styles.closeButton}
                onPress={closeInvoiceModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Nazwa nabywcy</Text>
            <TextInput
              style={styles.input}
              value={buyer.name}
              onChangeText={name => setBuyer(current => ({ ...current, name }))}
              placeholder="np. Jan Kowalski / Firma Sp. z o.o."
              placeholderTextColor={colors.muted}
            />

            <Text style={styles.inputLabel}>NIP</Text>
            <TextInput
              style={styles.input}
              value={buyer.taxId}
              onChangeText={taxId =>
                setBuyer(current => ({ ...current, taxId }))
              }
              placeholder="opcjonalnie"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
            />

            <Text style={styles.inputLabel}>Adres nabywcy</Text>
            <TextInput
              multiline
              style={[styles.input, styles.multilineInput]}
              value={buyer.address}
              onChangeText={address =>
                setBuyer(current => ({ ...current, address }))
              }
              placeholder="Ulica, kod pocztowy, miasto"
              placeholderTextColor={colors.muted}
            />

            <Pressable
              disabled={!canDownloadInvoice}
              style={[
                styles.invoiceDownloadButton,
                !canDownloadInvoice && styles.disabledButton,
              ]}
              onPress={downloadGeneratedInvoice}
            >
              <Text style={styles.invoiceButtonText}>
                Pobierz wygenerowany PDF
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 104 },
  listCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 10,
    padding: 14,
  },
  menuName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  cardMuted: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  cardText: { color: '#334e68', fontSize: 14, marginTop: 8 },
  flexOne: { flex: 1 },
  invoiceRow: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 12,
  },
  invoiceLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
  invoiceButton: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  invoiceButtonText: { color: '#fff', fontWeight: '900' },
  overlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  invoiceModalWindow: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
    width: '100%',
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  sectionHeading: { color: colors.text, fontSize: 20, fontWeight: '800' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#edf2f7',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  closeButtonText: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 38,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    fontWeight: '700',
    marginTop: 6,
    padding: 12,
  },
  multilineInput: { minHeight: 76, textAlignVertical: 'top' },
  invoiceDownloadButton: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  disabledButton: { backgroundColor: '#9fb3c8' },
});
