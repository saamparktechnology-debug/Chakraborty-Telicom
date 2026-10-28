import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useRetailerPassbook } from "./hooks/useRetailerPassbook";
import { exportAndShareHtmlPdf } from "../../lib/pdf-export";
import { RetailerOrderItemSummary } from "./types/retailer.types";

export default function RetailerFeatureScreen() {
  const theme = useAuthStore((s) => s.theme);
  const apiBaseUrl = useAuthStore((s) => s.apiBaseUrl);
  const isDark = theme === "dark";

  const {
    user,
    activeTab,
    setActiveTab,
    passbook,
    currentDue,
    orders,
    ledger,
    products,
    loading,
    error,
    refresh,
  } = useRetailerPassbook();

  const backendOrigin = apiBaseUrl.replace(/\/api\/?$/, "");

  const resolveImageUrl = (relPath?: string | null) => {
    if (!relPath) return null;
    if (relPath.startsWith("http://") || relPath.startsWith("https://"))
      return relPath;
    return `${backendOrigin}${relPath.startsWith("/") ? "" : "/"}${relPath}`;
  };

  const handleExportPassbookPdf = async () => {
    const shopTitle =
      passbook?.shopName || user?.shopName || user?.name || "Retailer Shop";
    const rowsHtml = ledger
      .map(
        (l) => `
        <tr>
          <td>${l.createdAt.slice(0, 10)}</td>
          <td>${l.entryType}</td>
          <td>${l.referenceId || "-"}</td>
          <td>${l.notes || "-"}</td>
          <td style="text-align:right;font-weight:bold;">₹${l.amount.toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <h2>AMUL PARTY — B2B RETAILER KHATA PASSBOOK</h2>
          <p><strong>Shop:</strong> ${shopTitle} (${user?.phone || ""})</p>
          <p><strong>Current Running Khata Due:</strong> ₹${currentDue.toFixed(2)}</p>
          <table border="1" cellspacing="0" cellpadding="8" width="100%" style="border-collapse:collapse;font-size:12px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th>Date</th>
                <th>Entry Type</th>
                <th>Reference</th>
                <th>Details</th>
                <th>Amount (INR)</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `;
    await exportAndShareHtmlPdf(
      html,
      `Khata_Passbook_${shopTitle.replace(/\s+/g, "_")}.pdf`,
    );
  };

  const handleExportOrderInvoicePdf = async (
    order: RetailerOrderItemSummary,
  ) => {
    const shopTitle =
      passbook?.shopName || user?.shopName || user?.name || "Retailer Shop";
    const itemsHtml = order.items
      .map(
        (i) => `
        <tr>
          <td>${i.productName}</td>
          <td style="text-align:center;">${i.deliveredQty || i.indentedQty}</td>
          <td style="text-align:right;">₹${i.unitPrice.toFixed(2)}</td>
          <td style="text-align:right;">${order.isGstBill ? `${i.gstPercentage}%` : "0%"}</td>
          <td style="text-align:right;font-weight:bold;">₹${i.lineTotal.toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <h2>AMUL PARTY — ${order.isGstBill ? "TAX INVOICE (GST INCL.)" : "BILL OF SUPPLY (NON-GST)"}</h2>
          <p><strong>Invoice #:</strong> ${order.invoiceNumber} | <strong>Date:</strong> ${order.deliveryDate}</p>
          <p><strong>Retailer:</strong> ${shopTitle}</p>
          <table border="1" cellspacing="0" cellpadding="8" width="100%" style="border-collapse:collapse;font-size:12px;margin-top:12px;">
            <thead>
              <tr style="background:#f1f5f9;">
                <th>Product</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>GST</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:16px;font-size:13px;">
            <p>Previous Running Due: <strong>₹${order.previousDueSnapshot.toFixed(2)}</strong></p>
            ${
              order.isGstBill
                ? `<p>Taxable Base: ₹${order.taxableSubtotal.toFixed(2)} + Single GST: ₹${order.gstAmount.toFixed(2)} = <strong>₹${order.subtotal.toFixed(2)}</strong></p>`
                : `<p>Today's Bill Subtotal: <strong>₹${order.subtotal.toFixed(2)}</strong></p>`
            }
            <p>Total Payable: <strong>₹${order.totalPayable.toFixed(2)}</strong></p>
            <p>Paid via UPI: ₹${order.paidUpi.toFixed(2)} | Paid via Cash: ₹${order.paidCash.toFixed(2)}</p>
            <p style="font-size:15px;color:#e11d48;"><strong>Closing Due Carried Forward: ₹${order.closingDue.toFixed(2)}</strong></p>
          </div>
        </body>
      </html>
    `;
    await exportAndShareHtmlPdf(html, `${order.invoiceNumber}.pdf`);
  };

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "#334155" : "#E2E8F0";

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}
      edges={["top", "left", "right"]}
    >
      <AppHeader
        roleBadge="RETAILER PORTAL"
        subtitle={`${user?.name || "Retailer"} • B2B Khata & Invoices`}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} />
          }
        >
          {/* Hero Running Khata Due Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.heroLabel}>CURRENT RUNNING KHATA DUE</Text>
                <Text style={styles.heroAmount}>₹{currentDue.toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                onPress={handleExportPassbookPdf}
                style={styles.exportPdfBtn}
              >
                <Text style={styles.exportPdfBtnText}>📄 Export PDF</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.heroFormula}>
              Formula: Previous Due + Today&apos;s Bill − (UPI + Cash Paid)
            </Text>
          </View>

          {/* 3 Pill Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              onPress={() => setActiveTab("PASSBOOK")}
              style={[
                styles.tabBtn,
                activeTab === "PASSBOOK"
                  ? styles.tabBtnActive
                  : {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                    },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === "PASSBOOK" ? "#FFFFFF" : textPrimary },
                ]}
              >
                Khata Passbook
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("ORDERS")}
              style={[
                styles.tabBtn,
                activeTab === "ORDERS"
                  ? styles.tabBtnActive
                  : {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                    },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: activeTab === "ORDERS" ? "#FFFFFF" : textPrimary },
                ]}
              >
                Orders ({orders.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("PRICE_LIST")}
              style={[
                styles.tabBtn,
                activeTab === "PRICE_LIST"
                  ? styles.tabBtnActive
                  : {
                      backgroundColor: cardBg,
                      borderColor: borderCol,
                      borderWidth: 1,
                    },
              ]}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: activeTab === "PRICE_LIST" ? "#FFFFFF" : textPrimary,
                  },
                ]}
              >
                Price List ({products.length})
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {loading ? (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: cardBg,
                  borderColor: borderCol,
                  alignItems: "center",
                  paddingVertical: 28,
                },
              ]}
            >
              <ActivityIndicator color="#E11D48" />
              <Text
                style={{ color: textSecondary, fontSize: 12, marginTop: 8 }}
              >
                Loading Khata passbook, invoices & Amul price palette...
              </Text>
            </View>
          ) : null}

          {/* TAB 1: KHATA PASSBOOK */}
          {!loading && activeTab === "PASSBOOK" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Chronological Khata Ledger
              </Text>
              {ledger.length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No Khata ledger transactions recorded for this shop yet.
                </Text>
              ) : (
                ledger.map((entry) => {
                  const isDebit = entry.entryType === "INVOICE_DEBIT";
                  return (
                    <View
                      key={entry.id}
                      style={[
                        styles.ledgerRow,
                        { borderBottomColor: borderCol },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: isDebit ? "#E11D48" : "#059669",
                          }}
                        >
                          {entry.entryType}{" "}
                          {entry.referenceId ? `• ${entry.referenceId}` : ""}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: "700",
                            color: textPrimary,
                            marginTop: 2,
                          }}
                        >
                          {entry.notes || "Khata transaction"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {entry.createdAt.slice(0, 10)} • By{" "}
                          {entry.recordedByName}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "900",
                          color: isDebit ? "#E11D48" : "#059669",
                        }}
                      >
                        {isDebit ? "+" : "−"}₹{entry.amount.toFixed(2)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 2: ORDERS & DELIVERED INVOICES */}
          {!loading && activeTab === "ORDERS" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Indents & Delivered Invoices
              </Text>
              {orders.length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No orders or invoices found for this shop yet.
                </Text>
              ) : (
                orders.map((ord) => (
                  <View
                    key={ord.id}
                    style={[
                      styles.orderCard,
                      {
                        borderColor: borderCol,
                        backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                      },
                    ]}
                  >
                    <View style={styles.orderHeaderRow}>
                      <View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "900",
                            color: "#4F46E5",
                          }}
                        >
                          {ord.invoiceNumber}
                        </Text>
                        <Text style={{ fontSize: 11, color: textSecondary }}>
                          Date: {ord.deliveryDate} •{" "}
                          {ord.isGstBill
                            ? "GST Invoice (Incl.)"
                            : "Non-GST Bill"}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          ord.status === "DELIVERED"
                            ? { backgroundColor: "#DCFCE7" }
                            : { backgroundColor: "#FEF3C7" },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color:
                              ord.status === "DELIVERED"
                                ? "#166534"
                                : "#92400E",
                          }}
                        >
                          {ord.status}
                        </Text>
                      </View>
                    </View>

                    {ord.items.map((item) => (
                      <View key={item.productId} style={styles.orderItemLine}>
                        <Text
                          style={{ fontSize: 12, color: textPrimary, flex: 1 }}
                        >
                          {item.productName} ×{" "}
                          {ord.status === "DELIVERED"
                            ? item.deliveredQty
                            : item.indentedQty}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: textPrimary,
                          }}
                        >
                          ₹{item.lineTotal.toFixed(2)}
                        </Text>
                      </View>
                    ))}

                    {ord.status === "DELIVERED" && (
                      <View
                        style={[
                          styles.orderFooter,
                          { borderTopColor: borderCol },
                        ]}
                      >
                        <View>
                          <Text style={{ fontSize: 11, color: textSecondary }}>
                            Bill: ₹{ord.subtotal.toFixed(2)} | Paid: ₹
                            {(ord.paidUpi + ord.paidCash).toFixed(2)}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "800",
                              color: "#E11D48",
                              marginTop: 2,
                            }}
                          >
                            Closing Due: ₹{ord.closingDue.toFixed(2)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleExportOrderInvoicePdf(ord)}
                          style={styles.pdfSmallBtn}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            📄 Invoice PDF
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: AMUL WHOLESALE PRICE PALETTE WITH PICTURES & GST */}
          {!loading && activeTab === "PRICE_LIST" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Official Amul Wholesale Price Palette
              </Text>
              {products.length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No products available in the palette right now.
                </Text>
              ) : (
                products.map((p) => {
                  const imgUri = resolveImageUrl(p.imageFrontUrl || p.imageUrl);
                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.priceRow,
                        { borderBottomColor: borderCol },
                      ]}
                    >
                      <View style={styles.prodLeftRow}>
                        <View
                          style={[styles.thumbBox, { borderColor: borderCol }]}
                        >
                          {imgUri ? (
                            <Image
                              source={{ uri: imgUri }}
                              style={styles.thumbImg}
                              resizeMode="contain"
                            />
                          ) : (
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "800",
                                color: "#4F46E5",
                              }}
                            >
                              {p.category.slice(0, 4).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[styles.prodTitle, { color: textPrimary }]}
                          >
                            {p.name}
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: textSecondary,
                              marginTop: 2,
                            }}
                          >
                            SKU: {p.skuCode} • {p.unitType} • {p.unitsPerCrate}{" "}
                            units/crate
                          </Text>
                          <Text
                            style={{
                              fontSize: 10.5,
                              fontWeight: "700",
                              color: "#4F46E5",
                              marginTop: 2,
                            }}
                          >
                            GST: {p.gstPercentage}% (Incl.)
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.wholesalePrice}>
                          ₹{p.retailerPrice.toFixed(2)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: textSecondary,
                            marginTop: 2,
                          }}
                        >
                          MRP: ₹{p.mrp.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardAvoid: {
    flex: 1,
  },
  scrollBody: {
    padding: 14,
    paddingBottom: Platform.OS === "ios" ? 120 : 80,
  },
  heroCard: {
    backgroundColor: "#E11D48",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: {
    color: "#FFE4E6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroAmount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 4,
  },
  heroFormula: {
    color: "#FECDD3",
    fontSize: 11,
    marginTop: 10,
  },
  exportPdfBtn: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
  },
  exportPdfBtnText: {
    color: "#E11D48",
    fontSize: 12,
    fontWeight: "800",
  },
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#E11D48",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  orderCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  orderHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderItemLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
  },
  pdfSmallBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  prodLeftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 8,
  },
  thumbBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbImg: {
    width: "100%",
    height: "100%",
  },
  prodTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  wholesalePrice: {
    fontSize: 15,
    fontWeight: "900",
    color: "#059669",
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "700",
  },
});
