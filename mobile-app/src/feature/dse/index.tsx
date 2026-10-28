import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { AppHeader } from "../../components/AppHeader";
import { useAuthStore } from "../../store/useAuthStore";
import { useDseWorkspace } from "./hooks/useDseWorkspace";
import { DseActiveTab } from "./types/dse.types";

export default function DseFeatureScreen() {
  const theme = useAuthStore((s) => s.theme);
  const isDark = theme === "dark";

  const {
    activeTab,
    setActiveTab,
    products,
    vehicleStockMap,
    retailers,
    customers,
    orders,
    loading,
    submitting,
    error,
    feedback,
    refresh,
    submitIndent,
    submitInstantBill,
    submitSpotBill,
    submitCollectDue,
    submitCustomerDrop,
    submitOnboardParty,
  } = useDseWorkspace();

  // Sub-mode inside BILLING tab
  const [billMode, setBillMode] = useState<
    "SETTLE_INDENT" | "SPOT_BILL" | "COLLECT_DUE"
  >("SPOT_BILL");
  const [isGstBill, setIsGstBill] = useState<boolean>(true);
  const [customerDropGst, setCustomerDropGst] = useState<boolean>(false);

  // Selected Retailer / Order state
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [cratesMap, setCratesMap] = useState<Record<string, string>>({});
  const [looseMap, setLooseMap] = useState<Record<string, string>>({});
  const [paidUpi, setPaidUpi] = useState<string>("0");
  const [paidCash, setPaidCash] = useState<string>("0");
  const [billNotes, setBillNotes] = useState<string>("");

  // Next-day Indent Date
  const [indentDate, setIndentDate] = useState(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().slice(0, 10);
  });

  // Onboarding state
  const [onboardRole, setOnboardRole] = useState<"RETAILER" | "CUSTOMER">(
    "RETAILER",
  );
  const [partyName, setPartyName] = useState("");
  const [partyShop, setPartyShop] = useState("");
  const [partyPhone, setPartyPhone] = useState("");
  const [partyAddress, setPartyAddress] = useState("");
  const [subProductId, setSubProductId] = useState("");
  const [subDailyQty, setSubDailyQty] = useState("2");

  const activeRetailer = useMemo(() => {
    return (
      retailers.find((r) => r.id === selectedRetailerId) || retailers[0] || null
    );
  }, [retailers, selectedRetailerId]);

  const pendingIndents = useMemo(
    () => orders.filter((o) => o.status === "INDENTED"),
    [orders],
  );

  const activeIndentOrder = useMemo(() => {
    return (
      pendingIndents.find((o) => o.id === selectedOrderId) ||
      pendingIndents[0] ||
      null
    );
  }, [pendingIndents, selectedOrderId]);

  const getAvailableVehicleUnits = (productId: string): number => {
    return vehicleStockMap[productId]?.liveQty ?? 0;
  };

  const formatStockBadge = (productId: string, unitsPerCrate: number) => {
    const row = vehicleStockMap[productId];
    const qty = row ? row.liveQty : 0;
    const c = Math.floor(qty / Math.max(1, unitsPerCrate));
    const l = qty % Math.max(1, unitsPerCrate);
    return `${qty} units (${c}C + ${l}L)`;
  };

  // Spot Bill / Indent Live Calculation
  const spotCalculation = useMemo(() => {
    let enteredTotal = 0;
    let taxableTotal = 0;
    let gstTotal = 0;

    for (const p of products) {
      const c = parseInt(cratesMap[p.id] || "0", 10) || 0;
      const l = parseInt(looseMap[p.id] || "0", 10) || 0;
      const units = c * p.unitsPerCrate + l;
      if (units <= 0) continue;

      const lineAmt = units * p.retailerPrice;
      enteredTotal += lineAmt;

      if (isGstBill && p.gstPercentage > 0) {
        const lineTaxable = (lineAmt * 100) / (100 + p.gstPercentage);
        const lineGst = lineAmt - lineTaxable;
        taxableTotal += lineTaxable;
        gstTotal += lineGst;
      } else {
        taxableTotal += lineAmt;
      }
    }

    const prevDue = activeRetailer?.currentRunningDue || 0;
    const upi = parseFloat(paidUpi || "0") || 0;
    const cash = parseFloat(paidCash || "0") || 0;
    const closingDue = prevDue + enteredTotal - (upi + cash);

    return {
      prevDue,
      enteredTotal,
      taxableTotal,
      gstTotal,
      closingDue,
    };
  }, [
    products,
    cratesMap,
    looseMap,
    isGstBill,
    activeRetailer,
    paidUpi,
    paidCash,
  ]);

  const resetInputs = () => {
    setCratesMap({});
    setLooseMap({});
    setPaidUpi("0");
    setPaidCash("0");
    setBillNotes("");
  };

  const handleSpotBillSubmit = async () => {
    if (!activeRetailer) return;
    const deliveredItems = products.map((p) => ({
      productId: p.id,
      cratesQty: parseInt(cratesMap[p.id] || "0", 10) || 0,
      looseUnitsQty: parseInt(looseMap[p.id] || "0", 10) || 0,
      unitsPerCrate: p.unitsPerCrate,
    }));
    const ok = await submitSpotBill({
      retailerId: activeRetailer.id,
      isGstBill,
      deliveredItems,
      paidUpi: parseFloat(paidUpi || "0") || 0,
      paidCash: parseFloat(paidCash || "0") || 0,
      notes: billNotes || undefined,
    });
    if (ok) resetInputs();
  };

  const handleSettleIndentSubmit = async () => {
    if (!activeIndentOrder) return;
    const deliveredItems = activeIndentOrder.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId);
      const upc = prod?.unitsPerCrate || 24;
      const hasCustom =
        cratesMap[item.productId] !== undefined ||
        looseMap[item.productId] !== undefined;
      const totalUnits = hasCustom
        ? (parseInt(cratesMap[item.productId] || "0", 10) || 0) * upc +
          (parseInt(looseMap[item.productId] || "0", 10) || 0)
        : item.indentedQty;
      return {
        productId: item.productId,
        cratesQty: 0,
        looseUnitsQty: totalUnits,
        totalUnits,
      };
    });

    const ok = await submitInstantBill({
      orderId: activeIndentOrder.id,
      isGstBill,
      deliveredItems,
      paidUpi: parseFloat(paidUpi || "0") || 0,
      paidCash: parseFloat(paidCash || "0") || 0,
      notes: billNotes || undefined,
    });
    if (ok) resetInputs();
  };

  const handleCreateIndentSubmit = async () => {
    if (!activeRetailer) return;
    const items = products.map((p) => ({
      productId: p.id,
      cratesQty: parseInt(cratesMap[p.id] || "0", 10) || 0,
      looseUnitsQty: parseInt(looseMap[p.id] || "0", 10) || 0,
      unitsPerCrate: p.unitsPerCrate,
    }));
    const ok = await submitIndent({
      retailerId: activeRetailer.id,
      deliveryDate: indentDate,
      items,
    });
    if (ok) resetInputs();
  };

  const cardBg = isDark ? "#1E293B" : "#FFFFFF";
  const textPrimary = isDark ? "#F8FAFC" : "#0F172A";
  const textSecondary = isDark ? "#94A3B8" : "#64748B";
  const borderCol = isDark ? "#334155" : "#E2E8F0";
  const inputBg = isDark ? "#0F172A" : "#F8FAFC";

  const TABS: Array<{ key: DseActiveTab; label: string }> = [
    { key: "BILLING", label: "⚡ Instant Bill & Due" },
    { key: "DROPS", label: "🥛 B2C Milk Drop" },
    { key: "INDENT", label: "📦 Next-Day Indent" },
    { key: "BEAT", label: "🚚 My Vehicle Stock" },
    { key: "ONBOARD", label: "＋ Onboard Party" },
  ];

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isDark ? "#0F172A" : "#F8FAFC" }]}
      edges={["top", "left", "right"]}
    >
      <AppHeader
        roleBadge="DSE PORTAL"
        subtitle="DSE Field Beat, Vehicle Stock & Instant Billing"
      />

      {/* Horizontal Top Pill Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[
                  styles.tabPill,
                  active
                    ? styles.tabPillActive
                    : {
                        backgroundColor: cardBg,
                        borderColor: borderCol,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: active ? "#FFFFFF" : textPrimary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAwareScrollView
        style={styles.keyboardScroll}
        contentContainerStyle={styles.scrollBody}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraHeight={180}
        extraScrollHeight={120}
        keyboardOpeningTime={250}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
      >
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

        {/* TAB 1: INSTANT BILLING, SPOT BILL & DUE COLLECTION */}
        {activeTab === "BILLING" && (
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            {/* Sub-mode switcher */}
            <View style={styles.subModeRow}>
              {(
                [
                  ["SETTLE_INDENT", "Settle Indent"],
                  ["SPOT_BILL", "Spot Delivery Bill"],
                  ["COLLECT_DUE", "Collect Old Due"],
                ] as const
              ).map(([key, label]) => {
                const active = billMode === key;
                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => setBillMode(key)}
                    style={[
                      styles.subModeBtn,
                      active
                        ? { backgroundColor: "#E11D48" }
                        : { backgroundColor: inputBg },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: active ? "#FFFFFF" : textSecondary,
                      }}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* GST vs Non-GST Billing Mode Toggle */}
            {billMode !== "COLLECT_DUE" && (
              <View
                style={[
                  styles.gstToggleBox,
                  { backgroundColor: inputBg, borderColor: borderCol },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "800",
                    color: textPrimary,
                  }}
                >
                  Billing Mode:
                </Text>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setIsGstBill(true)}
                    style={[
                      styles.gstPill,
                      isGstBill && { backgroundColor: "#4F46E5" },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: isGstBill ? "#FFFFFF" : textSecondary,
                      }}
                    >
                      GST Bill (Incl.)
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setIsGstBill(false)}
                    style={[
                      styles.gstPill,
                      !isGstBill && { backgroundColor: "#059669" },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "800",
                        color: !isGstBill ? "#FFFFFF" : textSecondary,
                      }}
                    >
                      Non-GST Bill
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Retailer Selector */}
            {billMode !== "SETTLE_INDENT" && (
              <>
                <Text style={[styles.sectionLabel, { color: textPrimary }]}>
                  Select Retailer Shop
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 14 }}
                >
                  {retailers.map((r) => {
                    const selected = activeRetailer?.id === r.id;
                    return (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setSelectedRetailerId(r.id)}
                        style={[
                          styles.shopChip,
                          selected
                            ? {
                                backgroundColor: "#E11D48",
                                borderColor: "#E11D48",
                              }
                            : {
                                backgroundColor: inputBg,
                                borderColor: borderCol,
                              },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12.5,
                            fontWeight: "800",
                            color: selected ? "#FFFFFF" : textPrimary,
                          }}
                        >
                          {r.shopName} (Due: ₹{r.currentRunningDue.toFixed(0)})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* MODE A: SPOT DELIVERY BILL */}
            {billMode === "SPOT_BILL" && (
              <>
                {products.map((p) => {
                  const availUnits = getAvailableVehicleUnits(p.id);
                  const enteredCrates =
                    parseInt(cratesMap[p.id] || "0", 10) || 0;
                  const enteredLoose = parseInt(looseMap[p.id] || "0", 10) || 0;
                  const requestedUnits =
                    enteredCrates * p.unitsPerCrate + enteredLoose;
                  const exceedsStock = requestedUnits > availUnits;

                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.productRow,
                        { borderBottomColor: borderCol },
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.prodName, { color: textPrimary }]}>
                          {p.name}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11.5,
                            color: textSecondary,
                            marginTop: 2,
                          }}
                        >
                          ₹{p.retailerPrice.toFixed(2)}/{p.unitType} |{" "}
                          {p.unitsPerCrate}/crate
                          {isGstBill && p.gstPercentage > 0
                            ? ` • GST ${p.gstPercentage}%`
                            : ""}
                        </Text>

                        <View
                          style={[
                            styles.stockBadge,
                            availUnits > 0 && !exceedsStock
                              ? styles.stockBadgeOk
                              : styles.stockBadgeLow,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockBadgeText,
                              availUnits > 0 && !exceedsStock
                                ? { color: "#047857" }
                                : { color: "#B91C1C" },
                            ]}
                          >
                            🚚 Vehicle Stock:{" "}
                            {formatStockBadge(p.id, p.unitsPerCrate)}
                            {requestedUnits > 0
                              ? ` • Billing: ${requestedUnits}`
                              : ""}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.qtyInputsBox}>
                        <TextInput
                          value={cratesMap[p.id] || ""}
                          onChangeText={(v) =>
                            setCratesMap((prev) => ({
                              ...prev,
                              [p.id]: v.replace(/[^0-9]/g, ""),
                            }))
                          }
                          keyboardType="number-pad"
                          placeholder="Crates"
                          placeholderTextColor="#94A3B8"
                          style={[
                            styles.qtyInput,
                            {
                              backgroundColor: inputBg,
                              color: textPrimary,
                              borderColor: exceedsStock ? "#EF4444" : borderCol,
                            },
                          ]}
                        />
                        <TextInput
                          value={looseMap[p.id] || ""}
                          onChangeText={(v) =>
                            setLooseMap((prev) => ({
                              ...prev,
                              [p.id]: v.replace(/[^0-9]/g, ""),
                            }))
                          }
                          keyboardType="number-pad"
                          placeholder="Loose"
                          placeholderTextColor="#94A3B8"
                          style={[
                            styles.qtyInput,
                            {
                              backgroundColor: inputBg,
                              color: textPrimary,
                              borderColor: exceedsStock ? "#EF4444" : borderCol,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}

                {/* Summary Card */}
                <View
                  style={[
                    styles.summaryBox,
                    { backgroundColor: inputBg, borderColor: borderCol },
                  ]}
                >
                  <Text style={{ fontSize: 12.5, color: textSecondary }}>
                    Previous Running Due: ₹{spotCalculation.prevDue.toFixed(2)}
                  </Text>
                  {isGstBill ? (
                    <>
                      <Text
                        style={{
                          fontSize: 12,
                          color: textSecondary,
                          marginTop: 2,
                        }}
                      >
                        Taxable Base: ₹{spotCalculation.taxableTotal.toFixed(2)}{" "}
                        + Single GST: ₹{spotCalculation.gstTotal.toFixed(2)}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontWeight: "700",
                          color: textPrimary,
                          marginTop: 2,
                        }}
                      >
                        Spot GST Bill Amount (Base + GST): ₹
                        {spotCalculation.enteredTotal.toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{
                        fontSize: 12.5,
                        color: textSecondary,
                        marginTop: 2,
                      }}
                    >
                      Spot Non-GST Bill Amount: ₹
                      {spotCalculation.enteredTotal.toFixed(2)}
                    </Text>
                  )}
                  <Text style={styles.closingDueHighlight}>
                    Projected Closing Due: ₹
                    {spotCalculation.closingDue.toFixed(2)}
                  </Text>
                </View>

                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Paid via UPI (₹)
                </Text>
                <TextInput
                  value={paidUpi}
                  onChangeText={setPaidUpi}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  style={[
                    styles.fullInput,
                    {
                      backgroundColor: inputBg,
                      color: textPrimary,
                      borderColor: borderCol,
                    },
                  ]}
                />

                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Paid via Cash (₹)
                </Text>
                <TextInput
                  value={paidCash}
                  onChangeText={setPaidCash}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  style={[
                    styles.fullInput,
                    {
                      backgroundColor: inputBg,
                      color: textPrimary,
                      borderColor: borderCol,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={handleSpotBillSubmit}
                  disabled={submitting}
                  style={[styles.primaryBtn, submitting && { opacity: 0.7 }]}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      Post Atomic {isGstBill ? "GST" : "Non-GST"} Spot Bill &
                      Deduct Vehicle Stock
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* MODE B: SETTLE INDENT */}
            {billMode === "SETTLE_INDENT" && (
              <>
                {pendingIndents.length === 0 ? (
                  <Text
                    style={{
                      fontSize: 13,
                      color: textSecondary,
                      paddingVertical: 16,
                    }}
                  >
                    No pending INDENTED orders found. Use Spot Delivery Bill to
                    bill directly.
                  </Text>
                ) : (
                  <>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 12 }}
                    >
                      {pendingIndents.map((ord) => {
                        const selected = activeIndentOrder?.id === ord.id;
                        return (
                          <TouchableOpacity
                            key={ord.id}
                            onPress={() => setSelectedOrderId(ord.id)}
                            style={[
                              styles.shopChip,
                              selected
                                ? {
                                    backgroundColor: "#E11D48",
                                    borderColor: "#E11D48",
                                  }
                                : {
                                    backgroundColor: inputBg,
                                    borderColor: borderCol,
                                  },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "800",
                                color: selected ? "#FFFFFF" : textPrimary,
                              }}
                            >
                              {ord.retailerShopName} ({ord.invoiceNumber})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {activeIndentOrder?.items.map((item) => {
                      const prod = products.find(
                        (p) => p.id === item.productId,
                      );
                      const upc = prod?.unitsPerCrate || 24;
                      const availUnits = getAvailableVehicleUnits(
                        item.productId,
                      );
                      return (
                        <View
                          key={item.productId}
                          style={[
                            styles.productRow,
                            { borderBottomColor: borderCol },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[styles.prodName, { color: textPrimary }]}
                            >
                              {item.productName}
                            </Text>
                            <Text
                              style={{ fontSize: 11.5, color: textSecondary }}
                            >
                              Indented: {item.indentedQty} units • Rate: ₹
                              {item.unitPrice.toFixed(2)}
                            </Text>
                            <View
                              style={[
                                styles.stockBadge,
                                availUnits >= item.indentedQty
                                  ? styles.stockBadgeOk
                                  : styles.stockBadgeLow,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stockBadgeText,
                                  availUnits >= item.indentedQty
                                    ? { color: "#047857" }
                                    : { color: "#B91C1C" },
                                ]}
                              >
                                🚚 Vehicle Stock:{" "}
                                {formatStockBadge(item.productId, upc)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      );
                    })}

                    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                      Paid via UPI (₹)
                    </Text>
                    <TextInput
                      value={paidUpi}
                      onChangeText={setPaidUpi}
                      keyboardType="decimal-pad"
                      style={[
                        styles.fullInput,
                        {
                          backgroundColor: inputBg,
                          color: textPrimary,
                          borderColor: borderCol,
                        },
                      ]}
                    />

                    <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                      Paid via Cash (₹)
                    </Text>
                    <TextInput
                      value={paidCash}
                      onChangeText={setPaidCash}
                      keyboardType="decimal-pad"
                      style={[
                        styles.fullInput,
                        {
                          backgroundColor: inputBg,
                          color: textPrimary,
                          borderColor: borderCol,
                        },
                      ]}
                    />

                    <TouchableOpacity
                      onPress={handleSettleIndentSubmit}
                      disabled={submitting}
                      style={[
                        styles.primaryBtn,
                        submitting && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.primaryBtnText}>
                        Convert Indent to {isGstBill ? "GST" : "Non-GST"} Bill &
                        Deduct Stock
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* MODE C: STANDALONE KHATA DUE COLLECTION */}
            {billMode === "COLLECT_DUE" && (
              <>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Paid via UPI (₹)
                </Text>
                <TextInput
                  value={paidUpi}
                  onChangeText={setPaidUpi}
                  keyboardType="decimal-pad"
                  style={[
                    styles.fullInput,
                    {
                      backgroundColor: inputBg,
                      color: textPrimary,
                      borderColor: borderCol,
                    },
                  ]}
                />

                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Paid via Cash (₹)
                </Text>
                <TextInput
                  value={paidCash}
                  onChangeText={setPaidCash}
                  keyboardType="decimal-pad"
                  style={[
                    styles.fullInput,
                    {
                      backgroundColor: inputBg,
                      color: textPrimary,
                      borderColor: borderCol,
                    },
                  ]}
                />

                <TouchableOpacity
                  onPress={() =>
                    activeRetailer &&
                    submitCollectDue({
                      retailerId: activeRetailer.id,
                      paidUpi: parseFloat(paidUpi || "0") || 0,
                      paidCash: parseFloat(paidCash || "0") || 0,
                    })
                  }
                  disabled={submitting}
                  style={[styles.primaryBtn, { backgroundColor: "#059669" }]}
                >
                  <Text style={styles.primaryBtnText}>
                    Record Khata Due Collection
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* TAB 2: B2C HOUSEHOLD MILK DROPS */}
        {activeTab === "DROPS" && (
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <View
              style={[
                styles.gstToggleBox,
                { backgroundColor: inputBg, borderColor: borderCol },
              ]}
            >
              <Text
                style={{ fontSize: 12, fontWeight: "800", color: textPrimary }}
              >
                Customer Drop Billing Mode:
              </Text>
              <View style={{ flexDirection: "row", gap: 6 }}>
                <TouchableOpacity
                  onPress={() => setCustomerDropGst(true)}
                  style={[
                    styles.gstPill,
                    customerDropGst && { backgroundColor: "#4F46E5" },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: customerDropGst ? "#FFFFFF" : textSecondary,
                    }}
                  >
                    GST Drop
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setCustomerDropGst(false)}
                  style={[
                    styles.gstPill,
                    !customerDropGst && { backgroundColor: "#059669" },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: !customerDropGst ? "#FFFFFF" : textSecondary,
                    }}
                  >
                    Non-GST Drop
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {customers.map((c) => {
              const prodId = c.subscribedProductId || "";
              const prod = products.find((p) => p.id === prodId);
              const upc = prod?.unitsPerCrate || 24;
              const availUnits = prodId ? getAvailableVehicleUnits(prodId) : 0;
              const todayStr = new Date().toISOString().slice(0, 10);
              const isSkippedToday = c.skippedDates.includes(todayStr);

              return (
                <View
                  key={c.id}
                  style={[
                    styles.customerDropCard,
                    { backgroundColor: inputBg, borderColor: borderCol },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prodName, { color: textPrimary }]}>
                      {c.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11.5,
                        color: textSecondary,
                        marginTop: 2,
                      }}
                    >
                      {c.subscribedProductName} × {c.dailySubscriptionQty}{" "}
                      pouches/day
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: "#059669",
                        marginTop: 3,
                      }}
                    >
                      Prepaid Wallet: ₹{c.walletBalance.toFixed(2)}
                    </Text>

                    {prodId ? (
                      <View
                        style={[
                          styles.stockBadge,
                          availUnits >= c.dailySubscriptionQty
                            ? styles.stockBadgeOk
                            : styles.stockBadgeLow,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stockBadgeText,
                            availUnits >= c.dailySubscriptionQty
                              ? { color: "#047857" }
                              : { color: "#B91C1C" },
                          ]}
                        >
                          🚚 Your Vehicle Stock: {formatStockBadge(prodId, upc)}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    disabled={submitting || isSkippedToday}
                    onPress={() =>
                      submitCustomerDrop({
                        customerId: c.id,
                        deliveredQty: c.dailySubscriptionQty,
                        isGstBill: customerDropGst,
                      })
                    }
                    style={[
                      styles.confirmDropBtn,
                      isSkippedToday && { backgroundColor: "#94A3B8" },
                    ]}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 12,
                        fontWeight: "800",
                      }}
                    >
                      {isSkippedToday ? "Skipped Today" : "Confirm Drop"}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 3: NEXT-DAY INDENT */}
        {activeTab === "INDENT" && (
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Punch Next-Day Retailer Indent ({indentDate})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
            >
              {retailers.map((r) => {
                const selected = activeRetailer?.id === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => setSelectedRetailerId(r.id)}
                    style={[
                      styles.shopChip,
                      selected
                        ? { backgroundColor: "#4F46E5", borderColor: "#4F46E5" }
                        : { backgroundColor: inputBg, borderColor: borderCol },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "800",
                        color: selected ? "#FFFFFF" : textPrimary,
                      }}
                    >
                      {r.shopName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {products.map((p) => (
              <View
                key={p.id}
                style={[styles.productRow, { borderBottomColor: borderCol }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.prodName, { color: textPrimary }]}>
                    {p.name}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: textSecondary }}>
                    ₹{p.retailerPrice.toFixed(2)}/{p.unitType} •{" "}
                    {p.unitsPerCrate}/crate
                  </Text>
                </View>
                <View style={styles.qtyInputsBox}>
                  <TextInput
                    value={cratesMap[p.id] || ""}
                    onChangeText={(v) =>
                      setCratesMap((prev) => ({
                        ...prev,
                        [p.id]: v.replace(/[^0-9]/g, ""),
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="Crates"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.qtyInput,
                      {
                        backgroundColor: inputBg,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                  <TextInput
                    value={looseMap[p.id] || ""}
                    onChangeText={(v) =>
                      setLooseMap((prev) => ({
                        ...prev,
                        [p.id]: v.replace(/[^0-9]/g, ""),
                      }))
                    }
                    keyboardType="number-pad"
                    placeholder="Loose"
                    placeholderTextColor="#94A3B8"
                    style={[
                      styles.qtyInput,
                      {
                        backgroundColor: inputBg,
                        color: textPrimary,
                        borderColor: borderCol,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={handleCreateIndentSubmit}
              disabled={submitting}
              style={[
                styles.primaryBtn,
                { backgroundColor: "#4F46E5", marginTop: 14 },
              ]}
            >
              <Text style={styles.primaryBtnText}>Save Next-Day Indent</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 4: LIVE DSE VEHICLE STOCK SUMMARY */}
        {activeTab === "BEAT" && (
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              🚚 My Allocated Live Vehicle Stock
            </Text>
            <Text
              style={{ fontSize: 12, color: textSecondary, marginBottom: 12 }}
            >
              Allocated by Admin from Main Amul Godown. Automatically deducts as
              you bill retailers or confirm customer milk drops.
            </Text>

            {products.map((p) => {
              const avail = getAvailableVehicleUnits(p.id);
              return (
                <View
                  key={p.id}
                  style={[styles.productRow, { borderBottomColor: borderCol }]}
                >
                  <View>
                    <Text style={[styles.prodName, { color: textPrimary }]}>
                      {p.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: textSecondary }}>
                      {p.skuCode} • {p.unitsPerCrate} {p.unitType}/crate
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.stockBadge,
                      avail > 0 ? styles.stockBadgeOk : styles.stockBadgeLow,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        avail > 0 ? { color: "#047857" } : { color: "#B91C1C" },
                      ]}
                    >
                      {formatStockBadge(p.id, p.unitsPerCrate)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* TAB 5: ONBOARD RETAILER OR CUSTOMER */}
        {activeTab === "ONBOARD" && (
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: borderCol },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: textPrimary }]}>
              Onboard New Field Party
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {(["RETAILER", "CUSTOMER"] as const).map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setOnboardRole(r)}
                  style={[
                    styles.subModeBtn,
                    onboardRole === r
                      ? { backgroundColor: "#E11D48" }
                      : { backgroundColor: inputBg },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: onboardRole === r ? "#FFFFFF" : textSecondary,
                    }}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: textPrimary }]}>
              Full Name
            </Text>
            <TextInput
              value={partyName}
              onChangeText={setPartyName}
              placeholder="Owner or Customer Name"
              placeholderTextColor="#94A3B8"
              style={[
                styles.fullInput,
                {
                  backgroundColor: inputBg,
                  color: textPrimary,
                  borderColor: borderCol,
                },
              ]}
            />

            {onboardRole === "RETAILER" && (
              <>
                <Text style={[styles.fieldLabel, { color: textPrimary }]}>
                  Shop Name
                </Text>
                <TextInput
                  value={partyShop}
                  onChangeText={setPartyShop}
                  placeholder="Retailer Shop Name"
                  placeholderTextColor="#94A3B8"
                  style={[
                    styles.fullInput,
                    {
                      backgroundColor: inputBg,
                      color: textPrimary,
                      borderColor: borderCol,
                    },
                  ]}
                />
              </>
            )}

            <Text style={[styles.fieldLabel, { color: textPrimary }]}>
              10-Digit Mobile Number
            </Text>
            <TextInput
              value={partyPhone}
              onChangeText={(v) =>
                setPartyPhone(v.replace(/[^0-9]/g, "").slice(0, 10))
              }
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="9830011223"
              placeholderTextColor="#94A3B8"
              style={[
                styles.fullInput,
                {
                  backgroundColor: inputBg,
                  color: textPrimary,
                  borderColor: borderCol,
                },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: textPrimary }]}>
              Address / Beat
            </Text>
            <TextInput
              value={partyAddress}
              onChangeText={setPartyAddress}
              placeholder="Howrah Beat Address"
              placeholderTextColor="#94A3B8"
              style={[
                styles.fullInput,
                {
                  backgroundColor: inputBg,
                  color: textPrimary,
                  borderColor: borderCol,
                },
              ]}
            />

            <TouchableOpacity
              onPress={async () => {
                const ok = await submitOnboardParty({
                  role: onboardRole,
                  name: partyName,
                  shopName: partyShop,
                  phone: partyPhone,
                  address: partyAddress,
                  subscribedProductId: subProductId || products[0]?.id,
                  dailySubscriptionQty: parseInt(subDailyQty || "2", 10) || 2,
                });
                if (ok) {
                  setPartyName("");
                  setPartyShop("");
                  setPartyPhone("");
                  setPartyAddress("");
                }
              }}
              disabled={submitting}
              style={[styles.primaryBtn, { marginTop: 14 }]}
            >
              <Text style={styles.primaryBtnText}>
                Create {onboardRole} Account
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Extra buffer so user can scroll far above the keyboard */}
        <View style={styles.bottomSpacer} />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboardScroll: {
    flex: 1,
  },
  tabsWrapper: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tabsScroll: {
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: "#E11D48",
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  scrollBody: {
    padding: 14,
    paddingBottom: 20,
  },
  bottomSpacer: {
    height: Platform.OS === "ios" ? 340 : 260,
  },
  card: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  subModeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
  },
  subModeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  gstToggleBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  gstPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 10,
  },
  shopChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  prodName: {
    fontSize: 14,
    fontWeight: "800",
  },
  stockBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 5,
    borderWidth: 1,
  },
  stockBadgeOk: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  stockBadgeLow: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  stockBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
  },
  qtyInputsBox: {
    flexDirection: "row",
    gap: 6,
  },
  qtyInput: {
    width: 68,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
  },
  summaryBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 10,
  },
  closingDueHighlight: {
    fontSize: 14,
    fontWeight: "900",
    color: "#E11D48",
    marginTop: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 6,
  },
  fullInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: "#E11D48",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
  },
  customerDropCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  confirmDropBtn: {
    backgroundColor: "#059669",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
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
