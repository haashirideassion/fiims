import { utils, writeFile } from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export function useExport() {
  function exportExcel(
    data: Record<string, unknown>[],
    filename: string,
    sheetName = "Sheet1"
  ) {
    const ws = utils.json_to_sheet(data)
    const wb = utils.book_new()
    utils.book_append_sheet(wb, ws, sheetName)
    writeFile(wb, `${filename}.xlsx`)
  }

  function exportCSV(data: Record<string, unknown>[], filename: string) {
    const ws = utils.json_to_sheet(data)
    const csv = utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${filename}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPDF(
    columns: string[],
    rows: (string | number)[][],
    filename: string,
    title?: string
  ) {
    const doc = new jsPDF()
    if (title) {
      doc.setFontSize(14)
      doc.text(title, 14, 16)
    }
    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: title ? 22 : 14,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [51, 92, 255] },
    })
    doc.save(`${filename}.pdf`)
  }

  return { exportExcel, exportCSV, exportPDF }
}
