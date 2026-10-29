import { Alert, Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

/**
 * Generates and opens/shares a PDF receipt or statement.
 * On Android in Expo Go, `Print.printAsync({ html })` opens the native system Print & Save-as-PDF
 * dialog directly, avoiding Android FileProvider permission errors (`Not allowed to read file under given URL`).
 */
export async function exportAndShareHtmlPdf(
  html: string,
  title = "Amul_Document",
): Promise<void> {
  try {
    // Primary path on Web & Android/iOS: open native system Print / Save-as-PDF preview sheet
    await Print.printAsync({ html });
  } catch (primaryErr) {
    // Fallback: try writing to file and sharing if print dialog was dismissed or unavailable
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare && Platform.OS === "ios") {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: title,
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("PDF Ready", `Document generated: ${title}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (
        msg.toLowerCase().includes("cancel") ||
        msg.toLowerCase().includes("dismiss")
      ) {
        return;
      }
      Alert.alert(
        "PDF Export Notice",
        "Use the system Print / Save as PDF option to save this statement to your phone.",
      );
    }
  }
}

export async function generateAndSharePdf(options: {
  title: string;
  subtitle: string;
  summaryRows: Array<[string, string]>;
  tableHeaders?: string[];
  tableRows?: string[][];
}): Promise<void> {
  const summaryHtml = options.summaryRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600;">${label}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: monospace; font-weight: 700; color: #0f172a;">${value}</td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8" /><title>${options.title}</title></head>
      <body style="font-family: sans-serif; padding: 24px; color: #0f172a;">
        <h2>${options.title}</h2>
        <p>${options.subtitle}</p>
        <table style="width: 100%; border-collapse: collapse;"><tbody>${summaryHtml}</tbody></table>
      </body>
    </html>
  `;
  await exportAndShareHtmlPdf(html, options.title);
}
