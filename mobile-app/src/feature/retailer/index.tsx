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
    const shopPhone = user?.phone || "-";
    const shopAddress =
      (user as any)?.address ||
      (passbook as any)?.address ||
      "Purba Medinipur, West Bengal";

    // Calculate debit / credit totals for the passbook header metrics
    let totalDebit = 0;
    let totalCredit = 0;

    ledger.forEach((l) => {
      const isDebit =
        l.entryType === "INVOICE_DEBIT" ||
        l.entryType.toLowerCase().includes("debit");
      if (isDebit) {
        totalDebit += l.amount;
      } else {
        totalCredit += l.amount;
      }
    });

    const rowsHtml =
      ledger.length === 0
        ? `
        <tr>
          <td colspan="6" style="padding: 24px; text-align: center; color: #94A3B8; font-size: 13px;">
            No transactions found in this period.
          </td>
        </tr>
      `
        : ledger
            .map((l, index) => {
              const isDebit =
                l.entryType === "INVOICE_DEBIT" ||
                l.entryType.toLowerCase().includes("debit");
              const entryBadgeColor = isDebit ? "#E11D48" : "#059669";
              const entryBadgeBg = isDebit ? "#FFE4E6" : "#DCFCE7";
              const rowBg = index % 2 === 1 ? "background-color: #F8FAFC;" : "";

              return `
            <tr style="border-bottom: 1px solid #E2E8F0; ${rowBg}">
              <td style="padding: 10px 12px; color: #334155; font-weight: 600; white-space: nowrap;">
                ${l.createdAt.slice(0, 10)}
              </td>
              <td style="padding: 10px 12px;">
                <span style="background: ${entryBadgeBg}; color: ${entryBadgeColor}; font-size: 10.5px; font-weight: 800; padding: 3px 8px; border-radius: 6px; letter-spacing: 0.4px;">
                  ${l.entryType}
                </span>
              </td>
              <td style="padding: 10px 12px; font-family: monospace; font-size: 11.5px; color: #475569; font-weight: 700;">
                ${l.referenceId || "—"}
              </td>
              <td style="padding: 10px 12px; color: #1E293B; font-size: 12px;">
                ${l.notes || "Khata transaction"}
              </td>
              <td style="padding: 10px 12px; text-align: right; color: ${isDebit ? "#E11D48" : "#94A3B8"}; font-weight: ${isDebit ? "800" : "500"}; font-family: monospace; font-size: 12.5px;">
                ${isDebit ? `+ ₹${l.amount.toFixed(2)}` : "—"}
              </td>
              <td style="padding: 10px 12px; text-align: right; color: ${!isDebit ? "#059669" : "#94A3B8"}; font-weight: ${!isDebit ? "800" : "500"}; font-family: monospace; font-size: 12.5px;">
                ${!isDebit ? `− ₹${l.amount.toFixed(2)}` : "—"}
              </td>
            </tr>`;
            })
            .join("");

    const currentDateStr = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Khata Passbook - ${shopTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm;
            }
            * {
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              color: #0F172A;
              background-color: #FFFFFF;
              margin: 0;
              padding: 0;
              font-size: 12.5px;
              line-height: 1.5;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2.5px solid #003399;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }
            .brand-title {
              font-size: 26px;
              font-weight: 900;
              color: #003399;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .brand-subtitle {
              font-size: 11px;
              font-weight: 800;
              color: #E11D48;
              text-transform: uppercase;
              letter-spacing: 1.2px;
              margin-top: 3px;
            }
            .doc-tag {
              background: #F1F5F9;
              border: 1px solid #CBD5E1;
              border-radius: 8px;
              padding: 8px 14px;
              text-align: right;
            }
            .doc-type {
              font-size: 11px;
              font-weight: 800;
              color: #003399;
              text-transform: uppercase;
              letter-spacing: 0.6px;
            }
            .doc-date {
              font-size: 11px;
              color: #64748B;
              margin-top: 3px;
              font-weight: 600;
            }
            .address-container {
              display: flex;
              justify-content: space-between;
              gap: 16px;
              margin-bottom: 18px;
            }
            .address-box {
              flex: 1;
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 11px 14px;
            }
            .address-header {
              font-size: 10.5px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #003399;
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 5px;
              margin-bottom: 6px;
            }
            .address-title {
              font-size: 13px;
              font-weight: 800;
              color: #0F172A;
              margin-bottom: 3px;
            }
            .address-detail {
              font-size: 11px;
              color: #475569;
              line-height: 1.45;
            }
            .metrics-grid {
              display: flex;
              gap: 12px;
              margin-bottom: 20px;
            }
            .metric-card {
              flex: 1;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 10px 14px;
              background: #F8FAFC;
            }
            .metric-card.due {
              background: #FFF1F2;
              border-color: #FECDD3;
            }
            .metric-label {
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748B;
            }
            .metric-card.due .metric-label {
              color: #9F1239;
            }
            .metric-value {
              font-size: 18px;
              font-weight: 900;
              color: #0F172A;
              margin-top: 3px;
            }
            .metric-card.due .metric-value {
              color: #E11D48;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border-radius: 8px;
              overflow: hidden;
            }
            th {
              background: #003399;
              color: #FFFFFF;
              font-size: 10.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              padding: 9px 12px;
            }
            .footer-note {
              margin-top: 26px;
              padding-top: 12px;
              border-top: 1px solid #E2E8F0;
              font-size: 10.5px;
              color: #94A3B8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <!-- Top Header -->
          <div class="header-bar">
            <div>
              <h1 class="brand-title">AMUL</h1>
              <div class="brand-subtitle">The Taste of India • Wholesale Khata Passbook</div>
            </div>
            <div class="doc-tag">
              <div class="doc-type">Retailer Statement</div>
              <div class="doc-date">Generated: ${currentDateStr}</div>
            </div>
          </div>

          <!-- Biller & Retailer Information -->
          <div class="address-container">
            <div class="address-box">
              <div class="address-header">Distributor (Biller)</div>
              <div class="address-title">CHAKRABORTY TELECOM</div>
              <div class="address-detail">
                Vendor Code: 1027430<br/>
                PO-HAUR, PURUL, HAUR, Vill-PURUL<br/>
                HAUR - 721131, PURBA MEDINIPUR, WB<br/>
                <strong>PAN:</strong> BTKPC8759G | <strong>GSTIN:</strong> 19BTKPC8759G1Z6
              </div>
            </div>

            <div class="address-box">
              <div class="address-header">Account Holder (Customer)</div>
              <div class="address-title">${shopTitle}</div>
              <div class="address-detail">
                <strong>Phone:</strong> ${shopPhone}<br/>
                <strong>Address:</strong> ${shopAddress}<br/>
                <strong>Account Type:</strong> Running B2B Khata Account<br/>
                <strong>State:</strong> West Bengal [19]
              </div>
            </div>
          </div>

          <!-- Quick Balance Overview Bar -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-label">Total Bills (Debits)</div>
              <div class="metric-value" style="color: #E11D48;">+ ₹${totalDebit.toFixed(2)}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Total Payments (Credits)</div>
              <div class="metric-value" style="color: #059669;">− ₹${totalCredit.toFixed(2)}</div>
            </div>
            <div class="metric-card due">
              <div class="metric-label">Current Running Due</div>
              <div class="metric-value">₹${currentDue.toFixed(2)}</div>
            </div>
          </div>

          <!-- Ledger Table -->
          <table>
            <thead>
              <tr>
                <th style="text-align: left; width: 85px;">Date</th>
                <th style="text-align: left; width: 120px;">Type</th>
                <th style="text-align: left; width: 100px;">Reference</th>
                <th style="text-align: left;">Particulars / Notes</th>
                <th style="text-align: right; width: 100px;">Debit (+)</th>
                <th style="text-align: right; width: 100px;">Credit (−)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-note">
            This is an official system-generated running statement of accounts. For any discrepancy, contact Chakraborty Telecom.
          </div>
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
    const customerName =
      passbook?.shopName || user?.shopName || user?.name || "Retailer Shop";
    const customerPhone = user?.phone || "-";
    const customerAddress =
      (user as any)?.address ||
      (passbook as any)?.address ||
      "Purba Medinipur, West Bengal";

    const itemsHtml = order.items
      .map(
        (i, index) => `
        <tr style="border-bottom: 1px solid #E2E8F0; ${index % 2 === 1 ? "background-color: #F8FAFC;" : ""}">
          <td style="padding: 10px 12px; font-weight: 600; color: #1E293B;">${i.productName}</td>
          <td style="padding: 10px 12px; text-align: center; color: #334155; font-weight: 600;">${i.deliveredQty || i.indentedQty}</td>
          <td style="padding: 10px 12px; text-align: right; color: #334155;">₹${i.unitPrice.toFixed(2)}</td>
          <td style="padding: 10px 12px; text-align: right; color: #64748B;">${order.isGstBill ? `${i.gstPercentage}%` : "0%"}</td>
          <td style="padding: 10px 12px; text-align: right; font-weight: 800; color: #0F172A;">₹${i.lineTotal.toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const totalPaid = (order.paidUpi || 0) + (order.paidCash || 0);

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>${order.invoiceNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 16mm;
            }
            * {
              box-sizing: border-box;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            body {
              color: #0F172A;
              background-color: #FFFFFF;
              margin: 0;
              padding: 0;
              font-size: 13px;
              line-height: 1.5;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2.5px solid #003399;
              padding-bottom: 16px;
              margin-bottom: 20px;
            }
            .brand-title {
              font-size: 26px;
              font-weight: 900;
              color: #003399;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .brand-subtitle {
              font-size: 11px;
              font-weight: 700;
              color: #E11D48;
              text-transform: uppercase;
              letter-spacing: 1.2px;
              margin-top: 3px;
            }
            .invoice-tag {
              background: #F1F5F9;
              border: 1px solid #CBD5E1;
              border-radius: 8px;
              padding: 8px 14px;
              text-align: right;
            }
            .invoice-type {
              font-size: 11px;
              font-weight: 800;
              color: ${order.isGstBill ? "#003399" : "#475569"};
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .invoice-number {
              font-size: 16px;
              font-weight: 900;
              color: #0F172A;
              margin-top: 2px;
            }
            .invoice-date {
              font-size: 11px;
              color: #64748B;
              margin-top: 2px;
            }
            .address-container {
              display: flex;
              justify-content: space-between;
              gap: 20px;
              margin-bottom: 22px;
            }
            .address-box {
              flex: 1;
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 12px 14px;
            }
            .address-header {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.8px;
              color: #003399;
              border-bottom: 1px solid #E2E8F0;
              padding-bottom: 6px;
              margin-bottom: 6px;
            }
            .address-title {
              font-size: 13.5px;
              font-weight: 800;
              color: #0F172A;
              margin-bottom: 4px;
            }
            .address-detail {
              font-size: 11.5px;
              color: #475569;
              line-height: 1.45;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              border-radius: 8px;
              overflow: hidden;
            }
            th {
              background: #003399;
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              padding: 10px 12px;
            }
            .summary-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-top: 20px;
              gap: 20px;
            }
            .payment-box {
              flex: 1;
              background: #F8FAFC;
              border: 1px dashed #CBD5E1;
              border-radius: 10px;
              padding: 12px 14px;
            }
            .totals-box {
              width: 320px;
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 10px;
              padding: 12px 16px;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 12px;
              color: #475569;
            }
            .summary-line.bold {
              font-weight: 700;
              color: #0F172A;
            }
            .summary-line.highlight {
              border-top: 1.5px dashed #CBD5E1;
              margin-top: 6px;
              padding-top: 8px;
              font-size: 14px;
              font-weight: 900;
              color: #003399;
            }
            .closing-due-box {
              background: #FFF1F2;
              border: 1.5px solid #FECDD3;
              border-radius: 8px;
              padding: 8px 12px;
              margin-top: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .closing-due-label {
              font-size: 12px;
              font-weight: 800;
              color: #9F1239;
            }
            .closing-due-value {
              font-size: 16px;
              font-weight: 900;
              color: #E11D48;
            }
            .footer-note {
              margin-top: 30px;
              padding-top: 14px;
              border-top: 1px solid #E2E8F0;
              font-size: 10.5px;
              color: #94A3B8;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <!-- Top Header -->
          <div class="header-bar">
            <div>
              <h1 class="brand-title">AMUL</h1>
              <div class="brand-subtitle">The Taste of India • Wholesale Distribution</div>
            </div>
            <div class="invoice-tag">
              <div class="invoice-type">${order.isGstBill ? "TAX INVOICE (GST INCL.)" : "BILL OF SUPPLY"}</div>
              <div class="invoice-number">${order.invoiceNumber}</div>
              <div class="invoice-date">Date: ${order.deliveryDate}</div>
            </div>
          </div>

          <!-- Biller and Customer Info -->
          <div class="address-container">
            <!-- Biller Info (Extracted from document) -->
            <div class="address-box">
              <div class="address-header">Billed By (Supplier)</div>
              <div class="address-title">CHAKRABORTY TELECOM</div>
              <div class="address-detail">
                Vendor Code: 1027430<br/>
                PO-HAUR, PURUL, HAUR, Vill-PURUL<br/>
                HAUR - 721131, PURBA MEDINIPUR<br/>
                WEST BENGAL [State Code: 19]<br/>
                <strong>PAN:</strong> BTKPC8759G<br/>
                <strong>GSTIN:</strong> 19BTKPC8759G1Z6
              </div>
            </div>

            <!-- Customer Billing Address -->
            <div class="address-box">
              <div class="address-header">Billed To (Customer)</div>
              <div class="address-title">${customerName}</div>
              <div class="address-detail">
                <strong>Contact:</strong> ${customerPhone}<br/>
                <strong>Address:</strong> ${customerAddress}<br/>
                <strong>State:</strong> West Bengal [19]<br/>
                <strong>Account Type:</strong> B2B Retailer Khata
              </div>
            </div>
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Product Description</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 85px;">Rate</th>
                <th style="text-align: right; width: 60px;">GST</th>
                <th style="text-align: right; width: 95px;">Total (INR)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Financial Summary -->
          <div class="summary-section">
            <!-- Payment breakdown notes -->
            <div class="payment-box">
              <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px;">Payment Breakdown</div>
              <div class="summary-line"><span>UPI Settlement:</span> <strong>₹${order.paidUpi.toFixed(2)}</strong></div>
              <div class="summary-line"><span>Cash Received:</span> <strong>₹${order.paidCash.toFixed(2)}</strong></div>
              <div class="summary-line bold"><span>Total Paid Today:</span> <span style="color: #059669;">₹${totalPaid.toFixed(2)}</span></div>
              <div style="margin-top: 10px; font-size: 10.5px; color: #64748B;">
                * All Khata adjustments reflect automatically in the Retailer Passbook.
              </div>
            </div>

            <!-- Calculation Totals -->
            <div class="totals-box">
              <div class="summary-line">
                <span>Previous Khata Due:</span>
                <span>₹${order.previousDueSnapshot.toFixed(2)}</span>
              </div>
              ${
                order.isGstBill
                  ? `
                  <div class="summary-line">
                    <span>Taxable Value:</span>
                    <span>₹${order.taxableSubtotal.toFixed(2)}</span>
                  </div>
                  <div class="summary-line">
                    <span>GST Output:</span>
                    <span>₹${order.gstAmount.toFixed(2)}</span>
                  </div>
                  `
                  : ""
              }
              <div class="summary-line bold">
                <span>Today's Bill Subtotal:</span>
                <span>₹${order.subtotal.toFixed(2)}</span>
              </div>
              <div class="summary-line highlight">
                <span>Total Amount Payable:</span>
                <span>₹${order.totalPayable.toFixed(2)}</span>
              </div>
              <div class="summary-line" style="color: #059669;">
                <span>Total Paid Today:</span>
                <span>− ₹${totalPaid.toFixed(2)}</span>
              </div>

              <!-- Closing Due Pill -->
              <div class="closing-due-box">
                <span class="closing-due-label">Closing Khata Due:</span>
                <span class="closing-due-value">₹${order.closingDue.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Bottom Footer -->
          <div class="footer-note">
            This is a computer-generated invoice and requires no physical signature. Thank you for your business!
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
            {/* <Text style={styles.heroFormula}>
              Formula: Previous Due + Today&apos;s Bill − (UPI + Cash Paid)
            </Text> */}
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
