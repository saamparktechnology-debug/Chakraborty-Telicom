import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/AppHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useCustomerSubscription } from "./hooks/useCustomerSubscription";
import { exportAndShareHtmlPdf } from "../../lib/pdf-export";
import { CustomerMonthlyBillItem } from "./types/customer.types";

export default function CustomerFeatureScreen() {
  const theme = useAuthStore((s) => s.theme);
  const isDark = theme === "dark";

  const {
    user,
    activeTab,
    setActiveTab,
    walletBalance,
    subscriptions,
    skippedDates,
    deliveries,
    bills,
    ledger,
    upcomingDates,
    loading,
    togglingDate,
    error,
    feedback,
    refresh,
    handleToggleSkipDate,
  } = useCustomerSubscription();

  const activeSub = subscriptions[0] || null;

  const handleDownloadBillPdf = async (bill: CustomerMonthlyBillItem) => {
    const html = `
      <html>
        <body style="font-family: sans-serif; padding: 24px;">
          <h2>AMUL PARTY — HOUSEHOLD MILK SUBSCRIPTION STATEMENT</h2>
          <p><strong>Statement #:</strong> ${bill.billNumber} (${bill.isGstBill ? "GST Inclusive" : "Non-GST"})</p>
          <p><strong>Customer:</strong> ${user?.name || ""} (${user?.phone || ""})</p>
          <p><strong>Period:</strong> ${bill.periodStart} to ${bill.periodEnd}</p>
          <hr/>
          ${
            bill.isGstBill
              ? `<p>Taxable Base Amount: ₹${bill.taxableAmount.toFixed(2)} + Single GST: ₹${bill.gstAmount.toFixed(2)}</p>`
              : ""
          }
          <p>Total Milk Deliveries Deducted: <strong>₹${bill.deliveriesAmount.toFixed(2)}</strong></p>
          <p>Total Prepaid Wallet Top-Ups: <strong>₹${bill.topupsAmount.toFixed(2)}</strong></p>
          <p style="font-size:15px;color:#059669;"><strong>Closing Prepaid Wallet Balance: ₹${bill.closingBalance.toFixed(2)}</strong></p>
        </body>
      </html>
    `;
    await exportAndShareHtmlPdf(html, `${bill.billNumber}.pdf`);
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
        roleBadge="CUSTOMER PORTAL"
        subtitle={`${user?.name || "Customer"} • Prepaid Milk Wallet & Skip Calendar`}
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
          {/* Prepaid Wallet Hero Card */}
          <View style={styles.walletCard}>
            <View style={styles.walletHeaderRow}>
              <Text style={styles.walletLabel}>
                PREPAID MILK WALLET BALANCE
              </Text>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>
                  {activeSub ? "ACTIVE DAILY DROP" : "NO ACTIVE PLAN"}
                </Text>
              </View>
            </View>
            <Text style={styles.walletAmount}>₹{walletBalance.toFixed(2)}</Text>
            {activeSub ? (
              <Text style={styles.walletSubText}>
                Daily Plan: {activeSub.productName} × {activeSub.dailyQty}{" "}
                pouches/day (₹
                {(activeSub.customerPrice * activeSub.dailyQty).toFixed(2)}/day)
              </Text>
            ) : (
              <Text style={styles.walletSubText}>
                Contact Amul Admin or your DSE to activate a daily milk pouch
                subscription.
              </Text>
            )}
          </View>

          {/* 4 Navigation Tabs */}
          <View style={styles.tabRow}>
            {(
              [
                ["CALENDAR", "Skip Calendar"],
                ["DELIVERIES", `Drops (${deliveries.length})`],
                ["BILLS", `Bills (${bills.length})`],
                ["PASSBOOK", "Wallet Log"],
              ] as const
            ).map(([key, label]) => {
              const active = activeTab === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setActiveTab(key)}
                  style={[
                    styles.tabBtn,
                    active
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
                      { color: active ? "#FFFFFF" : textPrimary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {feedback ? (
            <View style={styles.feedbackBanner}>
              <Text style={styles.feedbackText}>{feedback}</Text>
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
              <ActivityIndicator color="#4F46E5" />
              <Text
                style={{ color: textSecondary, fontSize: 12, marginTop: 8 }}
              >
                Loading prepaid wallet & subscription schedule...
              </Text>
            </View>
          ) : null}

          {/* TAB 1: 14-DAY "SKIP — NOT NEEDED" CALENDAR */}
          {!loading && activeTab === "CALENDAR" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                14-Day &ldquo;Skip — Not Needed&rdquo; Calendar
              </Text>
              <Text
                style={{ fontSize: 12, color: textSecondary, marginBottom: 12 }}
              >
                Tap any upcoming date below to mark &ldquo;Not Needed&rdquo;.
                Skipped dates are automatically excluded from the morning
                loading sheet and your wallet is not charged.
              </Text>

              <View style={styles.calendarGrid}>
                {upcomingDates.map((dateStr) => {
                  const isSkipped = skippedDates.includes(dateStr);
                  const busy = togglingDate === dateStr;
                  return (
                    <TouchableOpacity
                      key={dateStr}
                      disabled={busy}
                      onPress={() => handleToggleSkipDate(dateStr)}
                      style={[
                        styles.dateCell,
                        isSkipped
                          ? styles.dateCellSkipped
                          : {
                              backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
                              borderColor: borderCol,
                            },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: isSkipped ? "#B91C1C" : textPrimary,
                        }}
                      >
                        {dateStr.slice(5)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          marginTop: 3,
                          color: isSkipped ? "#DC2626" : "#059669",
                        }}
                      >
                        {busy ? "..." : isSkipped ? "SKIPPED" : "Scheduled"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* TAB 2: DAILY MILK DELIVERIES */}
          {!loading && activeTab === "DELIVERIES" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Confirmed Daily Milk Drops
              </Text>
              {deliveries.length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No daily milk deliveries recorded yet.
                </Text>
              ) : (
                deliveries.map((d) => (
                  <View
                    key={d.id}
                    style={[styles.rowItem, { borderBottomColor: borderCol }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: textPrimary,
                        }}
                      >
                        {d.productName} × {d.deliveredQty} pouches
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {d.deliveryDate} •{" "}
                        {d.isGstBill
                          ? `GST ${d.gstPercentage}% (Incl.)`
                          : "Non-GST"}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text
                        style={{
                          fontSize: 13.5,
                          fontWeight: "900",
                          color: "#E11D48",
                        }}
                      >
                        −₹{d.deductedAmount.toFixed(2)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 10.5,
                          color: textSecondary,
                          marginTop: 2,
                        }}
                      >
                        Bal: ₹{d.walletBalanceAfter.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: MONTHLY / PERIODIC STATEMENTS SENT BY ADMIN */}
          {!loading && activeTab === "BILLS" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Periodic Statements Sent by Admin
              </Text>
              {bills.length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No periodic statements generated yet.
                </Text>
              ) : (
                bills.map((b) => (
                  <View
                    key={b.id}
                    style={[styles.rowItem, { borderBottomColor: borderCol }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "900",
                          color: "#4F46E5",
                        }}
                      >
                        {b.billNumber}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: textSecondary,
                          marginTop: 2,
                        }}
                      >
                        {b.periodStart} to {b.periodEnd}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11.5,
                          color: textPrimary,
                          marginTop: 2,
                        }}
                      >
                        Deliveries: ₹{b.deliveriesAmount.toFixed(2)} | Top-Ups:
                        ₹{b.topupsAmount.toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDownloadBillPdf(b)}
                      style={styles.pdfBtn}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        📄 PDF
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 4: WALLET PASSBOOK LOG */}
          {!loading && activeTab === "PASSBOOK" && (
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: borderCol },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textPrimary }]}>
                Prepaid Wallet Passbook
              </Text>
              {ledger.length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: 13,
                    paddingVertical: 12,
                  }}
                >
                  No wallet transactions recorded yet.
                </Text>
              ) : (
                ledger.map((l) => {
                  const isCredit = l.entryType === "WALLET_TOPUP_CREDIT";
                  return (
                    <View
                      key={l.id}
                      style={[styles.rowItem, { borderBottomColor: borderCol }]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "800",
                            color: isCredit ? "#059669" : "#E11D48",
                          }}
                        >
                          {l.entryType}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: "700",
                            color: textPrimary,
                            marginTop: 2,
                          }}
                        >
                          {l.notes || "Wallet transaction"}
                        </Text>
                        <Text
                          style={{
                            fontSize: 10.5,
                            color: textSecondary,
                            marginTop: 2,
                          }}
                        >
                          {l.createdAt.slice(0, 10)}
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "900",
                          color: isCredit ? "#059669" : "#E11D48",
                        }}
                      >
                        {isCredit ? "+" : "−"}₹{l.amount.toFixed(2)}
                      </Text>
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
  walletCard: {
    backgroundColor: "#312E81",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  walletHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  walletLabel: {
    color: "#C7D2FE",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: "#6EE7B7",
    fontSize: 9.5,
    fontWeight: "800",
  },
  walletAmount: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 6,
  },
  walletSubText: {
    color: "#E0E7FF",
    fontSize: 12,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "#4F46E5",
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    marginBottom: 8,
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  dateCell: {
    width: "31%",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  dateCellSkipped: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pdfBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
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
  feedbackBanner: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  feedbackText: {
    color: "#047857",
    fontSize: 12,
    fontWeight: "800",
  },
});
